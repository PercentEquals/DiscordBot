import { ApplicationCommandType, AttachmentBuilder, Client, CommandInteraction, SlashCommandBooleanOption, SlashCommandStringOption } from "discord.js";
import { Command } from "../command";

import { DISCORD_LIMIT } from "../constants/discordlimit";
import { MAX_RETRIES, RETRY_TIMEOUT } from "../constants/maxretries";
import { TIKTOK_COMMENTS_COUNT, TIKTOK_COMMENTS_MAX_COUNT, TIKTOK_COMMENTS_OFFSET } from "../constants/tiktokcommentscount";

import { TiktokApi, Image, ItemModuleChildren } from "types/tiktokApi";
import { TikTokSigner } from "types/tiktokSigner";
import { TiktokCommentsApi } from "types/tiktokCommentsApi";

import { validateUrl } from "../common/validateUrl";
import { getBestFormat } from "../common/formatFinder";
import { getImageDataFromTiktokApi, getSigiState, getTiktokIdFromTiktokApi, getTitleFromTiktokApi } from "../common/sigiState";

import getConfig from "../setup/configSetup";
import logger from "../logger";

//@ts-ignore - tiktok-signature types not available (https://github.com/carcabot/tiktok-signature)
import Signer from "tiktok-signature";

import ffmpeg from "fluent-ffmpeg";
import youtubedl, { YtResponse } from "youtube-dl-exec";
import fs from "fs";

async function convertVideo(initialPath: string, id: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const finalPath = `cache/${id}-ffmpeg.mp4`;
            const targetCrf = Math.ceil(fs.statSync(initialPath).size / DISCORD_LIMIT * 36);

            logger.info(`[ffmpeg] converting: CRF = ${targetCrf}`);

            const process = ffmpeg(initialPath);
            process.output(finalPath);
            process.addOption(["-preset", "veryfast"]);
            process.addOption(["-crf", targetCrf.toFixed(0).toString()]);

            process.on('end', (done: any) => {
                if (fs.existsSync(initialPath)) {
                    fs.unlinkSync(initialPath);
                }
                logger.info('[ffmpeg] conversion done');
                resolve(finalPath);
            });

            process.on('error', (err: any) => {
                if (fs.existsSync(initialPath)) {
                    fs.unlinkSync(initialPath);
                }
                logger.info('[ffmpeg] error', err);
                reject(err);
            });

            process.run();
        } catch (e) {
            reject(e);
        }
    })
}

async function downloadAndConvertVideo(
    interaction: CommandInteraction,
    url: string,
    spoiler: boolean,
    audioOnly: boolean,
    title: string
) {
    const id = validateUrl(new URL(url));
    let filePath = `cache/${id}.mp4`;

    await youtubedl(url, {
        noWarnings: true,
        output: filePath,
    });

    if (!fs.existsSync(filePath)) {
        throw new Error(`No format found under ${DISCORD_LIMIT / 1024 / 1024}MB`);
    }

    if (!getConfig().botOptions.allowCompressionOfLargeFiles) {
        throw new Error(`No format found under ${DISCORD_LIMIT / 1024 / 1024}MB`);
    }

    filePath = await convertVideo(filePath, id);
    const file = new AttachmentBuilder(filePath);

    if (fs.statSync(filePath).size > DISCORD_LIMIT) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw new Error(`No format found under ${DISCORD_LIMIT / 1024 / 1024}MB`);
    }

    file.setName(`${title}.${audioOnly ? 'mp3' : 'mp4'}`);
    file.setSpoiler(spoiler);

    logger.info('[bot] sending converted video');

    try {
        await interaction.followUp({
            ephemeral: false,
            files: [file]
        });
    } catch (e) {
        logger.error(e);

        // Sometimes discord fails to send the video, so we try again
        await interaction.followUp({
            ephemeral: false,
            files: [file]
        });
    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

async function downloadVideo(
    interaction: CommandInteraction,
    url: string,
    spoiler: boolean,
    audioOnly: boolean,
    retry = 0
) {
    let videoData = null;

    try {
        videoData = await youtubedl(url, {
            dumpSingleJson: true,
            getFormat: true,
            noWarnings: true,
        });
    } catch (e) {
        if (retry >= MAX_RETRIES) {
            logger.error(`[youtube-dl]: ${e}.`);
            throw e;
        }

        logger.info(`[bot] retrying video download... (${retry} / ${MAX_RETRIES})`);

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    resolve(downloadVideo(interaction, url, spoiler, audioOnly, retry + 1));
                } catch (e) {
                    reject(e);
                }
            }, RETRY_TIMEOUT);
        });
    }

    //@ts-ignore - youtube-dl-exec videoData contains useless first line
    videoData = videoData.split('\n').slice(1).join('\n');
    videoData = JSON.parse(videoData as any) as YtResponse;

    let bestFormat = getBestFormat(url, videoData, audioOnly);

    if (!bestFormat || bestFormat.filesize > DISCORD_LIMIT) {
        return downloadAndConvertVideo(interaction, url, spoiler, audioOnly, videoData.title);
    }

    const file = new AttachmentBuilder(bestFormat.url);
    file.setName(`${videoData.title}.${audioOnly ? 'mp3' : 'mp4'}`);
    file.setSpoiler(spoiler);

    logger.info('[bot] sending video');

    try {
        await interaction.followUp({
            ephemeral: false,
            files: [file]
        });
    } catch (e) {
        logger.error(e);

        // Sometimes discord fails to send the video, so we try again
        await interaction.followUp({
            ephemeral: false,
            files: [file]
        });
    }
}

async function downloadSlideshow(
    interaction: CommandInteraction,
    imagesData: Image[],
    imagesName: string,
    spoiler: boolean,
    ranges: number[] = []
) {
    const files = [] as AttachmentBuilder[];

    imagesData.forEach((image, i: number) => {
        if (ranges.length > 0 && !ranges.includes(i + 1)) {
            return;
        }

        const file = new AttachmentBuilder(image.imageURL.urlList[0]);
        file.setName(`${imagesName}-${i}.jpg`);
        file.setSpoiler(spoiler);

        files.push(file);
    });

    logger.info('[bot] sending slideshow');

    while (files.length > 10) {
        await interaction.followUp({
            ephemeral: false,
            files: files.splice(0, 10)
        });
    }

    await interaction.followUp({
        ephemeral: false,
        files
    });
}

async function getCommentsFromTiktok(
    interaction: CommandInteraction,
    sigi_state: TiktokApi,
    range: number[]
) {
    const id = getTiktokIdFromTiktokApi(sigi_state);
    const itemModuleChildren = (sigi_state.ItemModule?.[id] as ItemModuleChildren);
    const playUrl = new URL(itemModuleChildren.music.playUrl);

    const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36 Edg/105.0.1343.53";
    const MSTOKEN = "G1lr_8nRB3udnK_fFzgBD7sxvc0PK6Osokd1IJMaVPVcoB4mwSW-D6MQjTdoJ2o20PLt_MWNgtsAr095wVSShdmn_XVFS34bURvakVglDyWAHncoV_jVJCRdiJRdbJBi_E_KD_G8vpFF9-aOaJrk";

    const queryParams = {
        aweme_id: id,
        cursor: TIKTOK_COMMENTS_OFFSET,
        count: TIKTOK_COMMENTS_COUNT,
        msToken: MSTOKEN,
        aid: playUrl.searchParams.get('a') ?? '1988',
        app_language: 'ja-JP',
        app_name: 'tiktok_web',
        battery_info: 1,
        browser_language: 'en-US',
        browser_name: 'Mozilla',
        browser_online: true,
        browser_platform: 'Win32',
        browser_version: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.63',
        channel: 'tiktok_web',
        cookie_enabled: true,
        current_region: 'JP',
        device_id: '7165118680723998214',
        device_platform: 'web_pc',
        from_page: 'video',
        os: 'windows',
        priority_region: 'US',
        referer: '',
        region: 'US',
        screen_height: 1440,
        screen_width: 2560,
        webcast_language: 'en',
    } as any;

    if (range.length > 1) {
        queryParams.cursor = Math.min(...range);
        queryParams.count = Math.max(...range) - queryParams.cursor;

        if (queryParams.count >= TIKTOK_COMMENTS_MAX_COUNT) {
            queryParams.count = TIKTOK_COMMENTS_MAX_COUNT;
        }
    }

    const url = new URL('https://www.tiktok.com/api/comment/list/?' + (new URLSearchParams(queryParams)).toString());

    const signer = new Signer(null, USER_AGENT);
    await signer.init();
    const signature = await signer.sign(url.toString()) as TikTokSigner.signature;
    const navigator = await signer.navigator() as TikTokSigner.navigator;
    await signer.close();

    const request = await fetch(
        signature.signed_url,
        {
            headers: {
                'user-agent': navigator.user_agent,
                'referer': sigi_state.SEOState.canonical
            }
        }
    );

    const commentsData: TiktokCommentsApi = await request.json();

    const commentsResponse = commentsData.comments.map((comment) => {
        // Filter out @ mentions
        if (comment.text.startsWith('@')) {
            return null;
        }

        // Filter out empty comments
        if (comment.text.length <= 1) {
            return null;
        }

        comment.text.replace(/\n/g, '\n> ');

        return '***' + comment.user.nickname + '***: \n> ' + comment.text;
    }).filter((comment) => comment !== null) as string[];

    logger.info('[bot] sending comments');

    while (commentsResponse.length > 10) {
        await interaction.followUp({
            ephemeral: false,
            content: commentsResponse.splice(0, 10).join('\n')
        });
    }

    await interaction.followUp({
        ephemeral: false,
        content: commentsResponse.join('\n')
    });
}

function getRange(range: string | null) {
    if (!range) return [];

    const ranges = range.split(',');
    const rangeArray = [] as number[];

    ranges.forEach((range) => {
        range = range.trim();

        if (range.includes('-')) {
            const [start, end] = range.split('-');
            for (let i = parseInt(start); i <= parseInt(end); i++) {
                rangeArray.push(i);
            }
        } else {
            rangeArray.push(parseInt(range));
        }
    });

    return rangeArray;
}

export const Tiktok: Command = {
    name: "tiktok",
    description: "Send video/slideshow via url",
    type: ApplicationCommandType.ChatInput,
    options: [
        new SlashCommandStringOption().setName('url').setDescription('Tiktok link').setRequired(true),
        new SlashCommandBooleanOption().setName('spoiler').setDescription('Should hide as spoiler?').setRequired(false),
        new SlashCommandBooleanOption().setName('audio').setDescription('Should only download audio?').setRequired(false),
        new SlashCommandBooleanOption().setName('comments').setDescription('Should only send comments?').setRequired(false),
        new SlashCommandStringOption().setName('range').setDescription('Range of photos/comments').setRequired(false),
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            //@ts-ignore
            const url: string = interaction.options.getString('url', true);
            //@ts-ignore
            const spoiler = interaction.options.getBoolean('spoiler', false);
            //@ts-ignore
            const audioOnly = interaction.options.getBoolean('audio', false);
            //@ts-ignore
            const commentsOnly = interaction.options.getBoolean('comments', false);
            //@ts-ignore
            const range = interaction.options.getString('range', false);

            const urlObj = new URL(url);
            const sigi_state = await getSigiState(url);

            if (commentsOnly) {
                if (!urlObj.hostname.includes('tiktok')) {
                    throw new Error('Comments only option is available only for tiktok links.');
                }

                await getCommentsFromTiktok(interaction, sigi_state, getRange(range));
            } else if (getImageDataFromTiktokApi(sigi_state) && !audioOnly) {
                const imagesData = getImageDataFromTiktokApi(sigi_state) as Image[];
                const imagesName = getTitleFromTiktokApi(sigi_state) as string;
                await downloadSlideshow(interaction, imagesData, imagesName, spoiler, getRange(range));
            } else {
                await downloadVideo(interaction, url, spoiler, audioOnly);
            }
        } catch (e) {
            logger.error(e);

            await interaction.followUp({
                ephemeral: false,
                content: `:x: ${e}`
            })
        }
    }
};
import { ApplicationCommandType, AttachmentBuilder, Client, CommandInteraction, SlashCommandBooleanOption, SlashCommandStringOption } from "discord.js";
import { Command } from "../command";

import { DISCORD_LIMIT } from "../constants/discordlimit";
import { MAX_RETRIES, RETRY_TIMEOUT } from "../constants/maxretries";
import { TIKTOK_COMMENTS_COUNT, TIKTOK_COMMENTS_MAX_COUNT, TIKTOK_COMMENTS_OFFSET } from "../constants/tiktokcommentscount";

import { Image } from "types/tiktokApi";
import { TikTokSigner } from "types/tiktokSigner";
import { TiktokCommentsApi } from "types/tiktokCommentsApi";

import { validateUrl } from "../common/validateUrl";
import { getBestFormat } from "../common/formatFinder";
import { getSlideshowDataFromTiktokApi, getTiktokIdFromTiktokUrl } from "../common/sigiState";
import { getRange } from "../common/getRange";

import getConfig from "../setup/configSetup";
import logger from "../logger";

//@ts-ignore - tiktok-signature types not available (https://github.com/carcabot/tiktok-signature)
import Signer from "tiktok-signature";

import ffmpeg from "fluent-ffmpeg";
import youtubedl, { YtResponse } from "youtube-dl-exec";
import fs from "fs";
import { Readable } from "stream";
import { finished } from "stream/promises";

async function convertSlideshowToVideo(url: string, imagesData: Image[], id: string): Promise<string> {
    const resultFilePath = `cache/${id}-slideshow.mp4`;

    return new Promise(async (resolve, reject) => {
        try {
            const process = ffmpeg();

            process.on('error', (err: any) => {
                reject(err);
            });

            process.on('end', () => {
                for (let i = 0; i < imagesData.length; i++) {
                    if (fs.existsSync(`cache/${id}-${i}.jpg`)) {
                        fs.unlinkSync(`cache/${id}-${i}.jpg`);
                    }
                }
                resolve(resultFilePath);
            });

            for (let i = 0; i < imagesData.length; i++) {
                const { body } = await fetch(imagesData[i].display_image.url_list[0]);
                const stream = fs.createWriteStream(`cache/${id}-${i}.jpg`);
                await finished(Readable.fromWeb(body as any).pipe(stream));
            }

            let audioData = await youtubedl(url, {
                noWarnings: true,
                dumpSingleJson: true,
                getFormat: true, 
            });

            //@ts-ignore - youtube-dl-exec audioData contains useless first line
            audioData = audioData.split('\n').slice(1).join('\n');
            audioData = JSON.parse(audioData as any) as YtResponse;

            const bestFormat = getBestFormat(url, audioData, true);

            process.addOption(`-framerate 1`);
            process.addOption(`-r 6`);
            process.addOption(`-loop 1`);
            process.addOption(`-t 4`);
            process.addOption(`-i cache/${id}-%d.jpg`);
            process.addOption('-i', bestFormat?.url as string);
            process.addOption('-c:v libx264');
            process.addOption('-pix_fmt yuv420p');
            process.addOption('-c:a aac');
            process.addOption('-b:a 192k');
            process.addOption('-shortest');

            process.output(resultFilePath);
            process.run();
        } catch (e) {
            for (let i = 0; i < imagesData.length; i++) {
                if (fs.existsSync(`cache/${id}-${i}.jpg`)) {
                    fs.unlinkSync(`cache/${id}-${i}.jpg`);
                }

                if (fs.existsSync(resultFilePath)) {
                    fs.unlinkSync(resultFilePath);
                }
            }

            reject(e);
        }
    });
}

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
    url: string,
    imagesData: Image[],
    slideshowAsVideo: boolean,
    spoiler: boolean,
    ranges: number[] = []
) {
    const tiktokId = await getTiktokIdFromTiktokUrl(url);
    const files = [] as AttachmentBuilder[];

    imagesData.forEach((image, i: number) => {
        if (ranges.length > 0 && !ranges.includes(i + 1)) {
            return;
        }

        const file = new AttachmentBuilder(image.display_image.url_list[0]);
        file.setName(`${tiktokId}-${i}.jpg`);
        file.setSpoiler(spoiler);

        files.push(file);
    });

    if (slideshowAsVideo) {
        const slideshowFile = await convertSlideshowToVideo(url, imagesData, tiktokId);
        const slideshowVideo = new AttachmentBuilder(slideshowFile);
        slideshowVideo.setName(`${tiktokId}.mp4`);
        slideshowVideo.setSpoiler(spoiler);

        await interaction.followUp({
            ephemeral: false,
            files: [slideshowVideo]
        });

        if (fs.existsSync(slideshowFile)) {
            fs.unlinkSync(slideshowFile);
        }

        return;
    }

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
    url: string,
    range: number[]
) {
    if (!new URL(url).hostname.includes('tiktok')) {
        throw new Error('Comments only option is available for tiktok links only.');
    }

    const id = await getTiktokIdFromTiktokUrl(url);
    const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36 Edg/105.0.1343.53";
    const MSTOKEN = "G1lr_8nRB3udnK_fFzgBD7sxvc0PK6Osokd1IJMaVPVcoB4mwSW-D6MQjTdoJ2o20PLt_MWNgtsAr095wVSShdmn_XVFS34bURvakVglDyWAHncoV_jVJCRdiJRdbJBi_E_KD_G8vpFF9-aOaJrk";

    const queryParams = {
        aweme_id: id,
        cursor: TIKTOK_COMMENTS_OFFSET,
        count: TIKTOK_COMMENTS_COUNT,
        msToken: MSTOKEN,
        aid: '1988',
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

    const commentsApi = new URL('https://www.tiktok.com/api/comment/list/?' + (new URLSearchParams(queryParams)).toString());

    const signer = new Signer(null, USER_AGENT);
    await signer.init();
    const signature = await signer.sign(commentsApi.toString()) as TikTokSigner.signature;
    const navigator = await signer.navigator() as TikTokSigner.navigator;
    await signer.close();

    const request = await fetch(
        signature.signed_url,
        {
            headers: {
                'user-agent': navigator.user_agent,
                'referer': url
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

export const Tiktok: Command = {
    name: "tiktok",
    description: "Send video/slideshow via url",
    type: ApplicationCommandType.ChatInput,
    options: [
        new SlashCommandStringOption().setName('url').setDescription('Tiktok link').setRequired(true),
        new SlashCommandBooleanOption().setName('spoiler').setDescription('Should hide as spoiler?').setRequired(false),
        new SlashCommandBooleanOption().setName('video').setDescription('Should send as video? This options exists to force slideshow into video').setRequired(false),
        new SlashCommandBooleanOption().setName('audio').setDescription('Should only download audio?').setRequired(false),
        new SlashCommandBooleanOption().setName('comments').setDescription('Should only send comments?').setRequired(false),
        new SlashCommandStringOption().setName('range').setDescription('Range of photos/comments').setRequired(false),
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        //@ts-ignore
        const url: string = interaction.options.getString('url', true);
        //@ts-ignore
        const spoiler = interaction.options.getBoolean('spoiler', false);
        //@ts-ignore
        const slideshowAsVideo = interaction.options.getBoolean('video', false);
        //@ts-ignore
        const audioOnly = interaction.options.getBoolean('audio', false);
        //@ts-ignore
        const commentsOnly = interaction.options.getBoolean('comments', false);
        //@ts-ignore
        const range = interaction.options.getString('range', false);

        try {
            const slideshowData = await getSlideshowDataFromTiktokApi(url);

            if (commentsOnly) {
                await getCommentsFromTiktok(interaction, url, getRange(range));
            } else if (slideshowData && !audioOnly) {
                await downloadSlideshow(interaction, url, slideshowData, slideshowAsVideo, spoiler, getRange(range));
            } else {
                await downloadVideo(interaction, url, spoiler, audioOnly);
            }
        } catch (e) {
            logger.error(e);

            const vxUrl = new URL(url);
            vxUrl.hostname = vxUrl.hostname.replace('tiktok', 'vxtiktok');

            await interaction.followUp({
                ephemeral: false,
                content: `:x: ${e}\n Using: ${vxUrl} as fallback.`
            })
        }
    }
};
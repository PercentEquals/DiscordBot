import { ApplicationCommandType, AttachmentBuilder, Client, CommandInteraction, SlashCommandBooleanOption, SlashCommandStringOption } from "discord.js";
import { Command } from "../command";

import { DISCORD_LIMIT } from "../constants/discordlimit";
import { TIKTOK_COMMENTS_COUNT, TIKTOK_COMMENTS_MAX_COUNT, TIKTOK_COMMENTS_OFFSET } from "../constants/tiktokcommentscount";

import { TiktokApi } from "types/tiktokApi";
import { TikTokSigner } from "types/tiktokSigner";
import { TiktokCommentsApi } from "types/tiktokCommentsApi";

import { extractUrl, validateUrl } from "../common/validateUrl";
import { getBestImageUrl, getBestFormat, getAnyFormat } from "../common/formatFinder";
import { getDataFromYoutubeDl, getTiktokId, getTiktokSlideshowData } from "../common/sigiState";
import { getRange } from "../common/getRange";
import { getExtensionFromUrl } from "../common/extensionFinder";

import { convertSlideshowToVideo, convertVideo, downloadFile } from "../common/ffmpegUtils";
import { reportError } from "../common/errorHelpers";

import getConfig from "../setup/configSetup";
import logger from "../logger";
import fs from "fs";

import { YtResponse } from "youtube-dl-exec";

//@ts-ignore - tiktok-signature types not available (https://github.com/carcabot/tiktok-signature)
import Signer from "tiktok-signature";

async function downloadAndConvertVideo(
    interaction: CommandInteraction,
    ytResponse: YtResponse | null,
    tiktokApi: TiktokApi | null,
    url: string,
    spoiler: boolean,
    audioOnly: boolean
) {
    const id = validateUrl(url);
    let filePath = `cache/${id}.mp4`;

    try {
        const format = getAnyFormat(ytResponse, tiktokApi) as { url: string, filesize: number };
        await downloadFile(format.url, filePath);

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

        file.setName(`${id}.${audioOnly ? 'mp3' : 'mp4'}`);
        file.setSpoiler(spoiler);

        logger.info('[bot] sending converted video');
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
    ytResponse: YtResponse | null,
    tiktokApi: TiktokApi | null,
    url: string,
    spoiler: boolean,
    audioOnly: boolean
) {
    const id = validateUrl(url);
    const bestFormat = getBestFormat(url, ytResponse, tiktokApi, audioOnly);

    if (!bestFormat || bestFormat.filesize > DISCORD_LIMIT) {
        return downloadAndConvertVideo(interaction, ytResponse, tiktokApi, url, spoiler, audioOnly);
    }

    const file = new AttachmentBuilder(bestFormat.url);
    file.setName(`${id}.${audioOnly ? 'mp3' : 'mp4'}`);
    file.setSpoiler(spoiler);

    logger.info('[bot] sending video');

    await interaction.followUp({
        ephemeral: false,
        files: [file]
    });
}

async function downloadSlideshowAsVideo(
    interaction: CommandInteraction,
    tiktokApi: TiktokApi,
    spoiler: boolean,
    ranges: number[] = []
) {
    const slideshowFile = await convertSlideshowToVideo(tiktokApi, ranges);

    try {
        if (fs.lstatSync(slideshowFile).size > DISCORD_LIMIT) {
            if (fs.existsSync(slideshowFile)) {
                fs.unlinkSync(slideshowFile);
            }
            throw new Error(`No format found under ${DISCORD_LIMIT / 1024 / 1024}MB`);
        }

        const slideshowVideo = new AttachmentBuilder(slideshowFile);
        slideshowVideo.setName(`${getTiktokId(tiktokApi)}.mp4`);
        slideshowVideo.setSpoiler(spoiler);

        logger.info('[bot] sending slideshow as video');

        await interaction.followUp({
            ephemeral: false,
            files: [slideshowVideo]
        });
    } finally {
        if (fs.existsSync(slideshowFile)) {
            fs.unlinkSync(slideshowFile);
        }
    }
}

async function downloadSlideshow(
    interaction: CommandInteraction,
    tiktokApi: TiktokApi,
    spoiler: boolean,
    ranges: number[] = []
) {
    const slideshowData = getTiktokSlideshowData(tiktokApi);
    const tiktokId = getTiktokId(tiktokApi);
    const files = [] as AttachmentBuilder[];

    for (let i = 0; i < slideshowData.length; i++) {
        if (ranges.length > 0 && !ranges.includes(i + 1)) {
            continue;
        }

        const image = slideshowData[i];
        const bestImageUrl = getBestImageUrl(image);
        const file = new AttachmentBuilder(bestImageUrl);
        const extensions = await getExtensionFromUrl(bestImageUrl);

        file.setName(`${tiktokId}-${i}.${extensions}`);
        file.setSpoiler(spoiler);

        files.push(file);
    }

    logger.info('[bot] sending slideshow');

    if (files.length === 0) {
        throw new Error('No images found.');
    }

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
    tiktokApi: TiktokApi | null,
    url: string,
    range: number[]
) {
    if (!new URL(url).hostname.includes('tiktok') || !tiktokApi) {
        throw new Error('Comments only option is available for tiktok links only.');
    }

    const id = getTiktokId(tiktokApi);
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

    if (commentsResponse.length === 0) {
        throw new Error('No comments found.');
    }

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
        const url: string = extractUrl(interaction.options.getString('url', true));
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
            const { ytResponse, tiktokApi } = await getDataFromYoutubeDl(url);
            const isSlideshow = getTiktokSlideshowData(tiktokApi)?.length > 0;

            if (getConfig().environmentOptions.logToFile) {
                fs.writeFileSync('cache/tiktokApi.json', JSON.stringify(tiktokApi, null, 2));
                fs.writeFileSync('cache/ytResponse.json', JSON.stringify(ytResponse, null, 2));
            }

            if (commentsOnly) {
                return await getCommentsFromTiktok(interaction, tiktokApi, url, getRange(range));
            } else if (!!tiktokApi && isSlideshow && !audioOnly && slideshowAsVideo) {
                return await downloadSlideshowAsVideo(interaction, tiktokApi, spoiler, getRange(range));
            } else if (!!tiktokApi && isSlideshow && !audioOnly) {
                return await downloadSlideshow(interaction, tiktokApi, spoiler, getRange(range));
            } else {
                return await downloadVideo(interaction, ytResponse, tiktokApi, url, spoiler, audioOnly);
            }
        } catch (e: any) {
            try {
                const vxUrl = new URL(url);
                vxUrl.hostname = vxUrl.hostname.replace('tiktok', 'vxtiktok');

                return reportError(interaction, e, `Using ${vxUrl} as fallback.`);
            } catch (e) {
                // ignore
            }

            return reportError(interaction, e);
        }
    }
};
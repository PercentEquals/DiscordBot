import { ApplicationCommandType, AttachmentBuilder, Client, CommandInteraction, SlashCommandBooleanOption, SlashCommandStringOption } from "discord.js";
import { Command } from "../command";

import { DISCORD_LIMIT } from "../constants/discordlimit";
import { MAX_COMPRESSION_SCALE } from "src/constants/maxcompressionscale";
import { TIKTOK_COMMENTS_COUNT, TIKTOK_COMMENTS_MAX_COUNT, TIKTOK_COMMENTS_OFFSET } from "../constants/tiktokcommentscount";

import { TikTokSigner } from "types/tiktokSigner";
import { TiktokCommentsApi } from "types/tiktokCommentsApi";

import { extractUrl, validateUrl } from "../common/validateUrl";
import { getRange } from "../common/getRange";
import { getExtensionFromUrl } from "../common/extensionFinder";

import { reportError } from "../common/errorHelpers";

import getConfig from "../setup/configSetup";
import logger from "../logger";

//@ts-ignore - tiktok-signature types not available (https://github.com/carcabot/tiktok-signature)
import Signer from "tiktok-signature";

import FFmpegProcessor, { InputUrl } from "../lib/FFmpegProcessor";
import UltraFastOptions from "../lib/ffmpeg/UltraFastOptions";
import CompressOptions from "../lib/ffmpeg/CompressOptions";
import SlideshowOptions from "../lib/ffmpeg/SlideshowOptions";
import PipeOptions from "../lib/ffmpeg/PipeOptions";
import LinkExtractor from "../lib/LinkExtractor";
import IExtractor from "../lib/extractors/IExtractor";
import FFProbe from "src/lib/FFprobeProcessor";
import SplitOptions from "../lib/ffmpeg/SplitOptions";
import FileOptions from "../lib/ffmpeg/FileOptions";
import fs from "fs";

async function downloadAndSplitVideo(
    interaction: CommandInteraction,
    extractor: IExtractor,
    spoiler: boolean,
    audioOnly: boolean
) {
    const format = extractor.getBestFormat(true);

    if (!getConfig().botOptions.allowSplittingOfLargeFiles || !format?.url) {
        throw new Error(`No format found under ${DISCORD_LIMIT / 1024 / 1024}MB`);
    }

    logger.info(`[bot] found format is too large - attempting file splitting (${format.filesize})`);

    const ffprobe = await FFProbe(format.url);
    const ffmpegProcess = new FFmpegProcessor([
        new SplitOptions(extractor.getId(), format.filesize, DISCORD_LIMIT, ffprobe),
        new UltraFastOptions(),
    ]);

    const files = await ffmpegProcess.getAttachmentBuilder([{ url: format.url }]);

    for (const file of files) {
        file.setName(`${extractor.getId()}.${audioOnly ? 'mp3' : 'mp4'}`);
        file.setSpoiler(spoiler);
    }

    logger.info('[bot] sending split videos');

    let splitSizes = 0;
    let filesToSend: AttachmentBuilder[] = [];

    for (const file of files) {
        splitSizes += fs.lstatSync(file.attachment as string).size;

        if (splitSizes >= DISCORD_LIMIT * 2) {
            await interaction.followUp({
                ephemeral: false,
                files: filesToSend.splice(0, filesToSend.length - 1),
            });

            splitSizes = fs.lstatSync(file.attachment as string).size;
        }

        filesToSend.push(file);
    }

    if (filesToSend.length > 0) {
        await interaction.followUp({
            ephemeral: false,
            files: filesToSend
        });
    }

    ffmpegProcess.cleanUp();
    logger.info('[bot] sent split video');
}

async function downloadAndConvertVideo(
    interaction: CommandInteraction,
    extractor: IExtractor,
    spoiler: boolean,
    audioOnly: boolean
) {
    const format = extractor.getBestFormat(true);

    if (!getConfig().botOptions.allowCompressionOfLargeFiles || !format?.url) {
        throw new Error(`No format found under ${DISCORD_LIMIT / 1024 / 1024}MB`);
    }

    logger.info(`[bot] found format is too large - attempting compression (${format.filesize})`);

    const ffprobe = await FFProbe(format.url);
    const ffmpegProcess = new FFmpegProcessor([
        new PipeOptions(),
        new CompressOptions(format.filesize, DISCORD_LIMIT, ffprobe),
        new UltraFastOptions(),
    ]);

    const file = (await ffmpegProcess.getAttachmentBuilder([{ url: format.url }]))[0];
    file.setName(`${extractor.getId()}.${audioOnly ? 'mp3' : 'mp4'}`);
    file.setSpoiler(spoiler);

    logger.info('[bot] sending converted video');

    await interaction.followUp({
        ephemeral: false,
        files: [file]
    });

    ffmpegProcess.cleanUp();
    logger.info('[bot] sent converted video');
}

async function downloadVideo(
    interaction: CommandInteraction,
    extractor: IExtractor,
    spoiler: boolean,
    audioOnly: boolean
) {
    const bestFormat = extractor.getBestFormat();

    if (!bestFormat || bestFormat.filesize > DISCORD_LIMIT) {
        try {
            return await downloadAndSplitVideo(interaction, extractor, spoiler, audioOnly);
        } catch {
            return await downloadAndConvertVideo(interaction, extractor, spoiler, audioOnly);
        }
    }

    const file = new AttachmentBuilder(bestFormat.url);
    file.setName(`${extractor.getId()}.${audioOnly ? 'mp3' : 'mp4'}`);
    file.setSpoiler(spoiler);

    logger.info('[bot] sending video');

    await interaction.followUp({
        ephemeral: false,
        files: [file]
    });

    logger.info('[bot] sent video');
}

async function downloadSlideshowAsVideo(
    interaction: CommandInteraction,
    extractor: IExtractor,
    spoiler: boolean,
    ranges: number[] = []
) {
    const slideshowData = extractor.getSlideshowData();
    const urls: InputUrl[] = [];

    for (let i = 0; i < slideshowData.length; i++) {
        if (ranges.length > 0 && !ranges.includes(i + 1)) {
            continue;
        }

        urls.push({ 
            url: slideshowData[i],
            type: 'photo'
        });
    }

    const bestAudioFormat = extractor.getBestFormat();
    let withAudio = false;

    if (bestAudioFormat?.url) {
        urls.push({
            url: bestAudioFormat.url,
            type: 'audio'
        });
        withAudio = true;
    }

    const ffmpegProcessor = new FFmpegProcessor([
        new FileOptions(extractor.getId()),
        new SlideshowOptions(urls.length, extractor, withAudio)
    ]);

    const slideshowVideo = (await ffmpegProcessor.getAttachmentBuilder(urls))[0];
    slideshowVideo.setName(`${extractor.getId()}.mp4`);
    slideshowVideo.setSpoiler(spoiler);

    logger.info('[bot] sending slideshow as video');

    await interaction.followUp({
        ephemeral: false,
        files: [slideshowVideo]
    });

    ffmpegProcessor.cleanUp();
    logger.info('[bot] sent slideshow as video');
}

async function downloadSlideshow(
    interaction: CommandInteraction,
    extractor: IExtractor,
    spoiler: boolean,
    ranges: number[] = []
) {
    const slideshowData = extractor.getSlideshowData();
    const files = [] as AttachmentBuilder[];

    for (let i = 0; i < slideshowData.length; i++) {
        if (ranges.length > 0 && !ranges.includes(i + 1)) {
            continue;
        }

        const file = new AttachmentBuilder(slideshowData[i]);
        const extension = getExtensionFromUrl(slideshowData[i]);

        file.setName(`${extractor.getId()}-${i}.${extension}`);
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
    extractor: IExtractor,
    url: string,
    range: number[]
) {
    if (!new URL(url).hostname.includes('tiktok') || !extractor) {
        throw new Error('Comments only option is available for tiktok links only.');
    }

    const id = validateUrl(await extractUrl(url));
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

    const commentsData: TiktokCommentsApi = await request.json() as any;

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
        let extractor: IExtractor | null = null;

        try {
            //@ts-expect-error - Bad types
            const url: string = await extractUrl(interaction.options.getString('url', true));
            //@ts-expect-error - Bad types
            const spoiler = interaction.options.getBoolean('spoiler', false);
            //@ts-expect-error - Bad types
            const slideshowAsVideo = interaction.options.getBoolean('video', false);
            //@ts-expect-error - Bad types
            const audioOnly = interaction.options.getBoolean('audio', false);
            //@ts-expect-error - Bad types
            const commentsOnly = interaction.options.getBoolean('comments', false);
            //@ts-expect-error - Bad types
            const range = interaction.options.getString('range', false);

            validateUrl(new URL(url));

            extractor = await (new LinkExtractor().extractUrl(url));
            const isSlideshow = extractor.isSlideshow();

            if (commentsOnly) {
                return await getCommentsFromTiktok(interaction, extractor, url, getRange(range));
            } else if (isSlideshow && !audioOnly && slideshowAsVideo) {
                return await downloadSlideshowAsVideo(interaction, extractor, spoiler, getRange(range));
            } else if (isSlideshow && !audioOnly) {
                return await downloadSlideshow(interaction, extractor, spoiler, getRange(range));
            } else {
                return await downloadVideo(interaction, extractor, spoiler, audioOnly);
            }
        } catch (e: any) {
            await reportError(interaction, e, true);
        } finally {
            extractor?.dispose?.(true);
        }
    }
};
import { ApplicationCommandType, AttachmentBuilder, Client, CommandInteraction, SlashCommandBooleanOption, SlashCommandStringOption } from "discord.js";
import { Command } from "../command";
import { ItemModuleChildren, TiktokApi, Image } from "types/tiktokApi";
import { DISCORD_LIMIT } from "../constants/discordlimit";
import { ALLOWED_YTD_HOSTS } from "../constants/allowedytdhosts";
import { MAX_RETRIES, RETRY_TIMEOUT } from "../constants/maxretries";
import { TiktokCommentsApi } from "types/tiktokCommentsApi";

//@ts-ignore - tiktok-signature types not available (https://github.com/carcabot/tiktok-signature)
import Signer from "tiktok-signature";

import youtubedl, { YtResponse } from "youtube-dl-exec";
import cheerio from "cheerio";
import fs from "fs";
import { TikTokSigner } from "types/tiktokSigner";

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
        console.error(e);

        if (retry >= MAX_RETRIES) {
            throw new Error(`Failed to download video - something went wrong with youtube-dl-exec: ${e}.`);
        }

        console.log(`retrying... (${retry} / ${MAX_RETRIES})`);
        return setTimeout(() => {
            downloadVideo(interaction, url, spoiler, audioOnly, retry + 1);
        }, RETRY_TIMEOUT);
    }

    //@ts-ignore - youtube-dl-exec videoData contains useless first line
    videoData = videoData.split('\n').slice(1).join('\n');
    videoData = JSON.parse(videoData as any) as YtResponse;

    fs.writeFileSync('debug/videoData.json', JSON.stringify(videoData, null, 2));

    let bestFormat: { url: string } | null = null;

    if (new URL(url).hostname.includes('tiktok')) {
        //@ts-ignore - tiktok slideshow audio edge case
        const tiktokSlideshowAudio = videoData.requested_downloads?.[0];

        const formatsNoWatermark = videoData.formats.filter((format) => format.format_note && !format.format_note.includes('watermark'));
        const formatsUnderLimit = formatsNoWatermark?.filter((format) => format.filesize && format.filesize < DISCORD_LIMIT);
        const formatsH264 = formatsUnderLimit?.filter((format) => format.format.includes('h264'));

        if (formatsH264.length === 0 && tiktokSlideshowAudio && audioOnly) {
            formatsH264.push(tiktokSlideshowAudio);
        }

        bestFormat = formatsH264.sort((a, b) => a.filesize - b.filesize)?.[0];
    } else if (new URL(url).hostname.includes('youtube')) {
        //@ts-ignore - youtube-dl-exec types don't include filesize_approx
        const formatsUnderLimit = videoData.formats.filter((format) => format.filesize < DISCORD_LIMIT || format.filesize_approx < DISCORD_LIMIT);
        const formats = formatsUnderLimit.filter((format) => format.acodec && format.vcodec && format.acodec.includes('mp4a') && format.vcodec.includes('avc'));
        bestFormat = formats.sort((a, b) => a.filesize - b.filesize)?.[0];
    }

    if (!bestFormat) {
        throw new Error(`No format found under ${DISCORD_LIMIT / 1024 / 1024}MB`);
    }

    const file = new AttachmentBuilder(bestFormat.url);
    file.setName(`${videoData.title}.${audioOnly ? 'mp3' : 'mp4'}`);
    file.setSpoiler(spoiler);

    console.log('[discord] sending video');

    try {
        await interaction.followUp({
            ephemeral: false,
            files: [file]
        });
    } catch (e) {
        console.error(e);

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
    spoiler: boolean
) {
    const files = [] as AttachmentBuilder[];

    imagesData.forEach((image, i: number) => {
        const file = new AttachmentBuilder(image.imageURL.urlList[0]);
        file.setName(`${imagesName}-${i}.jpg`);
        file.setSpoiler(spoiler);

        files.push(file);
    });

    console.log('[discord] sending slideshow');

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
    sigi_state: TiktokApi
) {
    const id = getTiktokIdFromTiktokApi(sigi_state);
    const itemModuleChildren = (sigi_state.ItemModule?.[id] as ItemModuleChildren);
    const playUrl = new URL(itemModuleChildren.music.playUrl);

    const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36 Edg/105.0.1343.53";
    const MSTOKEN = "G1lr_8nRB3udnK_fFzgBD7sxvc0PK6Osokd1IJMaVPVcoB4mwSW-D6MQjTdoJ2o20PLt_MWNgtsAr095wVSShdmn_XVFS34bURvakVglDyWAHncoV_jVJCRdiJRdbJBi_E_KD_G8vpFF9-aOaJrk";
    
    const queryParams = {
        aweme_id: id,
        cursor: 0,
        count: 20,
        msToken: MSTOKEN,
        aid: playUrl.searchParams.get('a'),
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
                'referer': sigi_state.SEOState.metaParams.canonicalHref,
            }
        }
    );

    const commentsData: TiktokCommentsApi = await request.json();

    fs.writeFileSync('debug/commentsData.json', JSON.stringify(commentsData, null, 2));

    const commentsResponse = commentsData.comments.map((comment) => {
        // Filter out @ mentions
        if (comment.text.startsWith('@')) {
            return null;
        }

        // Filter out empty comments
        if (comment.text.length <= 1) {
            return null;
        }

        return '***' + comment.user.nickname + '***: \n> ' + comment.text;
    }).filter((comment) => comment !== null) as string[];

    console.log('[discord] sending comments');

    await interaction.followUp({
        ephemeral: false,
        content: commentsResponse.join('\n')
    });
}

function getTiktokIdFromTiktokApi(sigi_state: TiktokApi) {
    return Object.keys(sigi_state.ItemModule)[0] as keyof TiktokApi['ItemModule'];
}

function getImageDataFromTiktokApi(sigi_state: TiktokApi) {
    if (!sigi_state?.ItemModule) return null;

    const id = getTiktokIdFromTiktokApi(sigi_state);
    return (sigi_state.ItemModule?.[id] as ItemModuleChildren)?.imagePost?.images;
}

function getTitleFromTiktokApi(sigi_state: TiktokApi) {
    if (!sigi_state?.SEOState) return null;

    return sigi_state.SEOState.metaParams.title;
}

function validateUrl(url: URL) {
    if (!ALLOWED_YTD_HOSTS.includes(url.hostname)) {
        throw new Error(`Not an allowed url ${JSON.stringify(ALLOWED_YTD_HOSTS)}`);
    }

    const urlNoParams = url.href.split('?')[0];
    let id = urlNoParams.split('/')[urlNoParams.split('/').length - 1];
    if (id === '') {
        id = urlNoParams.split('/')[urlNoParams.split('/').length - 2];
    }

    if (!id && url.hostname.includes('youtube')) {
        id = url.searchParams.get('v') as string;
    }

    if (!id) {
        throw new Error('No id found');
    }
}

async function fetchWithRetries(url: string, retry = 0): Promise<Response> {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(url);

            if (response.ok) {
                return resolve(response);
            }
            
            throw new Error(`Status code ${response.status}`);
        } catch (e) {
            console.error(e);

            if (retry >= MAX_RETRIES) {
                return reject(e);
            }

            console.log(`retrying... (${retry} / ${MAX_RETRIES})`);

            return setTimeout(() => {
                resolve(fetchWithRetries(url, retry + 1));
            }, RETRY_TIMEOUT);
        }
    });
}

let runRetries = 0;

export const Tiktok: Command = {
    name: "tiktok",
    description: "Send video/slideshow via url",
    type: ApplicationCommandType.ChatInput,
    options: [
        new SlashCommandStringOption().setName('url').setDescription('Tiktok link').setRequired(true),
        new SlashCommandBooleanOption().setName('spoiler').setDescription('Should hide as spoiler?').setRequired(false),
        new SlashCommandBooleanOption().setName('audio').setDescription('Should only download audio?').setRequired(false),
        new SlashCommandBooleanOption().setName('comments').setDescription('Should only send comments?').setRequired(false)
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

            const urlObj = new URL(url);

            validateUrl(urlObj);

            const response = await fetchWithRetries(url);
            const headers = response.headers;
            const body = await response.text();

            const $ = cheerio.load(body);
            const $script = $('#SIGI_STATE');
            const sigi_state: TiktokApi = JSON.parse($script.html() as string);

            fs.writeFileSync('debug/sigi_state.json', JSON.stringify(sigi_state, null, 2));

            // Sometimes tiktok doesn't return the sigi_state, so we retry...
            if (urlObj.hostname.includes('tiktok') && !sigi_state) {
                console.log(`No sigi_state found. Retrying... (${runRetries} / ${MAX_RETRIES})`);

                if (runRetries >= MAX_RETRIES) {
                    runRetries = 0;
                    throw new Error('No sigi_state found. Please try again later.');
                }
                runRetries++;

                return setTimeout(() => {
                    Tiktok.run(client, interaction);
                }, RETRY_TIMEOUT);
            }
            runRetries = 0;

            if (commentsOnly) {
                await getCommentsFromTiktok(interaction, sigi_state);
            } else if (getImageDataFromTiktokApi(sigi_state) && !audioOnly) {
                const imagesData = getImageDataFromTiktokApi(sigi_state) as Image[];
                const imagesName = getTitleFromTiktokApi(sigi_state) as string;
                await downloadSlideshow(interaction, imagesData, imagesName, spoiler);
            } else {
                await downloadVideo(interaction, url, spoiler, audioOnly);
            }
        } catch (e) {
            console.error(e);

            await interaction.followUp({
                ephemeral: false,
                content: `\n${e}`
            })
        }
    }
};
import { ApplicationCommandType, AttachmentBuilder, Client, CommandInteraction, SlashCommandBooleanOption, SlashCommandStringOption } from "discord.js";
import { Command } from "../command";
import youtubedl, { YtResponse } from "youtube-dl-exec";
import cheerio from "cheerio";
import { ItemModuleChildren, TiktokApi, Image } from "types/tiktokApi";
import { DISCORD_LIMIT } from "../constants/discordlimit";
import { ALLOWED_YTD_HOSTS } from "../constants/allowedytdhosts";

async function downloadVideo(
    interaction: CommandInteraction,
    url: string,
    spoiler: boolean,
    audioOnly: boolean
) {
    let videoData = await youtubedl(url, {
        dumpSingleJson: true,
        getFormat: true,
        noWarnings: true,
    });

    //@ts-ignore
    videoData = videoData.split('\n').slice(1).join('\n');
    videoData = JSON.parse(videoData as any) as YtResponse;

    let bestFormat: { url: string } | null = null;

    if (new URL(url).hostname.includes('tiktok')) {
        //@ts-ignore - tiktok slideshow audio edge case
        const tiktokSlideshowAudio = videoData.requested_downloads?.[0];

        const formatsNoWatermark = videoData.formats.filter((format) => format.format_note && !format.format_note.includes('watermark'));
        const formatsUnderLimit = formatsNoWatermark?.filter((format) => format.filesize && format.filesize < DISCORD_LIMIT);
        const formatsH264 = formatsUnderLimit?.filter((format) => format.format.includes('h264'));

        if (formatsH264.length === 0 && tiktokSlideshowAudio) {
            formatsH264.push(tiktokSlideshowAudio);
        }

        bestFormat = formatsH264.sort((a, b) => a.filesize - b.filesize)?.[0];
    } else if (new URL(url).hostname.includes('youtube')) {
        //@ts-ignore
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

    console.log('[discord] sending');

    await interaction.followUp({
        ephemeral: false,
        files: [file]
    });
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

function getImageDataFromTiktokApi(sigi_state: TiktokApi) {
    if (!sigi_state?.ItemModule) return null;

    const key = Object.keys(sigi_state.ItemModule)[0] as keyof TiktokApi['ItemModule'];
    return (sigi_state.ItemModule?.[key] as ItemModuleChildren)?.imagePost?.images;
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

export const Tiktok: Command = {
    name: "tiktok",
    description: "Send  video/slideshow via url",
    type: ApplicationCommandType.ChatInput,
    options: [
        new SlashCommandStringOption().setName('url').setDescription('Tiktok link').setRequired(true),
        new SlashCommandBooleanOption().setName('spoiler').setDescription('Should hide as spoiler?').setRequired(false),
        new SlashCommandBooleanOption().setName('audio').setDescription('Should only download audio?').setRequired(false)
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            //@ts-ignore
            const url: string = interaction.options.getString('url', true);
            //@ts-ignore
            const spoiler = interaction.options.getBoolean('spoiler', false);
            //@ts-ignore
            const audioOnly = interaction.options.getBoolean('audio', false);

            validateUrl(new URL(url));

            let body = '';

            try {
                const response = await fetch(url);

                if (response.status !== 200) {
                    throw new Error(`Video not found: ${response.status}`);
                }

                body = await response.text();
            } catch (e) {
                console.error(e);
            }

            const $ = cheerio.load(body);
            const $script = $('#SIGI_STATE');
            const sigi_state: TiktokApi = JSON.parse($script.html() as string);

            if (getImageDataFromTiktokApi(sigi_state) && !audioOnly) {
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
import { ApplicationCommandType, AttachmentBuilder, Client, CommandInteraction, SlashCommandBooleanOption, SlashCommandStringOption } from "discord.js";
import { Command } from "../command";
import youtubedl from "youtube-dl-exec";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import cheerio from "cheerio";
import { ItemModuleChildren, TiktokApi, Image } from "types/tiktokApi";
import { DISCORD_LIMIT } from "../constants/discordlimit";
import { ALLOWED_YTD_HOSTS } from "../constants/allowedytdhosts";

async function convertVideo(id: string, compress: boolean, audioOnly: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
        const initialPath = `cache/${id}.mp4`;
        const finalPath = `cache/${id}-ffmpeg.${audioOnly ? 'mp3' : 'mp4'}`;

        console.log('[ffmpeg] converting');

        const process = ffmpeg(initialPath);
        process.output(finalPath);
        process.addOption(["-preset", "ultrafast"]);

        if (compress) {
            process.videoBitrate('1000k');
            process.audioBitrate('128k');
            process.addOption(["-vf", "scale=iw/2:ih/2"]);
        }

        if (audioOnly) {
            process.noVideo();
            process.format('mp3');
        }

        process.on('end', (done: any) => {
            fs.unlinkSync(initialPath);
            console.log('[ffmpeg] conversion done');
            resolve(finalPath);
        });

        process.on('error', (err: any) => {
            fs.unlinkSync(initialPath);
            console.log('[ffmpeg] error', err);
            reject(err);
        });

        process.run();
    })
}

async function downloadVideo(
    interaction: CommandInteraction,
    id: string,
    url: string,
    spoiler: boolean,
    videoName: string,
    audioOnly: boolean
) {
    let filePath = `cache/${id}.mp4`;

    const result = await youtubedl(url, {
        output: filePath
    });

    console.log(result);

    if (fs.statSync(filePath).size > DISCORD_LIMIT && !audioOnly) {
        console.log('[discord] initial file too big - converting');
        filePath = await convertVideo(id, true, audioOnly);
    } else {
        filePath = await convertVideo(id, false, audioOnly);
    }

    const file = new AttachmentBuilder(filePath);
    file.setName(`${videoName}.${audioOnly ? 'mp3' : 'mp4'}`);
    file.setSpoiler(spoiler);

    console.log('[discord] sending');

    if (fs.statSync(filePath).size > DISCORD_LIMIT) {
        console.log('[discord] file too big');
        const size = fs.statSync(filePath).size / 1024 / 1024;
        fs.unlinkSync(filePath);
        throw new Error(`File too big - ${size.toFixed(2)}MB / ${(DISCORD_LIMIT / 1024 / 1024).toFixed(2)}MB - ${url}`);
    }

    await interaction.followUp({
        ephemeral: false,
        files: [file]
    });

    fs.unlinkSync(filePath);
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

function getTitleFromTiktokApi(sigi_state: TiktokApi, fallbackTitle: string) {
    if (!sigi_state?.SEOState) return fallbackTitle;

    return sigi_state.SEOState.metaParams.title;
}

function getIdFromUrl(url: URL) {
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

    return id;
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

            const urlObject = new URL(url);
            const id = getIdFromUrl(urlObject);

            const response = await fetch(url);
            const body = await response.text();

            const $ = cheerio.load(body);
            const $script = $('#SIGI_STATE');
            const sigi_state: TiktokApi = JSON.parse($script.html() as string);

            if (getImageDataFromTiktokApi(sigi_state) && !audioOnly) {
                const imagesData = getImageDataFromTiktokApi(sigi_state) as Image[];
                const imagesName = getTitleFromTiktokApi(sigi_state, id);
                await downloadSlideshow(interaction, imagesData, imagesName, spoiler);
            } else {
                const videoName = getTitleFromTiktokApi(sigi_state, id);
                await downloadVideo(interaction, id, url, spoiler, videoName, audioOnly);
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
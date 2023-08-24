import { ApplicationCommandType, AttachmentBuilder, Client, CommandInteraction, SlashCommandBooleanOption, SlashCommandStringOption, SlashCommandSubcommandGroupBuilder } from "discord.js";
import { Command } from "../command";
import youtubedl from "youtube-dl-exec";
import fs from "fs";

import ffmpegStatic from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import cheerio from "cheerio";

const DISCORD_LIMIT = 23 * 1024 * 1024; // ~25MB (23 to be sure)

ffmpeg.setFfmpegPath(ffmpegStatic as string);
fs.mkdirSync('cache', { recursive: true });

async function convertVideo(id: string, audioOnly: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
        const initialPath = `cache/${id}.mp4`;
        const finalPath = `cache/${id}-ffmpeg.${audioOnly ? 'mp3' : 'mp4'}`;

        console.log('[ffmpeg] converting', ffmpegStatic);
        
        const process = ffmpeg(initialPath);
        process.videoCodec('libx264');
        process.addOption(["-preset", "ultrafast"]);
        process.output(finalPath);
        process.on('end', (done: any) => {
            console.log('[ffmpeg] conversion done');
            resolve(finalPath);
        })
        process.on('error', (err: any) => {
            console.log('[ffmpeg] error', err);
            reject(err);
        })
        
        if (fs.statSync(initialPath).size > DISCORD_LIMIT) {
            console.log('[ffmpeg] also compressing');
            process.videoBitrate('300k');
        }

        if (audioOnly) {
            process.noVideo();
            process.audioCodec('copy');
            process.format('mp3');
        }

        process.run();
    })
}

async function downloadVideo(interaction: CommandInteraction, id: string, url: string, spoiler: boolean, audioOnly: boolean) {   
    const initialPath = `cache/${id}.mp4`;

    const result = await youtubedl(url, {
        output: initialPath
    });

    console.log(result);

    const finalPath = await convertVideo(id, audioOnly);

    const file = new AttachmentBuilder(finalPath);
    file.setName(`${id}.${audioOnly ? 'mp3' : 'mp4'}`);
    file.setSpoiler(spoiler);

    console.log('[discord] sending');

    if (fs.statSync(finalPath).size > DISCORD_LIMIT) {
        console.log('[discord] file too big');
        const size = fs.statSync(finalPath).size / 1024 / 1024;
        throw new Error(`File too big - ${size}MB / ${DISCORD_LIMIT / 1024 / 1024}MB - ${url}`);
    }

    await interaction.followUp({
        ephemeral: false,
        files: [file]
    });

    fs.unlinkSync(initialPath);
    fs.unlinkSync(finalPath);
}

async function downloadSlideshow(interaction: CommandInteraction, id: string, url: string, spoiler: boolean, audioOnly: boolean) {
    const response = await fetch(url);
    const body = await response.text();

    const $ = cheerio.load(body);
    const files = [] as AttachmentBuilder[];

    const $script = $('#SIGI_STATE');
    const sigi_state = JSON.parse($script.html() as string);

    const key = Object.keys(sigi_state.ItemModule)[0];

    if (!sigi_state.ItemModule?.[key]?.imagePost?.images || audioOnly) {
        return false;
    }

    const imagesData = sigi_state.ItemModule[key].imagePost.images;

    imagesData.forEach((image: { imageURL: { urlList: string[] } }, i: number) => {
        const file = new AttachmentBuilder(image.imageURL.urlList[0]);
        file.setName(`${id}-${i}.jpg`);
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

    return true;
}

export const Tiktok: Command = {
    name: "tiktok",
    description: "Send tiktok video/slideshow via url",
    type: ApplicationCommandType.ChatInput,
    options: [
        new SlashCommandStringOption().setName('url').setDescription('Tiktok link').setRequired(true),
        new SlashCommandBooleanOption().setName('spoiler').setDescription('Should hide as spoiler?').setRequired(false),
        new SlashCommandBooleanOption().setName('audio').setDescription('Should only download audio?').setRequired(false)
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            //@ts-ignore
            const url: string = interaction.options.getString('url', true).split('?')[0];
            //@ts-ignore
            const spoiler = interaction.options.getBoolean('spoiler', false);
            //@ts-ignore
            const audio = interaction.options.getBoolean('audio', false);

            let id = url.split('/')[url.split('/').length - 1];
            if (id === '') {
                id = url.split('/')[url.split('/').length - 2];
            }

            if (id === '') {
                throw new Error('No id found');
            }

            if (!new URL(url).hostname.includes('tiktok')) {
                throw new Error('Not a tiktok url');
            }

            if (!await downloadSlideshow(interaction, id, url, spoiler, audio)) {
                await downloadVideo(interaction, id, url, spoiler, audio);
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
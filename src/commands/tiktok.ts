import { ApplicationCommandType, AttachmentBuilder, Client, CommandInteraction, SlashCommandBooleanOption, SlashCommandStringOption } from "discord.js";
import { Command } from "../command";
import youtubedl from "youtube-dl-exec";
import fs from 'fs';

import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import cheerio from "cheerio";

const DISCORD_LIMIT = 23 * 1024 * 1024; // ~25MB (23 to be sure)

ffmpeg.setFfmpegPath(ffmpegStatic as string);
fs.mkdirSync('cache', { recursive: true });

async function convertVideo(id: string) {
    return new Promise((resolve, reject) => {
        console.log('[ffmpeg] converting', ffmpegStatic);
        
        const process = ffmpeg(`cache/${id}.mp4`);
        process.videoCodec('libx264');
        process.output(`cache/${id}-ffmpeg.mp4`);
        process.on('end', (done: any) => {
            console.log('[ffmpeg] conversion done');
            resolve(done);
        })
        process.on('error', (err: any) => {
            console.log('[ffmpeg] error', err);
            reject(err);
        })
        
        if (fs.statSync(`cache/${id}.mp4`).size > DISCORD_LIMIT) {
            console.log('[ffmpeg] also compressing');
            process.videoBitrate('300k');
        }

        process.run();
    })
}

async function downloadVideo(interaction: CommandInteraction, id: string, url: string, spoiler: boolean) {
    const result = await youtubedl(url, {
        format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
        output: `cache/${id}.mp4`
    });

    console.log(result);

    await convertVideo(id);

    const file = new AttachmentBuilder(`cache/${id}-ffmpeg.mp4`);
    file.setName(`${id}.mp4`);
    file.setSpoiler(spoiler);

    console.log('[discord] sending');

    if (fs.statSync(`cache/${id}-ffmpeg.mp4`).size > DISCORD_LIMIT) {
        console.log('[discord] file too big');
        const size = fs.statSync(`cache/${id}-ffmpeg.mp4`).size / 1024 / 1024;
        throw new Error(`File too big - ${size}MB / ${DISCORD_LIMIT / 1024 / 1024}MB - ${url}`);
    }

    await interaction.followUp({
        ephemeral: false,
        files: [file]
    });

    fs.unlinkSync(`cache/${id}.mp4`);
    fs.unlinkSync(`cache/${id}-ffmpeg.mp4`);
}

async function downloadSlideshow(interaction: CommandInteraction, id: string, url: string, spoiler: boolean) {
    const response = await fetch(url);
    const body = await response.text();

    const $ = cheerio.load(body);
    const files = [] as AttachmentBuilder[];

    const $script = $('#SIGI_STATE');
    const sigi_state = JSON.parse($script.html() as string);

    const key = Object.keys(sigi_state.ItemModule)[0];
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
}

export const Tiktok: Command = {
    name: "tiktok",
    description: "Send tiktok video/slideshow via url",
    type: ApplicationCommandType.ChatInput,
    options: [
        new SlashCommandStringOption().setName('url').setDescription('tiktok url').setRequired(true),
        new SlashCommandBooleanOption().setName('spoiler').setDescription('spoiler').setRequired(false)
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            //@ts-ignore
            const url: string = interaction.options.getString('url', true).split('?')[0];
            //@ts-ignore
            const spoiler = interaction.options.getBoolean('spoiler', false);

            let id = url.split('/')[url.split('/').length - 1];
            if (id === '') {
                id = url.split('/')[url.split('/').length - 2];
            }

            if (!url.includes('tiktok')) {
                throw new Error('Not a tiktok url');
            }

            try {
                await downloadSlideshow(interaction, id, url, spoiler);
            } catch (slideshowError) {
                try {
                    await downloadVideo(interaction, id, url, spoiler);
                } catch (videoError) {
                    throw new Error(`\nSlideshow error: ${slideshowError}\nVideo error: ${videoError}`);
                }
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
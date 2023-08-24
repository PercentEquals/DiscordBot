import { ApplicationCommandType, AttachmentBuilder, Client, CommandInteraction, SlashCommandBooleanOption, SlashCommandStringOption } from "discord.js";
import { Command } from "../command";
import youtubedl from "youtube-dl-exec";
import fs from 'fs';

import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import cheerio from "cheerio";

ffmpeg.setFfmpegPath(ffmpegStatic as string);

async function downloadVideo(interaction: CommandInteraction, id: string, url: string, spoiler: boolean) {
    const result = await youtubedl(url, {
        format: 'mp4',
        output: `cache/${id}`
    });

    console.log(result);

    ffmpeg(`cache/${id}.mp4`)
        .videoCodec('libx264')
        .format('mp4')
        .save(`cache/${id}-ffmpeg.mp4`);

    while (fs.existsSync(`cache/${id}-ffmpeg.mp4`) === false) {}

    const file = new AttachmentBuilder(`cache/${id}-ffmpeg.mp4`);
    file.setName(`${id}.mp4`);
    file.setSpoiler(spoiler);

    await interaction.followUp({
        ephemeral: true,
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

    const imagesData = sigi_state.ItemModule[id].imagePost.images;

    imagesData.forEach((image: { imageURL: { urlList: string[] }}, i: number) => {
        const file = new AttachmentBuilder(image.imageURL.urlList[0]);
        file.setName(`${id}-${i}.jpg`);
        file.setSpoiler(spoiler);

        files.push(file);
    });

    let shouldFollowUp = true;

    const reply = (files: AttachmentBuilder[], shouldFollowUp: boolean) => {
        if (shouldFollowUp) {
            interaction.followUp({
                ephemeral: true,
                files
            });

            shouldFollowUp = false;
        } else {
            interaction.reply({
                ephemeral: true,
                files
            });
        }
    }

    while (files.length > 10) {
        const filesToSend = files.splice(0, 10);
        reply(filesToSend, shouldFollowUp);
    }
    reply(files, shouldFollowUp);
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
            const url = interaction.options.getString('url', true);
            //@ts-ignore
            const spoiler = interaction.options.getBoolean('spoiler', false);
            let id = url.split('/');
            id = id[id.length - 1];

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
                ephemeral: true,
                content: `\n${e}`
            })
        }
    }
};
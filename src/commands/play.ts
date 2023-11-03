import { ApplicationCommandType, Client, CommandInteraction, InternalDiscordGatewayAdapterCreator, SlashCommandStringOption } from "discord.js";
import { AudioPlayerStatus, NoSubscriberBehavior, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";

import { Command } from "../command";
import { getBestFormat } from "../common/formatFinder";

import ffmpeg from "fluent-ffmpeg";
import youtubedl, { YtResponse } from "youtube-dl-exec";
import { PassThrough } from "stream";
import logger from "../logger";

// https://github.com/discordjs/voice/issues/117
// https://github.com/discordjs/voice/issues/150
function getAudioStream(url: string) {
    logger.info('[ffmpeg] downloading audio stream');

    const FFMPEG_OPUS_ARGUMENTS = [
        '-analyzeduration',
        '0',
        '-loglevel',
        '0',
        '-acodec',
        'libopus',
        '-f',
        'opus',
        '-ar',
        '48000',
        '-ac',
        '2',
    ];

    const process = ffmpeg(url, { timeout: 0 });
    process.addOptions(FFMPEG_OPUS_ARGUMENTS);

    return process.pipe(new PassThrough({
        highWaterMark: 96000 / 8 * 30
    }));
}

const playAudio = async (url: string, interaction: CommandInteraction) => {
    let audioData = await youtubedl(url, {
        noWarnings: true,
        dumpSingleJson: true,
        getFormat: true,
    });

    //@ts-ignore - youtube-dl-exec videoData contains useless first line
    audioData = audioData.split('\n').slice(1).join('\n');
    audioData = JSON.parse(audioData as any) as YtResponse;

    const bestFormat = getBestFormat(url, audioData, true);

    if (!bestFormat) {
        throw new Error('No audio found!');
    }

    const audioStream = getAudioStream(bestFormat.url) as any;

    return new Promise(async (resolve, reject) => {
        try {
            let isRejected = false;

            //@ts-ignore - CommandInteraction contains member with voice
            const channelId = interaction.member?.voice?.channelId
            const guildId = interaction.guildId
            const adapterCreator = interaction.guild?.voiceAdapterCreator

            if (!channelId || !guildId || !adapterCreator) {
                reject('No voice channel found - join one or check permissions!');
            }

            const connection = joinVoiceChannel({
                channelId: channelId as string,
                guildId: guildId as string,
                adapterCreator: adapterCreator as InternalDiscordGatewayAdapterCreator
            });

            connection.on('error', error => {
                if (isRejected) return;

                connection.destroy();
                reject(error);
                isRejected = true;
            });

            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play,
                },
            });

            const resource = createAudioResource(audioStream, {
                metadata: {
                    title: audioData.title,
                },
            });

            player.on('error', error => {
                if (isRejected) return;

                player.stop();
                reject(error);
                isRejected = true;
            });

            player.on(AudioPlayerStatus.Idle, async (from, to) => {
                try {
                    if (isRejected) {
                        return;
                    }

                    if (!(from.status === AudioPlayerStatus.Playing && to.status === AudioPlayerStatus.Idle)) {
                        return;
                    }

                    const msg = await interaction.editReply({
                        content: `:white_check_mark: Finished playing audio: ${url}`,
                    });

                    connection.destroy();
                    msg.suppressEmbeds(true);

                    resolve(true);
                } catch (e) {
                    reject(e);
                }
            });

            connection.subscribe(player);
            player.play(resource);

            const msg = await interaction.followUp({
                ephemeral: false,
                content: `:speaker: Playing audio: ${url}`
            });

            msg.suppressEmbeds(true);
        } catch (e) {
            reject(e);
        }
    });
}

export const Play: Command = {
    name: "play",
    description: "Play audio on voice via url",
    type: ApplicationCommandType.ChatInput,
    options: [
        new SlashCommandStringOption().setName('url').setDescription('Tiktok link').setRequired(true),
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            //@ts-ignore
            const url: string = interaction.options.getString('url', true);

            await playAudio(url, interaction);
        } catch (e) {
            logger.error(e);

            await interaction.followUp({
                ephemeral: false,
                content: `:x: ${e}`
            })
        }
    }
};
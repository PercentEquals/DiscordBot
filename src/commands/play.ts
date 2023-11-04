import { ApplicationCommandType, Client, CommandInteraction, InternalDiscordGatewayAdapterCreator, SlashCommandStringOption } from "discord.js";
import { AudioPlayerStatus, NoSubscriberBehavior, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";

import { Command } from "../command";
import { getBestFormat } from "../common/formatFinder";
import { validateUrl } from "../common/validateUrl";
import logger from "../logger";

import ffmpeg from "fluent-ffmpeg";
import youtubedl, { YtResponse } from "youtube-dl-exec";
import { PassThrough } from "stream";

// https://github.com/discordjs/voice/issues/117
// https://github.com/discordjs/voice/issues/150
function getAudioStream(url: string, reject: (reason?: any) => void) {
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

    process.on('error', (error) => {
        reject(error);
    });

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
    
    return new Promise(async (resolve, reject) => {
        const audioStream = getAudioStream(bestFormat.url, reject) as any;
        
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

            const duration = new Date(0);
            duration.setSeconds(audioData.duration ?? 0);
            const durationString = audioData.duration ? duration.toISOString().substr(11, 8) : '??:??:??';

            player.on(AudioPlayerStatus.Idle, async (from, to) => {
                try {
                    if (isRejected) {
                        return;
                    }

                    if (!(from.status === AudioPlayerStatus.Playing && to.status === AudioPlayerStatus.Idle)) {
                        return;
                    }

                    const msg = await interaction.editReply({
                        content: `:white_check_mark: Finished playing audio: ${audioData.title} - ${audioData.uploader ?? "unknown"} | ${durationString}`,
                    });

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
                content: `:loud_sound: Playing audio: ${audioData.title} - ${audioData.uploader ?? "unknown"} | ${durationString}`
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

            validateUrl(new URL(url));

            await playAudio(url, interaction);
        } catch (e) {
            logger.error(e);

            await interaction.followUp({
                ephemeral: false,
                content: `:x: ${e}`
            });
        }
    }
};
import { ApplicationCommandType, Client, CommandInteraction, InternalDiscordGatewayAdapterCreator, SlashCommandStringOption } from "discord.js";
import { AudioPlayer, AudioPlayerState, AudioPlayerStatus, NoSubscriberBehavior, createAudioPlayer, createAudioResource, demuxProbe, joinVoiceChannel } from "@discordjs/voice";

import { Command } from "../command";
import { getBestFormat } from "../common/formatFinder";
import { validateUrl } from "../common/validateUrl";
import logger from "../logger";

import ffmpeg from "fluent-ffmpeg";
import youtubedl, { YtResponse } from "youtube-dl-exec";
import { PassThrough } from "stream";

let currentlyPlayingCache: {
    [guildIdAndChannelId: string]: {
        url: string,
        audioStream: ffmpeg.FfmpegCommand,
        audioPlayer: AudioPlayer
    }
} = {};

// https://github.com/discordjs/voice/issues/117
// https://github.com/discordjs/voice/issues/150
export function getAudioStream(url: string, startTimeMs: number, reject: (reason?: any) => void) {
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
    process.setStartTime(Math.ceil(startTimeMs / 1000));

    process.on('error', (error) => {
        reject(error);
    });

    return process.pipe(new PassThrough({
        highWaterMark: 96000 / 8 * 30
    }));
}

export async function probeAndCreateResource(readableStream: any, title: string) {
    const { stream, type } = await demuxProbe(readableStream);
    return createAudioResource(stream, {
        inputType: type,
        metadata: {
            title
        }
    });
}

export function cacheCurrentlyPlaying(
    guildId: string,
    channelId: string,
    url: string,
    audioStream: ffmpeg.FfmpegCommand,
    audioPlayer: AudioPlayer
) {
    logger.debug(`[ffmpeg] currently playing: ${guildId} ${channelId}, ${currentlyPlayingCache[guildId + channelId]}`);

    currentlyPlayingCache[guildId + channelId] = {
        url,
        audioStream,
        audioPlayer
    }
}

export function clearCurrentlyPlaying(guildId: string, channelId: string) {
    delete currentlyPlayingCache[guildId + channelId];
}

export function getCurrentlyPlaying(guildId: string, channelId: string) {
    logger.debug(`[ffmpeg] getting: ${guildId} ${channelId}, ${currentlyPlayingCache[guildId + channelId]}`);

    return currentlyPlayingCache[guildId + channelId];
}

const playAudio = async (url: string, startTimeMs: number, interaction: CommandInteraction) => {
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

    //@ts-ignore - CommandInteraction contains member with voice
    const channelId = interaction.member?.voice?.channelId
    const guildId = interaction.guildId as string
    const adapterCreator = interaction.guild?.voiceAdapterCreator

    if (!channelId || !guildId || !adapterCreator) {
        throw new Error('No voice channel found - join one or check permissions!');
    }

    let isPromiseRejected = false;

    const duration = new Date(0);
    duration.setSeconds(audioData.duration ?? 0);
    const durationString = audioData.duration ? duration.toISOString().substr(11, 8) : '??:??:??';

    return new Promise(async (resolve, reject) => {
        const onError = (error: Error) => {
            if (isPromiseRejected) return;
            reject(error);
            isPromiseRejected = true;
            clearCurrentlyPlaying(guildId, channelId);
        }

        const onFinished = async (from: AudioPlayerState, to: AudioPlayerState) => {
            try {
                if (isPromiseRejected) {
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
        }

        try {
            const audioStream = getAudioStream(bestFormat.url, startTimeMs, reject) as any;

            const connection = joinVoiceChannel({
                channelId: channelId as string,
                guildId: guildId as string,
                adapterCreator: adapterCreator as InternalDiscordGatewayAdapterCreator
            });
            connection.on('error', onError);

            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play,
                },
            });
            player.on('error', onError);
            player.on(AudioPlayerStatus.Idle, onFinished);

            const resource = await probeAndCreateResource(audioStream, audioData.title);
            connection.subscribe(player);
            player.play(resource);

            cacheCurrentlyPlaying(guildId, channelId, bestFormat.url, audioStream, player);

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

export function getStartTimeInMs(startTime: string) {
    if (!startTime) {
        return 0;
    }

    const startTimeParts = startTime.replace('-', '').split(':');

    if (startTimeParts.length !== 3) {
        return 0;
    }

    const startTimePartsNumbers = startTimeParts.map((part) => {
        return parseInt(part);
    });

    if (startTimePartsNumbers.some((part) => isNaN(part))) {
        return 0;
    }

    const startTimeMs = startTimePartsNumbers[0] * 60 * 60 * 1000 + startTimePartsNumbers[1] * 60 * 1000 + startTimePartsNumbers[2] * 1000;

    return startTimeMs;
}

export const Play: Command = {
    name: "play",
    description: "Play audio on voice via url",
    type: ApplicationCommandType.ChatInput,
    options: [
        new SlashCommandStringOption().setName('url').setDescription('Tiktok link').setRequired(true),
        new SlashCommandStringOption().setName('start').setDescription('Start time in 00:00:00 format').setRequired(false)
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            //@ts-ignore
            const url: string = interaction.options.getString('url', true);
            //@ts-ignore
            const startTime: string = interaction.options.getString('start', false);

            validateUrl(new URL(url));

            await playAudio(url, getStartTimeInMs(startTime), interaction);
        } catch (e) {
            logger.error(e);

            await interaction.followUp({
                ephemeral: false,
                content: `:x: ${e}`
            });
        }
    }
};
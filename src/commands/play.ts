import { ApplicationCommandType, Client, CommandInteraction, InternalDiscordGatewayAdapterCreator, SlashCommandStringOption } from "discord.js";
import { AudioPlayerState, AudioPlayerStatus, NoSubscriberBehavior, createAudioPlayer, createAudioResource, demuxProbe, joinVoiceChannel } from "@discordjs/voice";

import { Command } from "../command";
import { getBestFormat } from "../common/formatFinder";
import { extractUrl, validateUrl } from "../common/validateUrl";
import { getVolume, getStartTimeInMs, getDuration } from "../common/audioUtils";

import { cacheCurrentlyPlaying, clearCurrentlyPlaying } from "../global/currentlyPlayingCache";

import logger from "../logger";

import ffmpeg, { FfmpegCommand } from "fluent-ffmpeg";
import youtubedl, { YtResponse } from "youtube-dl-exec";
import { PassThrough } from "stream";

// https://github.com/discordjs/voice/issues/117
// https://github.com/discordjs/voice/issues/150
export function getAudioStream(url: string, startTimeMs: number, volume: number, reject: (reason?: any) => void): FfmpegCommand {
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
    process.audioFilters(`volume=${volume}`);

    process.on('error', (error) => {
        reject(error);
    });

    return process.pipe(new PassThrough({
        highWaterMark: 96000 / 8 * 30
    })) as unknown as FfmpegCommand;
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

function getReplyString(audioData: YtResponse) {
    return `${audioData.title} - ${audioData.uploader ?? "unknown"} | ${getDuration(audioData.duration)}`;
}

const playAudio = async (url: string, startTimeMs: number, volume: number, interaction: CommandInteraction) => {
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

    clearCurrentlyPlaying(guildId, channelId);
    let isPromiseRejected = false;

    return new Promise(async (resolve, reject) => {
        const onError = (error: Error) => {
            if (isPromiseRejected) return;
            reject(error);
            isPromiseRejected = true;
            clearCurrentlyPlaying(guildId, channelId);
        }

        const onFinished = async (from: AudioPlayerState, to: AudioPlayerState) => {
            if (isPromiseRejected) {
                return;
            }

            if (!(from.status === AudioPlayerStatus.Playing && to.status === AudioPlayerStatus.Idle)) {
                return;
            }

            const msg = await interaction.editReply({
                content: `:white_check_mark: Finished playing audio: ${getReplyString(audioData)}`,
            });

            msg.suppressEmbeds(true);
            resolve(true);
        }

        try {
            const audioStream = getAudioStream(bestFormat.url, startTimeMs, volume, reject);

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

            cacheCurrentlyPlaying(guildId, channelId, bestFormat.url, audioStream, player, volume, startTimeMs);

            const msg = await interaction.followUp({
                ephemeral: false,
                content: `:loud_sound: Playing audio: ${getReplyString(audioData)}`
            });

            msg.suppressEmbeds(true);
        } catch (e) {
            clearCurrentlyPlaying(guildId, channelId);
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
        new SlashCommandStringOption().setName('volume').setDescription('Audio volume [0-100]').setRequired(false),
        new SlashCommandStringOption().setName('start').setDescription('Start time in 00:00:00 format').setRequired(false)
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            //@ts-ignore
            const url: string = extractUrl(interaction.options.getString('url', true));
            //@ts-ignore
            const startTime: string = interaction.options.getString('start', false);
            //@ts-ignore
            const volume: string = interaction.options.getString('volume', false);

            validateUrl(new URL(url));

            await playAudio(url, getStartTimeInMs(startTime), getVolume(volume), interaction);
        } catch (e) {
            logger.error(e);

            await interaction.followUp({
                ephemeral: false,
                content: `:x: ${e}`
            });
        }
    }
};
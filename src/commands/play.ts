import { ApplicationCommandType, Client, CommandInteraction, InternalDiscordGatewayAdapterCreator, SlashCommandBooleanOption, SlashCommandStringOption } from "discord.js";
import { AudioPlayerState, AudioPlayerStatus, NoSubscriberBehavior, createAudioPlayer, createAudioResource, demuxProbe, joinVoiceChannel } from "@discordjs/voice";

import { Command } from "../command";
import { getBestFormat } from "../common/formatFinder";
import { extractUrl, validateUrl } from "../common/validateUrl";
import { getVolume, getStartTimeInMs, getDuration } from "../common/audioUtils";
import { reportError } from "../common/errorHelpers";

import { cacheCurrentlyPlaying, clearCurrentlyPlaying, getCurrentlyPlaying, getNextFromQueue, prependToQueue, pushToQueue } from "../global/currentlyPlayingCache";

import logger from "../logger";

import ffmpeg, { FfmpegCommand } from "fluent-ffmpeg";
import { PassThrough } from "stream";
import { YoutubeDlData, getDataFromYoutubeDl, getTiktokAudioData } from "../common/sigiState";

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

export async function probeAndCreateResource(readableStream: any) {
    const { stream, type } = await demuxProbe(readableStream);
    return createAudioResource(stream, {
        inputType: type,
    });
}

function getReplyString(audioData: YoutubeDlData) {
    if (audioData.ytResponse) {
        return `${audioData.ytResponse.title.substring(0, 100)} - ${audioData.ytResponse.uploader ?? "unknown"} | ${getDuration(audioData.ytResponse.duration)}`;
    } else if (audioData.tiktokApi) {
        return `${audioData.tiktokApi.aweme_list[0].desc.substring(0, 100)} - ${audioData.tiktokApi.aweme_list[0].author.nickname} | ${getDuration(getTiktokAudioData(audioData.tiktokApi).duration)}`;
    }
}

const playAudio = async (
    url: string,
    audioData: YoutubeDlData,
    channelId: string,
    guildId: string,
    adapterCreator: InternalDiscordGatewayAdapterCreator,
    startTimeMs: number,
    volume: number,
    loop: boolean,
    interaction: CommandInteraction,
    fromQueue: boolean = false
) => {
    const bestFormat = getBestFormat(url, audioData);
        
    if (!bestFormat) {
        throw new Error('No audio found!');
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
            if (isPromiseRejected || !(from.status === AudioPlayerStatus.Playing && to.status === AudioPlayerStatus.Idle)) {
                return;
            }

            const isCurrentlyPlaying = !!getCurrentlyPlaying(guildId, channelId);
            const audioVolume = getCurrentlyPlaying(guildId, channelId)?.volume;
            const startTimeInMs = getCurrentlyPlaying(guildId, channelId)?.startTimeInMs;

            clearCurrentlyPlaying(guildId, channelId);
            const msg = await interaction.editReply({
                content: `:white_check_mark: Finished playing audio: ${getReplyString(audioData)}`,
            });
            msg.suppressEmbeds(true);

            if (loop && isCurrentlyPlaying) {
                prependToQueue(guildId, channelId, url, audioData, audioVolume, startTimeInMs, loop, interaction);
            }

            const queue = getNextFromQueue(guildId, channelId);
            if (queue) {
                await playAudio(queue.url, queue.audioData, channelId, guildId, adapterCreator, queue.startTimeInMs, queue.volume, queue.loop, queue.interaction, true);
            }

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

            const resource = await probeAndCreateResource(audioStream);
            connection.subscribe(player);
            player.play(resource);

            cacheCurrentlyPlaying(guildId, channelId, url, audioStream, player, volume, startTimeMs);

            const playIcon = loop ? ':loop:' : ':loud_sound:';

            if (!fromQueue) {
                const msg = await interaction.followUp({
                    ephemeral: false,
                    content: `${playIcon} Playing audio: ${getReplyString(audioData)}`
                });

                msg.suppressEmbeds(true);
            } else {
                interaction.editReply({
                    content: `${playIcon} Playing audio: ${getReplyString(audioData)}`
                });
            }
        } catch (e) {
            clearCurrentlyPlaying(guildId, channelId);
            reject(e);
        }
    });
}

const queueAudio = async (
    url: string,
    audioData: YoutubeDlData,
    channelId: string,
    guildId: string,
    startTimeMs: number,
    volume: number,
    loop: boolean,
    interaction: CommandInteraction
) => {
    const bestFormat = getBestFormat(url, audioData);
        
    if (!bestFormat) {
        throw new Error('No audio found!');
    }

    pushToQueue(guildId, channelId, url, audioData, volume, startTimeMs, loop, interaction);

    await interaction.followUp({
        ephemeral: false,
        content: `:information_source: Queued audio: ${getReplyString(audioData)}`
    });
}

export const Play: Command = {
    name: "play",
    description: "Play audio on voice via url",
    type: ApplicationCommandType.ChatInput,
    options: [
        new SlashCommandStringOption().setName('url').setDescription('Tiktok link').setRequired(true),
        new SlashCommandBooleanOption().setName('force').setDescription('Should force play instead of adding to queue?').setRequired(false),
        new SlashCommandStringOption().setName('volume').setDescription('Audio volume [0-100]').setRequired(false),
        new SlashCommandStringOption().setName('start').setDescription('Start time in 00:00:00 format').setRequired(false),
        new SlashCommandBooleanOption().setName('loop').setDescription('Should audio be looped until stopped?').setRequired(false)
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            //@ts-expect-error - Bad types
            const url: string = await extractUrl(interaction.options.getString('url', true));
            //@ts-expect-error - Bad types
            const force: boolean = interaction.options.getBoolean('force', false);
            //@ts-expect-error - Bad types
            const startTime: string = interaction.options.getString('start', false);
            //@ts-expect-error - Bad types
            const volume: string = interaction.options.getString('volume', false);
            //@ts-expect-error - Bad types
            const loop: boolean = interaction.options.getBoolean('loop', false);

            validateUrl(new URL(url));
        
            //@ts-ignore - CommandInteraction contains member with voice
            const channelId = interaction.member?.voice?.channelId as string;
            const guildId = interaction.guildId as string;
            const adapterCreator = interaction.guild?.voiceAdapterCreator;
        
            if (!channelId || !guildId || !adapterCreator) {
                throw new Error('No voice channel found - join one or check permissions!');
            }

            let audioData = await getDataFromYoutubeDl(url);

            if (force || !getCurrentlyPlaying(guildId, channelId)) {
                await playAudio(url, audioData, channelId, guildId, adapterCreator, getStartTimeInMs(startTime), getVolume(volume), loop, interaction);
            } else {
                await queueAudio(url, audioData, channelId, guildId, getStartTimeInMs(startTime), getVolume(volume), loop, interaction);
            }
        } catch (e) {
            await reportError(interaction, e);
        }
    }
};
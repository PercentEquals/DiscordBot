import { AudioPlayer } from "@discordjs/voice";
import { CommandInteraction } from "discord.js";
import { FfmpegCommand } from "fluent-ffmpeg";

type CacheData = {
    url: string,
    audioStream: FfmpegCommand,
    audioPlayer: AudioPlayer,
    volume: number,
    startTimeInMs: number,
    playStartTime: number,
}

let currentlyPlayingCache: {
    [guildIdAndChannelId: string]: CacheData
} = {};

let audioQueue: {
    [guildIdAndChannelId: string]: {
        url: string,
        volume: number,
        startTimeInMs: number,
        interaction: CommandInteraction
    }[]
} = {};

export function pushToQueue(
    guildId: string,
    channelId: string,
    url: string,
    volume: number,
    startTimeInMs: number,
    interaction: CommandInteraction
) {
    if (!audioQueue[guildId + channelId]) {
        audioQueue[guildId + channelId] = [];
    }

    audioQueue[guildId + channelId].push({
        url,
        volume,
        startTimeInMs,
        interaction
    })
}

export function popQueue(guildId: string, channelId: string) {
    if (!audioQueue[guildId + channelId]) {
        return null;
    }

    return audioQueue[guildId + channelId].pop();
}

export function cacheCurrentlyPlaying(
    guildId: string,
    channelId: string,
    url: string,
    audioStream: FfmpegCommand,
    audioPlayer: AudioPlayer,
    volume: number,
    startTimeInMs: number
) {
    currentlyPlayingCache[guildId + channelId] = {
        url,
        audioStream,
        audioPlayer,
        volume,
        startTimeInMs,
        playStartTime: process.hrtime()[0]
    }
}

export function clearQueue(guildId: string, channelId: string) {
    delete audioQueue[guildId + channelId];
}

export function clearCurrentlyPlaying(guildId: string, channelId: string) {
    getCurrentlyPlaying(guildId, channelId)?.audioStream?.emit('end');
    getCurrentlyPlaying(guildId, channelId)?.audioPlayer?.stop();

    delete currentlyPlayingCache[guildId + channelId];
}

export function getCurrentlyPlaying(guildId: string, channelId: string) {
    return currentlyPlayingCache[guildId + channelId];
}
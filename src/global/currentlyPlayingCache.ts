import { AudioPlayer } from "@discordjs/voice";
import { FfmpegCommand } from "fluent-ffmpeg";
import { clearInterval } from "timers";

let currentlyPlayingCache: {
    [guildIdAndChannelId: string]: {
        url: string,
        audioStream: FfmpegCommand,
        audioPlayer: AudioPlayer,
        volume: number,
        startTimeInMs: number,
        playStartTime: number,
        timer?: NodeJS.Timeout
    }
} = {};

export function cacheCurrentlyPlaying(
    guildId: string,
    channelId: string,
    url: string,
    audioStream: FfmpegCommand,
    audioPlayer: AudioPlayer,
    volume: number,
    startTimeInMs: number,
    timer?: NodeJS.Timeout
) {
    currentlyPlayingCache[guildId + channelId] = {
        url,
        audioStream,
        audioPlayer,
        volume,
        startTimeInMs,
        playStartTime: process.hrtime()[0],
        timer
    }
}

export function clearCurrentlyPlaying(guildId: string, channelId: string) {
    clearInterval(currentlyPlayingCache[guildId + channelId]?.timer);
    clearTimeout(currentlyPlayingCache[guildId + channelId]?.timer);

    getCurrentlyPlaying(guildId, channelId)?.audioStream.emit('end');
    getCurrentlyPlaying(guildId, channelId)?.audioPlayer.stop();

    delete currentlyPlayingCache[guildId + channelId];
}

export function getCurrentlyPlaying(guildId: string, channelId: string) {
    return currentlyPlayingCache[guildId + channelId];
}
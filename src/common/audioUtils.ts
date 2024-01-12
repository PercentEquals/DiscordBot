import { CommandInteraction } from "discord.js";
import { getAudioStream, probeAndCreateResource } from "../commands/play";
import { getCurrentlyPlaying } from "../global/currentlyPlayingCache";

export function getDuration(duration: number | null) {
    const durationDate = new Date(0);
    durationDate.setSeconds(duration ?? 0);
    return duration ? durationDate.toISOString().substr(11, 8) : '??:??:??';
}

export function getStartTimeInMs(startTime: string) {
    if (!startTime) {
        return 0;
    }

    const startTimeParts = startTime.replace('-', '').split(':');

    if (startTimeParts.length < 2 || startTimeParts.length > 3 || startTimeParts.some((part) => part.length !== 2)) {
        return 0;
    }

    const startTimePartsNumbers = startTimeParts.map((part) => {
        try {
            return parseInt(part);
        } catch (e) {
            return NaN;
        }
    });

    if (startTimePartsNumbers.some((part) => isNaN(part))) {
        return 0;
    }

    if (startTimeParts.length === 2) {
        return startTimePartsNumbers[0] * 60 * 1000 + startTimePartsNumbers[1] * 1000;
    }
    
    return startTimePartsNumbers[0] * 60 * 60 * 1000 + startTimePartsNumbers[1] * 60 * 1000 + startTimePartsNumbers[2] * 1000;
}

export function getVolume(volume: string | null) {
    try {
        if (!volume) return 1;

        const volumeNumber = parseInt(volume);
        if (isNaN(volumeNumber)) return 1;
        if (volumeNumber > 100) return 1;

        return Math.abs(volumeNumber / 100);
    } catch (e) {
        return 1;
    }
}

export async function restartAudioStream(interaction: CommandInteraction, volume: string | null, startTime: string | null) {
    //@ts-ignore - CommandInteraction contains member with voice
    const channelId = interaction.member?.voice?.channelId
    const guildId = interaction.guildId as string

    const currentlyPlaying = getCurrentlyPlaying(guildId, channelId);

    if (!currentlyPlaying) {
        await interaction.followUp({
            ephemeral: false,
            content: `:information_source: Nothing is playing!`
        });

        return;
    }

    const newVolume = volume ? getVolume(volume) : currentlyPlaying.volume;

    const timeDiff = (process.hrtime()[0] - currentlyPlaying.playStartTime) * 1000;
    const startTimeInMs = startTime ? getStartTimeInMs(startTime) : currentlyPlaying.startTimeInMs + timeDiff;

    currentlyPlaying.audioStream.emit('end');

    const audioStream = await new Promise(async (resolve, reject) => {
        resolve(getAudioStream(currentlyPlaying.url, startTimeInMs, newVolume, reject));
    });
    const resource = await probeAndCreateResource(audioStream);

    currentlyPlaying.audioPlayer.play(resource);
    currentlyPlaying.startTimeInMs = startTimeInMs;
    currentlyPlaying.volume = newVolume;
}
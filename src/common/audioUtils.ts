import { YoutubeDlData, getTiktokAudioData } from "./sigiState";

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

export function getReplyString(audioData: YoutubeDlData) {
    if (audioData.ytResponse) {
        return `${audioData.ytResponse.title.substring(0, 100)} - ${audioData.ytResponse.uploader ?? "unknown"} | ${getDuration(audioData.ytResponse.duration)}`;
    } else if (audioData.tiktokApi) {
        return `${audioData.tiktokApi.aweme_list[0].desc.substring(0, 100)} - ${audioData.tiktokApi.aweme_list[0].author.nickname} | ${getDuration(getTiktokAudioData(audioData.tiktokApi).duration)}`;
    }
}
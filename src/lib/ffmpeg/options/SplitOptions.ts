import { FfmpegCommand, FfprobeData } from "fluent-ffmpeg";
import IOptions from "./IOptions";

import {DISCORD_LIMIT} from "src/constants/discordlimit";
import {MAX_SPLIT_FILES} from "src/constants/maxsplitfiles";
import logger from "src/logger";

export default class SplitOptions implements IOptions {
    constructor(
        private startTime: number,
        private duration: number,
    ) {}

    addInput(process: FfmpegCommand): void {

    }

    addOutput(process: FfmpegCommand): void {
        process.addOptions([
            `-ss ${this.startTime}`,
            `-t ${this.duration}`
        ]);

        process.addOptions([
            "-c copy",
        ]);
    }

    getIndex() {
        return this.startTime;
    }
}

export function createSplitOptions(filesize: number, targetFilesize: number, ffprobe: FfprobeData | null): SplitOptions[] {
    if (!ffprobe || !ffprobe.format.duration) {
        throw new Error("Invalid or malformed file!");
    }

    const splitDurations: number[] = [];

    const marginFactor = 2.5;
    const totalDuration = ffprobe.format.duration;
    const scaleFactor = filesize / targetFilesize;
    const splitDuration = Math.ceil(totalDuration / scaleFactor / marginFactor);

    if (splitDuration >= 1) {
        let start = 0;
        while (start < totalDuration) {
            splitDurations.push(Math.min(splitDuration, totalDuration - start));
            start += splitDuration;
        }
    }

    if (splitDurations.length > MAX_SPLIT_FILES || splitDurations.length < 0) {
        logger.info(`[bot] found format is too large for splitting (${splitDurations.length} > ${MAX_SPLIT_FILES})`);

        throw new Error(`No format found under ${DISCORD_LIMIT / 1024 / 1024}MB`);
    }

    return splitDurations.map((duration, i) => {
        const startTime = splitDurations.slice(0, i).reduce((a, b) => a + b, 0);
        return new SplitOptions(startTime, duration);
    });
}
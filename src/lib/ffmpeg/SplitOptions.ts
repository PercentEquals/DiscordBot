import { FfmpegCommand, FfprobeData } from "fluent-ffmpeg";
import IOptions from "./IOptions";

import {DISCORD_LIMIT} from "../../constants/discordlimit";
import {MAX_SPLIT_FILES} from "../../constants/maxsplitfiles";

export default class SplitOptions implements IOptions {
    private splitDurations: number[] = [];
    private files: string[] = [];

    constructor(
        private id: string,
        filesize: number,
        targetFilesize: number,
        ffprobe: FfprobeData | null
    ) {
        if (!ffprobe || !ffprobe.format.duration) {
            throw new Error("Invalid or malformed file!");
        }

        const marginFactor = 2.5;
        const totalDuration = ffprobe.format.duration;
        const scaleFactor = filesize / targetFilesize;
        const splitDuration = Math.ceil(totalDuration / scaleFactor / marginFactor);

        if (splitDuration >= 1) {
            let start = 0;
            while (start < totalDuration) {
                this.splitDurations.push(Math.min(splitDuration, totalDuration - start));
                start += splitDuration;
            }
        }

        if (this.splitDurations.length > MAX_SPLIT_FILES) {
            throw new Error(`No format found under ${DISCORD_LIMIT / 1024 / 1024}MB`);
        }
    }

    addInput(process: FfmpegCommand): void {

    }

    addOutput(process: FfmpegCommand): void {
        if (this.splitDurations.length > 0) {
            for (let i = 0; i < this.splitDurations.length; i++) {
                this.files.push(`cache/${this.id}_${i + 1}.mp4`);

                const startTime = this.splitDurations.slice(0, i).reduce((a, b) => a + b, 0);
                const duration = this.splitDurations[i];
                process
                    .output(this.files[i])
                    .addOptions([
                        `-ss ${startTime}`,
                        `-t ${duration}`
                    ]);
            }
        }
    }

    getFiles(): string[] {
        return this.files;
    }
}

import { FfmpegCommand, FfprobeData } from "fluent-ffmpeg";
import IOptions from "./IOptions";
import {DISCORD_LIMIT} from "src/constants/discordlimit";
import logger from "src/logger";
import {MAX_COMPRESSION_SCALE} from "src/constants/maxcompressionscale";

export default class CompressOptions implements IOptions {
    private options: string[] = [];

    constructor(
        filesize: number,
        targetFilesize: number,
        ffprobe: FfprobeData | null
    ) {
        if (filesize > MAX_COMPRESSION_SCALE * DISCORD_LIMIT) {
            logger.info(`[bot] found format is too large for compression (${filesize} > ${MAX_COMPRESSION_SCALE * DISCORD_LIMIT})`);

            throw new Error(`No format found under ${DISCORD_LIMIT / 1024 / 1024}MB`);
        }

        let scale = Math.max(Math.ceil(filesize / targetFilesize), 2);

        if (scale % 2 != 0) {
            scale += 1;
        }

        this.options.push(...[
            `-vf scale=-2:ih/${scale}`,
        ]);

        if (ffprobe && ffprobe.format.bit_rate) {
            this.options.push(...[
                `-b:v ${Math.max(ffprobe.format.bit_rate / 2, 1000)}`
            ]);
        }
    }

    addInput(process: FfmpegCommand): void {
        
    }

    addOutput(process: FfmpegCommand): void {
        process.addOptions(this.options);
    }
}
import { FfmpegCommand, FfprobeData } from "fluent-ffmpeg";
import IOptions from "./IOptions";

export default class CompressOptions implements IOptions {
    private options: string[] = [];

    constructor(
        filesize: number,
        targetFilesize: number,
        ffprobe: FfprobeData | null
    ) {
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
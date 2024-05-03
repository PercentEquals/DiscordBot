import { FfmpegCommand } from "fluent-ffmpeg";
import IOptions from "./IOptions";

export default class CompressOptions implements IOptions {
    private options: string[] = [];

    constructor(
        filesize: number,
        targetFilesize: number
    ) {
        const scale = Math.max(Math.ceil(filesize / targetFilesize), 2);

        this.options.push(...[
            `-vf scale=iw/${scale}:-2`,
            `-b:a 64k`
        ]);
    }

    addInput(process: FfmpegCommand): void {
        
    }

    addOutput(process: FfmpegCommand): void {
        process.addOptions(this.options);
    }
}
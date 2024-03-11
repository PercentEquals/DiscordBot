import { FfmpegCommand } from "fluent-ffmpeg";
import IOptions from "./IOptions";

export default class CompressOptions implements IOptions {
    private options = [
        "-vf scale=iw/4:ih/4"
    ]

    addInput(process: FfmpegCommand): void {
        
    }

    addOutput(process: FfmpegCommand): void {
        process.addOptions(this.options);
    }
}
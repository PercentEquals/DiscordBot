import { FfmpegCommand } from "fluent-ffmpeg";
import IOptions from "./IOption";

export default class CompressOptions implements IOptions {
    private options = [
        "-vf scale=iw/4:ih/4"
    ]

    addToProcess(process: FfmpegCommand): void {
        process.addOutputOptions(this.options);
    }
}
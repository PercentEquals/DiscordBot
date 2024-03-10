import { FfmpegCommand } from "fluent-ffmpeg";
import IOptions from "./IOption";

export default class PipeOptions implements IOptions {
    private options = [
        "-f ismv",
        "-movflags frag_keyframe+empty_moov",
    ]

    addToProcess(process: FfmpegCommand): void {
        process.addOutputOptions(this.options);
    }
}
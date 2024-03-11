import { FfmpegCommand } from "fluent-ffmpeg";
import IOptions from "./IOptions";

export default class PipeOptions implements IOptions {
    private options = [
        "-f ismv",
        "-movflags faststart+frag_keyframe+empty_moov",
    ]

    addInput(process: FfmpegCommand): void {
        
    }

    addOutput(process: FfmpegCommand): void {
        process.addOptions(this.options);
    }
}
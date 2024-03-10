import { FfmpegCommand } from "fluent-ffmpeg";
import IOptions from "./IOption";

export default class UltrafastOptions implements IOptions {
    private options = [
        "-preset ultrafast",
    ]

    addToProcess(process: FfmpegCommand): void {
        process.addOption(this.options);
    }
}
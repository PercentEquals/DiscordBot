import { FfmpegCommand } from "fluent-ffmpeg";
import IOptions from "./IOptions";

export default class FileOptions implements IOptions {
    constructor(
        private id: string,
    ) {
    }

    addInput(process: FfmpegCommand): void {
        
    }

    addOutput(process: FfmpegCommand): void {
        process.output(`cache/${this.id}_ffmpeg.mp4`);
    }

    getFiles(): string[] {
        return [`cache/${this.id}_ffmpeg.mp4`];
    }
}
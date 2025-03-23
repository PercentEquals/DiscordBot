import { FfmpegCommand } from "fluent-ffmpeg";

export default interface IOptions {
    addInput(process: FfmpegCommand): void;
    addOutput(process: FfmpegCommand): void;

    getFiles?(): string[];
}
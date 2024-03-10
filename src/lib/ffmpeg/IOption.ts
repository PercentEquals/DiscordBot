import { FfmpegCommand } from "fluent-ffmpeg";

export default interface IOptions {
    addToProcess(process: FfmpegCommand): void;
}
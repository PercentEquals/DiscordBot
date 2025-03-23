import { FfmpegCommand } from "fluent-ffmpeg";
import IOptions from "./IOptions";

export default class UltraFastOptions implements IOptions {
    private options = [
        "-preset ultrafast",
    ]

    addInput(process: FfmpegCommand): void {
        
    }
    
    addOutput(process: FfmpegCommand): void {
        process.addOption(this.options);
    }
}
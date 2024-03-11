import { FfmpegCommand } from "fluent-ffmpeg";
import IOptions from "./IOptions";

export default class AudioStreamOptions implements IOptions {
    // https://github.com/discordjs/voice/issues/117
    // https://github.com/discordjs/voice/issues/150
    private options = [
        '-analyzeduration',
        '0',
        '-loglevel',
        '0',
        '-acodec',
        'libopus',
        '-f',
        'opus',
        '-ar',
        '48000',
        '-ac',
        '2',
    ];

    constructor(
        private startTimeMs: number,
        private volume: number
    ) {}

    addInput(process: FfmpegCommand): void {
        process.addOptions(this.options);
        process.setStartTime(Math.ceil(this.startTimeMs / 1000));
        process.audioFilters(`volume=${this.volume}`);
    }
    
    addOutput(process: FfmpegCommand): void {
        
    }
}
import { FfmpegCommand } from "fluent-ffmpeg";

import IOptions from "./IOptions";
import IExtractor from "../extractors/IExtractor";

// https://stackoverflow.com/questions/12938581/ffmpeg-mux-video-and-audio-from-another-video-mapping-issue
export default class SlideshowOptions implements IOptions {
    constructor(
        filesLength: number,
        extractor: IExtractor,
        withAudio: boolean
    ) {
        if (withAudio) {
            filesLength -= 1;
        }

        let duration = extractor.getDuration();

        if (duration <= 0) {
            duration = 1;
        }

        let r = filesLength / duration;

        if (r <= 0) {
            r = 1;
        }

        this.inputOptions = [
            `-framerate ${filesLength}`,
            `-loop 1`
        ]

        this.outputOptions.push(...[
            `-t ${duration}`,
        ])
    }

    private inputOptions: string[] = [];
    private outputOptions = [
        '-vf scale=640:-2',
        '-pix_fmt yuv420p',
        '-c:a copy',
        '-shortest',
        '-preset ultrafast',
    ]

    addInput(process: FfmpegCommand): void {
        process.addOptions(this.inputOptions);
    }

    addOutput(process: FfmpegCommand): void {
        process.addOptions(this.outputOptions);
    }
}
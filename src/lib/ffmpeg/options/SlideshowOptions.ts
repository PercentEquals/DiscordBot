import { FfmpegCommand } from "fluent-ffmpeg";

import IOptions from "./IOptions";
import IExtractor from "src/lib/extractors/providers/IExtractor";

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

        let duration = Math.min(
            filesLength * 3,
            extractor.getDuration()
        );

        if (duration <= 0) {
            duration = 1;
        }

        this.inputOptions = [
            `-loglevel error`,
            `-framerate 1/${Math.max(duration / filesLength, 0.1)}`,
            `-loop 1`
        ]

        this.outputOptions.push(...[
            `-t ${extractor.getDuration()}`,
            `-r 30`
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
import { FfmpegCommand } from "fluent-ffmpeg";
import IOptions from "./IOptions";

import { getTiktokAudioData } from "../../common/sigiState";
import { TiktokApi } from "../../../types/tiktokApi";

// https://stackoverflow.com/questions/12938581/ffmpeg-mux-video-and-audio-from-another-video-mapping-issue
export default class SlideshowOptions implements IOptions {
    constructor(
        filesLength: number,
        tiktokApi: TiktokApi,
        withAudio: boolean
    ) {
        if (withAudio) {
            filesLength -= 1;
        }

        let duration = getTiktokAudioData(tiktokApi).duration;

        if (duration <= 0) {
            duration = 1;
        }

        let r = Math.round(filesLength / duration);

        if (r <= 1) {
            r = 2;
        }

        this.inputOptions = [
            `-framerate 30`,
            `-loop 1`
        ]
    }

    private inputOptions: string[] = [];
    private outputOptions = [
        '-pix_fmt yuv420p',
        '-preset ultrafast',
        `-r 6`
    ]

    addInput(process: FfmpegCommand): void {
        process.addOptions(this.inputOptions);
    }

    addOutput(process: FfmpegCommand): void {
        process.addOptions(this.outputOptions);
    }
}
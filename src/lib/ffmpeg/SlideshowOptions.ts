import { FfmpegCommand } from "fluent-ffmpeg";
import IOptions from "./IOption";

// export default class SlideshowOptions implements IOptions {
//     private inputOptions = [
//         `-framerate 1`,
//         `-r ${r}`,
//         `-loop 1`,
//         `-t ${duration}`,
//     ]

//     private outputOptions = [
//         '-vf scale=800:400',
//         '-pix_fmt yuv420p',
//         '-c:a copy',
//         '-shortest',
//         '-preset ultrafast'
//     ]

//     addToProcess(process: FfmpegCommand): void {
//         process.addInputOptions(this.inputOptions);
//         process.addOutputOptions(this.outputOptions);
//     }
// }
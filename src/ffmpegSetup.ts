import ffmpegStatic from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";

export async function setupFfmpeg() {
    fs.mkdirSync('cache', { recursive: true });
    ffmpeg.setFfmpegPath(ffmpegStatic as string);
    console.log('[ffmpeg] set path', ffmpegStatic);
}

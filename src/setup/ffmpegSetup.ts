import ffmpegStatic from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import getConfig from "./configSetup";

function isValidPath(path: string) {
    try {
        fs.accessSync(path);
        return true;
    } catch (e) {
        return false;
    }
}

export default async function setupFfmpeg() {
    fs.mkdirSync('cache', { recursive: true });
    ffmpeg.setFfmpegPath(ffmpegStatic as string);

    const ffmpegPath = getConfig().ffmpegPath;

    if (ffmpegPath && ffmpegPath.length !== 0) {
        if (!isValidPath(ffmpegPath)) throw new Error('Invalid FFMPEG path');

        ffmpeg.setFfmpegPath(ffmpegPath);
        console.log('[ffmpeg] Set path:', ffmpegPath);
    } else {
        console.log('[ffmpeg] Using default path:', ffmpegStatic);
        console.warn('[ffmpeg] Default FFMPEG path is not recommended - it will behave slower and might not work at all.');
    }
}

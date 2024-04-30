import ffmpegStatic from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import getConfig, { isValidPath } from "./configSetup";
import logger from "../logger";

export default async function setupFFmpeg() {
    if (fs.existsSync('cache')) {
        fs.rmSync('cache', { recursive: true });
    }

    fs.mkdirSync('cache', { recursive: true });

    const ffmpegPath = getConfig().environmentOptions.ffmpegPath;

    if (ffmpegPath && ffmpegPath.length !== 0 && isValidPath(ffmpegPath)) {
        ffmpeg.setFfmpegPath(ffmpegPath);
        logger.info(`[ffmpeg] set path: ${ffmpegPath}`);
    } else {
        if (ffmpegPath && ffmpegPath.length !== 0 && !isValidPath(ffmpegPath)) {
            logger.error(`[ffmpeg] invalid FFMPEG path configured: ${ffmpegPath}`);
        }

        ffmpeg.setFfmpegPath(ffmpegStatic as string);
        logger.info(`[ffmpeg] using default FFMPEG path: ${ffmpegStatic}`);
        logger.warn(`[ffmpeg] default FFMPEG path is not recommended - it will behave slower and might not work at all.`);
    }
}

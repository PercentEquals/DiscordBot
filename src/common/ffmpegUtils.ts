import { getBestFormat, getBestImageUrl } from "./formatFinder";
import { DISCORD_LIMIT } from "../constants/discordlimit";
import { TiktokApi } from "../../types/tiktokApi";

import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";
import { finished } from "stream/promises";

import logger from "../logger";
import fs from "fs";
import { getExtensionFromUrl } from "./extensionFinder";
import { getTiktokAudioData, getTiktokId, getTiktokSlideshowData } from "./sigiState";

export async function downloadFile(url: string, path: string) {
    const { body } = await fetch(url);
    const stream = fs.createWriteStream(path);
    await finished(Readable.fromWeb(body as any).pipe(stream));
}

export async function convertSlideshowToVideo(url: string, tiktokApi: TiktokApi, ranges: number[], tryUsingScale: boolean = false): Promise<string> {
    const tiktokId = getTiktokId(tiktokApi);
    const slideshowData = getTiktokSlideshowData(tiktokApi);
    
    const resultFilePath = `cache/${tiktokId}-slideshow.mp4`;
    const files: string[] = [];

    const clearCache = (clearResult: boolean) => {
        for (let i = 0; i < slideshowData.length; i++) {
            if (fs.existsSync(files[i])) {
                fs.unlinkSync(files[i]);
            }
        }

        if (clearResult && fs.existsSync(resultFilePath)) {
            fs.unlinkSync(resultFilePath);
        }
    }

    return new Promise(async (resolve, reject) => {
        try {
            logger.info('[ffmpeg] converting slideshow to video');
            
            const process = ffmpeg();

            process.on('error', (err: any) => {
                if (!tryUsingScale) {
                    clearCache(false);
                    return resolve(convertSlideshowToVideo(url, tiktokApi, ranges, true));
                } else {
                    clearCache(true);
                    reject(err);
                }
            });
            process.on('end', () => {
                clearCache(false);
                resolve(resultFilePath);
            });

            const bestImageUrl = getBestImageUrl(slideshowData[0]);
            const extension = getExtensionFromUrl(bestImageUrl);

            for (let i = 0; i < slideshowData.length; i++) {
                if (ranges.length > 0 && !ranges.includes(i + 1)) {
                    continue;
                }

                await downloadFile(getBestImageUrl(slideshowData[i]), `cache/${tiktokId}-${i}.${extension}`);
                files.push(`cache/${tiktokId}-${i}.${extension}`);
            }

            if (files.length === 0) {
                return reject('No images found.');
            }

            process.addOption(`-framerate 1`);
            process.addOption(`-r ${Math.ceil(getTiktokAudioData(tiktokApi).duration / files.length)}`);
            process.addOption(`-loop 1`);
            process.addOption(`-t ${getTiktokAudioData(tiktokApi).duration}`);
            process.addOption(`-i ./cache/${tiktokId}-%d.${extension}`);

            const bestAudioFormat = getBestFormat(url, null, tiktokApi, true);
            
            process.addOption('-i', bestAudioFormat?.url as string);

            if (tryUsingScale) {
                process.addOption('-vf scale=800:400');
            }

            process.addOption('-pix_fmt yuv420p');
            process.addOption('-c:a copy');
            process.addOption('-shortest');
            process.addOption('-preset ultrafast');

            process.output(resultFilePath);
            process.run();
        } catch (e) {
            clearCache(true);
            reject(e);
        }
    });
}

export async function convertVideo(initialPath: string, id: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const finalPath = `cache/${id}-ffmpeg.mp4`;
            logger.info(`[ffmpeg] converting video to smaller size`);

            const process = ffmpeg(initialPath);
            process.output(finalPath);
            process.addOption(["-preset", "ultrafast"]);
            process.addOption(["-vf", "scale=iw/4:ih/4"]);
            process.addOption(["-timeout", "10000000"]);

            process.on('end', (done: any) => {
                if (fs.existsSync(initialPath)) {
                    fs.unlinkSync(initialPath);
                }
                logger.info('[ffmpeg] conversion done');
                resolve(finalPath);
            });

            process.on('error', (err: any) => {
                if (fs.existsSync(initialPath)) {
                    fs.unlinkSync(initialPath);
                }
                logger.info('[ffmpeg] error', err);
                reject(err);
            });

            process.run();
        } catch (e) {
            reject(e);
        }
    })
}
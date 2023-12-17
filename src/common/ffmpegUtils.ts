import { getExtensionFromUrl } from "./extensionFinder";
import { getBestFormat, getBestImageUrl } from "./formatFinder";
import { DISCORD_LIMIT } from "../constants/discordlimit";
import { Image } from "../../types/tiktokApi";

import ffmpeg from "fluent-ffmpeg";
import youtubedl, { YtResponse } from "youtube-dl-exec";
import { Readable } from "stream";
import { finished } from "stream/promises";

import logger from "../logger";
import fs from "fs";

export async function convertSlideshowToVideo(url: string, imagesData: Image[], ranges: number[], id: string, tryUsingScale: boolean = false): Promise<string> {
    const resultFilePath = `cache/${id}-slideshow.mp4`;
    const files: string[] = [];

    const clearCache = (clearResult: boolean) => {
        for (let i = 0; i < imagesData.length; i++) {
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
                    return resolve(convertSlideshowToVideo(url, imagesData, ranges, id, true));
                }

                clearCache(true);
                reject(err);
            });
            process.on('end', () => {
                clearCache(false);
                resolve(resultFilePath);
            });

            const extension = await getExtensionFromUrl(getBestImageUrl(imagesData[0]));

            for (let i = 0; i < imagesData.length; i++) {
                if (ranges.length > 0 && !ranges.includes(i + 1)) {
                    continue;
                }

                const image = imagesData[i];
                const { body } = await fetch(getBestImageUrl(image));
                const stream = fs.createWriteStream(`cache/${id}-${i}.${extension}`);
                await finished(Readable.fromWeb(body as any).pipe(stream));

                files.push(`cache/${id}-${i}.${extension}`);
            }

            process.addOption(`-framerate 1`);
            process.addOption(`-r 6`);
            process.addOption(`-loop 1`);
            process.addOption(`-t 4`);
            process.addOption(`-i cache/${id}-%d.${extension}`);

            let audioData = await youtubedl(url, {
                noWarnings: true,
                dumpSingleJson: true,
                getFormat: true, 
            });

            //@ts-ignore - youtube-dl-exec audioData contains useless first line
            audioData = audioData.split('\n').slice(1).join('\n');
            audioData = JSON.parse(audioData as any) as YtResponse;
            const bestFormat = getBestFormat(url, audioData, true);
            
            process.addOption('-i', bestFormat?.url as string);

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
            const targetCrf = Math.ceil(fs.statSync(initialPath).size / DISCORD_LIMIT * 36);

            logger.info(`[ffmpeg] converting: CRF = ${targetCrf}`);

            const process = ffmpeg(initialPath);
            process.output(finalPath);
            process.addOption(["-preset", "veryfast"]);
            process.addOption(["-crf", targetCrf.toFixed(0).toString()]);

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
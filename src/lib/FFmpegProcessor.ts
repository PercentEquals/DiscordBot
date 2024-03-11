import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";
import { finished } from "stream/promises";

import fs from "fs";
import crypto from "crypto";

import logger from "../logger";
import IOptions from "./ffmpeg/IOptions";

import { AttachmentBuilder } from "discord.js";
import PipeOptions from "./ffmpeg/PipeOptions";

//@ts-ignore - Missing types
import { StreamInput } from "fluent-ffmpeg-multistream";

import { getExtensionFromUrl } from "../common/extensionFinder";

export type InputUrl = {
    url: string,
    type?: 'video' | 'audio' | 'photo' | 'audioStream'
}

export default class FFmpegProcessor {
    private uuid = crypto.randomBytes(16).toString("hex");
    private options: IOptions[] = [];
    private startTime = process.hrtime()[0];

    private cache: string[] = [];

    constructor(
        initialOptions?: IOptions[]
    ) {
        initialOptions?.forEach?.(option => {
            this.addOption(option);
        });
    }

    private cleanUp() {
        this.cache.forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        })
    }

    private async downloadFileStream(url: string) {
        const { body } = await fetch(url);
        return Readable.fromWeb(body as any);
    }

    private async downloadFile(url: string, path: string) {
        const stream = fs.createWriteStream(path);
        await finished((await this.downloadFileStream(url)).pipe(stream));
        return path;
    }

    public addOption(option: IOptions) {
        this.options.push(option);
    }

    private onError(error: Error, resolve: any, reject: any) {
        this.cleanUp();
        reject(error);
    }

    private onEnd(resolve: any, reject: any) {
        this.cleanUp();
        logger.info(`[ffmpeg] finished processing url: ${Math.ceil(process.hrtime()[0] - this.startTime)}s`);
    }

    private onStderr(stderrLine: string) {
        logger.debug(`[ffmpeg] ${stderrLine}`);
    }

    public async buildFFmpegProcess(urls: InputUrl[]) {
        try {
            logger.info(`[ffmpeg] processing url`);

            this.startTime = process.hrtime()[0];
            let isSlideshow = false;

            const ffmpegProcess = ffmpeg();

            for (let i = 0; i < this.options.length; i++) {
                this.options[i].addInput(ffmpegProcess);
            }

            for (let i = 0; i < urls.length; i++) {
                if (isSlideshow && urls.length - 1 == i) {
                    ffmpegProcess.addOption('-i', `cache/${this.uuid}.%d.${getExtensionFromUrl(urls[0].url)}`);
                }

                if (urls[i].type == 'audioStream') {
                    ffmpegProcess.addInput(urls[i].url);
                } else  if (urls[i].type == 'audio') {
                    ffmpegProcess.addOption('-vn');
                    ffmpegProcess.addOption('-i', StreamInput(await this.downloadFileStream(urls[i].url)).url);
                } else if (urls[i].type == 'photo') {
                    this.cache.push(
                        await this.downloadFile(urls[i].url, `cache/${this.uuid}.${i}.${getExtensionFromUrl(urls[i].url)}`)
                    );
                    isSlideshow = true;
                } else {
                    ffmpegProcess.addOption('-i', StreamInput(await this.downloadFileStream(urls[i].url)).url);
                }
            }

            for (let i = 0; i < this.options.length; i++) {
                this.options[i].addOutput(ffmpegProcess);
            }

            ffmpegProcess.on('stderr', (stderrLine) => this.onStderr(stderrLine));
            logger.debug(ffmpegProcess._getArguments());

            return ffmpegProcess;
        } catch (e) {
            logger.error(e);
            return null;
        }
    }

    public async getAttachmentBuilder(urls: InputUrl[]): Promise<AttachmentBuilder> {
        return new Promise(async (resolve, reject) => {
            const ffmpegProcess = await this.buildFFmpegProcess(urls);

            if (ffmpegProcess == null) {
                return reject("Could not process with ffmpeg!");
            }

            ffmpegProcess.on('end', this.onEnd.bind(this));
            ffmpegProcess.on('error', (error) => this.onError(error, null, reject));

            resolve(new AttachmentBuilder(ffmpegProcess.pipe()));
        });
    }
}
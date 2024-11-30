import ffmpeg from "fluent-ffmpeg";

import fs from "fs";
import crypto from "crypto";

import logger from "../logger";
import IOptions from "./ffmpeg/IOptions";

import { AttachmentBuilder } from "discord.js";

import { getExtensionFromUrl } from "../common/extensionFinder";
import { downloadFile } from "../common/fileUtils";
import PipeOptions from "./ffmpeg/PipeOptions";

export type InputUrl = {
    url: string,
    type?: 'video' | 'audio' | 'photo' | 'audioStream'
}

export default class FFmpegProcessor {
    private isPipeAble = false;
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

    public cleanUp() {
        this.cache.forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        })
    }

    public addOption(option: IOptions) {
        this.options.push(option);

        if (option instanceof PipeOptions) {
            this.isPipeAble = true;
        }
    }

    private onError(error: Error, resolve: any, reject: any) {
        this.cleanUp();
        reject(error);
    }

    private onEnd(resolve: any, reject: any) {
        this.cleanUp();
        logger.info(`[ffmpeg] finished processing url: ${Math.ceil(process.hrtime()[0] - this.startTime)}s`);

        if (this.isPipeAble) {
            return;
        }

        const outputFiles = this.options.find(option => option.getFiles)?.getFiles?.() ?? [];
        this.cache.push(...outputFiles);
        resolve(outputFiles.map((file) => new AttachmentBuilder(file)));
    }

    private onStderr(stderrLine: string) {
        logger.debug(`[ffmpeg] ${stderrLine}`);
    }

    public async buildFFmpegProcess(urls: InputUrl[]) {
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

            if (urls[i].type == 'audio') {
                ffmpegProcess.addOption('-vn');
                ffmpegProcess.addOption('-i', urls[i].url);
            } else if (urls[i].type == 'photo') {
                this.cache.push(
                    await downloadFile(urls[i].url, `cache/${this.uuid}.${i}.${getExtensionFromUrl(urls[i].url)}`)
                );
                isSlideshow = true;
            } else {
                ffmpegProcess.addInput(urls[i].url);
            }
        }

        for (let i = 0; i < this.options.length; i++) {
            this.options[i].addOutput(ffmpegProcess);
        }

        ffmpegProcess.on('stderr', (stderrLine) => this.onStderr(stderrLine));
        return ffmpegProcess;
    }

    public async getAttachmentBuilder(urls: InputUrl[]): Promise<AttachmentBuilder[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const ffmpegProcess = await this.buildFFmpegProcess(urls);

                if (ffmpegProcess == null) {
                    return reject("Could not process with ffmpeg!");
                }

                ffmpegProcess.on('end', () => this.onEnd(resolve, reject));
                ffmpegProcess.on('error', (error) => this.onError(error, resolve, reject));
                ffmpegProcess.on('progress', function(progress) {
                    logger.info(`[ffmpeg] Processing: ` + progress.percent + `% done`);
                });
                ffmpegProcess.on('start', function(commandLine) {
                    logger.info(`[ffmpeg] ${commandLine}`);
                });

                if (this.isPipeAble) {
                    resolve([new AttachmentBuilder(ffmpegProcess.pipe())]);
                } else {
                    ffmpegProcess.run();
                }
            } catch (e) {
                reject(e);
            }
        });
    }
}
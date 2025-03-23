import ffmpeg from "fluent-ffmpeg";

import fs from "fs";

import logger from "src/logger";
import IOptions from "./options/IOptions";

import { AttachmentBuilder } from "discord.js";

import { getExtensionFromUrl } from "src/common/extensionFinder";
import { downloadFile } from "src/common/fileUtils";
import PipeOptions from "./options/PipeOptions";
import { FFMPEG_TIMEOUT } from "src/constants/ffmpegtimeout";
import FileOptions from "./options/FileOptions";
import { GUID } from "src/lib/utils/Guid";

export type InputUrl = {
    url: string,
    type?: 'video' | 'audio' | 'photo' | 'audioStream'
}

export default class FFmpegProcessor {
    private isPipeAble = false;
    private uuid = GUID();
    private options: IOptions[] = [];
    private startTime = process.hrtime()[0];
    
    private killDeffer: Timer | null = null;
    private cache: string[] = [];

    constructor(
        initialOptions?: IOptions[]
    ) {
        initialOptions?.forEach?.(option => {
            this.addOption(option);
        });
    }

    public cleanUp() {
        this.killDeffer && clearTimeout(this.killDeffer);
        
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

    private onError(error: Error, _: any, reject: any) {
        this.cleanUp();
        reject(error);
    }

    private onEnd(resolve: any) {
        logger.info(`[ffmpeg] finished processing url: ${Math.ceil(process.hrtime()[0] - this.startTime)}s`);

        if (this.isPipeAble) {
            return;
        }

        const file = this.options.find(option => option instanceof FileOptions)?.getFile() ?? "";
        this.cache.push(file);
        resolve(new AttachmentBuilder(file));
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
    
    public async getAttachmentBuilder(urls: InputUrl[]): Promise<AttachmentBuilder> {
        return new Promise(async (resolve, reject) => {
            try {
                const ffmpegProcess = await this.buildFFmpegProcess(urls); 

                if (ffmpegProcess == null) {
                    return reject("Could not process with ffmpeg!");
                }

                ffmpegProcess.on('end', () => this.onEnd(resolve));
                ffmpegProcess.on('error', (error) => this.onError(error, resolve, reject));
                ffmpegProcess.on('progress', function(progress) {
                    logger.info(`[ffmpeg] Processing: ` + progress.percent + `% done`);
                });
                ffmpegProcess.on('start', function(commandLine) {
                    logger.info(`[ffmpeg] ${commandLine}`);
                });

                this.killDeffer = setTimeout(() => {
                    logger.warn(`[ffmpeg] Killing hanging process...`);

                    try {
                        ffmpegProcess?.kill?.("");
                    } catch {}
                }, FFMPEG_TIMEOUT);
                
                if (this.isPipeAble) {
                    resolve(new AttachmentBuilder(ffmpegProcess.pipe()));
                } else {
                    ffmpegProcess.run();
                }
            } catch (e) {
                console.warn(`[ffmpeg] ${e}`);
            }
        });
    }
}
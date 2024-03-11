import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";

import logger from "../logger";
import IOptions from "./ffmpeg/IOptions";

import { AttachmentBuilder } from "discord.js";
import PipeOptions from "./ffmpeg/PipeOptions";

//@ts-ignore - Missing types
import { StreamInput } from "fluent-ffmpeg-multistream";

export type InputUrl = {
    url: string,
    type?: 'video' | 'audio' | 'photo'
}

export default class FFmpegProcessor {
    private options: IOptions[] = [];
    private startTime = process.hrtime()[0];

    constructor(
        initialOptions?: IOptions[]
    ) {
        this.addOption(new PipeOptions());

        initialOptions?.forEach?.(option => {
            this.addOption(option);
        });
    }

    private async downloadFileStream(url: string) {
        const { body } = await fetch(url);
        return Readable.fromWeb(body as any);
    }

    public addOption(option: IOptions) {
        this.options.push(option);
    }

    private onError(error: Error, resolve: any, reject: any) {
        reject(error);
    }

    private onEnd(resolve: any, reject: any) {
        logger.info(`[ffmpeg] finished processing url: ${Math.ceil(process.hrtime()[0] - this.startTime)}s`);
    }

    private onStderr(stderrLine: string) {
        logger.debug(`[ffmpeg] ${stderrLine}`);
    }

    public async buildFFmpegProcess(urls: InputUrl[]) {
        try {
            logger.info(`[ffmpeg] processing url`);

            this.startTime = process.hrtime()[0];

            const ffmpegProcess = ffmpeg();

            for (let i = 0; i < this.options.length; i++) {
                this.options[i].addInput(ffmpegProcess);
            }

            for (let i = 0; i < urls.length; i++) {
                if (urls[i].type == 'audio') {
                    ffmpegProcess.addOption('-vn');
                } else if (urls[i].type == 'photo') {
                    ffmpegProcess.addOption('-an');
                }

                ffmpegProcess.addOption('-i', StreamInput(await this.downloadFileStream(urls[i].url)).url);
            }

            for (let i = 0; i < this.options.length; i++) {
                this.options[i].addOutput(ffmpegProcess);
            }

            ffmpegProcess.on('stderr', (stderrLine) => this.onStderr(stderrLine));
            logger.warn(ffmpegProcess._getArguments());

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
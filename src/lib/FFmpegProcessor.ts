import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";

import logger from "../logger";
import IOptions from "./ffmpeg/IOption";

import { AttachmentBuilder } from "discord.js";
import PipeOptions from "./ffmpeg/PipeOptions";

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
        logger.info(`[ffmpeg] finished processing url: ${((process.hrtime()[0] - this.startTime) / 1e+9).toFixed(3)}s`);
    }

    private onStderr(stderrLine: string) {
        logger.debug(`[ffmpeg] ${stderrLine}`);
    }

    public async buildFFmpegProcess(urls: string[]) {
        logger.info(`[ffmpeg] processing url`);

        this.startTime = process.hrtime()[0];

        const ffmpegProcess = ffmpeg();

        for (let i = 0; i < urls.length; i++) {
            ffmpegProcess.addInput(await this.downloadFileStream(urls[i]));
        }

        for (let i = 0; i < this.options.length; i++) {
            this.options[i].addToProcess(ffmpegProcess);
        }

        ffmpegProcess.on('stderr', (stderrLine) => this.onStderr(stderrLine));
        logger.debug(ffmpegProcess._getArguments());

        return ffmpegProcess;
    }

    public async getAttachmentBuilder(urls: string[]): Promise<AttachmentBuilder> {
        return new Promise(async (resolve, reject) => {
            const ffmpegProcess = await this.buildFFmpegProcess(urls);

            ffmpegProcess.on('end', this.onEnd.bind(this));
            ffmpegProcess.on('error', (error) => this.onError(error, null, reject));

            resolve(new AttachmentBuilder(ffmpegProcess.pipe()));
        });
    }
}
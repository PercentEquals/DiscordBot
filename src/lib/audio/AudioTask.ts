import { AudioPlayer, AudioPlayerState, AudioPlayerStatus, AudioResource, createAudioResource, demuxProbe, StreamType } from "@discordjs/voice";
import FFmpegProcessor from "../ffmpeg/FFmpegProcessor";
import AudioStreamOptions from "../ffmpeg/options/AudioStreamOptions";
import logger from "src/logger";
import { FfmpegCommand } from "fluent-ffmpeg";
import { end } from "cheerio/dist/commonjs/api/traversing";

export default class AudioTask {
    private ffmpegProcessClone: FfmpegCommand | null = null;
    private resource: AudioResource<null> | null = null;

    constructor(
        private player: AudioPlayer,
        private title: string,
        private url: string,
        private startTimeInMs: number,
        private volume: number,
    ) {

    }

    public async PrepareTask() {
        const ffmpegStream = await this.getAudioStream();
        //const { stream, type } = await demuxProbe(ffmpegStream.pipe() as any);
        this.resource = createAudioResource(ffmpegStream.pipe() as any, { inputType: StreamType.Arbitrary });

        logger.info(`[ffmpeg] audio stream for ${this.title} is ready`);
    }

    public async PlayTask() {
        return new Promise<void>((resolve, reject) => {
            this.Play(resolve, reject);
        });
    }

    private onFinish = (resolve: PromiseResolve<void>, from: AudioPlayerState) => {
        if (from.status !== AudioPlayerStatus.Playing) {
            return;
        }

        this.player.off(AudioPlayerStatus.Idle, this.onFinish);
        resolve();
    }

    private async Play(resolve: PromiseResolve<void>, reject: PromiseReject) {
        if (!this.resource) {
            reject(new Error('Audio resource is not ready'));
            return;
        }

        if (this.resource.ended) {
            await this.PrepareTask();
        }

        this.player.on(AudioPlayerStatus.Idle, (from) => this.onFinish(resolve, from));
        this.player.play(this.resource);

        logger.info(`[ffmpeg] playing audio stream for ${this.title}`);
    }

    public async Stop() {
        this.player.stop(true);
    }

    private async getAudioStream() {
        if (this.ffmpegProcessClone) {
            logger.info(`[ffmpeg] reusing downloaded audio stream for ${this.title}`);
            return this.ffmpegProcessClone.clone();
        }

        logger.info(`[ffmpeg] downloading audio stream for ${this.title}`);
    
        const ffmpegProcessor = new FFmpegProcessor([
            new AudioStreamOptions(this.startTimeInMs, this.volume)
        ]);

        this.ffmpegProcessClone = await ffmpegProcessor.buildFFmpegProcess([
            { url: this.url, type: 'audioStream' }
        ]);

        return this.ffmpegProcessClone.clone();
    }
}
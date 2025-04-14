import { AudioPlayer, AudioPlayerState, AudioPlayerStatus, AudioResource, createAudioResource, demuxProbe } from "@discordjs/voice";
import FFmpegProcessor from "../ffmpeg/FFmpegProcessor";
import AudioStreamOptions from "../ffmpeg/options/AudioStreamOptions";
import logger from "src/logger";

export default class AudioTask {
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
        const { stream, type } = await demuxProbe(ffmpegStream.pipe() as any);
        this.resource = createAudioResource(stream, { inputType: type });

        logger.info(`[ffmpeg] audio stream for ${this.title} is ready`);
    }

    public async PlayTask() {
        return new Promise<void>((resolve, reject) => {
            this.Play(resolve, reject);
        });
    }

    private async Play(resolve: PromiseResolve<void>, reject: PromiseReject) {
        if (!this.resource) {
            reject(new Error('Audio resource is not ready'));
            return;
        }

        const onFinish = (from: AudioPlayerState) => {
            if (from.status !== AudioPlayerStatus.Playing) {
                return;
            }

            this.player.off(AudioPlayerStatus.Idle, onFinish);
            resolve();
        }

        this.player.on(AudioPlayerStatus.Idle, onFinish);
        this.player.play(this.resource);

        logger.info(`[ffmpeg] playing audio stream for ${this.title}`);
    }

    private async getAudioStream() {
        logger.info(`[ffmpeg] downloading audio stream for ${this.title}`);
    
        const ffmpegProcessor = new FFmpegProcessor([
            new AudioStreamOptions(this.startTimeInMs, this.volume)
        ]);

        return await ffmpegProcessor.buildFFmpegProcess([
            { url: this.url, type: 'audioStream' }
        ]);
    }
}
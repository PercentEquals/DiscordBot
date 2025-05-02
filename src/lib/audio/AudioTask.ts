import { AudioPlayer, AudioPlayerState, AudioPlayerStatus, AudioResource, createAudioResource, demuxProbe, StreamType } from "@discordjs/voice";
import FFmpegProcessor from "../ffmpeg/FFmpegProcessor";
import AudioStreamOptions from "../ffmpeg/options/AudioStreamOptions";
import logger from "src/logger";
import { FfmpegCommand } from "fluent-ffmpeg";
import { CommandInteraction, Message, MessageReaction, ReactionCollector, User } from "discord.js";
import IExtractor from "../extractors/providers/IExtractor";

enum AutioTaskState {
    Error = 'error',
    Playing = 'playing',
    Paused = 'paused',
    Finished = 'finished',
    Skipped = 'skipped',
}

export default class AudioTask {
    private ffmpegProcess: FfmpegCommand | null = null;
    private resource: AudioResource<null> | null = null;
    private collector: ReactionCollector | null = null;

    private listener: boolean = false;
    private disposed: boolean = false;

    private playStartTime: number = 0;

    constructor(
        private message: Message,
        private botId: string,
        private interaction: CommandInteraction,
        private player: AudioPlayer,
        private extractor: IExtractor,
        private startTimeInMs: number,
        private volume: number,
        public loop: boolean = false,
        public force: boolean = false,
    ) {}

    private async attachPlayerListeners() {
        if (!!this.collector) {
            return;
        }

        this.collector = this.message.createReactionCollector({
            filter: (reaction: MessageReaction, user: User) => {
                return user.id !== this.botId && !user.bot;
            },
        });

        this.collector.on('collect', async (reaction) => {
            await reaction.message.fetch(true);

            switch (reaction.emoji.name) {
                case '⏯️':
                    this.player.state.status !== AudioPlayerStatus.Playing ? this.UnPause() : this.Pause();
                    break;
                case '🔁':
                    this.loop = !this.loop;
                    this.updateMessage(this.player.state.status !== AudioPlayerStatus.Playing ? AutioTaskState.Paused : AutioTaskState.Playing);
                    break;
                case '⏹️':
                    this.loop = false;
                    this.Stop();
                    break;
            }

            reaction.users.remove(reaction.users.cache.last()!);
        });

        await this.message.react('⏯️');
        await this.message.react('🔁');
        await this.message.react('⏹️');
    }

    public async PrepareTask() {
        const ffmpegStream = await this.getAudioStream();
        this.resource = createAudioResource(ffmpegStream.pipe() as any, { inputType: StreamType.Arbitrary });

        logger.info(`[ffmpeg] audio stream for ${this.extractor.getReplyString()} is ready`);
    }

    public async PlayTask() {
        if (this.disposed) {
            this.updateMessage(AutioTaskState.Skipped);
            return Promise.resolve();
        }

        this.updateMessage(AutioTaskState.Playing);

        return new Promise<void>((resolve, reject) => {
            this.Play(resolve, reject);
        });
    }

    private onFinish = async (resolve: PromiseResolve<void>, from: AudioPlayerState) => {
        if (from.status !== AudioPlayerStatus.Playing) {
            return;
        }

        if (this.loop) {
            return this.PlayTask();
        }

        await this.message.fetch(true);

        this.message.edit({
            content: `:white_check_mark: Finished playing ${this.extractor.getReplyString()}`,
        });

        this.dispose();
        this.extractor?.dispose?.(true);
        await this.message.reactions.removeAll();
        resolve();
    }

    private onError(reject: PromiseReject, error: Error) {
        if (error.message.includes('Output stream error: Premature close')) {
            logger.warn(`[ffmpeg] ignored error in audio stream for ${this.extractor.getReplyString()}: ${error.message}`);
            return; // ignore this error, it is caused by the ffmpeg process being killed
        }

        logger.error(`[ffmpeg] error in audio stream for ${this.extractor.getReplyString()}: ${error.message}`);

        this.updateMessage(AutioTaskState.Error, error.message);

        reject(error);
    }

    private async Play(resolve: PromiseResolve<void>, reject: PromiseReject) {
        if (!this.resource) {
            reject(new Error('Audio resource is not ready'));
            return;
        }

        this.attachPlayerListeners();

        if (this.resource.ended) {
            await this.PrepareTask();
        }

        if (!this.listener) {
            this.player.on(AudioPlayerStatus.Idle, (from) => this.onFinish(resolve, from));
            this.player.on('error', (error) => this.onError(reject, error));
            this.ffmpegProcess!.on('error', (error) => this.onError(reject, error));
            this.listener = true;
        }

        this.playStartTime = process.hrtime()[0];
        this.player.play(this.resource);

        logger.info(`[ffmpeg] playing audio stream for ${this.extractor.getReplyString()}`);
    }

    public Finish() {
        this.ffmpegProcess?.kill('SIGINT');
        this.ffmpegProcess = null;
        this.player.emit(AudioPlayerStatus.Idle, this.player.state);
    }

    public Stop() {
        this.UnPause();
        this.player.stop(true);
    }

    public Pause() {
        this.updateMessage(AutioTaskState.Paused);
        this.player.pause(true);
    }

    public UnPause() {
        this.updateMessage(AutioTaskState.Playing);
        this.player.unpause();
    }

    public async SetVolume(volume: number) {
        if (!this.ffmpegProcess) {
            throw new Error('Audio stream is not ready');
        }

        this.volume = volume;
        const timeDiff = (process.hrtime()[0] - this.playStartTime) * 1000.0;
        this.startTimeInMs = this.startTimeInMs + timeDiff; // add the time that has passed since the start of the stream

        this.Restart();
    }

    public async Seek(seekTime: number) {
        if (!this.ffmpegProcess) {
            throw new Error('Audio stream is not ready');
        }
        
        this.startTimeInMs = seekTime; 
        this.Restart();
    }

    public async Restart() {
        this.ffmpegProcess = null;
        await this.PrepareTask();
        this.playStartTime = process.hrtime()[0];
        this.player.play(this.resource!);
    }

    public async PlayNewAudio(audioTask: AudioTask) {
        this.updateMessage(AutioTaskState.Finished);
        this.extractor?.dispose?.(true);

        this.interaction = audioTask.interaction;
        this.extractor = audioTask.extractor;
        this.startTimeInMs = audioTask.startTimeInMs;
        this.volume = audioTask.volume;
        this.loop = audioTask.loop;
        this.force = false;

        this.Restart();
    }

    private async getAudioStream() {
        logger.info(`[ffmpeg] downloading audio stream for ${this.extractor.getReplyString()}`);

        const url = this.extractor.getBestFormat(true)?.url!;
    
        const ffmpegProcessor = new FFmpegProcessor([
            new AudioStreamOptions(this.startTimeInMs, this.volume)
        ]);

        this.ffmpegProcess = await ffmpegProcessor.buildFFmpegProcess([
            { url, type: 'audioStream' }
        ]);

        return this.ffmpegProcess;
    }

    private updateMessage(audioTaskState: AutioTaskState, content: string = '') {
        if (this.disposed) {
            return;
        }

        switch (audioTaskState) {
            case AutioTaskState.Playing:
                this.interaction.editReply({
                    content: `${this.loop ? ':repeat:' : ':musical_note:'} Playing ${this.extractor.getReplyString()}`,
                });
                break;
            case AutioTaskState.Paused:
                this.interaction.editReply({
                    content: `:pause_button: Paused ${this.extractor.getReplyString()}`,
                });
                break;
            case AutioTaskState.Finished:
                this.interaction.editReply({
                    content: `:white_check_mark: Finished playing ${this.extractor.getReplyString()}`,
                });
                break;
            case AutioTaskState.Skipped:
                this.interaction.editReply({
                    content: `:white_check_mark: Skipped playing ${this.extractor.getReplyString()}`,
                });
                break;
            case AutioTaskState.Error:
                this.interaction.editReply({
                    content: `:octagonal_sign: Error occured while playing ${this.extractor.getReplyString()}: ${content}`,
                });
                break;
            default:
                return;
        }
    }

    dispose() {
        this.disposed = true;
        this.loop = false;
        this.collector?.stop();
    }
}
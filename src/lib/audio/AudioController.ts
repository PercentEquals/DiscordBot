import {CommandInteraction} from "discord.js";
import {
    AudioPlayer,
    AudioPlayerState,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    demuxProbe,
    DiscordGatewayAdapterCreator,
    getVoiceConnection,
    joinVoiceChannel,
    NoSubscriberBehavior,
    VoiceConnection
} from "@discordjs/voice";

import logger from "src/logger";

import {FfmpegCommand} from "fluent-ffmpeg";
import {PassThrough} from "stream";
import {getStartTimeInMs, getVolume} from "../../common/audioUtils";

import {VOICE_LEAVE_TIMEOUT} from "src/constants/voiceleavetimeout";

import FFmpegProcessor from "../ffmpeg/FFmpegProcessor";
import AudioStreamOptions from "../ffmpeg/options/AudioStreamOptions";
import IExtractor, {BestFormat} from "src/lib/extractors/providers/IExtractor";
import LinkExtractor from "../extractors/LinkExtractor";

export default class AudioController {
    private connection: VoiceConnection | null = null;

    private interaction: CommandInteraction | null = null;

    private url: string = "";
    private bestFormat: BestFormat | null | undefined = null;

    private extractor: IExtractor | null = null;
    
    private volume = 100;
    private startTimeInMs = 0;
    private loop = false;

    private audioStream: FfmpegCommand | null | undefined = null;
    private player: AudioPlayer | null = null;

    private isCurrentlyPlaying = false;
    private playStartTime = process.hrtime()[0];

    private leaveTimeout: Timer | undefined = undefined;

    private replyEdited = false;

    private queue: {
        interaction: CommandInteraction,
        url: string,
        extractor: IExtractor,
        bestFormat: BestFormat,
        volume: number,
        startTimeInMs: number,
        loop: boolean
    }[] = [];

    constructor() {
        this.onError = this.onError.bind(this);
        this.onFinish = this.onFinish.bind(this);
    }

    private joinChannel(interaction: CommandInteraction) {
        //@ts-ignore - voice is correct
        const channelId = interaction.member?.voice?.channelId as string;
        const guildId = interaction.guildId as string;
        const voiceAdapterCreator = interaction.guild?.voiceAdapterCreator as DiscordGatewayAdapterCreator;

        if (this.connection) {
            return;
        }

        this.connection = joinVoiceChannel({
            channelId: channelId,
            guildId: guildId,
            adapterCreator: voiceAdapterCreator
        });
    }
    
    private async getAudioStream(url: string, startTimeMs: number, volume: number) {
        logger.info(`[ffmpeg] downloading audio stream`);
    
        const ffmpegProcessor = new FFmpegProcessor([
            new AudioStreamOptions(startTimeMs, volume)
        ]);

        return await ffmpegProcessor.buildFFmpegProcess([
            { url, type: 'audioStream' }
        ]);
    }
    
    private async probeAndCreateResource(readableStream: any) {
        const { stream, type } = await demuxProbe(readableStream);
        return createAudioResource(stream, {
            inputType: type
        });
    }

    public async playAudio(interaction: CommandInteraction, url: string, startTimeInMs: number = 0, volume: number = 100, loop: boolean = false, force?: boolean, extractor?: IExtractor | null) {
        clearTimeout(this.leaveTimeout);
        
        if (!force && this.isCurrentlyPlaying) {
            await this.queueAudio(interaction, url, startTimeInMs, volume, loop);
            return;
        }

        if (url !== this.url && !extractor) {
            this.extractor?.dispose?.(true);
            this.extractor = await new LinkExtractor().extractUrl(url);
        }

        if (extractor) {
            this.extractor = extractor;
        }

        this.bestFormat = this.extractor?.getBestFormat(true);

        if (!this.bestFormat?.url) {
            throw new Error("No audio data found!");
        }

        this.volume = volume;
        this.startTimeInMs = startTimeInMs;
        this.loop = loop;
        this.url = url;
        this.interaction = interaction;

        this.joinChannel(interaction);

        this.leaveTimeout = setTimeout(() => {
            this.leaveIfNotPlaying(interaction);
        }, VOICE_LEAVE_TIMEOUT);

        this.audioStream?.emit?.('end');

        await this.startAudioStream(interaction, this.bestFormat.url, startTimeInMs, volume, loop, !!extractor);
    }

    private leaveIfNotPlaying(interaction: CommandInteraction) {
        if (this.isCurrentlyPlaying || this.queue.length > 0) {
            this.leaveTimeout = setTimeout(() => this.leaveIfNotPlaying(interaction), VOICE_LEAVE_TIMEOUT);
        } else {
            this.stopAudio(interaction);
        }
    }

    private async playNextInQueue() {
        const nextAudio = this.queue.shift();

        if (nextAudio) {
            this.replyEdited = false;
            return this.playAudio(nextAudio.interaction, nextAudio.url, nextAudio.startTimeInMs, nextAudio.volume, nextAudio.loop, false, nextAudio.extractor);
        }
    }

    private onError(error: Error, resolve: any, reject: any) {
        this.isCurrentlyPlaying = false;
        reject(error);
    }

    private async onFinish(interaction: CommandInteraction, from: AudioPlayerState, to: AudioPlayerState, resolve: any, reject: any) {
        if (!(from.status === AudioPlayerStatus.Playing && to.status === AudioPlayerStatus.Idle)) {
            return;
        }

        if (this.loop) {
            try {
                resolve(await this.playAudio(interaction, this.url, this.startTimeInMs, this.volume, this.loop, true, this.extractor));
                this.replyEdited = true;
                return;
            } catch (e) {
                return reject(e);
            }
        } else {
            await interaction.editReply({
                content: `:white_check_mark: Finished playing audio: ${this.extractor?.getReplyString()}`,
            });
        }

        this.isCurrentlyPlaying = false;
        this.replyEdited = false;

        clearTimeout(this.leaveTimeout);

        this.leaveTimeout = setTimeout(() => {
            this.leaveIfNotPlaying(interaction);
        }, VOICE_LEAVE_TIMEOUT);

        try {
            resolve(await this.playNextInQueue())
        } catch (e) {
            reject(e);
        }
    }

    private async startAudioStream(interaction: CommandInteraction, url: string, startTimeMs: number, volume: number, loop: boolean, playedFromQueue: boolean) {
        return new Promise(async (resolve, reject) => {
            try {
                const onError = (error: Error) => {
                    this.onError(error, resolve, reject);
                }

                const onFinish = async (from: AudioPlayerState, to: AudioPlayerState) => {
                    await this.onFinish(interaction, from, to, resolve, reject);
                }

                this.joinChannel(interaction);

                const ffmpegProcess = await this.getAudioStream(url, startTimeMs, volume);
                ffmpegProcess.on('error', onError);

                this.audioStream = ffmpegProcess.pipe(new PassThrough({
                    highWaterMark: 96000 / 8 * 30
                })) as unknown as FfmpegCommand;

                this.player = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Play,
                    },
                });

                this.player.on('error', onError);
                this.player.on(AudioPlayerStatus.Idle, onFinish);

                const resource = await this.probeAndCreateResource(this.audioStream);
                this.connection?.subscribe?.(this.player);
                this.player.play(resource);

                this.isCurrentlyPlaying = true;
                this.playStartTime = process.hrtime()[0];

                const playIcon = loop ? ':loop:' : ':loud_sound:';

                if (!playedFromQueue) {
                    await interaction.followUp({
                        ephemeral: false,
                        content: `${playIcon} Playing audio: ${this.extractor?.getReplyString()}`
                    });
                } else if (!this.replyEdited) {
                    this.replyEdited = true;
                    await interaction.editReply({
                        content: `${playIcon} Playing audio: ${this.extractor?.getReplyString()}`
                    });
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    public async restartAudioStream(interaction: CommandInteraction, volume: string | null, startTime: string | null) {
        if (!this.isCurrentlyPlaying || !this.bestFormat?.url) {
            await interaction.followUp({
                ephemeral: false,
                content: `:information_source: Nothing is playing!`
            });

            return false;
        }

        const newVolume = volume ? getVolume(volume) : this.volume;
        const timeDiff = (process.hrtime()[0] - this.playStartTime) * 1000.0;
        const startTimeInMs = startTime ? getStartTimeInMs(startTime) : this.startTimeInMs + timeDiff;

        this.player?.removeAllListeners();
        this.audioStream?.emit?.('end');

        this.startTimeInMs = startTimeInMs;
        this.volume = newVolume;

        await this.startAudioStream(this.interaction as CommandInteraction, this.bestFormat.url, startTimeInMs, newVolume, this.loop, true);

        return true;
    }

    private async queueAudio(interaction: CommandInteraction, url: string, startTimeInMs: number = 0, volume: number = 100, loop: boolean = false) {
        const extractor = await new LinkExtractor().extractUrl(url);
        const bestFormat = extractor.getBestFormat();

        if (!bestFormat?.url) {
            throw new Error("No audio data found!");
        }

        this.queue.push({
            interaction: interaction,
            url: url,
            startTimeInMs: startTimeInMs,
            volume: volume,
            loop: loop,
            extractor: extractor,
            bestFormat: bestFormat
        });

        await interaction.followUp({
            ephemeral: false,
            content: `:information_source: Queued audio: ${extractor.getReplyString()}`
        });

        // Race condition recheck
        if (!this.isCurrentlyPlaying && this.queue.length > 0) {
            await this.playNextInQueue();
        }
    }

    public async skipAudio(interaction: CommandInteraction) {
        if (!this.isCurrentlyPlaying) {
            await interaction.followUp({
                ephemeral: false,
                content: `:information_source: Nothing is playing!`
            });

            return false;
        }

        this.loop = false;
        this.isCurrentlyPlaying = false;
        this.audioStream?.emit?.('end');
        this.replyEdited = false;

        return true;
    }

    public async stopAudio(interaction: CommandInteraction) {
        this.queue = [];
        this.loop = false;
        this.isCurrentlyPlaying = false;
        this.audioStream?.emit?.('end');
        this.replyEdited = false;

        this.connection = null;

        getVoiceConnection(interaction.guildId as string)?.disconnect?.();
    }
}
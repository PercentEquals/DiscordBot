import { CommandInteraction, InternalDiscordGatewayAdapterCreator } from "discord.js";
import { AudioPlayer, AudioPlayerState, AudioPlayerStatus, NoSubscriberBehavior, VoiceConnection, createAudioPlayer, createAudioResource, demuxProbe, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { YoutubeDlData, getDataFromYoutubeDl } from "../common/sigiState";
import { getBestFormat } from "../common/formatFinder";

import logger from "../logger";

import ffmpeg, { FfmpegCommand } from "fluent-ffmpeg";
import { PassThrough } from "stream";
import { getReplyString, getStartTimeInMs, getVolume } from "../common/audioUtils";

export default class AudioController {
    private connection: VoiceConnection | null = null;

    private interaction: CommandInteraction | null = null;
    
    private url: string = "";
    private audioData: YoutubeDlData | null = null;
    private bestFormat: { url: string, filesize: number } | null = null;
    
    private volume = 100;
    private startTimeInMs = 0;
    private loop = false;

    private audioStream: FfmpegCommand | null = null;
    private player: AudioPlayer | null = null;

    private isRestartingStream = false;

    private isCurrentlyPlaying = false;
    private playStartTime = process.hrtime()[0];

    private replyEdited = false;

    private queue: {
        interaction: CommandInteraction,
        url: string,
        audioData: YoutubeDlData,
        bestFormat: { url: string, filesize: number },
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
        const voiceAdapterCreator = interaction.guild?.voiceAdapterCreator as InternalDiscordGatewayAdapterCreator;

        if (this.connection) {
            return;
        }

        this.connection = joinVoiceChannel({
            channelId: channelId,
            guildId: guildId,
            adapterCreator: voiceAdapterCreator
        });
    }
    
    // https://github.com/discordjs/voice/issues/117
    // https://github.com/discordjs/voice/issues/150
    private getAudioStream(url: string, startTimeMs: number, volume: number, reject: (reason?: any) => void): FfmpegCommand {
        logger.info(`[ffmpeg] downloading audio stream`);
    
        const FFMPEG_OPUS_ARGUMENTS = [
            '-analyzeduration',
            '0',
            '-loglevel',
            '0',
            '-acodec',
            'libopus',
            '-f',
            'opus',
            '-ar',
            '48000',
            '-ac',
            '2',
        ];
    
        const process = ffmpeg(url, { timeout: 0 });
        process.addOptions(FFMPEG_OPUS_ARGUMENTS);
        process.setStartTime(Math.ceil(startTimeMs / 1000));
        process.audioFilters(`volume=${volume}`);
    
        process.on('error', (error) => {
            reject(error);
        });
    
        return process.pipe(new PassThrough({
            highWaterMark: 96000 / 8 * 30
        })) as unknown as FfmpegCommand;
    }
    
    private async probeAndCreateResource(readableStream: any) {
        const { stream, type } = await demuxProbe(readableStream);
        return createAudioResource(stream, {
            inputType: type
        });
    }

    public async playAudio(interaction: CommandInteraction, url: string, startTimeInMs: number = 0, volume: number = 100, loop: boolean = false, force?: boolean, audioData?: YoutubeDlData) {
        if (!force && this.isCurrentlyPlaying) {
            await this.queueAudio(interaction, url, startTimeInMs, volume, loop);
            return;
        }

        if (url !== this.url && !audioData) {
            this.audioData = await getDataFromYoutubeDl(url);
        }

        if (audioData) {
            this.audioData = audioData;
        }

        if (!this.audioData?.tiktokApi && !this.audioData?.ytResponse) {
            throw new Error("No audio data found!");
        }

        this.bestFormat = getBestFormat(url, this.audioData);

        if (!this.bestFormat?.url) {
            throw new Error("No audio data found!");
        }

        this.volume = volume;
        this.startTimeInMs = startTimeInMs;
        this.loop = loop;
        this.url = url;
        this.replyEdited = false;

        this.interaction = interaction;

        this.joinChannel(interaction);

        this.audioStream?.emit?.('end');
        this.startAudioStream(interaction, this.bestFormat.url, startTimeInMs, volume, loop, !!audioData);
    }

    private onError(error: Error, resolve: any, reject: any) {
        this.isCurrentlyPlaying = false;
        reject(error);
    }

    private async onFinish(interaction: CommandInteraction, from: AudioPlayerState, to: AudioPlayerState, resolve: any, reject: any) {
        if (!(from.status === AudioPlayerStatus.Playing && to.status === AudioPlayerStatus.Idle)) {
            return;
        }

        if (this.isRestartingStream) {
            this.isRestartingStream = false;
            return;
        }

        if (this.loop) {
            try {
                return resolve(await this.playAudio(interaction, this.url, this.startTimeInMs, this.volume, this.loop, true, this.audioData as YoutubeDlData));
            } catch (e) {
                return reject(e);
            }
        } else {
            await interaction.editReply({
                content: `:white_check_mark: Finished playing audio: ${getReplyString(this.audioData as YoutubeDlData)}`,
            });
        }

        this.isCurrentlyPlaying = false;

        const nextAudio = this.queue.shift();

        if (nextAudio) {
            try {
                this.replyEdited = false;
                return resolve(await this.playAudio(nextAudio.interaction, nextAudio.url, nextAudio.startTimeInMs, nextAudio.volume, nextAudio.loop, false, nextAudio.audioData));
            } catch (e) {
                return reject(e);
            }
        }

        return resolve(true);
    }

    private async startAudioStream(interaction: CommandInteraction, url: string, startTimeMs: number, volume: number, loop: boolean, playedFromQueue: boolean) {
        return new Promise(async (resolve, reject) => {
            const onError = (error: Error) => {
                this.onError(error, resolve, reject);
            }

            const onFinish = async (from: AudioPlayerState, to: AudioPlayerState) => {
                await this.onFinish(interaction, from, to, resolve, reject);
            }

            this.joinChannel(interaction);

            this.audioStream = this.getAudioStream(url, startTimeMs, volume, reject);
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
                    content: `${playIcon} Playing audio: ${getReplyString(this.audioData as YoutubeDlData)}`
                });
            } else if (!this.replyEdited) {
                this.replyEdited = true;
                await interaction.editReply({
                    content: `${playIcon} Playing audio: ${getReplyString(this.audioData as YoutubeDlData)}`
                });
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

        this.isRestartingStream = true;
        this.audioStream?.emit?.('end');

        this.joinChannel(interaction);
    
        const newVolume = volume ? getVolume(volume) : this.volume;
        const timeDiff = (process.hrtime()[0] - this.playStartTime) * 1000.0;
        const startTimeInMs = startTime ? getStartTimeInMs(startTime) : this.startTimeInMs + timeDiff;
    
        this.startTimeInMs = startTimeInMs;
        this.volume = newVolume;

        this.audioStream = await new Promise(async (resolve, reject) => {
            resolve(this.getAudioStream(this.bestFormat?.url as string, startTimeInMs, newVolume, reject));
        });
        const resource = await this.probeAndCreateResource(this.audioStream);
        this.player?.play(resource);

        return true;
    }

    private async queueAudio(interaction: CommandInteraction, url: string, startTimeInMs: number = 0, volume: number = 100, loop: boolean = false) {
        const audioData = await getDataFromYoutubeDl(url);

        if (!audioData?.tiktokApi && !audioData?.ytResponse) {
            throw new Error("No audio data found!");
        }

        const bestFormat = getBestFormat(url, audioData);

        if (!bestFormat?.url) {
            throw new Error("No audio data found!");
        }

        this.queue.push({
            interaction: interaction,
            url: url,
            startTimeInMs: startTimeInMs,
            volume: volume,
            loop: loop,
            audioData: audioData,
            bestFormat: bestFormat
        });

        interaction.followUp({
            ephemeral: false,
            content: `:information_source: Queued audio: ${getReplyString(audioData)}`
        });
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

        return true;
    }

    public async stopAudio(interaction: CommandInteraction) {
        this.queue = [];
        this.loop = false;
        this.isCurrentlyPlaying = false;
        this.audioStream?.emit?.('end');

        this.connection = null;

        getVoiceConnection(interaction.guildId as string)?.disconnect?.();
    }
}
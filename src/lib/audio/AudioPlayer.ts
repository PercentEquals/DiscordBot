import { Client, CommandInteraction, Message, MessageReaction, User, VoiceBasedChannel } from "discord.js";

import { createAudioPlayer, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { createDiscordJSAdapter } from "./AudioAdapter";
import LinkExtractor from "../extractors/LinkExtractor";
import AudioQueue from "./AudioQueue";
import AudioTask from "./AudioTask";

class AudioPlayerClass {
    private player = createAudioPlayer();
    private queues: Record<string, AudioQueue> = {};

    public async playAudio(
        client: Client,
        interaction: CommandInteraction, 
        url: string, 
        startTimeInMs: number = 0, 
        volume: number = 100, 
        loop: boolean = false, 
        force: boolean = false,
    ) {
        //@ts-ignore
        const channel = interaction.member?.voice?.channel as VoiceBasedChannel;

        if (!channel) {
            throw new Error('You must be in a voice channel to play audio!');
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: createDiscordJSAdapter(channel),
        });
        
        if (!this.queues[channel.guild.id]) {
            this.queues[channel.guild.id] = new AudioQueue();
        }

        connection.subscribe(this.player);

        const extractor = await new LinkExtractor().extractUrl(url);
        const bestFormat = await extractor.getBestFormat(true);

        if (!bestFormat) {
            throw new Error('No audio format found!');
        }

        const message = await interaction.followUp({
            content: `:information_source: Queued: ${extractor.getReplyString()}`
        });

        const task = new AudioTask(
            message,
            client.user!.id,
            interaction,
            this.player,
            extractor,
            startTimeInMs,
            volume,
            loop,
            force
        );

        this.queues[channel.guild.id].addTask(task);
    }

    public async setVolume(interaction: CommandInteraction, volume: number, volumeString: string) {
        //@ts-ignore
        const channel = interaction.member?.voice?.channel as VoiceBasedChannel;

        if (!channel) {
            throw new Error('You must be in a voice channel to set volume!');
        }

        const task = this.queues[channel.guild.id].getCurrentTask();

        if (!task) {
            throw new Error('No audio currently playing!');
        }

        task.SetVolume(volume);

        let volumeIcon = ":loud_sound:";

        if (volume <= 0) {
            volumeIcon = ":mute:";
        } else if (volume < 50) {
            volumeIcon = ":sound:";
        } else {
            volumeIcon = ":loud_sound:";
        }


        await interaction.followUp({
            content: `${volumeIcon} Set volume of currently played audio to ${volumeString}%`,
        });
    }

    public async seek(interaction: CommandInteraction, startTime: number, startTimeString: string) {
        //@ts-ignore
        const channel = interaction.member?.voice?.channel as VoiceBasedChannel;

        if (!channel) {
            throw new Error('You must be in a voice channel to seek audio!');
        }

        const task = this.queues[channel.guild.id].getCurrentTask();

        if (!task) {
            throw new Error('No audio currently playing!');
        }

        task.Seek(startTime);

        await interaction.followUp({
            content: `:clock6: Seeked currently playerd audio to ${startTimeString}`,
        });
    }

    public async skipAudio(interaction: CommandInteraction) {
        //@ts-ignore
        const channel = interaction.member?.voice?.channel as VoiceBasedChannel;

        if (!channel) {
            throw new Error('You must be in a voice channel to skip audio!');
        }

        if (!this.queues[channel.guild.id].isRunning) {
            throw new Error('No audio currently playing!');
        }

        const task = this.queues[channel.guild.id].getCurrentTask();

        if (task) {
            task.Stop();
        }

        await interaction.followUp({
            content: ":track_next: Skipped current audio!",
        });
    }

    public async leave(interaction: CommandInteraction) {
        //@ts-ignore
        const channel = interaction.guildId;

        if (!channel) {
            throw new Error('You must be in a voice channel to leave!');
        }

        if (this.queues[channel]) {
            this.queues[channel].dispose();
            delete this.queues[channel];
        }

        getVoiceConnection(channel)?.disconnect?.();
    }
}

const AudioPlayer = new AudioPlayerClass();
export default AudioPlayer;
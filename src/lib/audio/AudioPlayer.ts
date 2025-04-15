import { CommandInteraction, VoiceBasedChannel } from "discord.js";

import { createAudioPlayer, joinVoiceChannel } from "@discordjs/voice";
import { createDiscordJSAdapter } from "./AudioAdapter";
import LinkExtractor from "../extractors/LinkExtractor";
import AudioQueue from "./AudioQueue";
import AudioTask from "./AudioTask";

class AudioPlayerClass {
    private player = createAudioPlayer();
    private queue = new AudioQueue();

    public async playAudio(
        interaction: CommandInteraction, 
        url: string, 
        startTimeInMs: number = 0, 
        volume: number = 100, 
        loop: boolean = false, 
        force: boolean = false
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

        connection.subscribe(this.player);

        const extractor = await new LinkExtractor().extractUrl(url);
        const bestFormat = await extractor.getBestFormat(true);

        if (!bestFormat) {
            throw new Error('No audio format found!');
        }

        await interaction.followUp({
            content: `:information_source: Queued: ${extractor.getReplyString()}`
        })

        await this.queue.addTask(new AudioTask(
            interaction,
            this.player,
            extractor,
            startTimeInMs,
            volume,
            loop,
            force
        ));
    }

    public async setVolume(interaction: CommandInteraction, volume: number, volumeString: string) {
        const task = this.queue.getCurrentTask();

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
        const task = this.queue.getCurrentTask();

        if (!task) {
            throw new Error('No audio currently playing!');
        }

        task.Seek(startTime);

        await interaction.followUp({
            content: `:clock6: Seeked currently playerd audio to ${startTimeString}`,
        });
    }

    public async skipAudio(interaction: CommandInteraction) {
        if (!this.queue.isRunning) {
            throw new Error('No audio currently playing!');
        }

        const task = this.queue.getCurrentTask();

        if (task) {
            task.Stop();
        }

        await interaction.followUp({
            content: ":track_next: Skipped current audio!",
        });
    }

}

const AudioPlayer = new AudioPlayerClass();
export default AudioPlayer;
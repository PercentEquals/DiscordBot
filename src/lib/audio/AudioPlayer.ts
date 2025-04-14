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
        force?: boolean,
    ) {
        //@ts-ignore
        const channel = interaction.member?.voice?.channel as VoiceBasedChannel;

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
            content: `Queued: ${extractor.getReplyString()}`
        })

        await this.queue.addTask(new AudioTask(this.player, extractor.getReplyString(), bestFormat.url, startTimeInMs, volume));
    }

    public async restartAudio(interaction: CommandInteraction, volume: string | null, startTime: string | null) {

    }

    public async skipAudio(interaction: CommandInteraction) {

    }

}

const AudioPlayer = new AudioPlayerClass();
export default AudioPlayer;
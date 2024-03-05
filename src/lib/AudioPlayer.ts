import { CommandInteraction } from "discord.js";
import { YoutubeDlData } from "../common/sigiState";

import AudioController from "./AudioController";

class AudioPlayer {
    private audioControllerPerChannel: {
        [guildIdAndChannelId: string]: AudioController
    } = {};

    private ensureAudioController(interaction: CommandInteraction) {
        //@ts-ignore - voice is correct
        const channelId = interaction.member?.voice?.channelId;
        const guildId = interaction.guildId;
        const voiceAdapterCreator = interaction.guild?.voiceAdapterCreator;

        if (!voiceAdapterCreator || !channelId || !guildId)
        {
            throw new Error('No voice channel found - join one or check permissions!');
        }

        if (this.audioControllerPerChannel[guildId + channelId]) {
            return this.audioControllerPerChannel[guildId + channelId];
        }

        this.audioControllerPerChannel[guildId + channelId] = new AudioController();
        return this.audioControllerPerChannel[guildId + channelId];
    }

    public async playAudio(interaction: CommandInteraction, url: string, startTimeInMs: number = 0, volume: number = 100, loop: boolean = false, force?: boolean, audioData?: YoutubeDlData) {
        return this.ensureAudioController(interaction).playAudio(interaction, url, startTimeInMs, volume, loop, force, audioData);
    }

    public async restartAudio(interaction: CommandInteraction, volume: string | null, startTime: string | null) {
        return this.ensureAudioController(interaction).restartAudioStream(interaction, volume, startTime);
    }

    public async skipAudio(interaction: CommandInteraction) {
        return this.ensureAudioController(interaction).skipAudio(interaction);
    }

    public async leave(interaction: CommandInteraction) {
        //@ts-ignore - voice is correct
        const channelId = interaction.member?.voice?.channelId;
        const guildId = interaction.guildId;

        this.ensureAudioController(interaction).stopAudio(interaction);
        delete this.audioControllerPerChannel[guildId + channelId];
    }
}

const AudioPlayerMain = new AudioPlayer();
export default AudioPlayerMain;
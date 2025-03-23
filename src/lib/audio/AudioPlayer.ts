import { CommandInteraction } from "discord.js";

import AudioController from "./AudioController";
import IExtractor from "src/lib/extractors/providers/IExtractor";

class AudioPlayer {
    private audioControllerPerChannel: {
        [guildId: string]: AudioController
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

        if (this.audioControllerPerChannel[guildId]) {
            return this.audioControllerPerChannel[guildId];
        }

        this.audioControllerPerChannel[guildId] = new AudioController();
        return this.audioControllerPerChannel[guildId];
    }

    public async playAudio(interaction: CommandInteraction, url: string, startTimeInMs: number = 0, volume: number = 100, loop: boolean = false, force?: boolean, extractor?: IExtractor) {
        return this.ensureAudioController(interaction).playAudio(interaction, url, startTimeInMs, volume, loop, force, extractor);
    }

    public async restartAudio(interaction: CommandInteraction, volume: string | null, startTime: string | null) {
        return this.ensureAudioController(interaction).restartAudioStream(interaction, volume, startTime);
    }

    public async skipAudio(interaction: CommandInteraction) {
        return this.ensureAudioController(interaction).skipAudio(interaction);
    }

    public async leave(interaction: CommandInteraction) {
        const guildId = interaction.guildId as string;

        this.audioControllerPerChannel[guildId]?.stopAudio?.(interaction);
        delete this.audioControllerPerChannel[guildId];
    }
}

const AudioPlayerMain = new AudioPlayer();
export default AudioPlayerMain;
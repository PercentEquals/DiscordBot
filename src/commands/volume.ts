import { ApplicationCommandType, Client, CommandInteraction, SlashCommandStringOption } from "discord.js";

import { reportError } from "../common/errorHelpers";

import { Command } from "../command";
import AudioPlayer from "../lib/audio/AudioPlayer";
import { getVolume } from "src/common/audioUtils";

export const Volume: Command = {
    name: "volume",
    description: "Sets volume of currently played audio [0-100]",
    type: ApplicationCommandType.ChatInput,
    options: [
        new SlashCommandStringOption().setName('volume').setDescription('Audio volume [0-100]').setRequired(true)
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            //@ts-ignore
            const volume: string = interaction.options.getString('volume', true);
            await AudioPlayer.setVolume(interaction, getVolume(volume), volume);
        } catch (e) {
            await reportError(interaction, e);
        }
    }
};
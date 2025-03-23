import { ApplicationCommandType, Client, CommandInteraction, SlashCommandStringOption } from "discord.js";

import { reportError } from "../common/errorHelpers";

import { Command } from "../command";
import AudioPlayerMain from "../lib/audio/AudioPlayer";

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

            if (await AudioPlayerMain.restartAudio(interaction, volume, null)) {
                await interaction.followUp({
                    ephemeral: false,
                    content: `:white_check_mark: Changing volume to ${volume} done!`
                });
            }
        } catch (e) {
            await reportError(interaction, e);
        }
    }
};
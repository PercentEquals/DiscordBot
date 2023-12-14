import { ApplicationCommandType, Client, CommandInteraction, SlashCommandStringOption } from "discord.js";

import { restartAudioStream } from "../common/audioUtils";

import { Command } from "../command";

import logger from "../logger";

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

            restartAudioStream(interaction, volume, null);

            await interaction.followUp({
                ephemeral: false,
                content: `:white_check_mark: Changing volume to ${volume} done!`
            });
        } catch (e) {
            logger.error(e);

            await interaction.followUp({
                ephemeral: false,
                content: `:x: ${e}`
            });
        }
    }
};
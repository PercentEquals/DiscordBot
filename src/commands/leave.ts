import { ApplicationCommandType, Client, CommandInteraction } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";

import { Command } from "../command";
import logger from "../logger";

export const Leave: Command = {
    name: "leave",
    description: "Disconnects from voice",
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            getVoiceConnection(interaction.guildId as string)?.disconnect();

            await interaction.followUp({
                ephemeral: false,
                content: `:white_check_mark: Bye!`
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
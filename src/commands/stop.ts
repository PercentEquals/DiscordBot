import { ApplicationCommandType, Client, CommandInteraction } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";

import { Command } from "../command";
import logger from "../logger";

export const Stop: Command = {
    name: "stop",
    description: "Stops playing audio and disconnects from voice",
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
        }
    }
};
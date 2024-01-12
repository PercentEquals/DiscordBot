import { ApplicationCommandType, Client, CommandInteraction } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";

import { reportError } from "../common/errorHelpers";

import { Command } from "../command";

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
            reportError(interaction, e);
        }
    }
};
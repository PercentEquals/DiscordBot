import { ApplicationCommandType, Client, CommandInteraction } from "discord.js";

import { Command } from "../command";
import logger from "../logger";

import { clearCurrentlyPlaying, getCurrentlyPlaying } from "../global/currentlyPlayingCache";

export const Stop: Command = {
    name: "stop",
    description: "Stops playing currently played audio",
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            //@ts-ignore - CommandInteraction contains member with voice
            const channelId = interaction.member?.voice?.channelId
            const guildId = interaction.guildId as string

            clearCurrentlyPlaying(guildId, channelId);

            await interaction.followUp({
                ephemeral: false,
                content: `:white_check_mark: Stopped playing currently played audio!`
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
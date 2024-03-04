import { ApplicationCommandType, Client, CommandInteraction } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";

import { reportError } from "../common/errorHelpers";

import { Command } from "../command";
import { clearCurrentlyPlaying, clearQueue } from "../global/currentlyPlayingCache";

export const Leave: Command = {
    name: "leave",
    description: "Disconnects from voice",
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            //@ts-ignore - CommandInteraction contains member with voice
            const channelId = interaction.member?.voice?.channelId
            const guildId = interaction.guildId as string

            clearQueue(guildId, channelId);
            clearCurrentlyPlaying(guildId, channelId);
            getVoiceConnection(interaction.guildId as string)?.disconnect();

            await interaction.followUp({
                ephemeral: false,
                content: `:white_check_mark: Bye!`
            });
        } catch (e) {
            await reportError(interaction, e);
        }
    }
};
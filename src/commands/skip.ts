import { ApplicationCommandType, Client, CommandInteraction } from "discord.js";

import { reportError } from "../common/errorHelpers";

import { Command } from "../command";

import { clearCurrentlyPlaying } from "../global/currentlyPlayingCache";

export const Skip: Command = {
    name: "skip",
    description: "Skips currently played audio",
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            //@ts-ignore - CommandInteraction contains member with voice
            const channelId = interaction.member?.voice?.channelId;
            const guildId = interaction.guildId as string;

            clearCurrentlyPlaying(guildId, channelId);

            await interaction.followUp({
                ephemeral: false,
                content: `:white_check_mark: Skipped currently played audio!`
            });
        } catch (e) {
            await reportError(interaction, e);
        }
    }
};
import { ApplicationCommandType, Client, CommandInteraction } from "discord.js";

import { reportError } from "../common/errorHelpers";

import { Command } from "../command";
import AudioPlayer from "../lib/audio/AudioPlayer";

export const Skip: Command = {
    name: "skip",
    description: "Skips currently played audio",
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            if (await AudioPlayer.skipAudio(interaction)) {
                await interaction.followUp({
                    ephemeral: false,
                    content: `:white_check_mark: Skipped currently played audio!`
                });
            }
        } catch (e) {
            await reportError(interaction, e);
        }
    }
};
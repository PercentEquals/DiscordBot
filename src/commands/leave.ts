import { ApplicationCommandType, Client, CommandInteraction } from "discord.js";

import { reportError } from "../common/errorHelpers";

import { Command } from "../command";
import AudioPlayerMain from "../lib/audio/AudioPlayer";

export const Leave: Command = {
    name: "leave",
    description: "Disconnects from voice",
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            await AudioPlayerMain.leave(interaction);            

            await interaction.followUp({
                ephemeral: false,
                content: `:white_check_mark: Bye!`
            });
        } catch (e) {
            await reportError(interaction, e);
        }
    }
};
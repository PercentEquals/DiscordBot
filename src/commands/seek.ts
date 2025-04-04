import { ApplicationCommandType, Client, CommandInteraction, SlashCommandStringOption } from "discord.js";

import { reportError } from "../common/errorHelpers";

import { Command } from "../command";
import AudioPlayerMain from "../lib/audio/AudioPlayer";

export const Seek: Command = {
    name: "seek",
    description: "Seeks time in currently played audio",
    type: ApplicationCommandType.ChatInput,
    options: [
        new SlashCommandStringOption().setName('time').setDescription('Seek time in 00:00:00 format').setRequired(true)
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            //@ts-ignore
            const time: string = interaction.options.getString('time', true);

            if (await AudioPlayerMain.restartAudio(interaction, null, time)) {
                await interaction.followUp({
                    ephemeral: false,
                    content: `:white_check_mark: Seek to ${time} done!`
                });
            }
        } catch (e) {
            await reportError(interaction, e);
        }
    }
};
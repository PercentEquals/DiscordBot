import { ApplicationCommandType, Client, CommandInteraction, SlashCommandStringOption } from "discord.js";

import { reportError } from "../common/errorHelpers";

import { Command } from "../command";
import AudioPlayer from "../lib/audio/AudioPlayer";
import { getStartTimeInMs } from "src/common/audioUtils";

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
            await AudioPlayer.seek(interaction, getStartTimeInMs(time), time);
        } catch (e) {
            await reportError(interaction, e);
        }
    }
};
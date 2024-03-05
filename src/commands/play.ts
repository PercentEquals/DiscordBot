import { ApplicationCommandType, Client, CommandInteraction, SlashCommandBooleanOption, SlashCommandStringOption } from "discord.js";

import { Command } from "../command";
import { extractUrl, validateUrl } from "../common/validateUrl";
import { getVolume, getStartTimeInMs } from "../common/audioUtils";
import { reportError } from "../common/errorHelpers";
import AudioPlayerMain from "../lib/AudioPlayer";

export const Play: Command = {
    name: "play",
    description: "Play audio on voice via url",
    type: ApplicationCommandType.ChatInput,
    options: [
        new SlashCommandStringOption().setName('url').setDescription('Tiktok link').setRequired(true),
        new SlashCommandBooleanOption().setName('force').setDescription('Should force play instead of adding to queue?').setRequired(false),
        new SlashCommandStringOption().setName('volume').setDescription('Audio volume [0-100]').setRequired(false),
        new SlashCommandStringOption().setName('start').setDescription('Start time in 00:00:00 format').setRequired(false),
        new SlashCommandBooleanOption().setName('loop').setDescription('Should audio be looped until stopped?').setRequired(false)
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            //@ts-expect-error - Bad types
            const url: string = await extractUrl(interaction.options.getString('url', true));
            //@ts-expect-error - Bad types
            const force: boolean = interaction.options.getBoolean('force', false);
            //@ts-expect-error - Bad types
            const startTime: string = interaction.options.getString('start', false);
            //@ts-expect-error - Bad types
            const volume: string = interaction.options.getString('volume', false);
            //@ts-expect-error - Bad types
            const loop: boolean = interaction.options.getBoolean('loop', false);

            validateUrl(new URL(url));

            AudioPlayerMain.playAudio(interaction, url, getStartTimeInMs(startTime), getVolume(volume), loop, force);
        } catch (e) {
            await reportError(interaction, e);
        }
    }
};
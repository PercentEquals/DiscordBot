import { ApplicationCommandType, Client, CommandInteraction, SlashCommandStringOption } from "discord.js";

import { Command } from "../command";
import logger from "../logger";
import { getAudioStream, getCurrentlyPlaying, getStartTimeInMs, probeAndCreateResource } from "./play";

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

            //@ts-ignore - CommandInteraction contains member with voice
            const channelId = interaction.member?.voice?.channelId
            const guildId = interaction.guildId as string

            const currentlyPlaying = getCurrentlyPlaying(guildId, channelId);

            if (!currentlyPlaying) {
                await interaction.followUp({
                    ephemeral: false,
                    content: `:information_source: Nothing is playing!`
                });

                return;
            }

            const startTimeMs = getStartTimeInMs(time);

            currentlyPlaying.audioStream.emit('end');

            const audioStream = await new Promise(async (resolve, reject) => {
                resolve(getAudioStream(currentlyPlaying.url, startTimeMs, reject));
            });
            const resource = await probeAndCreateResource(audioStream, currentlyPlaying.url);

            currentlyPlaying.audioPlayer.play(resource);

            await interaction.followUp({
                ephemeral: false,
                content: `:white_check_mark: Seek to ${time} done!`
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
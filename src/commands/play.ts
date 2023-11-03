import { ApplicationCommandType, Client, CommandInteraction, InternalDiscordGatewayAdapterCreator, SlashCommandStringOption } from "discord.js";
import { AudioPlayerStatus, NoSubscriberBehavior, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";

import { Command } from "../command";
import { debugJson } from "../debug";
import { getBestFormat } from "../common/formatFinder";

import youtubedl, { YtResponse } from "youtube-dl-exec";

const playAudio = async (url: string, interaction: CommandInteraction) => {
    let audioData = await youtubedl(url, {
        noWarnings: true,
        dumpSingleJson: true,
        getFormat: true,
    });

    //@ts-ignore - youtube-dl-exec videoData contains useless first line
    audioData = audioData.split('\n').slice(1).join('\n');
    audioData = JSON.parse(audioData as any) as YtResponse;

    debugJson('audioData', audioData);

    const bestFormat = getBestFormat(url, audioData, true);

    if (!bestFormat) {
        throw new Error('No audio found');
    }

    return new Promise(async (resolve, reject) => {
        let isRejected = false;

        //@ts-ignore - CommandInteraction contains member with voice
        const channelId = interaction.member?.voice?.channelId
        const guildId = interaction.guildId
        const adapterCreator = interaction.guild?.voiceAdapterCreator

        if (!channelId || !guildId || !adapterCreator) {
            throw new Error('No voice channel found - join one or check permissions');
        }

        const connection = joinVoiceChannel({
            channelId: channelId as string,
            guildId: guildId as string,
            adapterCreator: adapterCreator as InternalDiscordGatewayAdapterCreator
        });

        connection.on('error', error => {
            if (isRejected) return;

            connection.destroy();
            reject(error);
            isRejected = true;
        });

        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });

        const resource = createAudioResource(bestFormat.url, {
            metadata: {
                title: audioData.title,
            },
        });

        player.play(resource);
        connection.subscribe(player);

        player.on('error', error => {
            if (isRejected) return;

            player.stop();
            reject(error);
            isRejected = true;
        });
        
        player.on(AudioPlayerStatus.Idle, async () => {
            if (isRejected) return;

            const msg = await interaction.editReply({
                content: `\nFinished playing audio: ${url} !`,
            });

            try {
                connection.destroy();
                msg.suppressEmbeds(true);
            } catch (e) {
                console.warn(e);
            }

            resolve(true);
        });

        const msg = await interaction.followUp({
            ephemeral: false,
            content: `\nPlaying audio: ${url}`
        });

        try {
            msg.suppressEmbeds(true);
        } catch (e) {
            console.warn(e);
        }
    });
}

export const Play: Command = {
    name: "play",
    description: "Play audio on voice via url",
    type: ApplicationCommandType.ChatInput,
    options: [
        new SlashCommandStringOption().setName('url').setDescription('Tiktok link').setRequired(true),
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        try {
            //@ts-ignore
            const url: string = interaction.options.getString('url', true);

            await playAudio(url, interaction);
        } catch (e) {
            console.error(e);

            await interaction.followUp({
                ephemeral: false,
                content: `\n${e}`
            })
        }
    }
};
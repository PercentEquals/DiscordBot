import { Commands } from "../commands";

import getConfig from "../setup/configSetup";
import { ALLOWED_AUTO_LINK_HOSTS } from "../constants/allowedautolinkhosts";
import { Attachment, Client, CommandInteraction, Message } from "discord.js";

export default async function handleAutomaticTiktokLinks(client: Client, message: Message): Promise<void> {
    if (getConfig().automaticTiktokLinks) {
        return;
    }
    
    const getString = (path: string, required: boolean) => {
        if (path === 'url') {
            const url = message.content.match(/\bhttps?:\/\/\S+/gi)?.[0];
            return url ?? message.content;
        }
    }

    const messageInteraction = {
        options: {
            getString,
            getBoolean: () => false,
        },
        followUp: async ({ content, files }: {
            content: string,
            files: Attachment[],
        }) => {
            if (!files) {
                return;
            }

            try {
                await message.reply({
                    files,
                    allowedMentions: {
                        repliedUser: false
                    }
                });
                await message.suppressEmbeds(true);
            } catch (e) {
                console.error(e);
            }
        },
    };

    await handleMessageCommand(client, messageInteraction as any, message);
}

const handleMessageCommand = async (client: Client, interaction: CommandInteraction, message: Message): Promise<void> => {
    try {
        let found = false;
        
        for (var host of ALLOWED_AUTO_LINK_HOSTS) {
            if (message.content.includes(host)) {
                found = true;
            }
        }

        if (!found) {
            return;
        }

        const slashCommand = Commands.find(c => c.name === 'tiktok');
        if (!slashCommand) {
            return;
        }

        console.log('[discord] Automatic link found - Running command: ' + slashCommand.name);

        await message.channel.sendTyping();
        await slashCommand.run(client, interaction);

        return;
    } catch (e) {
        console.error(e);
    }
};
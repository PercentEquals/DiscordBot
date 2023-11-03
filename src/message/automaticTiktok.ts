import { Commands } from "../commands";

import { Attachment, Client, CommandInteraction, Message } from "discord.js";

import getConfig from "../setup/configSetup";
import { ALLOWED_AUTO_LINK_HOSTS } from "../constants/allowedautolinkhosts";
import logger from "../logger";

export default async function handleAutomaticTiktokLinks(client: Client, message: Message): Promise<void> {
    if (!getConfig().botOptions.automaticLinkDetection) {
        return;
    }
    
    const getString = (path: string, required: boolean) => {
        if (path === 'url') {
            const url = message.content.match(/\bhttps?:\/\/\S+/gi)?.[0];
            return url ?? message.content;
        }
    }

    const followUp = async ({ content, files }: {
        content: string,
        files: Attachment[],
    }) => {
        try {
            if (!files && getConfig().botOptions.automaticLinkDetectionErrorReply) {
                await message.reply({
                    content,
                    allowedMentions: {
                        repliedUser: false
                    }
                });
                return;
            }

            if (!files) {
                return;
            }

            await message.reply({
                files,
                allowedMentions: {
                    repliedUser: false
                }
            });
            await message.suppressEmbeds(true);
        } catch (e) {
            logger.warn(e);
        }
    };

    const messageInteraction = {
        options: {
            getString,
            getBoolean: () => false,
        },
        followUp,
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

        logger.info('[bot] automatic link found - running command: ' + slashCommand.name);

        await message.channel.sendTyping();
        await slashCommand.run(client, interaction);

        return;
    } catch (e) {
        logger.error(e);
    }
};
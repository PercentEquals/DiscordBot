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
        if (path === "url") {
            return message.content;
        }

        if (path === "isAutomaticLink") {
            return true;
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
                await message.suppressEmbeds(true);
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
        let found = ALLOWED_AUTO_LINK_HOSTS.some((host) => message.content.includes(host));

        if (!found) {
            return;
        }

        const slashCommand = Commands.find(c => c.name === 'tiktok');
        if (!slashCommand) {
            return;
        }

        logger.info('[bot] automatic link found - running command: ' + slashCommand.name);

        //@ts-ignore
        await message.channel.sendTyping();
        await slashCommand.run(client, interaction);

        return;
    } catch (e) {
        logger.error(e);
    }
};
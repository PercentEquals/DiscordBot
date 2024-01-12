import { CommandInteraction } from "discord.js";
import logger from "../logger";

export function reportError(interaction: CommandInteraction, e: any, additionalMessage?: string) {
    logger.error(e);

    interaction.followUp({
        ephemeral: false,
        content: ":x: An error occurred: " + "```" + e + "```" + (additionalMessage ? "\n" + additionalMessage : "")
    });
}
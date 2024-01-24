import { CommandInteraction } from "discord.js";

import logger from "../logger";
import getConfig from "../setup/configSetup";

import { ALLOWED_YTD_HOSTS } from "../constants/allowedytdhosts";

import { extractUrl } from "./validateUrl";

export function reportError(interaction: CommandInteraction, e: any, useFallbackLink?: boolean) {
    logger.error(e);

    let fallbackLink = "";

    if (useFallbackLink && getConfig().botOptions.useVxFallback) {
        try {
            //@ts-expect-error - Bad types
            const url: string = extractUrl(interaction.options.getString('url', true));
            const vxUrl = new URL(url);

            if (ALLOWED_YTD_HOSTS.includes(vxUrl.hostname)) {
                vxUrl.hostname.replace("tiktok", "vxtiktok");
                vxUrl.hostname.replace("twitter", "vxtwitter");
                fallbackLink = vxUrl.toString();
            }
        } catch (e) {
            logger.error(e);
            // Ignore
        }
    }

    interaction.followUp({
        ephemeral: false,
        content: ":x: An error occurred" + (fallbackLink ? ` (using ${fallbackLink} as fallback)` : "") + ": ```" + e + "```"
    });
}
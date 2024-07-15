import { CommandInteraction } from "discord.js";

import logger from "../logger";
import getConfig from "../setup/configSetup";

import { ALLOWED_YTD_HOSTS } from "../constants/allowedytdhosts";

import { extractUrl } from "./validateUrl";
import { IGNORED_AUTO_LINK_ERRORS_HOSTS } from "src/constants/ignoredautolinkerrorshosts";

export async function reportError(interaction: CommandInteraction, e: any, useFallbackLink?: boolean) {
    logger.error(e);

    let fallbackLink = "";
    let isAutomaticLink = false;

    try {
        //@ts-expect-error - Bad types
        isAutomaticLink = interaction.options.getString('isAutomaticLink', false) ?? false;
        //@ts-expect-error - Bad types
        const url: string = await extractUrl(interaction.options.getString('url', true));
        const vxUrl = new URL(url);

        if (isAutomaticLink && IGNORED_AUTO_LINK_ERRORS_HOSTS.includes(vxUrl.hostname)) {
            //return;
        }

        if (useFallbackLink && getConfig().botOptions.useVxFallback) {
            if (ALLOWED_YTD_HOSTS.includes(vxUrl.hostname)) {
                vxUrl.hostname = vxUrl.hostname.replace("tiktok", "vxtiktok");
                vxUrl.hostname = vxUrl.hostname.replace("twitter", "vxtwitter");

                if (vxUrl.hostname.startsWith('x')) {
                    vxUrl.hostname = vxUrl.hostname.replace("x", "vxtwitter");
                }

                fallbackLink = vxUrl.toString();
            }
        }
    } catch (e) {
        logger.error(e);
        // Ignore
    }

    if (getConfig().botOptions.verboseErrorReply) {
        interaction.followUp({
            ephemeral: false,
            content: ":x: An error occurred" + (fallbackLink ? ` (using ${fallbackLink} as fallback)` : "") + ": ```" + e + "```"
        });
    } else if (fallbackLink.length !== 0) {
        interaction.followUp({
            ephemeral: false,
            content: fallbackLink
        });
    } else if (isAutomaticLink) {
        return;
    } else {
        interaction.followUp({
            ephemeral: false,
            content: ":x: An error occurred" + (fallbackLink ? ` (using ${fallbackLink} as fallback)` : "") + ": ```" + e + "```"
        });
    }
}
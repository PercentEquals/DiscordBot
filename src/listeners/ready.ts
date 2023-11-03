import { Client } from "discord.js";
import { Commands } from "../commands";
import logger from "../logger";

export default (client: Client): void => {
    client.on("ready", async () => {
        if (!client.user || !client.application) {
            return;
        }

        logger.info(`[bot] ${client.user.username} is online`);
        await client.application.commands.set(Commands);
    });
};
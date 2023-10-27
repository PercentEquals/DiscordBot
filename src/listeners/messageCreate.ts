import { Client } from "discord.js";

import handleAutomaticTiktokLinks from "../message/automaticTiktok";

export default (client: Client): void => {
    client.on("messageCreate", async (message) => {
        if (message.author.bot) {
            return;
        }

        await handleAutomaticTiktokLinks(client, message);
    });
};
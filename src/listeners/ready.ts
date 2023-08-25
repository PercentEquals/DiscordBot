import { Client } from "discord.js";
import { Commands } from "../commands";

export default (client: Client): void => {
    client.on("ready", async () => {
        if (!client.user || !client.application) {
            return;
        }

        console.log(`[discord] ${client.user.username} is online`);
        await client.application.commands.set(Commands);
    });
};
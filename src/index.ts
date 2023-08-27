import { Client } from 'discord.js';
import "dotenv/config.js";

import ready from "./listeners/ready";
import interactionCreate from "./listeners/interactionCreate";

console.log("[discord] Bot is starting...");

const client = new Client({
    intents: []
});

ready(client);
interactionCreate(client);

client.login(process.env.TOKEN as string);
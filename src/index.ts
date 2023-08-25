import { Client } from 'discord.js';
import "dotenv/config.js";

import ready from "./listeners/ready";
import interactionCreate from "./listeners/interactionCreate";
import { setupFfmpeg } from './ffmpegSetup';

console.log("[discord] Bot is starting...");

const client = new Client({
    intents: []
});

ready(client);
interactionCreate(client);

setupFfmpeg();

client.login(process.env.TOKEN as string);
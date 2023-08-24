import { Client } from 'discord.js';
import "dotenv/config.js";

import { register } from 'ts-node';

import ready from "./listeners/ready";
import interactionCreate from "./listeners/interactionCreate";

console.log("Bot is starting...");

const client = new Client({
    intents: []
});

ready(client);
interactionCreate(client);

register();

client.login(process.env.TOKEN as string);
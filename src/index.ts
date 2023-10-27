import { Client, GatewayIntentBits, Partials } from 'discord.js';
import "dotenv/config.js";

import fs from "fs";
import ready from "./listeners/ready";
import interactionCreate from "./listeners/interactionCreate";
import messageCreate from './listeners/messageCreate';
import setupFfmpeg from './setup/ffmpegSetup';
import getConfig from './setup/configSetup';

console.log("[discord] Bot is starting...");
fs.mkdirSync('debug', { recursive: true });

setupFfmpeg();

const intents = [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
];

const partials = [
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message
];

if (getConfig().automaticLinkDetection) {
    console.warn("[discord] Automatic link detection is enabled, to ensure this works, please enable the MESSAGE CONTENT INTENT in your bot settings.");
    intents.push(GatewayIntentBits.MessageContent);
}

const client = new Client({ intents, partials });

ready(client);
interactionCreate(client);
messageCreate(client);

client.login(process.env.TOKEN as string);
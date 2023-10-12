import { Client, IntentsBitField, Partials } from 'discord.js';
import "dotenv/config.js";

import fs from "fs";
import ready from "./listeners/ready";
import interactionCreate from "./listeners/interactionCreate";
import { setupFfmpeg } from './setup/ffmpegSetup';

console.log("[discord] Bot is starting...");
fs.mkdirSync('debug', { recursive: true });

setupFfmpeg();

const client = new Client({
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message
    ],
    intents: [
        IntentsBitField.Flags.DirectMessageTyping,
        IntentsBitField.Flags.DirectMessages
    ]
});

ready(client);
interactionCreate(client);

client.login(process.env.TOKEN as string);
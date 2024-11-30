import { Client, GatewayIntentBits, Partials } from 'discord.js';
import "dotenv/config.js";

import ready from "./listeners/ready";
import interactionCreate from "./listeners/interactionCreate";
import messageCreate from './listeners/messageCreate';
import setupFFmpeg from './setup/ffmpegSetup';
import getConfig from './setup/configSetup';
import logger from './logger';

logger.info(`[bot] starting bot...`);

await setupFFmpeg();

const intents = [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
];

const partials = [
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
];

if (getConfig().botOptions.automaticLinkDetection) {
    logger.warn(`[bot] automatic link detection is enabled, to ensure this works, please enable the MESSAGE CONTENT INTENT in your bot settings.`);
    intents.push(GatewayIntentBits.MessageContent);
}

const client = new Client({ intents, partials });

ready(client);
interactionCreate(client);
messageCreate(client);

await client.login(process.env.TOKEN as string);
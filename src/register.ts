import { REST, Routes } from 'discord.js';
import { Commands } from './commands';

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN as string);

export async function register() {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(process.env.APPID as string), { body: Commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
}
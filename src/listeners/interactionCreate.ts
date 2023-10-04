import { Client, CommandInteraction, Interaction } from "discord.js";
import { Commands } from "../commands";

export default (client: Client): void => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        if (interaction.isCommand()) {
            await handleSlashCommand(client, interaction);
        }
    });

    client.on("messageCreate", async (message) => {
        if (message.author.bot) {
            return;
        }

        await message.reply('I\'m ready!');
    });
};

const handleSlashCommand = async (client: Client, interaction: CommandInteraction): Promise<void> => {
    const slashCommand = Commands.find(c => c.name === interaction.commandName);
    if (!slashCommand) {
        return;
    }

    await interaction.deferReply();

    console.log('[discord] Running command: ' + slashCommand.name);
    slashCommand.run(client, interaction);
};
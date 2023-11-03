import { Client, CommandInteraction, Interaction } from "discord.js";
import { Commands } from "../commands";
import logger from "../logger";

export default (client: Client): void => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        if (interaction.isCommand()) {
            await handleSlashCommand(client, interaction);
        }
    });
};

const handleSlashCommand = async (client: Client, interaction: CommandInteraction): Promise<void> => {
    const slashCommand = Commands.find(c => c.name === interaction.commandName);
    if (!slashCommand) {
        return;
    }

    await interaction.deferReply();

    logger.info('[bot] running command: ' + slashCommand.name);
    await slashCommand.run(client, interaction);
};
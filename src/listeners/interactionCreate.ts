import { Client, CommandInteraction, Interaction } from "discord.js";
import { Commands } from "../commands";

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
        interaction.followUp({ content: "owo whats this - no command?" });
        return;
    }

    await interaction.deferReply();

    slashCommand.run(client, interaction);
};
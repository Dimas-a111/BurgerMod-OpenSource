import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  REST,
  Routes,
} from "discord.js";
import { logger } from "../lib/logger";
import { commands as utilityCommands } from "./commands/utility";
import { commands as moderationCommands } from "./commands/moderation";
import { commands as funCommands } from "./commands/fun";
import { commands as rolesCommands } from "./commands/roles";

interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const commandCollection = new Collection<string, Command>();

const allCommands: Command[] = [
  ...utilityCommands,
  ...moderationCommands,
  ...funCommands,
  ...rolesCommands,
];

for (const command of allCommands) {
  commandCollection.set(command.data.name, command);
}

async function registerCommands(token: string, clientId: string) {
  const rest = new REST().setToken(token);
  const body = allCommands.map((c) => c.data.toJSON());
  try {
    await rest.put(Routes.applicationCommands(clientId), { body });
    logger.info({ count: body.length }, "Slash commands registered globally");
  } catch (err) {
    logger.error({ err }, "Failed to register slash commands");
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  logger.info({ tag: readyClient.user.tag }, "Discord bot is online");
  const token = process.env["DISCORD_BOT_TOKEN"]!;
  await registerCommands(token, readyClient.user.id);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commandCollection.get(interaction.commandName);
  if (!command) {
    logger.warn({ name: interaction.commandName }, "Unknown command received");
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error({ err, command: interaction.commandName }, "Command error");
    const reply = {
      content: "There was an error running this command.",
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

export function startBot() {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    logger.warn("DISCORD_BOT_TOKEN not set — bot will not start");
    return;
  }
  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to login to Discord");
  });
}

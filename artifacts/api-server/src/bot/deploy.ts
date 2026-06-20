/**
 * Run this script ONCE to register slash commands with Discord globally.
 * Commands persist until you run this script again to update/remove them.
 * This script does NOT run on every bot startup — only when you intentionally
 * want to update the registered commands.
 *
 * Usage: pnpm --filter @workspace/api-server run deploy-commands
 */
import { REST, Routes } from "discord.js";
import { commands as utilityCommands } from "./commands/utility";
import { commands as moderationCommands } from "./commands/moderation";
import { commands as funCommands } from "./commands/fun";

const token = process.env["DISCORD_BOT_TOKEN"];
if (!token) {
  console.error("DISCORD_BOT_TOKEN is not set.");
  process.exit(1);
}

const allCommands = [
  ...utilityCommands,
  ...moderationCommands,
  ...funCommands,
].map((c) => c.data.toJSON());

const rest = new REST().setToken(token);

async function deploy() {
  console.log(`Registering ${allCommands.length} global slash commands...`);

  const data = await rest.put(
    Routes.applicationCommands(process.env["DISCORD_CLIENT_ID"] ?? ""),
    { body: allCommands }
  ) as unknown[];

  console.log(`Successfully registered ${data.length} global commands.`);
  console.log("Commands will appear in all servers within ~1 hour.");
}

deploy().catch((err) => {
  console.error("Failed to register commands:", err);
  process.exit(1);
});

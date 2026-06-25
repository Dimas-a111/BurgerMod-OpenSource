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
  TextChannel,
  EmbedBuilder,
  GuildMember,
  PartialGuildMember,
  MessageFlags,
} from "discord.js";
import OpenAI from "openai";
import { logger } from "../lib/logger";
import { commands as utilityCommands } from "./commands/utility";
import { commands as moderationCommands } from "./commands/moderation";
import { commands as funCommands } from "./commands/fun";
import { commands as rolesCommands } from "./commands/roles";
import { commands as voiceCommands } from "./commands/voice";
import { commands as levelingCommands } from "./commands/leveling";
import { commands as serverConfigCommands } from "./commands/server_config";
import { commands as miscCommands } from "./commands/misc";
import { commands as notificationCommands } from "./commands/notifications";
import {
  getConfig,
  getXP,
  xpNeeded,
  afkStore,
  reactionRoles,
  stay247,
  trackedUsers,
} from "./store";
import { joinVoiceChannel } from "@discordjs/voice";

interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const commandCollection = new Collection<string, Command>();

const allCommands: Command[] = [
  ...utilityCommands,
  ...moderationCommands,
  ...funCommands,
  ...rolesCommands,
  ...voiceCommands,
  ...levelingCommands,
  ...serverConfigCommands,
  ...miscCommands,
  ...notificationCommands,
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

// ── READY ───────────────────────────────────────────────────────────────────
client.once(Events.ClientReady, async (readyClient) => {
  logger.info({ tag: readyClient.user.tag }, "Discord bot is online");
  const token = process.env["DISCORD_BOT_TOKEN"]!;
  await registerCommands(token, readyClient.user.id);
});

// ── INTERACTION ──────────────────────────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  // ── Button: Verify ────────────────────────────────────────────────────────
  if (interaction.isButton()) {
    if (interaction.customId.startsWith("verify_")) {
      const guildId = interaction.customId.replace("verify_", "");
      const cfg = getConfig(guildId);
      if (!cfg.verifyRoleId) {
        await interaction.reply({ content: "❌ Verification role not configured.", ephemeral: true });
        return;
      }
      const member = interaction.member as GuildMember;
      if (member.roles.cache.has(cfg.verifyRoleId)) {
        await interaction.reply({ content: "✅ You are already verified!", ephemeral: true });
        return;
      }
      try {
        await member.roles.add(cfg.verifyRoleId);
        await interaction.reply({ content: "✅ You have been verified! Welcome to the server.", ephemeral: true });
      } catch {
        await interaction.reply({ content: "❌ Could not assign role. Make sure the bot's role is above the verify role.", ephemeral: true });
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  logger.info({ name: interaction.commandName }, "Command received");

  const command = commandCollection.get(interaction.commandName);
  if (!command) {
    logger.warn({ name: interaction.commandName }, "Unknown command");
    await interaction.reply({ content: "Unknown command.", ephemeral: true });
    return;
  }

  try {
    await command.execute(interaction);
    logger.info({ name: interaction.commandName }, "Command completed");
  } catch (err) {
    logger.error({ err, command: interaction.commandName }, "Command error");
    const reply = { content: `Error: ${(err as Error).message}`, ephemeral: true };
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    } catch { /* ignore */ }
  }
});

// ── MEMBER JOIN ──────────────────────────────────────────────────────────────
client.on(Events.GuildMemberAdd, async (member) => {
  const cfg = getConfig(member.guild.id);

  // Join log
  if (cfg.joinChannelId) {
    const ch = member.guild.channels.cache.get(cfg.joinChannelId) as TextChannel | undefined;
    if (ch) {
      const embed = new EmbedBuilder()
        .setTitle("Member Joined")
        .setDescription(`${member.user} joined the server.`)
        .setThumbnail(member.user.displayAvatarURL())
        .setColor(0x57f287)
        .addFields(
          { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "Member Count", value: member.guild.memberCount.toString(), inline: true }
        );
      ch.send({ embeds: [embed] }).catch(() => {});
    }
  }

  // Auto role
  const roleId = member.user.bot ? cfg.autoRoleBotId : cfg.autoRoleId;
  if (roleId) {
    member.roles.add(roleId).catch(() => {});
  }

  // Anti-raid: kick new accounts < 7 days old
  if (cfg.antiRaid) {
    const accountAge = Date.now() - member.user.createdTimestamp;
    if (accountAge < 7 * 24 * 60 * 60 * 1000) {
      member.kick("Anti-raid: account too new").catch(() => {});
    }
  }
});

// ── MEMBER LEAVE ─────────────────────────────────────────────────────────────
client.on(Events.GuildMemberRemove, async (member: GuildMember | PartialGuildMember) => {
  const cfg = getConfig(member.guild.id);
  if (!cfg.leaveChannelId) return;
  const ch = member.guild.channels.cache.get(cfg.leaveChannelId) as TextChannel | undefined;
  if (!ch) return;
  const embed = new EmbedBuilder()
    .setTitle("Member Left")
    .setDescription(`${member.user?.tag ?? "Unknown"} left the server.`)
    .setColor(0xed4245);
  ch.send({ embeds: [embed] }).catch(() => {});
});

// ── MESSAGE ───────────────────────────────────────────────────────────────────
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  const cfg = getConfig(message.guild.id);
  const content = message.content.toLowerCase();

  // Blocked words
  if (cfg.blockedWords.some((w) => content.includes(w))) {
    message.delete().catch(() => {});
    message.channel.send(`${message.author}, that word is not allowed here.`)
      .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000))
      .catch(() => {});
    return;
  }

  // Anti-NSFW: scan image attachments with OpenAI Vision
  if (cfg.antiNsfw && message.attachments.size > 0) {
    const apiKey = process.env["OPENAI_API_KEY"];
    if (apiKey) {
      const ai = new OpenAI({ apiKey });
      for (const [, att] of message.attachments) {
        if (!att.contentType?.startsWith("image/")) continue;
        try {
          const result = await ai.chat.completions.create({
            model: "gpt-4o-mini",
            max_tokens: 5,
            messages: [{
              role: "user",
              content: [
                { type: "text", text: "Does this image contain NSFW content (nudity, explicit sexual content, or graphic gore)? Reply only YES or NO." },
                { type: "image_url", image_url: { url: att.url, detail: "low" } },
              ],
            }],
          });
          const answer = result.choices[0]?.message?.content?.trim().toUpperCase() ?? "";
          if (answer.startsWith("YES")) {
            await message.delete().catch(() => {});
            message.channel.send(`🔞 ${message.author}, NSFW content is not allowed here. Your message was removed.`)
              .then((m) => setTimeout(() => m.delete().catch(() => {}), 6000))
              .catch(() => {});
            break;
          }
        } catch { /* skip on error */ }
      }
    }
  }

  // AFK: remove if they send a message
  if (afkStore.has(message.author.id)) {
    afkStore.delete(message.author.id);
    message.reply("Welcome back! Your AFK status has been removed.").catch(() => {});
  }

  // AFK: notify if they mention an AFK user
  for (const [userId, reason] of afkStore) {
    if (message.mentions.users.has(userId)) {
      message.reply(`That user is AFK: **${reason}**`).catch(() => {});
    }
  }

  // Counting channel
  if (cfg.countingChannelId && message.channelId === cfg.countingChannelId) {
    const num = parseInt(message.content.trim());
    if (isNaN(num)) {
      message.delete().catch(() => {});
    } else {
      message.react("✅").catch(() => {});
    }
  }

  // XP system (anti-farm: 1 XP per minute per user)
  const xp = getXP(message.guild.id, message.author.id);
  const now = Date.now();
  if (now - xp.lastMessage >= 60000) {
    xp.lastMessage = now;
    const gain = Math.floor(Math.random() * 10) + 5;
    xp.xp += gain;
    const needed = xpNeeded(xp.level);
    if (xp.xp >= needed) {
      xp.xp -= needed;
      xp.level += 1;
      message.channel.send(`🎉 ${message.author} leveled up to **Level ${xp.level}**!`)
        .catch(() => {});
    }
  }
});

// ── REACTION ADD ──────────────────────────────────────────────────────────────
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot || !reaction.message.guild) return;
  const guildId = reaction.message.guild.id;
  const rules = reactionRoles.get(guildId) ?? [];
  for (const rule of rules) {
    if (rule.messageId === reaction.message.id && rule.emoji === reaction.emoji.name) {
      const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
      if (member) member.roles.add(rule.roleId).catch(() => {});
    }
  }
});

// ── REACTION REMOVE ───────────────────────────────────────────────────────────
client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (user.bot || !reaction.message.guild) return;
  const guildId = reaction.message.guild.id;
  const rules = reactionRoles.get(guildId) ?? [];
  for (const rule of rules) {
    if (rule.messageId === reaction.message.id && rule.emoji === reaction.emoji.name) {
      const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
      if (member) member.roles.remove(rule.roleId).catch(() => {});
    }
  }
});

// ── VOICE STATE (247 rejoin) ──────────────────────────────────────────────────
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  if (newState.member?.id !== client.user?.id) return;
  if (oldState.channelId && !newState.channelId && stay247.has(oldState.guild.id)) {
    // Bot was disconnected — rejoin
    const channel = oldState.channel;
    if (channel) {
      setTimeout(() => {
        joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator,
        });
      }, 2000);
    }
  }
});

// ── BOOST ─────────────────────────────────────────────────────────────────────
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  const boosted = !oldMember.premiumSince && newMember.premiumSince;
  if (!boosted) return;
  const cfg = getConfig(newMember.guild.id);
  if (!cfg.boostChannelId) return;
  const ch = newMember.guild.channels.cache.get(cfg.boostChannelId) as TextChannel | undefined;
  if (!ch) return;
  const embed = new EmbedBuilder()
    .setTitle("New Server Boost! 🚀")
    .setDescription(`${newMember.user} just boosted the server! Thank you! 💜`)
    .setColor(0xff73fa)
    .setThumbnail(newMember.user.displayAvatarURL());
  ch.send({ embeds: [embed] }).catch(() => {});
});

// ── PRESENCE (user tracking) ──────────────────────────────────────────────────
client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
  const userId = newPresence.userId;
  const tracked = trackedUsers.get(userId);
  if (!tracked) return;
  const guild = client.guilds.cache.get(tracked.guildId);
  if (!guild) return;
  const ch = guild.channels.cache.get(tracked.channelId) as TextChannel | undefined;
  if (!ch) return;
  const wasOnline = oldPresence && oldPresence.status !== "offline";
  const isOnline = newPresence.status !== "offline";
  if (!wasOnline && isOnline) {
    ch.send(`🟢 <@${userId}> is now **online**!`).catch(() => {});
  } else if (wasOnline && !isOnline) {
    ch.send(`🔴 <@${userId}> went **offline**.`).catch(() => {});
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

import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} from "discord.js";
import OpenAI from "openai";
import { afkStore, birthdays, giveaways, getConfig, trackedUsers } from "../store";

function getOpenAI(): OpenAI | null {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

const ROASTS = [
  "You're the reason shampoo has instructions.",
  "You're not stupid — you just have bad luck thinking.",
  "I'd agree with you, but then we'd both be wrong.",
  "You have your entire life to be an idiot. Take the day off.",
  "Some people bring happiness wherever they go. You bring it whenever you go.",
  "I'd call you a tool, but that would imply you're useful.",
  "You're not the dumbest person in the world, but you better hope they don't die.",
  "You're like a cloud — when you disappear, it's a beautiful day.",
  "Light travels faster than sound. That's why you seemed bright until you spoke.",
];

const BURGER_IMAGES = [
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/RedDot_Burger.jpg/1200px-RedDot_Burger.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cheeseburger.jpg/1200px-Cheeseburger.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Food_burger.jpg/1200px-Food_burger.jpg",
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }

const cooldowns = new Map<string, Map<string, number>>();

function checkCooldown(commandName: string, userId: string, seconds: number): number {
  if (!cooldowns.has(commandName)) cooldowns.set(commandName, new Map());
  const cmd = cooldowns.get(commandName)!;
  const now = Date.now();
  const last = cmd.get(userId) ?? 0;
  const remaining = (last + seconds * 1000) - now;
  if (remaining > 0) return Math.ceil(remaining / 1000);
  cmd.set(userId, now);
  return 0;
}

export const commands = [
  {
    data: new SlashCommandBuilder()
      .setName("support")
      .setDescription("Get the support server link"),
    async execute(interaction: ChatInputCommandInteraction) {
      const cfg = getConfig(interaction.guildId ?? "global");
      await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Support").setDescription("Join our support server for help!").setColor(0x5865f2)], ephemeral: true });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("about_server")
      .setDescription("Get detailed info about this server"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      const owner = await guild.fetchOwner();
      const embed = new EmbedBuilder()
        .setTitle(guild.name)
        .setColor(0x5865f2)
        .setDescription(guild.description ?? "No description set.")
        .addFields(
          { name: "Owner", value: owner.user.tag, inline: true },
          { name: "Members", value: guild.memberCount.toString(), inline: true },
          { name: "Boost Level", value: `Level ${guild.premiumTier}`, inline: true },
          { name: "Boosts", value: guild.premiumSubscriptionCount?.toString() ?? "0", inline: true },
          { name: "Channels", value: guild.channels.cache.size.toString(), inline: true },
          { name: "Roles", value: guild.roles.cache.size.toString(), inline: true },
          { name: "Emojis", value: guild.emojis.cache.size.toString(), inline: true },
          { name: "Verification", value: guild.verificationLevel.toString(), inline: true },
          { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
        );
      const icon = guild.iconURL();
      if (icon) embed.setThumbnail(icon);
      const banner = guild.bannerURL();
      if (banner) embed.setImage(banner);
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("afk")
      .setDescription("Set yourself as AFK")
      .addStringOption((o) => o.setName("reason").setDescription("AFK reason").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      const reason = interaction.options.getString("reason") ?? "AFK";
      if (afkStore.has(interaction.user.id)) {
        afkStore.delete(interaction.user.id);
        await interaction.reply(`✅ Welcome back, ${interaction.user}! Your AFK status has been removed.`);
      } else {
        afkStore.set(interaction.user.id, reason);
        await interaction.reply(`✅ You are now AFK: **${reason}**`);
      }
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("set_birthday")
      .setDescription("Set your birthday")
      .addIntegerOption((o) => o.setName("month").setDescription("Month (1-12)").setRequired(true).setMinValue(1).setMaxValue(12))
      .addIntegerOption((o) => o.setName("day").setDescription("Day (1-31)").setRequired(true).setMinValue(1).setMaxValue(31)),
    async execute(interaction: ChatInputCommandInteraction) {
      const month = interaction.options.getInteger("month", true);
      const day = interaction.options.getInteger("day", true);
      birthdays.set(interaction.user.id, { month, day });
      const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      await interaction.reply(`🎂 Birthday set to **${monthNames[month - 1]} ${day}**!`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("track")
      .setDescription("Track when a user comes online or goes offline")
      .addUserOption((o) => o.setName("user").setDescription("User to track").setRequired(true))
      .addChannelOption((o) => o.setName("channel").setDescription("Channel to send alerts to").setRequired(true).addChannelTypes(ChannelType.GuildText)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "You need Manage Server permission.", ephemeral: true }); return;
      }
      const user = interaction.options.getUser("user", true);
      const channel = interaction.options.getChannel("channel", true);
      trackedUsers.set(user.id, {
        guildId: interaction.guildId!,
        channelId: channel.id,
        watcherId: interaction.user.id,
      });
      await interaction.reply(`✅ Now tracking **${user.tag}** — alerts will go to <#${channel.id}>.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("embed")
      .setDescription("Create a custom embed message")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addStringOption((o) => o.setName("title").setDescription("Embed title").setRequired(true))
      .addStringOption((o) => o.setName("description").setDescription("Embed description").setRequired(true))
      .addStringOption((o) => o.setName("color").setDescription("Hex color (e.g. #ff0000)").setRequired(false))
      .addStringOption((o) => o.setName("image").setDescription("Image URL").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
        await interaction.reply({ content: "No permission.", ephemeral: true }); return;
      }
      const title = interaction.options.getString("title", true);
      const description = interaction.options.getString("description", true);
      const colorStr = interaction.options.getString("color");
      const image = interaction.options.getString("image");
      const color = colorStr ? parseInt(colorStr.replace("#", ""), 16) : 0x5865f2;
      const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(color as number);
      if (image) embed.setImage(image);
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("bump")
      .setDescription("Bump this server"),
    async execute(interaction: ChatInputCommandInteraction) {
      const wait = checkCooldown("bump", interaction.guildId!, 7200);
      if (wait > 0) {
        await interaction.reply({ content: `⏱️ This server can be bumped again in **${Math.floor(wait / 60)}m ${wait % 60}s**.`, ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle("Server Bumped!")
        .setDescription(`**${interaction.guild?.name}** has been bumped by ${interaction.user}!`)
        .setColor(0x57f287)
        .setThumbnail(interaction.guild?.iconURL() ?? null);
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("burger_every_1h")
      .setDescription("Toggle sending a random burger image every hour in a channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addChannelOption((o) => o.setName("channel").setDescription("Channel to send burgers in").setRequired(true).addChannelTypes(ChannelType.GuildText)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({ content: "No permission.", ephemeral: true }); return;
      }
      const channel = interaction.options.getChannel("channel", true);
      const textChannel = interaction.guild?.channels.cache.get(channel.id) as TextChannel;
      await interaction.reply(`🍔 Burger time! Sending a burger to <#${channel.id}> every hour!`);
      const sendBurger = async () => {
        const embed = new EmbedBuilder()
          .setTitle("🍔 Hourly Burger!")
          .setImage(pick(BURGER_IMAGES))
          .setColor(0xf5a623)
          .setFooter({ text: "Delivered fresh every hour" });
        await textChannel.send({ embeds: [embed] }).catch(() => {});
      };
      await sendBurger();
      setInterval(sendBurger, 60 * 60 * 1000);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("giveaways")
      .setDescription("Start a giveaway")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addStringOption((o) => o.setName("prize").setDescription("What are you giving away?").setRequired(true))
      .addIntegerOption((o) => o.setName("duration").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(10080))
      .addIntegerOption((o) => o.setName("winners").setDescription("Number of winners (default: 1)").setRequired(false).setMinValue(1).setMaxValue(20)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "No permission.", ephemeral: true }); return;
      }
      await interaction.deferReply();
      const prize = interaction.options.getString("prize", true);
      const duration = interaction.options.getInteger("duration", true);
      const winners = interaction.options.getInteger("winners") ?? 1;
      const endsAt = Date.now() + duration * 60 * 1000;
      const embed = new EmbedBuilder()
        .setTitle("🎉 GIVEAWAY 🎉")
        .setDescription(`**Prize:** ${prize}\nReact with 🎉 to enter!\n\n**Ends:** <t:${Math.floor(endsAt / 1000)}:R>\n**Winners:** ${winners}`)
        .setColor(0xff73fa)
        .setFooter({ text: `Hosted by ${interaction.user.tag}` });
      const channel = interaction.channel as TextChannel;
      const msg = await channel.send({ embeds: [embed] });
      await msg.react("🎉");
      await interaction.editReply("✅ Giveaway started!");
      setTimeout(async () => {
        try {
          const reaction = msg.reactions.cache.get("🎉");
          if (!reaction) return;
          const users = await reaction.users.fetch();
          const valid = [...users.values()].filter((u) => !u.bot);
          if (!valid.length) {
            await msg.channel.send("🎉 Giveaway ended! No valid entries.");
            return;
          }
          const picked: string[] = [];
          const pool = [...valid];
          for (let i = 0; i < Math.min(winners, pool.length); i++) {
            const idx = Math.floor(Math.random() * pool.length);
            picked.push(pool[idx]!.toString());
            pool.splice(idx, 1);
          }
          await msg.channel.send(`🎉 Giveaway ended! Winner(s) of **${prize}**: ${picked.join(", ")} — Congratulations!`);
        } catch { /* giveaway ended */ }
      }, duration * 60 * 1000);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("purge")
      .setDescription("Delete messages in bulk (with cooldown)")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addIntegerOption((o) => o.setName("amount").setDescription("Messages to delete (1–100)").setRequired(true).setMinValue(1).setMaxValue(100)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
        await interaction.reply({ content: "No permission.", ephemeral: true }); return;
      }
      const wait = checkCooldown("purge", interaction.user.id, 10);
      if (wait > 0) {
        await interaction.reply({ content: `⏱️ Purge is on cooldown. Wait **${wait}s**.`, ephemeral: true }); return;
      }
      const channel = interaction.channel;
      if (!(channel instanceof TextChannel)) {
        await interaction.reply({ content: "Text channels only.", ephemeral: true }); return;
      }
      await interaction.deferReply({ ephemeral: true });
      const amount = interaction.options.getInteger("amount", true);
      const deleted = await channel.bulkDelete(amount, true);
      await interaction.editReply(`✅ Deleted **${deleted.size}** message(s).`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("create_role")
      .setDescription("Create a new role (with cooldown)")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .addStringOption((o) => o.setName("name").setDescription("Role name").setRequired(true))
      .addStringOption((o) => o.setName("color").setDescription("Hex color (e.g. #ff0000)").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
        await interaction.reply({ content: "No permission.", ephemeral: true }); return;
      }
      const wait = checkCooldown("create_role", interaction.user.id, 30);
      if (wait > 0) {
        await interaction.reply({ content: `⏱️ Create role is on cooldown. Wait **${wait}s**.`, ephemeral: true }); return;
      }
      await interaction.deferReply();
      const name = interaction.options.getString("name", true);
      const colorStr = interaction.options.getString("color");
      const color = colorStr ? parseInt(colorStr.replace("#", ""), 16) : undefined;
      const role = await interaction.guild!.roles.create({ name, color: color as number | undefined });
      await interaction.editReply(`✅ Created role **${role.name}** (ID: ${role.id}).`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("roast")
      .setDescription("Roast someone for fun using AI")
      .addUserOption((o) => o.setName("user").setDescription("User to roast").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user", true);
      const member = interaction.guild?.members.cache.get(user.id);
      const ai = getOpenAI();

      if (!ai) {
        // fallback to static roasts if no API key
        await interaction.reply(`${user} ${pick(ROASTS)}`);
        return;
      }

      await interaction.deferReply();

      const joinedAt = member?.joinedAt
        ? `joined the server on ${member.joinedAt.toDateString()}`
        : "a server member";
      const roles = member?.roles.cache
        .filter((r) => r.name !== "@everyone")
        .map((r) => r.name)
        .slice(0, 5)
        .join(", ") || "no roles";
      const nickname = member?.nickname ?? user.displayName;

      try {
        const completion = await ai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 200,
          messages: [
            {
              role: "system",
              content:
                "You are a savage but playful roast bot. Write ONE short, witty, personalized roast (2-3 sentences max). Use the user details provided. Keep it funny, not mean-spirited. Do not use slurs or anything truly offensive.",
            },
            {
              role: "user",
              content: `Roast this Discord user: username is "${user.username}", display name is "${nickname}", they ${joinedAt}, and their roles are: ${roles}. Make the roast feel personal using these details.`,
            },
          ],
        });

        const roast = completion.choices[0]?.message?.content ?? pick(ROASTS);
        const embed = new EmbedBuilder()
          .setColor(0xed4245)
          .setDescription(`🔥 ${user} — ${roast}`)
          .setFooter({ text: `Roasted by ${interaction.user.tag}` });

        await interaction.editReply({ embeds: [embed] });
      } catch {
        await interaction.editReply(`${user} ${pick(ROASTS)}`);
      }
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("chat")
      .setDescription("Chat with an AI")
      .addStringOption((o) => o.setName("message").setDescription("Your message").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const message = interaction.options.getString("message", true);
      const ai = getOpenAI();
      if (!ai) {
        await interaction.reply({ content: "❌ `OPENAI_API_KEY` secret is not set.", ephemeral: true });
        return;
      }
      await interaction.deferReply();
      try {
        const completion = await ai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 1024,
          messages: [
            { role: "system", content: "You are BurgerMod, a helpful and friendly Discord bot. Keep replies concise (under 1800 characters)." },
            { role: "user", content: message },
          ],
        });
        const reply = completion.choices[0]?.message?.content ?? "No response.";
        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setDescription(reply.slice(0, 4096))
          .setFooter({ text: `Asked by ${interaction.user.tag}` });
        await interaction.editReply({ embeds: [embed] });
      } catch (err: unknown) {
        await interaction.editReply(`❌ AI error: ${(err as Error).message}`);
      }
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("image_generate")
      .setDescription("Generate an AI image from a prompt")
      .addStringOption((o) => o.setName("prompt").setDescription("Image description").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const prompt = interaction.options.getString("prompt", true);
      const ai = getOpenAI();
      if (!ai) {
        await interaction.reply({ content: "❌ `OPENAI_API_KEY` secret is not set.", ephemeral: true });
        return;
      }
      await interaction.deferReply();
      try {
        const response = await ai.images.generate({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
        });
        const url = (response.data ?? [])[0]?.url;
        if (!url) { await interaction.editReply("❌ No image returned."); return; }
        const embed = new EmbedBuilder()
          .setTitle("🎨 Generated Image")
          .setDescription(`**Prompt:** ${prompt}`)
          .setImage(url)
          .setColor(0xff73fa)
          .setFooter({ text: `Requested by ${interaction.user.tag}` });
        await interaction.editReply({ embeds: [embed] });
      } catch (err: unknown) {
        await interaction.editReply(`❌ Image error: ${(err as Error).message}`);
      }
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("download")
      .setDescription("Download a video or audio from a URL")
      .addStringOption((o) => o.setName("url").setDescription("URL to download from").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const url = interaction.options.getString("url", true);
      await interaction.reply(`⬇️ Download for **${url}** requires \`yt-dlp\` to be installed on the server. Set up the download backend and I'll return the file here.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("datamosh")
      .setDescription("Apply a datamosh effect to a video")
      .addAttachmentOption((o) => o.setName("video").setDescription("Video file to datamosh").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const attachment = interaction.options.getAttachment("video", true);
      await interaction.reply(`🎞️ Datamoshing for **${attachment.name}** requires a video processing backend (ffmpeg + glitch scripts). Feature stub is ready — wire in your processor.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("youtube_channel")
      .setDescription("Get info about a YouTube channel")
      .addStringOption((o) => o.setName("channel").setDescription("Channel name or URL").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const channel = interaction.options.getString("channel", true);
      await interaction.reply(`📺 Looking up **${channel}**...\n\nAdd a \`YOUTUBE_API_KEY\` secret to enable real YouTube channel lookups via the Data API v3.`);
    },
  },
];

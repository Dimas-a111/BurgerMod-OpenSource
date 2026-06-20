import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  ActivityType,
} from "discord.js";

export const commands = [
  {
    data: new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Check the bot latency"),
    async execute(interaction: ChatInputCommandInteraction) {
      const sent = await interaction.reply({ content: "Pinging...", fetchReply: true });
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      await interaction.editReply(`Pong! Latency: **${latency}ms** | API: **${interaction.client.ws.ping}ms**`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("help")
      .setDescription("List all available commands"),
    async execute(interaction: ChatInputCommandInteraction) {
      const embed = new EmbedBuilder()
        .setTitle("BurgerMod — All Commands")
        .setColor(0x5865f2)
        .addFields(
          { name: "🔧 Utility", value: "`/ping` `/help` `/userinfo` `/serverinfo` `/avatar` `/botinfo` `/uptime` `/membercount` `/channelinfo` `/roleinfo` `/invite` `/support` `/timestamp`" },
          { name: "🛡️ Moderation", value: "`/ban` `/unban` `/kick` `/timeout` `/untimeout` `/clear` `/warn` `/warnings` `/clearwarnings` `/lock` `/unlock` `/slowmode` `/nick`" },
          { name: "👥 Roles", value: "`/addrole` `/removerole` `/createrole` `/deleterole` `/roleinfo` `/rolemembers`" },
          { name: "🎉 Fun", value: "`/roll` `/coinflip` `/8ball` `/rps` `/choose` `/rate` `/reverse` `/mock` `/ascii` `/clap`" },
          { name: "ℹ️ Info", value: "`/emojis` `/boosters` `/bans`" }
        )
        .setFooter({ text: "Use / to autocomplete commands" });
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("userinfo")
      .setDescription("Get info about a user")
      .addUserOption((o) => o.setName("user").setDescription("The user").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      await interaction.deferReply();
      const user = interaction.options.getUser("user") ?? interaction.user;
      const guild = interaction.guild;
      const embed = new EmbedBuilder()
        .setTitle(user.tag)
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .setColor(0x5865f2)
        .addFields(
          { name: "ID", value: user.id, inline: true },
          { name: "Bot?", value: user.bot ? "Yes" : "No", inline: true },
          { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true }
        );
      if (guild) {
        try {
          const member = await guild.members.fetch(user.id);
          embed.addFields(
            { name: "Joined Server", value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : "Unknown", inline: true },
            { name: "Nickname", value: member.nickname ?? "None", inline: true },
            { name: "Roles", value: member.roles.cache.filter((r) => r.id !== guild.id).map((r) => `<@&${r.id}>`).join(" ") || "None" }
          );
        } catch { /* not in guild */ }
      }
      await interaction.editReply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("serverinfo")
      .setDescription("Get info about this server"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      const embed = new EmbedBuilder()
        .setTitle(guild.name)
        .setColor(0x5865f2)
        .addFields(
          { name: "ID", value: guild.id, inline: true },
          { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
          { name: "Members", value: guild.memberCount.toString(), inline: true },
          { name: "Channels", value: guild.channels.cache.size.toString(), inline: true },
          { name: "Roles", value: guild.roles.cache.size.toString(), inline: true },
          { name: "Boosts", value: guild.premiumSubscriptionCount?.toString() ?? "0", inline: true },
          { name: "Boost Level", value: `Level ${guild.premiumTier}`, inline: true },
          { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
        );
      const icon = guild.iconURL();
      if (icon) embed.setThumbnail(icon);
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("avatar")
      .setDescription("Get a user's avatar")
      .addUserOption((o) => o.setName("user").setDescription("The user").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user") ?? interaction.user;
      const embed = new EmbedBuilder()
        .setTitle(`${user.tag}'s Avatar`)
        .setImage(user.displayAvatarURL({ size: 512 }))
        .setColor(0x5865f2)
        .addFields({ name: "Links", value: `[PNG](${user.displayAvatarURL({ size: 512, extension: "png" })}) | [JPG](${user.displayAvatarURL({ size: 512, extension: "jpg" })}) | [WEBP](${user.displayAvatarURL({ size: 512, extension: "webp" })})` });
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("botinfo")
      .setDescription("Get info about this bot"),
    async execute(interaction: ChatInputCommandInteraction) {
      const bot = interaction.client;
      const embed = new EmbedBuilder()
        .setTitle(bot.user?.tag ?? "Bot Info")
        .setThumbnail(bot.user?.displayAvatarURL() ?? null)
        .setColor(0x5865f2)
        .addFields(
          { name: "Servers", value: bot.guilds.cache.size.toString(), inline: true },
          { name: "Users", value: bot.users.cache.size.toString(), inline: true },
          { name: "Commands", value: "30+", inline: true },
          { name: "Uptime", value: `<t:${Math.floor((Date.now() - (bot.uptime ?? 0)) / 1000)}:R>`, inline: true },
          { name: "API Ping", value: `${bot.ws.ping}ms`, inline: true },
          { name: "Node.js", value: process.version, inline: true }
        );
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("uptime")
      .setDescription("Check how long the bot has been running"),
    async execute(interaction: ChatInputCommandInteraction) {
      const uptime = interaction.client.uptime ?? 0;
      const d = Math.floor(uptime / 86400000);
      const h = Math.floor((uptime % 86400000) / 3600000);
      const m = Math.floor((uptime % 3600000) / 60000);
      const s = Math.floor((uptime % 60000) / 1000);
      await interaction.reply(`⏱️ Uptime: **${d}d ${h}h ${m}m ${s}s**`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("membercount")
      .setDescription("Show the server member count"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      const bots = guild.members.cache.filter((m) => m.user.bot).size;
      const humans = guild.memberCount - bots;
      const embed = new EmbedBuilder()
        .setTitle(`${guild.name} — Member Count`)
        .setColor(0x57f287)
        .addFields(
          { name: "Total", value: guild.memberCount.toString(), inline: true },
          { name: "Humans", value: humans.toString(), inline: true },
          { name: "Bots", value: bots.toString(), inline: true }
        );
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("channelinfo")
      .setDescription("Get info about a channel")
      .addChannelOption((o) => o.setName("channel").setDescription("The channel").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      const channel = interaction.options.getChannel("channel") ?? interaction.channel;
      if (!channel) { await interaction.reply({ content: "No channel found.", ephemeral: true }); return; }
      const ts = "createdTimestamp" in channel ? Math.floor((channel.createdTimestamp as number) / 1000) : null;
      const embed = new EmbedBuilder()
        .setTitle(`#${(channel as { name?: string }).name ?? channel.id}`)
        .setColor(0x5865f2)
        .addFields(
          { name: "ID", value: channel.id, inline: true },
          { name: "Type", value: channel.type.toString(), inline: true },
          { name: "Created", value: ts ? `<t:${ts}:R>` : "Unknown", inline: true }
        );
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("invite")
      .setDescription("Get the bot invite link"),
    async execute(interaction: ChatInputCommandInteraction) {
      const clientId = interaction.client.user?.id;
      const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
      await interaction.reply({ content: `[Click here to invite BurgerMod](${url})`, ephemeral: true });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("timestamp")
      .setDescription("Convert a date to a Discord timestamp")
      .addStringOption((o) => o.setName("date").setDescription("Date (e.g. 2024-01-15 or 'now')").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const input = interaction.options.getString("date", true);
      const date = input.toLowerCase() === "now" ? new Date() : new Date(input);
      if (isNaN(date.getTime())) { await interaction.reply({ content: "Invalid date format.", ephemeral: true }); return; }
      const ts = Math.floor(date.getTime() / 1000);
      const embed = new EmbedBuilder()
        .setTitle("Timestamp")
        .setColor(0x5865f2)
        .addFields(
          { name: "Short Date", value: `<t:${ts}:d> → \`<t:${ts}:d>\``, inline: false },
          { name: "Long Date", value: `<t:${ts}:D> → \`<t:${ts}:D>\``, inline: false },
          { name: "Short Time", value: `<t:${ts}:t> → \`<t:${ts}:t>\``, inline: false },
          { name: "Long Time", value: `<t:${ts}:T> → \`<t:${ts}:T>\``, inline: false },
          { name: "Relative", value: `<t:${ts}:R> → \`<t:${ts}:R>\``, inline: false }
        );
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("emojis")
      .setDescription("List all custom emojis in the server"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      const emojis = guild.emojis.cache.map((e) => `${e} \`:${e.name}:\``).join("\n");
      const embed = new EmbedBuilder()
        .setTitle(`${guild.name} — Custom Emojis (${guild.emojis.cache.size})`)
        .setDescription(emojis || "No custom emojis.")
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("boosters")
      .setDescription("List server boosters"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      await guild.members.fetch();
      const boosters = guild.members.cache.filter((m) => m.premiumSince);
      const list = boosters.map((m) => `${m.user.tag} — since <t:${Math.floor(m.premiumSince!.getTime() / 1000)}:R>`).join("\n");
      const embed = new EmbedBuilder()
        .setTitle(`${guild.name} — Boosters (${boosters.size})`)
        .setDescription(list || "No boosters.")
        .setColor(0xff73fa);
      await interaction.reply({ embeds: [embed] });
    },
  },
];

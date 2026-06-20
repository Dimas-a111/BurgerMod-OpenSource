import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
  TextChannel,
  CategoryChannel,
} from "discord.js";
import { getConfig, reactionRoles, ticketCategories } from "../store";

export const commands = [
  {
    data: new SlashCommandBuilder()
      .setName("settings")
      .setDescription("View the bot's current settings for this server"),
    async execute(interaction: ChatInputCommandInteraction) {
      const cfg = getConfig(interaction.guildId!);
      const embed = new EmbedBuilder()
        .setTitle("Server Settings")
        .setColor(0x5865f2)
        .addFields(
          { name: "Counting Channel", value: cfg.countingChannelId ? `<#${cfg.countingChannelId}>` : "Not set", inline: true },
          { name: "Join Log", value: cfg.joinChannelId ? `<#${cfg.joinChannelId}>` : "Not set", inline: true },
          { name: "Leave Log", value: cfg.leaveChannelId ? `<#${cfg.leaveChannelId}>` : "Not set", inline: true },
          { name: "Boost Log", value: cfg.boostChannelId ? `<#${cfg.boostChannelId}>` : "Not set", inline: true },
          { name: "Auto Role", value: cfg.autoRoleId ? `<@&${cfg.autoRoleId}>` : "Not set", inline: true },
          { name: "Auto Role (Bots)", value: cfg.autoRoleBotId ? `<@&${cfg.autoRoleBotId}>` : "Not set", inline: true },
          { name: "Anti-Nuke", value: cfg.antiNuke ? "✅ Enabled" : "❌ Disabled", inline: true },
          { name: "Anti-Raid", value: cfg.antiRaid ? "✅ Enabled" : "❌ Disabled", inline: true },
          { name: "Blocked Words", value: cfg.blockedWords.length > 0 ? cfg.blockedWords.join(", ") : "None", inline: false }
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("set_counting")
      .setDescription("Set the counting channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addChannelOption((o) => o.setName("channel").setDescription("The channel for counting").setRequired(true).addChannelTypes(ChannelType.GuildText)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({ content: "No permission.", ephemeral: true }); return;
      }
      const channel = interaction.options.getChannel("channel", true);
      const cfg = getConfig(interaction.guildId!);
      cfg.countingChannelId = channel.id;
      await interaction.reply(`✅ Counting channel set to <#${channel.id}>. Users must count in order from 1!`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("set_join_channel")
      .setDescription("Set the channel to log when members join")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addChannelOption((o) => o.setName("channel").setDescription("Log channel").setRequired(true).addChannelTypes(ChannelType.GuildText)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({ content: "No permission.", ephemeral: true }); return;
      }
      const channel = interaction.options.getChannel("channel", true);
      const cfg = getConfig(interaction.guildId!);
      cfg.joinChannelId = channel.id;
      await interaction.reply(`✅ Member join logs will be sent to <#${channel.id}>.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("set_leave_channel")
      .setDescription("Set the channel to log when members leave")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addChannelOption((o) => o.setName("channel").setDescription("Log channel").setRequired(true).addChannelTypes(ChannelType.GuildText)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({ content: "No permission.", ephemeral: true }); return;
      }
      const channel = interaction.options.getChannel("channel", true);
      const cfg = getConfig(interaction.guildId!);
      cfg.leaveChannelId = channel.id;
      await interaction.reply(`✅ Member leave logs will be sent to <#${channel.id}>.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("set_boosts_channel")
      .setDescription("Set the channel to log server boosts")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addChannelOption((o) => o.setName("channel").setDescription("Log channel").setRequired(true).addChannelTypes(ChannelType.GuildText)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({ content: "No permission.", ephemeral: true }); return;
      }
      const channel = interaction.options.getChannel("channel", true);
      const cfg = getConfig(interaction.guildId!);
      cfg.boostChannelId = channel.id;
      await interaction.reply(`✅ Boost logs will be sent to <#${channel.id}>.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("set_antinuke_logs")
      .setDescription("Set the channel for anti-nuke logs")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addChannelOption((o) => o.setName("channel").setDescription("Log channel").setRequired(true).addChannelTypes(ChannelType.GuildText)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({ content: "Admins only.", ephemeral: true }); return;
      }
      const channel = interaction.options.getChannel("channel", true);
      const cfg = getConfig(interaction.guildId!);
      cfg.antiNukeLogsId = channel.id;
      await interaction.reply(`✅ Anti-nuke logs will be sent to <#${channel.id}>.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("anti_nuke")
      .setDescription("Enable or disable anti-nuke protection")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({ content: "Admins only.", ephemeral: true }); return;
      }
      const enabled = interaction.options.getBoolean("enabled", true);
      const cfg = getConfig(interaction.guildId!);
      cfg.antiNuke = enabled;
      await interaction.reply(enabled
        ? "🛡️ **Anti-Nuke enabled.** Mass channel/role deletions and bans will be blocked."
        : "❌ **Anti-Nuke disabled.**");
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("anti_raid")
      .setDescription("Enable or disable anti-raid protection")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({ content: "Admins only.", ephemeral: true }); return;
      }
      const enabled = interaction.options.getBoolean("enabled", true);
      const cfg = getConfig(interaction.guildId!);
      cfg.antiRaid = enabled;
      await interaction.reply(enabled
        ? "🛡️ **Anti-Raid enabled.** New accounts joining rapidly will be kicked."
        : "❌ **Anti-Raid disabled.**");
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("auto_role")
      .setDescription("Set a role to auto-give to new human members")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .addRoleOption((o) => o.setName("role").setDescription("Role to auto-assign").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
        await interaction.reply({ content: "No permission.", ephemeral: true }); return;
      }
      const role = interaction.options.getRole("role", true);
      const cfg = getConfig(interaction.guildId!);
      cfg.autoRoleId = role.id;
      await interaction.reply(`✅ New members will automatically receive **${role.name}**.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("unset_auto_role")
      .setDescription("Remove the auto-role for new members")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
        await interaction.reply({ content: "No permission.", ephemeral: true }); return;
      }
      const cfg = getConfig(interaction.guildId!);
      cfg.autoRoleId = undefined;
      await interaction.reply("✅ Auto-role for members removed.");
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("auto_role_bot")
      .setDescription("Set a role to auto-give to bots when they join")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .addRoleOption((o) => o.setName("role").setDescription("Role to assign to bots").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
        await interaction.reply({ content: "No permission.", ephemeral: true }); return;
      }
      const role = interaction.options.getRole("role", true);
      const cfg = getConfig(interaction.guildId!);
      cfg.autoRoleBotId = role.id;
      await interaction.reply(`✅ Bots will automatically receive **${role.name}**.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("blocked_word")
      .setDescription("Add or remove a blocked word (Admin only)")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption((o) => o.setName("action").setDescription("add or remove").setRequired(true).addChoices({ name: "add", value: "add" }, { name: "remove", value: "remove" }))
      .addStringOption((o) => o.setName("word").setDescription("The word to block/unblock").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({ content: "Admins only.", ephemeral: true }); return;
      }
      const action = interaction.options.getString("action", true);
      const word = interaction.options.getString("word", true).toLowerCase();
      const cfg = getConfig(interaction.guildId!);
      if (action === "add") {
        if (!cfg.blockedWords.includes(word)) cfg.blockedWords.push(word);
        await interaction.reply(`✅ Added "**${word}**" to blocked words.`);
      } else {
        cfg.blockedWords = cfg.blockedWords.filter((w) => w !== word);
        await interaction.reply(`✅ Removed "**${word}**" from blocked words.`);
      }
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("prefix")
      .setDescription("View the bot's prefix (slash commands don't use prefix)")
      .addStringOption((o) => o.setName("new_prefix").setDescription("Set a new prefix").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      const cfg = getConfig(interaction.guildId!);
      const newPrefix = interaction.options.getString("new_prefix");
      if (newPrefix) {
        cfg.prefix = newPrefix;
        await interaction.reply(`✅ Prefix updated to **${newPrefix}** (note: this bot uses slash commands, prefix only applies to legacy commands).`);
      } else {
        await interaction.reply(`ℹ️ Current prefix: **${cfg.prefix}** — This bot primarily uses slash commands (/). Type / to see all commands.`);
      }
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("setup_tempvoice")
      .setDescription("Set up temporary voice channels (users create their own VC)")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addChannelOption((o) => o.setName("category").setDescription("Category for temp voice channels").setRequired(true).addChannelTypes(ChannelType.GuildCategory)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({ content: "No permission.", ephemeral: true }); return;
      }
      const category = interaction.options.getChannel("category", true) as CategoryChannel;
      const cfg = getConfig(interaction.guildId!);
      cfg.tempVoiceCategoryId = category.id;
      const lobbyChannel = await interaction.guild!.channels.create({
        name: "➕ Create VC",
        type: ChannelType.GuildVoice,
        parent: category.id,
      });
      await interaction.reply(`✅ Temp voice set up! Join **${lobbyChannel.name}** to create your own VC.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("reaction_roles")
      .setDescription("Add a reaction role to a message")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .addStringOption((o) => o.setName("message_id").setDescription("Message ID to add reaction role to").setRequired(true))
      .addStringOption((o) => o.setName("emoji").setDescription("Emoji to react with").setRequired(true))
      .addRoleOption((o) => o.setName("role").setDescription("Role to give").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
        await interaction.reply({ content: "No permission.", ephemeral: true }); return;
      }
      await interaction.deferReply({ ephemeral: true });
      const msgId = interaction.options.getString("message_id", true);
      const emoji = interaction.options.getString("emoji", true);
      const role = interaction.options.getRole("role", true);
      const channel = interaction.channel as TextChannel;
      try {
        const msg = await channel.messages.fetch(msgId);
        await msg.react(emoji);
        const guildId = interaction.guildId!;
        const existing = reactionRoles.get(guildId) ?? [];
        existing.push({ messageId: msgId, emoji, roleId: role.id });
        reactionRoles.set(guildId, existing);
        await interaction.editReply(`✅ Reaction role set! React with ${emoji} on that message to get **${role.name}**.`);
      } catch {
        await interaction.editReply("❌ Could not find that message in this channel. Make sure the message ID is correct.");
      }
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("ticket")
      .setDescription("Create a support ticket"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      await interaction.deferReply({ ephemeral: true });
      const user = interaction.user;
      const existing = guild.channels.cache.find((c) => c.name === `ticket-${user.username.toLowerCase()}`);
      if (existing) {
        await interaction.editReply(`You already have an open ticket: <#${existing.id}>`);
        return;
      }
      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username.toLowerCase()}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: ["ViewChannel"] },
          { id: user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
        ],
      });
      await (ticketChannel as TextChannel).send({
        embeds: [new EmbedBuilder()
          .setTitle("Support Ticket")
          .setDescription(`Hello ${user}! A staff member will be with you shortly.\nDescribe your issue below.`)
          .setColor(0x5865f2)
        ]
      });
      await interaction.editReply(`✅ Your ticket has been created: <#${ticketChannel.id}>`);
    },
  },
];

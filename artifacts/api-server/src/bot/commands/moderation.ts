import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
  Collection,
} from "discord.js";

const warnings = new Collection<string, { reason: string; by: string; at: number }[]>();

function warnKey(guildId: string, userId: string) {
  return `${guildId}:${userId}`;
}

export const commands = [
  {
    data: new SlashCommandBuilder()
      .setName("ban")
      .setDescription("Ban a member from the server")
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addUserOption((o) => o.setName("user").setDescription("User to ban").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
        await interaction.reply({ content: "You don't have permission to ban members.", ephemeral: true }); return;
      }
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      await interaction.deferReply();
      const user = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      let member;
      try { member = await guild.members.fetch(user.id); } catch { await interaction.editReply("User not in server."); return; }
      if (!member.bannable) { await interaction.editReply("I cannot ban this user."); return; }
      await member.ban({ reason });
      await interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Member Banned").setColor(0xed4245).addFields({ name: "User", value: `${user.tag}`, inline: true }, { name: "Reason", value: reason, inline: true })] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("unban")
      .setDescription("Unban a user by their ID")
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addStringOption((o) => o.setName("userid").setDescription("User ID to unban").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      await interaction.deferReply();
      const userId = interaction.options.getString("userid", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      try {
        await guild.members.unban(userId, reason);
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle("User Unbanned").setColor(0x57f287).addFields({ name: "User ID", value: userId, inline: true }, { name: "Reason", value: reason, inline: true })] });
      } catch {
        await interaction.editReply("Could not unban — user may not be banned or ID is invalid.");
      }
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("kick")
      .setDescription("Kick a member from the server")
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
      .addUserOption((o) => o.setName("user").setDescription("User to kick").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      await interaction.deferReply();
      const user = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      let member;
      try { member = await guild.members.fetch(user.id); } catch { await interaction.editReply("User not in server."); return; }
      if (!member.kickable) { await interaction.editReply("I cannot kick this user."); return; }
      await member.kick(reason);
      await interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Member Kicked").setColor(0xfee75c).addFields({ name: "User", value: user.tag, inline: true }, { name: "Reason", value: reason, inline: true })] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("timeout")
      .setDescription("Timeout a member")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((o) => o.setName("user").setDescription("User to timeout").setRequired(true))
      .addIntegerOption((o) => o.setName("duration").setDescription("Duration in minutes (1–40320)").setRequired(true).setMinValue(1).setMaxValue(40320))
      .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      await interaction.deferReply();
      const user = interaction.options.getUser("user", true);
      const duration = interaction.options.getInteger("duration", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      let member;
      try { member = await guild.members.fetch(user.id); } catch { await interaction.editReply("User not in server."); return; }
      if (!member.moderatable) { await interaction.editReply("I cannot timeout this user."); return; }
      await member.timeout(duration * 60 * 1000, reason);
      await interaction.editReply({ embeds: [new EmbedBuilder().setTitle("Member Timed Out").setColor(0xfee75c).addFields({ name: "User", value: user.tag, inline: true }, { name: "Duration", value: `${duration} min`, inline: true }, { name: "Reason", value: reason })] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("untimeout")
      .setDescription("Remove a timeout from a member")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      await interaction.deferReply();
      const user = interaction.options.getUser("user", true);
      let member;
      try { member = await guild.members.fetch(user.id); } catch { await interaction.editReply("User not in server."); return; }
      await member.timeout(null);
      await interaction.editReply(`✅ Removed timeout from **${user.tag}**.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("clear")
      .setDescription("Delete messages in bulk")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addIntegerOption((o) => o.setName("amount").setDescription("Number of messages (1–100)").setRequired(true).setMinValue(1).setMaxValue(100)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const channel = interaction.channel;
      if (!(channel instanceof TextChannel)) {
        await interaction.reply({ content: "Text channels only.", ephemeral: true }); return;
      }
      await interaction.deferReply({ ephemeral: true });
      const amount = interaction.options.getInteger("amount", true);
      const deleted = await channel.bulkDelete(amount, true);
      await interaction.editReply(`Deleted **${deleted.size}** message(s).`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("warn")
      .setDescription("Warn a member")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addUserOption((o) => o.setName("user").setDescription("User to warn").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const user = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      const key = warnKey(interaction.guildId!, user.id);
      const list = warnings.get(key) ?? [];
      list.push({ reason, by: interaction.user.tag, at: Date.now() });
      warnings.set(key, list);
      await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Member Warned").setColor(0xfee75c).addFields({ name: "User", value: user.tag, inline: true }, { name: "Reason", value: reason, inline: true }, { name: "Total Warnings", value: list.length.toString(), inline: true })] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("warnings")
      .setDescription("View warnings for a user")
      .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user", true);
      const key = warnKey(interaction.guildId!, user.id);
      const list = warnings.get(key) ?? [];
      if (!list.length) { await interaction.reply(`**${user.tag}** has no warnings.`); return; }
      const embed = new EmbedBuilder()
        .setTitle(`Warnings — ${user.tag} (${list.length})`)
        .setColor(0xfee75c)
        .setDescription(list.map((w, i) => `**${i + 1}.** ${w.reason} — by ${w.by} (<t:${Math.floor(w.at / 1000)}:R>)`).join("\n"));
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("clearwarnings")
      .setDescription("Clear all warnings for a user")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const user = interaction.options.getUser("user", true);
      const key = warnKey(interaction.guildId!, user.id);
      warnings.delete(key);
      await interaction.reply(`✅ Cleared all warnings for **${user.tag}**.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("lock")
      .setDescription("Lock a channel so members can't send messages")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const channel = interaction.channel;
      if (!(channel instanceof TextChannel)) { await interaction.reply({ content: "Text channels only.", ephemeral: true }); return; }
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: false });
      await interaction.reply(`🔒 Channel locked. Reason: ${reason}`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("unlock")
      .setDescription("Unlock a locked channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const channel = interaction.channel;
      if (!(channel instanceof TextChannel)) { await interaction.reply({ content: "Text channels only.", ephemeral: true }); return; }
      await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: null });
      await interaction.reply(`🔓 Channel unlocked.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("slowmode")
      .setDescription("Set slowmode in the current channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addIntegerOption((o) => o.setName("seconds").setDescription("Slowmode seconds (0 to disable, max 21600)").setRequired(true).setMinValue(0).setMaxValue(21600)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const channel = interaction.channel;
      if (!(channel instanceof TextChannel)) { await interaction.reply({ content: "Text channels only.", ephemeral: true }); return; }
      const seconds = interaction.options.getInteger("seconds", true);
      await channel.setRateLimitPerUser(seconds);
      await interaction.reply(seconds === 0 ? "⏩ Slowmode disabled." : `🐢 Slowmode set to **${seconds}s**.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("nick")
      .setDescription("Change a member's nickname")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
      .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true))
      .addStringOption((o) => o.setName("nickname").setDescription("New nickname (leave empty to reset)").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageNicknames)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      await interaction.deferReply();
      const user = interaction.options.getUser("user", true);
      const nick = interaction.options.getString("nickname") ?? null;
      let member;
      try { member = await guild.members.fetch(user.id); } catch { await interaction.editReply("User not in server."); return; }
      await member.setNickname(nick);
      await interaction.editReply(nick ? `✅ Nickname set to **${nick}** for ${user.tag}.` : `✅ Nickname reset for ${user.tag}.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("bans")
      .setDescription("List all banned users in the server")
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      await interaction.deferReply({ ephemeral: true });
      const bans = await guild.bans.fetch();
      if (!bans.size) { await interaction.editReply("No banned users."); return; }
      const list = bans.map((b) => `${b.user.tag} — ${b.reason ?? "No reason"}`).slice(0, 25).join("\n");
      const embed = new EmbedBuilder()
        .setTitle(`Banned Users (${bans.size})`)
        .setDescription(list + (bans.size > 25 ? `\n... and ${bans.size - 25} more.` : ""))
        .setColor(0xed4245);
      await interaction.editReply({ embeds: [embed] });
    },
  },

  // ── LOCKDOWN ───────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName("lockdown")
      .setDescription("Lock or unlock all text channels in the server instantly")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addStringOption((o) =>
        o.setName("action")
          .setDescription("What to do")
          .setRequired(true)
          .addChoices(
            { name: "🔒 Lock — block everyone from sending messages", value: "lock" },
            { name: "🔓 Unlock — restore normal permissions", value: "unlock" },
          )
      )
      .addStringOption((o) =>
        o.setName("reason")
          .setDescription("Reason (shown in audit log)")
          .setRequired(false)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({ content: "You need **Manage Channels** permission.", ephemeral: true }); return;
      }
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }

      const action = interaction.options.getString("action", true) as "lock" | "unlock";
      const reason = interaction.options.getString("reason") ?? (action === "lock" ? "Server lockdown" : "Lockdown lifted");
      const isLock = action === "lock";

      await interaction.deferReply();

      const everyoneRole = guild.roles.everyone;
      const textChannels = guild.channels.cache.filter(
        (ch) => ch.type === 0 /* GuildText */ || ch.type === 5 /* Announcement */
      );

      let success = 0;
      let skipped = 0;

      for (const [, channel] of textChannels) {
        try {
          if (channel.isTextBased() && "permissionOverwrites" in channel) {
            await channel.permissionOverwrites.edit(
              everyoneRole,
              { SendMessages: isLock ? false : null },
              { reason }
            );
            success++;
          }
        } catch {
          skipped++;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(isLock ? 0xed4245 : 0x57f287)
        .setTitle(isLock ? "🔒 Server Locked Down" : "🔓 Lockdown Lifted")
        .setDescription(isLock
          ? "Everyone has been blocked from sending messages in all text channels."
          : "Normal message permissions have been restored in all text channels.")
        .addFields(
          { name: "Channels affected", value: `${success}`, inline: true },
          { name: "Skipped (no access)", value: `${skipped}`, inline: true },
          { name: "Reason", value: reason, inline: false },
        )
        .setFooter({ text: `By ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    },
  },
];

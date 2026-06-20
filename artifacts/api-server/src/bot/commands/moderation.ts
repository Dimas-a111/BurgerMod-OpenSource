import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  GuildMember,
} from "discord.js";

export const commands = [
  {
    data: new SlashCommandBuilder()
      .setName("ban")
      .setDescription("Ban a member from the server")
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addUserOption((o) =>
        o.setName("user").setDescription("User to ban").setRequired(true)
      )
      .addStringOption((o) =>
        o.setName("reason").setDescription("Reason for the ban").setRequired(false)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
        await interaction.reply({ content: "You don't have permission to ban members.", ephemeral: true });
        return;
      }
      const target = interaction.options.getMember("user") as GuildMember;
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      if (!target) {
        await interaction.reply({ content: "User not found.", ephemeral: true });
        return;
      }
      if (!target.bannable) {
        await interaction.reply({ content: "I cannot ban this user.", ephemeral: true });
        return;
      }
      await target.ban({ reason });
      const embed = new EmbedBuilder()
        .setTitle("Member Banned")
        .setColor(0xed4245)
        .addFields(
          { name: "User", value: `${target.user.tag}`, inline: true },
          { name: "Reason", value: reason, inline: true }
        );
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("kick")
      .setDescription("Kick a member from the server")
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
      .addUserOption((o) =>
        o.setName("user").setDescription("User to kick").setRequired(true)
      )
      .addStringOption((o) =>
        o.setName("reason").setDescription("Reason for the kick").setRequired(false)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers)) {
        await interaction.reply({ content: "You don't have permission to kick members.", ephemeral: true });
        return;
      }
      const target = interaction.options.getMember("user") as GuildMember;
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      if (!target) {
        await interaction.reply({ content: "User not found.", ephemeral: true });
        return;
      }
      if (!target.kickable) {
        await interaction.reply({ content: "I cannot kick this user.", ephemeral: true });
        return;
      }
      await target.kick(reason);
      const embed = new EmbedBuilder()
        .setTitle("Member Kicked")
        .setColor(0xfee75c)
        .addFields(
          { name: "User", value: `${target.user.tag}`, inline: true },
          { name: "Reason", value: reason, inline: true }
        );
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("timeout")
      .setDescription("Timeout a member")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((o) =>
        o.setName("user").setDescription("User to timeout").setRequired(true)
      )
      .addIntegerOption((o) =>
        o
          .setName("duration")
          .setDescription("Duration in minutes (max 40320 = 28 days)")
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(40320)
      )
      .addStringOption((o) =>
        o.setName("reason").setDescription("Reason").setRequired(false)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ content: "You don't have permission to timeout members.", ephemeral: true });
        return;
      }
      const target = interaction.options.getMember("user") as GuildMember;
      const duration = interaction.options.getInteger("duration", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      if (!target) {
        await interaction.reply({ content: "User not found.", ephemeral: true });
        return;
      }
      await target.timeout(duration * 60 * 1000, reason);
      const embed = new EmbedBuilder()
        .setTitle("Member Timed Out")
        .setColor(0xfee75c)
        .addFields(
          { name: "User", value: `${target.user.tag}`, inline: true },
          { name: "Duration", value: `${duration} minutes`, inline: true },
          { name: "Reason", value: reason }
        );
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("clear")
      .setDescription("Delete messages in bulk")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addIntegerOption((o) =>
        o
          .setName("amount")
          .setDescription("Number of messages to delete (1-100)")
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(100)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
        await interaction.reply({ content: "You don't have permission to manage messages.", ephemeral: true });
        return;
      }
      const amount = interaction.options.getInteger("amount", true);
      if (!interaction.channel || !("bulkDelete" in interaction.channel)) {
        await interaction.reply({ content: "Cannot delete messages in this channel.", ephemeral: true });
        return;
      }
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({
        content: `Deleted **${deleted.size}** message(s).`,
        ephemeral: true,
      });
    },
  },
];

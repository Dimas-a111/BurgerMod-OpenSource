import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
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
      const guild = interaction.guild;
      if (!guild) {
        await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        return;
      }

      await interaction.deferReply();

      const user = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";

      let member;
      try {
        member = await guild.members.fetch(user.id);
      } catch {
        await interaction.editReply("That user is not in this server.");
        return;
      }

      if (!member.bannable) {
        await interaction.editReply("I cannot ban this user. They may have a higher role than me.");
        return;
      }

      await member.ban({ reason });
      const embed = new EmbedBuilder()
        .setTitle("Member Banned")
        .setColor(0xed4245)
        .addFields(
          { name: "User", value: `${user.tag} (${user.id})`, inline: true },
          { name: "Reason", value: reason, inline: true }
        );
      await interaction.editReply({ embeds: [embed] });
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
      const guild = interaction.guild;
      if (!guild) {
        await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        return;
      }

      await interaction.deferReply();

      const user = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";

      let member;
      try {
        member = await guild.members.fetch(user.id);
      } catch {
        await interaction.editReply("That user is not in this server.");
        return;
      }

      if (!member.kickable) {
        await interaction.editReply("I cannot kick this user. They may have a higher role than me.");
        return;
      }

      await member.kick(reason);
      const embed = new EmbedBuilder()
        .setTitle("Member Kicked")
        .setColor(0xfee75c)
        .addFields(
          { name: "User", value: `${user.tag} (${user.id})`, inline: true },
          { name: "Reason", value: reason, inline: true }
        );
      await interaction.editReply({ embeds: [embed] });
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
      const guild = interaction.guild;
      if (!guild) {
        await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        return;
      }

      await interaction.deferReply();

      const user = interaction.options.getUser("user", true);
      const duration = interaction.options.getInteger("duration", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";

      let member;
      try {
        member = await guild.members.fetch(user.id);
      } catch {
        await interaction.editReply("That user is not in this server.");
        return;
      }

      if (!member.moderatable) {
        await interaction.editReply("I cannot timeout this user. They may have a higher role than me.");
        return;
      }

      await member.timeout(duration * 60 * 1000, reason);
      const embed = new EmbedBuilder()
        .setTitle("Member Timed Out")
        .setColor(0xfee75c)
        .addFields(
          { name: "User", value: `${user.tag} (${user.id})`, inline: true },
          { name: "Duration", value: `${duration} minute(s)`, inline: true },
          { name: "Reason", value: reason }
        );
      await interaction.editReply({ embeds: [embed] });
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
      const channel = interaction.channel;

      if (!channel || !(channel instanceof TextChannel)) {
        await interaction.reply({ content: "This command can only be used in a text channel.", ephemeral: true });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      const deleted = await channel.bulkDelete(amount, true);
      await interaction.editReply(`Deleted **${deleted.size}** message(s).`);
    },
  },
];

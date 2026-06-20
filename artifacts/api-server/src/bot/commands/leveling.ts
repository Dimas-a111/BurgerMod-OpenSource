import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { getXP, xpData, xpNeeded } from "../store";

export const commands = [
  {
    data: new SlashCommandBuilder()
      .setName("level")
      .setDescription("Check your or another user's level")
      .addUserOption((o) => o.setName("user").setDescription("User to check").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user") ?? interaction.user;
      const data = getXP(interaction.guildId!, user.id);
      const needed = xpNeeded(data.level);
      const progress = Math.floor((data.xp / needed) * 10);
      const bar = "█".repeat(progress) + "░".repeat(10 - progress);
      const embed = new EmbedBuilder()
        .setTitle(`${user.tag}'s Level`)
        .setThumbnail(user.displayAvatarURL())
        .setColor(0x5865f2)
        .addFields(
          { name: "Level", value: data.level.toString(), inline: true },
          { name: "XP", value: `${data.xp} / ${needed}`, inline: true },
          { name: "Progress", value: `\`${bar}\``, inline: false }
        );
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("leaderboard")
      .setDescription("View the XP leaderboard for this server"),
    async execute(interaction: ChatInputCommandInteraction) {
      await interaction.deferReply();
      const guildId = interaction.guildId!;
      const entries = [...xpData.entries()]
        .filter(([key]) => key.startsWith(guildId + ":"))
        .map(([key, data]) => ({ userId: key.split(":")[1]!, ...data }))
        .sort((a, b) => b.level * 10000 + b.xp - (a.level * 10000 + a.xp))
        .slice(0, 10);

      if (!entries.length) {
        await interaction.editReply("No XP data yet. Chat to earn XP!");
        return;
      }

      const lines = await Promise.all(
        entries.map(async (e, i) => {
          try {
            const user = await interaction.client.users.fetch(e.userId!);
            return `**${i + 1}.** ${user.tag} — Level ${e.level} (${e.xp} XP)`;
          } catch {
            return `**${i + 1}.** Unknown User — Level ${e.level} (${e.xp} XP)`;
          }
        })
      );

      const embed = new EmbedBuilder()
        .setTitle(`${interaction.guild?.name} — XP Leaderboard`)
        .setColor(0xfee75c)
        .setDescription(lines.join("\n"));
      await interaction.editReply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("set_xp")
      .setDescription("Set a user's XP (Admin only)")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true))
      .addIntegerOption((o) => o.setName("xp").setDescription("XP amount").setRequired(true).setMinValue(0)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({ content: "Admins only.", ephemeral: true }); return;
      }
      const user = interaction.options.getUser("user", true);
      const amount = interaction.options.getInteger("xp", true);
      const data = getXP(interaction.guildId!, user.id);
      data.xp = amount;
      await interaction.reply(`✅ Set **${user.tag}**'s XP to **${amount}**.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("set_level")
      .setDescription("Set a user's level (Admin only)")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true))
      .addIntegerOption((o) => o.setName("level").setDescription("Level").setRequired(true).setMinValue(0).setMaxValue(1000)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({ content: "Admins only.", ephemeral: true }); return;
      }
      const user = interaction.options.getUser("user", true);
      const level = interaction.options.getInteger("level", true);
      const data = getXP(interaction.guildId!, user.id);
      data.level = level;
      data.xp = 0;
      await interaction.reply(`✅ Set **${user.tag}**'s level to **${level}**.`);
    },
  },
];

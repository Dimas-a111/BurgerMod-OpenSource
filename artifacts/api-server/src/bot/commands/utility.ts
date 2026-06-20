import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

export const commands = [
  {
    data: new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Check the bot latency"),
    async execute(interaction: ChatInputCommandInteraction) {
      const sent = await interaction.reply({
        content: "Pinging...",
        fetchReply: true,
      });
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      await interaction.editReply(
        `Pong! Latency: **${latency}ms** | API: **${interaction.client.ws.ping}ms**`
      );
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("help")
      .setDescription("List all available commands"),
    async execute(interaction: ChatInputCommandInteraction) {
      const embed = new EmbedBuilder()
        .setTitle("Bot Commands")
        .setColor(0x5865f2)
        .addFields(
          { name: "Utility", value: "`/ping` `/help` `/userinfo` `/serverinfo` `/avatar`" },
          { name: "Moderation", value: "`/ban` `/kick` `/timeout` `/clear`" },
          { name: "Fun", value: "`/roll` `/coinflip` `/8ball`" }
        )
        .setFooter({ text: "Use / to see command details" });
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("userinfo")
      .setDescription("Get info about a user")
      .addUserOption((o) =>
        o.setName("user").setDescription("The user").setRequired(false)
      ),
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
          {
            name: "Account Created",
            value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
            inline: true,
          }
        );

      if (guild) {
        try {
          const member = await guild.members.fetch(user.id);
          embed.addFields(
            {
              name: "Joined Server",
              value: member.joinedAt
                ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`
                : "Unknown",
              inline: true,
            },
            {
              name: "Roles",
              value:
                member.roles.cache
                  .filter((r) => r.id !== guild.id)
                  .map((r) => `<@&${r.id}>`)
                  .join(" ") || "None",
            }
          );
        } catch {
          embed.addFields({ name: "Note", value: "Not a member of this server" });
        }
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
      if (!guild) {
        await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(guild.name)
        .setColor(0x5865f2)
        .addFields(
          { name: "ID", value: guild.id, inline: true },
          { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
          { name: "Members", value: guild.memberCount.toString(), inline: true },
          { name: "Channels", value: guild.channels.cache.size.toString(), inline: true },
          { name: "Roles", value: guild.roles.cache.size.toString(), inline: true },
          {
            name: "Created",
            value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
            inline: true,
          }
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
      .addUserOption((o) =>
        o.setName("user").setDescription("The user").setRequired(false)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user") ?? interaction.user;
      const embed = new EmbedBuilder()
        .setTitle(`${user.tag}'s Avatar`)
        .setImage(user.displayAvatarURL({ size: 512 }))
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
];

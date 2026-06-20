import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  GuildMember,
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
      const latency =
        sent.createdTimestamp - interaction.createdTimestamp;
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
          {
            name: "Utility",
            value:
              "`/ping` `/help` `/userinfo` `/serverinfo` `/avatar`",
          },
          {
            name: "Moderation",
            value: "`/ban` `/kick` `/timeout` `/clear`",
          },
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
      const target =
        (interaction.options.getMember("user") as GuildMember) ??
        (interaction.member as GuildMember);
      const user = target.user;
      const embed = new EmbedBuilder()
        .setTitle(user.tag)
        .setThumbnail(user.displayAvatarURL())
        .setColor(0x5865f2)
        .addFields(
          { name: "ID", value: user.id, inline: true },
          {
            name: "Joined Server",
            value: target.joinedAt
              ? `<t:${Math.floor(target.joinedAt.getTime() / 1000)}:R>`
              : "Unknown",
            inline: true,
          },
          {
            name: "Account Created",
            value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
            inline: true,
          },
          {
            name: "Roles",
            value:
              target.roles.cache
                .filter((r) => r.id !== interaction.guildId)
                .map((r) => `<@&${r.id}>`)
                .join(" ") || "None",
          }
        );
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("serverinfo")
      .setDescription("Get info about this server"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) {
        await interaction.reply("This command can only be used in a server.");
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(guild.name)
        .setThumbnail(guild.iconURL())
        .setColor(0x5865f2)
        .addFields(
          { name: "ID", value: guild.id, inline: true },
          {
            name: "Owner",
            value: `<@${guild.ownerId}>`,
            inline: true,
          },
          {
            name: "Members",
            value: guild.memberCount.toString(),
            inline: true,
          },
          {
            name: "Channels",
            value: guild.channels.cache.size.toString(),
            inline: true,
          },
          {
            name: "Roles",
            value: guild.roles.cache.size.toString(),
            inline: true,
          },
          {
            name: "Created",
            value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
            inline: true,
          }
        );
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
      const user =
        interaction.options.getUser("user") ?? interaction.user;
      const embed = new EmbedBuilder()
        .setTitle(`${user.tag}'s Avatar`)
        .setImage(user.displayAvatarURL({ size: 512 }))
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
];

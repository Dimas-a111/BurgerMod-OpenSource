import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
} from "discord.js";
import { notifyYoutube, notifyTwitch, notifyTiktok, notifyTwitter } from "../store";

export const commands = [
  {
    data: new SlashCommandBuilder()
      .setName("notify_youtube")
      .setDescription("Get notified when a YouTube channel uploads")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addStringOption((o) => o.setName("channel_name").setDescription("YouTube channel name or URL").setRequired(true))
      .addChannelOption((o) => o.setName("post_to").setDescription("Discord channel to post notifications in").setRequired(true).addChannelTypes(ChannelType.GuildText)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "You need Manage Server permission.", ephemeral: true }); return;
      }
      const ytChannel = interaction.options.getString("channel_name", true);
      const postTo = interaction.options.getChannel("post_to", true);
      notifyYoutube.set(interaction.guildId!, { channelId: postTo.id, target: ytChannel });
      const embed = new EmbedBuilder()
        .setTitle("YouTube Notifications Enabled")
        .setColor(0xff0000)
        .addFields(
          { name: "Channel", value: ytChannel, inline: true },
          { name: "Post To", value: `<#${postTo.id}>`, inline: true }
        )
        .setDescription("⚠️ Add a `YOUTUBE_API_KEY` secret to enable real upload detection. The channel and target have been saved.");
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("notify_tiktok")
      .setDescription("Get notified when a TikTok account posts")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addStringOption((o) => o.setName("username").setDescription("TikTok username").setRequired(true))
      .addChannelOption((o) => o.setName("post_to").setDescription("Discord channel to post notifications in").setRequired(true).addChannelTypes(ChannelType.GuildText)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "You need Manage Server permission.", ephemeral: true }); return;
      }
      const username = interaction.options.getString("username", true);
      const postTo = interaction.options.getChannel("post_to", true);
      notifyTiktok.set(interaction.guildId!, { channelId: postTo.id, target: username });
      const embed = new EmbedBuilder()
        .setTitle("TikTok Notifications Enabled")
        .setColor(0x010101)
        .addFields(
          { name: "Account", value: `@${username}`, inline: true },
          { name: "Post To", value: `<#${postTo.id}>`, inline: true }
        )
        .setDescription("⚠️ TikTok has no official API. Add a scraping backend to enable real notifications. The account and target have been saved.");
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("notify_twitch")
      .setDescription("Get notified when a Twitch streamer goes live")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addStringOption((o) => o.setName("username").setDescription("Twitch username").setRequired(true))
      .addChannelOption((o) => o.setName("post_to").setDescription("Discord channel to post notifications in").setRequired(true).addChannelTypes(ChannelType.GuildText)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "You need Manage Server permission.", ephemeral: true }); return;
      }
      const username = interaction.options.getString("username", true);
      const postTo = interaction.options.getChannel("post_to", true);
      notifyTwitch.set(interaction.guildId!, { channelId: postTo.id, target: username });
      const embed = new EmbedBuilder()
        .setTitle("Twitch Notifications Enabled")
        .setColor(0x9146ff)
        .addFields(
          { name: "Streamer", value: username, inline: true },
          { name: "Post To", value: `<#${postTo.id}>`, inline: true }
        )
        .setDescription("⚠️ Add `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` secrets to enable real live notifications via Twitch EventSub. Config saved.");
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("notify_twitter")
      .setDescription("Get notified when a Twitter/X account posts")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addStringOption((o) => o.setName("username").setDescription("Twitter/X username").setRequired(true))
      .addChannelOption((o) => o.setName("post_to").setDescription("Discord channel to post notifications in").setRequired(true).addChannelTypes(ChannelType.GuildText)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "You need Manage Server permission.", ephemeral: true }); return;
      }
      const username = interaction.options.getString("username", true);
      const postTo = interaction.options.getChannel("post_to", true);
      notifyTwitter.set(interaction.guildId!, { channelId: postTo.id, target: username });
      const embed = new EmbedBuilder()
        .setTitle("Twitter/X Notifications Enabled")
        .setColor(0x1da1f2)
        .addFields(
          { name: "Account", value: `@${username}`, inline: true },
          { name: "Post To", value: `<#${postTo.id}>`, inline: true }
        )
        .setDescription("⚠️ Add a `TWITTER_BEARER_TOKEN` secret to enable real tweet notifications via the Twitter API v2. Config saved.");
      await interaction.reply({ embeds: [embed] });
    },
  },
];

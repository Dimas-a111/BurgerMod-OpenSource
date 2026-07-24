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
      .setName("notify")
      .setDescription("Configure social media upload/live notifications for this server")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addSubcommand((sub) =>
        sub.setName("youtube")
          .setDescription("Get notified when a YouTube channel uploads")
          .addStringOption((o) => o.setName("channel_name").setDescription("YouTube channel name or URL").setRequired(true))
          .addChannelOption((o) => o.setName("post_to").setDescription("Discord channel to post in").setRequired(true).addChannelTypes(ChannelType.GuildText))
      )
      .addSubcommand((sub) =>
        sub.setName("tiktok")
          .setDescription("Get notified when a TikTok account posts")
          .addStringOption((o) => o.setName("username").setDescription("TikTok username").setRequired(true))
          .addChannelOption((o) => o.setName("post_to").setDescription("Discord channel to post in").setRequired(true).addChannelTypes(ChannelType.GuildText))
      )
      .addSubcommand((sub) =>
        sub.setName("twitch")
          .setDescription("Get notified when a Twitch streamer goes live")
          .addStringOption((o) => o.setName("username").setDescription("Twitch username").setRequired(true))
          .addChannelOption((o) => o.setName("post_to").setDescription("Discord channel to post in").setRequired(true).addChannelTypes(ChannelType.GuildText))
      )
      .addSubcommand((sub) =>
        sub.setName("twitter")
          .setDescription("Get notified when a Twitter/X account posts")
          .addStringOption((o) => o.setName("username").setDescription("Twitter/X username").setRequired(true))
          .addChannelOption((o) => o.setName("post_to").setDescription("Discord channel to post in").setRequired(true).addChannelTypes(ChannelType.GuildText))
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "You need Manage Server permission.", ephemeral: true }); return;
      }
      const sub = interaction.options.getSubcommand();
      const postTo = interaction.options.getChannel("post_to", true);

      if (sub === "youtube") {
        const target = interaction.options.getString("channel_name", true);
        notifyYoutube.set(interaction.guildId!, { channelId: postTo.id, target });
        await interaction.reply({ embeds: [new EmbedBuilder()
          .setTitle("YouTube Notifications Enabled").setColor(0xff0000)
          .addFields({ name: "Channel", value: target, inline: true }, { name: "Post To", value: `<#${postTo.id}>`, inline: true })
          .setDescription("⚠️ Add a `YOUTUBE_API_KEY` secret to enable real upload detection. Config saved.")] });

      } else if (sub === "tiktok") {
        const target = interaction.options.getString("username", true);
        notifyTiktok.set(interaction.guildId!, { channelId: postTo.id, target });
        await interaction.reply({ embeds: [new EmbedBuilder()
          .setTitle("TikTok Notifications Enabled").setColor(0x010101)
          .addFields({ name: "Account", value: `@${target}`, inline: true }, { name: "Post To", value: `<#${postTo.id}>`, inline: true })
          .setDescription("⚠️ TikTok has no official API. Add a scraping backend to enable real notifications. Config saved.")] });

      } else if (sub === "twitch") {
        const target = interaction.options.getString("username", true);
        notifyTwitch.set(interaction.guildId!, { channelId: postTo.id, target });
        await interaction.reply({ embeds: [new EmbedBuilder()
          .setTitle("Twitch Notifications Enabled").setColor(0x9146ff)
          .addFields({ name: "Streamer", value: target, inline: true }, { name: "Post To", value: `<#${postTo.id}>`, inline: true })
          .setDescription("⚠️ Add `TWITCH_CLIENT_ID` + `TWITCH_CLIENT_SECRET` secrets for real EventSub notifications. Config saved.")] });

      } else if (sub === "twitter") {
        const target = interaction.options.getString("username", true);
        notifyTwitter.set(interaction.guildId!, { channelId: postTo.id, target });
        await interaction.reply({ embeds: [new EmbedBuilder()
          .setTitle("Twitter/X Notifications Enabled").setColor(0x1da1f2)
          .addFields({ name: "Account", value: `@${target}`, inline: true }, { name: "Post To", value: `<#${postTo.id}>`, inline: true })
          .setDescription("⚠️ Add a `TWITTER_BEARER_TOKEN` secret to enable real tweet notifications via Twitter API v2. Config saved.")] });
      }
    },
  },
];

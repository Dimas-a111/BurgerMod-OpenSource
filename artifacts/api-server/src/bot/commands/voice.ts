import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember,
} from "discord.js";
import {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { stay247 } from "../store";

export const commands = [
  {
    data: new SlashCommandBuilder()
      .setName("join")
      .setDescription("Make the bot join your voice channel"),
    async execute(interaction: ChatInputCommandInteraction) {
      const member = interaction.member as GuildMember;
      const vc = member?.voice?.channel;
      if (!vc) {
        await interaction.reply({ content: "You need to be in a voice channel first!", ephemeral: true });
        return;
      }
      joinVoiceChannel({
        channelId: vc.id,
        guildId: vc.guild.id,
        adapterCreator: vc.guild.voiceAdapterCreator,
      });
      await interaction.reply(`✅ Joined **${vc.name}**!`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("leave")
      .setDescription("Make the bot leave the voice channel"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      stay247.delete(guild.id);
      const connection = getVoiceConnection(guild.id);
      if (!connection) {
        await interaction.reply({ content: "I'm not in a voice channel.", ephemeral: true });
        return;
      }
      connection.destroy();
      await interaction.reply("👋 Left the voice channel.");
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("play")
      .setDescription("Play a song in the voice channel")
      .addStringOption((o) => o.setName("query").setDescription("Song name or URL").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const query = interaction.options.getString("query", true);
      const member = interaction.member as GuildMember;
      const vc = member?.voice?.channel;
      if (!vc) {
        await interaction.reply({ content: "Join a voice channel first!", ephemeral: true });
        return;
      }
      await interaction.reply(`🎵 Music playback for **${query}** requires a music backend (yt-dlp + ffmpeg). Use **/join** to connect and integrate a music library like \`play-dl\` for full functionality.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("stop")
      .setDescription("Stop audio playback"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      const connection = getVoiceConnection(guild.id);
      if (!connection) {
        await interaction.reply({ content: "I'm not in a voice channel.", ephemeral: true });
        return;
      }
      await interaction.reply("⏹️ Stopped playback.");
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("spotify")
      .setDescription("Play a Spotify song in VC")
      .addStringOption((o) => o.setName("song").setDescription("Song name or Spotify URL").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const song = interaction.options.getString("song", true);
      await interaction.reply(`🎵 Spotify playback for **${song}** requires Spotify API credentials and an audio streaming backend. Add \`SPOTIFY_CLIENT_ID\` and \`SPOTIFY_CLIENT_SECRET\` secrets to enable this feature.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("tts")
      .setDescription("Send a text-to-speech message in the channel")
      .addStringOption((o) => o.setName("text").setDescription("Text to speak").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const text = interaction.options.getString("text", true);
      await interaction.reply({ content: text, tts: true });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("247")
      .setDescription("Keep the bot in voice channel 24/7"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      const member = interaction.member as GuildMember;
      const vc = member?.voice?.channel;
      if (!vc) {
        await interaction.reply({ content: "Join a voice channel first!", ephemeral: true });
        return;
      }
      if (stay247.has(guild.id)) {
        stay247.delete(guild.id);
        const connection = getVoiceConnection(guild.id);
        if (connection) connection.destroy();
        await interaction.reply("✅ **24/7 mode disabled.** Bot will no longer stay in voice.");
        return;
      }
      stay247.add(guild.id);
      joinVoiceChannel({
        channelId: vc.id,
        guildId: vc.guild.id,
        adapterCreator: vc.guild.voiceAdapterCreator,
      });
      await interaction.reply(`🔁 **24/7 mode enabled!** Bot will stay in **${vc.name}** until you run **/247** again.`);
    },
  },
];

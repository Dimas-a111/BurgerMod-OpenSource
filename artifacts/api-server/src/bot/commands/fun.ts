import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

const EIGHT_BALL_RESPONSES = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes, definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful.",
];

export const commands = [
  {
    data: new SlashCommandBuilder()
      .setName("roll")
      .setDescription("Roll a dice")
      .addIntegerOption((o) =>
        o
          .setName("sides")
          .setDescription("Number of sides (default: 6)")
          .setRequired(false)
          .setMinValue(2)
          .setMaxValue(1000)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const sides = interaction.options.getInteger("sides") ?? 6;
      const result = Math.floor(Math.random() * sides) + 1;
      const embed = new EmbedBuilder()
        .setTitle("Dice Roll")
        .setDescription(`You rolled a **${result}** on a d${sides}!`)
        .setColor(0x57f287);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("coinflip")
      .setDescription("Flip a coin"),
    async execute(interaction: ChatInputCommandInteraction) {
      const result = Math.random() < 0.5 ? "Heads" : "Tails";
      const embed = new EmbedBuilder()
        .setTitle("Coin Flip")
        .setDescription(`It landed on **${result}**!`)
        .setColor(0xfee75c);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("8ball")
      .setDescription("Ask the magic 8-ball a question")
      .addStringOption((o) =>
        o
          .setName("question")
          .setDescription("Your question")
          .setRequired(true)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const question = interaction.options.getString("question", true);
      const response =
        EIGHT_BALL_RESPONSES[
          Math.floor(Math.random() * EIGHT_BALL_RESPONSES.length)
        ];
      const embed = new EmbedBuilder()
        .setTitle("Magic 8-Ball")
        .addFields(
          { name: "Question", value: question },
          { name: "Answer", value: response }
        )
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
];

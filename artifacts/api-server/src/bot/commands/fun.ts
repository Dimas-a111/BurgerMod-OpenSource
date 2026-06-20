import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

const EIGHT_BALL = ["It is certain.", "It is decidedly so.", "Without a doubt.", "Yes, definitely.", "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.", "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.", "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.", "Don't count on it.", "My reply is no.", "My sources say no.", "Outlook not so good.", "Very doubtful."];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }

export const commands = [
  {
    data: new SlashCommandBuilder()
      .setName("roll")
      .setDescription("Roll a dice")
      .addIntegerOption((o) => o.setName("sides").setDescription("Number of sides (default: 6)").setRequired(false).setMinValue(2).setMaxValue(1000))
      .addIntegerOption((o) => o.setName("count").setDescription("Number of dice (default: 1)").setRequired(false).setMinValue(1).setMaxValue(10)),
    async execute(interaction: ChatInputCommandInteraction) {
      const sides = interaction.options.getInteger("sides") ?? 6;
      const count = interaction.options.getInteger("count") ?? 1;
      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
      const total = rolls.reduce((a, b) => a + b, 0);
      const embed = new EmbedBuilder()
        .setTitle("🎲 Dice Roll")
        .setColor(0x57f287)
        .addFields(
          { name: "Rolls", value: rolls.join(", "), inline: true },
          { name: "Total", value: total.toString(), inline: true },
          { name: "Dice", value: `${count}d${sides}`, inline: true }
        );
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("coinflip")
      .setDescription("Flip a coin"),
    async execute(interaction: ChatInputCommandInteraction) {
      const result = Math.random() < 0.5 ? "Heads 🪙" : "Tails 🪙";
      await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Coin Flip").setDescription(`It landed on **${result}**!`).setColor(0xfee75c)] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("8ball")
      .setDescription("Ask the magic 8-ball a question")
      .addStringOption((o) => o.setName("question").setDescription("Your question").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const question = interaction.options.getString("question", true);
      const response = pick(EIGHT_BALL);
      await interaction.reply({ embeds: [new EmbedBuilder().setTitle("🎱 Magic 8-Ball").addFields({ name: "Question", value: question }, { name: "Answer", value: response }).setColor(0x5865f2)] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("rps")
      .setDescription("Play Rock Paper Scissors against the bot")
      .addStringOption((o) => o.setName("choice").setDescription("Your choice").setRequired(true).addChoices({ name: "Rock", value: "rock" }, { name: "Paper", value: "paper" }, { name: "Scissors", value: "scissors" })),
    async execute(interaction: ChatInputCommandInteraction) {
      const choices = ["rock", "paper", "scissors"] as const;
      type Choice = typeof choices[number];
      const userChoice = interaction.options.getString("choice", true) as Choice;
      const botChoice = pick([...choices]);
      const beats: Record<Choice, Choice> = { rock: "scissors", scissors: "paper", paper: "rock" };
      const result = userChoice === botChoice ? "It's a tie!" : beats[userChoice] === botChoice ? "You win! 🎉" : "Bot wins! 🤖";
      const icons: Record<Choice, string> = { rock: "🪨", paper: "📄", scissors: "✂️" };
      await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Rock Paper Scissors").setColor(0x5865f2).addFields({ name: "You", value: `${icons[userChoice]} ${userChoice}`, inline: true }, { name: "Bot", value: `${icons[botChoice]} ${botChoice}`, inline: true }, { name: "Result", value: result })] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("choose")
      .setDescription("Make the bot choose between options")
      .addStringOption((o) => o.setName("options").setDescription("Options separated by commas (e.g. pizza, tacos, burger)").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const raw = interaction.options.getString("options", true);
      const options = raw.split(",").map((s) => s.trim()).filter(Boolean);
      if (options.length < 2) { await interaction.reply({ content: "Provide at least 2 options separated by commas.", ephemeral: true }); return; }
      const chosen = pick(options);
      await interaction.reply(`🤔 I choose: **${chosen}**`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("rate")
      .setDescription("Rate anything out of 10")
      .addStringOption((o) => o.setName("thing").setDescription("What to rate").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const thing = interaction.options.getString("thing", true);
      const rating = (Math.abs(thing.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 11);
      const bar = "█".repeat(rating) + "░".repeat(10 - rating);
      await interaction.reply(`**${thing}** rating: **${rating}/10**\n\`${bar}\``);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("reverse")
      .setDescription("Reverse your text")
      .addStringOption((o) => o.setName("text").setDescription("Text to reverse").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const text = interaction.options.getString("text", true);
      await interaction.reply(`**Reversed:** ${text.split("").reverse().join("")}`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("mock")
      .setDescription("mOcK tExT sOmEtHiNg")
      .addStringOption((o) => o.setName("text").setDescription("Text to mock").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const text = interaction.options.getString("text", true);
      const mocked = text.split("").map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join("");
      await interaction.reply(mocked);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("clap")
      .setDescription("Add 👏 claps 👏 between 👏 words")
      .addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const text = interaction.options.getString("text", true);
      await interaction.reply(text.split(" ").join(" 👏 "));
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("ascii")
      .setDescription("Convert text to big ascii-style block letters")
      .addStringOption((o) => o.setName("text").setDescription("Short text (max 10 chars)").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const text = interaction.options.getString("text", true).toUpperCase().slice(0, 10);
      await interaction.reply(`\`\`\`\n${text}\n\`\`\``);
    },
  },
];

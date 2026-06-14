const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Checks if Rin is online."),

  async execute(interaction) {
    await interaction.reply("🏮 Rin is watching from the shadows.");
  },
};
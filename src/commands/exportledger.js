const fs = require("fs");
const path = require("path");

const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

const { isRinModerator } = require("../config/permissions");

const ladderPath = path.join(__dirname, "../../data/ladder.json");
const challengesPath = path.join(__dirname, "../../data/challenges.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("exportledger")
    .setDescription("Export Rin's Rank Ledger data files."),

  async execute(interaction) {
    if (!isRinModerator(interaction)) {
      return interaction.reply({
        content: "❌ Only moderators can use this command.",
        ephemeral: true,
      });
    }

    const files = [];

    if (fs.existsSync(ladderPath)) {
      files.push(
        new AttachmentBuilder(ladderPath, {
          name: "ladder.json",
        })
      );
    }

    if (fs.existsSync(challengesPath)) {
      files.push(
        new AttachmentBuilder(challengesPath, {
          name: "challenges.json",
        })
      );
    }

    if (!files.length) {
      return interaction.reply({
        content: "❌ No ledger files found to export.",
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: "𓄧 Exporting Rank Ledger files.",
      files,
      ephemeral: true,
    });
  },
};
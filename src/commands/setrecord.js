const fs = require("fs");
const path = require("path");

const { SlashCommandBuilder } = require("discord.js");

const { isRinModerator } = require("../config/permissions");
const { updateLadderMessage } = require("../ladder/ladderRenderer");

const ladderPath = path.join(__dirname, "../../data/ladder.json");

function getLadder() {
  if (!fs.existsSync(ladderPath)) return [];
  return JSON.parse(fs.readFileSync(ladderPath, "utf8"));
}

function saveLadder(ladder) {
  fs.writeFileSync(ladderPath, JSON.stringify(ladder, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setrecord")
    .setDescription("Manually set a Yogai member's Rank Ledger record.")
    .addUserOption(option =>
      option
        .setName("player")
        .setDescription("The player to update.")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("wins")
        .setDescription("New win count.")
        .setRequired(true)
        .setMinValue(0)
    )
    .addIntegerOption(option =>
      option
        .setName("losses")
        .setDescription("New loss count.")
        .setRequired(true)
        .setMinValue(0)
    ),

  async execute(interaction) {
    if (!isRinModerator(interaction)) {
      return interaction.reply({
        content: "❌ Only moderators can use this command.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("player");
    const wins = interaction.options.getInteger("wins");
    const losses = interaction.options.getInteger("losses");

    const ladder = getLadder();

    const player = ladder.find(entry => entry.userId === user.id);

    if (!player) {
      return interaction.reply({
        content: "❌ That user is not on the Rank Ledger.",
        ephemeral: true,
      });
    }

    player.wins = wins;
    player.losses = losses;

    saveLadder(ladder);

    await updateLadderMessage(interaction.client);

    await interaction.reply({
      content: `𓄧 Updated **${player.ninjaName}** to \`${wins}-${losses}\`.`,
      ephemeral: true,
    });
  },
};
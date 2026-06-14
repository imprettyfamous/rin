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
    .setName("forcerank")
    .setDescription("Move a Yogai member to a specific Rank Ledger position.")
    .addUserOption(option =>
      option
        .setName("player")
        .setDescription("The player to move.")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("rank")
        .setDescription("The new rank position.")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    if (!isRinModerator(interaction)) {
      return interaction.reply({
        content: "❌ Only moderators can use this command.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("player");
    const rank = interaction.options.getInteger("rank");

    const ladder = getLadder();

    const currentIndex = ladder.findIndex(entry => entry.userId === user.id);

    if (currentIndex === -1) {
      return interaction.reply({
        content: "❌ That user is not on the Rank Ledger.",
        ephemeral: true,
      });
    }

    const targetIndex = Math.min(rank - 1, ladder.length - 1);

    const [player] = ladder.splice(currentIndex, 1);
    ladder.splice(targetIndex, 0, player);

    saveLadder(ladder);

    await updateLadderMessage(interaction.client);

    await interaction.reply({
      content: `𓄧 Moved **${player.ninjaName}** to Rank #${targetIndex + 1}.`,
      ephemeral: true,
    });
  },
};
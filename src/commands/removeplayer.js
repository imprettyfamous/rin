const fs = require("fs");
const path = require("path");

const { SlashCommandBuilder } = require("discord.js");

const { isRinModerator } = require("../config/permissions");
const { updateLadderMessage } = require("../ladder/ladderRenderer");
const { getConfig } = require("../config/configStore");

const ladderPath = path.join(__dirname, "../../data/ladder.json");
const challengesPath = path.join(__dirname, "../../data/challenges.json");

function getLadder() {
  if (!fs.existsSync(ladderPath)) return [];
  return JSON.parse(fs.readFileSync(ladderPath, "utf8"));
}

function saveLadder(ladder) {
  fs.writeFileSync(ladderPath, JSON.stringify(ladder, null, 2));
}

function getChallenges() {
  if (!fs.existsSync(challengesPath)) return [];
  return JSON.parse(fs.readFileSync(challengesPath, "utf8"));
}

function saveChallenges(challenges) {
  fs.writeFileSync(challengesPath, JSON.stringify(challenges, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removeplayer")
    .setDescription("Remove a player from the Rank Ledger.")
    .addUserOption(option =>
      option
        .setName("player")
        .setDescription("Player to remove.")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!isRinModerator(interaction)) {
      return interaction.reply({
        content: "❌ Only moderators can use this command.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("player");

    const ladder = getLadder();
    const challenges = getChallenges();

    const playerIndex = ladder.findIndex(
      entry => entry.userId === user.id
    );

    if (playerIndex === -1) {
      return interaction.reply({
        content: "❌ That player is not on the Rank Ledger.",
        ephemeral: true,
      });
    }

    const player = ladder[playerIndex];

    ladder.splice(playerIndex, 1);

    const filteredChallenges = challenges.filter(
      challenge =>
        challenge.challengerId !== user.id &&
        challenge.targetId !== user.id
    );

    saveLadder(ladder);
    saveChallenges(filteredChallenges);

    // Remove Yogai role
    try {
      const config = getConfig();

      if (config.yogaiRoleId) {
        const member = await interaction.guild.members.fetch(user.id);

        if (member.roles.cache.has(config.yogaiRoleId)) {
          await member.roles.remove(config.yogaiRoleId);
        }
      }
    } catch (error) {
      console.log("Could not remove Yogai role.");
    }

    await updateLadderMessage(interaction.client);

    await interaction.reply({
      content:
        `𓄧 Removed **${player.ninjaName}** from the Rank Ledger and cleared any active challenges.`,
      ephemeral: true,
    });
  },
};
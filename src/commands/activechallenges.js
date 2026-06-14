const fs = require("fs");
const path = require("path");

const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

const { isRinModerator } = require("../config/permissions");

const challengesPath = path.join(__dirname, "../../data/challenges.json");

function getChallenges() {
  if (!fs.existsSync(challengesPath)) return [];
  return JSON.parse(fs.readFileSync(challengesPath, "utf8"));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("activechallenges")
    .setDescription("View all active Rank Ledger challenges."),

  async execute(interaction) {
    if (!isRinModerator(interaction)) {
      return interaction.reply({
        content: "❌ Only moderators can use this command.",
        ephemeral: true,
      });
    }

    const challenges = getChallenges();

    const activeChallenges = challenges.filter(
      challenge => challenge.status === "pending"
    );

    const description = activeChallenges.length
      ? activeChallenges
          .map(challenge => {
            const created = Math.floor(
              new Date(challenge.createdAt).getTime() / 1000
            );

            return [
              `**${challenge.challengerName}** VS **${challenge.targetName}**`,
              `Rank #${challenge.challengerRank} challenging Rank #${challenge.targetRank}`,
              `Created: <t:${created}:R>`,
            ].join("\n");
          })
          .join("\n\n")
      : "_No active challenges._";

    const embed = new EmbedBuilder()
      .setTitle("𓄧 Active Challenges")
      .setDescription(description)
      .setColor(0xe91e63);

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
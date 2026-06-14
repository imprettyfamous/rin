const fs = require("fs");
const path = require("path");

const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
} = require("discord.js");

const { getConfig } = require("../config/configStore");
const { updateLadderMessage } = require("./ladderRenderer");

const ladderPath = path.join(__dirname, "../../data/ladder.json");
const challengesPath = path.join(__dirname, "../../data/challenges.json");

function getJson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function movePlayerToRank(ladder, playerId, targetIndex) {
  const currentIndex = ladder.findIndex(p => p.userId === playerId);
  if (currentIndex === -1) return ladder;

  const [player] = ladder.splice(currentIndex, 1);
  ladder.splice(targetIndex, 0, player);

  return ladder;
}

async function handleSubmitButton(interaction) {
  const challenges = getJson(challengesPath);

  const activeChallenges = challenges.filter(challenge =>
    challenge.status === "pending" &&
    (
      challenge.challengerId === interaction.user.id ||
      challenge.targetId === interaction.user.id
    )
  );

  if (!activeChallenges.length) {
    return interaction.reply({
      content: "𓄧 You have no pending challenges to submit.",
      ephemeral: true,
    });
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("rin_submit_challenge_select")
    .setPlaceholder("Choose a challenge")
    .addOptions(
      activeChallenges.map(challenge => ({
        label: `${challenge.challengerName} VS ${challenge.targetName}`,
        description: `Rank #${challenge.challengerRank} challenging Rank #${challenge.targetRank}`,
        value: challenge.id,
      }))
    );

  await interaction.reply({
    content: "𓄧 Select the challenge you want to resolve.",
    components: [new ActionRowBuilder().addComponents(selectMenu)],
    ephemeral: true,
  });
}

async function handleSubmitChallengeSelect(interaction) {
  const challengeId = interaction.values[0];
  const challenges = getJson(challengesPath);

  const challenge = challenges.find(c => c.id === challengeId);

  if (!challenge || challenge.status !== "pending") {
    return interaction.update({
      content: "❌ Rin could not find that pending challenge.",
      components: [],
    });
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`rin_submit_outcome_select:${challenge.id}`)
    .setPlaceholder("Choose the outcome")
    .addOptions([
      {
        label: `${challenge.challengerName} won`,
        description: "Record changes. Challenger takes the higher spot.",
        value: "challenger_won",
      },
      {
        label: `${challenge.targetName} won`,
        description: "Record changes. Rank order stays the same.",
        value: "target_won",
      },
      {
        label: "Opponent forfeited",
        description: "No record changes. Submitter takes opponent's spot.",
        value: "opponent_forfeited",
      },
    ]);

  await interaction.update({
    content: `𓄧 Resolving: **${challenge.challengerName}** VS **${challenge.targetName}**`,
    components: [new ActionRowBuilder().addComponents(selectMenu)],
  });
}

async function handleSubmitOutcomeSelect(interaction, client) {
  const challengeId = interaction.customId.split(":")[1];
  const outcome = interaction.values[0];

  const config = getConfig();
  const ladder = getJson(ladderPath);
  const challenges = getJson(challengesPath);

  const challenge = challenges.find(c => c.id === challengeId);

  if (!challenge || challenge.status !== "pending") {
    return interaction.update({
      content: "❌ Rin could not find that pending challenge.",
      components: [],
    });
  }

  if (
    interaction.user.id !== challenge.challengerId &&
    interaction.user.id !== challenge.targetId
  ) {
    return interaction.update({
      content: "❌ Only fighters in this challenge can submit its result.",
      components: [],
    });
  }

  const challenger = ladder.find(p => p.userId === challenge.challengerId);
  const target = ladder.find(p => p.userId === challenge.targetId);

  if (!challenger || !target) {
    return interaction.update({
      content: "❌ Rin could not find both fighters in the Rank Ledger.",
      components: [],
    });
  }

  let resultText = "";

  if (outcome === "challenger_won") {
    challenger.wins += 1;
    target.losses += 1;

    const targetIndex = ladder.findIndex(p => p.userId === target.userId);
    movePlayerToRank(ladder, challenger.userId, targetIndex);

    challenge.status = "completed";
    challenge.winnerId = challenger.userId;
    challenge.loserId = target.userId;
    resultText = `**${challenger.ninjaName}** defeated **${target.ninjaName}**.`;
  }

  if (outcome === "target_won") {
    target.wins += 1;
    challenger.losses += 1;

    challenge.status = "completed";
    challenge.winnerId = target.userId;
    challenge.loserId = challenger.userId;
    resultText = `**${target.ninjaName}** defended their rank against **${challenger.ninjaName}**.`;
  }

  if (outcome === "opponent_forfeited") {
    const submitterId = interaction.user.id;
    const opponentId =
      submitterId === challenge.challengerId
        ? challenge.targetId
        : challenge.challengerId;

    const submitter = ladder.find(p => p.userId === submitterId);
    const opponent = ladder.find(p => p.userId === opponentId);

    const opponentIndex = ladder.findIndex(p => p.userId === opponentId);
    movePlayerToRank(ladder, submitterId, opponentIndex);

    challenge.status = "forfeited";
    challenge.forfeitedBy = opponentId;
    challenge.advancedBy = submitterId;

    resultText = `**${opponent.ninjaName}** forfeited. **${submitter.ninjaName}** takes their spot with no record changes.`;
  }

  challenge.resolvedAt = new Date().toISOString();
  challenge.resolvedBy = interaction.user.id;

  saveJson(ladderPath, ladder);
  saveJson(challengesPath, challenges);

  await updateLadderMessage(client);

  const resultEmbed = new EmbedBuilder()
    .setTitle(outcome === "opponent_forfeited" ? "༝ CHALLENGE FORFEITED" : "𓄿 CHALLENGE ENDED")
    .setDescription(resultText)
    .setColor(0x5A5266);

  if (config.logChannelId) {
    const logChannel = await client.channels.fetch(config.logChannelId);
    if (logChannel) {
      await logChannel.send({ embeds: [resultEmbed] });
    }
  }

  await interaction.update({
    content: `𓄧 Result submitted. ${resultText}`,
    components: [],
  });
}

module.exports = {
  handleSubmitButton,
  handleSubmitChallengeSelect,
  handleSubmitOutcomeSelect,
};
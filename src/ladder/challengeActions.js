const fs = require("fs");
const path = require("path");

const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
} = require("discord.js");

const { getConfig } = require("../config/configStore");

const ladderPath = path.join(__dirname, "../../data/ladder.json");
const challengesPath = path.join(__dirname, "../../data/challenges.json");

function getLadder() {
  try {
    if (!fs.existsSync(ladderPath)) return [];
    return JSON.parse(fs.readFileSync(ladderPath, "utf8"));
  } catch (error) {
    console.error("[RIN][getLadder] Failed:", error);
    return [];
  }
}

function getChallenges() {
  try {
    if (!fs.existsSync(challengesPath)) return [];
    return JSON.parse(fs.readFileSync(challengesPath, "utf8"));
  } catch (error) {
    console.error("[RIN][getChallenges] Failed:", error);
    return [];
  }
}

function saveChallenges(challenges) {
  try {
    fs.writeFileSync(
      challengesPath,
      JSON.stringify(challenges, null, 2)
    );
  } catch (error) {
    console.error("[RIN][saveChallenges] Failed:", error);
    throw error;
  }
}

function isPlayerInActiveChallenge(challenges, userId) {
  return challenges.some(
    challenge =>
      challenge.status === "pending" &&
      (
        challenge.challengerId === userId ||
        challenge.targetId === userId
      )
  );
}

async function handleChallengeButton(interaction) {
  const ladder = getLadder();
  const challenges = getChallenges();

  const challengerIndex = ladder.findIndex(
    player => player.userId === interaction.user.id
  );

  if (challengerIndex === -1) {
    return interaction.reply({
      content: "𓄧 You are not registered in the Rank Ledger yet.",
      ephemeral: true,
    });
  }

  if (challengerIndex === 0) {
    return interaction.reply({
      content: "𓄧 You are already ranked #1. Nobody stands above you.",
      ephemeral: true,
    });
  }

  if (isPlayerInActiveChallenge(challenges, interaction.user.id)) {
    return interaction.reply({
      content: "𓄧 You are already involved in a pending challenge.",
      ephemeral: true,
    });
  }

  const eligibleTargets = ladder
    .slice(Math.max(0, challengerIndex - 2), challengerIndex)
    .filter(
      player =>
        !isPlayerInActiveChallenge(
          challenges,
          player.userId
        )
    );

  if (!eligibleTargets.length) {
    return interaction.reply({
      content: "𓄧 No eligible targets are currently available.",
      ephemeral: true,
    });
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("rin_challenge_select")
    .setPlaceholder("Choose who to challenge")
    .addOptions(
      eligibleTargets.map(player => {
        const rank =
          ladder.findIndex(
            p => p.userId === player.userId
          ) + 1;

        return {
          label: `#${rank} ${player.ninjaName || "Unknown"}`.slice(
            0,
            100
          ),
          description: `Record: ${player.wins ?? 0}-${player.losses ?? 0}`.slice(
            0,
            100
          ),
          value: String(player.userId),
        };
      })
    );

  const row = new ActionRowBuilder().addComponents(
    selectMenu
  );

  await interaction.reply({
    content: "⚔️ Choose your challenge target.",
    components: [row],
    ephemeral: true,
  });
}

async function handleChallengeSelect(
  interaction,
  client
) {
  try {
    await interaction.deferUpdate();
  } catch (error) {
    console.error(
      "[RIN][ChallengeSelect] deferUpdate failed:",
      error
    );
    return;
  }

  try {
    const targetUserId = interaction.values[0];

    const config = getConfig();
    const ladder = getLadder();
    const challenges = getChallenges();

    const challengerIndex = ladder.findIndex(
      player => player.userId === interaction.user.id
    );

    const targetIndex = ladder.findIndex(
      player => player.userId === targetUserId
    );

    if (
      challengerIndex === -1 ||
      targetIndex === -1
    ) {
      return interaction.editReply({
        content:
          "❌ Rin could not find one of the fighters in the Rank Ledger.",
        components: [],
      });
    }

    const challenger = ladder[challengerIndex];
    const target = ladder[targetIndex];

    const rankDifference =
      challengerIndex - targetIndex;

    if (
      rankDifference < 1 ||
      rankDifference > 2
    ) {
      return interaction.editReply({
        content:
          "𓄧 You can only challenge fighters within 2 ranks above you.",
        components: [],
      });
    }

    if (
      isPlayerInActiveChallenge(
        challenges,
        challenger.userId
      ) ||
      isPlayerInActiveChallenge(
        challenges,
        target.userId
      )
    ) {
      return interaction.editReply({
        content:
          "𓄧 One of these fighters is already involved in a pending challenge.",
        components: [],
      });
    }

    const challenge = {
      id: `${Date.now()}_${challenger.userId}_${target.userId}`,
      challengerId: challenger.userId,
      challengerName: challenger.ninjaName,
      challengerRank: challengerIndex + 1,
      targetId: target.userId,
      targetName: target.ninjaName,
      targetRank: targetIndex + 1,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    challenges.push(challenge);
    saveChallenges(challenges);

    await interaction.editReply({
      content:
        `NEW CHALLENGE: **${challenger.ninjaName}** VS **${target.ninjaName}**.`,
      components: [],
    });

    const challengeEmbed = new EmbedBuilder()
      .setTitle("☁︎ NEW CHALLENGE")
      .setDescription(
        [
          `**${challenger.ninjaName}** \`(${challenger.wins}-${challenger.losses})\` has challenged **${target.ninjaName}** \`(${target.wins}-${target.losses})\`.`,
          "",
          `Rank #${challengerIndex + 1} is reaching for Rank #${targetIndex + 1}.`,
        ].join("\n")
      )
      .setColor(0xe91e63);

    if (config.logChannelId) {
      try {
        const logChannel =
          await client.channels.fetch(
            config.logChannelId
          );

        if (logChannel) {
          await logChannel.send({
            embeds: [challengeEmbed],
          });
        }
      } catch (error) {
        console.error(
          "[RIN][ChallengeSelect] Could not send challenge log:",
          error
        );
      }
    }

    try {
      const targetUser =
        await client.users.fetch(
          target.userId
        );

      await targetUser.send(
        `**${challenger.ninjaName}** has challenged you for your Yogai spot.\nYou have 48 hours, otherwise you will forfeit.`
      );
    } catch (error) {
      console.error(
        "[RIN][ChallengeSelect] Could not DM challenge target:",
        error
      );
    }
  } catch (error) {
    console.error(
      "[RIN][ChallengeSelect] Fatal error:",
      error
    );

    try {
      await interaction.editReply({
        content:
          "❌ Rin failed while creating this challenge. Check the console logs.",
        components: [],
      });
    } catch (replyError) {
      console.error(
        "[RIN][ChallengeSelect] Failed to edit error reply:",
        replyError
      );
    }
  }
}

module.exports = {
  handleChallengeButton,
  handleChallengeSelect,
};
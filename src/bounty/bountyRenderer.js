const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const COLORS = {
  red: 0xff1744,
  yellow: 0xfbff05,
  dark: 0x111111,
};

function progressBar(completed, total) {
  const size = 10;
  const safeTotal = Math.max(total, 1);
  const filled = Math.min(size, Math.round((completed / safeTotal) * size));
  const empty = size - filled;

  return "█".repeat(filled) + "░".repeat(empty);
}

function renderBountyBoard() {
  const embed = new EmbedBuilder()
    .setColor(COLORS.red)
    .setTitle("🎯 YOGAI BOUNTY BOARD")
    .setDescription(
      [
        "Place a bounty on a ninja who has been griefing, bullying, or causing trouble.",
        "",
        "Approved contracts will be posted for Yogai members to fulfill.",
        "",
        "**Only Yogai members may submit kill proof.**",
      ].join("\n")
    )
    .setFooter({ text: "Yogai Intelligence Network" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("rin_bounty_place")
      .setLabel("Place Bounty")
      .setEmoji("🎯")
      .setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [row] };
}

function renderPendingBounty(bounty) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.yellow)
    .setTitle("⚠️ BOUNTY REQUEST")
    .setDescription("A new bounty request is awaiting approval.")
    .addFields(
      {
        name: "Target",
        value: bounty.target,
        inline: true,
      },
      {
        name: "Reward Per Kill",
        value: bounty.reward,
        inline: true,
      },
      {
        name: "Requested Eliminations",
        value: String(bounty.requestedKills),
        inline: true,
      },
      {
        name: "Reason",
        value: bounty.reason,
      },
      {
        name: "Submitted By",
        value: `<@${bounty.submitterId}>`,
      }
    )
    .setFooter({ text: `Bounty ID: ${bounty.id}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`rin_bounty_approve:${bounty.id}`)
      .setLabel("Approve")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`rin_bounty_reject:${bounty.id}`)
      .setLabel("Reject")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [row] };
}

function renderActiveBounty(bounty) {
  const remaining = bounty.requestedKills - bounty.completedKills;
  const safeRemaining = Math.max(remaining, 0);
  const bar = progressBar(bounty.completedKills, bounty.requestedKills);
  const isComplete = bounty.status === "completed";

  const embed = new EmbedBuilder()
    .setColor(isComplete ? COLORS.dark : COLORS.red)
    .setTitle(
      isComplete
        ? `💀 ${bounty.target} WIPED`
        : `🎯 ACTIVE BOUNTY: ${bounty.target}`
    )
    .setDescription(
      [
        isComplete
          ? "*Contract complete. The mark has been wiped.*"
          : "*A contract has been approved. Yogai may now intervene.*",
        "",
        `**Progress:** ${bounty.completedKills} / ${bounty.requestedKills}`,
        `\`${bar}\``,
        `**Remaining:** ${safeRemaining}`,
      ].join("\n")
    )
    .addFields(
      {
        name: "Reward Per Confirmed Kill",
        value: bounty.reward,
        inline: true,
      },
      {
        name: "Reason",
        value: bounty.reason,
      }
    )
    .setFooter({ text: `Bounty ID: ${bounty.id}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`rin_bounty_submitkill:${bounty.id}`)
      .setLabel(isComplete ? "Contract Complete" : "Submit Kill Proof")
      .setEmoji(isComplete ? "💀" : "📸")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(isComplete)
  );

  return { embeds: [embed], components: [row] };
}

function renderKillNotice(bounty, hunterId, proof, notes) {
  const remaining = bounty.requestedKills - bounty.completedKills;

  const embed = new EmbedBuilder()
    .setColor(bounty.status === "completed" ? COLORS.yellow : COLORS.red)
    .setTitle(
      bounty.status === "completed"
        ? "☠️ BOUNTY COMPLETE"
        : "☠️ TARGET ELIMINATED"
    )
    .setDescription(
      [
        `<@${hunterId}> eliminated **${bounty.target}**.`,
        "",
        `**Remaining:** ${Math.max(remaining, 0)}`,
        `**Reward:** ${bounty.reward}`,
        "",
        `<@${bounty.submitterId}> your mark has been fulfilled.`,
      ].join("\n")
    )
    .setFooter({ text: `Bounty ID: ${bounty.id}` });

  if (notes) {
    embed.addFields({
      name: "Hunter Notes",
      value: notes,
    });
  }

  if (proof.startsWith("http")) {
    embed.setImage(proof);
  }

  return { embeds: [embed] };
}

module.exports = {
  renderBountyBoard,
  renderPendingBounty,
  renderActiveBounty,
  renderKillNotice,
};
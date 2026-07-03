const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionsBitField,
} = require("discord.js");

const {
  createPendingBounty,
  approveBounty,
  rejectBounty,
  getBounty,
  addKill,
} = require("./bountyStore");

const {
  renderPendingBounty,
  renderActiveBounty,
  renderKillNotice,
} = require("./bountyRenderer");

const configStore = require("../config/configStore");

function getConfig() {
  if (configStore.loadConfig) return configStore.loadConfig();
  if (configStore.getConfig) return configStore.getConfig();
  return {};
}

function getYogaiRoleId(config) {
  return config.yogaiRoleId || config.yogaiRole || config.guildRoleId;
}

function isAdmin(member) {
  return member.permissions.has(PermissionsBitField.Flags.ManageGuild);
}

async function handleBountyButton(interaction, client) {
  const [action, bountyId] = interaction.customId
    .replace("rin_bounty_", "")
    .split(":");

  if (action === "place") {
    const modal = new ModalBuilder()
      .setCustomId("rin_bounty_place_modal")
      .setTitle("Place a Bounty");

    const targetInput = new TextInputBuilder()
      .setCustomId("target")
      .setLabel("Target ninja name")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(50);

    const reasonInput = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Why are you placing this bounty?")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(800);

    const rewardInput = new TextInputBuilder()
      .setCustomId("reward")
      .setLabel("Reward per kill, optional")
      .setPlaceholder("Example: 1,000 Ryo")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(100);

    const killsInput = new TextInputBuilder()
      .setCustomId("requestedKills")
      .setLabel("How many eliminations?")
      .setPlaceholder("Example: 10")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(3);

    modal.addComponents(
      new ActionRowBuilder().addComponents(targetInput),
      new ActionRowBuilder().addComponents(reasonInput),
      new ActionRowBuilder().addComponents(rewardInput),
      new ActionRowBuilder().addComponents(killsInput)
    );

    await interaction.showModal(modal);
    return;
  }

  if (action === "approve") {
    if (!isAdmin(interaction.member)) {
      await interaction.reply({
        content: "❌ Only admins may approve bounties.",
        ephemeral: true,
      });
      return;
    }

    const config = getConfig();
    const bountyChannelId = config.bountyChannelId;

    if (!bountyChannelId) {
      await interaction.reply({
        content: "❌ No bounty channel set. Use `/setbountychannel` first.",
        ephemeral: true,
      });
      return;
    }

    const bounty = getBounty(bountyId);

    if (!bounty || bounty.status !== "pending") {
      await interaction.reply({
        content: "❌ This bounty is no longer pending.",
        ephemeral: true,
      });
      return;
    }

    const bountyChannel = await client.channels.fetch(bountyChannelId);
    const bountyMessage = await bountyChannel.send(renderActiveBounty(bounty));

    const approved = approveBounty(bounty.id, bountyMessage.id);

    await bountyMessage.edit(renderActiveBounty(approved));

    await interaction.update({
      content: "✅ Bounty approved and posted.",
      embeds: interaction.message.embeds,
      components: [],
    });

    return;
  }

  if (action === "reject") {
    if (!isAdmin(interaction.member)) {
      await interaction.reply({
        content: "❌ Only admins may reject bounties.",
        ephemeral: true,
      });
      return;
    }

    const bounty = rejectBounty(bountyId);

    await interaction.update({
      content: bounty
        ? `❌ Bounty request rejected. Target: **${bounty.target}**`
        : "❌ Bounty request rejected.",
      embeds: [],
      components: [],
    });

    return;
  }

  if (action === "submitkill") {
    const config = getConfig();
    const yogaiRoleId = getYogaiRoleId(config);

    if (!yogaiRoleId || !interaction.member.roles.cache.has(yogaiRoleId)) {
      await interaction.reply({
        content: "❌ Only Yogai members may submit kill proof.",
        ephemeral: true,
      });
      return;
    }

    const bounty = getBounty(bountyId);

    if (!bounty || bounty.status !== "active") {
      await interaction.reply({
        content: "❌ This bounty is not active.",
        ephemeral: true,
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(`rin_bounty_kill_modal:${bounty.id}`)
      .setTitle(`Submit Proof: ${bounty.target}`);

    const proofInput = new TextInputBuilder()
      .setCustomId("proof")
      .setLabel("Screenshot proof link")
      .setPlaceholder("Paste an image link here")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(300);

    const notesInput = new TextInputBuilder()
      .setCustomId("notes")
      .setLabel("Optional notes")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(500);

    modal.addComponents(
      new ActionRowBuilder().addComponents(proofInput),
      new ActionRowBuilder().addComponents(notesInput)
    );

    await interaction.showModal(modal);
  }
}

async function handleBountyModal(interaction, client) {
  if (interaction.customId === "rin_bounty_place_modal") {
    const config = getConfig();
    const modChannelId = config.modChannelId;

    if (!modChannelId) {
      await interaction.reply({
        content: "❌ No mod channel set. Use `/setmodchannel` first.",
        ephemeral: true,
      });
      return;
    }

    const target = interaction.fields.getTextInputValue("target").trim();
    const reason = interaction.fields.getTextInputValue("reason").trim();
    const reward =
      interaction.fields.getTextInputValue("reward").trim() || "No reward listed";

    const requestedKillsRaw = interaction.fields
      .getTextInputValue("requestedKills")
      .trim();

    const requestedKills = Number(requestedKillsRaw);

    if (!Number.isInteger(requestedKills) || requestedKills < 1 || requestedKills > 99) {
      await interaction.reply({
        content: "❌ Requested eliminations must be a whole number between 1 and 99.",
        ephemeral: true,
      });
      return;
    }

    const bounty = createPendingBounty({
      submitterId: interaction.user.id,
      target,
      reason,
      reward,
      requestedKills,
    });

    const modChannel = await client.channels.fetch(modChannelId);
    await modChannel.send(renderPendingBounty(bounty));

    await interaction.reply({
      content: "✅ Your bounty has been submitted for approval.",
      ephemeral: true,
    });

    return;
  }

if (interaction.customId.startsWith("rin_bounty_kill_modal:")) {
  const bountyId = interaction.customId.split(":")[1];

  const proof = interaction.fields.getTextInputValue("proof").trim();
  const notes = interaction.fields.getTextInputValue("notes").trim();

  const updatedBounty = addKill(bountyId, {
    hunterId: interaction.user.id,
    proof,
    notes,
  });

  if (!updatedBounty) {
    await interaction.reply({
      content: "❌ Rin could not find that bounty.",
      ephemeral: true,
    });
    return;
  }

  const config = getConfig();
  const bountyChannelId = config.bountyChannelId;
  const publicChatChannelId = config.publicChatChannelId;

  if (publicChatChannelId) {
    const publicChatChannel = await client.channels.fetch(publicChatChannelId);

    await publicChatChannel.send(
      renderKillNotice(updatedBounty, interaction.user.id, proof, notes)
    );
  }

  if (bountyChannelId && updatedBounty.bountyMessageId) {
    const bountyChannel = await client.channels.fetch(bountyChannelId);

    const bountyMessage = await bountyChannel.messages.fetch(
      updatedBounty.bountyMessageId
    );

    await bountyMessage.edit(renderActiveBounty(updatedBounty));
  }

  await interaction.reply({
    content: "✅ Kill proof submitted. Rin has updated the contract.",
    ephemeral: true,
  });
}
}

module.exports = {
  handleBountyButton,
  handleBountyModal,
};
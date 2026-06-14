const fs = require("fs");
const path = require("path");

const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

const { getConfig } = require("../config/configStore");
const { updateLadderMessage } = require("../ladder/ladderRenderer");

const ladderPath = path.join(__dirname, "../../data/ladder.json");

function getLadder() {
  if (!fs.existsSync(ladderPath)) return [];
  return JSON.parse(fs.readFileSync(ladderPath, "utf8"));
}

function saveLadder(ladder) {
  fs.writeFileSync(ladderPath, JSON.stringify(ladder, null, 2));
}

async function handleRegisterButton(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("rin_register_modal")
    .setTitle("Enter the Yogai Ladder");

const ninjaNameInput = new TextInputBuilder()
  .setCustomId("ninja_name")
  .setLabel("Character name")
  .setPlaceholder("The name of your character in the Yogai guild.")
  .setStyle(TextInputStyle.Short)
  .setRequired(true)
  .setMaxLength(32);

  modal.addComponents(
    new ActionRowBuilder().addComponents(ninjaNameInput)
  );

  await interaction.showModal(modal);
}

async function handleRegisterModal(interaction, client) {
  const config = getConfig();

  if (!config.yogaiRoleId) {
    return interaction.reply({
      content: "❌ The Yogai role has not been configured yet.",
      ephemeral: true,
    });
  }

  const ninjaName = interaction.fields.getTextInputValue("ninja_name");
  const member = interaction.member;

  await member.roles.add(config.yogaiRoleId);

  const ladder = getLadder();

  const existingPlayer = ladder.find(
    player => player.userId === interaction.user.id
  );

  if (existingPlayer) {
    return interaction.reply({
      content: "𓄧 You are already registered on the Yogai ladder.",
      ephemeral: true,
    });
  }

  ladder.push({
    userId: interaction.user.id,
    username: interaction.user.username,
    ninjaName,
    wins: 0,
    losses: 0,
    joinedAt: new Date().toISOString(),
  });

  saveLadder(ladder);
  await updateLadderMessage(client);

  await interaction.reply({
    content: `𓄧 Welcome to the Yogai ladder, **${ninjaName}**. You have been added at rank #${ladder.length}.`,
    ephemeral: true,
  });
}

module.exports = {
  handleRegisterButton,
  handleRegisterModal,
};
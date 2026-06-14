const fs = require("fs");
const path = require("path");

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const ladderPath = path.join(__dirname, "../../data/ladder.json");

function getLadder() {
  if (!fs.existsSync(ladderPath)) return [];
  return JSON.parse(fs.readFileSync(ladderPath, "utf8"));
}

function buildLadderEmbed(imageUrl = null) {
  const ladder = getLadder();

  const description = ladder.length
    ? ladder
        .map((player, index) => {
          return `**#${index + 1}** ${player.ninjaName} \`(${player.wins}-${player.losses})\``;
        })
        .join("\n")
    : "_No challengers have entered the ladder yet._";

  const embed = new EmbedBuilder()
    .setTitle("𖣘 RANK LEDGER")
    .setDescription(description)
    .setColor(0xe91e63)
    .setFooter({
      text: "Forfeits may be submitted after 48 hours of no response or availability.",
    });

  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  return embed;
}

function buildLadderButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("rin_ladder_challenge")
      .setLabel("Challenge")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("rin_ladder_submit")
      .setLabel("Submit Result")
      .setStyle(ButtonStyle.Secondary)
  );
}

async function updateLadderMessage(client) {
  const { getConfig } = require("../config/configStore");
  const config = getConfig();

  if (!config.ladderChannelId || !config.ladderMessageId) return;

  const channel = await client.channels.fetch(config.ladderChannelId);
  if (!channel) return;

  const message = await channel.messages.fetch(config.ladderMessageId);
  if (!message) return;

  await message.edit({
    embeds: [buildLadderEmbed(config.ladderImageUrl)],
    components: [buildLadderButtons()],
  });
}

module.exports = {
  getLadder,
  buildLadderEmbed,
  buildLadderButtons,
  updateLadderMessage,
};
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const { getConfig, saveConfig } = require("../config/configStore");

const {
  buildLadderEmbed,
  buildLadderButtons,
} = require("../ladder/ladderRenderer");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ladderpost")
    .setDescription("Post Rin's Yogai challenge ladder.")
    .addStringOption(option =>
      option
        .setName("image")
        .setDescription("Optional image or GIF URL")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const imageUrl = interaction.options.getString("image");

    const message = await interaction.channel.send({
    embeds: [buildLadderEmbed(imageUrl)],
    components: [buildLadderButtons()],
    });

    const config = getConfig();
    config.ladderChannelId = interaction.channel.id;
    config.ladderMessageId = message.id;
    config.ladderImageUrl = imageUrl || null;
    saveConfig(config);

    await interaction.reply({
    content: "𓄧 Rank Ledger posted and saved.",
    ephemeral: true,
    });
  },
};
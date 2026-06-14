const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const {
  getConfig,
  saveConfig,
} = require("../config/configStore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("updatedonatelink")
    .setDescription("Update Rin's donation button link.")
    .addStringOption(option =>
      option
        .setName("url")
        .setDescription("Your Ko-fi or donation URL.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const url = interaction.options.getString("url");

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return interaction.reply({
        content: "❌ Please enter a valid URL starting with `http://` or `https://`.",
        ephemeral: true,
      });
    }

    const config = getConfig();
    config.donateLink = url;
    saveConfig(config);

    await interaction.reply({
      content: `🏮 Donation link updated:\n${url}`,
      ephemeral: true,
    });
  },
};
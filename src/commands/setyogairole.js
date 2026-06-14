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
    .setName("setyogairole")
    .setDescription("Set the role required to use Rin's ladder.")
    .addRoleOption(option =>
      option
        .setName("role")
        .setDescription("The Yogai member role.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const role = interaction.options.getRole("role");

    const config = getConfig();

    config.yogaiRoleId = role.id;

    saveConfig(config);

    await interaction.reply({
      content: `🏮 Yogai role set to ${role}.`,
      ephemeral: true,
    });
  },
};
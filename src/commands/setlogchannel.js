const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");

const {
  getConfig,
  saveConfig,
} = require("../config/configStore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setlogchannel")
    .setDescription("Set the channel where Rin announces ladder activity.")
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("The announcement channel.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");

    const config = getConfig();
    config.logChannelId = channel.id;
    saveConfig(config);

    await interaction.reply({
      content: `🏮 Rin will announce ladder activity in ${channel}.`,
      ephemeral: true,
    });
  },
};
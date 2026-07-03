const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");

const configStore = require("../config/configStore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setbountychannel")
    .setDescription("Set the channel where Rin posts approved bounties.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("The public bounty board channel.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");

    const config = configStore.getConfig();
    config.bountyChannelId = channel.id;
    configStore.saveConfig(config);

    await interaction.reply({
      content: `✅ Rin's bounty channel is now ${channel}.`,
      ephemeral: true,
    });
  },
};
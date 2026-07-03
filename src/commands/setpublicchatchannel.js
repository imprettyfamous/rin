const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");

const configStore = require("../config/configStore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setpublicchatchannel")
    .setDescription("Set the public channel where Rin posts bounty turn-ins.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("The public chat/log channel.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");

    const config = configStore.getConfig();
    config.publicChatChannelId = channel.id;
    configStore.saveConfig(config);

    await interaction.reply({
      content: `✅ Rin's public bounty turn-in channel is now ${channel}.`,
      ephemeral: true,
    });
  },
};
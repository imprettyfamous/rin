const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");

const configStore = require("../config/configStore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setmodchannel")
    .setDescription("Set the channel where Rin sends bounty requests for approval.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("The mod approval channel.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");

    const config = configStore.getConfig();
    config.modChannelId = channel.id;
    configStore.saveConfig(config);

    await interaction.reply({
      content: `✅ Rin's mod approval channel is now ${channel}.`,
      ephemeral: true,
    });
  },
};
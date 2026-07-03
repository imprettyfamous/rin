const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const { renderBountyBoard } = require("../bounty/bountyRenderer");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("postbountyboard")
    .setDescription("Post Rin's bounty board.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.channel.send(renderBountyBoard());

    await interaction.reply({
      content: "✅ Bounty board posted.",
      ephemeral: true,
    });
  },
};
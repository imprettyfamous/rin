const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const { getConfig } = require("../config/configStore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("registrationpost")
    .setDescription("Post Rin's Yogai ladder registration panel.")
    .addStringOption(option =>
      option
        .setName("image")
        .setDescription("Optional image or GIF URL")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const imageUrl = interaction.options.getString("image");
    const config = getConfig();

    const embed = new EmbedBuilder()
      .setTitle("⊙ GUILD CONFIRMATION")
      .setDescription(
        [
          "- Confirm you're a Yogai guild member to enter Rin's PvP ladder.",
          "",
          "- Once registered, you will be added to the bottom of the Rank Ledger.",
        ].join("\n")
      )
      .setColor(0xe91e63);

    if (imageUrl) embed.setImage(imageUrl);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rin_register_signin")
        .setLabel("Sign In")
        .setStyle(ButtonStyle.Primary)
    );

    if (config.donateLink) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel("Support")
          .setStyle(ButtonStyle.Link)
          .setURL(config.donateLink)
      );
    }

    await interaction.channel.send({
      embeds: [embed],
      components: [row],
    });

    await interaction.reply({
      content: "🏮 Registration post created.",
      ephemeral: true,
    });
  },
};
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("post")
    .setDescription("Create a custom Rin embed.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("Where to post the embed.")
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName("title")
        .setDescription("Embed title.")
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName("body")
        .setDescription(
          "Embed body. Use | for line breaks."
        )
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName("image")
        .setDescription(
          "Optional image or GIF URL."
        )
        .setRequired(false)
    )

    .addStringOption(option =>
      option
        .setName("footer")
        .setDescription(
          "Optional footer text."
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has(
        PermissionFlagsBits.Administrator
      )
    ) {
      return interaction.reply({
        content: "❌ Administrator only.",
        ephemeral: true,
      });
    }

    const channel =
      interaction.options.getChannel("channel");

    const title =
      interaction.options.getString("title");

    const body =
      interaction.options
        .getString("body")
        .replace(/\|/g, "\n");

    const imageUrl =
      interaction.options.getString("image");

    const footer =
      interaction.options.getString("footer");

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(body)
      .setColor(0xe91e63);

    if (imageUrl) {
      embed.setImage(imageUrl);
    }

    if (footer) {
      embed.setFooter({
        text: footer,
      });
    }

    await channel.send({
      embeds: [embed],
    });

    await interaction.reply({
      content: "🏮 Post created.",
      ephemeral: true,
    });
  },
};
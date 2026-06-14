const { PermissionFlagsBits } = require("discord.js");

const MODERATOR_ROLE_ID = "1514818081321652244";

function isRinModerator(interaction) {
  return (
    interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
    interaction.member.roles.cache.has(MODERATOR_ROLE_ID)
  );
}

module.exports = {
  MODERATOR_ROLE_ID,
  isRinModerator,
};
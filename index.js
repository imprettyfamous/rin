require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Collection,
} = require("discord.js");

const {
  handleRegisterButton,
  handleRegisterModal,
} = require("./src/registration/registrationActions");

const {
  handleChallengeButton,
  handleChallengeSelect,
} = require("./src/ladder/challengeActions");

const {
  handleSubmitButton,
  handleSubmitChallengeSelect,
  handleSubmitOutcomeSelect,
} = require("./src/ladder/resultActions");

const {
  handleBountyButton,
  handleBountyModal,
} = require("./src/bounty/bountyActions");

// Command imports
const pingCommand = require("./src/commands/ping");
const setYogaiRoleCommand = require("./src/commands/setyogairole");
const setLogChannelCommand = require("./src/commands/setlogchannel");
const registrationPostCommand = require("./src/commands/registrationpost");
const updateDonateLinkCommand = require("./src/commands/updatedonatelink");
const ladderPostCommand = require("./src/commands/ladderpost");
const activeChallengesCommand = require("./src/commands/activechallenges");
const setRecordCommand = require("./src/commands/setrecord");
const forceRankCommand = require("./src/commands/forcerank");
const removePlayerCommand = require("./src/commands/removeplayer");
const exportLedgerCommand = require("./src/commands/exportledger");
const postCommand = require("./src/commands/post");
const setModChannelCommand = require("./src/commands/setmodchannel");
const setBountyChannelCommand = require("./src/commands/setbountychannel");
const postBountyBoardCommand = require("./src/commands/postbountyboard");
const setPublicChatChannelCommand = require("./src/commands/setpublicchatchannel");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

const commands = [
  pingCommand,
  setYogaiRoleCommand,
  setLogChannelCommand,
  registrationPostCommand,
  updateDonateLinkCommand,
  ladderPostCommand,
  activeChallengesCommand,
  setRecordCommand,
  forceRankCommand,
  removePlayerCommand,
  exportLedgerCommand,
  postCommand,
  setModChannelCommand,
  setBountyChannelCommand,
  postBountyBoardCommand,
  setPublicChatChannelCommand,
];

for (const command of commands) {
  if (!command || !command.data) {
    console.log("Broken command import:", command);
    continue;
  }

  client.commands.set(command.data.name, command);
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await client.application.commands.set(
    commands
      .filter(command => command && command.data)
      .map(command => command.data.toJSON())
  );

  console.log("Commands registered.");
});

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === "rin_register_signin") {
        await handleRegisterButton(interaction);
        return;
      }

      if (interaction.customId === "rin_ladder_challenge") {
        await handleChallengeButton(interaction);
        return;
      }

      if (interaction.customId === "rin_ladder_submit") {
        await handleSubmitButton(interaction);
        return;
      }

      if (interaction.customId.startsWith("rin_bounty_")) {
        await handleBountyButton(interaction, client);
        return;
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "rin_challenge_select") {
        await handleChallengeSelect(interaction, client);
        return;
      }

      if (interaction.customId === "rin_submit_challenge_select") {
        await handleSubmitChallengeSelect(interaction);
        return;
      }

      if (interaction.customId.startsWith("rin_submit_outcome_select:")) {
        await handleSubmitOutcomeSelect(interaction, client);
        return;
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === "rin_register_modal") {
        await handleRegisterModal(interaction, client);
        return;
      }

      if (interaction.customId.startsWith("rin_bounty_")) {
        await handleBountyModal(interaction, client);
        return;
      }
    }
  } catch (error) {
    console.error(error);

    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: "❌ Rin ran into an error.",
        });
      } else if (interaction.replied) {
        await interaction.followUp({
          content: "❌ Rin ran into an error.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "❌ Rin ran into an error.",
          ephemeral: true,
        });
      }
    } catch (replyError) {
      console.error("Could not send error response:", replyError);
    }
  }
});

client.on("error", error => {
  console.error("Discord client error:", error);
});

process.on("unhandledRejection", error => {
  console.error("Unhandled promise rejection:", error);
});

client.login(process.env.DISCORD_TOKEN);
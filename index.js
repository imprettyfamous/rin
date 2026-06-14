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

//command imports
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


const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

//command clients
client.commands.set(
  pingCommand.data.name,
  pingCommand
);
client.commands.set(
  setYogaiRoleCommand.data.name,
  setYogaiRoleCommand
);
client.commands.set(
  setLogChannelCommand.data.name,
  setLogChannelCommand
);
client.commands.set(
  registrationPostCommand.data.name,
  registrationPostCommand
);
client.commands.set(
  updateDonateLinkCommand.data.name,
  updateDonateLinkCommand
);
client.commands.set(
  ladderPostCommand.data.name,
  ladderPostCommand
);
client.commands.set(
  activeChallengesCommand.data.name,
  activeChallengesCommand
);
client.commands.set(
  setRecordCommand.data.name,
  setRecordCommand
);
client.commands.set(
  forceRankCommand.data.name,
  forceRankCommand
);
client.commands.set(
  removePlayerCommand.data.name,
  removePlayerCommand
);
client.commands.set(
  exportLedgerCommand.data.name,
  exportLedgerCommand
);
client.commands.set(
  postCommand.data.name,
  postCommand
);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

//command registration
await client.application.commands.set([
  pingCommand.data.toJSON(),
  setYogaiRoleCommand.data.toJSON(),
  setLogChannelCommand.data.toJSON(),
  registrationPostCommand.data.toJSON(),
  updateDonateLinkCommand.data.toJSON(),
  ladderPostCommand.data.toJSON(),
  activeChallengesCommand.data.toJSON(),
  setRecordCommand.data.toJSON(),
  forceRankCommand.data.toJSON(),
  removePlayerCommand.data.toJSON(),
  exportLedgerCommand.data.toJSON(),
  postCommand.data.toJSON(),
]);

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
    }
  } catch (error) {
    console.error(error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Rin ran into an error.",
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
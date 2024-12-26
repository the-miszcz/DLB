require('dotenv').config();
const axios = require('axios').default;

const applicationId = process.env.APP_ID;
const guildId = process.env.GUILD_ID;
const botToken = process.env.BOT_TOKEN;

// const url = `https://discord.com/api/v10/applications/${applicationId}/commands`; // GLOBAL COMMANDS / Update the API version if needed
const url = `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`; // GUILDS COMMANDS / Update the API version if needed

const headers = {
  "Authorization": `Bot ${botToken}`,
  "Content-Type": "application/json",
};

// Define an array of command data objects
const commands = [
  {
    "name": "display_leaderboard", // hello command
    "type": 1,
    "description": "Diplay current leaderboard.",
    "options": [
      {
        "name": "leaderboard",
        "description": "Leaderboard name.",
        "type": 3, // User option type
        "required": true
      }
    ]
  },
  {
    "name": "create_leaderboard", // hello command
    "type": 1,
    "description": "Create new leaderboard.",
    "options": [
      {
        "name": "leaderboard",
        "description": "Leaderboard name.",
        "type": 3, // User option type
        "required": true
      },
      {
        "name": "description",
        "description": "Board description.",
        "type": 3, // User option type
        "required": true
      }
    ]
  },
  {
    "name": "delete_leaderboard", // hello command
    "type": 1,
    "description": "Delete leaderboard.",
    "options": [
      {
        "name": "leaderboard",
        "description": "Leaderboard name.",
        "type": 3, // User option type
        "required": true
      }
    ]
  },
  {
    "name": "add_entry", // hello command
    "type": 1,
    "description": "Add new entry to the leaderboard.",
    "options": [
      {
        "name": "leaderboard",
        "description": "Leaderboard name.",
        "type": 3, // User option type
        "required": true
      },
      {
        "name": "time",
        "description": "Your time (in a format MIN:SEC.MILISEC, eg: 1:23.456).",
        "type": 3, // String option type
        "required": true
      },
      {
        "name": "user",
        "description": "The user for whom the time is added.",
        "type": 6, // User option type
        "required": false
      },
    ]
  },
  {
    "name": "remove_entry", // hello command
    "type": 1,
    "description": "Remove entry from the leaderboard.",
    "options": [
      {
        "name": "leaderboard",
        "description": "Leaderboard name.",
        "type": 3, // User option type
        "required": true
      },
      {
        "name": "user",
        "description": "The user for which you wish to remove the time.",
        "type": 6, // User option type
        "required": true
      },
    ]
  },
];

// Loop through the commands array and register each command
commands.forEach((commandData) => {
  axios.post(url, JSON.stringify(commandData), {
    headers: headers,
  })
  .then((response) => {
    console.log(`Command "${commandData.name}" has been registered.`);
  })
  .catch((error) => {
    console.error(`Error registering the command "${commandData.name}": ${error}`);
  });
});


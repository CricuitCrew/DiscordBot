const Discord = require("discord.js");
const client = new Discord.Client(
    {intents:["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "MESSAGE_CONTENT", "GUILD_SCHEDULED_EVENTS"]}
);

client.login(process.env.token)




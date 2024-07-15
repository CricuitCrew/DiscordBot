const Discord = require("discord.js");
const client = new Discord.Client(
    {intents:["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "MESSAGE_CONTENT", "GUILD_SCHEDULED_EVENTS"]}
);

client.login("MTI2MjE3MjQwNzMyNjU3Njc3MQ.GugpcO.fGMOAXPXFde888uVer-4YpjRD1gQsYAS7GtfN8")



var canale = client.channels.cache.get("1262171803858636990");




client.on("ready", () => {
    console.log("Bot Online")
});

client.on("messageCreate", (message) => {
    if(message.content == "!comando") {
        message.channel.send("Risposta")
    }
    if(message.content == "!NuovoComando"){
        var nome = new Discord.MessageEmbed()
            .setColor("ff0000")
            .setTitle("Titolo")
            .setURL("http://...")
            .setAuthor("Autore", "http://")
            .setDescription(`${message.author.username} ha scritto il messaggio`) //le virgolette si fanno con ALt+9+6
            .setThumbnail("http://...")

            .addField("Titolo1", "Contenuto1", true)
            .addField("Titolo2", "Contenuto2", true)
            .addField("Titolo3", "Contenuto3", true)

            .setImage("http://...")
            .setFooter("testo")
            .setTimestamp()

        message.channel.send({ embeds: [nome]})

    }
});

client.on("", () => {

});


client.on("messageCreate", (message) => {
  

    }
);

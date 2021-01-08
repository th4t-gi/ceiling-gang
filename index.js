const Discord = require("discord.js");
const client = new Discord.Client();
require('dotenv').config();
const config = require("./config.json");


client.on("ready", () => {
  console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
  client.user.setActivity(`Serving ${client.guilds.cache.size} servers`);
});

client.on("message", async message => {
  if (message.author.bot || 
    !message.content.startsWith(config.prefix) || 
    message.channel.id != process.env.CHANNELID) {
      return;
    }

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const sayMessage = args.join(' ');

  if (command === "ping") {
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
  }
  else if (command === "say") {
    message.delete().catch(O_o => { });
    message.channel.send(sayMessage);
  }

})

client.login(process.env.TOKEN);
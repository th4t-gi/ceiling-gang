const Discord = require("discord.js");
const emoji = require('node-emoji')
const request = require('request')
const fs = require('fs')
const client = new Discord.Client();

const CONTRIBUTIONS_PATH = "./contributions/"
const DRAFTS_PATH = "./drafts/"
const BOT_TEST = '755455514925596682'
const CEILING_GANG = '796798254619688991'
const USERID = '530987809180483584'
require('dotenv').config();

client.on("ready", () => {
  console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
  client.user.setActivity(`Principle of this server`);
});

client.on("message", async message => {
  const bot_test_channel = message.guild.channels.cache.find(v => v.id === BOT_TEST.toString())

  //Channel that the bot is working in               \/
  if (message.author.bot || message.channel.id != BOT_TEST) return

  const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const sayMessage = args.join(' ');

  if (command === "ping") {
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
  }
  else if (command === "say") {
    message.delete().catch(O_o => { });
    console.log(sayMessage);
    message.channel.send(sayMessage);
  }

  //if an image is sent in t
  if (message.attachments.array().length) {
    message.channel.send("Hey! There's a ceiling here! Awaiting download..")
    message.awaitReactions(filter, { max: 1, time: 24*60*60*1000, errors: ['time'] }).then(collected => {
      const reaction = collected.first();
      message.react('✅')
      //download location depending on user reaction
      if (reaction.emoji.name === '👍') {
        download(message, CONTRIBUTIONS_PATH, 'contributions')
      } else if (reaction.emoji.name === '❓') {
        download(message, DRAFTS_PATH, 'drafts')
      } 
    })
    .catch(e => {
      //if the error is a timeout
      if (e instanceof Discord.Collection) {
        message.channel.send(`${message.url} has timed out`)
      }
      console.log(e);
    });
  }
})

const download = (message, dir, folder) => {
  const att = message.attachments.first()
  const bot_test_channel = message.guild.channels.cache.get(BOT_TEST)

  //cannot download image
  const ext = att.url.match(/\.(jpeg|jpg|gif|png|webp)$/)
  if (!ext.length) {
    message.channel.send(`URL is not an image, logging to <#${BOT_TEST}>`)
    bot_test_channel.channel.send(`ATTATCHMENT: \`\`\`${att}\`\`\``);
    return
  }

  console.log('downoading');
  const count = fs.readdirSync(dir).length+1
  downloadImage(att.url, dir+'contrib'+count+'-'+message.author.username+ext[0]).then(path => {
    message.channel.send(`Ceiling has been downloaded to \`${folder}\` folder!`)
  }).catch(e => {
    message.channel.send(`Uh Oh! Something went wrong. Logging to <#${BOT_TEST}>`)
    bot_test_channel.send(`ERROR: \`\`\`${e}\`\`\``);
  })
}

const filter = (reaction, user) => {
  console.log(reaction.emoji.name);
  //USER THAT THE BOT RESPONDS TO                                \/
  return ['👍', '❓'].includes(reaction.emoji.name) && user.id == USERID;
};

async function downloadImage(uri, filename) {
  return new Promise((resolve, reject) => {
    request.head(uri, (err, res, body) => {
      request(uri).pipe(fs.createWriteStream(filename)).on('close', () => resolve(filename));
    }).on('error', reject);
  })
};

client.login(process.env.TOKEN);
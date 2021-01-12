const Discord = require("discord.js");
const request = require('request')
const fs = require('fs')

const config = require('./config.json')
const client = new Discord.Client();

const BOT_TEST_CHANNEL = "755455514925596682"
require('dotenv').config();
let test_channel;

client.on("ready", () => {
  console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
  client.user.setActivity(`Collecting ceilings`);
});

client.on("message", async message => {
  test_channel = message.guild.channels.cache.find(v => v.id === BOT_TEST_CHANNEL)

  //Channel that the bot is working in               \/
  if (message.author.bot || message.channel.id != config.channel) return

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
      //download location depending on user reaction
      if (reaction.emoji.name === '👍') {
        download(message, config.contrib_path, 'contributions')
      } else if (reaction.emoji.name === '❓') {
        download(message, config.draft_path, 'drafts')
      } 
    })
    .catch(e => {
      //if the error is a timeout
      if (e instanceof Discord.Collection) {
        message.channel.send(`${message.url} has timed out`)
      }
      console.log("Error while waiting for a reaction:", e);
      message.channel.send(`Uh Oh! Something went wrong. Logging to <#${BOT_TEST_CHANNEL}>`)
      test_channel.send(`ERROR: \`\`\`${e}\`\`\``);
    });
  }
})

const download = (message, dir, folder) => {
  const att = message.attachments.first()

  //cannot download image
  const ext = att.url.match(/\.(jpeg|jpg|gif|png|webp)$/i)
  if (!ext.length) {
    message.channel.send(`URL is not an image, logging to <#${BOT_TEST_CHANNEL}>`)
    test_channel.channel.send(`ATTATCHMENT: \`\`\`${JSON.stringify(att)}\`\`\``);
    return
  }

  console.log('downoading');
  const count = fs.readdirSync(config.contrib_path).length + fs.readdirSync(config.draft_path).length +1
  downloadImage(att.url, dir+'contrib'+count+'-'+message.author.username+ext[0]).then(path => {
    // message.channel.send(`Ceiling has been downloaded to \`${folder}\` folder!`)
    message.react('✅')

  }).catch(e => {
    message.channel.send(`Uh Oh! Something went wrong. Logging to <#${BOT_TEST_CHANNEL}>`)
    test_channel.send(`ERROR: \`\`\`${JSON.stringify(e)}\`\`\``);
  })
}

const filter = (reaction, user) => {
  console.log(reaction.emoji.name);
  //USER THAT THE BOT RESPONDS TO                                \/
  return ['👍', '❓'].includes(reaction.emoji.name) && user.id == config.user;
};

async function downloadImage(uri, filename) {
  return new Promise((resolve, reject) => {
    request.head(uri, (err, res, body) => {
      request(uri).pipe(fs.createWriteStream(filename)).on('close', () => resolve(filename));
    }).on('error', reject);
  })
};

client.login(process.env.TOKEN);


//bot-test: 755455514925596682
//ceiling-gang: 796798254619688991
//Josh ID: 571423688683945984
//Judd ID: 530987809180483584

import { Client, Collection } from "discord.js";
import request from 'request';
import * as fs from 'fs';
import { promisify } from "util";
import im from "imagemagick"
import dotenv from 'dotenv'
import getSize from "get-folder-size";

import config from './config.js';
const client = new Client();

const BOT_TEST_CHANNEL = "755455514925596682"
dotenv.config();
let test_channel;

let getDirSize = promisify(getSize)

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
      if (e instanceof Collection) {
        message.channel.send(`${message.url} has timed out`)
      }
      console.log("Error while waiting for a reaction:", e);
      message.channel.send(`Uh Oh! Something went wrong (awaitReactions). Logging to <#${BOT_TEST_CHANNEL}>`)
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
  downloadImage(att.url, dir+'Contrib '+count+' - '+message.author.username+ext[0]).then(async path => {
    // message.channel.send(`Ceiling has been downloaded to \`${folder}\` folder!`)
    message.react('✅')

    let size = (await getDirSize(config.contrib_path) + await getDirSize(config.draft_path))/ 1000000
    size = size.toFixed(2)
    let int = getRandomInt(0, 5)
    console.log(int);
    if (!int) {
      message.channel.send(`Thanks ${message.author.username}! We're now at ${size}MB with ${count} ceilings!`)
    }
  }).catch(e => {
    message.channel.send(`Uh Oh! Something went wrong (downloadImage). Logging to <#${BOT_TEST_CHANNEL}>`)
    test_channel.send(`ERROR: \`\`\`${e}\`\`\``);
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

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}



client.login(process.env.TOKEN);
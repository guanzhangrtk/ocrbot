// OCRbot version 0.1 (C)opyright 2021 GuanZhang

var Discord = require('discord.js');

const ocrAPI = "ocr.space";
const ocrSpaceApi = require('ocr-space-api');

let botname = "OCRbot";
let presence = "OCR: " + ocrAPI;
let msg = "";

var token;
// If auth.json is not found, we are probably deploying via ZEIT Now
try {
  var auth = require("./auth.json");
  token = auth.token;
} catch (err) {
  token = process.env.BOT_TOKEN;
}

// Load OCR options
try {
  var options = require("./ocr.json");
} catch (err) {
}

// Needed for ZEIT Now deployments
require('http').createServer().listen(3000)

// Send msg to the channel
function sendDaMessage(channelID, msg, embed) {
  const channel = bot.channels.cache.get(channelID);
  channel.send(msg);
}

// Parse the image attached to the message
async function parseImage(msg) {
 let url = msg.attachments.array()[0].url;

 console.log("Processing image [%s]: %s", options.language, url);
 ocrSpaceApi.parseImageFromUrl(url, options)
   .then(function (parsedResult) {
     try {
       let txt = parsedResult.parsedText;
       if (txt == '') {
         txt = 'Image not recognized';
       }
       sendDaMessage(msg.channel.id, txt);
     } catch (e) {
     }
     console.log('ocrParsedResult: \n', parsedResult.ocrParsedResult);
   }).catch(function (err) {
     console.log('ocrParsedResult: \n', parsedResult.ocrParsedResult);
 });
}

// Check to see attachment is an image by looking at extension
function isImage(attachment) {
  let imageExts = ["png", "jpg", "jpeg"]; 
  let url = attachment.url;

  for (const ext of imageExts) {
    if (url.indexOf(ext, url.length - ext.length) !== -1) return true;
  }

  return false;
}

// Init OCRbot
console.log("Initializing " + botname);
// Enable partial structures for MESSAGE and REACTION to get reaction events on uncached messages
const bot = new Discord.Client({ partials: ['MESSAGE', 'REACTION'] });
bot.login(auth.token);

bot.once('ready', function (evt) {
  console.log(botname + " [" + bot.username + "] id: " + bot.id + " ready");

  bot.user.setPresence({
    activity: { name: presence }
  })
})

// Check if message contains image
bot.on('message', message => {
  if (message.attachments.size <= 0) return;

  if (message.attachments.every(isImage)) {
  }
});

bot.on('messageReactionAdd', async (reaction, user) => {
  //console.log("ReactionADD: ", reaction);
  let lang = "";


  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
    }
  }

  switch(reaction.emoji.name) {
    // Transcribe Japanese
    case '🇯🇵':
      lang = "jpn";
    break;

    // Transcribe Traditional Chinese
    case '🇭🇰':
      lang = "cht";
    break;
   
    // Transcribe Simplified Chinese
    case '🇨🇳':
      lang = "chs";
    break;
  }

  if (lang != "") {
    options.language = lang;
    if (reaction.message.attachments.size <= 0) return;

    if (reaction.message.attachments.every(isImage)) {
      parseImage(reaction.message);
    }
  }  
});

// Re-connect on disconnection with 6 seconds delay
bot.on("disconnect", () => setTimeout(() => bot.connect(), 6000));

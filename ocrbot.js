// OCRbot version 0.1 (C)opyright 2021 GuanZhang

var Discord = require('discord.io');

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
  bot.sendMessage({
    to: channelID,
    message: msg,
    embed: embed
  })
}

// Parse the image attached to the message
function parseImage(msg) {
 let url = msg.attachments[0].url;
 console.log("Processing image: %s", url);
 ocrSpaceApi.parseImageFromUrl(url, options)
   .then(function (parsedResult) {
     sendDaMessage(reaction.d.channel_id, parsedResult.parsedText);
     console.log('ocrParsedResult: \n', parsedResult.ocrParsedResult);
   }).catch(function (err) {
     console.log('ocrParsedResult: \n', parsedResult.ocrParsedResult);
 });
}

// Init OCRbot
console.log("Initializing " + botname);
var bot = new Discord.Client({
  token: token,
  autorun: true
});

bot.on('ready', function (evt) {
  console.log(botname + " [" + bot.username + "] id: " + bot.id + " ready");
});

// Set Discord presence
bot.setPresence({
  game:{ name: presence }
});

bot.on('messageReactionAdd', function (reaction, userID) {
//  console.log("ReactionADD: ", reaction);
//  console.log(reaction + userID);

  switch(reaction.d.emoji.name) {
    // Transcribe Japanese
    case '🇯🇵':
      bot.getMessage({
        channelID: reaction.d.channel_id,
        messageID: reaction.d.message_id,
        userID: reaction.d.user_id
      }, function (err, msg) {
         var url = msg.attachments[0].url;
         console.log("Processing image: %s", url);
         ocrSpaceApi.parseImageFromUrl(url, options)
           .then(function (parsedResult) {
             sendDaMessage(reaction.d.channel_id, parsedResult.parsedText);
             console.log('ocrParsedResult: \n', parsedResult.ocrParsedResult);
           }).catch(function (err) {
             console.log('ocrParsedResult: \n', parsedResult.ocrParsedResult);
         });
    })
    break;

    // Transcribe Traditional Chinese
    case '🇭🇰':
    break;

    // Transcribe Simplified Chinese
    case '🇨🇳':
    break;
  }
});

// Re-connect on disconnection with 6 seconds delay
bot.on("disconnect", () => setTimeout(() => bot.connect(), 6000));

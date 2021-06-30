// OCRbot version 0.1 (C)opyright 2021 GuanZhang

var Discord = require('discord.js');
const ocrSpaceApi = require('ocr-space-api');
const stream = require('stream');
const request = require('request');
const {google} = require('googleapis');
// View and manage Google Drive files and folders created by the bot
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = './gdrive.json';

let botname = "OCRbot";
let presence = "OCR";
let msg = "";

var token;
// If auth.json is not found, we are probably deploying via ZEIT Now
try {
  var auth = require("./auth.json");
  token = auth.token;
} catch (err) {
  token = process.env.BOT_TOKEN;
}

// Load OCRSpace options
try {
  var options = require("./ocrspace.json");
} catch (err) {
}

// Needed for ZEIT Now deployments
require('http').createServer().listen(3000)

// Send message to the channel
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
         txt = parsedResult.ErrorMessage;
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

function streamToString (stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

// Upload image to Google Drive using Drive API as a Google Doc then export Doc to plain text
async function googleOCR(msg) {
  const credentials= require('./google.json');
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  const token = require(TOKEN_PATH);
  oAuth2Client.setCredentials(token);

  const drive = google.drive({version: 'v3', auth: oAuth2Client});

  // Upload image to Google Drive
  let url = msg.attachments.array()[0].url;
  console.log("Uploading image %s to GDrive", url);
  const image = new stream.PassThrough();
  image.on("error", (err) => console.log(err));
  image.on("end", () => console.log("Done."));
  await request(url).pipe(image);

  const upload = await drive.files.create({
    requestBody: {
      name: botname + '.doc',
      mimeType: 'application/vnd.google-apps.document'
    },
    media: {
      mimeType: 'image/png',
      body: image
    }
  });

  // Export Google Doc to plain text (OCR)
  try {
    const dest = new stream.PassThrough();
    dest.on("error", (err) => console.log(err));
    dest.on("end", () => console.log("Done."));

    const res = await drive.files.export(
      {fileId: upload.data.id, mimeType: 'text/plain'},
      {responseType: 'stream'}
    );
    await new Promise((resolve, reject) => {
      res.data
        .on('error', reject)
        .pipe(dest)
        .on('error', reject)
        .on('finish', resolve);
    });
  
    let data = await streamToString(dest);
    // Strip first line since it always starts with a '---' divider
    data = data.substring(data.indexOf('\n')+1);
    sendDaMessage(msg.channel.id, data);

    // Delete file after done
    await drive.files.delete({fileId: upload.data.id});
  } catch (e) {
    console.log(e);
  }
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

    // Transcribe using Google Drive API
    case '🇬':
      lang = "google";
    break;
  }

  if (lang != "") {
    // Message has no attachment, nothing to do
    if (reaction.message.attachments.size <= 0) return;

    if (reaction.message.attachments.every(isImage)) {
      if (lang == "google") {
        googleOCR(reaction.message);
      } else {
        options.language = lang;
        parseImage(reaction.message);
      }
    }
  }  
});

// Re-connect on disconnection with 6 seconds delay
bot.on("disconnect", () => setTimeout(() => bot.connect(), 6000));

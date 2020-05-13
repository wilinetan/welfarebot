const TelegramBot = require('node-telegram-bot-api');
const ogs = require('open-graph-scraper');
const firebase = require('firebase');

const token = '1140161041:AAFcapOrmPbMdyEdLY9azOhB-Nt8LJoLyqU';
const bot = new TelegramBot(token, {polling: true});

bot.on('message', (msg) => {
    bot.sendMessage(msg.chat.id, 'Ill have the tuna. No crust.');
  });

const app = firebase.initializeApp({
    apiKey: "AIzaSyCLYVSnDM2G6vqu_CFtEFCgANKOTg1quDU",
    authDomain: "welfarebot-a92e0.firebaseapp.com",
    databaseURL: "https://welfarebot-a92e0.firebaseio.com",
    projectId: "welfarebot-a92e0",
    storageBucket: "welfarebot-a92e0.appspot.com",
    messagingSenderId: "8047391542",
});

const ref = firebase.database().ref();
const sitesRef = ref.child("sites");

let siteUrl;
bot.onText(/\/bookmark (.+)/, (msg, match) => {
  siteUrl = match[1];
  bot.sendMessage(msg.chat.id,'Got it, in which category?', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: 'Development',
          callback_data: 'development'
        },{
          text: 'Music',
          callback_data: 'music'
        },{
          text: 'Cute monkeys',
          callback_data: 'cute-monkeys'
        }
      ]]
    }
  });
});

bot.on("callback_query", (callbackQuery) => {
    const message = callbackQuery.message;
    ogs({'url': siteUrl}, function (error, results) {
      if(results.success) {
        sitesRef.push().set({
          name: results.data.ogSiteName,
          title: results.data.ogTitle,
          description: results.data.ogDescription,
          url: siteUrl,
          thumbnail: results.data.ogImage.url,
          category: callbackQuery.data
        });
        bot.sendMessage(message.chat.id,'Added \"' + results.data.ogTitle +'\" to category \"' + callbackQuery.data + '\"!')
  } else {
        sitesRef.push().set({
          url: siteUrl
        });
        bot.sendMessage(message.chat.id,'Added new website, but there was no OG data!');
      }
    });
  });

  

// const functions = require('firebase-functions');
// const Telegraf = require('telegraf');

// const bot = new Telegraf('1140161041:AAFcapOrmPbMdyEdLY9azOhB-Nt8LJoLyqU')
// bot.start((ctx) => ctx.reply('hello'))
// bot.help((ctx) => ctx.reply('Send me a sticker'))
// // bot.on('sticker', (ctx) => ctx.reply('👍'))
// bot.hears('hi', (ctx) => ctx.reply('Hey there'))

// bot.launch();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

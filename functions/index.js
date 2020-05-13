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
  
// bot.context.db = {
//     getScores: () => { return 42 }
// }

// bot.on('text', (ctx) => {
//     const scores = ctx.db.getScores(ctx.message.from.username)
//     return ctx.reply(`${ctx.message.from.username}: ${scores}`)
// })

// bot.launch();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// import * as functions from 'firebase-functions'
// import * as express from 'express'
// import * as cors from 'cors'

// // give us the possibility of manage request properly
// const app = express()

// // Automatically allow cross-origin requests
// app.use(cors({ origin: true }))

// // our single entry point for every message
// app.post('/', async (req, res) => {
//   /*
//     You can put the logic you want here
//     the message receive will be in this
//     https://core.telegram.org/bots/api#update
//   */
//   const isTelegramMessage = req.body
//                           && req.body.message
//                           && req.body.message.chat
//                           && req.body.message.chat.id
//                           && req.body.message.from
//                           && req.body.message.from.first_name

//   if (isTelegramMessage) {
//     const chat_id = req.body.message.chat.id
//     const { first_name } = req.body.message.from

//     return res.status(200).send({
//       method: 'sendMessage',
//       chat_id,
//       text: `Hello ${first_name}`
//     })
//   }

//   return res.status(200).send({ status: 'not a telegram message' })
// })
// // this is the only function it will be published in firebase
// export const router = functions.https.onRequest(app)

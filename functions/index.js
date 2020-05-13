const functions = require('firebase-functions');
const Telegraf = require('telegraf');

const bot = new Telegraf('1140161041:AAFcapOrmPbMdyEdLY9azOhB-Nt8LJoLyqU')
bot.start((ctx) => ctx.reply('hello'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.launch();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

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

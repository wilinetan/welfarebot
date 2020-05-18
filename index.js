const TelegramBot = require('node-telegram-bot-api');
// const ogs = require('open-graph-scraper');
const firebase = require('firebase');

const token = '1058971103:AAGRkzUyDeVEiCrpXkY6IpooTiCb0T7eLtU';
// const token = '1140161041:AAFcapOrmPbMdyEdLY9azOhB-Nt8LJoLyqU';
const bot = new TelegramBot(token, {polling: true});

const app = firebase.initializeApp({
  apiKey: "AIzaSyCLYVSnDM2G6vqu_CFtEFCgANKOTg1quDU",
  authDomain: "welfarebot-a92e0.firebaseapp.com",
  databaseURL: "https://welfarebot-a92e0.firebaseio.com",
  projectId: "welfarebot-a92e0",
  storageBucket: "welfarebot-a92e0.appspot.com",
  messagingSenderId: "8047391542",
});

const ref = firebase.database().ref();
const sitesRef = ref.child("14MeO__j9jCngVkWmjCB4H4HetHmfE15V8fJNnTVAaXQ");
const sheetRef = sitesRef.child("Sheet1");
const idRef = sitesRef.child("ids");

let currQueueNum = 1;

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Please input your matric number.");
  getMatricNumber(0);
});

// get matric number from user
function getMatricNumber(count) {
  function isLetter(str) {
    return str.length === 1 && str.match(/[a-z]/i);
  }

  bot.once('message', (msg) => {
    const reply = msg.text.toUpperCase();
    if (count == 5) {
      bot.sendMessage(msg.chat.id, "You have tried too many times. Please restart the bot.");
    } else if (reply.length != 9) {
      bot.sendMessage(msg.chat.id, "Invalid matric number entered. Please try again.");
      getMatricNumber(count + 1);
    } else if (!isLetter(reply.charAt(0)) || !isLetter(reply.charAt(0)) || 
        isNaN(parseInt(reply.substring(1,8), 10))) {
      bot.sendMessage(msg.chat.id, "Invalid matric number entered. Please try again.");
      getMatricNumber(count + 1);
    } else {
      // checks if matric number is in database and updates details otherwise prompts user again
      const id = msg.from.id;

      sheetRef.once('value', function(snapshot) {
        if (snapshot.hasChild(reply)) {
          idRef.once('value', function(snap) {

            if (snap.hasChild(id.toString())) {
              bot.sendMessage(id, "You have already been authenticated.");
            } else {
              updateDetails(id, reply);
            }
          });
        } else {
          bot.sendMessage(msg.chat.id, "Matric number is not recognised. Please try again.");
          getMatricNumber(count + 1);
        }
      });
    }
  });
}

function updateDetails(id, matric) {
  bot.sendMessage(id, "Please input your full name.")
    .then(() => {
      bot.once('message', (msg) => {
        const name = msg.text;
        bot.sendMessage(id, "You have been authenticated.");

        idRef.child(id).set({
          name: name,
          matric: matric,
          teleid: id,
          collected: false
        })
      });
    });
}

bot.onText(/\/queue/, (msg) => {
  console.log("currQueueNum", currQueueNum);
  console.log("id", msg.from.id);
  const id = msg.from.id;

  idRef.child(id).once('value', function(snapshot) {
    const userDetails = snapshot.val();
    // if (userDetails.queueNum != undefined) {
    //   bot.sendMessage(id, "You are already in the queue. Your current queue numeber is " + 
    //     userDetails.queueNum);
    // } else if (userDetails.nussu == undefined || userDetails.faculty == undefined) {
    //   bot.sendMessage(id, "You have not completed the necessary surveys and forms.");
    // } else {
      idRef.child(id).update({
        queueNum: currQueueNum++
      });
      // console.log("queunum", userDetails.queueNum);
      bot.sendMessage(id, "Your queue number is " + (currQueueNum - 1));
    // }
  });
});
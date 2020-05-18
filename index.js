const TelegramBot = require('node-telegram-bot-api');
// const ogs = require('open-graph-scraper');
const firebase = require('firebase');

// const token = '1058971103:AAGRkzUyDeVEiCrpXkY6IpooTiCb0T7eLtU';
const token = '1140161041:AAFcapOrmPbMdyEdLY9azOhB-Nt8LJoLyqU';
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



// Feature 1: Authentication
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Please input your matric number with the following ' + 
    'format: "/matric Axxxxxxxx".');
});

bot.onText(/\/matric/, (msg, reply) => {
  const mat = reply.input.split(" ")[1];
  const matric = mat.toUpperCase();
  console.log("matric", matric, typeof matric);
  getMatricNumber(0, matric, msg.chat.id);
});

function getMatricNumber(count, matric, id) {
  function isLetter(str) {
    return str.length === 1 && str.match(/[a-z]/i);
  }

  if (matric.length != 9) {
    bot.sendMessage(id, "Invalid matric number entered. Please try again.");
  } else if (!isLetter(matric.charAt(0)) || !isLetter(matric.charAt(0)) || 
      isNaN(parseInt(matric.substring(1,8), 10))) {
    bot.sendMessage(id, "Invalid matric number entered. Please try again.");
  } else {
    // checks if matric number is in database and updates details otherwise prompts user again
    sheetRef.once('value', function(snapshot) {
      if (snapshot.hasChild(matric)) {
        idRef.once('value', function(snap) {

          if (snap.hasChild(id.toString())) {
            bot.sendMessage(id, "You have already been authenticated.");
          } else {
            bot.sendMessage(id, "Please input your full name using the following format: " +
              "/name Bob Tan");
            idRef.child(id).set({
              matric: matric,
              teleid: id,
              collected: false
            })
            // updateDetails(id, reply);
          }
        });
      } else {
        bot.sendMessage(id, "Matric number is not recognised. Please try again.");
      }
    });
  }
}

bot.onText(/\/name/, (msg, reply) => {
  const id = msg.chat.id;
  const arr = reply.input.split(" ");
  arr.shift();
  const name = arr.join(" ");

  idRef.child(id).update({
    name: name
  });

  bot.sendMessage(id, "You have been authenticated");
});

// Feature 2: Submit survey
process.on('uncaughtException', function (error) {
  console.log("\x1b[31m", "Exception: ", error, "\x1b[0m");
});

process.on('unhandledRejection', function (error, p) {
  console.log("\x1b[31m","Error: ", error.message, "\x1b[0m");
});

var answerCallbacks = {};
bot.on('message', function (msg) {
  var callback = answerCallbacks[msg.chat.id];
  if (callback) {
    delete answerCallbacks[msg.chat.id];
    return callback(msg);
  }
});

bot.onText(/\/submitnussu/,function (msg) {
bot.sendMessage(msg.chat.id, "Send your NUSSU photo").then(function () {
  answerCallbacks[msg.chat.id] = async function (answer) {
    if (answer.photo && answer.photo[0]) {
      const personid = answer.from.id.toString()
      const file_id = answer.photo[0].file_id
      const fileinfo = await bot.getFile(file_id)
      const {file_path} = fileinfo
      const url = "https://api.telegram.org/file/bot" + "1140161041:AAFcapOrmPbMdyEdLY9azOhB-Nt8LJoLyqU" + "/" + file_path
      console.log(url)
      idRef.once('value', function(snapshot) {
        if (snapshot.hasChild(personid)) {
              idRef.child(personid).update({
                nussu:url
              })
      bot.sendMessage(answer.chat.id, "NUSSU Survey proof received!")
            }
          })
        }
      }
    })
  });

bot.onText(/\/submitfaculty/, function (msg) {
  bot.sendMessage(msg.chat.id, "Send your Faculty photo").then(function () {
    answerCallbacks[msg.chat.id] = async function (answer) {
      if (answer.photo && answer.photo[0]) {
        const personid = answer.from.id.toString()
        const file_id = answer.photo[0].file_id
        const fileinfo = await bot.getFile(file_id)
        const {file_path} = fileinfo
        console.log(file_id)
        console.log(fileinfo)
        console.log(file_path)
        const url = "https://api.telegram.org/file/bot" + "1140161041:AAFcapOrmPbMdyEdLY9azOhB-Nt8LJoLyqU" + "/" + file_path
        console.log(url)
        idRef.once('value', function(snapshot) {
          if (snapshot.hasChild(personid)) {
                idRef.child(personid).update({
                  faculty:url
                })
        bot.sendMessage(answer.chat.id, "Faculty Survey proof received!")}
              }
            )
          }}})});



// Feature 3: Queue
let currQueueNum = 0;
bot.onText(/\/queue/, (msg) => {
  console.log("currQueueNum", currQueueNum);
  console.log("id", msg.from.id);
  const id = msg.from.id;
  idRef.child(id).once('value', function(snapshot) {
    const userDetails = snapshot.val();
    if (userDetails.queueNum != undefined) {
      bot.sendMessage(id, "You are already in the queue. Your current queue numeber is " + 
        snapshot.val().queueNum);
    } 
    else if (userDetails.nussu == undefined || userDetails.faculty == undefined) {
      bot.sendMessage(id, "You have not completed the necessary surveys and forms.");
    } 
    else {
      currQueueNum = currQueueNum+1
      bot.sendMessage(id, "Your queue number is " + currQueueNum.toString() + ".");
      idRef.child(id).update({
        queueNum : currQueueNum
      });
    }
  })
});


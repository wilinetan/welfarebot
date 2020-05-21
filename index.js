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
  bot.sendMessage(msg.chat.id, 'Please input your matric number in the following ' + 
    'format: "matric <Axxxxxxxx>".');
});

// matric
bot.onText(/matric/, (msg, reply) => {
  const input = reply.input;
  const id = msg.chat.id;
  if (input.length <= 6) {
    bot.sendMessage(id, 'Please input your matric number with the correct format: "matric <Axxxxxxxx>".');
  } else {
    const arr = input.split(" ")[1];
    const matric = arr.toUpperCase();
    updateMatricNumber(matric, id);
  }
});


function updateMatricNumber(matric, id) {
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
            bot.sendMessage(id, 'Please input your full name with the correct format: "name <your full name>".');
            idRef.child(id).set({
              matric: matric,
              teleid: id,
              collected: false
            });
          }
        });
      } else {
        bot.sendMessage(id, "Matric number is not recognised. Please try again.");
      }
    });
  }
}

// name
bot.onText(/name/, (msg, reply) => {
  const id = msg.chat.id;
  const input = reply.input;
  if (input.length <= 4) {
    bot.sendMessage(id, 'Please input your full name with the correct format: "name <your full name>".');
  } else {
    const arr = input.split(" ");
    arr.shift();
    const name = arr.join(" ");
  
    idRef.child(id).update({
      name: name
    });
    bot.sendMessage(id, "You have been authenticated.\nPlease move on to submit the relevant forms using " + 
      "/submitnussu and /submitfaculty before finally getting a queue number using /queue.");
  }
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

// nussu
bot.onText(/\/submitnussu/, function (msg) {
  bot.sendMessage(msg.chat.id, "Send proof of completing NUSSU Survey (screenshot).")
    .then(function () {
      answerCallbacks[msg.chat.id] = async function (answer) {
        if (answer.photo && answer.photo[0]) {
          const personid = answer.from.id.toString();
          const file_id = answer.photo[0].file_id;
          const fileinfo = await bot.getFile(file_id);
          const {file_path} = fileinfo;
          const url = "https://api.telegram.org/file/bot" + "1140161041:AAFcapOrmPbMdyEdLY9azOhB-Nt8LJoLyqU" + "/" + file_path;
          console.log(url);
          idRef.once('value', function(snapshot) {
            if (snapshot.hasChild(personid)) {
              idRef.child(personid).update({
                nussu:url
              });
              bot.sendMessage(answer.chat.id, "NUSSU Survey proof received!");
            }
          });
        }
      }
    });
});

// faculty
bot.onText(/\/submitfaculty/, function (msg) {
  bot.sendMessage(msg.chat.id, "Send proof of completing Faculty Survey (screenshot).")
    .then(function () {
      answerCallbacks[msg.chat.id] = async function (answer) {
        if (answer.photo && answer.photo[0]) {
          const personid = answer.from.id.toString();
          const file_id = answer.photo[0].file_id;
          const fileinfo = await bot.getFile(file_id);
          const {file_path} = fileinfo;
          console.log(file_id);
          console.log(fileinfo);
          console.log(file_path);
          const url = "https://api.telegram.org/file/bot" + "1140161041:AAFcapOrmPbMdyEdLY9azOhB-Nt8LJoLyqU" + "/" + file_path;
          console.log(url);
          idRef.once('value', function(snapshot) {
            if (snapshot.hasChild(personid)) {
              idRef.child(personid).update({
                faculty:url
              });
              bot.sendMessage(answer.chat.id, "Faculty Survey proof received!");
            }
          });
        }
      }
    });
});



// Feature 3: Queue
// set up Q details in firebase 
const queueRef = sitesRef.child("queueDetails");
queueRef.set({
  currServing: 0,
  currQueueNum: 0
});

// Q details: firebase --> tele bot
let currServing;
queueRef.child("currServing").on('value', function(snapshot) {
  currServing = snapshot.val();
});

// join Q command
let currQueueNum = 0;
bot.onText(/\/queue/, (msg) => {
  console.log("currQueueNum", currQueueNum);
  console.log("id", msg.from.id);
  const id = msg.from.id;
  idRef.child(id).once('value', function(snapshot) {
    const userDetails = snapshot.val();
    if (userDetails.collected) {
      bot.sendMessage(id, "You have already collected the welfare pack.");
    } else if (userDetails.queueNum != undefined) {
      bot.sendMessage(id, "You are already in the queue. Your current queue number is " + 
        userDetails.queueNum);
    } else if (userDetails.nussu == undefined || userDetails.faculty == undefined) {
      bot.sendMessage(id, "You have not completed the necessary surveys and forms. Please submit using /submitnussu and /submitfaculty.");
    } else {
      currQueueNum++;
      idRef.child(id).update({
        queueNum: currQueueNum
      });
      queueRef.update({
        currQueueNum: currQueueNum
      });
      bot.sendMessage(id, "Your queue number is " + currQueueNum.toString() + 
      ". We will notify you when your turn is near.");
    }
  });
});



// Feature 4: notify user when turn is near
queueRef.child("currServing").on("value", function(snapshot) {
  const currServing = snapshot.val();
  idRef.orderByChild("queueNum").startAt(currServing + 1).endAt(currServing + 3)
  .on("child_added", function(snap) {
    const id = snap.val().teleid;
    const num = (snap.val().queueNum - currServing - 1).toString();
    const pronoun = num == 0 || num == 1 ? " is " : " are "; 
    const word = num == 0 || num == 1 ? " person " : " people ";
    bot.sendMessage(id, "Your turn is nearing. There" + pronoun + num + word + "infront of you." +  
      " Plese head over to the collection venue.");
  });
});


// Feature 5: check number of users ahead of them
bot.onText(/\/checkqueue/, (msg) => {
  const id = msg.from.id;

  idRef.child(id).once('value', function(snapshot) {
    const details = snapshot.val();
    if (details.collected) {
      bot.sendMessage(id, "You have already collected the welfare pack.");
    } else if (details.queueNum == undefined) {
      bot.sendMessage(id, "You do not have a queue number yet. Join the /queue now.");
    } else {
      const num = details.queueNum - currServing - 1;
      if (num == 0 || num == 1) {
        bot.sendMessage(id, "There is " + num.toString() + " person infront of you.");
      }
      else {
        bot.sendMessage(id, "There are " + num.toString() + " people infront of you.");
      }
    }
  });
});



// Feature 6: Provide information about the welfare pack event. 
// let location;
// let date;
// let starttime;
// let endtime;
// queueRef.child("location").on('value', function(snapshot) {
//   location = snapshot.val();
// });
// queueRef.child("date").on('value', function(snapshot) {
//   date = snapshot.val();
// });
// queueRef.child("starttime").on('value', function(snapshot) {
//   starttime = snapshot.val();
// });
// queueRef.child("endtime").on('value', function(snapshot) {
//   endtime = snapshot.val();
// });
// bot.onText(/\/info/, (msg) =>{
//   bot.sendMessage(msg.chat.id, "The welfare pack collection will be held at " + location + ", on " + date + ", from " + starttime.toString() + 
//   " to " + endtime.toString())
// });


// Feature 7*: Choose the snacks they want
bot.onText(/\/flavour/, (msg) => {
    bot.sendMessage(msg.chat.id,'What is your favourite flavour?', {
      reply_markup: {
        inline_keyboard: [[
          {
            text: 'Vanilla',
            callback_data: 'vanilla'
          },{
            text: 'Strawberry',
            callback_data: 'strawberry'
          },{
            text: 'Chocolate',
            callback_data: 'chocolate'
          }
        ]]
      }
    });
  });

bot.on("callback_query", (callbackQuery) => {
  const flavour = callbackQuery.data
  const chat_id = callbackQuery.message.chat.id 
  const message_id = callbackQuery.message.message_id
  bot.deleteMessage(chat_id.toString(), message_id.toString())
  idRef.once('value', function(snapshot) {
    if (snapshot.hasChild(chat_id.toString())) {
      idRef.child(chat_id).update({
        flavour: flavour
      })
      bot.sendMessage(chat_id, "Received!")
    }
  return;
  })
});

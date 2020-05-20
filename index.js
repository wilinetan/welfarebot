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
    'format: "/matric Axxxxxxxx".');
});

bot.onText(/\/matric/, (msg, reply) => {
  const arr = reply.input.split(" ")[1];
  const matric = arr.toUpperCase();
  console.log("matric", matric, typeof matric);
  getMatricNumber(matric, msg.chat.id);
});

function getMatricNumber(matric, id) {
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
            });
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
  bot.sendMessage(id, "You have been authenticated. Please move on to submit the relevant forms using " + 
    "/submitnussu and /submitfaculty before finally getting a queue number using /queue.");
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

bot.onText(/\/submitnussu/, function (msg) {
  bot.sendMessage(msg.chat.id, "Send your NUSSU photo")
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

bot.onText(/\/submitfaculty/, function (msg) {
  bot.sendMessage(msg.chat.id, "Send your Faculty photo")
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
// create queueRef in firebase
const queueRef = sitesRef.child("queueDetails");
queueRef.set({
  currServing: 0,
  currQueueNum: 0
});
// currServing: firebase --> tele  
let currServing;
queueRef.on('value', function(snapshot) {
  currServing = snapshot.val().currServing;
});
// currServing: web --> firebase!!! 

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
        userDetails.queueNum)
        // .then(() => notif(userDetails.queueNum, id))
    } else if (userDetails.nussu == undefined || userDetails.faculty == undefined) {
      bot.sendMessage(id, "You have not completed the necessary surveys and forms.");
    } else {
      currQueueNum++;
      // update user's q num
      idRef.child(id).update({
        queueNum: currQueueNum
      }).then(()=> {
      // update the q details 
      queueRef.update({
        currQueueNum: currQueueNum
      })}).then(()=> {
      bot.sendMessage(id, "Your queue number is " + currQueueNum.toString() + 
      ". We will notify you when your turn is near.")
      // .then(() => notif(userDetails.queueNum, id))
      })
    }
    console.log(userDetails)
  });
  // idRef.child(id).once('value', function(snapshot) {
  //   const newuserDetails = snapshot.val();})
  // console.log(newuserDetails, "new")
});




// Feature 4: Notify user when their turn is near
function notif(queueNum,id) {
  console.log(queueNum,currServing)
  var status = true
  while (status) {
    if ((queueNum - currServing) <= 3) {
      console.log("fulfilled condi")
      status = false
      bot.sendMessage(id, "Your turn is near, please head to the collection venue.")
    }
  }
}

function change(queueNum,id){
  var old = currServing // assuming that the old will not change when currServing changes
  if (old = currServing - 1) {
    return true
  }
}

function notif(queuenum,id){
  var old = currServing // assuming that the old will not change when currServing changes
  if (old = currServing - 1) { //currServing increased by 1 
    if (1 <= (queueNum - currServing) <= 3) {
      var number = queueNum - currServing
      bot.sendMessage(id, "Your turn is near, only " + number.toString() + " students infront of you. please head to the collection venue.")
      old = currServing + 1
      notif(queueNum,id) //recurse
    }
    else if ((queueNum - currServing) == 0) {
      return
    }
  }

/// Feature 5: Check the number of ppl infront of them 
bot.onText(/\/checkqueue/, (msg) => {
  const id = msg.from.id;

  idRef.child(id).once('value', function(snapshot) {
    const details = snapshot.val();
    if (details.collected) {
      bot.sendMessage(id, "You have already collected the welfare pack.");
    } else if (details.queueNum == undefined) {
      bot.sendMessage(id, "You do not have a queue number yet.");
    } else {
      const num = details.queueNum - currServing - 1;
      bot.sendMessage(id, "There are " + num.toString() + " people infront of you.");
    }
  });
});



/// Feature 6: Provide information about the welfare pack event. 
// bot.onText(/\/info/, (msg) =>{
//   const location = ;
//   const date = ;
//   const time = ;
//   bot.sendMessage(msg.chat.id,  )
// } )


/// Feature 7*: Choose the snacks they want
// bot.onText(/\/submit/, (msg) => {
//     bot.sendMessage(msg.chat.id,'Okay, which survey?', {
//       reply_markup: {
//         inline_keyboard: [[
//           {
//             text: 'NUSSU',
//             callback_data: 'nussu'
//           },{
//             text: 'Faculty',
//             callback_data: 'faculty'
//           }
//         ]]
//       }
//     });
//   });
//   survey = callbackQuery.data
//   chat_id = callbackQuery.message.chat.id 
//   message_id = callbackQuery.message.message_id
//   bot.deleteMessage(chat_id.toString(), message_id.toString())
//   bot.sendMessage(chat_id, "Send me the photo.");
//   // getsurvey()
// function getsurvey() {
//   bot.on('message', async (msg) => {
//     if (msg.photo && msg.photo[0]) {
//       bot.sendMessage(msg.chat.id, "Photo Received!")
//       const personid = msg.from.id.toString()
//       const file_id = msg.photo[0].file_id
//       const fileinfo = await bot.getFile(file_id)
//       const {file_path} = fileinfo
//       const url = "https://api.telegram.org/file/bot" + "1140161041:AAFcapOrmPbMdyEdLY9azOhB-Nt8LJoLyqU" + "/" + file_path
//       console.log(url)
//       idRef.once('value', function(snapshot) {
//         if (snapshot.hasChild(personid)) {
//             if (survey == "nussu") {
//               idRef.child(personid).update({
//                 nussu:url
//               })}
//             else if (survey == "faculty") {
//               idRef.child(personid).update({
//                 faculty:url
//               })}
//             }})
//           }})}

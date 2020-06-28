const TelegramBot = require("node-telegram-bot-api");
const firebase = require("firebase");
const dotenv = require("dotenv");

dotenv.config();

const token = process.env.TELEGRAM_API_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const app = firebase.initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
});

const ref = firebase.database().ref("Computing");
// const sitesRef = ref.child("14MeO__j9jCngVkWmjCB4H4HetHmfE15V8fJNnTVAaXQ");
// const sheetRef = sitesRef.child("Sheet1");
// const idRef = sitesRef.child("ids");
// const adRef = sitesRef.child("admin")
const matricRef = ref.child("matric");
const idRef = ref.child("ids");
const adRef = ref.child("admin");

// Feature 1: Authentication
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Please input your matric number in the following " +
      'format: "matric <Axxxxxxxx>".'
  );
});

// matric
bot.onText(/matric/, (msg) => {
  const reply = msg.text;
  const id = msg.chat.id;
  if (reply.length <= 6) {
    bot.sendMessage(
      id,
      'Please input your matric number with the correct format: "matric <Axxxxxxxx>".'
    );
  } else {
    const arr = reply.split(" ")[1];
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
  } else if (
    !isLetter(matric.charAt(0)) ||
    !isLetter(matric.charAt(0)) ||
    isNaN(parseInt(matric.substring(1, 8), 10))
  ) {
    bot.sendMessage(id, "Invalid matric number entered. Please try again.");
  } else {
    // checks if matric number is in database and updates details otherwise prompts user again
    matricRef.once("value", function (snapshot) {
      if (snapshot.hasChild(matric)) {
        idRef.once("value", function (snap) {
          if (snap.hasChild(id.toString())) {
            bot.sendMessage(id, "You have already been authenticated.");
          } else {
            idRef.child(id).set({
              matric: matric,
              teleid: id,
              collected: false,
              surveyVerified: false,
              queueNum: -1,
            });
            bot.sendMessage(
              id,
              'Please input your full name with the correct format: "name <your full name>".'
            );
          }
        });
      } else {
        bot.sendMessage(
          id,
          "Matric number is not recognised. Please try again."
        );
      }
    });
  }
}

// name
bot.onText(/name/, (msg) => {
  const id = msg.chat.id;
  const reply = msg.text;
  if (reply.length <= 4) {
    bot.sendMessage(
      id,
      'Please input your full name with the correct format: "name <your full name>".'
    );
  } else {
    const arr = reply.split(" ");
    arr.shift();
    const name = arr.join(" ");

    idRef.child(id).update({
      name: name,
    });
    bot.sendMessage(
      id,
      "You have been authenticated.\nPlease move on to submit the relevant forms using " +
        "/submitnussu and /submitfaculty before finally getting a queue number using /queue."
    );
  }
});

// Feature 2: Submit survey
process.on("uncaughtException", function (error) {
  console.log("\x1b[31m", "Exception: ", error, "\x1b[0m");
});

process.on("unhandledRejection", function (error, p) {
  console.log("\x1b[31m", "Error: ", error.message, "\x1b[0m");
});

var answerCallbacks = {};

bot.on("message", function (msg) {
  var callback = answerCallbacks[msg.chat.id];
  if (callback) {
    delete answerCallbacks[msg.chat.id];
    return callback(msg);
  }
});

// nussu
bot.onText(/\/submitnussu/, function (msg) {
  adRef.child("nussulink").once("value", function (snapshot) {
    const link = snapshot.val();
    bot
      .sendMessage(
        msg.chat.id,
        "Survey link is " +
          link +
          ". Send proof of completing NUSSU Survey (screenshot)."
      )
      .then(function () {
        answerCallbacks[msg.chat.id] = async function (answer) {
          if (answer.photo && answer.photo[0]) {
            const personid = answer.from.id.toString();
            const file_id = answer.photo[0].file_id;
            const fileinfo = await bot.getFile(file_id);
            const { file_path } = fileinfo;
            const url =
              "https://api.telegram.org/file/bot" +
              process.env.TELEGRAM_API_TOKEN +
              "/" +
              file_path;
            console.log(url);
            idRef.once("value", function (snapshot) {
              if (snapshot.hasChild(personid)) {
                idRef.child(personid).update({
                  nussu: url,
                });
                bot.sendMessage(answer.chat.id, "NUSSU Survey proof received!");
              }
            });
          }
        };
      });
  });
});

// faculty
bot.onText(/\/submitfaculty/, function (msg) {
  adRef.child("facultylink").once("value", function (snapshot) {
    const link = snapshot.val();
    bot
      .sendMessage(
        msg.chat.id,
        "Survey link is " +
          link +
          ". Send proof of completing Faculty Survey (screenshot)."
      )
      .then(function () {
        answerCallbacks[msg.chat.id] = async function (answer) {
          if (answer.photo && answer.photo[0]) {
            const personid = answer.from.id.toString();
            const file_id = answer.photo[0].file_id;
            const fileinfo = await bot.getFile(file_id);
            const { file_path } = fileinfo;
            console.log(file_id);
            console.log(fileinfo);
            console.log(file_path);
            const url =
              "https://api.telegram.org/file/bot" +
              process.env.TELEGRAM_API_TOKEN +
              "/" +
              file_path;
            console.log(url);
            idRef.once("value", function (snapshot) {
              if (snapshot.hasChild(personid)) {
                idRef.child(personid).update({
                  faculty: url,
                });
                bot.sendMessage(
                  answer.chat.id,
                  "Faculty Survey proof received!"
                );
              }
            });
          }
        };
      });
  });
});

// Feature 3: Queue
// set up Q details in firebase
const queueRef = ref.child("queueDetails");
// queueRef.set({
//   currServing: 0,
//   currQueueNum: 0,
// });

// Q details: firebase --> tele bot
let currServing;
queueRef.child("currServing").on("value", function (snapshot) {
  currServing = snapshot.val();
});

// join Q command
let currQueueNum = 0;
bot.onText(/\/queue/, (msg) => {
  console.log("currQueueNum", currQueueNum);
  console.log("id", msg.from.id);
  const id = msg.from.id;
  idRef.child(id).once("value", function (snapshot) {
    const userDetails = snapshot.val();
    if (userDetails.collected) {
      bot.sendMessage(id, "You have already collected the welfare pack.");
    } else if (userDetails.queueNum != undefined) {
      bot.sendMessage(
        id,
        "You are already in the queue. Your current queue number is " +
          userDetails.queueNum
      );
    } else if (
      userDetails.nussu == undefined ||
      userDetails.faculty == undefined
    ) {
      bot.sendMessage(
        id,
        "You have not completed the necessary surveys and forms. " +
          "Please submit using /submitnussu and /submitfaculty."
      );
    } else {
      currQueueNum++;
      idRef.child(id).update({
        queueNum: currQueueNum,
      });
      queueRef.update({
        currQueueNum: currQueueNum,
      });
      bot
        .sendMessage(
          id,
          "Your queue number is " +
            currQueueNum.toString() +
            ". We will notify you when your turn is near."
        )
        .then(() => {
          idRef.child(id).update({
            queueNum: currQueueNum,
          });
          queueRef.update({
            currQueueNum: currQueueNum,
          });
        });
    }
  });
});

// Feature 4: notify user when turn is near
queueRef.child("currServing").on("value", function (snapshot) {
  const currServing = snapshot.val();
  idRef
    .orderByChild("queueNum")
    .startAt(currServing + 1)
    .endAt(currServing + 3)
    .on("child_added", function (snap) {
      const id = snap.val().teleid;
      const num = (snap.val().queueNum - currServing - 1).toString();
      const pronoun = num == 0 || num == 1 ? " is " : " are ";
      const word = num == 0 || num == 1 ? " person " : " people ";
      bot.sendMessage(
        id,
        "Your turn is nearing. There" +
          pronoun +
          num +
          word +
          "infront of you. " +
          "Plese head over to the collection venue."
      );
    });
});

// Feature 5: check number of users ahead of them
bot.onText(/\/checkqueue/, (msg) => {
  const id = msg.from.id;

  idRef.child(id).once("value", function (snapshot) {
    const details = snapshot.val();
    if (details.collected) {
      bot.sendMessage(id, "You have already collected the welfare pack.");
    } else if (details.queueNum == undefined) {
      queueRef.once("value", function (snapshot) {
        const details = snapshot.val();
        const x = details.currQueueNum - details.currServing;
        if (x == 0) {
          bot.sendMessage(
            id,
            "There is no one in the queue. You do not have a queue number yet. Join the /queue now."
          );
        } else if (x == 1) {
          bot.sendMessage(
            id,
            "There is " +
              x.toString() +
              " people infront of you. You do not have a queue number yet. Join the /queue now."
          );
        } else {
          bot.sendMessage(
            id,
            "There are " +
              x.toString() +
              " people infront of you. You do not have a queue number yet. Join the /queue now."
          );
        }
      });
    } else {
      const num = details.queueNum - currServing - 1;
      if (num == 0 || num == 1) {
        bot.sendMessage(
          id,
          "There is " + num.toString() + " person infront of you."
        );
      } else {
        bot.sendMessage(
          id,
          "There are " + num.toString() + " people infront of you."
        );
      }
    }
  });
});

// Feature 6: Provide information about the welfare pack event.
bot.onText(/\/admindetails/, (msg) => {
  const id = msg.from.id;
  adRef.once("value", function (snapshot) {
    const details = snapshot.val();
    bot.sendMessage(
      id,
      "Collection venue: " +
        details.venue +
        "\nCollection date: " +
        details.startdate +
        " to " +
        details.enddate +
        "\nCollection time: " +
        details.starttime +
        "-" +
        details.endtime
    );
  });
});

// Feature 7*: Choose the snacks they want
bot.onText(/\/flavour/, (msg) => {
  bot.sendMessage(msg.chat.id, "What is your favourite flavour?", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Vanilla",
            callback_data: "vanilla",
          },
          {
            text: "Strawberry",
            callback_data: "strawberry",
          },
          {
            text: "Chocolate",
            callback_data: "chocolate",
          },
        ],
      ],
    },
  });
});

bot.on("callback_query", (callbackQuery) => {
  const flavour = callbackQuery.data;
  const chat_id = callbackQuery.message.chat.id;
  const message_id = callbackQuery.message.message_id;
  bot.deleteMessage(chat_id.toString(), message_id.toString());
  idRef.once("value", function (snapshot) {
    if (snapshot.hasChild(chat_id.toString())) {
      idRef.child(chat_id).update({
        flavour: flavour,
      });
      bot.sendMessage(chat_id, "Received!");
    }
    return;
  });
});

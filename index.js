const TelegramBot = require("node-telegram-bot-api");
const firebase = require("firebase");
const dotenv = require("dotenv");
dotenv.config();

const token = process.env.TELEGRAM_API_TOKEN;

let bot;
if (process.env.NODE_ENV === "production") {
  const options = {
    webHook: {
      port: process.env.PORT || 5000,
      host: "0.0.0.0",
    },
  };
  bot = new TelegramBot(token, options);
  bot.setWebHook(process.env.HEROKU_URL + ":443/bot" + bot.token);
} else {
  bot = new TelegramBot(token, { polling: true });
}

const app = firebase.initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
});

const ref = firebase.database().ref("Computing");
const matricRef = ref.child("matric");
const idRef = ref.child("ids");
const adRef = ref.child("admin");
const queueRef = ref.child("queueDetails");
const missedRef = ref.child("missed");

// Feature 1: Authentication
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Please input your matric number in the following " +
      'format: "matric A1234567Z".'
  );
});

// Get matric number from user. Accepts 2 variations of the word.
bot.onText(/matric/, (msg) => processMatric(msg));
bot.onText(/Matric/, (msg) => processMatric(msg));

// Process the message sent by user.
function processMatric(msg) {
  const reply = msg.text;
  const id = msg.chat.id;
  if (reply.length <= 6) {
    bot.sendMessage(
      id,
      'Please input your matric number with the correct format: "matric A1234567Z".'
    );
  } else {
    const arr = reply.split(" ")[1];
    const matric = arr.toUpperCase();
    updateMatricNumber(matric, id);
  }
}

function updateMatricNumber(matric, id) {
  function isLetter(str) {
    return str.length === 1 && str.match(/[a-z]/i);
  }

  if (matric.length !== 9) {
    bot.sendMessage(id, "Invalid matric number entered. Please try again.");
  } else if (
    !isLetter(matric.charAt(0)) ||
    !isLetter(matric.charAt(0)) ||
    isNaN(parseInt(matric.substring(1, 8), 10))
  ) {
    bot.sendMessage(id, "Invalid matric number entered. Please try again.");
  } else {
    // checks if matric number is in database and updates details otherwise prompts user again
    idRef
      .orderByChild("matric")
      .equalTo(matric)
      .once("value", function (snapshot) {
        // matric number has been used by another account
        if (snapshot !== null) {
          bot.sendMessage(id, "This matric number has already been used.");
          return;
        }
        // Check if matric number is in the list of matric numbers
        matricRef.once("value", function (snapshot) {
          if (snapshot.hasChild(matric)) {
            idRef.once("value", function (snap) {
              // Tele user has already been authenticated
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
                  'Please input your full name with the correct format: "name Bob Lim Xiao Ming".'
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
      });
  }
  function isLetter(str) {
    return str.length === 1 && str.match(/[a-z]/i);
  }

  if (matric.length !== 9) {
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
              'Please input your full name with the correct format: "name Bob Lim Xiao Ming".'
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


// Get name from user. Accepts 2 variations of the word.
bot.onText(/name/, (msg) => processName(msg));
bot.onText(/Name/, (msg) => processName(msg));

// Process the message sent by user.
function processName(msg) {
  const id = msg.chat.id;
  const reply = msg.text;
  if (reply.length <= 4) {
    bot.sendMessage(
      id,
      'Please input your full name with the correct format: "name Bob Lim Xiao Ming.'
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
}

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
	const id = msg.id
	var reply = msg.text.toUpperCase()
	elif (isLetter(reply.charAt(0)) && isLetter(reply.charAt(0)) && isNaN(parseInt(reply.substring(1, 8), 10))) {
		bot.sendMessage(id, "Please put 'matric' before your matric number. Format: 'matric A1234567Z")
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

            idRef.once("value", function (snapshot) {
              if (snapshot.hasChild(personid)) {
                idRef.child(personid).update({
                  nussu: url,
                });
                bot.sendMessage(
                  answer.chat.id,
                  "NUSSU Survey proof received! If you have sent both survey proofs, feel free to check number of people in the queue using /checkqueue, join the queue now using /queue or later using /later. "
                );
              }
            });
          } else {
            bot.sendMessage(
              msg.chat.id,
              "Please resubmit the NUSSU survey screenshot as a photo with /submitnussu command."
            );
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
            const url =
              "https://api.telegram.org/file/bot" +
              process.env.TELEGRAM_API_TOKEN +
              "/" +
              file_path;

            idRef.once("value", function (snapshot) {
              if (snapshot.hasChild(personid)) {
                idRef.child(personid).update({
                  faculty: url,
                });
                bot.sendMessage(
                  answer.chat.id,
                  "Faculty Survey proof received! If you have sent both survey proofs, feel free to check number of people in the queue using /checkqueue, join the queue now using /queue or later using /later. "
                );
              }
            });
          } else {
            bot.sendMessage(
              msg.chat.id,
              "Please resubmit the faculty survey screenshot as a photo with /submitfaculty command."
            );
          }
        };
      });
  });
});

// Feature 3: Queue
// Q details: firebase --> tele bot
let currServing;
queueRef.child("currServing").on("value", function (snapshot) {
  currServing = snapshot.val();
});

bot.onText(/\/queue/, (msg) => {
  const id = msg.from.id;
  idRef.child(id).once("value", function (snapshot) {
    const userDetails = snapshot.val();
    if (userDetails.collected) {
      bot.sendMessage(id, "You have already collected the welfare pack.");
    } else if (userDetails.queueNum !== -1 && !userDetails.missed) {
      bot.sendMessage(
        id,
        "You are already in the queue. Your current queue number is " +
          userDetails.queueNum
      );
    } else if (
      userDetails.nussu === undefined ||
      userDetails.faculty === undefined
    ) {
      bot.sendMessage(
        id,
        "You have not completed the necessary surveys and forms. " +
          "Please submit using /submitnussu and /submitfaculty."
      );
    } else {
      adRef.once("value", (snapshot) => {
        const details = snapshot.val();

        const currDate = new Date();

        const startTime = parseInt(details.starttime);
        const endTime = parseInt(details.endtime);

        const startDate = details.startdate;
        const startDateArr = startDate.split("/");
        const startDateObject = new Date(
          parseInt(startDateArr[2], 10) + 2000,
          parseInt(startDateArr[1], 10) - 1,
          startDateArr[0]
        );

        const endDate = details.enddate;
        const endDateArr = endDate.split("/");
        const endDateObject = new Date(
          parseInt(endDateArr[2], 10) + 2000,
          parseInt(endDateArr[1], 10) - 1,
          endDateArr[0],
          Math.trunc(endTime / 100),
          endTime % 100
        );

        // Current date is not within the range of collection dates
        if (currDate < startDateObject || currDate >= endDateObject) {
          bot.sendMessage(
            id,
            "There is currently no collection going on. Please use /admindetails to check the collection dates."
          );
        } else {
          // Current date is within the range of collection dates and time
          const currTime = currDate.getHours() * 100 + currDate.getMinutes();

          if (currTime >= startTime - 1 && currTime < endTime) {
            queueRef.child("currQueueNum").once("value", function (snapshot) {
              var currQueueNum = snapshot.val() + 1;

              bot
                .sendMessage(
                  id,
                  "Your queue number is " +
                    currQueueNum.toString() +
                    ". We will notify you when there are 3 people infront of you. To keep track of the queue status, feel free to use /checkqueue. Please make your way to the location as seen in /admindetails and make it in time for your turn. If you do not appear within 5 minutes of your turn, you will be removed from the queue."
                )
                .then(() => {
                  idRef.child(id).update({
                    queueNum: currQueueNum,
                    missed: false,
                    time: null,
                  });
                  queueRef.update({
                    currQueueNum: currQueueNum,
                  });
                });
            });
          } else {
            // Current time is outside collection hours
            bot.sendMessage(
              id,
              "You can only start joining queue 1 hour before collection start time until the end time. Please use /admindetails to check the start time."
            );
          }
        }
      });
    }
  });
});

// Feature 4: notify user when turn is near
queueRef.on("value", function (snapshot) {
  const currServing = snapshot.val().currServing;
  const startCollection = snapshot.val().startCollection;

  if (!startCollection) {
    return;
  }

  idRef
    .orderByChild("queueNum")
    .startAt(currServing + 1)
    .endAt(currServing + 3)
    .on("child_added", function (snap) {
      const id = snap.val().teleid;
      const num = snap.val().queueNum - currServing - 1;
      const pronoun = num === 0 || num === 1 ? " is " : " are ";
      const word = num === 0 || num === 1 ? " person " : " people ";
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
    } else if (details.missed) {
      bot.sendMessage(
        id,
        "You missed your turn. Please get another queue number with /queue command."
      );
    } else if (details.queueNum === -1) {
      queueRef.once("value", function (snapshot) {
        const details = snapshot.val();
        const x = details.currQueueNum - details.currServing;
        if (x === 0) {
          bot.sendMessage(
            id,
            "There is no one in the queue. You do not have a queue number yet. Join the /queue now."
          );
        } else if (x === 1) {
          bot.sendMessage(
            id,
            "There is " +
              x.toString() +
              " person in the queue. You do not have a queue number yet. Join the /queue now."
          );
        } else {
          bot.sendMessage(
            id,
            "There are " +
              x.toString() +
              " people in the queue. You do not have a queue number yet. Join the /queue now."
          );
        }
      });
    } else {
      const num = details.queueNum - currServing - 1;
      if (num === 0 || num === 1) {
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

//unqueue
bot.onText(/\/unqueue/, (msg) => {
  const id = msg.from.id;
  idRef.child(id).update({
    queueNum: -1,
    missed: false,
    time: null,
  });
  bot.sendMessage(id, "You are no longer in the queue.");
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

// Feature 7*: Queue later feature
// check all conditions (from queue)
bot.onText(/\/later/, (msg) => {
  const id = msg.from.id;
  idRef.child(id).once("value", function (snapshot) {
    const userDetails = snapshot.val();
    if (userDetails.collected) {
      bot.sendMessage(id, "You have already collected the welfare pack.");
    } else if (userDetails.queueNum !== -1 && !userDetails.missed) {
      bot.sendMessage(
        id,
        "You are already in the queue. Your current queue number is " +
          userDetails.queueNum
      );
    } else if (
      userDetails.nussu === undefined ||
      userDetails.faculty === undefined
    ) {
      bot.sendMessage(
        id,
        "You have not completed the necessary surveys and forms. " +
          "Please submit using /submitnussu and /submitfaculty."
      );
    } else {
      adRef.once("value", (snapshot) => {
        const details = snapshot.val();

        const currDate = new Date();

        const startTime = parseInt(details.starttime);
        const endTime = parseInt(details.endtime);

        const startDate = details.startdate;
        const startDateArr = startDate.split("/");
        const startDateObject = new Date(
          parseInt(startDateArr[2], 10) + 2000,
          parseInt(startDateArr[1], 10) - 1,
          startDateArr[0]
        );

        const endDate = details.enddate;
        const endDateArr = endDate.split("/");
        const endDateObject = new Date(
          parseInt(endDateArr[2], 10) + 2000,
          parseInt(endDateArr[1], 10) - 1,
          endDateArr[0],
          Math.trunc(endTime / 100),
          endTime % 100
        );

        // Current date is not within the range of collection dates
        if (currDate < startDateObject || currDate > endDateObject) {
          bot.sendMessage(
            id,
            "There is currently no collection going on. Please use /admindetails to check the collection dates."
          );
        } else {
          // Current date is within the range of collection dates and time
          const currTime = currDate.getHours() * 100 + currDate.getMinutes();

          if (currTime >= startTime - 1 && currTime < endTime) {
            bot
              .sendMessage(
                id,
                "How many minutes from now do you want to join the queue?"
              )
              .then(function () {
                answerCallbacks[msg.chat.id] = async function (answer) {
                  const duration = answer.text;
                  if (isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
                    bot.sendMessage(
                      id,
                      "Please input a valid number with the /later command again."
                    );
                    return;
                  }

                  bot.sendMessage(
                    id,
                    "Okay, I will put you in the queue in " +
                      duration +
                      " minutes."
                  );
                  function queuef() {
                    queueRef
                      .child("currQueueNum")
                      .once("value", function (snapshot) {
                        var currQueueNum = snapshot.val() + 1;

                        bot
                          .sendMessage(
                            id,
                            "Your queue number is " +
                              currQueueNum.toString() +
                              ". We will notify you when there are 3 people infront of you. To keep track of the queue status, feel free to use /checkqueue. Please make your way to the location as seen in /admindetails and make it in time for your turn. If you do not appear within 5 minutes of your turn, you will be removed from the queue."
                          )
                          .then(() => {
                            idRef.child(id).update({
                              queueNum: currQueueNum,
                              missed: false,
                              time: null,
                            });

                            queueRef.update({
                              currQueueNum: currQueueNum,
                            });
                          });
                      });
                  }
                  setTimeout(queuef, duration * 60 * 1000);
                  // adRef.once("value", function (snapshot) {
                  // 	const details = snapshot.val();
                  // if (time <= details.endtime & time >= details.starttime) {

                  // 	}

                  // when current time==time
                  // add to queue & notify user
                  // send message that it is successful
                };
                // else {
                // 	bot.sendMessage(answer.chat.id, 'Time stated is not within the collection time.')
                // }
              });
          } else {
            // Current time is outside collection hours
            bot.sendMessage(
              id,
              "You can only use this function after and during the collection."
            );
          }
        }
      });
    }
  });
});

// Feature 8*: User who missed queue receives a notification to join the queue again
missedRef.on("value", function (snapshot) {
  const teleid = snapshot.val();
  queueRef.once("value", function (snapshot) {
    if (!snapshot.val().startCollection) {
      return;
    }

    if (teleid !== null) {
      bot.sendMessage(
        teleid,
        "You have missed your turn. Please get another queue number with /queue command."
      );
    }
  });
});

bot.onText(/\/help/, (msg) => {
  const id = msg.from.id;
  bot.sendMessage(
    id,
    "Welcome to WelfareBot! This bot is used to facilitate the queueing process for welfare collection." +
      " \n 1. Follow the instructions to input your matric number and full name" +
      " \n 2. Submit proof of survey completions using /submitnussu and /submitfaculty" +
      " \n 3. Use /admindetails to check collection venue and time" +
      " \n 4. Use /queue to get a queue number" +
      " \n 5. A notification will be sent to you when your turn is nearing" +
      " \n 6. Use /checkqueue to check number of people in front of you" +
      " \n 7. Use /later to join the queue at a later timing"
  );
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

const expect = require("chai").expect;
const index = require("../index");
const firebase = require("firebase");
const dotenv = require("dotenv").config();

var TelegramTest = require("telegram-test");
var TelegramBot = require("node-telegram-bot-api");
var telegramBot = new TelegramBot(process.env.TELEGRAM_API_TOKEN, {});

const ref = firebase.database().ref("Computing");
const matricRef = ref.child("matric");
const idRef = ref.child("ids");
const adRef = ref.child("admin");

class TestBot {
  constructor(bot) {
    bot.onText(/\/start/, (msg) => {
      bot.sendMessage(
        msg.chat.id,
        'Please input your matric number in the following format: "matric <Axxxxxxxx>".'
      );
    });
    bot.onText(/\/admin/, (msg) => {
      adRef.once("value", function (snapshot) {
        const details = snapshot.val();
        bot.sendMessage(
          msg.chat.id,
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
  }
}

describe("Start Test", () => {
  const myBot = new TestBot(telegramBot);
  let testChat = 1;
  it("reply user with matric format", () => {
    const telegramTest = new TelegramTest(telegramBot);
    return telegramTest.sendUpdate(testChat, "/start").then((data) => {
      if (
        data.text ===
        'Please input your matric number in the following format: "matric <Axxxxxxxx>".'
      ) {
        return true;
      }
      throw new Error(`Wrong answer for admin! (was  ${data.text})`);
    });
  });
});

describe("Admin Test", () => {
  const myBot = new TestBot(telegramBot);
  let testChat = 1;
  it("should provide admin details", () => {
    const telegramTest = new TelegramTest(telegramBot);
    return telegramTest.sendUpdate(testChat, "/admin").then((data) => {
      if (
        data.text ===
        "Collection venue: COM1" +
          "\nCollection date: 10/6/20 to 12/6/20" +
          "\nCollection time: 1500-1700"
      ) {
        return true;
      }
      throw new Error(`Wrong answer for start! (was  ${data.text})`);
    });
  });
});

// describe("index.js tests", () => {
// 	const myBot = new TestBot(telegramBot);
// 	describe("math.add() Test", () => {
// 		it("should ask for name", () => {
// 			const telegramTest = new TelegramTest(telegramBot);
// 			return telegramTest.sendUpdate(testChat, "/start").then((data) => {
// 				if (
// 					data.text ===
// 					'"Please input your matric number in the following format: "matric <Axxxxxxxx>".'
// 				) {
// 					return True;
// 				}
// 				throw new Error(`Wrong answer for ping! (was  ${data.text})`);
// 			});
// 		});
// 	});
// });

// describe("Telegram Test", () => {
// 	const myBot = new TestBot(telegramBot);
// 	let testChat = 1;
// 	it("should be able to talk with sample bot", () => {
// 		const telegramTest = new TelegramTest(telegramBot);
// 		return telegramTest
// 			.sendUpdate(testChat, "/ping")
// 			.then((data) => {
// 				if (data.text === "pong") {
// 					return telegramTest.sendUpdate(testChat, "/start");
// 				}
// 				throw new Error(`Wrong answer for ping! (was  ${data.text})`);
// 			})
// 			.then((data) =>
// 				telegramTest.sendUpdate(testChat, data.keyboard[0][0].text)
// 			)
// 			.then((data) => {
// 				if (data.text === "Hello, Masha!") {
// 					return true;
// 				}
// 				throw new Error("Wrong greeting!");
// 			});
// 	});
// })

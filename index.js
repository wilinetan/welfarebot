
// Feature 2: Submit survey
// choose which survey they want to submit
let survey;
bot.onText(/\/submit/, (msg) => {
  bot.sendMessage(msg.chat.id,'Okay, which survey?', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: 'NUSSU',
          callback_data: 'nussu'
        },{
          text: 'Faculty',
          callback_data: 'faculty'
        }
      ]]
    }
  });
});
bot.on("polling_error", (err) => console.log(err));
bot.on("callback_query", (callbackQuery) => {
  survey = callbackQuery.data
  chat_id = callbackQuery.message.chat.id 
  message_id = callbackQuery.message.message_id
  bot.deleteMessage(chat_id.toString(), message_id.toString())
  bot.sendMessage(chat_id, "Send me the photo.")
  getsurvey()
  return;
});

var async = require("async");
function getsurvey() {
  bot.once('message', async (msg) => {
    if (msg.photo && msg.photo[0]) {
      
      const personid = msg.from.id.toString()
      const file_id = msg.photo[0].file_id
      const fileinfo = await bot.getFile(file_id)
      const {file_path} = fileinfo
      const url = "https://api.telegram.org/file/bot" + "1140161041:AAFcapOrmPbMdyEdLY9azOhB-Nt8LJoLyqU" + "/" + file_path
      console.log(url)
      idRef.once('value', function(snapshot) {
        if (snapshot.hasChild(personid)) {
            if (survey == "nussu") {
              idRef.child(personid).update({
                nussu:url
              })
              bot.sendMessage(msg.chat.id, "Photo Received!")}
            else if (survey == "faculty") {
              idRef.child(personid).update({
                faculty:url
              })
              bot.sendMessage(msg.chat.id, "Photo Received!")}
            }})
          }
        return;
      })}





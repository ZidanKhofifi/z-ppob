async function sendNotification(telegramOrBot, message) {
  try {
    const telegram = telegramOrBot.telegram || telegramOrBot;

    await telegram.sendMessage(
      process.env.NOTIF_GROUP_ID,
      message,
      {
        message_thread_id: Number(process.env.NOTIF_TOPIC_ID),
        parse_mode: "HTML"
      }
    );
  } catch (err) {
    console.error("NOTIFICATION ERROR:", err.message);
  }
}

module.exports = {
  sendNotification
};


module.exports = {
  sendNotification
};
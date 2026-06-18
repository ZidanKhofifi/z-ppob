const { Markup } = require("telegraf");
const { createUser } = require("../services/user");

function mainMenu() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("📱 Pulsa", "menu_pulsa"),
      Markup.button.callback("📶 Paket Data", "menu_data")
    ],
    [
      Markup.button.callback("💰 Deposit", "deposit"),
      Markup.button.callback("👤 Profil", "profile")
    ],
    [
      Markup.button.callback("📜 Riwayat", "history")
    ]
  ]);
}

module.exports = (bot) => {
  bot.start(async (ctx) => {
    createUser({
      telegram_id: ctx.from.id,
      username: ctx.from.username,
      first_name: ctx.from.first_name
    });

    await ctx.reply(
`👋 Selamat datang di Z PPOB

Layanan tersedia:
📱 Pulsa
📶 Paket Data

Silakan pilih menu:`,
      mainMenu()
    );
  });
};

module.exports.mainMenu = mainMenu;

const { Markup } = require("telegraf");
const { createUser } = require("../services/user");

function mainMenu(isAdmin = false) {
  const buttons = [
    [
      Markup.button.callback("📱 Pulsa", "menu_pulsa"),
      Markup.button.callback("📶 Paket Data", "menu_data")
    ],
    [
      Markup.button.callback("💰 Topup Saldo", "deposit"),
      Markup.button.callback("👤 Profil", "profile")
    ],
    [
      Markup.button.callback("📜 Riwayat Transaksi", "history")
    ],
    [
      Markup.button.callback("💳 Riwayat Topup", "deposit_history")
    ]
  ];

  if (isAdmin) {
    buttons.push([
      Markup.button.callback("👑 Dashboard Admin", "admin_dashboard")
    ]);
  }

  return Markup.inlineKeyboard(buttons);
}

module.exports = (bot) => {
  bot.start(async (ctx) => {
    createUser({
      telegram_id: ctx.from.id,
      username: ctx.from.username,
      first_name: ctx.from.first_name
    });

    const isAdmin =
      String(ctx.from.id) === String(process.env.ADMIN_ID);

    await ctx.reply(
`👋 Selamat datang di Z PPOB

Layanan tersedia:
📱 Pulsa
📶 Paket Data

Silakan pilih menu:`,
      mainMenu(isAdmin)
    );
  });
};

module.exports.mainMenu = mainMenu;
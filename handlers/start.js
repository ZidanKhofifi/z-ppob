const { Markup } = require("telegraf");
const { createUser } = require("../services/user");

function mainMenu(isAdmin = false) {
  const buttons = [
    [
      Markup.button.callback("⚡ Beli Pulsa", "menu_pulsa"),
      Markup.button.callback("🌐 Paket Data", "menu_data")
    ],
    [
      Markup.button.callback("💎 Topup Saldo", "deposit"),
      Markup.button.callback("👤 Akun Saya", "profile")
    ],
    [
      Markup.button.callback("🧾 Riwayat Transaksi", "history")
    ],
    [
      Markup.button.callback("💳 Riwayat Topup", "deposit_history")
    ],
    [
      Markup.button.callback("🛟 Pusat Bantuan", "help_menu")
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
`🏪 <b>Z PPOB AUTO ORDER</b>
<i>Digital Payment Assistant</i>

<blockquote>
✨ Selamat datang, <b>${ctx.from.first_name || "Customer"}</b>

Nikmati layanan PPOB otomatis yang cepat, aman, dan aktif 24 jam.
</blockquote>

╭─「 <b>LAYANAN TERSEDIA</b> 」
├ ⚡ Pulsa All Operator
├ 🌐 Paket Data Internet
├ 💎 Topup Saldo QRIS
├ 🧾 Riwayat Transaksi
╰─ 🔄 Status transaksi otomatis

╭─「 <b>CARA ORDER</b> 」
├ 1. Topup saldo terlebih dahulu
├ 2. Pilih produk yang diinginkan
├ 3. Masukkan nomor tujuan
╰ 4. Tunggu transaksi diproses otomatis

<blockquote>
🛡️ Jika transaksi gagal, saldo akan dikembalikan otomatis.
</blockquote>

Silakan pilih menu di bawah ini 👇`,
      {
        parse_mode: "HTML",
        ...mainMenu(isAdmin)
      }
    );
  });
};

module.exports.mainMenu = mainMenu;
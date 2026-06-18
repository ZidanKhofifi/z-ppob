const { Markup } = require("telegraf");
const { mainMenu } = require("./start");

module.exports = (bot) => {
  bot.action("help_menu", async (ctx) => {
    await ctx.answerCbQuery();

    const isAdmin =
      String(ctx.from.id) === String(process.env.ADMIN_ID);

    await ctx.editMessageText(
`❓ <b>PUSAT BANTUAN Z PPOB</b>

<blockquote>
💳 Cara Topup Saldo

1. Klik menu Topup Saldo
2. Masukkan nominal deposit
3. Scan QRIS yang diberikan
4. Saldo akan masuk otomatis

━━━━━━━━━━━━

🛒 Cara Membeli Produk

1. Pilih kategori produk
2. Pilih produk yang diinginkan
3. Masukkan nomor tujuan
4. Transaksi diproses otomatis

━━━━━━━━━━━━

📌 Informasi Transaksi

• Deposit diproses otomatis 24 jam
• Transaksi menggunakan sistem realtime
• Jika transaksi gagal, saldo akan dikembalikan otomatis
</blockquote>

📞 <b>Bantuan lebih lanjut:</b>
Hubungi admin Z Store.`,
      {
  parse_mode: "HTML",
  ...Markup.inlineKeyboard([
    [
      Markup.button.url(
        "📞 Hubungi Admin",
        "https://t.me/iyaabebassdah"
      )
    ],
    [
      Markup.button.callback(
        "🏠 Kembali ke Menu",
        "home"
      )
    ]
  ])
      }
    );
  });
};
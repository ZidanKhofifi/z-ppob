const { Markup } = require("telegraf");
const { getAllUsersForBroadcast } = require("../services/user");

let waitingBroadcast = false;

function isAdmin(ctx) {
  return String(ctx.from.id) === String(process.env.ADMIN_ID);
}

module.exports = (bot) => {
  bot.action("admin_broadcast", async (ctx) => {
    if (!isAdmin(ctx)) return;

    await ctx.answerCbQuery();
    waitingBroadcast = true;

    await ctx.reply(
`📢 BROADCAST

Kirim pesan apa saja:
• Text
• Foto
• Video
• Dokumen
• Sticker
• Voice
• Audio

Pesan akan dikirim ke semua user aktif.

Ketik /cancelbroadcast untuk batal.`,
      Markup.inlineKeyboard([
        [Markup.button.callback("❌ Batal Broadcast", "cancel_broadcast")]
      ])
    );
  });

  bot.action("cancel_broadcast", async (ctx) => {
    if (!isAdmin(ctx)) return;

    await ctx.answerCbQuery();
    waitingBroadcast = false;

    await ctx.reply("❌ Broadcast dibatalkan.");
  });

  bot.command("cancelbroadcast", async (ctx) => {
    if (!isAdmin(ctx)) return;

    waitingBroadcast = false;
    await ctx.reply("❌ Broadcast dibatalkan.");
  });

  bot.on("message", async (ctx, next) => {
    if (!waitingBroadcast) return next();
    if (!isAdmin(ctx)) return next();

    waitingBroadcast = false;

    const users = getAllUsersForBroadcast();

    if (!users.length) {
      return ctx.reply("❌ Tidak ada user aktif.");
    }

    await ctx.reply(
`⏳ Mengirim broadcast...

Target: ${users.length} user`
    );

    let success = 0;
    let failed = 0;

    for (const user of users) {
      try {
        if (String(user.telegram_id) === String(ctx.from.id)) {
          continue;
        }

        await ctx.telegram.copyMessage(
          user.telegram_id,
          ctx.chat.id,
          ctx.message.message_id
        );

        success++;
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (err) {
        failed++;
      }
    }

    await ctx.reply(
`✅ BROADCAST SELESAI

Berhasil : ${success}
Gagal    : ${failed}`,
      Markup.inlineKeyboard([
        [Markup.button.callback("👑 Dashboard Admin", "admin_dashboard")]
      ])
    );
  });
};
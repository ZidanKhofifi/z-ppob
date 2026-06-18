const fs = require("fs");
const path = require("path");
const { Markup } = require("telegraf");
const { exec } = require("child_process");

const DB_PATH = path.join(__dirname, "..", "database", "zppob.sqlite");
let waitingRestore = false;

function isAdmin(ctx) {
  return String(ctx.from.id) === String(process.env.ADMIN_ID);
}

module.exports = (bot) => {
  bot.action("admin_restore_db", async (ctx) => {
    if (!isAdmin(ctx)) return;

    await ctx.answerCbQuery();

    waitingRestore = true;

    await ctx.reply(
`♻️ RESTORE DATABASE

Kirim file backup .sqlite sekarang.

⚠️ Database lama akan diganti.
Ketik /cancelrestore untuk membatalkan.`,
      Markup.inlineKeyboard([
        [Markup.button.callback("❌ Batal Restore", "cancel_restore_db")]
      ])
    );
  });

  bot.action("cancel_restore_db", async (ctx) => {
    if (!isAdmin(ctx)) return;

    await ctx.answerCbQuery();
    waitingRestore = false;

    await ctx.reply("❌ Restore database dibatalkan.");
  });

  bot.command("cancelrestore", async (ctx) => {
    if (!isAdmin(ctx)) return;

    waitingRestore = false;
    await ctx.reply("❌ Restore database dibatalkan.");
  });

  bot.on("document", async (ctx) => {
    if (!waitingRestore) return;
    if (!isAdmin(ctx)) return;

    const doc = ctx.message.document;

    if (!doc.file_name.endsWith(".sqlite")) {
      return ctx.reply("❌ File harus berekstensi .sqlite");
    }

    try {
      await ctx.reply("⏳ Mengunduh file backup...");

      const link = await ctx.telegram.getFileLink(doc.file_id);
      const response = await fetch(link.href);
      const buffer = Buffer.from(await response.arrayBuffer());

      fs.copyFileSync(DB_PATH, `${DB_PATH}.before_restore`);
      fs.writeFileSync(DB_PATH, buffer);

      waitingRestore = false;

      await ctx.reply(
`✅ Restore database berhasil.

Backup database lama disimpan:
zppob.sqlite.before_restore

♻️ Bot akan restart otomatis...`
      );

      setTimeout(() => {
        exec("pm2 restart all");
      }, 2000);

    } catch (err) {
      waitingRestore = false;

      await ctx.reply(
`❌ Restore gagal

${err.message}`
      );
    }
  });
};
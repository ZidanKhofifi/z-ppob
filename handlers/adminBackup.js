const { Markup } = require("telegraf");
const { getDatabasePath } = require("../services/backup");

function isAdmin(ctx) {
  return String(ctx.from.id) === String(process.env.ADMIN_ID);
}

module.exports = (bot) => {
  bot.action("admin_backup_db", async (ctx) => {
    if (!isAdmin(ctx)) return;

    await ctx.answerCbQuery();
    await ctx.reply("⏳ Menyiapkan backup database...");

    try {
      const dbPath = getDatabasePath();

      const date = new Date()
        .toISOString()
        .replace(/[:.]/g, "-");

      await ctx.replyWithDocument({
        source: dbPath,
        filename: `zppob_backup_${date}.sqlite`
      });

      await ctx.reply(
`✅ Backup database berhasil dikirim.`,
        Markup.inlineKeyboard([
          [Markup.button.callback("👑 Dashboard Admin", "admin_dashboard")]
        ])
      );
    } catch (err) {
      await ctx.reply(
`❌ Backup gagal

${err.message}`,
        Markup.inlineKeyboard([
          [Markup.button.callback("👑 Dashboard Admin", "admin_dashboard")]
        ])
      );
    }
  });
};
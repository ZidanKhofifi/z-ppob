const { Markup } = require("telegraf");
const { getUser } = require("../services/user");
const { getBalance } = require("../services/balance");
const { mainMenu } = require("./start");

function formatRupiah(n) {
  return Number(n || 0).toLocaleString("id-ID");
}

module.exports = (bot) => {
  
  bot.action("home", async (ctx) => {
  await ctx.answerCbQuery();

  const isAdmin =
    String(ctx.from.id) === String(process.env.ADMIN_ID);

  await ctx.editMessageText(
`🏠 MENU UTAMA

Silakan pilih layanan:`,
    mainMenu(isAdmin)
  );
});

  bot.action("profile", async (ctx) => {
    await ctx.answerCbQuery();

    const user = getUser(String(ctx.from.id));

    await ctx.editMessageText(
`👤 PROFIL

Nama     : ${ctx.from.first_name || "-"}
Username : ${ctx.from.username ? "@" + ctx.from.username : "-"}
ID       : ${ctx.from.id}
Role     : ${user?.role || "user"}
Saldo    : Rp${formatRupiah(getBalance(String(ctx.from.id)))}`,
      Markup.inlineKeyboard([
        [Markup.button.callback("💰 Deposit", "deposit")],
        [Markup.button.callback("🏠 Home", "home")]
      ])
    );
  });

  bot.action("deposit", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.scene.enter("deposit");
});
  
};

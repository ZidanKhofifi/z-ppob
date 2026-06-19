const { Markup } = require("telegraf");
const { getUser } = require("../services/user");
const { getBalance } = require("../services/balance");
const { mainMenu } = require("./start");

function formatRupiah(n) {
  return Number(n || 0).toLocaleString("id-ID");
}

function escapeHTML(text) {
  return String(text || "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = (bot) => {
  bot.action("home", async (ctx) => {
    await ctx.answerCbQuery();

    const isAdmin =
      String(ctx.from.id) === String(process.env.ADMIN_ID);

    await ctx.editMessageText(
`🏪 <b>Z PPOB AUTO ORDER</b>

<blockquote>
⚡ Layanan digital otomatis 24 jam

📱 Pulsa All Operator
📶 Paket Data Internet
💳 Topup Saldo via QRIS
🧾 Riwayat transaksi real-time
</blockquote>

Silakan pilih menu di bawah ini:`,
      {
        parse_mode: "HTML",
        ...mainMenu(isAdmin)
      }
    );
  });

  bot.action("profile", async (ctx) => {
    await ctx.answerCbQuery();

    const user = getUser(String(ctx.from.id));
    const balance = getBalance(String(ctx.from.id));

    await ctx.editMessageText(
`👤 <b>PROFIL AKUN</b>

<blockquote>
👋 Nama:
${escapeHTML(ctx.from.first_name || "-")}

🔗 Username:
${ctx.from.username ? "@" + escapeHTML(ctx.from.username) : "-"}

🆔 Telegram ID:
${ctx.from.id}

🎖️ Role:
${escapeHTML(user?.role || "user")}

💰 Saldo:
Rp${formatRupiah(balance)}

📌 Status:
${escapeHTML(user?.status || "active")}
</blockquote>

`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("💳 Topup Saldo", "deposit")
          ],
          [
            Markup.button.callback("🧾 Riwayat Transaksi", "history")
          ],
          [
            Markup.button.callback("💰 Riwayat Topup", "deposit_history")
          ],
          [
            Markup.button.callback("🏠 Home", "home")
          ]
        ])
      }
    );
  });

  bot.action("deposit", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("deposit");
  });
};
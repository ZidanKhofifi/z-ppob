const { Markup } = require("telegraf");
const { getDashboardStats } = require("../services/admin");
const { syncAllProducts } = require("../services/product");

function formatRupiah(n) {
  return Number(n || 0).toLocaleString("id-ID");
}

function isAdmin(ctx) {
  return String(ctx.from.id) === String(process.env.ADMIN_ID);
}

module.exports = (bot) => {
  bot.action("admin_dashboard", async (ctx) => {
    if (!isAdmin(ctx)) return;

    await ctx.answerCbQuery();

    const stats = getDashboardStats();

    await ctx.editMessageText(
`👑 <b>DASHBOARD ADMIN</b>

<blockquote>
👥 Total User
${stats.totalUsers} Orang

💳 Total Deposit
Rp${formatRupiah(stats.totalDeposit)}

🛒 Total Transaksi
${stats.totalTransactions} Transaksi

💰 Total Omzet
Rp${formatRupiah(stats.totalRevenue)}

⏳ Pending
${stats.pendingTransactions} Transaksi

❌ Gagal
${stats.failedTransactions} Transaksi
</blockquote>

Pilih menu admin:`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("📦 Sync Produk", "admin_sync_products"),
            Markup.button.callback("👥 List User", "admin_list_users")
          ],
          [
            Markup.button.callback("💾 Backup DB", "admin_backup_db"),
            Markup.button.callback("♻️ Restore DB", "admin_restore_db")
          ],
          [
  Markup.button.callback("📢 Broadcast", "admin_broadcast")
],
          [
            Markup.button.callback("🔄 Refresh", "admin_dashboard")
          ],
          [
            Markup.button.callback("🏠 Home", "home")
          ]
        ])
      }
    );
  });

  bot.action("admin_sync_products", async (ctx) => {
  if (!isAdmin(ctx)) return;

  await ctx.answerCbQuery();

  await ctx.editMessageText(
`⏳ <b>SINKRONISASI PRODUK</b>

Sedang mengambil produk dari SawargiPay...`,
    { parse_mode: "HTML" }
  );

  try {
    const start = Date.now();

    const result = await syncAllProducts();

    const duration = ((Date.now() - start) / 1000).toFixed(1);

    await ctx.editMessageText(
`✅ <b>SINKRONISASI SELESAI</b>

<blockquote>
📱 Pulsa
${result.pulsa} produk

📶 Paket Data
${result.data} produk

⏱️ Durasi
${duration} detik
</blockquote>`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("👑 Dashboard Admin", "admin_dashboard")],
          [Markup.button.callback("🏠 Home", "home")]
        ])
      }
    );
  } catch (err) {
    await ctx.editMessageText(
`❌ <b>SINKRONISASI GAGAL</b>

<blockquote>
${err.message}
</blockquote>`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("👑 Dashboard Admin", "admin_dashboard")]
        ])
      }
    );
  }
});
};
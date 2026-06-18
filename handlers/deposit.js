const { Markup } = require("telegraf");
const { checkQrisStatus, cancelQris } = require("../services/autogopay");
const {
  getDepositByTransactionId,
  updateDepositStatus
} = require("../services/deposit");
const { addBalance } = require("../services/balance");
const { sendNotification } = require("../services/notification");

function formatRupiah(n) {
  return Number(n || 0).toLocaleString("id-ID");
}

module.exports = (bot) => {
  bot.action(/^deposit_check_(.+)$/, async (ctx) => {
  

    const transactionId = ctx.match[1];
    const deposit = getDepositByTransactionId(transactionId);

    if (!deposit) {
      return ctx.reply("❌ Deposit tidak ditemukan.");
    }

    if (deposit.status === "paid") {
      return ctx.reply("✅ Deposit ini sudah dibayar.");
    }

    const response = await checkQrisStatus(transactionId);
    const status = String(
      response?.data?.transaction_status ||
      response?.data?.status ||
      "pending"
    ).toLowerCase();

    if (status === "pending") {
  await ctx.answerCbQuery(
    "⏳ Pembayaran belum diterima. Coba lagi setelah bayar.",
    {
      show_alert: true
    }
  );
  return;
    }

    if (status === "settlement" || status === "paid") {
      addBalance(
        deposit.telegram_id,
        deposit.amount,
        `Topup QRIS ${transactionId}`
      );

      const username = deposit.telegram_username
  ? "@" + deposit.telegram_username
  : "Tidak ada username";

await sendNotification(
  bot,
`💳 <b>TOPUP BERHASIL</b>

<blockquote>
👤 User:
${username}

🆔 Telegram ID:
${deposit.telegram_id}

💰 Nominal:
Rp${formatRupiah(deposit.amount)}

💳 Metode:
QRIS AutoGoPay

🧾 TRX ID:
${deposit.transaction_id}
</blockquote>`
);

      updateDepositStatus(transactionId, "paid");

      await ctx.deleteMessage().catch(() => {});

      return ctx.reply(
`✅ TOPUP BERHASIL

Nominal : Rp${formatRupiah(deposit.amount)}

Saldo sudah ditambahkan.`,
        Markup.inlineKeyboard([
          [Markup.button.callback("👤 Profil", "profile")],
          [Markup.button.callback("🏠 Home", "home")]
        ])
      );
    }

    if (
      status === "expired" ||
      status === "expire" ||
      status === "cancel" ||
      status === "canceled"
    ) {
      updateDepositStatus(transactionId, "cancel");

      await ctx.deleteMessage().catch(() => {});

      return ctx.reply(
`❌ QRIS sudah tidak berlaku.

Silakan buat topup baru.`,
        Markup.inlineKeyboard([
          [Markup.button.callback("💰 Topup Lagi", "deposit")],
          [Markup.button.callback("🏠 Home", "home")]
        ])
      );
    }

    return ctx.answerCbQuery(`Status: ${status}`, {
      show_alert: true
    });
  });

  bot.action(/^deposit_cancel_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();

    const transactionId = ctx.match[1];
    const deposit = getDepositByTransactionId(transactionId);

    if (!deposit) {
      return ctx.reply("❌ Deposit tidak ditemukan.");
    }

    if (deposit.status === "paid") {
      return ctx.reply("❌ Deposit sudah dibayar, tidak bisa dibatalkan.");
    }

    try {
      await cancelQris(transactionId).catch(() => {});
      updateDepositStatus(transactionId, "cancel");

      await ctx.deleteMessage().catch(() => {});

      return ctx.reply(
`❌ TOPUP DIBATALKAN

Nominal : Rp${formatRupiah(deposit.amount)}`,
        Markup.inlineKeyboard([
          [Markup.button.callback("💰 Topup Lagi", "deposit")],
          [Markup.button.callback("🏠 Home", "home")]
        ])
      );
    } catch (err) {
      return ctx.answerCbQuery(err.message, {
        show_alert: true
      });
    }
  });
};
require("dotenv").config();
const cron = require("node-cron");

const { Telegraf, session, Scenes } = require("telegraf");

const { initDB } = require("./database/db");
const {
  getPendingDeposits,
  updateDepositStatus
} = require("./services/deposit");
const { addBalance } = require("./services/balance");
const { checkTransactionStatus } = require("./services/sawargipay");
const {
  getPendingTransactions,
  updateTransactionStatus,
  markRefunded
} = require("./services/transaction");
const { checkQrisStatus } = require("./services/autogopay");
const { sendNotification } = require("./services/notification");
const { sendAutoBackup } = require("./services/backup");

const registerStart = require("./handlers/start");
const registerMenu = require("./handlers/menu");
const registerProduct = require("./handlers/product");
const registerAdmin = require("./handlers/admin");
const registerDeposit = require("./handlers/deposit");
const registerHistory = require("./handlers/history");
const registerDepositHistory = require("./handlers/depositHistory");
const registerAdminDashboard = require("./handlers/adminDashboard");
const registerAdminBackup = require("./handlers/adminBackup");
const registerAdminRestore = require("./handlers/adminRestore");
const registerAdminUsers = require("./handlers/adminUsers");
const registerAdminBroadcast = require("./handlers/adminBroadcast");

const buyProductScene = require("./scenes/buyProduct");
const depositScene = require("./scenes/deposit");

if (!process.env.BOT_TOKEN) {
  console.error("BOT_TOKEN belum diisi.");
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

const stage = new Scenes.Stage([
  buyProductScene,
  depositScene
]);

bot.use(session());

bot.use(async (ctx, next) => {
  if (ctx.chat && ctx.chat.type !== "private") {
    return;
  }

  return next();
});

bot.use(stage.middleware());

registerStart(bot);
registerMenu(bot);
registerProduct(bot);
registerAdmin(bot);
registerDeposit(bot);
registerHistory(bot);
registerDepositHistory(bot);
registerAdminDashboard(bot);
registerAdminBackup(bot);
registerAdminRestore(bot);
registerAdminUsers(bot);
registerAdminBroadcast(bot);

bot.catch((err) => {
  console.error("BOT ERROR:", err);
});

function formatRupiah(n) {
  return Number(n || 0).toLocaleString("id-ID");
}

let pollingRunning = false;

async function checkPendingDeposits() {
  if (pollingRunning) return;

  pollingRunning = true;

  try {
    const deposits = getPendingDeposits();

    if (!deposits.length) return;

    console.log(`Polling deposit pending: ${deposits.length}`);

    for (const deposit of deposits) {
      try {
        const response = await checkQrisStatus(
          deposit.transaction_id
        );

        const status = String(
          response?.data?.transaction_status ||
          response?.data?.status ||
          "pending"
        ).toLowerCase();

        if (["pending"].includes(status)) {
          continue;
        }

        if (["settlement", "paid"].includes(status)) {
          addBalance(
            deposit.telegram_id,
            Number(deposit.amount),
            `Topup QRIS ${deposit.transaction_id}`
          );

          updateDepositStatus(
            deposit.transaction_id,
            "paid"
          );

          if (deposit.qris_message_id) {
            await bot.telegram.deleteMessage(
              deposit.telegram_id,
              deposit.qris_message_id
            ).catch(() => {});
          }

          await bot.telegram.sendMessage(
            deposit.telegram_id,
`✅ TOPUP BERHASIL

Nominal:
Rp${formatRupiah(deposit.amount)}

Saldo telah ditambahkan ke akun Anda.`
          ).catch(() => {});

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

          console.log(
            "Topup polling selesai:",
            deposit.telegram_id,
            deposit.transaction_id
          );

          continue;
        }

        if (
          ["expired", "expire", "cancel", "canceled"].includes(status)
        ) {
          updateDepositStatus(
            deposit.transaction_id,
            "cancel"
          );

          console.log(
            "Deposit expired/cancel:",
            deposit.transaction_id
          );
        }
      } catch (err) {
        console.error(
          "Polling deposit error:",
          deposit.transaction_id,
          err.message
        );
      }
    }
  } catch (err) {
    console.error("Polling error:", err.message);
  } finally {
    pollingRunning = false;
  }
}

let trxPollingRunning = false;

async function checkPendingSawargiTransactions() {
  if (trxPollingRunning) return;

  trxPollingRunning = true;

  try {
    const transactions = getPendingTransactions();

    if (!transactions.length) return;

    console.log(`Polling transaksi pending: ${transactions.length}`);

    for (const trx of transactions) {
      try {
        const response = await checkTransactionStatus(trx.trx_id);

        if (!response.status) continue;

        const data = response.data;
        const status = String(data.status || "").toLowerCase();

        if (status === "pending") continue;

        updateTransactionStatus(trx.trx_id, {
          status: data.status,
          rc: data.rc || trx.rc,
          sn: data.sn || trx.sn || ""
        });

        if (status === "sukses") {
          await bot.telegram.sendMessage(
            trx.telegram_id,
`✅ TRANSAKSI BERHASIL

Produk : ${trx.product_name}
Nomor  : ${trx.target_number}
Harga  : Rp${Number(trx.sell_price).toLocaleString("id-ID")}
SN     : ${data.sn || "-"}`
          ).catch(() => {});

          const username = trx.telegram_username
  ? "@" + trx.telegram_username
  : "Tidak ada username";

await sendNotification(
  bot,
`✅ <b>TRANSAKSI BERHASIL</b>

<blockquote>
👤 User       : ${username}
🆔 ID         : ${trx.telegram_id}
📦 Produk     : ${trx.product_name}
📱 Nomor      : ${trx.target_number}
💰 Harga      : Rp${Number(trx.sell_price).toLocaleString("id-ID")}
📌 Status     : ${data.status}
📡 RC         : ${data.rc || "-"}
🔑 SN         : ${data.sn || "-"}
🧾 TRX ID     : ${trx.trx_id}
</blockquote>`
);
        }

        if (status === "gagal" && Number(trx.refunded || 0) === 0) {
          addBalance(
            trx.telegram_id,
            Number(trx.sell_price),
            `Refund transaksi gagal ${trx.product_name}`
          );

          markRefunded(trx.trx_id);

          await bot.telegram.sendMessage(
            trx.telegram_id,
`❌ TRANSAKSI GAGAL

Produk : ${trx.product_name}
Nomor  : ${trx.target_number}
Harga  : Rp${Number(trx.sell_price).toLocaleString("id-ID")}

Saldo sudah dikembalikan.`
          ).catch(() => {});

          const username = trx.telegram_username
  ? "@" + trx.telegram_username
  : "Tidak ada username";

await sendNotification(
  bot,
`❌ <b>TRANSAKSI GAGAL</b>

<blockquote>
👤 User       : ${username}
🆔 ID         : ${trx.telegram_id}
📦 Produk     : ${trx.product_name}
📱 Nomor      : ${trx.target_number}
💰 Refund     : Rp${Number(trx.sell_price).toLocaleString("id-ID")}
📌 Status     : ${data.status}
📡 RC         : ${data.rc || "-"}
🧾 TRX ID     : ${trx.trx_id}
</blockquote>`
);
        }

      } catch (err) {
        console.error("Polling trx error:", trx.trx_id, err.message);
      }
    }
  } catch (err) {
    console.error("Polling Sawargi error:", err.message);
  } finally {
    trxPollingRunning = false;
  }
}

(async () => {
  console.log("1. Init DB...");
  await initDB();
  console.log("2. DB OK");

  console.log("3. Launch Bot...");

  bot.launch({
    dropPendingUpdates: true
  }).catch((err) => {
    console.error("LAUNCH ERROR:", err);
  });

  console.log("4. Bot OK");

  cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      console.log("Menjalankan auto backup...");

      await sendAutoBackup(bot);

      console.log(
        "Auto backup berhasil dikirim ke admin."
      );

    } catch (err) {

      console.error(
        "Auto backup gagal:",
        err.message
      );

    }
  },
  {
    timezone: "Asia/Jakarta"
  }
);

  console.log(
  "Auto backup aktif setiap 00:00 WIB"
);

  setInterval(checkPendingDeposits, 3000);
  console.log("5. Polling deposit aktif setiap 3 detik");

  setInterval(checkPendingSawargiTransactions, 10000);
console.log("5b. Polling transaksi Sawargi aktif setiap 30 detik");

  console.log("6. Z PPOB Bot Online");
})();

process.once("SIGINT", () => {
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
});
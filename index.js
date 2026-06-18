require("dotenv").config();

const { Telegraf, session, Scenes } = require("telegraf");

const { initDB } = require("./database/db");
const {
  getPendingDeposits,
  updateDepositStatus
} = require("./services/deposit");
const { addBalance } = require("./services/balance");
const { checkQrisStatus } = require("./services/autogopay");

const registerStart = require("./handlers/start");
const registerMenu = require("./handlers/menu");
const registerProduct = require("./handlers/product");
const registerAdmin = require("./handlers/admin");
const registerDeposit = require("./handlers/deposit");

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
bot.use(stage.middleware());

registerStart(bot);
registerMenu(bot);
registerProduct(bot);
registerAdmin(bot);
registerDeposit(bot);

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

(async () => {
  console.log("1. Init DB...");
  await initDB();
  console.log("2. DB OK");

  console.log("3. Launch Bot...");

try {
  await bot.launch();
  console.log("4. Bot OK");
} catch (err) {
  console.error("GAGAL LAUNCH BOT:", err);
}

  setInterval(checkPendingDeposits, 3000);
  console.log("5. Polling deposit aktif setiap 3 detik");

  console.log("6. Z PPOB Bot Online");
})();

process.once("SIGINT", () => {
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
});
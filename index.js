require("dotenv").config();

const express = require("express");
const crypto = require("crypto");
const { Telegraf, session, Scenes } = require("telegraf");

const { initDB } = require("./database/db");
const {
  getDepositByTransactionId,
  updateDepositStatus
} = require("./services/deposit");
const { addBalance } = require("./services/balance");

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

function startWebhookServer(bot) {
  const app = express();

  app.post(
    "/webhook/autogopay",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      try {
        console.log("WEBHOOK MASUK");

        const signature = req.headers["x-signature"];
        const rawBody = req.body.toString();

        const expected = crypto
          .createHmac("sha256", process.env.AUTOGOPAY_API_KEY)
          .update(rawBody)
          .digest("hex");

        if (signature !== expected) {
          return res.status(401).json({
            success: false,
            message: "Invalid signature"
          });
        }

        const body = JSON.parse(rawBody);

        if (body.event !== "transaction.received") {
          return res.json({ success: true });
        }

        const tx = body.transaction;
        const transactionId = tx.id || tx.transaction_id;
        const status = String(tx.status || "").toLowerCase();

        if (!["settlement", "paid"].includes(status)) {
          return res.json({ success: true });
        }

        const deposit = getDepositByTransactionId(transactionId);

        if (!deposit) {
          console.log("Deposit tidak ditemukan:", transactionId);
          return res.json({ success: true });
        }

        if (deposit.status === "paid") {
          console.log("Deposit sudah diproses:", transactionId);
          return res.json({ success: true });
        }

        addBalance(
          deposit.telegram_id,
          Number(deposit.amount),
          `Topup QRIS ${transactionId}`
        );

        updateDepositStatus(transactionId, "paid");

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
Rp${Number(deposit.amount).toLocaleString("id-ID")}

Saldo telah ditambahkan ke akun Anda.`
        ).catch(() => {});

        console.log("Topup selesai:", deposit.telegram_id);

        return res.json({ success: true });
      } catch (err) {
        console.error("WEBHOOK ERROR:", err);
        return res.status(500).json({
          success: false,
          message: "Webhook error"
        });
      }
    }
  );

  const port = Number(process.env.WEBHOOK_PORT || process.env.PORT || 3000);

  app.listen(port, "0.0.0.0", () => {
    console.log(`Webhook server running on port ${port}`);
  });
}

(async () => {
  console.log("1. Init DB...");
  await initDB();
  console.log("2. DB OK");

  startWebhookServer(bot);

  console.log("3. Launch Bot...");
  await bot.launch();
  console.log("4. Bot OK");

  console.log("6. Z PPOB Bot Online");
})();

process.once("SIGINT", () => {
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
});
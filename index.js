require("dotenv").config();

const express = require("express");
const crypto = require("crypto");

const { Telegraf, session, Scenes } = require("telegraf");

const { initDB } = require("./database/db");
const {
  getDepositByTransactionId,
  updateDepositStatus
} = require("./services/deposit");

const {
  addBalance
} = require("./services/balance");

// Handler
const registerStart = require("./handlers/start");
const registerMenu = require("./handlers/menu");
const registerProduct = require("./handlers/product");
const registerAdmin = require("./handlers/admin");
const registerDeposit = require("./handlers/deposit");

// Scene
const buyProductScene = require("./scenes/buyProduct");
const depositScene = require("./scenes/deposit");

if (!process.env.BOT_TOKEN) {
  console.error("BOT_TOKEN belum diisi.");
  process.exit(1);
}


// =======================
// TELEGRAM BOT
// =======================

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


// =======================
// WEBHOOK AUTOGOPAY
// =======================

const app = express();

app.use(express.json());


app.post("/webhook/autogopay", async (req, res) => {

  try {

    const signature = req.headers["x-signature"];

    const expected = crypto
      .createHmac(
        "sha256",
        process.env.AUTOGOPAY_API_KEY
      )
      .update(JSON.stringify(req.body))
      .digest("hex");


    if (signature !== expected) {
      return res.status(401).json({
        success: false,
        message: "Invalid signature"
      });
    }


    const data = req.body;


    if (
      data.event === "transaction.received" &&
      data.transaction.status === "settlement"
    ) {

      const transactionId = data.transaction.id;
const amount = Number(data.transaction.amount);


console.log(
  "QRIS BERHASIL:",
  transactionId,
  amount
);


// Cari deposit
const deposit =
  getDepositByTransactionId(transactionId);


if (!deposit) {
  console.log(
    "Deposit tidak ditemukan:",
    transactionId
  );

  return res.json({
    success: true
  });
}


// Anti double webhook
if (deposit.status === "paid") {
  console.log(
    "Deposit sudah diproses:",
    transactionId
  );

  return res.json({
    success: true
  });
}


// Tambah saldo user
addBalance(
  deposit.telegram_id,
  deposit.amount,
  `Topup QRIS ${transactionId}`
);


// Update status deposit
updateDepositStatus(
  transactionId,
  "paid"
);


// Kirim notifikasi Telegram
await bot.telegram.sendMessage(
  deposit.telegram_id,
`✅ TOPUP BERHASIL

Nominal:
Rp${Number(deposit.amount).toLocaleString("id-ID")}

ID Transaksi:
${transactionId}

Saldo telah ditambahkan ke akun Anda.`
);


console.log(
  "Topup selesai:",
  deposit.telegram_id
);

    }


    res.json({
      success: true
    });


  } catch (err) {

    console.error(
      "WEBHOOK ERROR:",
      err
    );

    res.status(500).json({
      success: false
    });

  }

});

app.listen(
    process.env.PORT || 3000,
    () => {
      console.log(`Webhook server runnig`);
    }
  );

// =======================
// START APP
// =======================

(async () => {

  console.log("1. Init DB...");
  await initDB();
  console.log("2. DB OK");

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
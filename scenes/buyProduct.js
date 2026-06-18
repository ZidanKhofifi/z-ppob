const { Scenes, Markup } = require("telegraf");
const { getProductByCode } = require("../services/product");
const { getBalance, reduceBalance, addBalance } = require("../services/balance");
const { createTransaction } = require("../services/sawargipay");
const { saveTransaction } = require("../services/transaction");

function formatRupiah(n) {
  return Number(n || 0).toLocaleString("id-ID");
}

function getText(ctx) {
  return ctx.message?.text?.trim() || null;
}

module.exports = new Scenes.WizardScene(
  "buy-product",

  async (ctx) => {
    const { productCode } = ctx.scene.state;
    const product = getProductByCode(productCode);

    if (!product) {
      await ctx.reply("❌ Produk tidak ditemukan.");
      return ctx.scene.leave();
    }

    ctx.wizard.state.product = product;

    await ctx.reply(
`📱 MASUKKAN NOMOR TUJUAN

Produk:
${product.name}

Harga:
Rp${formatRupiah(product.sell_price)}

Contoh:
081234567890`
    );

    return ctx.wizard.next();
  },

  async (ctx) => {
    const target = getText(ctx);

    if (!target) return ctx.reply("❌ Masukkan nomor tujuan.");

    if (!/^08[0-9]{8,13}$/.test(target)) {
      return ctx.reply("❌ Nomor tidak valid. Gunakan format 08xxxxxxxxxx.");
    }

    const product = ctx.wizard.state.product;
    const balance = getBalance(String(ctx.from.id));

    ctx.wizard.state.target = target;

    await ctx.reply(
`🧾 KONFIRMASI PEMBELIAN

Produk : ${product.name}
Nomor  : ${target}
Harga  : Rp${formatRupiah(product.sell_price)}
Saldo  : Rp${formatRupiah(balance)}

Lanjutkan?`,
      Markup.inlineKeyboard([
        [Markup.button.callback("✅ Beli Sekarang", "confirm_buy_product")],
        [Markup.button.callback("❌ Batal", "home")]
      ])
    );

    return ctx.wizard.next();
  },

  async (ctx) => {
    if (!ctx.callbackQuery) {
      return ctx.reply("Silakan klik tombol.");
    }

    if (ctx.callbackQuery.data === "home") {
      await ctx.answerCbQuery();
      await ctx.scene.leave();
      return ctx.editMessageText("❌ Pembelian dibatalkan.");
    }

    if (ctx.callbackQuery.data !== "confirm_buy_product") {
      await ctx.answerCbQuery();
      return;
    }

    await ctx.answerCbQuery();

    const product = ctx.wizard.state.product;
    const target = ctx.wizard.state.target;
    const telegramId = String(ctx.from.id);

    const pay = reduceBalance(
      telegramId,
      Number(product.sell_price),
      `Pembelian ${product.name}`
    );

    if (!pay.success) {
      await ctx.editMessageText(
`❌ SALDO TIDAK CUKUP

Saldo Anda : Rp${formatRupiah(pay.balance)}
Harga      : Rp${formatRupiah(product.sell_price)}

Silakan topup saldo terlebih dahulu.`,
        Markup.inlineKeyboard([
          [Markup.button.callback("💰 Topup Saldo", "deposit")],
          [Markup.button.callback("🏠 Home", "home")]
        ])
      );

      return ctx.scene.leave();
    }

    await ctx.editMessageText("⏳ Memproses transaksi...");

    try {
      const response = await createTransaction({
        productCode: product.code,
        target,
        category: product.category
      });

      if (!response.status) {
        throw new Error(response.message || "Transaksi gagal.");
      }

      const trx = response.data;

      saveTransaction({
        trx_id: trx.trx_kode,
        telegram_id: telegramId,
        telegram_username: ctx.from.username || "",
        telegram_name: ctx.from.first_name || "",
        product_code: product.code,
        product_name: product.name,
        category: product.category,
        target_number: target,
        provider_price: product.provider_price,
        sell_price: product.sell_price,
        payment_amount: product.sell_price,
        used_balance: product.sell_price,
        status: trx.status,
        rc: trx.rc,
        sn: trx.sn || "",
        refunded: 0
      });

      await ctx.reply(
`✅ TRANSAKSI DIPROSES

Produk : ${product.name}
Nomor  : ${target}
Harga  : Rp${formatRupiah(product.sell_price)}
Status : ${trx.status}
RC     : ${trx.rc || "-"}
SN     : ${trx.sn || "-"}

Saldo tersisa:
Rp${formatRupiah(getBalance(telegramId))}`,
        Markup.inlineKeyboard([
          [Markup.button.callback("📜 Riwayat", "history")],
          [Markup.button.callback("🏠 Home", "home")]
        ])
      );

      return ctx.scene.leave();

    } catch (err) {
      addBalance(
        telegramId,
        Number(product.sell_price),
        `Refund gagal transaksi ${product.name}`
      );

      await ctx.reply(
`❌ TRANSAKSI GAGAL

${err.message}

Saldo sudah dikembalikan.`,
        Markup.inlineKeyboard([
          [Markup.button.callback("🏠 Home", "home")]
        ])
      );

      return ctx.scene.leave();
    }
  }
);
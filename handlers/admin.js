const { syncAllProducts } = require("../services/product");

module.exports = (bot) => {

  bot.command("syncproduk", async (ctx) => {

    // hanya admin
    if (
      String(ctx.from.id) !== 
      String(process.env.ADMIN_ID)
    ) {
      return;
    }

    await ctx.reply(
      "⏳ Mengambil produk SawargiPay..."
    );

    try {

      const result = await syncAllProducts();

      await ctx.reply(
`✅ PRODUK BERHASIL DISINKRONKAN

📱 Pulsa       : ${result.pulsa} produk
📶 Paket Data : ${result.data} produk

💰 Markup:
Rp${Number(process.env.MARKUP_PRICE || 1000).toLocaleString("id-ID")}
`
      );

    } catch (err) {

      console.error(err);

      await ctx.reply(
`❌ Gagal sync produk

${err.message}`
      );

    }

  });

};
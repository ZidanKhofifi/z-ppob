const { Markup } = require("telegraf");
const {
  getOperators,
  getProductsByOperator,
  getSubCategoriesByOperator,
  getProductsBySubCategory
} = require("../services/product");

function formatRupiah(number) {
  return Number(number || 0).toLocaleString("id-ID");
}

module.exports = (bot) => {
  bot.action("menu_pulsa", async (ctx) => {
    await ctx.answerCbQuery();

    const operators = getOperators("PULSA");

    const buttons = operators.map(op => [
      Markup.button.callback(op, `operator_PULSA_${op}`)
    ]);

    buttons.push([Markup.button.callback("🏠 Home", "home")]);

    await ctx.editMessageText(
      "📱 PILIH OPERATOR PULSA",
      Markup.inlineKeyboard(buttons)
    );
  });

  bot.action("menu_data", async (ctx) => {
    await ctx.answerCbQuery();

    const operators = getOperators("PAKET_DATA");

    const buttons = operators.map(op => [
      Markup.button.callback(op, `operator_PAKET_DATA_${op}`)
    ]);

    buttons.push([Markup.button.callback("🏠 Home", "home")]);

    await ctx.editMessageText(
      "📶 PILIH OPERATOR PAKET DATA",
      Markup.inlineKeyboard(buttons)
    );
  });

  bot.action(/^operator_PULSA_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();

    const operator = ctx.match[1];
    const products = getProductsByOperator("PULSA", operator);

    if (!products.length) {
      return ctx.editMessageText("❌ Produk pulsa tidak ditemukan.");
    }

    const buttons = products.map(product => [
      Markup.button.callback(
        `${product.name} - Rp${formatRupiah(product.sell_price)}`,
        `buy_product_${product.code}`
      )
    ]);

    buttons.push([Markup.button.callback("⬅️ Operator", "menu_pulsa")]);
    buttons.push([Markup.button.callback("🏠 Home", "home")]);

    await ctx.editMessageText(
`📱 PRODUK PULSA ${operator}

Pilih nominal:`,
      Markup.inlineKeyboard(buttons)
    );
  });

  bot.action(/^operator_PAKET_DATA_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();

    const operator = ctx.match[1];
    const categories = getSubCategoriesByOperator(operator);

    if (!categories.length) {
      return ctx.editMessageText("❌ Kategori paket tidak ditemukan.");
    }

    const buttons = categories.map(cat => [
      Markup.button.callback(cat, `data_cat_${operator}_${cat}`)
    ]);

    buttons.push([Markup.button.callback("⬅️ Operator", "menu_data")]);
    buttons.push([Markup.button.callback("🏠 Home", "home")]);

    await ctx.editMessageText(
`📶 PAKET DATA ${operator}

Pilih kategori paket:`,
      Markup.inlineKeyboard(buttons)
    );
  });

  bot.action(/^data_cat_(.+)_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();

    const operator = ctx.match[1];
    const subcategory = ctx.match[2];

    const products = getProductsBySubCategory(operator, subcategory);

    if (!products.length) {
      return ctx.editMessageText("❌ Produk tidak ditemukan.");
    }

    const buttons = products.map(product => [
      Markup.button.callback(
        `${product.name} - Rp${formatRupiah(product.sell_price)}`,
        `buy_product_${product.code}`
      )
    ]);

    buttons.push([
      Markup.button.callback("⬅️ Kategori", `operator_PAKET_DATA_${operator}`)
    ]);
    buttons.push([Markup.button.callback("🏠 Home", "home")]);

    await ctx.editMessageText(
`📦 ${operator} - ${subcategory}

Pilih produk:`,
      Markup.inlineKeyboard(buttons)
    );
  });

  bot.action(/^buy_product_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();

    await ctx.scene.enter("buy-product", {
      productCode: ctx.match[1]
    });
  });
};
const { Markup } = require("telegraf");
const { getUserDeposits } = require("../services/deposit");

function formatRupiah(n) {
  return Number(n || 0).toLocaleString("id-ID");
}

function escapeHTML(text) {
  return String(text || "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function paginate(items, page = 1, perPage = 5) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * perPage;

  return {
    data: items.slice(start, start + perPage),
    page: currentPage,
    totalPages,
    start
  };
}

function statusIcon(status) {
  const s = String(status || "").toLowerCase();

  if (s === "paid" || s === "success" || s === "settlement") return "✅";
  if (s === "cancel" || s === "canceled" || s === "expired") return "❌";
  if (s === "pending") return "⏳";

  return "ℹ️";
}

module.exports = (bot) => {
  bot.action("deposit_history", async (ctx) => {
    await ctx.answerCbQuery();
    await showDepositHistory(ctx, 1);
  });

  bot.action(/^deposit_history_page_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    await showDepositHistory(ctx, Number(ctx.match[1]));
  });
};

async function showDepositHistory(ctx, page = 1) {
  const deposits = getUserDeposits(String(ctx.from.id), 50);
  const paged = paginate(deposits, page, 5);

  if (!deposits.length) {
    return ctx.editMessageText(
`💳 <b>RIWAYAT TOPUP</b>

Belum ada riwayat topup.`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("💰 Topup Saldo", "deposit")],
          [Markup.button.callback("🏠 Home", "home")]
        ])
      }
    );
  }

  let text =
`💳 <b>RIWAYAT TOPUP</b>

Halaman ${paged.page}/${paged.totalPages}
Total topup: ${deposits.length}`;

  paged.data.forEach((dep, i) => {
    text += `

<blockquote>
${paged.start + i + 1}. ${statusIcon(dep.status)} <b>QRIS AutoGoPay</b>

💰 Nominal : Rp${formatRupiah(dep.amount)}
📌 Status  : ${escapeHTML(dep.status)}
🧾 TRX ID  : ${escapeHTML(dep.transaction_id)}
</blockquote>`;
  });

  const nav = [];

  if (paged.page > 1) {
    nav.push(Markup.button.callback("⬅️ Prev", `deposit_history_page_${paged.page - 1}`));
  }

  if (paged.page < paged.totalPages) {
    nav.push(Markup.button.callback("Next ➡️", `deposit_history_page_${paged.page + 1}`));
  }

  const buttons = [];

  if (nav.length) buttons.push(nav);

  buttons.push([Markup.button.callback("🔄 Refresh", `deposit_history_page_${paged.page}`)]);
  buttons.push([Markup.button.callback("💰 Topup Saldo", "deposit")]);
  buttons.push([Markup.button.callback("🏠 Home", "home")]);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard(buttons)
  });
}
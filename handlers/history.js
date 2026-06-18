const { Markup } = require("telegraf");
const {
  getUserTransactions,
  getTransactionByTrxId
} = require("../services/transaction");

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

  if (s === "sukses" || s === "success") return "✅";
  if (s === "gagal" || s === "failed") return "❌";
  if (s === "pending") return "⏳";

  return "ℹ️";
}

module.exports = (bot) => {
  bot.action("history", async (ctx) => {
    await ctx.answerCbQuery();
    await showHistory(ctx, 1);
  });

  bot.action(/^history_page_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    await showHistory(ctx, Number(ctx.match[1]));
  });

  bot.action(/^trx_detail_(.+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();

    const trxId = ctx.match[1];
    const page = Number(ctx.match[2]);

    const trx = getTransactionByTrxId(trxId);

    if (!trx) {
      return ctx.editMessageText(
        "❌ Transaksi tidak ditemukan.",
        Markup.inlineKeyboard([
          [Markup.button.callback("⬅️ Kembali", `history_page_${page}`)],
          [Markup.button.callback("🏠 Home", "home")]
        ])
      );
    }

    await ctx.editMessageText(
`📦 <b>DETAIL TRANSAKSI</b>

<blockquote>
${statusIcon(trx.status)} <b>${escapeHTML(trx.product_name)}</b>

🧾 TRX ID:
${escapeHTML(trx.trx_id)}

📱 Nomor:
${escapeHTML(trx.target_number)}

📂 Kategori:
${escapeHTML(trx.category)}

💰 Harga:
Rp${formatRupiah(trx.sell_price)}

📌 Status:
${escapeHTML(trx.status)}

📡 RC:
${escapeHTML(trx.rc || "-")}

🔑 SN:
${escapeHTML(trx.sn || "-")}

🕒 Dibuat:
${escapeHTML(trx.created_at || "-")}

♻️ Update:
${escapeHTML(trx.updated_at || "-")}
</blockquote>`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("⬅️ Kembali", `history_page_${page}`)],
          [Markup.button.callback("🏠 Home", "home")]
        ])
      }
    );
  });
};

async function showHistory(ctx, page = 1) {
  const transactions = getUserTransactions(String(ctx.from.id), 50);
  const paged = paginate(transactions, page, 5);

  if (!transactions.length) {
    return ctx.editMessageText(
`📜 <b>RIWAYAT TRANSAKSI</b>

Belum ada transaksi.`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🏠 Home", "home")]
        ])
      }
    );
  }

  let text =
`📜 <b>RIWAYAT TRANSAKSI</b>

Halaman ${paged.page}/${paged.totalPages}
Total transaksi: ${transactions.length}`;

  paged.data.forEach((trx, i) => {
    text += `

<blockquote>
${paged.start + i + 1}. ${statusIcon(trx.status)} <b>${escapeHTML(trx.product_name)}</b>

📱 Nomor : ${escapeHTML(trx.target_number)}
💰 Harga : Rp${formatRupiah(trx.sell_price)}
📌 Status: ${escapeHTML(trx.status)}
🧾 TRX   : ${escapeHTML(trx.trx_id)}
</blockquote>`;
  });

  const nav = [];

  if (paged.page > 1) {
    nav.push(Markup.button.callback("⬅️ Prev", `history_page_${paged.page - 1}`));
  }

  if (paged.page < paged.totalPages) {
    nav.push(Markup.button.callback("Next ➡️", `history_page_${paged.page + 1}`));
  }

  const buttons = [];

  paged.data.forEach((trx, i) => {
    buttons.push([
      Markup.button.callback(
        `📄 Detail ${paged.start + i + 1}`,
        `trx_detail_${trx.trx_id}_${paged.page}`
      )
    ]);
  });

  if (nav.length) buttons.push(nav);

  buttons.push([Markup.button.callback("🔄 Refresh", `history_page_${paged.page}`)]);
  buttons.push([Markup.button.callback("🏠 Home", "home")]);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard(buttons)
  });
}
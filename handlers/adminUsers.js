const { Markup } = require("telegraf");
const { getAllUsers } = require("../services/user");

function formatRupiah(n) {
  return Number(n || 0).toLocaleString("id-ID");
}

function escapeHTML(text) {
  return String(text || "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isAdmin(ctx) {
  return String(ctx.from.id) === String(process.env.ADMIN_ID);
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

module.exports = (bot) => {
  bot.action("admin_list_users", async (ctx) => {
    if (!isAdmin(ctx)) return;

    await ctx.answerCbQuery();
    await showUsers(ctx, 1);
  });

  bot.action(/^admin_users_page_(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;

    await ctx.answerCbQuery();
    await showUsers(ctx, Number(ctx.match[1]));
  });
};

async function showUsers(ctx, page = 1) {
  const users = getAllUsers(100);
  const paged = paginate(users, page, 5);

  if (!users.length) {
    return ctx.editMessageText(
`👥 <b>LIST USER</b>

Belum ada user.`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("👑 Dashboard Admin", "admin_dashboard")]
        ])
      }
    );
  }

  let text =
`👥 <b>LIST USER</b>

Halaman ${paged.page}/${paged.totalPages}
Total user: ${users.length}`;

  paged.data.forEach((user, i) => {
    const username = user.username
      ? "@" + user.username
      : "Tidak ada username";

    text += `

<blockquote>
${paged.start + i + 1}. 👤 <b>${escapeHTML(username)}</b>

🆔 ID:
${escapeHTML(user.telegram_id)}

💰 Saldo:
Rp${formatRupiah(user.balance)}

📌 Status:
${escapeHTML(user.status)}

📅 Join:
${escapeHTML(user.created_at)}
</blockquote>`;
  });

  const nav = [];

  if (paged.page > 1) {
    nav.push(Markup.button.callback("⬅️ Prev", `admin_users_page_${paged.page - 1}`));
  }

  if (paged.page < paged.totalPages) {
    nav.push(Markup.button.callback("Next ➡️", `admin_users_page_${paged.page + 1}`));
  }

  const buttons = [];

  if (nav.length) buttons.push(nav);

  buttons.push([Markup.button.callback("🔄 Refresh", `admin_users_page_${paged.page}`)]);
  buttons.push([Markup.button.callback("👑 Dashboard Admin", "admin_dashboard")]);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard(buttons)
  });
}
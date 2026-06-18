const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(
  __dirname,
  "..",
  "database",
  "zppob.sqlite"
);

function getDatabasePath() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(
      "File database tidak ditemukan."
    );
  }

  return DB_PATH;
}

async function sendAutoBackup(bot) {
  const dbPath = getDatabasePath();

  const date = new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, "-");

  await bot.telegram.sendDocument(
    process.env.ADMIN_ID,
    {
      source: dbPath,
      filename: `zppob_auto_backup_${date}.sqlite`
    },
    {
      caption:
`💾 <b>AUTO BACKUP DATABASE</b>

<blockquote>
🤖 Bot      : Z PPOB
📦 Database : zppob.sqlite
📅 Waktu    : ${new Date().toLocaleString("id-ID", {
  timeZone: "Asia/Jakarta"
})}
</blockquote>

Backup otomatis harian berhasil dibuat.`,
      parse_mode: "HTML"
    }
  );
}

module.exports = {
  getDatabasePath,
  sendAutoBackup
};
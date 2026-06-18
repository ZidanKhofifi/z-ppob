const { getDB, saveDB } = require("../database/db");

function rowToObject(result) {
  if (!result.length) return null;

  const row = result[0];

  return Object.fromEntries(
    row.columns.map((col, i) => [col, row.values[0][i]])
  );
}

function createUser(data) {
  const db = getDB();

  const role =
    String(data.telegram_id) === String(process.env.ADMIN_ID)
      ? "admin"
      : "user";

  db.run(
    `
    INSERT OR IGNORE INTO users
    (telegram_id, username, first_name, role)
    VALUES (?, ?, ?, ?)
    `,
    [
      String(data.telegram_id),
      data.username || "",
      data.first_name || "",
      role
    ]
  );

  saveDB();
}

function getUser(telegramId) {
  const db = getDB();

  const result = db.exec(
    `
    SELECT *
    FROM users
    WHERE telegram_id = '${String(telegramId)}'
    LIMIT 1
    `
  );

  return rowToObject(result);
}

function getAllUsers() {
  const db = getDB();

  const result = db.exec(`
    SELECT *
    FROM users
    ORDER BY id DESC
  `);

  if (!result.length) return [];

  const rows = result[0];

  return rows.values.map(row =>
    Object.fromEntries(
      rows.columns.map((col, i) => [col, row[i]])
    )
  );
}

function getAllUsersForBroadcast() {
  const db = getDB();

  const result = db.exec(`
    SELECT *
    FROM users
    WHERE status = 'active'
    ORDER BY id ASC
  `);

  return rowToObject(result);
}

module.exports = {
  createUser,
  getUser,
  getAllUsers,
  getAllUsersForBroadcast
};

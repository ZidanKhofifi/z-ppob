const { getDB, saveDB } = require("../database/db");
const { getUser } = require("./user");

function getBalance(telegramId) {
  const user = getUser(telegramId);
  return Number(user?.balance || 0);
}

function addBalance(telegramId, amount, description = "Tambah saldo") {
  const db = getDB();

  const before = getBalance(telegramId);
  const after = before + Number(amount);

  db.run(
    `
    UPDATE users
    SET balance = ?
    WHERE telegram_id = ?
    `,
    [after, String(telegramId)]
  );

  db.run(
    `
    INSERT INTO balance_logs
    (telegram_id, type, amount, balance_before, balance_after, description)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      String(telegramId),
      "credit",
      Number(amount),
      before,
      after,
      description
    ]
  );

  saveDB();

  return {
    success: true,
    balance: after
  };
}

function reduceBalance(telegramId, amount, description = "Potong saldo") {
  const db = getDB();

  const before = getBalance(telegramId);
  const nominal = Number(amount);

  if (before < nominal) {
    return {
      success: false,
      balance: before,
      message: "Saldo tidak cukup"
    };
  }

  const after = before - nominal;

  db.run(
    `
    UPDATE users
    SET balance = ?
    WHERE telegram_id = ?
    `,
    [after, String(telegramId)]
  );

  db.run(
    `
    INSERT INTO balance_logs
    (telegram_id, type, amount, balance_before, balance_after, description)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      String(telegramId),
      "debit",
      nominal,
      before,
      after,
      description
    ]
  );

  saveDB();

  return {
    success: true,
    balance: after
  };
}

module.exports = {
  getBalance,
  addBalance,
  reduceBalance
};

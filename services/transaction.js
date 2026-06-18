const { getDB, saveDB } = require("../database/db");

function rowsToObjects(result) {
  if (!result.length) return [];

  const rows = result[0];

  return rows.values.map(row =>
    Object.fromEntries(
      rows.columns.map((col, i) => [col, row[i]])
    )
  );
}

function saveTransaction(data) {
  const db = getDB();

  db.run(
    `
    INSERT OR REPLACE INTO transactions
    (
      trx_id,
      telegram_id,
      product_code,
      product_name,
      category,
      target_number,
      provider_price,
      sell_price,
      status,
      rc,
      sn,
      refunded,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    [
      data.trx_id,
      String(data.telegram_id),
      data.product_code,
      data.product_name,
      data.category,
      data.target_number,
      Number(data.provider_price || 0),
      Number(data.sell_price || 0),
      data.status || "pending",
      data.rc || "",
      data.sn || "",
      Number(data.refunded || 0)
    ]
  );

  saveDB();
}

function getTransactionByTrxId(trxId) {
  const db = getDB();

  const result = db.exec(`
    SELECT *
    FROM transactions
    WHERE trx_id = '${trxId}'
    LIMIT 1
  `);

  const rows = rowsToObjects(result);
  return rows[0] || null;
}

function updateTransactionStatus(trxId, data) {
  const db = getDB();

  db.run(
    `
    UPDATE transactions
    SET status = ?,
        rc = ?,
        sn = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE trx_id = ?
    `,
    [
      data.status,
      data.rc || "",
      data.sn || "",
      trxId
    ]
  );

  saveDB();
}

function markRefunded(trxId) {
  const db = getDB();

  db.run(
    `
    UPDATE transactions
    SET refunded = 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE trx_id = ?
    `,
    [trxId]
  );

  saveDB();
}

function getUserTransactions(telegramId, limit = 10) {
  const db = getDB();

  const result = db.exec(`
    SELECT *
    FROM transactions
    WHERE telegram_id = '${String(telegramId)}'
    ORDER BY id DESC
    LIMIT ${Number(limit)}
  `);

  return rowsToObjects(result);
}

module.exports = {
  saveTransaction,
  getTransactionByTrxId,
  updateTransactionStatus,
  markRefunded,
  getUserTransactions
};

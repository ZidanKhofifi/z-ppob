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

function createDeposit(data) {
  const db = getDB();

  db.run(
    `
    INSERT INTO deposits
    (
      telegram_id,
      telegram_username,
      telegram_name,
      transaction_id,
      order_id,
      amount,
      status,
      purpose,
      checkout_data,
      qr_url,
      checkout_url
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      String(data.telegram_id),
      data.telegram_username || "",
      data.telegram_name || "",
      data.transaction_id,
      data.order_id || "",
      Number(data.amount),
      data.status || "pending",
      data.purpose || "deposit",
      data.checkout_data
        ? JSON.stringify(data.checkout_data)
        : null,
      data.qr_url || "",
      data.checkout_url || ""
    ]
  );

  saveDB();
}

function getDepositByTransactionId(transactionId) {
  const db = getDB();

  const result = db.exec(`
    SELECT *
    FROM deposits
    WHERE transaction_id = '${transactionId}'
    LIMIT 1
  `);

  const rows = rowsToObjects(result);
  return rows[0] || null;
}

function updateDepositStatus(transactionId, status) {
  const db = getDB();

  db.run(
    `
    UPDATE deposits
    SET status = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE transaction_id = ?
    `,
    [
      status,
      transactionId
    ]
  );

  saveDB();
}

function updateDepositMessageId(transactionId, messageId) {
  const db = getDB();

  db.run(
    `
    UPDATE deposits
    SET qris_message_id = ?
    WHERE transaction_id = ?
    `,
    [
      Number(messageId),
      transactionId
    ]
  );

  saveDB();
}

function getPendingDeposits() {
  const db = getDB();

  const result = db.exec(`
    SELECT *
    FROM deposits
    WHERE status = 'pending'
    ORDER BY id DESC
  `);

  return rowsToObjects(result);
}

module.exports = {
  createDeposit,
  getDepositByTransactionId,
  updateDepositStatus,
  updateDepositMessageId,
  getPendingDeposits
};
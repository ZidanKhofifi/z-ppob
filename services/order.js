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

function generateOrderId() {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `ORD-${date}-${random}`;
}

function createOrder(data) {
  const db = getDB();

  const orderId = generateOrderId();

  db.run(
    `
    INSERT INTO orders
    (
      order_id,
      telegram_id,
      telegram_username,
      telegram_name,
      product_code,
      product_name,
      category,
      target_number,
      provider_price,
      sell_price,
      paid_amount,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      orderId,
      String(data.telegram_id),
      data.telegram_username || "",
      data.telegram_name || "",
      data.product_code,
      data.product_name,
      data.category,
      data.target_number,
      Number(data.provider_price || 0),
      Number(data.sell_price || 0),
      Number(data.paid_amount || 0),
      data.status || "waiting_payment"
    ]
  );

  saveDB();

  return getOrderById(orderId);
}

function getOrderById(orderId) {
  const db = getDB();

  const result = db.exec(`
    SELECT *
    FROM orders
    WHERE order_id = '${orderId}'
    LIMIT 1
  `);

  const rows = rowsToObjects(result);
  return rows[0] || null;
}

function updateOrderStatus(orderId, status) {
  const db = getDB();

  db.run(
    `
    UPDATE orders
    SET status = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE order_id = ?
    `,
    [status, orderId]
  );

  saveDB();
}

function updateOrderPaidAmount(orderId, amount) {
  const db = getDB();

  db.run(
    `
    UPDATE orders
    SET paid_amount = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE order_id = ?
    `,
    [Number(amount), orderId]
  );

  saveDB();
}

function getPendingOrders(limit = 20) {
  const db = getDB();

  const result = db.exec(`
    SELECT *
    FROM orders
    WHERE status IN ('waiting_payment', 'processing')
    ORDER BY id DESC
    LIMIT ${Number(limit)}
  `);

  return rowsToObjects(result);
}

module.exports = {
  createOrder,
  getOrderById,
  updateOrderStatus,
  updateOrderPaidAmount,
  getPendingOrders
};
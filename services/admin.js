const { getDB } = require("../database/db");

function rowsToObjects(result) {
  if (!result.length) return [];

  const rows = result[0];

  return rows.values.map(row =>
    Object.fromEntries(
      rows.columns.map((col, i) => [col, row[i]])
    )
  );
}

function getDashboardStats() {
  const db = getDB();

  const users = db.exec(`
    SELECT COUNT(*) as total
    FROM users
  `);

  const deposits = db.exec(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM deposits
    WHERE status = 'paid'
  `);

  const transactions = db.exec(`
    SELECT COUNT(*) as total
    FROM transactions
  `);

  const revenue = db.exec(`
    SELECT COALESCE(SUM(sell_price), 0) as total
    FROM transactions
    WHERE LOWER(status) = 'sukses'
  `);

  const pending = db.exec(`
    SELECT COUNT(*) as total
    FROM transactions
    WHERE LOWER(status) = 'pending'
  `);

  const failed = db.exec(`
    SELECT COUNT(*) as total
    FROM transactions
    WHERE LOWER(status) = 'gagal'
  `);


  return {
    totalUsers:
      rowsToObjects(users)[0]?.total || 0,

    totalDeposit:
      rowsToObjects(deposits)[0]?.total || 0,

    totalTransactions:
      rowsToObjects(transactions)[0]?.total || 0,

    totalRevenue:
      rowsToObjects(revenue)[0]?.total || 0,

    pendingTransactions:
      rowsToObjects(pending)[0]?.total || 0,

    failedTransactions:
      rowsToObjects(failed)[0]?.total || 0
  };
}

module.exports = {
  getDashboardStats
};
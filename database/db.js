const fs = require("fs");
const initSqlJs = require("sql.js");

let SQL;
let db;

const DB_FILE = "./database/zppob.sqlite";

async function initDB() {
  SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE,
      username TEXT,
      first_name TEXT,
      balance INTEGER DEFAULT 0,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT,
      category TEXT,
      operator TEXT,
      subcategory TEXT DEFAULT '',
      provider_price INTEGER DEFAULT 0,
      sell_price INTEGER DEFAULT 0,
      description TEXT,
      status TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE,
      telegram_id TEXT,
      telegram_username TEXT,
      telegram_name TEXT,
      product_code TEXT,
      product_name TEXT,
      category TEXT,
      target_number TEXT,
      provider_price INTEGER DEFAULT 0,
      sell_price INTEGER DEFAULT 0,
      paid_amount INTEGER DEFAULT 0,
      status TEXT DEFAULT 'waiting_payment',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trx_id TEXT UNIQUE,
      order_id TEXT,
      telegram_id TEXT,
      telegram_username TEXT,
      telegram_name TEXT,
      product_code TEXT,
      product_name TEXT,
      category TEXT,
      target_number TEXT,
      provider_price INTEGER DEFAULT 0,
      sell_price INTEGER DEFAULT 0,
      payment_amount INTEGER DEFAULT 0,
      used_balance INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      rc TEXT,
      sn TEXT,
      refunded INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS balance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT,
      type TEXT,
      amount INTEGER,
      balance_before INTEGER,
      balance_after INTEGER,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT,
      telegram_username TEXT,
      telegram_name TEXT,
      transaction_id TEXT UNIQUE,
      order_id TEXT,
      amount INTEGER,
      status TEXT DEFAULT 'pending',
      purpose TEXT DEFAULT 'deposit',
      checkout_data TEXT,
      qr_url TEXT,
      checkout_url TEXT,
      qris_message_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  migrateDB();
  saveDB();
}

function migrateDB() {
  const productColumns = getTableColumns("products");

  if (!productColumns.includes("subcategory")) {
    db.run(`ALTER TABLE products ADD COLUMN subcategory TEXT DEFAULT ''`);
  }

  const orderColumns = getTableColumns("orders");

  if (!orderColumns.includes("telegram_username")) {
    db.run(`ALTER TABLE orders ADD COLUMN telegram_username TEXT`);
  }

  if (!orderColumns.includes("telegram_name")) {
    db.run(`ALTER TABLE orders ADD COLUMN telegram_name TEXT`);
  }

  const trxColumns = getTableColumns("transactions");

  if (!trxColumns.includes("order_id")) {
    db.run(`ALTER TABLE transactions ADD COLUMN order_id TEXT`);
  }

  if (!trxColumns.includes("telegram_username")) {
    db.run(`ALTER TABLE transactions ADD COLUMN telegram_username TEXT`);
  }

  if (!trxColumns.includes("telegram_name")) {
    db.run(`ALTER TABLE transactions ADD COLUMN telegram_name TEXT`);
  }

  if (!trxColumns.includes("payment_amount")) {
    db.run(`ALTER TABLE transactions ADD COLUMN payment_amount INTEGER DEFAULT 0`);
  }

  if (!trxColumns.includes("used_balance")) {
    db.run(`ALTER TABLE transactions ADD COLUMN used_balance INTEGER DEFAULT 0`);
  }

  const depositColumns = getTableColumns("deposits");

  if (!depositColumns.includes("telegram_username")) {
    db.run(`ALTER TABLE deposits ADD COLUMN telegram_username TEXT`);
  }

  if (!depositColumns.includes("telegram_name")) {
    db.run(`ALTER TABLE deposits ADD COLUMN telegram_name TEXT`);
  }

  if (!depositColumns.includes("purpose")) {
    db.run(`ALTER TABLE deposits ADD COLUMN purpose TEXT DEFAULT 'deposit'`);
  }

  if (!depositColumns.includes("checkout_data")) {
    db.run(`ALTER TABLE deposits ADD COLUMN checkout_data TEXT`);
  }
}

function getTableColumns(table) {
  const result = db.exec(`PRAGMA table_info(${table})`);
  if (!result.length) return [];
  return result[0].values.map(row => row[1]);
}

function getDB() {
  if (!db) {
    throw new Error("Database belum diinit.");
  }

  return db;
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

module.exports = {
  initDB,
  getDB,
  saveDB
};
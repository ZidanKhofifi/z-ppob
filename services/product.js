const { getDB, saveDB } = require("../database/db");
const { getProducts } = require("./sawargipay");
const { detectSubCategory } = require("./category");

function rowsToObjects(result) {
  if (!result.length) return [];

  const rows = result[0];

  return rows.values.map(row =>
    Object.fromEntries(
      rows.columns.map((col, i) => [col, row[i]])
    )
  );
}

function getMarkup() {
  return Number(process.env.MARKUP_PRICE || 1000);
}

async function syncProductsByCategory(category) {
  const response = await getProducts(category);

  if (!response.status) {
    throw new Error(response.message || "Gagal mengambil produk.");
  }

  const db = getDB();
  const markup = getMarkup();

  for (const item of response.data || []) {
    const providerPrice = Number(item.harga || 0);
    const sellPrice = providerPrice + markup;

    const subcategory =
      item.kategori === "PAKET_DATA"
        ? detectSubCategory(item.nama, item.operator)
        : "";

    db.run(
      `
      INSERT OR REPLACE INTO products
      (
        code,
        name,
        category,
        operator,
        subcategory,
        provider_price,
        sell_price,
        description,
        status,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [
        item.kode,
        item.nama,
        item.kategori,
        item.operator,
        subcategory,
        providerPrice,
        sellPrice,
        item.keterangan || "",
        item.status || ""
      ]
    );
  }

  saveDB();

  return {
    success: true,
    total: response.data?.length || 0
  };
}

async function syncAllProducts() {
  const pulsa = await syncProductsByCategory("PULSA");
  const data = await syncProductsByCategory("PAKET_DATA");

  return {
    pulsa: pulsa.total,
    data: data.total
  };
}

function getOperators(category) {
  const db = getDB();

  const result = db.exec(`
    SELECT DISTINCT operator
    FROM products
    WHERE category = '${category}'
      AND status = 'Aktif'
    ORDER BY operator ASC
  `);

  return rowsToObjects(result).map(row => row.operator);
}

function getSubCategoriesByOperator(operator) {
  const db = getDB();

  const result = db.exec(`
    SELECT DISTINCT subcategory
    FROM products
    WHERE category = 'PAKET_DATA'
      AND operator = '${operator}'
      AND status = 'Aktif'
      AND subcategory != ''
    ORDER BY subcategory ASC
  `);

  return rowsToObjects(result).map(row => row.subcategory);
}

function getProductsByOperator(category, operator) {
  const db = getDB();

  const result = db.exec(`
    SELECT *
    FROM products
    WHERE category = '${category}'
      AND operator = '${operator}'
      AND status = 'Aktif'
    ORDER BY sell_price ASC
  `);

  return rowsToObjects(result);
}

function getProductsBySubCategory(operator, subcategory) {
  const db = getDB();

  const result = db.exec(`
    SELECT *
    FROM products
    WHERE category = 'PAKET_DATA'
      AND operator = '${operator}'
      AND subcategory = '${subcategory}'
      AND status = 'Aktif'
    ORDER BY sell_price ASC
  `);

  return rowsToObjects(result);
}

function getProductByCode(code) {
  const db = getDB();

  const result = db.exec(`
    SELECT *
    FROM products
    WHERE code = '${code}'
    LIMIT 1
  `);

  const rows = rowsToObjects(result);
  return rows[0] || null;
}

module.exports = {
  syncAllProducts,
  syncProductsByCategory,
  getOperators,
  getSubCategoriesByOperator,
  getProductsByOperator,
  getProductsBySubCategory,
  getProductByCode
};
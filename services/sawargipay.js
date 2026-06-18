const axios = require("axios");

const BASE_URL =
  process.env.SAWARGIPAY_BASE_URL ||
  "https://h2h.sawargipay.cloud";

function headers() {
  return {
    headers: {
      "Api-Key": process.env.SAWARGIPAY_API_KEY,
      "Content-Type": "application/json"
    },
    timeout: 90000
  };
}

async function getProducts(category) {
  const res = await axios.post(
    `${BASE_URL}/produk`,
    {
      kategori: category
    },
    headers()
  );

  return res.data;
}

async function createTransaction({ productCode, target, category }) {
  try {
    const res = await axios.post(
      `${BASE_URL}/transaksi`,
      {
        produk_kode: productCode,
        tujuan: target,
        kategori: category
      },
      headers()
    );

    return res.data;

  } catch (err) {

    console.log("===== SAWARGI CREATE TRANSACTION ERROR =====");

    if (err.response) {
      console.log("Status:", err.response.status);
      console.log("Data:", err.response.data);
    } else {
      console.log("Error:", err.message);
    }

    console.log("REQUEST:");
    console.log({
      produk_kode: productCode,
      tujuan: target,
      kategori: category
    });

    throw new Error(
      err.response?.data?.message ||
      err.message
    );
  }
}

async function checkTransactionStatus(trxId) {
  const res = await axios.post(
    `${BASE_URL}/status`,
    {
      trx_id: trxId
    },
    headers()
  );

  return res.data;
}

module.exports = {
  getProducts,
  createTransaction,
  checkTransactionStatus
};

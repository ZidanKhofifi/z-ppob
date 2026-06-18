const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "database", "zppob.sqlite");

function getDatabasePath() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error("File database tidak ditemukan.");
  }

  return DB_PATH;
}

module.exports = {
  getDatabasePath
};
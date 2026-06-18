function detectSubCategory(name, operator = "") {
  const text = String(name || "").toLowerCase();
  const op = String(operator || "").toLowerCase();

  if (op === "telkomsel") return telkomsel(text);
  if (op === "xl") return xl(text);
  if (op === "indosat") return indosat(text);
  if (op === "tri" || op === "three") return tri(text);
  if (op === "axis") return axis(text);
  if (op === "smartfren") return smartfren(text);
  if (op === "byu" || op === "by.u") return byu(text);

  return "Lainnya";
}

function telkomsel(text) {
  if (text.includes("cek paket")) return "Cek Paket";
  if (text.includes("combo sakti")) return "Combo Sakti";
  if (text.includes("flash")) return "Data Flash";
  if (text.includes("mini")) return "Data Mini";
  if (text.includes("mingguan")) return "Mingguan";
  if (text.includes("super seru")) return "Super Seru";
  if (text.includes("videomax")) return "Videomax";
  if (text.includes("ruang guru")) return "Ruang Guru";
  if (text.includes("youtube")) return "Youtube";
  if (text.includes("ketengan")) return "Ilped (Ilmu Pedia)";
  return "Lainnya";
}

function xl(text) {
  if (text.includes("xtra kuota")) return "IFLIX";
  if (text.includes("xtra combo")) return "Xtra Combo";
  if (text.includes("flex")) return "Flex";
  if (text.includes("unlimited")) return "Unlimited";
  if (text.includes("edukasi") || text.includes("edu")) return "Edukasi";
  if (text.includes("conference")) return "Conference";
  return "Lainnya";
}

function indosat(text) {
  if (text.includes("freedom apps")) return "Freedom Apps Fun";
  if (text.includes("freedom internet")) return "Freedom Internet";
  if (text.includes("freedom")) return "Freedom";
  if (text.includes("yellow")) return "Yellow";
  if (text.includes("ramadan") || text.includes("ramadhan")) return "Ramadan";
  return "Lainnya";
}

function tri(text) {
  if (text.includes("happy")) return "Happy";
  if (text.includes("always on") || text.includes("aon")) return "Always On";
  if (text.includes("getmore")) return "Getmore";
  if (text.includes("pure")) return "Pure";
  return "Lainnya";
}

function axis(text) {
  if (text.includes("warnet")) return "Warnet";
  if (text.includes("bronet")) return "Bronet";
  if (text.includes("owsem")) return "Owsem";
  if (text.includes("apps") || text.includes("games")) return "Apps & Games";
  if (text.includes("ss") || text.includes("aigoss")) return "AIGO SS";
  if (text.includes("boostr") || text.includes("edukasi")) return "Boostr Edukasi";
  if (text.includes("mini")) return "Mini";
  if (text.includes("harian")) return "Harian";

  return "Lainnya";
}



function smartfren(text) {
  if (text.includes("nonstop")) return "Nonstop";
  if (text.includes("unlimited")) return "Unlimited";
  if (text.includes("voucher")) return "Voucher";
  if (text.includes("internet")) return "Internet";
  return "Lainnya";
}

function byu(text) {
  if (text.includes("ggwp")) return "GGWP";
  if (text.includes("topping")) return "Topping";
  if (text.includes("instagram")) return "Instagram";
  if (text.includes("youtube")) return "Youtube";
  if (text.includes("tiktok")) return "TikTok";
  return "Lainnya";
}

module.exports = {
  detectSubCategory
};
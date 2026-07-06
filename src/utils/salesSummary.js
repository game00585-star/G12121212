export function getField(item, names) {
  for (const name of names) {
    if (item[name] !== undefined && item[name] !== null && item[name] !== "") return item[name];
  }
  return "";
}

export const fieldNames = {
  date: ["วันที่", "เธงเธฑเธเธ—เธตเน", "เน€เธเธเน€เธเธ‘เน€เธยเน€เธโ€”เน€เธเธ•เน€เธย"],
  billNo: ["เลขบิล", "เน€เธฅเธเธเธดเธฅ", "เน€เธโฌเน€เธเธ…เน€เธยเน€เธยเน€เธเธ”เน€เธเธ…"],
  branch: ["สาขา", "เธชเธฒเธเธฒ", "เน€เธเธเน€เธเธ’เน€เธยเน€เธเธ’"],
  employee: ["พนักงาน", "เธเธเธฑเธเธเธฒเธ", "เน€เธยเน€เธยเน€เธเธ‘เน€เธยเน€เธยเน€เธเธ’เน€เธย"],
  barcode: ["รหัสสินค้า", "เธฃเธซเธฑเธชเธชเธดเธเธเนเธฒ", "เน€เธเธเน€เธเธเน€เธเธ‘เน€เธเธเน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’"],
  product: ["สินค้า", "เธชเธดเธเธเนเธฒ", "เน€เธเธเน€เธเธ”เน€เธยเน€เธยเน€เธยเน€เธเธ’"],
  qty: ["จำนวน", "เธเธณเธเธงเธ", "เน€เธยเน€เธเธ“เน€เธยเน€เธเธเน€เธย"],
  totalQty: ["จำนวนรวม", "จำนวนที่ต้องการขาย", "เธเธณเธเธงเธเธฃเธงเธก", "เน€เธยเน€เธเธ“เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธเน€เธเธ"],
  freeQty: ["จำนวนแถม", "แถม", "เธเธณเธเธงเธเนเธ–เธก", "เน€เธยเน€เธเธ“เน€เธยเน€เธเธเน€เธยเน€เธยเน€เธโ€“เน€เธเธ"],
  promo: ["โปรโมชั่น", "โปร", "เนเธเธฃเนเธกเธเธฑเนเธ", "เน€เธยเน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธเธ‘เน€เธยเน€เธย"],
  discountPercent: ["ส่วนลด", "ส่วนลด %", "เธชเนเธงเธเธฅเธ”", "เน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธเธ…เน€เธโ€"],
  beforeDiscount: ["รวมก่อนลด", "เธฃเธงเธกเธเนเธญเธเธฅเธ”", "เน€เธเธเน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธเธเน€เธยเน€เธเธ…เน€เธโ€"],
  netTotal: ["รวม", "รวมสุทธิ", "เธฃเธงเธก", "เน€เธเธเน€เธเธเน€เธเธ"],
  status: ["สถานะ", "เธชเธ–เธฒเธเธฐ", "เน€เธเธเน€เธโ€“เน€เธเธ’เน€เธยเน€เธเธ"],
};

export function numberField(item, names) {
  const parsed = Number(getField(item, names) || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatPromo(item) {
  const promo = String(getField(item, fieldNames.promo) || "-").trim();
  const discountPercent = numberField(item, fieldNames.discountPercent);
  if (/^\d+\+\d+$/.test(promo)) return promo;
  if (discountPercent > 0) return "ลด " + discountPercent + "%";
  return promo && promo !== "-" ? promo : "-";
}

export function splitPromoQty(totalQty, promoName) {
  const promo = String(promoName || "").trim();
  const qty = Number(totalQty || 0);
  if (!/^\d+\+\d+$/.test(promo) || qty <= 0) return { soldQty: qty, freeQty: 0 };
  const [buy, free] = promo.split("+").map(Number);
  const setSize = buy + free;
  if (!buy || setSize <= 0) return { soldQty: qty, freeQty: 0 };
  const fullSets = Math.floor(qty / setSize);
  const remainder = qty % setSize;
  const soldQty = fullSets * buy + Math.min(remainder, buy);
  return { soldQty, freeQty: Math.max(0, qty - soldQty) };
}

export function calcSaleRow(item) {
  const explicitTotalQty = numberField(item, fieldNames.totalQty);
  const savedQty = numberField(item, fieldNames.qty);
  const savedFreeQty = numberField(item, fieldNames.freeQty);
  const promo = String(getField(item, fieldNames.promo) || "").trim();
  const isFreePromo = /^\d+\+\d+$/.test(promo);
  const totalQty = explicitTotalQty || (isFreePromo ? savedQty + savedFreeQty : savedQty);
  let soldQty = savedQty;
  let freeQty = isFreePromo ? savedFreeQty : 0;
  if (isFreePromo) {
    const split = splitPromoQty(totalQty, promo);
    soldQty = split.soldQty;
    freeQty = split.freeQty;
  } else if (!soldQty) {
    soldQty = Math.max(0, totalQty - freeQty);
  }
  const beforeDiscount = numberField(item, fieldNames.beforeDiscount);
  const netTotal = numberField(item, fieldNames.netTotal);
  const discountBaht = beforeDiscount - netTotal;
  return { totalQty, soldQty, freeQty, beforeDiscount, netTotal, discountBaht };
}

export function isCanceledStatus(status) {
  const text = String(status || "").toLowerCase();
  return text.includes("\u0e22\u0e01") || text.includes("cancel");
}

export function buildSummaryResult({ salesHistory, summaryStartDate, summaryEndDate, summaryBranch, role, currentUser }) {
  const result = salesHistory.filter((item) => {
    const rawDate = getField(item, fieldNames.date);
    const itemDate = rawDate ? new Date(rawDate).toISOString().split("T")[0] : "";
    const itemBranch = getField(item, fieldNames.branch);
    const status = getField(item, fieldNames.status);
    const branchOk = role === "Admin" || role === "Audit" ? summaryBranch === "" || itemBranch === summaryBranch : itemBranch === currentUser?.branch;
    const startOk = summaryStartDate === "" || itemDate >= summaryStartDate;
    const endOk = summaryEndDate === "" || itemDate <= summaryEndDate;
    return startOk && endOk && branchOk && !isCanceledStatus(status);
  }).reduce((acc, item) => {
    const branch = getField(item, fieldNames.branch);
    const barcode = getField(item, fieldNames.barcode);
    const product = getField(item, fieldNames.product);
    const promo = formatPromo(item);
    const key = branch + "_" + (barcode || product);
    const row = calcSaleRow(item);
    if (!acc[key]) {
      acc[key] = { branch, barcode, product, promoList: [], soldQty: 0, freeQty: 0, totalQty: 0, beforeDiscount: 0, discountBaht: 0, netTotal: 0 };
    }
    if (promo && promo !== "-" && !acc[key].promoList.includes(promo)) acc[key].promoList.push(promo);
    acc[key].soldQty += row.soldQty;
    acc[key].freeQty += row.freeQty;
    acc[key].totalQty += row.totalQty;
    acc[key].beforeDiscount += row.beforeDiscount;
    acc[key].discountBaht += row.discountBaht;
    acc[key].netTotal += row.netTotal;
    return acc;
  }, {});
  return Object.values(result).map((item) => ({ ...item, promo: item.promoList.length > 0 ? item.promoList.join(", ") : "-" }));
}

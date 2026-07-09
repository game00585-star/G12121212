import React from "react";
import Pagination from "../components/Pagination";
import { cardStyle, inputStyle, saveBtn, cancelBtn, modalOverlay, modalBox, printBtn } from "../styles/uiStyles";
import { calcSaleRow, fieldNames, formatPromo, getField, isCanceledStatus, numberField } from "../utils/salesSummary";

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  } catch {
    return value;
  }
}

function cleanText(value) {
  return String(value || "").toLowerCase().trim();
}

function IconBag() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 8V7a5 5 0 0 1 10 0v1" />
      <path d="M5 8h14l-1 12H6L5 8Z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />
    </svg>
  );
}

function billSearchText(item) {
  const row = calcSaleRow(item);
  return [
    getField(item, fieldNames.billNo),
    getField(item, fieldNames.date),
    formatDate(getField(item, fieldNames.date)),
    getField(item, fieldNames.branch),
    getField(item, fieldNames.employee),
    getField(item, fieldNames.barcode),
    getField(item, fieldNames.product),
    formatPromo(item),
    row.soldQty,
    row.freeQty,
    row.totalQty,
    row.beforeDiscount,
    row.netTotal,
  ].join(" ");
}

export default function HistoryPage(props) {
  const {
    historySearch, setHistorySearch, startDate, setStartDate, endDate, setEndDate,
    role, branchFilter, setBranchFilter, salesHistory, currentUser, exportExcel,
    setCancelBillNo, cancelBillNo, cancelPassword, setCancelPassword,
    approveCancelBill, reprintBill, systemSettings,
  } = props;
  const [page, setPage] = React.useState(1);
  const [filterOpen, setFilterOpen] = React.useState(true);
  const pageSize = Math.max(5, Number(systemSettings?.pageSize || 30));
  const rowHeight = Number(systemSettings?.rowHeight || 56);
  const tableWidth = Number(systemSettings?.tableWidth || 1180);
  const tableHeight = Number(systemSettings?.tableHeight || 620);

  const branchOptions = React.useMemo(() => (
    [...new Set(salesHistory.map((item) => getField(item, fieldNames.branch)))]
      .filter(Boolean)
  ), [salesHistory]);

  const bills = React.useMemo(() => {
    const searchText = cleanText(historySearch);
    const grouped = salesHistory.filter((item) => {
      const billNo = String(getField(item, fieldNames.billNo) || "");
      const barcode = String(getField(item, fieldNames.barcode) || "");
      const product = String(getField(item, fieldNames.product) || "");
      const rawDate = getField(item, fieldNames.date);
      const itemDate = rawDate ? new Date(rawDate) : new Date();
      const branch = getField(item, fieldNames.branch);
      const startOk = startDate === "" || itemDate >= new Date(startDate);
      const endOk = endDate === "" || itemDate <= new Date(endDate + " 23:59:59");
      const branchOk = role === "Admin" || role === "Audit" ? branchFilter === "" || branch === branchFilter : branch === currentUser?.branch;
      const searchSource = billSearchText(item);
      const searchOk = searchText === "" || cleanText(searchSource).includes(searchText);
      return searchOk && startOk && endOk && branchOk;
    }).reduce((acc, item) => {
      const billNo = getField(item, fieldNames.billNo);
      if (!acc[billNo]) acc[billNo] = [];
      acc[billNo].push(item);
      return acc;
    }, {});
    return Object.values(grouped).reverse();
  }, [branchFilter, currentUser?.branch, endDate, historySearch, role, salesHistory, startDate]);

  const totalPages = Math.max(1, Math.ceil(bills.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageBills = bills.slice((safePage - 1) * pageSize, safePage * pageSize);

  React.useEffect(() => setPage(1), [historySearch, startDate, endDate, branchFilter, pageSize]);

  const clearSearch = () => {
    setHistorySearch("");
    setStartDate("");
    setEndDate("");
    setBranchFilter("");
  };

  return (
    <div style={cardStyle} className="report-page">
      <div className="report-head">
        <div className="report-title">
          <span className="report-icon"><IconBag /></span>
          <div>
            <h2>รายการขาย</h2>
            <p>แสดง {pageBills.length} จาก {bills.length} บิล</p>
          </div>
        </div>
        <button style={saveBtn} className="excel-button" onClick={exportExcel}>Export Excel</button>
      </div>

      <div className="report-search-row">
        <div className="report-search-box">
          <IconSearch />
          <input placeholder="ค้นหาเลขบิล / ชื่อลูกค้า / Barcode / สินค้า" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
        </div>
      </div>

      <div className="report-filter-card">
        <button type="button" className="report-filter-title" onClick={() => setFilterOpen((next) => !next)}>
          <IconFilter />
          <span>Filter</span>
          <small>{filterOpen ? "ซ่อน" : "แสดง"}</small>
        </button>
        {filterOpen && (
          <div className="report-filter-grid">
            <label>
              วันที่เริ่มต้น
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label>
              วันที่สิ้นสุด
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
            {(role === "Admin" || role === "Audit") && (
              <label>
                สาขา
                <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
                  <option value="">ทุกสาขา</option>
                  {branchOptions.map((branch, index) => <option key={index} value={branch}>{branch}</option>)}
                </select>
              </label>
            )}
            <button type="button" className="report-clear-button" onClick={clearSearch}>ล้างค่า</button>
          </div>
        )}
      </div>

      {pageBills.map((bill, index) => {
        const first = bill[0];
        const billNo = getField(first, fieldNames.billNo);
        const status = getField(first, fieldNames.status);
        const billBefore = bill.reduce((sum, item) => sum + numberField(item, fieldNames.beforeDiscount), 0);
        const billNet = bill.reduce((sum, item) => sum + numberField(item, fieldNames.netTotal), 0);
        const billDiscount = billBefore - billNet;
        return (
          <section className="report-bill-card" key={billNo || index}>
            <div className="report-bill-head">
              <span className="report-row-icon"><IconBag /></span>
              <div className="report-bill-meta">
                <strong>เลขบิล : {billNo}</strong>
                <div className="report-bill-sub">
                  <span>วันที่ : {formatDate(getField(first, fieldNames.date))}</span>
                  <span>สาขา : {getField(first, fieldNames.branch)}</span>
                  <span>พนักงาน : {getField(first, fieldNames.employee)}</span>
                </div>
              </div>
              <div className="bill-actions">
                <button style={printBtn} onClick={() => reprintBill(bill)}>Reprint</button>
                {!isCanceledStatus(status) && <button style={cancelBtn} onClick={() => setCancelBillNo(String(billNo))}>ยกเลิกบิล</button>}
              </div>
            </div>
            <div className="data-table-wrap" style={{ maxHeight: tableHeight, overflow: "auto" }}>
              <table className="data-table sales-table" style={{ minWidth: tableWidth }}>
                <thead>
                  <tr>
                    <th>Barcode</th>
                    <th>สินค้า</th>
                    <th>ขายจริง</th>
                    <th>แถม</th>
                    <th>จำนวนรวม</th>
                    <th>ราคา/หน่วย</th>
                    <th>โปร</th>
                    <th>ส่วนลด %</th>
                    <th>รวมก่อนลด</th>
                    <th>ส่วนลด (บาท)</th>
                    <th>รวมสุทธิ</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.map((item, rowIndex) => {
                    const row = calcSaleRow(item);
                    return (
                      <tr key={rowIndex} style={{ height: rowHeight }}>
                        <td>{getField(item, fieldNames.barcode)}</td>
                        <td>{getField(item, fieldNames.product)}</td>
                        <td>{row.soldQty}</td>
                        <td>{row.freeQty}</td>
                        <td>{row.totalQty}</td>
                        <td>{numberField(item, ["ราคา", "เธฃเธฒเธเธฒ", "เน€เธเธเน€เธเธ’เน€เธยเน€เธเธ’"]).toFixed(2)}</td>
                        <td>{formatPromo(item)}</td>
                        <td>{numberField(item, fieldNames.discountPercent) > 0 ? numberField(item, fieldNames.discountPercent) + "%" : "-"}</td>
                        <td>{row.beforeDiscount.toFixed(2)}</td>
                        <td className={row.discountBaht < 0 ? "negative-number" : ""}>{row.discountBaht.toFixed(2)}</td>
                        <td>{row.netTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="8">รวมบิล</td>
                    <td>{billBefore.toFixed(2)}</td>
                    <td className={billDiscount < 0 ? "negative-number" : ""}>{billDiscount.toFixed(2)}</td>
                    <td>{billNet.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        );
      })}

      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />

      {cancelBillNo && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h2>ยืนยันยกเลิกบิล</h2>
            <div style={{ marginTop: 10, fontWeight: "bold" }}>เลขบิล : {cancelBillNo}</div>
            <input type="password" placeholder="กรอกรหัส Manager" value={cancelPassword} onChange={(e) => setCancelPassword(e.target.value)} style={inputStyle} />
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button style={cancelBtn} onClick={approveCancelBill}>ยืนยันยกเลิก</button>
              <button style={saveBtn} onClick={() => { setCancelBillNo(null); setCancelPassword(""); }}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

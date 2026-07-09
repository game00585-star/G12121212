import React from "react";
import Pagination from "../components/Pagination";
import { cardStyle, inputStyle, saveBtn, cancelBtn, modalOverlay, modalBox, printBtn } from "../styles/uiStyles";
import { calcSaleRow, fieldNames, formatPromo, getField, isCanceledStatus, numberField } from "../utils/salesSummary";

const DEFAULT_PAGE_SIZE = 30;

function productText(item) {
  return String(getField(item, fieldNames.product) || "").toLowerCase();
}

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  } catch {
    return value;
  }
}

export default function HistoryPage(props) {
  const {
    historySearch, setHistorySearch, startDate, setStartDate, endDate, setEndDate,
    role, branchFilter, setBranchFilter, salesHistory, currentUser, exportExcel,
    setCancelBillNo, cancelBillNo, cancelPassword, setCancelPassword,
    approveCancelBill, reprintBill,
  } = props;
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [searchMode, setSearchMode] = React.useState("all");

  const bills = React.useMemo(() => {
    const grouped = salesHistory.filter((item) => {
      const billNo = String(getField(item, fieldNames.billNo) || "");
      const rawDate = getField(item, fieldNames.date);
      const itemDate = rawDate ? new Date(rawDate) : new Date();
      const branch = getField(item, fieldNames.branch);
      const startOk = startDate === "" || itemDate >= new Date(startDate);
      const endOk = endDate === "" || itemDate <= new Date(endDate + " 23:59:59");
      const branchOk = role === "Admin" || role === "Audit" ? branchFilter === "" || branch === branchFilter : branch === currentUser?.branch;
      const searchText = String(historySearch || "").toLowerCase().trim();
      const billOk = billNo.toLowerCase().includes(searchText);
      const productOk = productText(item).includes(searchText);
      const searchOk =
        searchText === "" ||
        (searchMode === "bill" && billOk) ||
        (searchMode === "product" && productOk) ||
        (searchMode === "all" && (billOk || productOk));
      return searchOk && startOk && endOk && branchOk;
    }).reduce((acc, item) => {
      const billNo = getField(item, fieldNames.billNo);
      if (!acc[billNo]) acc[billNo] = [];
      acc[billNo].push(item);
      return acc;
    }, {});
    return Object.values(grouped).reverse();
  }, [branchFilter, currentUser?.branch, endDate, historySearch, role, salesHistory, searchMode, startDate]);

  const safePageSize = Math.max(5, Number(pageSize || DEFAULT_PAGE_SIZE));
  const totalPages = Math.max(1, Math.ceil(bills.length / safePageSize));
  const safePage = Math.min(page, totalPages);
  const pageBills = bills.slice((safePage - 1) * safePageSize, safePage * safePageSize);

  React.useEffect(() => setPage(1), [historySearch, startDate, endDate, branchFilter, searchMode, safePageSize]);

  const clearSearch = () => {
    setHistorySearch("");
    setSearchMode("all");
    setStartDate("");
    setEndDate("");
    setBranchFilter("");
  };

  return (
    <div style={cardStyle}>
      <div className="page-head">
        <div>
          <h2>รายการขาย</h2>
          <p>แสดง {pageBills.length} จาก {bills.length} บิล</p>
        </div>
        <button style={saveBtn} onClick={exportExcel}>Export Excel</button>
      </div>

      <div className="filter-grid">
        <input placeholder="ค้นหาเลขบิล / ชื่อสินค้า" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} style={inputStyle} />
        <button type="button" style={{ ...cancelBtn, marginTop: 15 }} onClick={clearSearch}>ล้างค้นหา</button>
      </div>

      <div style={{ marginTop: 12, fontWeight: 900 }}>Filter</div>
      <div className="filter-grid">
        <select value={searchMode} onChange={(e) => setSearchMode(e.target.value)} style={inputStyle}>
          <option value="all">ค้นหาเลขบิล + ชื่อสินค้า</option>
          <option value="bill">ค้นหาเลขบิล</option>
          <option value="product">ค้นหาชื่อสินค้า</option>
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
        {(role === "Admin" || role === "Audit") && (
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={inputStyle}>
            <option value="">ทุกสาขา</option>
            {[...new Set(salesHistory.map((item) => getField(item, fieldNames.branch)))]
              .filter(Boolean)
              .map((branch, index) => <option key={index} value={branch}>{branch}</option>)}
          </select>
        )}
      </div>

      <details style={{ marginTop: 14 }}>
        <summary style={{ cursor: "pointer", fontWeight: 900 }}>ตั้งค่า</summary>
        <div className="filter-grid" style={{ marginTop: 6 }}>
          <input type="number" min="5" step="5" placeholder="จำนวนบิลต่อหน้า" value={pageSize} onChange={(e) => setPageSize(e.target.value)} style={inputStyle} />
        </div>
      </details>

      {pageBills.map((bill, index) => {
        const first = bill[0];
        const billNo = getField(first, fieldNames.billNo);
        const status = getField(first, fieldNames.status);
        const billBefore = bill.reduce((sum, item) => sum + numberField(item, fieldNames.beforeDiscount), 0);
        const billNet = bill.reduce((sum, item) => sum + numberField(item, fieldNames.netTotal), 0);
        const billDiscount = billBefore - billNet;
        return (
          <section className="bill-card sale-history-card" key={billNo || index}>
            <div className="bill-head">
              <div className="bill-meta">
                <strong>เลขบิล : {billNo}</strong>
                <div>วันที่ : {formatDate(getField(first, fieldNames.date))}</div>
                <div>สาขา : {getField(first, fieldNames.branch)}</div>
                <div>พนักงาน : {getField(first, fieldNames.employee)}</div>
              </div>
              <div className="bill-actions">
                <button style={printBtn} onClick={() => reprintBill(bill)}>Reprint</button>
                {!isCanceledStatus(status) && <button style={cancelBtn} onClick={() => setCancelBillNo(String(billNo))}>ยกเลิกบิล</button>}
              </div>
            </div>
            <div className="data-table-wrap">
              <table className="data-table sales-table">
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
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.map((item, rowIndex) => {
                    const row = calcSaleRow(item);
                    return (
                      <tr key={rowIndex}>
                        <td>{getField(item, fieldNames.barcode)}</td>
                        <td>{getField(item, fieldNames.product)}</td>
                        <td>{row.soldQty}</td>
                        <td>{row.freeQty}</td>
                        <td>{row.totalQty}</td>
                        <td>{numberField(item, ["ราคา", "เธฃเธฒเธเธฒ"]).toFixed(2)}</td>
                        <td>{formatPromo(item)}</td>
                        <td>{numberField(item, fieldNames.discountPercent) > 0 ? numberField(item, fieldNames.discountPercent) + "%" : "-"}</td>
                        <td>{row.beforeDiscount.toFixed(2)}</td>
                        <td>{row.discountBaht.toFixed(2)}</td>
                        <td>{row.netTotal.toFixed(2)}</td>
                        <td>{getField(item, fieldNames.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="8">รวมบิล</td>
                    <td>{billBefore.toFixed(2)}</td>
                    <td>{billDiscount.toFixed(2)}</td>
                    <td>{billNet.toFixed(2)}</td>
                    <td></td>
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

import React from "react";
import Pagination from "../components/Pagination";
import { cardStyle, inputStyle, saveBtn, printBtn } from "../styles/uiStyles";
import { fieldNames, getField } from "../utils/salesSummary";

const PAGE_SIZE = 30;

export default function SummaryPage(props) {
  const { summaryStartDate, setSummaryStartDate, summaryEndDate, setSummaryEndDate, role, summaryBranch, setSummaryBranch, salesHistory, exportSummaryExcel, exportDailySummaryPdf, printDailySummary, summaryResult } = props;
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(summaryResult.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = summaryResult.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const totals = summaryResult.reduce((acc, item) => ({ soldQty: acc.soldQty + Number(item.soldQty || 0), freeQty: acc.freeQty + Number(item.freeQty || 0), totalQty: acc.totalQty + Number(item.totalQty || 0), beforeDiscount: acc.beforeDiscount + Number(item.beforeDiscount || 0), discountBaht: acc.discountBaht + Number(item.discountBaht || 0), netTotal: acc.netTotal + Number(item.netTotal || 0) }), { soldQty: 0, freeQty: 0, totalQty: 0, beforeDiscount: 0, discountBaht: 0, netTotal: 0 });
  React.useEffect(() => setPage(1), [summaryStartDate, summaryEndDate, summaryBranch, summaryResult.length]);
  return <div style={cardStyle}>
    <div className="page-head"><div><h2>สรุปยอดขาย</h2><p>แสดง {pageRows.length} จาก {summaryResult.length} รายการ</p></div><div className="summary-actions"><button style={saveBtn} onClick={exportSummaryExcel}>Export Summary Excel</button><button style={printBtn} onClick={printDailySummary}>Daily Print</button></div></div>
    <div className="filter-grid"><label>วันที่เริ่มต้น<input type="date" value={summaryStartDate} onChange={(e) => setSummaryStartDate(e.target.value)} style={inputStyle} /></label><label>วันที่สิ้นสุด<input type="date" value={summaryEndDate} onChange={(e) => setSummaryEndDate(e.target.value)} style={inputStyle} /></label>{(role === "Admin" || role === "Audit") && <label>สาขา<select value={summaryBranch} onChange={(e) => setSummaryBranch(e.target.value)} style={inputStyle}><option value="">ทุกสาขา</option>{[...new Set(salesHistory.map((x) => getField(x, fieldNames.branch)))].filter(Boolean).map((branch, idx) => <option key={idx} value={branch}>{branch}</option>)}</select></label>}</div>
    <div className="summary-total-grid"><div><span>ขายจริง</span><strong>{totals.soldQty}</strong></div><div><span>แถม</span><strong>{totals.freeQty}</strong></div><div><span>จำนวนรวม</span><strong>{totals.totalQty}</strong></div><div><span>รวมก่อนลด</span><strong>{totals.beforeDiscount.toFixed(2)}</strong></div><div><span>ส่วนลด</span><strong>{totals.discountBaht.toFixed(2)}</strong></div><div><span>รวมสุทธิ</span><strong>{totals.netTotal.toFixed(2)}</strong></div></div>
    <div className="data-table-wrap"><table className="data-table summary-table"><thead><tr><th>สาขา</th><th>Barcode</th><th>สินค้า</th><th>โปร</th><th>ขายจริง</th><th>แถม</th><th>จำนวนรวม</th><th>รวมก่อนลด</th><th>ส่วนลด (บาท)</th><th>รวมสุทธิ</th></tr></thead><tbody>{pageRows.map((item, index) => <tr key={index}><td>{item.branch}</td><td>{item.barcode}</td><td>{item.product}</td><td>{item.promo}</td><td>{item.soldQty}</td><td>{item.freeQty}</td><td>{item.totalQty}</td><td>{Number(item.beforeDiscount).toFixed(2)}</td><td>{Number(item.discountBaht).toFixed(2)}</td><td>{Number(item.netTotal).toFixed(2)}</td></tr>)}</tbody><tfoot><tr><td colSpan="4">รวมทั้งหมด</td><td>{totals.soldQty}</td><td>{totals.freeQty}</td><td>{totals.totalQty}</td><td>{totals.beforeDiscount.toFixed(2)}</td><td>{totals.discountBaht.toFixed(2)}</td><td>{totals.netTotal.toFixed(2)}</td></tr></tfoot></table></div>
    <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
  </div>;
}

import React from "react";
import Pagination from "../components/Pagination";

import {
  cardStyle,
  tableStyle,
  thStyle,
  tdStyle,
} from "../styles/uiStyles";

const PAGE_SIZE = 30;

function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date)) return String(dateString);
    return date.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  } catch {
    return String(dateString);
  }
}

function formatData(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function AuditLogPage({ auditLogs }) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(auditLogs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageLogs = auditLogs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  React.useEffect(() => setPage(1), [auditLogs.length]);

  return (
    <div style={cardStyle}>
      <div className="page-head">
        <div>
          <h2>Audit Log</h2>
          <p>แสดง {pageLogs.length} จาก {auditLogs.length} รายการ</p>
        </div>
      </div>

      <div style={{ overflowX: "auto", width: "100%" }}>
        <table style={{ ...tableStyle, minWidth: 1280 }}>
          <thead>
            <tr>
              <th style={thStyle}>เวลา</th>
              <th style={thStyle}>User ID</th>
              <th style={thStyle}>Username</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Branch</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Target Type</th>
              <th style={thStyle}>Target ID</th>
              <th style={thStyle}>IP ผู้ใช้งาน</th>
              <th style={thStyle}>User Agent</th>
              <th style={thStyle}>Old Data</th>
              <th style={thStyle}>New Data</th>
            </tr>
          </thead>
          <tbody>
            {pageLogs.map((log, index) => (
              <tr key={log.id || log.auditLogId || index}>
                <td style={tdStyle}>{formatDate(log.createdAt)}</td>
                <td style={tdStyle}>{log.userId || "-"}</td>
                <td style={tdStyle}>{log.username || "-"}</td>
                <td style={tdStyle}>{log.role || "-"}</td>
                <td style={tdStyle}>{log.branch || "-"}</td>
                <td style={tdStyle}>{log.action || "-"}</td>
                <td style={tdStyle}>{log.targetType || "-"}</td>
                <td style={tdStyle}>{log.targetId || "-"}</td>
                <td style={tdStyle}>{log.ipAddress || "-"}</td>
                <td style={{ ...tdStyle, maxWidth: 280, whiteSpace: "normal", wordBreak: "break-word" }}>{log.userAgent || "-"}</td>
                <td style={{ ...tdStyle, maxWidth: 260, whiteSpace: "normal", wordBreak: "break-word" }}>{formatData(log.oldData)}</td>
                <td style={{ ...tdStyle, maxWidth: 260, whiteSpace: "normal", wordBreak: "break-word" }}>{formatData(log.newData)}</td>
              </tr>
            ))}
            {pageLogs.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan="12">ยังไม่มี Audit Log</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

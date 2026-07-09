import React from "react";
import Pagination from "../components/Pagination";

import {
  cardStyle,
  inputStyle,
  cancelBtn,
} from "../styles/uiStyles";

const auditTh = {
  background: "#fff4bf",
  color: "#0f172a",
  padding: "12px 14px",
  borderBottom: "1px solid #e7d98a",
  textAlign: "left",
  fontSize: 14,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const auditTd = {
  padding: "12px 14px",
  borderBottom: "1px solid #e5e7eb",
  color: "#111827",
  fontSize: 14,
  lineHeight: 1.4,
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

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

function cleanText(value) {
  return String(value || "").toLowerCase().trim();
}

function actionColor(action) {
  const text = String(action || "").toLowerCase();
  if (text.includes("failed") || text.includes("cancel")) return "#fee2e2";
  if (text.includes("login") || text.includes("create")) return "#dcfce7";
  if (text.includes("export") || text.includes("import") || text.includes("print")) return "#dbeafe";
  return "#f1f5f9";
}

export default function AuditLogPage({ auditLogs, systemSettings }) {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState({
    time: "",
    username: "",
    role: "",
    branch: "",
    action: "",
    targetType: "",
    targetId: "",
    ipAddress: "",
  });
  const rowHeight = Number(systemSettings?.rowHeight || 56);
  const tableWidth = Number(systemSettings?.tableWidth || 1180);
  const tableHeight = Number(systemSettings?.tableHeight || 620);
  const pageSize = Number(systemSettings?.pageSize || 30);

  const filteredLogs = React.useMemo(() => {
    const searchText = cleanText(search);
    return auditLogs.filter((log) => {
      const timeText = cleanText(`${log.createdAt || ""} ${formatDate(log.createdAt)}`);
      const values = {
        time: timeText,
        username: cleanText(log.username),
        role: cleanText(log.role),
        branch: cleanText(log.branch),
        action: cleanText(log.action),
        targetType: cleanText(log.targetType),
        targetId: cleanText(log.targetId),
        ipAddress: cleanText(log.ipAddress),
      };
      const searchOk = searchText === "" || Object.values(values).some((value) => value.includes(searchText));
      const filterOk =
        values.time.includes(cleanText(filters.time)) &&
        values.username.includes(cleanText(filters.username)) &&
        values.role.includes(cleanText(filters.role)) &&
        values.branch.includes(cleanText(filters.branch)) &&
        values.action.includes(cleanText(filters.action)) &&
        values.targetType.includes(cleanText(filters.targetType)) &&
        values.targetId.includes(cleanText(filters.targetId)) &&
        values.ipAddress.includes(cleanText(filters.ipAddress));
      return searchOk && filterOk;
    });
  }, [auditLogs, filters, search]);

  const safePageSize = Math.max(5, Number(pageSize || 30));
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / safePageSize));
  const safePage = Math.min(page, totalPages);
  const pageLogs = filteredLogs.slice((safePage - 1) * safePageSize, safePage * safePageSize);

  React.useEffect(() => setPage(1), [filteredLogs.length, safePageSize]);

  const updateFilter = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };
  const auditCellStyle = {
    ...auditTd,
    height: rowHeight,
  };

  const clearSearch = () => {
    setSearch("");
    setFilters({
      time: "",
      username: "",
      role: "",
      branch: "",
      action: "",
      targetType: "",
      targetId: "",
      ipAddress: "",
    });
  };

  return (
    <div style={cardStyle}>
      <div className="page-head">
        <div>
          <h2>Audit Log</h2>
          <p>แสดง {pageLogs.length} จาก {filteredLogs.length} รายการ</p>
        </div>
      </div>

      <div className="filter-grid">
        <input placeholder="ค้นหาเรียลไทม์" value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle} />
        <button type="button" style={{ ...cancelBtn, marginTop: 15 }} onClick={clearSearch}>ล้างค้นหา</button>
      </div>

      <div style={{ marginTop: 12, fontWeight: 900 }}>Filter</div>
      <div className="filter-grid">
        <input placeholder="เวลา" value={filters.time} onChange={(e) => updateFilter("time", e.target.value)} style={inputStyle} />
        <input placeholder="Username" value={filters.username} onChange={(e) => updateFilter("username", e.target.value)} style={inputStyle} />
        <input placeholder="Role" value={filters.role} onChange={(e) => updateFilter("role", e.target.value)} style={inputStyle} />
        <input placeholder="Branch" value={filters.branch} onChange={(e) => updateFilter("branch", e.target.value)} style={inputStyle} />
        <input placeholder="Action" value={filters.action} onChange={(e) => updateFilter("action", e.target.value)} style={inputStyle} />
        <input placeholder="Target Type" value={filters.targetType} onChange={(e) => updateFilter("targetType", e.target.value)} style={inputStyle} />
        <input placeholder="Target ID" value={filters.targetId} onChange={(e) => updateFilter("targetId", e.target.value)} style={inputStyle} />
        <input placeholder="IP" value={filters.ipAddress} onChange={(e) => updateFilter("ipAddress", e.target.value)} style={inputStyle} />
      </div>

      <div style={{ overflow: "auto", width: "100%", maxHeight: tableHeight, border: "1px solid #e5e7eb", borderRadius: 12, marginTop: 16 }}>
        <table style={{ width: "100%", minWidth: tableWidth, borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={auditTh}>เวลา</th>
              <th style={auditTh}>Username</th>
              <th style={auditTh}>Role</th>
              <th style={auditTh}>Branch</th>
              <th style={auditTh}>Action</th>
              <th style={auditTh}>Target Type</th>
              <th style={auditTh}>Target ID</th>
              <th style={auditTh}>IP ผู้ใช้งาน</th>
            </tr>
          </thead>
          <tbody>
            {pageLogs.map((log, index) => (
              <tr key={log.id || log.auditLogId || index} style={{ background: index % 2 === 0 ? "#ffffff" : "#f8fafc", minHeight: rowHeight }}>
                <td style={auditCellStyle}>{formatDate(log.createdAt)}</td>
                <td style={{ ...auditCellStyle, fontWeight: 800 }}>{log.username || "-"}</td>
                <td style={auditCellStyle}>{log.role || "-"}</td>
                <td style={auditCellStyle}>{log.branch || "-"}</td>
                <td style={auditCellStyle}><span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, background: actionColor(log.action), fontWeight: 800 }}>{log.action || "-"}</span></td>
                <td style={auditCellStyle}>{log.targetType || "-"}</td>
                <td style={auditCellStyle}>{log.targetId || "-"}</td>
                <td style={auditCellStyle}>{log.ipAddress || "-"}</td>
              </tr>
            ))}
            {pageLogs.length === 0 && (
              <tr>
                <td style={auditTd} colSpan="8">ยังไม่มี Audit Log</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

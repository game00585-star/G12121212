import React from "react";
import Pagination from "../components/Pagination";

import {
  cardStyle,
  inputStyle,
  saveBtn,
  printBtn,
} from "../styles/uiStyles";

const DEFAULT_PAGE_SIZE = 30;

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

export default function AuditLogPage({ auditLogs, exportAuditLogsJson, importAuditLogsJson }) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
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
  const [rowHeight, setRowHeight] = React.useState(56);
  const [tableWidth, setTableWidth] = React.useState(1180);
  const [tableHeight, setTableHeight] = React.useState(620);

  const filteredLogs = React.useMemo(() => {
    const searchText = cleanText(search);
    return auditLogs.filter((log) => {
      const timeText = cleanText(`${log.createdAt || ""} ${formatDate(log.createdAt)}`);
      const values = {
        time: timeText,
        userId: cleanText(log.userId),
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

  const safePageSize = Math.max(5, Number(pageSize || DEFAULT_PAGE_SIZE));
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / safePageSize));
  const safePage = Math.min(page, totalPages);
  const pageLogs = filteredLogs.slice((safePage - 1) * safePageSize, safePage * safePageSize);

  React.useEffect(() => setPage(1), [filteredLogs.length, safePageSize]);

  const updateFilter = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result || "[]"));
        await importAuditLogsJson(parsed);
        event.target.value = "";
      } catch (err) {
        console.log(err);
        alert("อ่านไฟล์ JSON ไม่สำเร็จ");
      }
    };
    reader.readAsText(file, "utf-8");
  };

  return (
    <div style={cardStyle}>
      <div className="page-head">
        <div>
          <h2>Audit Log</h2>
          <p>แสดง {pageLogs.length} จาก {filteredLogs.length} รายการ</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" style={saveBtn} onClick={exportAuditLogsJson}>Backup JSON</button>
          <label style={{ ...printBtn, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            Import JSON
            <input type="file" accept="application/json,.json" onChange={handleImport} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      <div className="filter-grid">
        <input placeholder="ค้นหาเรียลไทม์" value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle} />
        <input placeholder="เวลา" value={filters.time} onChange={(e) => updateFilter("time", e.target.value)} style={inputStyle} />
        <input placeholder="Username" value={filters.username} onChange={(e) => updateFilter("username", e.target.value)} style={inputStyle} />
        <input placeholder="Role" value={filters.role} onChange={(e) => updateFilter("role", e.target.value)} style={inputStyle} />
        <input placeholder="Branch" value={filters.branch} onChange={(e) => updateFilter("branch", e.target.value)} style={inputStyle} />
        <input placeholder="Action" value={filters.action} onChange={(e) => updateFilter("action", e.target.value)} style={inputStyle} />
        <input placeholder="Target Type" value={filters.targetType} onChange={(e) => updateFilter("targetType", e.target.value)} style={inputStyle} />
        <input placeholder="Target ID" value={filters.targetId} onChange={(e) => updateFilter("targetId", e.target.value)} style={inputStyle} />
        <input placeholder="IP" value={filters.ipAddress} onChange={(e) => updateFilter("ipAddress", e.target.value)} style={inputStyle} />
      </div>

      <div className="filter-grid" style={{ marginTop: 6 }}>
        <input type="number" min="5" step="5" placeholder="จำนวนต่อหน้า" value={pageSize} onChange={(e) => setPageSize(e.target.value)} style={inputStyle} />
        <input type="number" min="44" step="4" placeholder="ความสูงแถว" value={rowHeight} onChange={(e) => setRowHeight(e.target.value)} style={inputStyle} />
        <input type="number" min="900" step="20" placeholder="ความกว้างตาราง" value={tableWidth} onChange={(e) => setTableWidth(e.target.value)} style={inputStyle} />
        <input type="number" min="240" step="20" placeholder="ความสูงตาราง" value={tableHeight} onChange={(e) => setTableHeight(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ overflow: "auto", width: "100%", maxHeight: Number(tableHeight || 620), border: "1px solid #e5e7eb", borderRadius: 12, marginTop: 16 }}>
        <table style={{ width: "100%", minWidth: Number(tableWidth || 1180), borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={auditTh}>เวลา</th>
              <th style={auditTh}>User ID</th>
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
              <tr key={log.id || log.auditLogId || index} style={{ background: index % 2 === 0 ? "#ffffff" : "#f8fafc", minHeight: Number(rowHeight || 56) }}>
                <td style={{ ...auditTd, height: Number(rowHeight || 56) }}>{formatDate(log.createdAt)}</td>
                <td style={auditTd}>{log.userId || "-"}</td>
                <td style={{ ...auditTd, fontWeight: 800 }}>{log.username || "-"}</td>
                <td style={auditTd}>{log.role || "-"}</td>
                <td style={auditTd}>{log.branch || "-"}</td>
                <td style={auditTd}><span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, background: actionColor(log.action), fontWeight: 800 }}>{log.action || "-"}</span></td>
                <td style={auditTd}>{log.targetType || "-"}</td>
                <td style={auditTd}>{log.targetId || "-"}</td>
                <td style={auditTd}>{log.ipAddress || "-"}</td>
              </tr>
            ))}
            {pageLogs.length === 0 && (
              <tr>
                <td style={auditTd} colSpan="9">ยังไม่มี Audit Log</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

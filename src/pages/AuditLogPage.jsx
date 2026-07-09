import React from "react";
import Pagination from "../components/Pagination";
import { cardStyle } from "../styles/uiStyles";

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

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.5 2.8 8.6 7 10 4.2-1.4 7-5.5 7-10V6l-7-3Z" />
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

function logValues(log) {
  return {
    time: `${log.createdAt || ""} ${formatDate(log.createdAt)}`,
    username: log.username || "",
    role: log.role || "",
    branch: log.branch || "",
    action: log.action || "",
    targetType: log.targetType || "",
    targetId: log.targetId || "",
    ipAddress: log.ipAddress || "",
  };
}

function actionClass(action) {
  const text = String(action || "").toLowerCase();
  if (text.includes("failed") || text.includes("cancel")) return "danger";
  if (text.includes("login") || text.includes("create")) return "success";
  if (text.includes("export") || text.includes("import") || text.includes("print") || text.includes("edit")) return "info";
  return "muted";
}

function uniqueOptions(logs, field) {
  return [...new Set(logs.map((log) => String(logValues(log)[field] || "").trim()))].filter(Boolean);
}

export default function AuditLogPage({ auditLogs, systemSettings }) {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [filterOpen, setFilterOpen] = React.useState(true);
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
  const pageSize = Math.max(5, Number(systemSettings?.pageSize || 30));

  const filteredLogs = React.useMemo(() => {
    const searchText = cleanText(search);
    return auditLogs.filter((log) => {
      const values = logValues(log);
      const tableText = Object.values(values).join(" ");
      const searchOk = searchText === "" || cleanText(tableText).includes(searchText);
      const filterOk = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return cleanText(values[key]).includes(cleanText(value));
      });
      return searchOk && filterOk;
    });
  }, [auditLogs, filters, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageLogs = filteredLogs.slice((safePage - 1) * pageSize, safePage * pageSize);

  React.useEffect(() => setPage(1), [filteredLogs.length, pageSize]);

  const updateFilter = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
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

  const selectFilter = (key, label) => (
    <label>
      {label}
      <select value={filters[key]} onChange={(e) => updateFilter(key, e.target.value)}>
        <option value="">ทั้งหมด</option>
        {uniqueOptions(auditLogs, key).map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  );

  return (
    <div style={cardStyle} className="report-page">
      <div className="report-head">
        <div className="report-title">
          <span className="report-icon"><IconShield /></span>
          <div>
            <h2>Audit Log</h2>
            <p>แสดง {pageLogs.length} จาก {filteredLogs.length} รายการ</p>
          </div>
        </div>
      </div>

      <div className="report-search-row">
        <div className="report-search-box">
          <IconSearch />
          <input placeholder="ค้นหา" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button type="button" className="report-search-button" onClick={() => setPage(1)}><IconSearch />ค้นหา</button>
      </div>

      <div className="report-filter-card">
        <button type="button" className="report-filter-title" onClick={() => setFilterOpen((next) => !next)}>
          <IconFilter />
          <span>Filter</span>
          <small>{filterOpen ? "ซ่อน" : "แสดง"}</small>
        </button>
        {filterOpen && (
          <div className="report-filter-grid audit-filter-grid">
            {selectFilter("time", "เวลา")}
            {selectFilter("username", "Username")}
            {selectFilter("role", "Role")}
            {selectFilter("branch", "Branch")}
            {selectFilter("action", "Action")}
            {selectFilter("targetType", "Target Type")}
            {selectFilter("targetId", "Target ID")}
            {selectFilter("ipAddress", "IP")}
            <button type="button" className="report-clear-button" onClick={clearSearch}>ล้างค่า</button>
          </div>
        )}
      </div>

      <div className="data-table-wrap audit-table-wrap" style={{ maxHeight: tableHeight, overflow: "auto" }}>
        <table className="data-table audit-table" style={{ minWidth: tableWidth }}>
          <thead>
            <tr>
              <th>เวลา</th>
              <th>Username</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Action</th>
              <th>Target Type</th>
              <th>Target ID</th>
              <th>IP ผู้ใช้งาน</th>
            </tr>
          </thead>
          <tbody>
            {pageLogs.map((log, index) => (
              <tr key={log.id || log.auditLogId || index} style={{ height: rowHeight }}>
                <td>{formatDate(log.createdAt)}</td>
                <td><strong>{log.username || "-"}</strong></td>
                <td>{log.role || "-"}</td>
                <td>{log.branch || "-"}</td>
                <td><span className={`audit-action-pill ${actionClass(log.action)}`}>{log.action || "-"}</span></td>
                <td>{log.targetType || "-"}</td>
                <td>{log.targetId || "-"}</td>
                <td>{log.ipAddress || "-"}</td>
              </tr>
            ))}
            {pageLogs.length === 0 && (
              <tr>
                <td colSpan="8">ยังไม่มี Audit Log</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

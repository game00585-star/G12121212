export const mainPage = {
  display: "grid",
  gridTemplateColumns: "270px minmax(0,1fr)",
  gap: 18,
  padding: "clamp(12px,1.4vw,18px)",
  background: "linear-gradient(180deg,#f8fbff 0%,#eef3f8 100%)",
  minHeight: "100vh",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "Tahoma, Arial, sans-serif",
};

export const loginPage = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#eef1f6",
  padding: 20,
  boxSizing: "border-box",
};

export const loginCard = {
  width: "100%",
  maxWidth: 420,
  background: "#fff",
  padding: "clamp(20px,4vw,40px)",
  borderRadius: 24,
  boxShadow: "0 6px 18px rgba(0,0,0,.08)",
  boxSizing: "border-box",
};

export const headerStyle = {
  position: "sticky",
  top: 16,
  alignSelf: "start",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: 18,
  minHeight: "calc(100vh - 40px)",
  padding: 22,
  background: "radial-gradient(circle at 10% 0%,rgba(18,84,143,.5),transparent 32%), linear-gradient(180deg,#02162a,#06243d 64%,#031525)",
  color: "#fff",
  borderRadius: 16,
  boxShadow: "0 18px 40px rgba(15,23,42,.22)",
};

export const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,350px),1fr))",
  gap: 20,
  width: "100%",
};

export const cardStyle = {
  background: "#fff",
  padding: "clamp(12px,2vw,20px)",
  borderRadius: 16,
  boxShadow: "0 6px 18px rgba(0,0,0,.08)",
  overflowX: "auto",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const inputStyle = {
  width: "100%",
  padding: "16px 18px",
  marginTop: 15,
  borderRadius: 14,
  border: "1px solid #ddd",
  fontSize: 18,
  boxSizing: "border-box",
};

export const tableStyle = {
  width: "100%",
  minWidth: "720px",
  marginTop: 16,
  borderCollapse: "separate",
  borderSpacing: 0,
  tableLayout: "auto",
};

export const thStyle = {
  background: "#f8fafc",
  padding: "12px 14px",
  borderBottom: "1px solid #e2e8f0",
  textAlign: "left",
  color: "#334155",
  fontSize: 13,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

export const tdStyle = {
  padding: "12px 14px",
  borderBottom: "1px solid #edf2f7",
  textAlign: "left",
  color: "#0f172a",
  verticalAlign: "middle",
};

export const menuBtn = {
  padding: "14px 18px",
  background: "rgba(255,255,255,.09)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "#dbeafe",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 16,
  whiteSpace: "normal",
  maxWidth: "100%",
};

export const activeMenuBtn = {
  ...menuBtn,
  color: "#fff",
  background: "#16a34a",
  border: "1px solid #16a34a",
};

export const saveBtn = {
  padding: "12px 18px",
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold",
  maxWidth: "100%",
};

export const cancelBtn = {
  padding: "12px 18px",
  background: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold",
  maxWidth: "100%",
};

export const logoutBtn = {
  padding: "12px 14px",
  background: "rgba(15,23,42,.35)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: "bold",
  maxWidth: "100%",
};

export const printBtn = {
  padding: "12px 18px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold",
  maxWidth: "100%",
};

export const loginBtn = {
  width: "100%",
  padding: 18,
  marginTop: 20,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 14,
  fontSize: 18,
  fontWeight: "bold",
  cursor: "pointer",
};

export const searchBox = {
  maxHeight: 400,
  overflowY: "auto",
  border: "1px solid #ddd",
  borderRadius: 14,
  marginTop: 10,
  background: "#fff",
};

export const searchItem = {
  border: "1px solid #ddd",
  padding: 15,
  marginTop: 10,
  borderRadius: 10,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 10,
};

export const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
  padding: 16,
  boxSizing: "border-box",
};

export const modalBox = {
  width: "min(450px, 100%)",
  maxHeight: "calc(100vh - 32px)",
  overflowY: "auto",
  background: "#fff",
  padding: "clamp(18px,4vw,30px)",
  borderRadius: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  boxSizing: "border-box",
};

import React from "react";
import { cardStyle, inputStyle, saveBtn, printBtn, cancelBtn } from "../styles/uiStyles";

const DEFAULT_SETTINGS = {
  rowHeight: 56,
  tableWidth: 1180,
  tableHeight: 620,
  pageSize: 30,
};

const settingCard = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 16,
  background: "#fff",
};

const labelStyle = {
  display: "block",
  fontWeight: 900,
  color: "#0f172a",
  marginBottom: 4,
};

const helperStyle = {
  color: "#64748b",
  fontSize: 13,
  marginTop: 6,
};

export default function SettingsPage({ systemSettings, setSystemSettings, exportSystemJson, importSystemJson }) {
  const fileInputRef = React.useRef(null);

  const updateSetting = (name, value) => {
    setSystemSettings((prev) => ({
      ...prev,
      [name]: Number(value || 0),
    }));
  };

  const resetSettings = () => {
    setSystemSettings(DEFAULT_SETTINGS);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        await importSystemJson(parsed);
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
          <h2>ตั้งค่า</h2>
          <p>ตั้งค่าการแสดงผล การสำรองข้อมูล และการนำเข้าข้อมูลของทั้งระบบ</p>
        </div>
      </div>

      <div style={{ ...settingCard, marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>สำรองและนำเข้าข้อมูล</h3>
        <p style={helperStyle}>Backup JSON จะดาวน์โหลดข้อมูลระบบเป็นไฟล์ JSON ส่วน Import JSON จะนำข้อมูลจากไฟล์กลับเข้าระบบ</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <button type="button" style={saveBtn} onClick={exportSystemJson}>Backup JSON</button>
          <button type="button" style={printBtn} onClick={handleImportClick}>Import JSON</button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImportFile} style={{ display: "none" }} />
        </div>
      </div>

      <div style={settingCard}>
        <h3 style={{ marginTop: 0 }}>ตั้งค่าตารางและการแสดงผล</h3>
        <div className="filter-grid">
          <div>
            <label style={labelStyle}>ความสูงแถว</label>
            <input type="number" min="44" step="4" value={systemSettings.rowHeight} onChange={(e) => updateSetting("rowHeight", e.target.value)} style={inputStyle} />
            <div style={helperStyle}>กำหนดความสูงของแต่ละแถวในตาราง หน่วย px</div>
          </div>
          <div>
            <label style={labelStyle}>ความกว้างตาราง</label>
            <input type="number" min="900" step="20" value={systemSettings.tableWidth} onChange={(e) => updateSetting("tableWidth", e.target.value)} style={inputStyle} />
            <div style={helperStyle}>กำหนดความกว้างขั้นต่ำของตาราง หน่วย px</div>
          </div>
          <div>
            <label style={labelStyle}>ความสูงตาราง</label>
            <input type="number" min="240" step="20" value={systemSettings.tableHeight} onChange={(e) => updateSetting("tableHeight", e.target.value)} style={inputStyle} />
            <div style={helperStyle}>กำหนดความสูงพื้นที่ตารางก่อนเลื่อน หน่วย px</div>
          </div>
          <div>
            <label style={labelStyle}>จำนวนรายการต่อหน้า</label>
            <input type="number" min="5" step="5" value={systemSettings.pageSize} onChange={(e) => updateSetting("pageSize", e.target.value)} style={inputStyle} />
            <div style={helperStyle}>ใช้กับหน้ารายการขายและ Audit Log</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button type="button" style={cancelBtn} onClick={resetSettings}>รีเซ็ตค่าเริ่มต้น</button>
        </div>
      </div>
    </div>
  );
}

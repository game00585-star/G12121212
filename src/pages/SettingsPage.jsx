import React from "react";
import { cardStyle, inputStyle, saveBtn, printBtn, cancelBtn } from "../styles/uiStyles";
import { DEFAULT_POS_CATEGORIES, normalizePosCategories } from "../utils/posCategories";

const DEFAULT_SETTINGS = {
  rowHeight: 56,
  tableWidth: 1180,
  tableHeight: 620,
  pageSize: 30,
  categoryMenu: DEFAULT_POS_CATEGORIES,
};

const pageWrap = {
  display: "grid",
  gap: 18,
};

const heroCard = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  padding: "24px 26px",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  background: "#fff",
  boxShadow: "0 8px 24px rgba(15,23,42,.06)",
};

const sectionCard = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 22,
  background: "#fff",
  boxShadow: "0 8px 24px rgba(15,23,42,.06)",
};

const actionCard = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  padding: 18,
  minHeight: 102,
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  background: "#fff",
  cursor: "pointer",
  textAlign: "left",
};

const iconCircle = (bg, color) => ({
  width: 64,
  height: 64,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: bg,
  color,
  flex: "0 0 auto",
});

const labelStyle = {
  display: "block",
  fontWeight: 900,
  color: "#0f172a",
  marginBottom: 8,
};

const helperStyle = {
  color: "#64748b",
  fontSize: 13,
  marginTop: 8,
  lineHeight: 1.45,
};

const inputUnitWrap = {
  position: "relative",
};

const unitText = {
  position: "absolute",
  right: 16,
  top: "50%",
  transform: "translateY(-15%)",
  color: "#64748b",
  fontWeight: 800,
  pointerEvents: "none",
};

const categoryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 14,
};

const categoryCardStyle = {
  display: "grid",
  gap: 12,
  padding: 14,
  border: "1px solid #dbe3ef",
  borderRadius: 14,
  background: "#fbfdff",
};

const categoryPreviewStyle = {
  display: "grid",
  placeItems: "center",
  minHeight: 110,
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  background: "#fff",
  overflow: "hidden",
};

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function DownloadIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21V9" />
      <path d="m7 14 5-5 5 5" />
      <path d="M5 3h14" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.9 3.2-.2-.1a1.7 1.7 0 0 0-2 .2l-.3.2a1.7 1.7 0 0 0-.8 1.5v.2h-3.8V22a1.7 1.7 0 0 0-.8-1.5l-.3-.2a1.7 1.7 0 0 0-2-.2l-.2.1L5.6 17l.1-.1A1.7 1.7 0 0 0 6 15l-.1-.4A1.7 1.7 0 0 0 4.4 13H4V9h.4a1.7 1.7 0 0 0 1.5-1.1l.1-.4a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.9-3.2.2.1a1.7 1.7 0 0 0 2-.2l.3-.2A1.7 1.7 0 0 0 10.8.5h3.8A1.7 1.7 0 0 0 15.4 2l.3.2a1.7 1.7 0 0 0 2 .2l.2-.1 1.9 3.2-.1.1a1.7 1.7 0 0 0-.3 1.9l.1.4A1.7 1.7 0 0 0 21 9h.4v4H21a1.7 1.7 0 0 0-1.5 1.1l-.1.4Z" />
    </svg>
  );
}

function SettingControl({ label, helper, value, min, max, step, unit, onChange }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={inputUnitWrap}>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={{ ...inputStyle, marginTop: 0, paddingRight: unit ? 56 : 18 }}
        />
        {unit && <span style={unitText}>{unit}</span>}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ width: "100%", marginTop: 12, accentColor: "#2563eb" }}
      />
      <div style={helperStyle}>{helper}</div>
    </div>
  );
}

export default function SettingsPage({ systemSettings, setSystemSettings, exportSystemJson, importSystemJson }) {
  const fileInputRef = React.useRef(null);
  const [draft, setDraft] = React.useState(() => ({
    ...DEFAULT_SETTINGS,
    ...systemSettings,
    categoryMenu: normalizePosCategories(systemSettings?.categoryMenu),
  }));

  React.useEffect(() => {
    setDraft({
      ...DEFAULT_SETTINGS,
      ...systemSettings,
      categoryMenu: normalizePosCategories(systemSettings?.categoryMenu),
    });
  }, [systemSettings]);

  const updateDraft = (name, value) => {
    setDraft((prev) => ({
      ...prev,
      [name]: Number(value || 0),
    }));
  };

  const updateCategory = (id, changes) => {
    setDraft((prev) => ({
      ...prev,
      categoryMenu: normalizePosCategories(prev.categoryMenu).map((category) => (
        category.id === id ? { ...category, ...changes } : category
      )),
    }));
  };

  const resetCategory = (id) => {
    const defaultCategory = DEFAULT_POS_CATEGORIES.find((category) => category.id === id);
    if (defaultCategory) updateCategory(id, defaultCategory);
  };

  const clearCategoryImage = (id) => {
    updateCategory(id, { image: "" });
  };

  const handleCategoryImage = async (id, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("กรุณาเลือกไฟล์รูปภาพ");
      event.target.value = "";
      return;
    }
    const image = await readImageAsDataUrl(file);
    updateCategory(id, { image });
    event.target.value = "";
  };

  const saveSettings = () => {
    setSystemSettings({
      ...draft,
      categoryMenu: normalizePosCategories(draft.categoryMenu),
    });
  };

  const resetSettings = () => {
    const nextSettings = {
      ...DEFAULT_SETTINGS,
      categoryMenu: normalizePosCategories(DEFAULT_SETTINGS.categoryMenu),
    };
    setDraft(nextSettings);
    setSystemSettings(nextSettings);
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
    <div style={{ ...cardStyle, ...pageWrap }}>
      <div className="page-head">
        <div>
          <h2>ตั้งค่าระบบ</h2>
          <p>ตั้งค่าการแสดงผล การสำรองข้อมูล และการนำเข้าข้อมูลของทั้งระบบ</p>
        </div>
      </div>

      <section style={heroCard}>
        <div style={iconCircle("#e8f0ff", "#2563eb")}><GearIcon /></div>
        <div>
          <h3 style={{ margin: 0, color: "#2563eb" }}>ตั้งค่าทั้งระบบ</h3>
          <p style={{ ...helperStyle, marginBottom: 0 }}>หน้านี้ใช้สำหรับจัดการพฤติกรรมการทำงานของระบบโดยรวม และการจัดการข้อมูลสำคัญของทั้งระบบ</p>
        </div>
      </section>

      <section style={sectionCard}>
        <h3 style={{ marginTop: 0 }}>สำรองและนำเข้าข้อมูล</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          <button type="button" style={actionCard} onClick={exportSystemJson}>
            <span style={iconCircle("#e8f0ff", "#2563eb")}><DownloadIcon /></span>
            <span>
              <strong style={{ display: "block", color: "#2563eb", fontSize: 18 }}>Backup JSON</strong>
              <span style={helperStyle}>ดาวน์โหลดข้อมูลระบบเป็นไฟล์ JSON เพื่อสำรองข้อมูล</span>
            </span>
          </button>
          <button type="button" style={actionCard} onClick={handleImportClick}>
            <span style={iconCircle("#dcfce7", "#16a34a")}><UploadIcon /></span>
            <span>
              <strong style={{ display: "block", color: "#16a34a", fontSize: 18 }}>Import JSON</strong>
              <span style={helperStyle}>นำเข้าข้อมูลจากไฟล์ JSON เพื่อกู้คืนหรืออัปเดตข้อมูล</span>
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImportFile} style={{ display: "none" }} />
        </div>
      </section>

      <section style={sectionCard}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0 }}>ตั้งค่าหมวดสินค้า POS</h3>
            <p style={{ ...helperStyle, marginBottom: 0 }}>แก้ไขชื่อที่แสดงบนปุ่มหมวดสินค้า และเปลี่ยนรูปภาพของแต่ละหมวดในหน้าขายสินค้า</p>
          </div>
        </div>
        <div style={categoryGridStyle}>
          {normalizePosCategories(draft.categoryMenu).map((category) => (
            <div key={category.id} style={categoryCardStyle}>
              <div style={categoryPreviewStyle}>
                {category.image ? (
                  <img src={category.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 44, lineHeight: 1 }}>{category.icon}</span>
                )}
              </div>
              <label>
                <span style={labelStyle}>ชื่อหมวด</span>
                <input
                  value={category.name}
                  onChange={(event) => updateCategory(category.id, { name: event.target.value })}
                  style={{ ...inputStyle, marginTop: 0 }}
                />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <label style={{ ...printBtn, display: "grid", placeItems: "center", minHeight: 44, margin: 0, cursor: "pointer" }}>
                  เปลี่ยนรูป
                  <input type="file" accept="image/*" onChange={(event) => handleCategoryImage(category.id, event)} style={{ display: "none" }} />
                </label>
                <button type="button" style={{ ...cancelBtn, minHeight: 44 }} onClick={() => clearCategoryImage(category.id)}>ลบรูป</button>
              </div>
              <button type="button" style={{ ...cancelBtn, background: "#fff", color: "#334155", border: "1px solid #cbd5e1", minHeight: 42 }} onClick={() => resetCategory(category.id)}>คืนค่าหมวดนี้</button>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionCard}>
        <h3 style={{ marginTop: 0 }}>ตั้งค่าตารางและการแสดงผล</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          <SettingControl
            label="ความสูงแถว"
            helper="กำหนดความสูงของแต่ละแถวในตาราง"
            value={draft.rowHeight}
            min="44"
            max="120"
            step="4"
            unit="px"
            onChange={(value) => updateDraft("rowHeight", value)}
          />
          <SettingControl
            label="ความกว้างตาราง"
            helper="กำหนดความกว้างของพื้นที่ตารางให้เหมาะกับหน้าจอ"
            value={draft.tableWidth}
            min="900"
            max="1800"
            step="20"
            unit="px"
            onChange={(value) => updateDraft("tableWidth", value)}
          />
          <SettingControl
            label="ความสูงตาราง"
            helper="กำหนดความสูงของตารางเพื่อให้เลื่อนดูข้อมูลได้สะดวก"
            value={draft.tableHeight}
            min="240"
            max="1000"
            step="20"
            unit="px"
            onChange={(value) => updateDraft("tableHeight", value)}
          />
          <SettingControl
            label="จำนวนรายการต่อหน้า"
            helper="เลือกรายการที่ต้องการแสดงในแต่ละหน้า"
            value={draft.pageSize}
            min="5"
            max="100"
            step="5"
            unit=""
            onChange={(value) => updateDraft("pageSize", value)}
          />
        </div>
      </section>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, flexWrap: "wrap" }}>
        <button type="button" style={{ ...cancelBtn, background: "#fff", color: "#334155", border: "1px solid #cbd5e1" }} onClick={resetSettings}>รีเซ็ตค่าเริ่มต้น</button>
        <button type="button" style={{ ...saveBtn, background: "#2563eb", minWidth: 220 }} onClick={saveSettings}>บันทึกการตั้งค่า</button>
      </div>
    </div>
  );
}

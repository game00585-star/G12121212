import React from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

import { inputStyle, saveBtn, cancelBtn, printBtn, modalOverlay, modalBox } from "../styles/uiStyles";

const money = (value) => "฿" + Number(value || 0).toFixed(2);
const numberValue = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const POS_CATEGORIES = [
  { name: "ไม่คิด", icon: "□" },
  { name: "เนื้อหมูสด", icon: "🥩" },
  { name: "เนื้อไก่สด", icon: "🍗" },
  { name: "เนื้อวัว/เนื้อหมู แช่แข็ง", icon: "🧊" },
  { name: "ไข่ ไข่แปรรูป", icon: "🥚" },
  { name: "เนื้อเป็ด/เนื้อไก่ แช่แข็ง", icon: "❄️" },
  { name: "อาหารทะเลสด", icon: "🦐" },
  { name: "เนื้อหมูแปรรูป+ตักขาย", icon: "🥓" },
  { name: "อาหารแช่แข็ง", icon: "🧊" },
  { name: "หมูแช่แข็งเทขาย", icon: "🍖" },
  { name: "อาหารแช่เย็น", icon: "🥗" },
  { name: "Dry Grocery", icon: "🛒" },
  { name: "Household", icon: "🧴" },
  { name: "ผักสด", icon: "🥬" },
  { name: "เครื่องดื่ม", icon: "🥤" },
];

const getProductCategoryText = (item) => `${item.category || ""} ${item.categoryType || ""}`.toLowerCase();

export default function PosPage(props) {
  const { searchInputRef, scan, setScan, setSearch, search, products, setSelectedItem, setSellPrice, setModalQty, selectedItem, sellPrice, modalQty, discountPercent, setDiscountPercent, promoType, setPromoType, buyQty, setBuyQty, freeQty, setFreeQty, addItemToCart, cart, total, cashInputRef, cash, setCash, change, printReceipt } = props;
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [scannerError, setScannerError] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState("");
  const html5QrCodeRef = React.useRef(null);
  const paymentRef = React.useRef(null);

  const filteredProducts = React.useMemo(() => {
    const keyword = String(search || "").toLowerCase().trim();
    const category = String(activeCategory || "").toLowerCase().trim();
    if (!keyword && !category) return products.slice(0, 80);
    return products.filter((item) => {
      const itemCategory = getProductCategoryText(item);
      const matchesCategory = !category || itemCategory.includes(category);
      const matchesKeyword = !keyword || String(item.name || "").toLowerCase().includes(keyword) || String(item.barcode || "").toLowerCase().includes(keyword) || itemCategory.includes(keyword);
      return matchesCategory && matchesKeyword;
    }).slice(0, 120);
  }, [activeCategory, products, search]);

  const selectProduct = React.useCallback((item) => {
    setSelectedItem(item);
    setSellPrice(item.price || "");
    setModalQty("");
    setDiscountPercent("");
    setPromoType("none");
    setBuyQty("");
    setFreeQty("");
  }, [setBuyQty, setDiscountPercent, setFreeQty, setModalQty, setPromoType, setSelectedItem, setSellPrice]);

  const handleBarcodeValue = React.useCallback((value) => {
    const nextValue = String(value || "").trim();
    if (!nextValue) return;
    setScan(nextValue);
    setSearch(nextValue);
    const exactProduct = products.find((item) => String(item.barcode || "").trim() === nextValue);
    if (exactProduct) selectProduct(exactProduct);
  }, [products, selectProduct, setScan, setSearch]);

  React.useEffect(() => {
    if (!scannerOpen) return undefined;
    let mounted = true;
    setScannerError("กำลังเปิดกล้อง กรุณาอนุญาต Camera");
    if (!window.isSecureContext) setScannerError("กล้องต้องใช้ HTTPS หรือ localhost เท่านั้น");
    const html5QrCode = new Html5Qrcode("mobile-barcode-reader", { formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39, Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E, Html5QrcodeSupportedFormats.ITF, Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
    html5QrCodeRef.current = html5QrCode;
    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 300, height: 160 }, aspectRatio: 1.777, disableFlip: false }, (decodedText) => {
      if (!mounted) return;
      handleBarcodeValue(decodedText);
      setScannerOpen(false);
    }).catch((err) => {
      if (mounted) {
        setScannerError("เปิดกล้องไม่ได้ กรุณาอนุญาต Camera หรือใช้ผ่าน HTTPS/localhost");
        console.log(err);
      }
    });
    return () => {
      mounted = false;
      html5QrCodeRef.current = null;
      html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
    };
  }, [handleBarcodeValue, scannerOpen]);

  const handleSearchChange = (value) => {
    setScan(value);
    setSearch(value);
    const barcode = String(value || "").trim();
    if (!barcode) return;
    const exactProduct = products.find((item) => String(item.barcode || "").trim() === barcode);
    if (exactProduct) selectProduct(exactProduct);
  };

  const submitManualBarcode = () => handleBarcodeValue(scan);
  const handleCategoryClick = (categoryName) => {
    setActiveCategory((current) => current === categoryName ? "" : categoryName);
  };
  const scrollToPayment = () => {
    paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => cashInputRef.current?.focus(), 350);
  };

  const price = numberValue(sellPrice);
  const qty = numberValue(modalQty);
  const discount = numberValue(discountPercent);
  const buy = Math.max(1, numberValue(buyQty) || 1);
  const free = Math.max(0, numberValue(freeQty));
  const beforeDiscount = price * qty;
  const setSize = buy + free;
  const fullSets = promoType === "custom" && setSize > 0 ? Math.floor(qty / setSize) : 0;
  const remainder = promoType === "custom" && setSize > 0 ? qty % setSize : 0;
  const paidQty = promoType === "custom" ? fullSets * buy + Math.min(remainder, buy) : qty;
  const freeItemQty = promoType === "custom" ? Math.max(0, qty - paidQty) : 0;
  const bahtDiscount = promoType === "custom" ? beforeDiscount - paidQty * price : beforeDiscount * (discount / 100);
  const netTotal = Math.max(0, beforeDiscount - bahtDiscount);

  return (
    <div className="pos-shell">
      <section className="pos-products-panel">
        <div className="pos-section-head"><div><p className="pos-eyebrow">D-FARM POS</p><h2>ขายสินค้า</h2><div className="pos-user-line">เลือกสินค้า / ค้นหาบาร์โค้ด</div></div><button className="scan-button" type="button" onClick={() => setScannerOpen(true)}>สแกนบาร์โค้ด</button></div>
        <div className="pos-search-row"><input ref={searchInputRef} placeholder="ค้นหาสินค้า / ชื่อสินค้า / บาร์โค้ด" value={scan} onChange={(e) => handleSearchChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitManualBarcode(); }} className="pos-search-input" /><button className="barcode-button checkout-jump-button" type="button" onClick={scrollToPayment}>คิดเงิน</button></div>
        <div className="pos-category-panel">
          <div className="pos-category-search"><span aria-hidden="true">⌕</span><span>{activeCategory || "ค้นหาหมวดสินค้า"}</span></div>
          <div className="pos-category-strip" aria-label="หมวดสินค้า">
            {POS_CATEGORIES.map((category) => (
              <button key={category.name} type="button" className={`pos-category-button${activeCategory === category.name ? " active" : ""}`} onClick={() => handleCategoryClick(category.name)}>
                <span className="pos-category-icon" aria-hidden="true">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="pos-line-table-wrap"><table className="pos-line-table"><thead><tr><th>เพิ่ม</th><th>Barcode</th><th>สินค้า</th><th>หน่วย</th><th>ราคา</th></tr></thead><tbody>{filteredProducts.length === 0 ? <tr><td colSpan="5" className="empty-state">ไม่พบสินค้า</td></tr> : filteredProducts.map((item, index) => <tr key={item.id || item.barcode || index} onClick={() => selectProduct(item)}><td><button className="line-add-button" type="button" onClick={(event) => { event.stopPropagation(); selectProduct(item); }}>+</button></td><td>{item.barcode || "-"}</td><td className="line-product-name">{item.name || "ไม่ระบุชื่อสินค้า"}</td><td>{item.unit || "-"}</td><td>{money(item.price)}</td></tr>)}</tbody></table></div>
      </section>
      <aside className="cart-panel"><div className="cart-head"><div className="cart-title-group"><span className="cart-head-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 5h2l2 10h9l2-7H7" /><path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /><path d="M17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /></svg></span><div><p className="pos-eyebrow">ตะกร้าสินค้า</p><h2>{cart.length} รายการ</h2></div></div><div className="cart-total-chip">{money(total)}</div></div><div className="cart-list">{cart.length === 0 ? <div className="empty-cart"><div className="empty-cart-icon" aria-hidden="true">□</div><span>ยังไม่มีสินค้าในตะกร้า</span></div> : cart.map((item, index) => <div className="cart-item" key={index}><div className="cart-info"><div className="cart-name">{item.name}</div><div className="cart-sub">{item.promoText && item.promoText !== "-" ? item.promoText.replace("+", " แถม ") : "ปกติ"}</div><div className="cart-sub">ขายจริง {item.qty || 0} / แถม {item.freeQty || 0} / รวม {item.totalQty || item.qty}</div></div><div className="cart-price">{money(item.total)}</div></div>)}</div><div className="payment-box" ref={paymentRef}><div className="total-row"><span>รวมสุทธิ</span><strong>{money(total)}</strong></div><input ref={cashInputRef} placeholder="รับเงิน" value={cash} onChange={(e) => { const value = e.target.value; if (value === "") return setCash(""); if (!/^\d*\.?\d*$/.test(value)) return; setCash(value); }} className="cash-input" /><div className="change-row"><span>เงินทอน</span><strong>{money(change > 0 ? change : 0)}</strong></div><button className="checkout-button" onClick={printReceipt} type="button"><span aria-hidden="true">▰</span>จบบิล (ชำระเงิน)</button></div></aside>
      {selectedItem && <div style={modalOverlay}><div style={modalBox} className="sale-popup"><div className="sale-popup-head"><div><h2>{selectedItem.name}</h2><div className="sale-popup-barcode">Barcode : {selectedItem.barcode || "-"}</div></div></div><div className="sale-form-grid"><label>ราคา<input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} style={inputStyle} /></label><label>จำนวนที่ต้องการขาย<input type="number" value={modalQty || ""} onChange={(e) => setModalQty(Number(e.target.value || 0))} style={inputStyle} /></label><label>ส่วนลด (%)<input type="number" value={discountPercent || ""} onChange={(e) => setDiscountPercent(e.target.value)} style={inputStyle} /></label></div><div className="modal-actions-row sale-promo-actions"><button type="button" style={printBtn} onClick={() => setPromoType(promoType === "custom" ? "none" : "custom")}>ใช้โปรแถม</button><button type="button" style={cancelBtn} onClick={() => setPromoType("none")}>ล้างโปร</button></div>{promoType === "custom" && <div className="promo-grid sale-promo-grid"><label>ซื้อ<input type="number" value={buyQty} onChange={(e) => setBuyQty(Number(e.target.value || 1))} style={{ ...inputStyle, margin: 0 }} /></label><label>แถม<input type="number" value={freeQty} onChange={(e) => setFreeQty(Number(e.target.value || 1))} style={{ ...inputStyle, margin: 0 }} /></label></div>}<div className="promo-preview"><strong>เงื่อนไขรายการ</strong><span>ลูกค้าชำระ {paidQty} ชิ้น</span><span>รับฟรี {freeItemQty} ชิ้น</span><span>จำนวนที่ต้องการขาย {qty} ชิ้น</span>{promoType === "custom" && <span>ซื้อ {buy} แถม {free}</span>}</div><div className="modal-summary-box sale-summary-box"><div><span>รวมก่อนลด :</span><strong>{money(beforeDiscount)}</strong></div><div><span>ส่วนลด (%) :</span><strong>{discount}%</strong></div><div><span>ส่วนลด (บาท) :</span><strong>{money(bahtDiscount)}</strong></div><div className="modal-net-row"><span>รวมหลังลด :</span><strong>{money(netTotal)}</strong></div></div><div className="modal-actions-row sale-submit-row"><button style={saveBtn} onClick={addItemToCart} type="button">เพิ่มสินค้า</button></div></div></div>}
      {scannerOpen && <div style={modalOverlay}><div className="scanner-modal"><div className="scanner-head"><div><p className="pos-eyebrow">Mobile Barcode</p><h2>สแกนบาร์โค้ดสินค้า</h2></div><button type="button" className="scanner-close" onClick={() => setScannerOpen(false)}>X</button></div><div id="mobile-barcode-reader" className="scanner-reader" />{scannerError && <div className="scanner-error">{scannerError}</div>}<p className="scanner-help">นำกล้องมือถือส่องบาร์โค้ด ระบบจะค้นหาและเปิดหน้ากรอกจำนวนให้อัตโนมัติ</p></div></div>}
    </div>
  );
}

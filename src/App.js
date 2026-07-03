import React from "react";

import * as XLSX from "xlsx";

import AppHeader from "./components/AppHeader";
import LoginPage from "./components/LoginPage";
import { buildSummaryResult, calcSaleRow, fieldNames, formatPromo, getField, isCanceledStatus, numberField } from "./utils/salesSummary";

import {
  db,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from "./firebase";

import Price from "./pages/Price";
import PosPage from "./pages/PosPage";
import HistoryPage from "./pages/HistoryPage";
import SummaryPage from "./pages/SummaryPage";
import UsersPage from "./pages/UsersPage";

import {
  mainPage,
  cardStyle,
  inputStyle,
  tableStyle,
  thStyle,
  tdStyle,
} from "./styles/uiStyles";

export default function App() {
  const [page, setPage] = React.useState("pos");

  const [products, setProducts] = React.useState([]);

  const [cart, setCart] = React.useState([]);

  const [search, setSearch] = React.useState("");

  const [scan, setScan] = React.useState("");

  const [cash, setCash] = React.useState("");

  const [branchFilter, setBranchFilter] = React.useState("");

  const [historySearch, setHistorySearch] = React.useState("");

  const [startDate, setStartDate] = React.useState("");

  const [endDate, setEndDate] = React.useState("");

  const [branch, setBranch] = React.useState("");

  const [employeeName, setEmployeeName] = React.useState("");

  const [salesHistory, setSalesHistory] = React.useState([]);

  const today = new Date().toISOString().split("T")[0];

  const [summaryStartDate, setSummaryStartDate] = React.useState(today);
  const [summaryEndDate, setSummaryEndDate] = React.useState(today);

  const [summaryBranch, setSummaryBranch] = React.useState("");

  const [isLogin, setIsLogin] = React.useState(false);

  const [username, setUsername] = React.useState("");

  const [password, setPassword] = React.useState("");

  const [loginAttempts, setLoginAttempts] = React.useState(0);

  const [lockUntil, setLockUntil] = React.useState(0);

  const [role, setRole] = React.useState("");

  const [currentUser, setCurrentUser] = React.useState(null);

  const summaryResult = buildSummaryResult({
    salesHistory,
    summaryStartDate,
    summaryEndDate,
    summaryBranch,
    role,
    currentUser,
  });

  const [selectedItem, setSelectedItem] = React.useState(null);

  const [sellPrice, setSellPrice] = React.useState("");

  const [modalQty, setModalQty] = React.useState(1);

  const [discountPercent, setDiscountPercent] = React.useState(0);

  const [promoType, setPromoType] = React.useState("none");

  const [buyQty, setBuyQty] = React.useState(1);

  const [freeQty, setFreeQty] = React.useState(1);

  const [cancelPassword, setCancelPassword] = React.useState("");

  const [cancelBillNo, setCancelBillNo] = React.useState(null);

  const [resetUserId, setResetUserId] = React.useState(null);

  const [newResetPassword, setNewResetPassword] = React.useState("");

  const [newUsername, setNewUsername] = React.useState("");

  const [newPassword, setNewPassword] = React.useState("");

  const [newRole, setNewRole] = React.useState("Cashier");

  const [newBranch, setNewBranch] = React.useState("");

  const [newEmployeeName, setNewEmployeeName] = React.useState("");

  const [users, setUsers] = React.useState([]);

  const [isOffline, setIsOffline] = React.useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  const [offlineSyncing, setOfflineSyncing] = React.useState(false);

  const [offlineLoaded, setOfflineLoaded] = React.useState(false);

  const [savingBill, setSavingBill] = React.useState(false);

  const cashInputRef = React.useRef(null);

  const searchInputRef = React.useRef(null);

  const sanitizeUserForSession = (user) => ({
    id: user.id,
    username: user.username,
    role: user.role,
    branch: user.branch,
    employeeName: user.employeeName,
  });

  React.useEffect(() => {
    loadProducts();

    loadSales();

    loadUsers();

    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const parsed = sanitizeUserForSession(JSON.parse(savedUser));

        setCurrentUser(parsed);

        setRole(parsed.role);

        setBranch(parsed.branch);

        setEmployeeName(parsed.employeeName);

        localStorage.setItem("user", JSON.stringify(parsed));

        setIsLogin(true);
      } catch (err) {
        console.log(err);
      }
    }

    const handleOnline = () => {
      setIsOffline(false);

      syncOfflineSales();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);

    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);

      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  React.useEffect(() => {
    if (!offlineLoaded) return;

    localStorage.setItem("offline_sales", JSON.stringify(salesHistory));
  }, [salesHistory, offlineLoaded]);

  const loadProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));

      const items = querySnapshot.docs.map((d) => ({
        id: d.id,

        ...d.data(),
      }));

      setProducts(items);

      localStorage.setItem("offline_products", JSON.stringify(items));
    } catch (err) {
      console.log(err);

      const offlineData = localStorage.getItem("offline_products");

      if (offlineData) {
        try {
          setProducts(JSON.parse(offlineData));
        } catch (e) {
          console.log(e);
        }
      }
    }
  };

  const loadSales = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "salesHistory"));

      const items = querySnapshot.docs.map((d) => ({
        id: d.id,

        ...d.data(),
      }));

      setSalesHistory(items);

      setOfflineLoaded(true);

      localStorage.setItem("offline_sales", JSON.stringify(items));
    } catch (err) {
      console.log(err);

      const offlineData = localStorage.getItem("offline_sales");

      if (offlineData) {
        try {
          setSalesHistory(JSON.parse(offlineData));

          setOfflineLoaded(true);
        } catch (e) {
          console.log(e);
        }
      }
    }
  };

  const loadUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));

      const items = querySnapshot.docs.map((d) => ({
        id: d.id,

        ...d.data(),
      }));

      setUsers(items);

      localStorage.setItem("offline_users", JSON.stringify(items));
    } catch (err) {
      console.log(err);

      const offlineData = localStorage.getItem("offline_users");

      if (offlineData) {
        try {
          setUsers(JSON.parse(offlineData));
        } catch (e) {
          console.log(e);
        }
      }
    }
  };
  const syncOfflineSales = async () => {
    if (offlineSyncing) return;

    setOfflineSyncing(true);

    try {
      const pending = JSON.parse(localStorage.getItem("pending_sales") || "[]");

      if (pending.length === 0) {
        setOfflineSyncing(false);

        return;
      }

      const syncedIds = [];

      for (const sale of pending) {
        const exists = salesHistory.find(
          (item) => item.offlineId === sale.offlineId
        );

        if (exists) {
          syncedIds.push(sale.offlineId);

          continue;
        }

        await addDoc(collection(db, "salesHistory"), sale);

        syncedIds.push(sale.offlineId);
      }

      const remain = pending.filter(
        (item) => !syncedIds.includes(item.offlineId)
      );

      localStorage.setItem("pending_sales", JSON.stringify(remain));

      await loadSales();

      alert("Sync Offline สำเร็จ");
    } catch (err) {
      console.log(err);
    }

    setOfflineSyncing(false);
  };

  const login = () => {
    const now = Date.now();

    if (lockUntil > now) {
      const waitSeconds = Math.ceil((lockUntil - now) / 1000);
      alert(`เข้าสู่ระบบผิดหลายครั้ง กรุณารอ ${waitSeconds} วินาที`);
      return;
    }

    const foundUser = users.find(
      (user) => user.username === username && user.password === password
    );

    if (!foundUser) {
      const nextAttempts = loginAttempts + 1;
      setLoginAttempts(nextAttempts);

      if (nextAttempts >= 5) {
        setLockUntil(now + 60 * 1000);
        setLoginAttempts(0);
        alert("เข้าสู่ระบบผิด 5 ครั้ง ระบบล็อกชั่วคราว 60 วินาที");
        return;
      }

      alert("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      return;
    }

    const sessionUser = sanitizeUserForSession(foundUser);

    setCurrentUser(sessionUser);
    setRole(sessionUser.role);
    setBranch(sessionUser.branch);
    setEmployeeName(sessionUser.employeeName);
    setIsLogin(true);
    setLoginAttempts(0);
    setLockUntil(0);

    localStorage.setItem("user", JSON.stringify(sessionUser));
    localStorage.setItem("last_activity_at", String(Date.now()));
  };

  const logout = () => {
    setIsLogin(false);
    setUsername("");
    setPassword("");
    setRole("");
    setCurrentUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("last_activity_at");
  };

  React.useEffect(() => {
    if (!isLogin) return undefined;

    const timeoutMs = 30 * 60 * 1000;
    const activityEvents = ["click", "keydown", "touchstart", "mousemove"];

    const markActivity = () => {
      localStorage.setItem("last_activity_at", String(Date.now()));
    };

    const checkSession = () => {
      const lastActivity = Number(localStorage.getItem("last_activity_at") || Date.now());
      if (Date.now() - lastActivity > timeoutMs) {
        alert("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
        logout();
      }
    };

    activityEvents.forEach((eventName) => window.addEventListener(eventName, markActivity));
    const intervalId = window.setInterval(checkSession, 60 * 1000);
    markActivity();

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActivity));
      window.clearInterval(intervalId);
    };
  }, [isLogin]);

  const total = cart.reduce((sum, item) => {
    return sum + Number(item.total || 0);
  }, 0);

  const parsedCash = Number(cash || 0);

  const safeCash = isNaN(parsedCash) ? 0 : parsedCash;

  const change = safeCash - total;

  const addUser = async () => {
    if (
      newUsername === "" ||
      newPassword === "" ||
      newBranch === "" ||
      newEmployeeName === ""
    ) {
      alert("กรอกข้อมูลไม่ครบ");

      return;
    }

    const duplicate = users.find((u) => u.username === newUsername);

    if (duplicate) {
      alert("Username ซ้ำ");

      return;
    }

    const newUser = {
      username: newUsername,

      password: newPassword,

      role: newRole,

      branch: newBranch,

      employeeName: newEmployeeName,
    };

    try {
      await addDoc(collection(db, "users"), newUser);

      await loadUsers();

      setNewUsername("");

      setNewPassword("");

      setNewBranch("");

      setNewEmployeeName("");

      alert("เพิ่มผู้ใช้แล้ว");
    } catch (err) {
      console.log(err);

      alert("เพิ่มผู้ใช้ไม่สำเร็จ");
    }
  };

  const deleteUser = async (id) => {
    const confirmDelete = window.confirm("ลบผู้ใช้นี้ ?");

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "users", id));

      await loadUsers();

      alert("ลบผู้ใช้แล้ว");
    } catch (err) {
      console.log(err);

      alert("ลบผู้ใช้ไม่สำเร็จ");
    }
  };

  const resetPassword = async () => {
    if (!resetUserId) {
      alert("ไม่พบผู้ใช้");

      return;
    }

    if (newResetPassword === "") {
      alert("กรอกรหัสใหม่");

      return;
    }

    try {
      const userRef = doc(db, "users", String(resetUserId));

      await updateDoc(userRef, {
        password: String(newResetPassword),
      });

      await loadUsers();

      setResetUserId(null);

      setNewResetPassword("");

      alert("เปลี่ยนรหัสผ่านแล้ว");
    } catch (err) {
      console.log(err);

      alert("เปลี่ยนรหัสผ่านไม่สำเร็จ");
    }
  };
  const importExcel = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const existingBarcodes = new Set(
      products.map((product) => String(product.barcode || "").trim()).filter(Boolean)
    );
    const pendingBarcodes = new Set();
    let allProducts = [];
    let finished = 0;
    let skipped = 0;

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onerror = () => {
        alert("อ่านไฟล์ไม่สำเร็จ");
      };

      reader.onload = async (evt) => {
        try {
          const workbook = XLSX.read(evt.target.result, { type: "binary" });

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });

            jsonData.forEach((item) => {
              const barcode = String(item["รหัสสินค้า"] || item["เธฃเธซเธฑเธชเธชเธดเธเธเนเธฒ"] || "").trim();

              if (!barcode || existingBarcodes.has(barcode) || pendingBarcodes.has(barcode)) {
                skipped++;
                return;
              }

              pendingBarcodes.add(barcode);
              allProducts.push({
                barcode,
                name: String(item["ชื่อสินค้า"] || item["เธเธทเนเธญเธชเธดเธเธเนเธฒ"] || "").trim(),
                unit: String(item["หน่วยนับ"] || item["เธซเธเนเธงเธขเธเธฑเธ"] || "").trim(),
                category: String(item["หมวด"] || item["เธซเธกเธงเธ”"] || "").trim(),
                categoryType: String(item["หมวดสินค้า"] || item["เธซเธกเธงเธ”เธชเธดเธเธเนเธฒ"] || "").trim(),
                price: Number(item["ราคา"] || item["เธฃเธฒเธเธฒ"] || 0),
              });
            });
          });

          finished++;

          if (finished === files.length) {
            if (allProducts.length === 0) {
              alert(`ไม่มีสินค้าใหม่ให้นำเข้า (ข้าม ${skipped} รายการ)`);
              e.target.value = "";
              return;
            }

            for (const item of allProducts) {
              await addDoc(collection(db, "products"), item);
            }

            await loadProducts();
            e.target.value = "";
            alert(`นำเข้าสินค้าใหม่ ${allProducts.length} รายการ / ข้ามซ้ำ ${skipped} รายการ`);
          }
        } catch (err) {
          console.log(err);
          alert("ไฟล์ Excel ไม่ถูกต้อง");
        }
      };

      reader.readAsBinaryString(file);
    });
  };

  const addItemToCart = () => {
    if (!selectedItem) return;

    const price = Number(sellPrice || 0);

    if (price <= 0 || isNaN(price)) {
      alert("กรุณากรอกราคา");

      return;
    }

    const qty = Number(modalQty || 1);

    if (qty <= 0 || isNaN(qty)) {
      alert("จำนวนไม่ถูกต้อง");

      return;
    }

    setCart((prev) => {
      const totalQty = qty;

      const safeBuyQty = Number(buyQty || 0);
      const safeFreeQty = Number(freeQty || 0);
      const setSize = safeBuyQty + safeFreeQty;
      const paidQty =
        promoType === "custom" && safeBuyQty > 0 && setSize > 0
          ? Math.floor(totalQty / setSize) * safeBuyQty +
            Math.min(totalQty % setSize, safeBuyQty)
          : totalQty;

      const freeQtyCalc = promoType === "custom" ? totalQty - paidQty : 0;

      return [
        ...prev,
        {
          barcode: selectedItem.barcode,

          name: selectedItem.name,

          qty: paidQty,

          totalQty,

          freeQty: freeQtyCalc,

          price,

          promoText: promoType === "custom" ? `${buyQty}+${freeQty}` : "-",

          promoType,
          buyQty,
          freeQty,

          discountPercent: Number(discountPercent || 0),

          total: paidQty * price * (1 - Number(discountPercent || 0) / 100),
        },
      ];
    });

    setSellPrice("");

    setModalQty("");

    setDiscountPercent(0);

    setPromoType("none");
    setBuyQty(1);
    setFreeQty(1);

    setSelectedItem(null);

    setSearch("");

    setScan("");

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const printReceipt = async () => {
    if (savingBill) return;

    setSavingBill(true);

    if (cart.length === 0) {
      alert("ไม่มีสินค้า");

      setSavingBill(false);

      return;
    }

    const billNo = Date.now();

    const offlineId = `${billNo}_${Date.now()}`;

    console.log("CART =", cart);

    const saleData = cart.map((item) => ({
      วันที่: new Date().toISOString(),

      เลขบิล: billNo,

      offlineId,

      สาขา: branch,

      พนักงาน: employeeName,

      รหัสสินค้า: item.barcode || "",

      สินค้า: item.name,

      จำนวน: item.qty,

      จำนวนรวม: item.totalQty,

      จำนวนแถม: item.freeQty,

      โปรโมชั่น: item.promoText || "-",

      ส่วนลด: item.discountPercent || 0,

      รวมก่อนลด: Number(item.totalQty || 0) * Number(item.price || 0),

      ราคา: item.price,

      รวม: item.total,

      สถานะ: "ขายปกติ",

      เวลายกเลิก: "",
    }));
    try {
      if (isOffline) {
        const pending = JSON.parse(
          localStorage.getItem("pending_sales") || "[]"
        );

        pending.push(...saleData);

        localStorage.setItem("pending_sales", JSON.stringify(pending));

        setSalesHistory((prev) => [...saleData, ...prev]);
      } else {
        for (const item of saleData) {
          await addDoc(collection(db, "salesHistory"), item);
        }

        await loadSales();
      }

      const receiptWindow = window.open("", "", "width=350,height=700");

      if (!receiptWindow) {
        alert("Browser บล็อก Popup");

        setSavingBill(false);

        return;
      }

      const beforeDiscountTotal = cart.reduce(
        (sum, item) =>
          sum +
          Number(item.totalQty || item.qty || 0) * Number(item.price || 0),
        0
      );

      const totalDiscount =
        beforeDiscountTotal -
        cart.reduce((sum, item) => sum + Number(item.total || 0), 0);

      const receiptHTML = `
      
      <html>
      
      <head>
      
      <title>
      Re  eipt
      </title>
      
      <style>
      
      @media print {
      
      @page {
      size:80mm auto;
      margin:0;
      }
      
      body{
      width:72mm;
      margin:0 auto;
      padding:6px;
      font-family:Tahoma;
      font-size:12px;
      color:#000;
      }
      
      }
      
      body{
      width:72mm;
      margin:0 auto;
      padding:6px;
      font-family:Tahoma;
      font-size:12px;
      color:#000;
      }
      
      .center{
      text-align:center;
      line-height:1.8;
      }
      
      .line{
      border-top:2px dashed #000;
      margin:10px 0;
      }
      
      .row{
      display:flex;
      justify-content:space-between;
      margin-bottom:4px;
      }
      
      h2{
      margin:0;
      font-size:20px;
      }
      
      </style>
      
      </head>
      
      <body>
      
      <div class="line"></div>
      
      <div class="center">

      <h2>
      D FARM Food Retail
      </h2>
      
      <div>
      เลขที่ 55/99 อาคารฟีนิกซ์สปอร์ตคลับ
      </div>
      
      <div>
      ถนนวัชรพล เขตบางเขน กทม. 10220
      </div>
      
      <br>
      
      <div>
      Tax ID 0105561080724
      </div>
      
      </div>
      
      <div class="line"></div>
      
      <div class="center">
      
      <b>
      ใช้ในกรณีเครื่องบันทึกการเก็บเงินขัดข้องเท่านั้น
      </b>
      
      </div>
      
      <div class="line"></div>
      
      <div>
      สาขา : ${branch}
      </div>
      
      <div>
      Date :
      ${new Date().toLocaleString("sv-SE")}
      </div>
      
      <div>
      เลขที่บิล :
      ${billNo}
      </div>
      
      <div>
      User :
      ${employeeName}
      </div>
      
      <div class="line"></div>
      
      ${cart
        .map(
          (item) => `
      
          <div>

          <div class="row">
            <div>${item.name}</div>
            <div>${Number(item.total || 0).toFixed(2)}</div>
          </div>
          
          <div style="padding-left:10px;">
            ${Number(item.qty || 0).toFixed(2)} x ${Number(
            item.price || 0
          ).toFixed(2)}
          </div>
          
          ${
            item.promoText && item.promoText !== "-"
              ? `
          <div style="padding-left:10px;">
            โปร ${item.promoText}
          </div>
          `
              : item.discountPercent > 0
              ? `
          <div style="padding-left:10px;">
            ลด ${item.discountPercent}%
          </div>
          `
              : ""
          }
          
          </div>
      
      `
        )
        .join("")}
      
      <div class="line"></div>

      <div class="row">
      <b>รวมก่อนลด</b>
      <b>${Number(beforeDiscountTotal || total || 0).toFixed(2)}</b>
    </div>
    
    <div class="row">
      <b>ส่วนลดรวม</b>
      <b>${Number(totalDiscount || 0).toFixed(2)}</b>
    </div>
    
    <div class="row">
      <b>รวมหลังลด</b>
      <b>${Number(total || 0).toFixed(2)}</b>
    </div>
      
      </div>
      
      <div class="row">
      
      <div>
      Cash
      </div>
      
      <div>
      ${safeCash.toFixed(2)}
      </div>
      
      </div>
      
      <div class="row">
      
      <div>
      Change
      </div>
      
      <div>
      ${Number(change || 0).toFixed(2)}
      </div>
      
      </div>
      
      <div class="line"></div>
      
      <div class="center">
      
      ${isOffline ? "OFFLINE MODE" : "ONLINE MODE"}
      
      </div>
      
      <div class="center" style="margin-top:10px;">
      
      ขอบคุณที่ใช้บริการ
      
      </div>
      
      <script>
      
      window.onload=function(){
      
      window.print();
      
      window.onafterprint=function(){
      
      window.close();
      
      }
      
      }
      
      </script>
      
      </body>
      
      </html>
      
      `;

      receiptWindow.document.write(receiptHTML);

      receiptWindow.document.close();

      setCart([]);

      setCash("");

      setScan("");

      setSearch("");

      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);

      alert("จบบิลเรียบร้อย");
    } catch (err) {
      console.error(err);

      alert(err.message);

      console.log(err);
    }

    setSavingBill(false);
  };
  const approveCancelBill = async () => {
    if (!cancelBillNo) {
      alert("ไม่พบบิล");

      return;
    }

    let approver = null;

    if (role === "Admin" || role === "Audit") {
      approver = users.find(
        (user) =>
          (String(user.role).trim().toLowerCase() === "admin" ||
            String(user.role).trim().toLowerCase() === "audit") &&
          String(user.password) === String(cancelPassword)
      );
    } else {
      approver = users.find(
        (user) =>
          String(user.role).trim().toLowerCase() === "manager" &&
          String(user.branch).trim() === String(currentUser?.branch).trim() &&
          String(user.password) === String(cancelPassword)
      );
    }

    if (!approver) {
      alert("กรุณาใช้ Password Manager ประจำสาขา");

      return;
    }

    const billItems = salesHistory.filter(
      (item) => String(item["เลขบิล"]) === String(cancelBillNo)
    );

    try {
      for (const item of billItems) {
        if (!item.id) continue;

        await updateDoc(doc(db, "salesHistory", item.id), {
          สถานะ: "ยกเลิกบิล",

          เวลายกเลิก: new Date().toISOString(),
        });
      }

      await loadSales();

      setCancelPassword("");

      setCancelBillNo(null);

      alert("ยกเลิกบิลแล้ว");
    } catch (err) {
      console.log(err);

      alert("ยกเลิกบิลไม่สำเร็จ");
    }
  };

  const exportExcel = () => {
    let exportData = [];

    if (role === "Admin" || role === "Audit") {
      exportData = branchFilter === ""
        ? salesHistory
        : salesHistory.filter((item) => getField(item, fieldNames.branch) === branchFilter);
    } else {
      exportData = salesHistory.filter((item) => getField(item, fieldNames.branch) === currentUser?.branch);
    }

    const formatDate = (dateString) => {
      if (!dateString) return "-";
      try {
        const d = new Date(dateString);
        if (isNaN(d)) return dateString;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        const ss = String(d.getSeconds()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
      } catch {
        return dateString;
      }
    };

    const formattedData = exportData.map((item, index) => {
      const row = calcSaleRow(item);
      const status = getField(item, fieldNames.status);
      return {
        ลำดับ: index + 1,
        เลขบิล: String(getField(item, fieldNames.billNo)),
        วันที่: formatDate(getField(item, fieldNames.date)),
        Barcode: getField(item, fieldNames.barcode),
        สินค้า: getField(item, fieldNames.product),
        ขายจริง: row.soldQty,
        แถม: row.freeQty,
        จำนวนรวม: row.totalQty,
        "ราคา/หน่วย": numberField(item, ["ราคา", "เธฃเธฒเธเธฒ", "เน€เธเธเน€เธเธ’เน€เธยเน€เธเธ’"]),
        โปร: formatPromo(item),
        "ส่วนลด %": numberField(item, fieldNames.discountPercent) > 0 ? `${numberField(item, fieldNames.discountPercent)}%` : "-",
        รวมก่อนลด: row.beforeDiscount,
        "ส่วนลด (บาท)": row.discountBaht,
        รวมสุทธิ: row.netTotal,
        สถานะ: status,
        เวลายกเลิก: status !== "เธเธฒเธขเธเธเธ•เธด" ? formatDate(getField(item, ["เวลายกเลิก", "เน€เธงเธฅเธฒเธขเธเน€เธฅเธดเธ"])) : "-",
        พนักงาน: getField(item, fieldNames.employee),
        สาขา: getField(item, fieldNames.branch),
      };
    });

    try {
      const ws = XLSX.utils.json_to_sheet(formattedData);
      ws["!cols"] = [
        { wch: 8 }, { wch: 16 }, { wch: 20 }, { wch: 15 }, { wch: 28 },
        { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
        { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
        { wch: 18 }, { wch: 14 }, { wch: 12 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales");
      XLSX.writeFile(wb, "sales-history.xlsx");
    } catch (err) {
      console.log(err);
      alert("Export Excel ไม่สำเร็จ");
    }
  };
  const exportSummaryExcel = () => {
    try {
      const exportData = summaryResult.map((item) => ({
        สาขา: item.branch,
        Barcode: item.barcode,
        สินค้า: item.product,
        โปร: item.promo,
        ขายจริง: Number(item.soldQty),
        แถม: Number(item.freeQty),
        จำนวนรวม: Number(item.totalQty),
        รวมก่อนลด: Number(item.beforeDiscount),
        "ส่วนลด (บาท)": Number(item.discountBaht),
        รวมสุทธิ: Number(item.netTotal),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws["!cols"] = [
        { wch: 12 }, { wch: 15 }, { wch: 28 }, { wch: 14 }, { wch: 10 },
        { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Summary");
      XLSX.writeFile(wb, `summary-${summaryStartDate || "all"}-${summaryEndDate || "all"}.xlsx`);
    } catch (err) {
      console.log(err);
      alert("Export Summary ไม่สำเร็จ");
    }
  };
  if (!isLogin) {
    return (
      <LoginPage
        username={username}
        password={password}
        setUsername={setUsername}
        setPassword={setPassword}
        login={login}
        lockUntil={lockUntil}
      />
    );
  }

  return (
    <div style={mainPage}>
      <AppHeader
        employeeName={employeeName}
        branch={branch}
        role={role}
        isOffline={isOffline}
        page={page}
        setPage={setPage}
        logout={logout}
      />
      {page === "price" && (
        <Price
          products={products}
          search={search}
          setSearch={setSearch}
          importExcel={importExcel}
          cardStyle={cardStyle}
          inputStyle={inputStyle}
          tableStyle={tableStyle}
          thStyle={thStyle}
          tdStyle={tdStyle}
        />
      )}
      {page === "pos" && (
        <PosPage
          branch={branch}
          employeeName={employeeName}
          searchInputRef={searchInputRef}
          scan={scan}
          setScan={setScan}
          setSearch={setSearch}
          search={search}
          products={products}
          setSelectedItem={setSelectedItem}
          setSellPrice={setSellPrice}
          setModalQty={setModalQty}
          selectedItem={selectedItem}
          sellPrice={sellPrice}
          modalQty={modalQty}
          discountPercent={discountPercent}
          setDiscountPercent={setDiscountPercent}
          promoType={promoType}
          setPromoType={setPromoType}
          buyQty={buyQty}
          setBuyQty={setBuyQty}
          freeQty={freeQty}
          setFreeQty={setFreeQty}
          addItemToCart={addItemToCart}
          cart={cart}
          total={total}
          cashInputRef={cashInputRef}
          cash={cash}
          setCash={setCash}
          change={change}
          printReceipt={printReceipt}
        />
      )}
      {page === "history" && (
        <HistoryPage
          historySearch={historySearch}
          setHistorySearch={setHistorySearch}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          role={role}
          branchFilter={branchFilter}
          setBranchFilter={setBranchFilter}
          salesHistory={salesHistory}
          currentUser={currentUser}
          exportExcel={exportExcel}
          setCancelBillNo={setCancelBillNo}
          cancelBillNo={cancelBillNo}
          cancelPassword={cancelPassword}
          setCancelPassword={setCancelPassword}
          approveCancelBill={approveCancelBill}
        />
      )}
      {page === "summary" && (
        <SummaryPage
          summaryStartDate={summaryStartDate}
          setSummaryStartDate={setSummaryStartDate}
          summaryEndDate={summaryEndDate}
          setSummaryEndDate={setSummaryEndDate}
          role={role}
          summaryBranch={summaryBranch}
          setSummaryBranch={setSummaryBranch}
          salesHistory={salesHistory}
          exportSummaryExcel={exportSummaryExcel}
          summaryResult={summaryResult}
        />
      )}
      {page === "users" && (role === "Admin" || role === "Audit") && (
        <UsersPage
          newUsername={newUsername}
          setNewUsername={setNewUsername}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          newBranch={newBranch}
          setNewBranch={setNewBranch}
          newEmployeeName={newEmployeeName}
          setNewEmployeeName={setNewEmployeeName}
          newRole={newRole}
          setNewRole={setNewRole}
          addUser={addUser}
          users={users}
          setResetUserId={setResetUserId}
          deleteUser={deleteUser}
          resetUserId={resetUserId}
          newResetPassword={newResetPassword}
          setNewResetPassword={setNewResetPassword}
          resetPassword={resetPassword}
        />
      )}

    </div>
  );
}

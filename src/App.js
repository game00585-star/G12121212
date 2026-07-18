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
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
  runTransaction,
  writeBatch,
} from "./firebase";

import Price from "./pages/Price";
import PosPage from "./pages/PosPage";
import HistoryPage from "./pages/HistoryPage";
import SummaryPage from "./pages/SummaryPage";
import UsersPage from "./pages/UsersPage";
import AuditLogPage from "./pages/AuditLogPage";
import SettingsPage from "./pages/SettingsPage";
import { DEFAULT_POS_CATEGORIES, mergeProductCategories, normalizePosCategories } from "./utils/posCategories";

import {
  mainPage,
  cardStyle,
  inputStyle,
  tableStyle,
  thStyle,
  tdStyle,
} from "./styles/uiStyles";

const SALE_POPUP_STATE_KEY = "dfarm_sale_popup_state";
const CART_STATE_KEY = "dfarm_cart_state";
const APP_LOCATION_STATE_KEY = "dfarm_app_location_state";
const APP_PAGE_KEYS = ["pos", "history", "summary", "price", "users", "audit", "settings"];
const DEFAULT_SYSTEM_SETTINGS = {
  rowHeight: 56,
  tableWidth: 1180,
  tableHeight: 620,
  pageSize: 30,
  categoryMenu: DEFAULT_POS_CATEGORIES,
  hiddenCategoryLabels: [],
};

async function getClientSecurityContext() {
  let ipAddress = localStorage.getItem("dfarm_client_ip") || "";
  if (!ipAddress && typeof fetch !== "undefined" && typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const response = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
      const data = await response.json();
      ipAddress = data?.ip || "";
      if (ipAddress) localStorage.setItem("dfarm_client_ip", ipAddress);
    } catch (err) {
      console.log(err);
    }
  }

  return {
    ipAddress: ipAddress || "client-side-unavailable",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };
}

function createClientId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function isSecureRuntime() {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  return window.location.protocol === "https:" || host === "localhost" || host === "127.0.0.1" || host === "";
}

function enforceProductionHttps() {
  if (typeof window === "undefined") return;
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "";
  if (process.env.NODE_ENV === "production" && window.location.protocol === "http:" && !isLocal) {
    window.location.replace(`https://${window.location.host}${window.location.pathname}${window.location.search}`);
  }
}
function getSavedCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_STATE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}
function getSavedAppPage() {
  try {
    const saved = JSON.parse(localStorage.getItem(APP_LOCATION_STATE_KEY) || "{}");
    return APP_PAGE_KEYS.includes(saved.page) ? saved.page : "pos";
  } catch {
    return "pos";
  }
}

function getSavedSystemSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("dfarm_system_settings") || "{}");
    return { ...DEFAULT_SYSTEM_SETTINGS, ...saved, categoryMenu: normalizePosCategories(saved.categoryMenu) };
  } catch {
    return { ...DEFAULT_SYSTEM_SETTINGS, categoryMenu: normalizePosCategories(DEFAULT_SYSTEM_SETTINGS.categoryMenu) };
  }
}

export default function App() {
  enforceProductionHttps();

  const [page, setPage] = React.useState(getSavedAppPage);

  const [systemSettings, setSystemSettings] = React.useState(getSavedSystemSettings);

  const [products, setProducts] = React.useState([]);

  const [cart, setCart] = React.useState(getSavedCart);

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

  const summaryTimeRange = React.useMemo(() => {
    const saleTimes = salesHistory
      .filter((item) => {
        const rawDate = getField(item, fieldNames.date);
        const itemDate = rawDate ? new Date(rawDate).toISOString().split("T")[0] : "";
        const itemBranch = getField(item, fieldNames.branch);
        const status = getField(item, fieldNames.status);
        const branchOk = role === "Admin" || role === "Audit" ? summaryBranch === "" || itemBranch === summaryBranch : itemBranch === currentUser?.branch;
        const startOk = summaryStartDate === "" || itemDate >= summaryStartDate;
        const endOk = summaryEndDate === "" || itemDate <= summaryEndDate;
        return rawDate && startOk && endOk && branchOk && !isCanceledStatus(status);
      })
      .map((item) => new Date(getField(item, fieldNames.date)).getTime())
      .filter((time) => Number.isFinite(time))
      .sort((a, b) => a - b);

    const formatSaleTime = (time) => {
      if (!Number.isFinite(time)) return "-";
      return new Date(time).toLocaleTimeString("th-TH", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    return {
      firstSaleTime: saleTimes.length ? formatSaleTime(saleTimes[0]) : "-",
      lastSaleTime: saleTimes.length ? formatSaleTime(saleTimes[saleTimes.length - 1]) : "-",
    };
  }, [currentUser, role, salesHistory, summaryBranch, summaryEndDate, summaryStartDate]);

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

  const [auditLogs, setAuditLogs] = React.useState([]);

  const [isOffline, setIsOffline] = React.useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  const [offlineSyncing, setOfflineSyncing] = React.useState(false);

  const [offlineLoaded, setOfflineLoaded] = React.useState(false);

  const [savingBill, setSavingBill] = React.useState(false);

  const cashInputRef = React.useRef(null);

  const searchInputRef = React.useRef(null);

  const popupRestoredRef = React.useRef(false);

  const scrollRestoreRef = React.useRef(false);

  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(APP_LOCATION_STATE_KEY) || "{}");
      localStorage.setItem(APP_LOCATION_STATE_KEY, JSON.stringify({
        ...saved,
        page,
        scrollByPage: saved.scrollByPage || {},
      }));
    } catch (err) {
      console.log(err);
    }
  }, [page]);

  React.useEffect(() => {
    localStorage.setItem("dfarm_system_settings", JSON.stringify(systemSettings));
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--dfarm-row-height", `${Number(systemSettings.rowHeight || 56)}px`);
      document.documentElement.style.setProperty("--dfarm-table-width", `${Number(systemSettings.tableWidth || 1180)}px`);
      document.documentElement.style.setProperty("--dfarm-table-height", `${Number(systemSettings.tableHeight || 620)}px`);
    }
  }, [systemSettings]);

  React.useEffect(() => {
    if (!isLogin) return undefined;
    const restoreScroll = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(APP_LOCATION_STATE_KEY) || "{}");
        const y = Number(saved.scrollByPage?.[page] || 0);
        window.scrollTo(0, y);
      } catch (err) {
        console.log(err);
      }
    };
    window.setTimeout(restoreScroll, 120);
    scrollRestoreRef.current = true;
    return undefined;
  }, [isLogin, page]);

  React.useEffect(() => {
    if (!isLogin) return undefined;
    const saveScroll = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(APP_LOCATION_STATE_KEY) || "{}");
        const scrollByPage = { ...(saved.scrollByPage || {}), [page]: window.scrollY || 0 };
        localStorage.setItem(APP_LOCATION_STATE_KEY, JSON.stringify({ ...saved, page, scrollByPage }));
      } catch (err) {
        console.log(err);
      }
    };
    window.addEventListener("scroll", saveScroll, { passive: true });
    window.addEventListener("beforeunload", saveScroll);
    saveScroll();
    return () => {
      saveScroll();
      window.removeEventListener("scroll", saveScroll);
      window.removeEventListener("beforeunload", saveScroll);
    };
  }, [isLogin, page]);
  React.useEffect(() => {
    if (popupRestoredRef.current) return;
    const savedPopup = localStorage.getItem(SALE_POPUP_STATE_KEY);
    if (!savedPopup) {
      popupRestoredRef.current = true;
      return;
    }

    try {
      const parsed = JSON.parse(savedPopup);
      if (!parsed?.selectedItem) {
        popupRestoredRef.current = true;
        return;
      }
      const restoredProduct = products.find((item) =>
        String(item.id || item.barcode || "") === String(parsed.selectedItem.id || parsed.selectedItem.barcode || "")
      ) || parsed.selectedItem;
      setSelectedItem(restoredProduct);
      setSellPrice(parsed.sellPrice ?? restoredProduct.price ?? "");
      setModalQty(parsed.modalQty ?? "");
      setDiscountPercent(parsed.discountPercent ?? "");
      setPromoType(parsed.promoType || "none");
      setBuyQty(parsed.buyQty ?? "");
      setFreeQty(parsed.freeQty ?? "");
    } catch (err) {
      console.log(err);
      localStorage.removeItem(SALE_POPUP_STATE_KEY);
    }
    popupRestoredRef.current = true;
  }, [products]);

  React.useEffect(() => {
    if (!popupRestoredRef.current) return;
    if (!selectedItem) {
      localStorage.removeItem(SALE_POPUP_STATE_KEY);
      return;
    }

    localStorage.setItem(SALE_POPUP_STATE_KEY, JSON.stringify({
      selectedItem,
      sellPrice,
      modalQty,
      discountPercent,
      promoType,
      buyQty,
      freeQty,
    }));
  }, [selectedItem, sellPrice, modalQty, discountPercent, promoType, buyQty, freeQty]);
  React.useEffect(() => {
    if (cart.length === 0) {
      localStorage.removeItem(CART_STATE_KEY);
      return;
    }
    localStorage.setItem(CART_STATE_KEY, JSON.stringify(cart));
  }, [cart]);
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

    loadAuditLogs();

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

      syncAllPendingData();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);

    window.addEventListener("offline", handleOffline);

    if (typeof navigator !== "undefined" && navigator.onLine) {
      syncAllPendingData();
    }

    return () => {
      window.removeEventListener("online", handleOnline);

      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  React.useEffect(() => {
    if (!offlineLoaded) return;

    localStorage.setItem("offline_sales", JSON.stringify(salesHistory));
  }, [salesHistory, offlineLoaded]);

  const syncCategoryMenuFromProducts = (productRows) => {
    setSystemSettings((prev) => {
      const currentMenu = normalizePosCategories(prev.categoryMenu);
      const nextMenu = mergeProductCategories(currentMenu, productRows);
      if (nextMenu.length === currentMenu.length) return prev;
      return {
        ...prev,
        categoryMenu: nextMenu,
      };
    });
  };

  const saveProductsBatch = async (productRows) => {
    const chunkSize = 450;
    for (let start = 0; start < productRows.length; start += chunkSize) {
      const chunk = productRows.slice(start, start + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((item) => {
        const ref = doc(collection(db, "products"));
        item.id = ref.id;
        batch.set(ref, item);
      });
      await batch.commit();
    }
  };

  const loadProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));

      const items = querySnapshot.docs.map((d) => ({
        id: d.id,

        ...d.data(),
      }));

      setProducts(items);
      syncCategoryMenuFromProducts(items);

      localStorage.setItem("offline_products", JSON.stringify(items));
    } catch (err) {
      console.log(err);

      const offlineData = localStorage.getItem("offline_products");

      if (offlineData) {
        try {
          const offlineProducts = JSON.parse(offlineData);
          setProducts(offlineProducts);
          syncCategoryMenuFromProducts(offlineProducts);
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

  const loadAuditLogs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "auditLogs"));

      const items = querySnapshot.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

      setAuditLogs(items);

      localStorage.setItem("offline_audit_logs", JSON.stringify(items));
    } catch (err) {
      console.log(err);

      const offlineData = localStorage.getItem("offline_audit_logs");

      if (offlineData) {
        try {
          setAuditLogs(JSON.parse(offlineData));
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
      const pending = JSON.parse(localStorage.getItem("pending_sales") || "[]").map((sale) => ({
        ...sale,
        offlineId: sale.offlineId || createClientId("sale"),
      }));

      if (pending.length === 0) {
        setOfflineSyncing(false);

        return;
      }

      const syncedIds = [];

      for (const sale of pending) {
        const offlineId = sale.offlineId;
        const exists = salesHistory.find((item) => item.offlineId === offlineId);

        if (exists) {
          syncedIds.push(offlineId);

          continue;
        }

        await setDoc(doc(db, "salesHistory", offlineId), {
          ...sale,
          offlineId,
          syncedAt: new Date().toISOString(),
        }, { merge: true });

        syncedIds.push(offlineId);
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

  const syncPendingAuditLogs = async () => {
    const pendingLogs = JSON.parse(localStorage.getItem("pending_audit_logs") || "[]").map((log) => ({
      ...log,
      auditLogId: log.auditLogId || createClientId("audit"),
    }));
    if (pendingLogs.length === 0) return;

    const syncedIds = [];

    for (const log of pendingLogs) {
      const auditLogId = log.auditLogId;
      await setDoc(doc(db, "auditLogs", auditLogId), {
        ...log,
        auditLogId,
        syncedAt: new Date().toISOString(),
      }, { merge: true });
      syncedIds.push(auditLogId);
    }

    const remain = pendingLogs.filter((log) => !syncedIds.includes(log.auditLogId));
    localStorage.setItem("pending_audit_logs", JSON.stringify(remain));
    await loadAuditLogs();
  };

  const syncAllPendingData = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    try {
      await syncPendingAuditLogs();
      await syncOfflineSales();
    } catch (err) {
      console.log(err);
    }
  };

  const writeAuditLog = async ({ action, targetType = "system", targetId = "", oldData = null, newData = null, userOverride = null }) => {
    const actor = userOverride || currentUser || {};
    const security = await getClientSecurityContext();
    const auditLogId = createClientId("audit");
    const logData = {
      auditLogId,
      userId: actor.id || "",
      username: actor.username || username || "",
      role: actor.role || role || "",
      branch: actor.branch || branch || "",
      action,
      targetType,
      targetId: String(targetId || ""),
      oldData,
      newData,
      ipAddress: security.ipAddress,
      userAgent: security.userAgent,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "auditLogs", auditLogId), logData, { merge: true });
      setAuditLogs((prev) => [logData, ...prev].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))));
    } catch (err) {
      console.log(err);
      const pendingLogs = JSON.parse(localStorage.getItem("pending_audit_logs") || "[]");
      pendingLogs.push(logData);
      localStorage.setItem("pending_audit_logs", JSON.stringify(pendingLogs));
    }
  };

  const getNextServerBillNo = async (branchName) => {
    const now = new Date();
    const dateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now).replace(/-/g, "");
    const safeBranch = String(branchName || "BRANCH").trim() || "BRANCH";
    const counterId = `${safeBranch}_${dateKey}`.replace(/[\/#?\[\]]/g, "_");
    const counterRef = doc(db, "billCounters", counterId);

    return runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      const lastNumber = counterSnap.exists() ? Number(counterSnap.data().lastNumber || 0) : 0;
      const nextNumber = lastNumber + 1;
      transaction.set(counterRef, {
        branch: safeBranch,
        dateKey,
        lastNumber: nextNumber,
        updatedAt: now.toISOString(),
      }, { merge: true });
      return `${safeBranch}-${dateKey}-${String(nextNumber).padStart(5, "0")}`;
    });
  };
  const login = async () => {
    if (!isSecureRuntime()) {
      await writeAuditLog({ action: "LOGIN_BLOCKED_INSECURE", targetType: "auth", userOverride: { username } });
      alert("Production ต้องใช้งานผ่าน HTTPS เท่านั้น");
      return;
    }

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

      await writeAuditLog({ action: "LOGIN_FAILED", targetType: "auth", userOverride: { username } });
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
    await writeAuditLog({ action: "LOGIN_SUCCESS", targetType: "auth", targetId: sessionUser.id, newData: sessionUser, userOverride: sessionUser });
    await syncAllPendingData();
  };

  const logout = async () => {
    setIsLogin(false);
    setUsername("");
    setPassword("");
    setRole("");
    setCurrentUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("last_activity_at");
    await writeAuditLog({ action: "LOGOUT", targetType: "auth", targetId: currentUser?.id || "", oldData: currentUser });
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

      await writeAuditLog({ action: "USER_CREATE", targetType: "user", newData: newUser });

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
      const deletedUser = users.find((user) => String(user.id) === String(id)) || null;

      await deleteDoc(doc(db, "users", id));

      await writeAuditLog({ action: "USER_DELETE", targetType: "user", targetId: id, oldData: deletedUser });

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

      await writeAuditLog({ action: "USER_PASSWORD_RESET", targetType: "user", targetId: resetUserId, newData: { passwordChanged: true } });

      await loadUsers();

      setResetUserId(null);

      setNewResetPassword("");

      alert("เปลี่ยนรหัสผ่านแล้ว");
    } catch (err) {
      console.log(err);

      alert("เปลี่ยนรหัสผ่านไม่สำเร็จ");
    }
  };

  const getExcelValue = (row, names) => {
    const entries = Object.entries(row || {}).map(([key, value]) => [
      String(key || "").trim().toLowerCase(),
      value,
    ]);
    for (const name of names) {
      const target = String(name || "").trim().toLowerCase();
      const found = entries.find(([key]) => key === target);
      if (found) return found[1];
    }
    return "";
  };

  const importExcel = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const existingBarcodes = new Set(
      products.map((product) => String(product.barcode || "").trim()).filter(Boolean)
    );
    const pendingBarcodes = new Set();
    let parsedProducts = [];
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
          const workbook = XLSX.read(evt.target.result, { type: "array" });

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });

            jsonData.forEach((item) => {
              const productRow = {
                barcode: String(getExcelValue(item, ["รหัสสินค้า", "Barcode", "barcode", "บาร์โค้ด", "บาร์โค๊ด"]) || "").trim(),
                name: String(getExcelValue(item, ["ชื่อสินค้า", "สินค้า", "Product Name", "Product", "name"]) || "").trim(),
                unit: String(getExcelValue(item, ["หน่วยนับ", "หน่วย", "Unit", "unit"]) || "").trim(),
                category: String(getExcelValue(item, ["หมวด", "หมวดหมู่", "Category", "category"]) || "").trim(),
                categoryType: String(getExcelValue(item, ["หมวดสินค้า", "ประเภทสินค้า", "Category Type", "Product Category", "categoryType"]) || "").trim(),
                price: Number(getExcelValue(item, ["ราคา", "Price", "price"]) || 0),
              };
              const barcode = productRow.barcode;

              if (productRow.category || productRow.categoryType) {
                parsedProducts.push(productRow);
              }

              if (!barcode || existingBarcodes.has(barcode) || pendingBarcodes.has(barcode)) {
                skipped++;
                return;
              }

              pendingBarcodes.add(barcode);
              allProducts.push(productRow);
            });
          });

          finished++;

          if (finished === files.length) {
            syncCategoryMenuFromProducts([...products, ...parsedProducts, ...allProducts]);

            if (allProducts.length === 0) {
              alert(`ไม่มีสินค้าใหม่ให้นำเข้า (ข้าม ${skipped} รายการ) / อัปเดตหมวดจากไฟล์แล้ว`);
              e.target.value = "";
              return;
            }

            await saveProductsBatch(allProducts);

            setProducts((prev) => {
              const nextProducts = [...prev, ...allProducts];
              localStorage.setItem("offline_products", JSON.stringify(nextProducts));
              return nextProducts;
            });

            e.target.value = "";
            alert(`นำเข้าสินค้าใหม่ ${allProducts.length} รายการ / ข้ามซ้ำ ${skipped} รายการ`);
          }
        } catch (err) {
          console.log(err);
          alert("ไฟล์ Excel ไม่ถูกต้อง");
        }
      };

      reader.readAsArrayBuffer(file);
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
    const newItem = {
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
    };

    setCart((prev) => {
      const nextCart = [...prev, newItem];
      writeAuditLog({ action: "DRAFT_BILL_EDIT", targetType: "cart", oldData: prev, newData: nextCart });
      return nextCart;
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

    if (isOffline) {
      alert("ต้องออนไลน์เพื่อออกเลขบิลจาก Server");

      setSavingBill(false);

      return;
    }

    const billNo = await getNextServerBillNo(branch);

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

      สถานะ: "completed",

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

      await writeAuditLog({ action: "CREATE_CASH_BILL", targetType: "bill", targetId: billNo, newData: saleData });

      await writeAuditLog({ action: "PRINT_BILL", targetType: "bill", targetId: billNo, newData: { billNo } });

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
  const openReceiptPrintWindow = ({ billNo, date, branchName, employee, items, isCopy = false }) => {
    const receiptWindow = window.open("", "", "width=350,height=700");
    if (!receiptWindow) {
      alert("Browser บล็อก Popup");
      return false;
    }

    const beforeDiscountTotal = items.reduce((sum, item) => sum + Number(item.beforeDiscount || 0), 0);
    const netTotal = items.reduce((sum, item) => sum + Number(item.netTotal || 0), 0);
    const totalDiscount = beforeDiscountTotal - netTotal;
    const itemRows = items.map((item) => `
      <div>
        <div class="row"><div>${item.product}</div><div>${Number(item.netTotal || 0).toFixed(2)}</div></div>
        <div style="padding-left:10px;">${Number(item.soldQty || 0).toFixed(2)} x ${Number(item.price || 0).toFixed(2)}</div>
        ${item.promo && item.promo !== "-" ? `<div style="padding-left:10px;">โปร ${item.promo}</div>` : ""}
      </div>
    `).join("");

    const receiptHTML = `
      <html>
      <head>
        <title>${isCopy ? "Reprint" : "Receipt"}-${billNo}</title>
        <style>
          @media print { @page { size:80mm auto; margin:0; } body{ width:72mm; margin:0 auto; padding:6px; font-family:Tahoma; font-size:12px; color:#000; } }
          body{ width:72mm; margin:0 auto; padding:6px; font-family:Tahoma; font-size:12px; color:#000; }
          .center{text-align:center;line-height:1.8}.line{border-top:2px dashed #000;margin:10px 0}.row{display:flex;justify-content:space-between;gap:8px;margin-bottom:4px}h2{margin:0;font-size:20px}
        </style>
      </head>
      <body>
        <div class="line"></div>
        <div class="center"><h2>D FARM Food Retail</h2><div>Tax ID 0105561080724</div>${isCopy ? "<b>REPRINT</b>" : ""}</div>
        <div class="line"></div>
        <div>สาขา : ${branchName || "-"}</div>
        <div>Date : ${date || "-"}</div>
        <div>เลขที่บิล : ${billNo || "-"}</div>
        <div>User : ${employee || "-"}</div>
        <div class="line"></div>
        ${itemRows}
        <div class="line"></div>
        <div class="row"><b>รวมก่อนลด</b><b>${beforeDiscountTotal.toFixed(2)}</b></div>
        <div class="row"><b>ส่วนลดรวม</b><b>${totalDiscount.toFixed(2)}</b></div>
        <div class="row"><b>รวมหลังลด</b><b>${netTotal.toFixed(2)}</b></div>
        <div class="line"></div>
        <div class="center">ขอบคุณที่ใช้บริการ</div>
        <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
    return true;
  };

  const mapSaleItemForReceipt = (item) => {
    const row = calcSaleRow(item);
    return {
      product: getField(item, fieldNames.product),
      soldQty: row.soldQty,
      price: numberField(item, ["ราคา", "เธฃเธฒเธเธฒ", "เน€เธเธเน€เธเธ’เน€เธยเน€เธเธ’"]),
      promo: formatPromo(item),
      beforeDiscount: row.beforeDiscount,
      netTotal: row.netTotal,
    };
  };

  const reprintBill = (bill) => {
    if (!bill || bill.length === 0) return;
    const first = bill[0];
    const reprintBillNo = getField(first, fieldNames.billNo);
    openReceiptPrintWindow({
      billNo: reprintBillNo,
      date: new Date(getField(first, fieldNames.date)).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
      branchName: getField(first, fieldNames.branch),
      employee: getField(first, fieldNames.employee),
      items: bill.map(mapSaleItemForReceipt),
      isCopy: true,
    });
    writeAuditLog({ action: "REPRINT_BILL", targetType: "bill", targetId: reprintBillNo, newData: { billNo: reprintBillNo } });
  };

  const openDailySummaryPrint = (printTitle) => {
    const reportWindow = window.open("", "", "width=1100,height=800");
    if (!reportWindow) {
      alert("Browser บล็อก Popup");
      return;
    }
    const totals = summaryResult.reduce((acc, item) => ({
      soldQty: acc.soldQty + Number(item.soldQty || 0),
      freeQty: acc.freeQty + Number(item.freeQty || 0),
      totalQty: acc.totalQty + Number(item.totalQty || 0),
      beforeDiscount: acc.beforeDiscount + Number(item.beforeDiscount || 0),
      discountBaht: acc.discountBaht + Number(item.discountBaht || 0),
      netTotal: acc.netTotal + Number(item.netTotal || 0),
    }), { soldQty: 0, freeQty: 0, totalQty: 0, beforeDiscount: 0, discountBaht: 0, netTotal: 0 });
    const rows = summaryResult.map((item) => `<tr><td>${item.branch || ""}</td><td>${item.barcode || ""}</td><td>${item.product || ""}</td><td>${item.promo || "-"}</td><td>${Number(item.soldQty || 0)}</td><td>${Number(item.freeQty || 0)}</td><td>${Number(item.totalQty || 0)}</td><td>${Number(item.beforeDiscount || 0).toFixed(2)}</td><td>${Number(item.discountBaht || 0).toFixed(2)}</td><td>${Number(item.netTotal || 0).toFixed(2)}</td></tr>`).join("");
    const reportHTML = `
      <html><head><title>${printTitle}</title>
      <style>@page{size:A4 landscape;margin:10mm}body{font-family:Tahoma,Arial,sans-serif;color:#000}h2{margin:0 0 6px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #999;padding:6px;text-align:left}th,tfoot td{background:#fff5bf;font-weight:900}.meta{margin-bottom:12px}.right{text-align:right}</style>
      </head><body>
      <h2>สรุปยอดขายรายวัน</h2>
      <div class="meta">วันที่ ${summaryStartDate || "ทั้งหมด"} ถึง ${summaryEndDate || "ทั้งหมด"} | สาขา ${summaryBranch || "ทุกสาขา"}</div>
      <div class="meta">เวลาเริ่มขาย ${summaryTimeRange.firstSaleTime} | เวลาสุดท้ายที่ขาย ${summaryTimeRange.lastSaleTime}</div>
      <table><thead><tr><th>สาขา</th><th>Barcode</th><th>สินค้า</th><th>โปร</th><th>ขายจริง</th><th>แถม</th><th>จำนวนรวม</th><th>รวมก่อนลด</th><th>ส่วนลด (บาท)</th><th>รวมสุทธิ</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="4">รวมทั้งหมด</td><td>${totals.soldQty}</td><td>${totals.freeQty}</td><td>${totals.totalQty}</td><td>${totals.beforeDiscount.toFixed(2)}</td><td>${totals.discountBaht.toFixed(2)}</td><td>${totals.netTotal.toFixed(2)}</td></tr></tfoot></table>
      <script>window.onload=function(){window.print();}</script>
      </body></html>
    `;
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
  };

  const exportDailySummaryPdf = () => openDailySummaryPrint(`summary-${summaryStartDate || "all"}-${summaryEndDate || "all"}`);
  const printDailySummary = () => openDailySummaryPrint("print-daily-summary");
  const approveCancelBill = async () => {
    if (!cancelBillNo) {
      alert("Bill not found");
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
      alert("Please use branch Manager password");
      return;
    }

    const billItems = salesHistory.filter(
      (item) => String(getField(item, fieldNames.billNo)) === String(cancelBillNo)
    );

    if (billItems.length === 0) {
      alert("Bill not found");
      return;
    }

    if (billItems.some((item) => isCanceledStatus(getField(item, fieldNames.status)))) {
      alert("This bill is already cancelled");
      return;
    }

    const cancelReason = window.prompt("Please enter cancel reason");
    if (!cancelReason || String(cancelReason).trim() === "") {
      alert("Cancel reason is required");
      return;
    }

    const cancelledAt = new Date().toISOString();
    const cancelledBy = approver.id || currentUser?.id || "";
    const cancelledByUsername = approver.username || currentUser?.username || username || "";
    const nextData = {
      status: "cancelled",
      cancelReason: String(cancelReason).trim(),
      cancelledBy,
      cancelledByUsername,
      cancelledAt,
    };

    try {
      for (const item of billItems) {
        if (!item.id) continue;

        await updateDoc(doc(db, "salesHistory", item.id), {
          ["\u0e2a\u0e16\u0e32\u0e19\u0e30"]: "cancelled",
          status: "cancelled",
          cancelReason: nextData.cancelReason,
          cancelledBy: nextData.cancelledBy,
          cancelledByUsername: nextData.cancelledByUsername,
          cancelledAt: nextData.cancelledAt,
          ["\u0e40\u0e27\u0e25\u0e32\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01"]: nextData.cancelledAt,
        });
      }

      await writeAuditLog({ action: "CANCEL_BILL", targetType: "bill", targetId: cancelBillNo, oldData: billItems, newData: nextData });

      await loadSales();

      setCancelPassword("");

      setCancelBillNo(null);

      alert("Bill cancelled");
    } catch (err) {
      console.log(err);

      alert("Cancel bill failed");
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
      writeAuditLog({ action: "EXPORT_SALES", targetType: "salesHistory", newData: { rows: formattedData.length } });
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
      writeAuditLog({ action: "EXPORT_SUMMARY", targetType: "summary", newData: { rows: exportData.length, startDate: summaryStartDate, endDate: summaryEndDate, branch: summaryBranch } });
    } catch (err) {
      console.log(err);
      alert("Export Summary ไม่สำเร็จ");
    }
  };

  const exportSystemJson = () => {
    try {
      const payload = JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: systemSettings,
        products,
        salesHistory,
        users,
        auditLogs,
      }, null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dfarm-system-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      writeAuditLog({ action: "EXPORT_SYSTEM_BACKUP", targetType: "system", newData: { products: products.length, salesHistory: salesHistory.length, users: users.length, auditLogs: auditLogs.length } });
    } catch (err) {
      console.log(err);
      alert("Export JSON ไม่สำเร็จ");
    }
  };

  const importSystemJson = async (backupData) => {
    if (!backupData || typeof backupData !== "object") {
      alert("ไฟล์ JSON ไม่ถูกต้อง");
      return;
    }

    try {
      const productRows = Array.isArray(backupData.products) ? backupData.products : [];
      const saleRows = Array.isArray(backupData.salesHistory) ? backupData.salesHistory : [];
      const userRows = Array.isArray(backupData.users) ? backupData.users : [];
      const auditRows = Array.isArray(backupData.auditLogs) ? backupData.auditLogs : (Array.isArray(backupData) ? backupData : []);

      for (const product of productRows) {
        const id = product.id || product.barcode || createClientId("product_backup");
        await setDoc(doc(db, "products", String(id)), product, { merge: true });
      }

      for (const sale of saleRows) {
        const id = sale.id || sale.offlineId || createClientId("sale_backup");
        await setDoc(doc(db, "salesHistory", String(id)), sale, { merge: true });
      }

      for (const user of userRows) {
        const id = user.id || user.username || createClientId("user_backup");
        await setDoc(doc(db, "users", String(id)), user, { merge: true });
      }

      for (const record of auditRows) {
        const auditLogId = record.auditLogId || record.id || createClientId("audit_backup");
        await setDoc(doc(db, "auditLogs", String(auditLogId)), {
          ...record,
          auditLogId: String(auditLogId),
          importedAt: new Date().toISOString(),
        }, { merge: true });
      }

      if (backupData.settings) {
        setSystemSettings((prev) => ({ ...prev, ...backupData.settings }));
      }

      await writeAuditLog({ action: "IMPORT_SYSTEM_BACKUP", targetType: "system", newData: { products: productRows.length, salesHistory: saleRows.length, users: userRows.length, auditLogs: auditRows.length } });
      await loadProducts();
      await loadSales();
      await loadUsers();
      await loadAuditLogs();
      alert("Import JSON สำเร็จ");
    } catch (err) {
      console.log(err);
      alert("Import JSON ไม่สำเร็จ");
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
          systemSettings={systemSettings}
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
          systemSettings={systemSettings}
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
          reprintBill={reprintBill}
          systemSettings={systemSettings}
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
          exportDailySummaryPdf={exportDailySummaryPdf}
          printDailySummary={printDailySummary}
          summaryResult={summaryResult}
          summaryTimeRange={summaryTimeRange}
          systemSettings={systemSettings}
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
          systemSettings={systemSettings}
        />
      )}
      {page === "audit" && (role === "Admin" || role === "Audit") && (
        <AuditLogPage
          auditLogs={auditLogs}
          systemSettings={systemSettings}
        />
      )}
      {page === "settings" && (role === "Admin" || role === "Audit") && (
        <SettingsPage
          systemSettings={systemSettings}
          setSystemSettings={setSystemSettings}
          exportSystemJson={exportSystemJson}
          importSystemJson={importSystemJson}
          products={products}
        />
      )}

    </div>
  );
}

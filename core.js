const { useState, useEffect, useMemo, useRef, createContext, useContext } = React;
var SW = window.__budgySW = window.__budgySW || { reg: null, waiting: null, listeners: /* @__PURE__ */ new Set(), updating: false, hadController: false };
function swOk() {
  return typeof SW !== "undefined" && !!SW;
}
function swNotify() {
  if (swOk() && SW.listeners) SW.listeners.forEach((f) => {
    try {
      f(SW.waiting);
    } catch (e) {
    }
  });
}
const FB_OFF = { enabled: false, onAuth: () => () => {
}, signIn: () => Promise.reject(), signUp: () => Promise.reject(), google: () => Promise.reject(), reset: () => Promise.reject(), signOut: () => Promise.resolve(), watch: () => () => {
}, save: () => Promise.reject(), setName: () => Promise.reject(), changePassword: () => Promise.reject(), deleteAccount: () => Promise.reject() };
const fb = new Proxy({}, { get: (_, k) => (window.fb || FB_OFF)[k] });
const errMsg = (e) => window.errMsg ? window.errMsg(e) : "Something went wrong. Please try again.";
const ls = {
  get: (k) => {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  },
  set: (k, v) => {
    if (window.__budgyResetting) return;
    try {
      localStorage.setItem(k, v);
    } catch (e) {
    }
  },
  del: (k) => {
    try {
      localStorage.removeItem(k);
    } catch (e) {
    }
  }
};
const KEY = "budgy.state", TK = "budgy.t", UIK = "budgy.ui", GK = "budgy.guest";
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const off = (n) => {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};
const q = (n) => Math.round(n * 100) / 100;
const php = (n) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const pct1 = (x) => (Math.round(x * 10) / 10).toFixed(1) + "%";
const money = (v) => /^\d+(\.\d{1,2})?$/.test(String(v).trim());
const signed = (v) => /^-?\d+(\.\d{1,2})?$/.test(String(v).trim());
let cnt = 0;
const nid = () => "i" + Date.now().toString(36) + (cnt++).toString(36);
const rem = (d) => q(d.total - (d.paid || 0));
const cleanAllocs = (a, ids) => {
  const seen = /* @__PURE__ */ new Set(), out = [];
  (Array.isArray(a) ? a : []).forEach((x) => {
    if (!x || typeof x !== "object" || typeof x.walletId !== "string" || seen.has(x.walletId) || ids && !ids.has(x.walletId)) return;
    const n = +x.amount;
    if (!isFinite(n) || n <= 0) return;
    seen.add(x.walletId);
    out.push({ walletId: x.walletId, amount: q(n) });
  });
  return out;
};
const lockRaw = (d) => d && d.kind === "payable" ? q((d.allocations || []).reduce((a, x) => a + (+x.amount || 0), 0)) : 0;
const lockOf = (d) => Math.min(lockRaw(d), Math.max(0, rem(d)));
const FREQS = ["daily", "weekly", "monthly", "yearly"];
const FREQ_LABEL = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };
const nextDue = (due, freq, day) => {
  const [y, m, dd] = due.split("-").map(Number), D = day || dd;
  if (freq === "daily" || freq === "weekly") {
    const t = new Date(y, m - 1, dd + (freq === "daily" ? 1 : 7));
    return iso(t);
  }
  const ty = freq === "yearly" ? y + 1 : m === 12 ? y + 1 : y, tm = freq === "yearly" ? m : m === 12 ? 1 : m + 1;
  const last = new Date(ty, tm, 0).getDate();
  return iso(new Date(ty, tm - 1, Math.min(D, last)));
};
const isRecur = (d) => !!(d && d.isRecurring && FREQS.includes(d.frequency));
const needsAmt = (d) => !!(d && d.needsAmount && !(d.total > 0));
const cleanRecur = (d) => {
  if (!d || !d.isRecurring || !FREQS.includes(d.frequency)) return {};
  const o = { isRecurring: true, frequency: d.frequency };
  if (d.isVariableAmount === true) o.isVariableAmount = true;
  if (typeof d.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.due)) {
    const n = +(d.recurDay || d.due.slice(8));
    if (n >= 1 && n <= 31) o.recurDay = Math.round(n);
  }
  if (o.isVariableAmount && d.needsAmount === true && !(d.total > 0)) o.needsAmount = true;
  if (typeof d.nextId === "string" && d.nextId) o.nextId = d.nextId;
  return o;
};
const RECUR_KEYS = ["isRecurring", "frequency", "isVariableAmount", "recurDay", "needsAmount", "nextId"];
const stripRecur = (d) => {
  const r = { ...d };
  RECUR_KEYS.forEach((k) => delete r[k]);
  return r;
};
const useLocks = (a, amt, w, left) => {
  let todo = amt;
  const l = (a || []).map((x) => ({ ...x }));
  const take = (x) => {
    const t = Math.min(x.amount, todo);
    x.amount = q(x.amount - t);
    todo = q(todo - t);
  };
  l.filter((x) => x.walletId === w).forEach(take);
  l.forEach(take);
  let over = q(l.reduce((s, x) => s + x.amount, 0) - Math.max(0, left));
  for (let i = l.length - 1; i >= 0 && over > 0; i--) {
    const t = Math.min(l[i].amount, over);
    l[i].amount = q(l[i].amount - t);
    over = q(over - t);
  }
  return l.filter((x) => x.amount > 0);
};
const fd = (s) => (/* @__PURE__ */ new Date(s + "T00:00")).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
const mq = () => window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
const stdLook = (a, dark) => ({
  page: "none",
  card: "none",
  hero: "linear-gradient(rgb(" + a + " / " + (dark ? ".14" : ".10") + "), rgb(" + a + " / " + (dark ? ".14" : ".10") + "))",
  grain: "none",
  stitch: "255 255 255",
  stitchA: 0,
  s1a: 1,
  s2a: 1,
  edge: "0 0 0 0 transparent"
});
const lookOf = (th, dark, accent) => th.look ? th.look(dark) : stdLook(accent, dark);
const accentOf = (th, dark) => dark ? th.a : th.al || th.a;
const THEMES = [
  { id: "classic", name: "Classic", a: "225 29 72", d: ["#09090b", "#111113", "#1a1a1d", "#27272a"], l: ["#f6f6f7", "#ffffff", "#f0f0f2", "#e4e4e7"] },
  { id: "ocean", name: "Ocean", a: "59 130 246", d: ["#080c14", "#0d1320", "#141c2c", "#1f2a3d"], l: ["#f3f6fb", "#ffffff", "#eaf0f8", "#dbe4f0"] },
  { id: "forest", name: "Forest", a: "16 185 129", d: ["#080d0b", "#0e1512", "#151f1a", "#203028"], l: ["#f3f8f5", "#ffffff", "#e9f1ec", "#d9e6de"] },
  { id: "violet", name: "Violet", a: "139 92 246", d: ["#0b0912", "#121019", "#1a1724", "#2a2639"], l: ["#f6f4fb", "#ffffff", "#eeeaf8", "#e0dbf0"] },
  { id: "amber", name: "Amber", a: "245 158 11", d: ["#0d0a06", "#15110b", "#1e1812", "#302819"], l: ["#faf7f1", "#ffffff", "#f4eee2", "#e8dfcc"] },
  { id: "slate", name: "Slate", a: "100 116 139", d: ["#0b0d10", "#121519", "#1a1e24", "#272d35"], l: ["#f4f5f7", "#ffffff", "#ebedf1", "#dcdfe5"] },
  { id: "maroon", name: "Maroon", a: "159 29 58", d: ["#0d0809", "#150d0f", "#1f1417", "#33202a"], l: ["#faf5f6", "#ffffff", "#f4eaed", "#e8d6dc"] },
  { id: "brown", name: "Brown", a: "161 98 58", d: ["#0d0a08", "#15100d", "#1e1814", "#302720"], l: ["#f9f6f3", "#ffffff", "#f2ebe5", "#e5d9ce"] },
  { id: "yellow", name: "Yellow", a: "234 179 8", d: ["#0d0c06", "#15140b", "#1e1c12", "#302d19"], l: ["#fbf9ef", "#ffffff", "#f5f1dd", "#e9e2c0"] }
];
const SWATCHES = [["Crimson", "225 29 72"], ["Violet", "139 92 246"], ["Azure", "59 130 246"], ["Emerald", "16 185 129"], ["Amber", "245 158 11"], ["Pink", "236 72 153"], ["Slate", "100 116 139"]];
const MODES = [["light", "Light", "sun"], ["dark", "Dark", "moon"], ["system", "System", "monitor"]];
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(" ");
const rgbToHex = (s) => "#" + s.split(" ").map((n) => (+n).toString(16).padStart(2, "0")).join("");
const lum = (rgb) => {
  const [r, g, b] = rgb.split(" ").map((n) => {
    n = +n / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const isDarkMode = (mode) => mode === "system" ? !!(mq() && mq().matches) : mode !== "light";
function applyAppearance({ mode, theme, accent }) {
  const dark = isDarkMode(mode), th = THEMES.find((t) => t.id === theme) || THEMES[0], c = dark ? th.d : th.l, r = document.documentElement;
  const lk = lookOf(th, dark, accent);
  const vars = {
    "--bg": hexToRgb(c[0]),
    "--s1": hexToRgb(c[1]),
    "--s2": hexToRgb(c[2]),
    "--bd": hexToRgb(c[3]),
    "--fg": lk.fg || (dark ? "250 250 250" : "24 24 27"),
    "--mu": lk.mu || (dark ? "161 161 170" : "82 82 91"),
    "--pos": dark ? "52 211 153" : "4 120 87",
    "--neg": dark ? "251 113 133" : "220 38 38",
    "--a": accent,
    "--on-a": lum(accent) > 0.179 ? "20 20 22" : "255 255 255",
    // pick whichever of dark/white text has the higher contrast on the accent
    "--page": lk.page,
    "--card-grad": lk.card,
    "--hero-grad": lk.hero,
    "--grain": lk.grain,
    "--stitch": lk.stitch,
    "--stitch-a": String(lk.stitchA),
    "--s1-a": String(lk.s1a),
    "--s2-a": String(lk.s2a),
    "--edge": lk.edge
  };
  Object.keys(vars).forEach((k) => r.style.setProperty(k, vars[k]));
  r.classList.toggle("light", !dark);
  r.classList.toggle("dark", dark);
  r.style.colorScheme = dark ? "dark" : "light";
  const m = document.querySelector("meta[name=theme-color]");
  if (m) m.setAttribute("content", c[0]);
  ls.set(UIK, JSON.stringify({ mode, bg: vars["--bg"], v7: 1 }));
}
const CARD_KEYS = ["liquid", "payables", "expenses", "receivables"];
const cardDefault = () => ({ order: CARD_KEYS.slice(), hidden: [] });
const fixCard = (c) => {
  const o = c && typeof c === "object" ? c : {}, order = [];
  (Array.isArray(o.order) ? o.order : []).forEach((k) => {
    if (CARD_KEYS.includes(k) && !order.includes(k)) order.push(k);
  });
  CARD_KEYS.forEach((k) => {
    if (!order.includes(k)) order.push(k);
  });
  const hidden = (Array.isArray(o.hidden) ? o.hidden : []).filter((k, i, a) => CARD_KEYS.includes(k) && a.indexOf(k) === i);
  return { order, hidden };
};
const HOME_KEYS = ["net", "liquid", "spendable", "spent", "payables", "receivables", "allocated", "projected", "pending"];
const WALLET_COLORS = [["Rose", "#f43f5e"], ["Orange", "#f97316"], ["Amber", "#f59e0b"], ["Green", "#22c55e"], ["Teal", "#14b8a6"], ["Sky", "#0ea5e9"], ["Indigo", "#6366f1"], ["Purple", "#a855f7"], ["Pink", "#ec4899"], ["Slate", "#64748b"]];
const cleanColor = (v) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : "";
const PS_DEFAULTS = [{ kind: "payable", name: "Payables" }, { kind: "receivable", name: "Receivables" }];
const hasSrc = (srcs, kind, name) => srcs.some((x) => x.kind === kind && x.name.toLowerCase() === String(name).trim().toLowerCase());
const blank = () => ({
  name: "",
  avatar: null,
  seen: false,
  mode: "light",
  theme: "brown",
  accent: "",
  ui7: true,
  wallets: [{ id: "w1", name: "Cash on Hand", type: "Cash", balance: 0 }],
  tx: [],
  debts: [],
  goals: [],
  alloc: {},
  srcs: PS_DEFAULTS.map((x) => ({ ...x })),
  cardStats: cardDefault(),
  homePin: "net",
  showCashPie: false,
  ps3: true
});
const dataBlank = () => {
  const b = blank();
  return { wallets: b.wallets, tx: b.tx, debts: b.debts, goals: b.goals, alloc: b.alloc, srcs: b.srcs };
};
const fix = (s) => {
  const mig = !(s && s.ui7);
  const b = blank(), o = { ...b, ...s };
  o.wallets = Array.isArray(o.wallets) && o.wallets.length ? o.wallets : b.wallets;
  ["tx", "debts", "goals"].forEach((k) => {
    if (!Array.isArray(o[k])) o[k] = [];
  });
  if (!o.alloc || typeof o.alloc !== "object") o.alloc = {};
  {
    const ids = new Set(o.wallets.map((w) => w.id));
    o.debts = o.debts.map((d) => {
      if (!d || typeof d !== "object") return d;
      const a = d.kind === "payable" ? cleanAllocs(d.allocations, ids) : [];
      const { allocations, ...r } = stripRecur(d);
      return { ...r, ...cleanRecur(d), ...a.length ? { allocations: a } : {} };
    });
  }
  o.srcs = Array.isArray(o.srcs) ? o.srcs.filter((x) => x && (x.kind === "payable" || x.kind === "receivable") && typeof x.name === "string" && x.name.trim()) : [];
  if (!(s && s.ps3)) PS_DEFAULTS.forEach((x) => {
    if (!hasSrc(o.srcs, x.kind, x.name)) o.srcs.push({ ...x });
  });
  o.ps3 = true;
  const av = o.avatar;
  o.avatar = av && typeof av === "object" && (av.k === "emoji" || av.k === "img") && typeof av.v === "string" && av.v.length < 12e4 ? { k: av.k, v: av.v } : null;
  o.seen = !!o.seen;
  o.cardStats = fixCard(o.cardStats);
  o.homePin = HOME_KEYS.includes(o.homePin) ? o.homePin : "net";
  o.showCashPie = o.showCashPie === true;
  o.wallets = o.wallets.map((w) => cleanColor(w.color) === w.color ? w : { ...w, color: cleanColor(w.color) });
  if (mig) {
    o.mode = "light";
    o.theme = "brown";
    o.accent = "";
  }
  o.ui7 = true;
  if (!THEMES.some((t) => t.id === o.theme)) o.theme = "brown";
  if (!["light", "dark", "system"].includes(o.mode)) o.mode = "light";
  return o;
};
const load = () => {
  try {
    const s = JSON.parse(ls.get(KEY));
    if (s && s.wallets) return fix(s);
  } catch (e) {
  }
  return blank();
};
const sample = () => ({
  wallets: [
    { id: "w1", name: "Cash on Hand", type: "Cash", balance: 3200 },
    { id: "w2", name: "BDO Bank", type: "Bank", balance: 41e3 },
    { id: "w3", name: "GCash", type: "E-Wallet", balance: 5300 },
    { id: "w4", name: "Maya", type: "E-Wallet", balance: 1800 }
  ],
  tx: [
    { id: nid(), type: "income", amount: 35e3, category: "Salary", date: off(-12), note: "Monthly pay", wallet: "w2" },
    { id: nid(), type: "expense", amount: 9500, category: "Rent", date: off(-10), note: "Apartment", wallet: "w2" },
    { id: nid(), type: "expense", amount: 2450, category: "Food", date: off(-6), note: "Groceries", wallet: "w1" },
    { id: nid(), type: "transfer", amount: 3e3, category: "Transfer", date: off(-4), note: "Top up GCash", wallet: "w2", to: "w3" },
    { id: nid(), type: "expense", amount: 850, category: "Transport", date: off(-3), note: "Grab rides", wallet: "w3" },
    { id: nid(), type: "expense", amount: 1200, category: "Fun", date: off(-2), note: "Movie night", wallet: "w4" },
    { id: nid(), type: "expense", amount: 640, category: "Food", date: off(-1), note: "Lunch with team", wallet: "w1" },
    { id: nid(), type: "expense", amount: 1699, category: "Bills", date: off(3), note: "Internet bill", wallet: "w2" },
    { id: nid(), type: "income", amount: 8e3, category: "Freelance", date: off(5), note: "Logo project", wallet: "w3" }
  ],
  debts: [
    { id: nid(), kind: "payable", cat: "Installments", party: "Phone installment", total: 4200.5, paid: 0, payments: [], due: off(8), wallet: "w3", allocations: [{ walletId: "w3", amount: 1500 }] },
    { id: nid(), kind: "payable", cat: "School", party: "2nd semester balance", total: 4e4, paid: 1e4, payments: [{ id: nid(), amount: 1e4, wallet: "w2", date: off(-5) }], due: off(20), wallet: "w2" },
    { id: nid(), kind: "receivable", cat: "Family", party: "Monthly allowance", total: 5e3, paid: 0, payments: [], due: off(9), wallet: "w2", isRecurring: true, frequency: "monthly" },
    { id: nid(), kind: "payable", cat: "Payables", party: "Electric bill", total: 0, paid: 0, payments: [], due: off(12), wallet: "w2", isRecurring: true, frequency: "monthly", isVariableAmount: true, needsAmount: true }
  ],
  goals: [
    { id: nid(), name: "Emergency Fund", target: 6e4, saved: 22e3 },
    { id: nid(), name: "New Laptop", target: 45e3, saved: 12500 },
    { id: nid(), name: "Baguio Trip", target: 15e3, saved: 9e3 }
  ],
  alloc: {},
  // Demo sources, so the demo Pending tab shows the same groups the demo payables use.
  srcs: [{ kind: "payable", name: "Payables" }, { kind: "payable", name: "Installments" }, { kind: "payable", name: "School" }, { kind: "receivable", name: "Receivables" }, { kind: "receivable", name: "Family" }]
});
function calc(S) {
  const t = off(0), n = /* @__PURE__ */ new Date(), mo = t.slice(0, 7), em = iso(new Date(n.getFullYear(), n.getMonth() + 1, 0));
  const bal = Object.fromEntries(S.wallets.map((w) => [w.id, +w.balance || 0]));
  let spent = 0, pend = 0;
  const cat = {};
  S.tx.forEach((x) => {
    if (x.date > t) {
      if (x.date <= em) pend += x.type === "income" ? x.amount : x.type === "expense" ? -x.amount : 0;
      return;
    }
    if (!(x.wallet in bal)) return;
    if (x.type === "income") bal[x.wallet] += x.amount;
    else if (x.type === "expense") {
      bal[x.wallet] -= x.amount;
      if (x.date.startsWith(mo)) {
        spent += x.amount;
        cat[x.category] = (cat[x.category] || 0) + x.amount;
      }
    } else if (x.to in bal) {
      bal[x.wallet] -= x.amount;
      bal[x.to] += x.amount;
    }
  });
  let pay = 0, rec = 0, dPay = 0, dRec = 0;
  S.debts.forEach((d) => {
    ;
    (d.payments || []).forEach((p) => {
      if (p.wallet in bal) bal[p.wallet] += d.kind === "receivable" ? p.amount : -p.amount;
    });
    const r = rem(d);
    if (r <= 0) return;
    if (d.kind === "payable") {
      pay += r;
      if (d.due <= em) dPay += r;
    } else {
      rec += r;
      if (d.due <= em) dRec += r;
    }
  });
  Object.keys(bal).forEach((k) => bal[k] = q(bal[k]));
  Object.keys(cat).forEach((k) => cat[k] = q(cat[k]));
  const liquid = q(Object.values(bal).reduce((a, b) => a + b, 0));
  const day = n.getDate(), dim = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate(), left = dim - day;
  const fc = Math.trunc(q(spent) / day * left * 100 + 1e-6) / 100;
  const lockW = Object.fromEntries(S.wallets.map((w) => [w.id, 0]));
  let locked = 0;
  S.debts.forEach((d) => {
    const L = lockOf(d);
    if (!L) return;
    locked += L;
    const raw = lockRaw(d);
    (d.allocations || []).forEach((x) => {
      if (x.walletId in lockW) lockW[x.walletId] += (+x.amount || 0) * (L / raw);
    });
  });
  Object.keys(lockW).forEach((k) => lockW[k] = q(lockW[k]));
  locked = q(locked);
  const allocD = q(S.debts.filter((d) => d.kind === "payable").reduce((a, d) => a + Math.min(S.alloc["d:" + d.id] || 0, Math.max(0, rem(d) - lockOf(d))), 0));
  const saved = q(S.goals.reduce((a, g) => a + g.saved, 0)), target = q(S.goals.reduce((a, g) => a + g.target, 0));
  return {
    bal,
    liquid,
    pay: q(pay),
    rec: q(rec),
    spent: q(spent),
    cat,
    pend: q(pend),
    dPay: q(dPay),
    dRec: q(dRec),
    fc,
    day,
    dim,
    left,
    monthPct: day / dim * 100,
    monthName: n.toLocaleDateString("en-PH", { month: "long" }),
    net: q(liquid + rec - pay),
    allocD,
    locked,
    lockW,
    saved,
    target,
    allocated: q(allocD + locked + saved),
    spendable: q(liquid - allocD - locked - saved),
    projected: q(liquid + pend + dRec - dPay - fc)
  };
}
const txOk = (s, t) => s.wallets.some((w) => w.id === t.wallet) && (t.type !== "transfer" || s.wallets.some((w) => w.id === t.to));
const txDrop = (s, id) => s.tx.some((t) => t.id === id) ? { ...s, tx: s.tx.filter((t) => t.id !== id) } : s;
const txPut = (s, t, at) => {
  const tx = s.tx.slice(), i = tx.findIndex((x) => x.id === t.id);
  if (i >= 0) tx[i] = t;
  else tx.splice(Math.max(0, Math.min(at | 0, tx.length)), 0, t);
  return { ...s, tx };
};
const txSub = (s, t) => {
  const W = (id) => (s.wallets.find((w) => w.id === id) || {}).name || "Removed wallet";
  return (t.type === "income" ? "+" : t.type === "expense" ? "−" : "") + php(t.amount) + " · " + (t.type === "transfer" ? W(t.wallet) + " → " + W(t.to) : (t.category || "") + " · " + W(t.wallet));
};
const Ctx = createContext();
const useApp = () => useContext(Ctx);
function Provider({ children }) {
  const [S, setS] = useState(load), [user, setUser] = useState(null), [ready, setReady] = useState(false), [sync, setSync] = useState("local");
  const [toast, setToast] = useState(null);
  const [guest, setGuestState] = useState(() => ls.get(GK) === "1"), [sysDark, setSysDark] = useState(() => !!(mq() && mq().matches));
  const R = useRef({ S: null, t: +(ls.get(TK) || 0), sent: 0, ready: false, mounted: false, skip: false, timer: 0, uid: null, lock: false }).current;
  const ui = useMemo(() => {
    const th = THEMES.find((t) => t.id === S.theme) || THEMES[0], dark = S.mode === "system" ? sysDark : S.mode !== "light";
    return { mode: S.mode, theme: th.id, accent: S.accent || accentOf(th, dark), dark };
  }, [S.mode, S.theme, S.accent, sysDark]);
  useEffect(() => {
    applyAppearance(ui);
  }, [ui]);
  useEffect(() => {
    const m = mq();
    if (!m || !m.addEventListener) return;
    const f = () => setSysDark(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  const push = (state) => {
    if (R.lock) return;
    const t = R.t || Date.now();
    R.t = t;
    R.sent = t;
    fb.save(R.uid, t, state || R.S).then(() => setSync("synced")).catch(() => setSync("error"));
  };
  const adopt = (d) => {
    const ns = fix(d.state);
    R.skip = true;
    R.t = d.t;
    R.sent = d.t;
    R.S = ns;
    ls.set(TK, String(d.t));
    setToast(null);
    setS(ns);
    setSync("synced");
  };
  const wipeLocal = () => {
    const keep = { mode: R.S.mode, theme: R.S.theme, accent: R.S.accent, cardStats: R.S.cardStats, homePin: R.S.homePin, showCashPie: R.S.showCashPie };
    const ns = { ...blank(), ...keep };
    R.skip = true;
    R.t = 0;
    R.sent = 0;
    R.ready = false;
    R.S = ns;
    setToast(null);
    setS(ns);
    ls.del(TK);
    ls.set(KEY, JSON.stringify(ns));
  };
  useEffect(() => {
    let off2 = () => {
    }, dead = false;
    const fallback = setTimeout(() => {
      if (!dead) {
        console.warn("Budgy: auth did not answer in 3s, showing the app anyway");
        setReady(true);
      }
    }, 3e3);
    try {
      if (!fb.enabled) setReady(true);
      else off2 = fb.onAuth((u) => {
        if (u) {
          ls.del(GK);
          setGuestState(false);
        }
        setUser(u);
        setReady(true);
      }) || off2;
    } catch (e) {
      console.error("Budgy: auth init failed", e);
      setReady(true);
    }
    return () => {
      dead = true;
      clearTimeout(fallback);
      try {
        off2();
      } catch (e) {
      }
    };
  }, []);
  useEffect(() => {
    R.S = S;
    ls.set(KEY, JSON.stringify(S));
    if (!R.mounted) {
      R.mounted = true;
      return;
    }
    if (R.skip) {
      R.skip = false;
      return;
    }
    R.t = Date.now();
    ls.set(TK, String(R.t));
    if (!R.uid || !R.ready || R.lock) return;
    clearTimeout(R.timer);
    setSync("saving");
    R.timer = setTimeout(() => push(), 600);
  }, [S]);
  useEffect(() => {
    R.uid = user ? user.uid : null;
    R.ready = false;
    if (!user) {
      setSync("local");
      return;
    }
    setSync("connecting");
    return fb.watch(user.uid, (d, pending) => {
      if (pending || R.lock) return;
      if (!d) {
        const ns = fix(R.S.wallets.length && R.t ? R.S : blank());
        if (!ns.name && user.name) ns.name = user.name;
        R.skip = true;
        R.S = ns;
        setS(ns);
        R.ready = true;
        R.t = R.t || Date.now();
        push(ns);
        return;
      }
      if (!R.ready) {
        R.ready = true;
        if (d.t >= R.t) adopt(d);
        else push();
        return;
      }
      if (d.t > R.sent && d.t > R.t) adopt(d);
      else setSync("synced");
    }, () => setSync("error"));
  }, [user && user.uid]);
  const c = useMemo(() => calc(S), [S]);
  const run = async (fn) => {
    try {
      await fn();
      return "";
    } catch (e) {
      return errMsg(e);
    }
  };
  const auth = {
    signIn: (e, p) => run(() => fb.signIn(e.trim(), p)),
    signUp: (n, e, p) => run(() => fb.signUp(n.trim(), e.trim(), p)),
    google: () => run(() => fb.google()),
    reset: (e) => run(() => fb.reset(e.trim())),
    // Phase 3 account controls. Each returns '' on success or a friendly error message.
    setName: (n) => run(async () => {
      if (user) await fb.setName(n);
    }),
    changePassword: (cur, nw) => run(() => fb.changePassword(cur, nw)),
    deleteAccount: async (pw) => {
      R.lock = true;
      clearTimeout(R.timer);
      const err = await run(() => fb.deleteAccount(pw));
      if (err) {
        R.lock = false;
        if (R.uid && R.ready) push();
        return err;
      }
      ls.del(GK);
      wipeLocal();
      R.lock = false;
      return "";
    },
    logout: () => run(async () => {
      await fb.signOut();
      wipeLocal();
    }),
    useGuest: () => {
      ls.set(GK, "1");
      setGuestState(true);
    },
    leaveGuest: () => {
      ls.del(GK);
      setGuestState(false);
    }
  };
  const step = (op, dir) => {
    const undoing = dir === "back", need = undoing ? op.chkB : op.chkF;
    if (need && !txOk(R.S, need)) {
      setToast({ ok: false, msg: "Can’t " + (undoing ? "undo" : "redo") + " that", sub: "A wallet it uses has been deleted." });
      return;
    }
    setS(undoing ? op.back : op.fwd);
    setToast({ ok: true, msg: undoing ? "Undone" : "Redone", sub: undoing ? op.title + " · balances restored" : op.title, label: undoing ? "Redo" : "Undo", undo: () => step(op, undoing ? "fwd" : "back") });
  };
  const offer = (op) => setToast({ ok: true, msg: op.title, sub: op.sub, label: "Undo", undo: () => step(op, "back") });
  const upd = (key, id, p) => setS((s) => ({ ...s, [key]: s[key].map((x) => x.id === id ? { ...x, ...p } : x) }));
  const api = {
    S,
    c,
    ui,
    user,
    guest,
    ready,
    sync,
    auth,
    fbEnabled: !!fb.enabled,
    toast,
    setToast,
    set: (p) => setS((s) => ({ ...s, ...p })),
    // Wallets
    addWallet: (w) => setS((s) => ({ ...s, wallets: [...s.wallets, { id: nid(), ...w }] })),
    updateWallet: (id, p) => upd("wallets", id, p),
    deleteWallet: (id) => setS((s) => {
      if (s.wallets.length < 2) return s;
      const rest = s.wallets.filter((w) => w.id !== id);
      return {
        ...s,
        wallets: rest,
        tx: s.tx.filter((x) => x.wallet !== id && x.to !== id),
        debts: s.debts.map((d) => {
          const gone = (d.payments || []).filter((p) => p.wallet === id), amt = q(gone.reduce((a, p) => a + p.amount, 0));
          if (d.allocations) {
            const a = d.allocations.filter((x) => x.walletId !== id);
            if (a.length) d = { ...d, allocations: a };
            else {
              d = { ...d };
              delete d.allocations;
            }
          }
          return { ...d, wallet: d.wallet === id ? rest[0].id : d.wallet, paid: q(Math.max(0, (d.paid || 0) - amt)), payments: (d.payments || []).filter((p) => p.wallet !== id) };
        })
      };
    }),
    // Transactions. Every add / edit / delete raises a toast with Undo; Undo then offers Redo (see offer / step above the api object).
    // Only the most recent action can be undone: the next action replaces the toast, and the toast clears itself after a few seconds.
    // `o` ({ title, sub }) lets a caller word the toast itself (the deep-link save does); `o === false` saves silently.
    addTx: (x, o) => {
      const id = nid(), t = { id, ...x };
      setS((s) => txPut(s, t, 0));
      if (o !== false) offer({ title: o && o.title || t.type[0].toUpperCase() + t.type.slice(1) + " saved", sub: o && o.sub || txSub(R.S, t), fwd: (s) => txPut(s, t, 0), back: (s) => txDrop(s, id), chkF: t, chkB: null });
      return id;
    },
    // v9 P5: add many transactions at once (Smart Importer). One state update and ONE Undo toast that removes the whole batch; Redo puts it back.
    addTxBatch: (list) => {
      const ts = list.map((x) => ({ id: nid(), ...x }));
      if (!ts.length) return 0;
      const ids = new Set(ts.map((t) => t.id)), fwd = (s) => ({ ...s, tx: [...ts.filter((t) => !s.tx.some((x) => x.id === t.id)), ...s.tx] }), back = (s) => ({ ...s, tx: s.tx.filter((t) => !ids.has(t.id)) });
      setS(fwd);
      offer({ title: "Successfully imported " + ts.length + " transaction" + (ts.length === 1 ? "" : "s") + "!", sub: "Tap Undo to remove them all", fwd, back, chkF: ts[0], chkB: null });
      return ts.length;
    },
    delTx: (id, o) => {
      const at = R.S.tx.findIndex((t2) => t2.id === id);
      if (at < 0) return;
      const t = R.S.tx[at];
      setS((s) => txDrop(s, id));
      if (o !== false) offer({ title: o && o.title || "Transaction deleted", sub: o && o.sub || txSub(R.S, t), fwd: (s) => txDrop(s, id), back: (s) => txPut(s, t, at), chkF: null, chkB: t });
    },
    // v9 P1: edit a transaction in place. Wallet balances are never stored: calc() rebuilds them from the opening balance + this list,
    // so changing the amount, wallet, destination or date automatically takes the old effect off the old wallet and puts the new one on the new wallet.
    // v9 P2: the old version is kept for Undo. Saving without changing anything does nothing (no toast, no fake undo step).
    updTx: (id, p, o) => {
      const before = R.S.tx.find((t) => t.id === id);
      if (!before) return;
      const after = { ...before, ...p };
      if (Object.keys(p).every((k) => before[k] === after[k])) return;
      setS((s) => txPut(s, after));
      if (o !== false) offer({ title: o && o.title || "Changes saved", sub: o && o.sub || txSub(R.S, after), fwd: (s) => txPut(s, after), back: (s) => txPut(s, before), chkF: after, chkB: before });
    },
    // Payables and receivables (a payment moves money in or out of a wallet through calc())
    addDebt: (d) => setS((s) => ({ ...s, debts: [...s.debts, { id: nid(), paid: 0, payments: [], ...d }] })),
    // v8 P2: an edit that carries `isRecurring` replaces the item's recurring fields (off = they are removed); other edits leave them alone.
    updDebt: (id, p) => setS((s) => ({ ...s, debts: s.debts.map((x) => {
      if (x.id !== id) return x;
      const m = { ...x, ...p };
      return "isRecurring" in p ? { ...stripRecur(m), ...cleanRecur(m) } : m;
    }) })),
    delDebt: (id) => setS((s) => {
      const a = { ...s.alloc };
      delete a["d:" + id];
      return { ...s, debts: s.debts.filter((d) => d.id !== id), alloc: a };
    }),
    // v8 P2: when a recurring item is fully paid / received, the next one is generated (unless it already was). A variable-amount item comes back at 0 and needs an amount.
    payDebt: (id, amount, wallet) => setS((s) => {
      let made = null;
      const debts = s.debts.map((d) => {
        if (d.id !== id) return d;
        const n = { ...d, paid: q((d.paid || 0) + amount), payments: [...d.payments || [], { id: nid(), amount, wallet, date: off(0) }] }, a = useLocks(d.allocations, amount, wallet, rem(n));
        if (a.length) n.allocations = a;
        else delete n.allocations;
        if (isRecur(n) && rem(n) <= 0 && !(n.nextId && s.debts.some((x) => x.id === n.nextId))) {
          const v = n.isVariableAmount === true, day = n.recurDay || +n.due.slice(8), nx = nid();
          made = { id: nx, kind: n.kind, cat: n.cat, party: n.party, total: v ? 0 : n.total, paid: 0, payments: [], due: nextDue(n.due, n.frequency, day), wallet: n.wallet, isRecurring: true, frequency: n.frequency, recurDay: day };
          if (v) {
            made.isVariableAmount = true;
            made.needsAmount = true;
          }
          n.nextId = nx;
        }
        return n;
      });
      return { ...s, debts: made ? [...debts, made] : debts };
    }),
    // Wallet allocations for one payable: [{ walletId, amount }]. An empty list removes the lock.
    setAllocations: (id, list) => setS((s) => {
      const a = cleanAllocs(list, new Set(s.wallets.map((w) => w.id)));
      return { ...s, debts: s.debts.map((d) => {
        if (d.id !== id || d.kind !== "payable") return d;
        const { allocations, ...r } = d;
        return a.length ? { ...r, allocations: a } : r;
      }) };
    }),
    // Remove the whole allocation of one payable: its wallet locks AND any Smart Plan reserve go back to Spendable. Wallet balances and payments are never touched.
    clearAllocation: (id) => setS((s) => {
      const al = { ...s.alloc };
      delete al["d:" + id];
      return { ...s, alloc: al, debts: s.debts.map((d) => {
        if (d.id !== id || d.kind !== "payable" || !d.allocations) return d;
        const { allocations, ...r } = d;
        return r;
      }) };
    }),
    // Undo a recorded payment / receipt: the entry is removed (the wallet gets its money back or gives it up again) and the remaining balance is restored.
    undoPay: (id, payId) => setS((s) => {
      let gone = null;
      const debts = s.debts.map((d) => {
        const p = d.id === id && (d.payments || []).find((x) => x.id === payId);
        if (!p) return d;
        const n = { ...d, paid: q(Math.max(0, (d.paid || 0) - p.amount)), payments: d.payments.filter((x) => x.id !== payId) };
        if (n.nextId && rem(n) > 0) {
          const nx = s.debts.find((x) => x.id === n.nextId);
          if (nx && !(nx.payments || []).length) {
            gone = nx.id;
            delete n.nextId;
          }
        }
        return n;
      });
      if (!gone) return { ...s, debts };
      const a = { ...s.alloc };
      delete a["d:" + gone];
      return { ...s, debts: debts.filter((d) => d.id !== gone), alloc: a };
    }),
    // Sources (the groups on the Pending tab). A source is { kind: 'payable' | 'receivable', name }; payables / receivables point to it with `cat`.
    addSrc: (kind, name) => setS((s) => hasSrc(s.srcs || [], kind, name) ? s : { ...s, srcs: [...s.srcs || [], { kind, name: name.trim() }] }),
    renameSrc: (kind, old, name) => setS((s) => {
      const n = name.trim(), has = (s.srcs || []).some((x) => x.kind === kind && x.name === old);
      return { ...s, srcs: has ? s.srcs.map((x) => x.kind === kind && x.name === old ? { ...x, name: n } : x) : [...s.srcs || [], { kind, name: n }], debts: s.debts.map((d) => d.kind === kind && d.cat === old ? { ...d, cat: n } : d) };
    }),
    delSrc: (kind, name) => setS((s) => {
      const gone = new Set(s.debts.filter((d) => d.kind === kind && d.cat === name).map((d) => d.id)), a = { ...s.alloc };
      gone.forEach((id) => delete a["d:" + id]);
      return { ...s, srcs: (s.srcs || []).filter((x) => !(x.kind === kind && x.name === name)), debts: s.debts.filter((d) => !gone.has(d.id)), alloc: a };
    }),
    // Smart Plan allocations, keyed 'd:<debtId>'
    setAlloc: (p) => setS((s) => ({ ...s, alloc: { ...s.alloc, ...p } })),
    // Goals
    addGoal: (g) => setS((s) => ({ ...s, goals: [...s.goals, { id: nid(), saved: 0, ...g }] })),
    updGoal: (id, p) => upd("goals", id, p),
    delGoal: (id) => setS((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })),
    addToGoal: (id, amt) => setS((s) => ({ ...s, goals: s.goals.map((g) => g.id === id ? { ...g, saved: q(g.saved + amt) } : g) })),
    // Data
    loadSample: () => {
      setToast(null);
      setS((s) => ({ ...s, ...sample() }));
    },
    clearData: () => {
      setToast(null);
      setS((s) => ({ ...s, ...dataBlank() }));
    },
    // Replaces the budget data with an already-validated backup (see io.js). Name, avatar and appearance are only replaced when the backup has them.
    restoreData: (d, o) => {
      if (!o) {
        setToast(null);
        setS((s) => ({ ...s, ...d }));
        return;
      }
      const prev = {};
      Object.keys(d).forEach((k) => {
        prev[k] = R.S[k];
      });
      setS((s) => ({ ...s, ...d }));
      setToast({ ok: true, msg: o.msg, sub: o.sub, label: "Undo", undo: () => {
        setS((s) => ({ ...s, ...prev }));
        setToast({ ok: true, msg: "Import undone", sub: "Your previous data is back" });
      } });
    }
  };
  return /* @__PURE__ */ React.createElement(Ctx.Provider, { value: api }, children);
}

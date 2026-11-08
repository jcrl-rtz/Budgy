Object.assign(IC, {
  upl: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"],
  json: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1", "M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"]
});
const BACKUP_APP = "budgy", BACKUP_VERSION = 2;
const MAX_BACKUP_BYTES = 8 * 1024 * 1024;
const saveFile = (name, text, type, bom) => {
  const url = URL.createObjectURL(new Blob([(bom ? "\uFEFF" : "") + text], { type })), a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4e3);
};
const safeCell = (v) => {
  const s = String(v == null ? "" : v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
};
const csvOut = (rows) => rows.map((r) => r.map((v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"').join(",")).join("\r\n");
function buildBackup(S) {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    profile: { name: S.name || "", avatar: S.avatar || null, mode: S.mode, theme: S.theme, accent: S.accent || "", cardStats: fixCard(S.cardStats), homePin: HOME_KEYS.includes(S.homePin) ? S.homePin : "net", showCashPie: S.showCashPie === true },
    data: { wallets: S.wallets, tx: S.tx, debts: S.debts, goals: S.goals, alloc: S.alloc || {}, srcs: S.srcs || [] }
  };
}
function buildTxRows(S) {
  const t0 = off(0), W = Object.fromEntries(S.wallets.map((w) => [w.id, w.name])), nm = (id) => W[id] || "Removed wallet";
  const own = S.tx.map((x) => [x.date, x.type, safeCell(x.category), safeCell(x.note || ""), safeCell(nm(x.wallet)), x.type === "transfer" ? safeCell(nm(x.to)) : "", x.amount, x.date > t0 ? "Scheduled" : "Posted"]);
  const paid = S.debts.flatMap((d) => (d.payments || []).map((y) => [y.date, d.kind === "payable" ? "expense" : "income", safeCell(d.cat), safeCell((d.kind === "payable" ? "Paid · " : "Received · ") + d.party), safeCell(nm(y.wallet)), "", y.amount, "Posted"]));
  return [...own, ...paid].sort((a, b) => b[0].localeCompare(a[0]));
}
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(/* @__PURE__ */ new Date(s + "T00:00"));
const isNum = (n) => typeof n === "number" && isFinite(n);
const str = (v, max) => typeof v === "string" ? v.trim().slice(0, max) : "";
function parseBackup(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { error: "That file is not valid JSON. Choose a backup file exported from Budgy." };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { error: "This file does not look like a Budgy backup." };
  const wrapped = raw.data && typeof raw.data === "object";
  if (wrapped && raw.app && raw.app !== BACKUP_APP) return { error: "This backup was made by a different app (" + str(String(raw.app), 30) + ")." };
  if (wrapped && isNum(raw.version) && raw.version > BACKUP_VERSION) return { error: "This backup was made by a newer version of Budgy. Update the app and try again." };
  const d = wrapped ? raw.data : raw, p = wrapped ? raw.profile || {} : raw;
  if (!Array.isArray(d.wallets) && !Array.isArray(d.tx) && !Array.isArray(d.debts) && !Array.isArray(d.goals)) return { error: "No wallets, transactions, payables or goals were found in this file." };
  let skipped = 0;
  const ids = /* @__PURE__ */ new Set(), uid = (id) => {
    let k = str(String(id == null ? "" : id), 40) || nid();
    while (ids.has(k)) k = nid();
    ids.add(k);
    return k;
  };
  const wallets = [];
  (Array.isArray(d.wallets) ? d.wallets : []).forEach((w) => {
    if (!w || typeof w !== "object" || !str(w.name, 40) || !isNum(+w.balance)) {
      skipped++;
      return;
    }
    wallets.push({ id: uid(w.id), name: str(w.name, 40), type: str(w.type, 20) || "Cash", balance: q(+w.balance), color: cleanColor(w.color) });
  });
  const defaultWallet = !wallets.length;
  if (!wallets.length) wallets.push({ id: uid("w1"), name: "Cash on Hand", type: "Cash", balance: 0 });
  const wid = new Set(wallets.map((w) => w.id));
  const tx = [];
  (Array.isArray(d.tx) ? d.tx : []).forEach((x) => {
    const ok = x && typeof x === "object" && ["income", "expense", "transfer"].includes(x.type) && isNum(x.amount) && x.amount > 0 && isDate(x.date) && wid.has(x.wallet) && (x.type !== "transfer" || wid.has(x.to) && x.to !== x.wallet);
    if (!ok) {
      skipped++;
      return;
    }
    const o = { id: uid(x.id), type: x.type, amount: q(x.amount), category: str(x.category, 40) || (x.type === "transfer" ? "Transfer" : "Other"), date: x.date, note: str(x.note, 120), wallet: x.wallet };
    if (x.type === "transfer") o.to = x.to;
    tx.push(o);
  });
  const debts = [];
  (Array.isArray(d.debts) ? d.debts : []).forEach((x) => {
    if (!x || typeof x !== "object" || !["payable", "receivable"].includes(x.kind) || !isNum(x.total) || x.total < 0 || x.total === 0 && !(x.isRecurring && x.isVariableAmount && x.needsAmount) || !isDate(x.due) || !str(x.party, 40)) {
      skipped++;
      return;
    }
    const payments = (Array.isArray(x.payments) ? x.payments : []).filter((y) => y && isNum(y.amount) && y.amount > 0 && wid.has(y.wallet) && isDate(y.date)).map((y) => ({ id: uid(y.id), amount: q(y.amount), wallet: y.wallet, date: y.date }));
    const paid = q(payments.reduce((a, y) => a + y.amount, 0));
    debts.push({ id: uid(x.id), kind: x.kind, cat: str(x.cat, 24) || "Other", party: str(x.party, 40), total: q(x.total), paid: Math.min(paid, q(x.total)), payments, due: x.due, wallet: wid.has(x.wallet) ? x.wallet : wallets[0].id });
    const al = x.kind === "payable" ? cleanAllocs(x.allocations, wid) : [];
    if (al.length) debts[debts.length - 1].allocations = al;
    Object.assign(debts[debts.length - 1], cleanRecur({ ...x, due: x.due, total: x.total }));
  });
  const goals = [];
  (Array.isArray(d.goals) ? d.goals : []).forEach((g) => {
    if (!g || typeof g !== "object" || !str(g.name, 40) || !isNum(g.target) || g.target <= 0) {
      skipped++;
      return;
    }
    goals.push({ id: uid(g.id), name: str(g.name, 40), target: q(g.target), saved: q(Math.min(Math.max(0, isNum(g.saved) ? g.saved : 0), g.target)) });
  });
  const alloc = {}, dids = new Set(debts.filter((x) => x.kind === "payable").map((x) => x.id));
  if (d.alloc && typeof d.alloc === "object") Object.keys(d.alloc).forEach((k) => {
    if (k.startsWith("d:") && dids.has(k.slice(2)) && isNum(d.alloc[k]) && d.alloc[k] >= 0) alloc[k] = q(d.alloc[k]);
  });
  const seen = /* @__PURE__ */ new Set(), srcs = [];
  const addSrc = (kind, name) => {
    const n = str(name, 24), k = kind + "|" + n.toLowerCase();
    if (n && !seen.has(k)) {
      seen.add(k);
      srcs.push({ kind, name: n });
    }
  };
  (Array.isArray(d.srcs) ? d.srcs : []).forEach((x) => {
    if (x && (x.kind === "payable" || x.kind === "receivable")) addSrc(x.kind, x.name);
  });
  debts.forEach((x) => addSrc(x.kind, x.cat));
  const profile = {};
  if (typeof p.name === "string") profile.name = p.name.trim().slice(0, 40);
  const av = p.avatar;
  if (av && typeof av === "object" && (av.k === "emoji" || av.k === "img") && typeof av.v === "string" && av.v.length < 12e4) profile.avatar = { k: av.k, v: av.v };
  if (["light", "dark", "system"].includes(p.mode)) profile.mode = p.mode;
  if (THEMES.some((t) => t.id === p.theme)) profile.theme = p.theme;
  if (typeof p.accent === "string" && (p.accent === "" || /^\d{1,3} \d{1,3} \d{1,3}$/.test(p.accent))) profile.accent = p.accent;
  if (p.cardStats && typeof p.cardStats === "object") profile.cardStats = fixCard(p.cardStats);
  if (HOME_KEYS.includes(p.homePin)) profile.homePin = p.homePin;
  if (typeof p.showCashPie === "boolean") profile.showCashPie = p.showCashPie;
  return { defaultWallet, data: { wallets, tx, debts, goals, alloc, srcs }, profile, counts: { wallets: wallets.length, tx: tx.length, debts: debts.length, goals: goals.length }, skipped, at: wrapped && typeof raw.exportedAt === "string" ? raw.exportedAt.slice(0, 10) : "" };
}
const SI_MAX_ROWS = 2e4, SI_MAX_BYTES = 12 * 1024 * 1024;
const siPad = (n) => (n < 10 ? "0" : "") + n;
const siYmd = (y, m, d) => {
  const t = new Date(y, m - 1, d);
  return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === d && y >= 1990 && y <= 2100 ? y + "-" + siPad(m) + "-" + siPad(d) : null;
};
const siFlat = (o) => {
  const r = {}, walk = (v, p, d) => {
    if (v == null || typeof v !== "object") {
      if (p) r[p] = v;
      return;
    }
    if (d >= 4 || Object.keys(r).length > 80) return;
    if (Array.isArray(v)) {
      if (v.length && v.length <= 8 && v.every((x) => x == null || typeof x !== "object")) v.forEach((x, i) => walk(x, p + "." + i, d + 1));
      return;
    }
    Object.keys(v).forEach((k) => walk(v[k], p ? p + "." + k : k, d + 1));
  };
  walk(o, "", 0);
  return r;
};
const siPlain = (x) => x && typeof x === "object" && !Array.isArray(x);
const siObjs = (a) => Array.isArray(a) && a.length && a.filter(siPlain).length >= Math.ceil(a.length * 0.8) ? a.filter(siPlain) : null;
const siFind = (raw, depth) => {
  const d = depth || 0;
  if (Array.isArray(raw)) return siObjs(raw);
  if (!siPlain(raw)) return null;
  if (d < 3) for (const k of Object.keys(raw)) {
    const v = raw[k];
    const f = Array.isArray(v) ? siObjs(v) : siPlain(v) ? siFind(v, d + 1) : null;
    if (f) return f;
  }
  if (d === 0) {
    const ks = Object.keys(raw), vals = ks.map((k) => raw[k]);
    if (ks.length > 1 && vals.filter(siPlain).length >= Math.ceil(ks.length * 0.8)) return ks.filter((k) => siPlain(raw[k])).map((k) => ({ _key: k, ...raw[k] }));
    if (ks.length) return [raw];
  }
  return null;
};
const siKeys = (text) => {
  try {
    const t = JSON.parse(String(text).replace(/^\uFEFF/, ""));
    const o = Array.isArray(t) ? t.find(siPlain) : t;
    return siPlain(o) ? Object.keys(o).slice(0, 3) : [];
  } catch (e) {
    const m = String(text).match(/"([^"\\]{1,30})"\s*:/g) || [];
    return [...new Set(m.map((x) => x.replace(/"\s*:$/, "").slice(1)))].slice(0, 3);
  }
};
function siParse(text) {
  text = String(text).replace(/^\uFEFF/, "").trim();
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    try {
      raw = lines.length > 1 ? lines.map((x) => JSON.parse(x)) : null;
    } catch (e2) {
      raw = null;
    }
    if (!raw) return { error: "That file is not valid JSON." };
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw) && raw.app === BACKUP_APP) return { native: true };
  const found = siFind(raw);
  if (!found) return { error: "No list of transactions was found." };
  if (found.length > SI_MAX_ROWS) return { error: "This file has " + found.length + " rows. The limit is " + SI_MAX_ROWS + " per import; split the file and import it in parts." };
  const rows = found.map(siFlat), seen = /* @__PURE__ */ new Set(), keys = [];
  rows.slice(0, 300).forEach((r) => Object.keys(r).forEach((k) => {
    if (!seen.has(k) && r[k] != null && r[k] !== "") {
      seen.add(k);
      keys.push(k);
    }
  }));
  if (!keys.length) return { error: "The rows in this file have no usable fields." };
  return { rows, keys };
}
const siNum = (v) => {
  if (typeof v === "number") return isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || !/\d/.test(t) || /[a-df-z]{3,}/i.test(t.replace(/php|usd|eur|gbp|jpy|cr|dr/gi, ""))) return null;
  const neg = /^\(.*\)$/.test(t) || /^[^\d.,]*-/.test(t) || /\d\s*-$/.test(t);
  let s = t.replace(/[^\d.,]/g, "");
  if (!/\d/.test(s)) return null;
  const dot = s.lastIndexOf("."), com = s.lastIndexOf(",");
  if (dot >= 0 && com >= 0) s = dot > com ? s.replace(/,/g, "") : s.replace(/\./g, "").replace(",", ".");
  else if (com >= 0) s = (s.match(/,/g) || []).length === 1 && /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, "");
  const n = parseFloat(s);
  return isFinite(n) ? neg ? -n : n : null;
};
const siSlash = (v) => typeof v === "string" ? v.trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/) : null;
const siOrder = (vals) => {
  let dmy = false, mdy = false, any = false;
  vals.forEach((v) => {
    const m = siSlash(v);
    if (!m) return;
    any = true;
    if (+m[1] > 12) dmy = true;
    if (+m[2] > 12) mdy = true;
  });
  return { any, order: dmy && !mdy ? "dmy" : "mdy", sure: dmy !== mdy };
};
const siDate = (v, order) => {
  const ep = (n) => {
    const d = new Date(n);
    return isNaN(d) ? null : siYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
  };
  const num = (n) => n >= 1e17 ? ep(n / 1e6) : n >= 1e14 ? ep(n / 1e3) : n >= 1e11 ? ep(n) : n >= 1e9 ? ep(n * 1e3) : null;
  if (typeof v === "number") return isFinite(v) ? num(v) : null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  if (/^\d{9,19}(\.\d+)?$/.test(t)) return num(+t);
  let m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return siYmd(+m[1], +m[2], +m[3]);
  m = siSlash(t);
  if (m) {
    const y = +m[3] < 100 ? 2e3 + +m[3] : +m[3];
    return order === "dmy" ? siYmd(y, +m[2], +m[1]) : siYmd(y, +m[1], +m[2]);
  }
  if (/[a-z]{3}/i.test(t)) {
    const d = new Date(t);
    return isNaN(d) ? null : siYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }
  return null;
};
const siType = (v) => {
  if (typeof v !== "string") return null;
  const t = v.trim().toLowerCase();
  if (/^(income|credit|deposit|in|inflow|receipt|received|revenue|earning|salary|refund|\+)$/.test(t)) return "income";
  if (/^(expense|debit|withdrawal|out|outflow|payment|paid|spend|spending|purchase|charge|\-)$/.test(t)) return "expense";
  return /transfer/.test(t) ? "skip" : null;
};
function siDetect(keys, rows) {
  const sample = rows.slice(0, 200), used = /* @__PURE__ */ new Set();
  const share = (k, f) => {
    let n = 0, g = 0;
    sample.forEach((r) => {
      const v = r[k];
      if (v == null || v === "") return;
      n++;
      if (f(v)) g++;
    });
    return n > 0 && g / n >= 0.6;
  };
  const pick = (pats, ok) => {
    for (const re of pats) {
      const k = keys.find((x) => !used.has(x) && re.test(x.toLowerCase()) && ok(x));
      if (k) {
        used.add(k);
        return k;
      }
    }
    return "";
  };
  const isDt = (k) => share(k, (v) => siDate(v, "mdy") !== null);
  const txt = (k) => share(k, (v) => typeof v === "string" && siNum(v) === null && siDate(v, "mdy") === null);
  const date = pick([/^ts$/, /(^|\.)ts$/, /^date$/, /date/, /timestamp|time|when|created|posted|^day$|(^|\.)t$/], isDt);
  let amount = pick([/^amount$/, /amount/, /price/, /^val|value/, /cost/, /(^|\.)amt$/, /sum|total|debit|credit/], (k) => share(k, (v) => siNum(v) !== null));
  const type = pick([/^type$/, /(^|\.)kind$/, /kind|direction|flow|credit|debit|(trans|txn).*type/], (k) => share(k, (v) => {
    const t = siType(v);
    return !!t && t !== "skip";
  }) && new Set(sample.map((r) => r[k])).size <= 12);
  const cat = pick([/(^|\.)kind$/, /cat/, /tag|group|label|class/], txt);
  const note = pick([/desc/, /note|memo|remark|comment/, /name|title|merchant|payee|vendor|detail/, /(^|\.)id$/, /ref|reference|_id$/], (k) => share(k, (v) => (typeof v === "string" || typeof v === "number") && siDate(v, "mdy") === null));
  if (!amount && date) {
    const skip = /(^|\.)(id|ts|time|date|timestamp|created|updated|year|month|day|count|qty|index|idx|version|ver|code|seq|no|n)$/;
    amount = keys.find((k) => !used.has(k) && !skip.test(k.toLowerCase()) && share(k, (v) => typeof v === "number" && isFinite(v) && siDate(v, "mdy") === null)) || "";
  }
  return { amount, date, note, cat, type };
}
function siBuild(rows, map, o) {
  const ord = o.order === "auto" ? siOrder(map.date ? rows.map((r) => r[map.date]) : []).order : o.order;
  const have = new Set(o.existing.map((t) => [t.date, t.type, t.amount, t.wallet, (t.note || "").toLowerCase()].join("|")));
  const list = [], out = { list, bad: 0, dup: 0, skip: 0 };
  rows.forEach((r) => {
    const a = siNum(r[map.amount]), date = map.date ? siDate(r[map.date], ord) : off(0);
    if (a === null || a === 0 || !date) return void out.bad++;
    let type = null;
    if (map.type) {
      type = siType(r[map.type]);
      if (type === "skip") return void out.skip++;
    }
    if (!type) type = o.sign === "expense" ? "expense" : o.sign === "income" ? "income" : o.sign === "flip" ? a < 0 ? "income" : "expense" : a < 0 ? "expense" : "income";
    const raw = map.cat && r[map.cat] != null ? String(r[map.cat]).trim().slice(0, 40) : "", canon = (CATS[type] || []).find((c) => c.toLowerCase() === raw.toLowerCase());
    const t = { type, amount: q(Math.abs(a)), category: canon || raw || "Other", date, note: map.note && r[map.note] != null ? String(r[map.note]).trim().slice(0, 120) : "", wallet: o.wallet };
    if (t.amount <= 0) return void out.bad++;
    if (o.skipDup && have.has([t.date, t.type, t.amount, t.wallet, t.note.toLowerCase()].join("|"))) return void out.dup++;
    list.push(t);
  });
  return out;
}
const siFail = (text, why) => {
  const k = siKeys(text);
  return "Import Failed: " + (why || "Could not find amount or date values in this file.") + " Detected keys: [" + (k.length ? k.join(", ") : "none") + "].";
};
function siAuto(S, text) {
  const sp = siParse(text);
  if (sp.error) return { error: siFail(text, sp.error === "That file is not valid JSON." ? sp.error : "Could not find amount or date values in this file.") };
  if (sp.native) return { error: "Import Failed: this Budgy backup has nothing in it to restore." };
  const map = siDetect(sp.keys, sp.rows);
  if (!map.amount) return { error: siFail(text) };
  const sample = sp.rows.slice(0, 200), neg = sample.some((r) => siNum(r[map.amount]) < 0);
  const res = siBuild(sp.rows, map, { order: "auto", sign: !map.type && !neg ? "expense" : "auto", wallet: S.wallets[0].id, skipDup: true, existing: S.tx });
  if (!res.list.length) return { error: res.dup ? "Import Failed: everything in this file is already in your transactions." : siFail(text) };
  return { ...res, noDate: !map.date };
}
function DataSheet({ onClose }) {
  const { S, restoreData, addTxBatch, setToast, refreshState } = useApp(), fileRef = useRef(null), top = useRef(null);
  const [msg, setMsg] = useState(""), [ok, setOk] = useState(""), [busy, setBusy] = useState(false), [res, setRes] = useState(null);
  const stamp = off(0), rows = useMemo(() => buildTxRows(S), [S]);
  useEffect(() => {
    if (res && top.current && top.current.scrollIntoView) top.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [res]);
  const exportJson = () => {
    setMsg("");
    saveFile("budgy-backup-" + stamp + ".json", JSON.stringify(buildBackup(S), null, 2), "application/json;charset=utf-8");
    setOk("Backup downloaded. Keep it somewhere safe.");
  };
  const exportCsv = () => {
    setMsg("");
    saveFile("budgy-transactions-" + stamp + ".csv", csvOut([["Date", "Type", "Category", "Note", "Wallet", "To wallet", "Amount (PHP)", "Status"], ...rows]), "text/csv;charset=utf-8", true);
    setOk("Transactions CSV downloaded.");
  };
  const fail = (text) => {
    setRes({ ok: false, msg: "❌ " + text });
    setToast({ ok: false, msg: "❌ " + text });
  };
  const win = (msg2, sub) => {
    setRes({ ok: true, msg: msg2, sub });
    refreshState();
  };
  const handle = (text) => {
    text = String(text).replace(/^\uFEFF/, "");
    const bk = parseBackup(text), real = bk.error ? 0 : bk.counts.wallets - (bk.defaultWallet ? 1 : 0) + bk.counts.tx + bk.counts.debts + bk.counts.goals;
    let isBudgy = false;
    try {
      const j = JSON.parse(text);
      isBudgy = !!(j && j.app === BACKUP_APP);
    } catch (e) {
    }
    if (!bk.error && (isBudgy || real > 0)) {
      const sub = bk.counts.wallets + " wallets · " + bk.counts.tx + " transactions · " + bk.counts.debts + " payables & receivables · " + bk.counts.goals + " goals";
      restoreData({ ...bk.data, ...bk.profile }, { msg: "✅ Backup restored!", sub });
      return win("✅ Backup restored!", sub + ". Your balances are updated.");
    }
    const r = siAuto(S, text);
    if (r.error) return fail(r.error);
    const n = addTxBatch(r.list);
    const w = S.wallets[0].name, net = q(r.list.reduce((a, t) => a + (t.type === "income" ? t.amount : -t.amount), 0));
    win("✅ Successfully imported " + n + " transaction" + (n === 1 ? "" : "s") + "!", "Added to " + w + " (net " + (net < 0 ? "−" : "+") + php(Math.abs(net)) + ")" + (r.bad ? " · " + r.bad + " unreadable row" + (r.bad === 1 ? "" : "s") + " skipped" : "") + (r.dup ? " · " + r.dup + " duplicate" + (r.dup === 1 ? "" : "s") + " skipped" : "") + (r.noDate ? " · no dates found, so today’s date was used" : "") + ".");
  };
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    setMsg("");
    setOk("");
    setRes(null);
    if (!f) return;
    if (f.size > SI_MAX_BYTES) return fail("Import Failed: that file is too large to import.");
    if (!/\.(json|jsonl|txt)$/i.test(f.name) && !/json|text/i.test(f.type || "")) return fail("Import Failed: choose a .json file. (CSV files are export-only.)");
    setBusy(true);
    const r = new FileReader();
    r.onerror = () => {
      setBusy(false);
      fail("Import Failed: could not read that file. Please try again.");
    };
    r.onload = () => {
      setBusy(false);
      try {
        handle(String(r.result));
      } catch (err) {
        fail("Import Failed: " + (err && err.message || "this file could not be imported."));
      }
    };
    r.readAsText(f);
  };
  return /* @__PURE__ */ React.createElement(Sheet, { title: "Import / Export Data", onClose }, /* @__PURE__ */ React.createElement("div", { className: "space-y-5" }, /* @__PURE__ */ React.createElement("div", { ref: top }), res && /* @__PURE__ */ React.createElement("div", { role: "alert", className: "rounded-2xl border-2 p-4 space-y-2 fade " + (res.ok ? "border-pos bg-pos/15" : "border-neg bg-neg/15") }, /* @__PURE__ */ React.createElement("div", { className: "text-base font-semibold leading-snug break-words " + (res.ok ? "text-pos" : "text-neg") }, res.msg), res.sub && /* @__PURE__ */ React.createElement("div", { className: "text-sm text-mu break-words" }, res.sub), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 pt-1" }, res.ok ? /* @__PURE__ */ React.createElement("button", { className: "btn btn-p flex-1", onClick: onClose }, "Done") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn flex-1", onClick: () => setRes(null) }, "Dismiss"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-p flex-1", onClick: () => fileRef.current && fileRef.current.click() }, "Try another file")))), /* @__PURE__ */ React.createElement("section", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-semibold" }, "Import"), /* @__PURE__ */ React.createElement("input", { ref: fileRef, type: "file", accept: ".json,.jsonl,.txt,application/json,text/plain", className: "hidden", onChange: onFile, "aria-label": "Choose a JSON file to import" }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-p w-full !justify-start", onClick: () => fileRef.current && fileRef.current.click(), disabled: busy }, /* @__PURE__ */ React.createElement(Ic, { n: "upl", s: 17 }), busy ? "Importing…" : "Import data (JSON)"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu px-1" }, "Choose a Budgy backup to restore it, or a transaction export from another app to add its transactions to your first wallet. It is recognised and imported automatically; the result is always shown here and as a message with Undo.")), /* @__PURE__ */ React.createElement("section", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-semibold" }, "Export"), /* @__PURE__ */ React.createElement("button", { className: "btn w-full !justify-start", onClick: exportJson }, /* @__PURE__ */ React.createElement(Ic, { n: "json", s: 17 }), "Full backup (JSON)"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu -mt-0.5 px-1" }, "Everything: wallets, transactions, payables, receivables, goals, allocations, name and appearance. Use it to restore or move to another device."), /* @__PURE__ */ React.createElement("button", { className: "btn w-full !justify-start", onClick: exportCsv, disabled: !rows.length }, /* @__PURE__ */ React.createElement(Ic, { n: "dl", s: 17 }), "Transactions (CSV)"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu -mt-0.5 px-1" }, rows.length, " transaction", rows.length === 1 ? "" : "s", ", all time, including payments on payables and receivables. Opens in Excel, Numbers and Google Sheets.")), /* @__PURE__ */ React.createElement(Err, { m: msg }), ok && /* @__PURE__ */ React.createElement("p", { className: "text-sm text-pos flex gap-2", role: "status" }, /* @__PURE__ */ React.createElement(Ic, { n: "check", s: 18, cls: "shrink-0 mt-0.5" }), ok)));
}

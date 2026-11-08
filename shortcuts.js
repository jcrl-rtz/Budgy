const QA_KEY = "budgy.qa";
(function captureQuickAdd() {
  try {
    const p = new URLSearchParams(location.search);
    if (!p.get("add")) return;
    const o = {};
    p.forEach((v, k) => {
      o[k] = v;
    });
    sessionStorage.setItem(QA_KEY, JSON.stringify({ t: Date.now(), o }));
    history.replaceState(null, "", location.pathname + location.hash);
  } catch (e) {
  }
})();
const qaClean = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
const qaDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || "").trim()) ? String(v).trim() : "";
const qaPick = (list, v) => {
  const s = qaClean(v, 40).toLowerCase();
  return s ? list.find((x) => String(x).toLowerCase() === s) || "" : "";
};
const DL_KEY = "budgy.dl";
(function captureDeepLink() {
  try {
    const p = new URLSearchParams(location.search);
    if (!p.get("action")) return;
    const o = {};
    p.forEach((v, k) => {
      o[k] = v;
    });
    sessionStorage.setItem(DL_KEY, JSON.stringify({ t: Date.now(), o }));
    history.replaceState(null, "", location.pathname + location.hash);
  } catch (e) {
  }
})();
function takeDeepLink() {
  try {
    const raw = sessionStorage.getItem(DL_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(DL_KEY);
    const j = JSON.parse(raw);
    if (!j || !j.o || Date.now() - j.t > 15 * 60 * 1e3) return null;
    return j.o;
  } catch (e) {
    return null;
  }
}
function buildDeepTx(S, c, r) {
  const act = qaClean(r.action, 20).toLowerCase();
  const type = act === "addexpense" ? "expense" : act === "addincome" ? "income" : "";
  if (!type) return { ok: false, error: "Unknown shortcut action." };
  const m = /^[^\d.]*(\d[\d,]*(?:\.\d+)?|\.\d+)\s*(.*)$/.exec(String(r.amount == null ? "" : r.amount).trim());
  const amount = m ? q(parseFloat(m[1].replace(/,/g, ""))) : 0;
  if (!(amount > 0) || amount > 1e7) return { ok: false, error: "Not saved: couldn’t read that amount." };
  const want = qaClean(r.wallet, 40).toLowerCase();
  const w = want ? S.wallets.find((x) => x.id === r.wallet || x.name.toLowerCase() === want) : S.wallets[0];
  if (!w) return { ok: false, error: "Not saved: no wallet called “" + qaClean(r.wallet, 40) + "”." };
  if (type === "expense" && amount > c.bal[w.id]) return { ok: false, error: "Not saved: " + w.name + " only has " + php(c.bal[w.id]) + "." };
  const category = qaPick(CATS[type], r.cat) || "Other";
  const note = qaClean(r.note, 40) || qaClean(m[2], 40);
  return { ok: true, tx: { type, amount, category, date: off(0), note, wallet: w.id }, walletName: w.name };
}
function quickAddSheet(S, r) {
  const t = qaClean(r.add, 12).toLowerCase();
  const amt = String(r.amount || "").replace(/[^\d.]/g, ""), amount = money(amt) && +amt > 0 ? amt : "";
  const wallet = (v) => {
    const s = qaClean(v, 40).toLowerCase();
    const w = s && S.wallets.find((x) => x.id === v || x.name.toLowerCase() === s);
    return w ? w.id : "";
  };
  if (t === "expense" || t === "income" || t === "transfer") {
    const d = String(r.date || "").toLowerCase() === "today" ? "" : qaDate(r.date);
    return { k: "tx", kind: t, preset: { amount, category: t === "transfer" ? "" : qaPick(CATS[t], r.cat), wallet: wallet(r.wallet), to: wallet(r.to), note: qaClean(r.note, 40), date: d } };
  }
  if (t === "payable" || t === "receivable") {
    const cat = qaPick(catsFor(S, t), r.cat);
    return { k: "debt", kind: t, item: null, preset: cat || void 0, fill: { party: qaClean(r.name || r.note, 40), total: amount, due: qaDate(r.due || r.date) } };
  }
  return null;
}
function takeQuickAdd(S) {
  try {
    const raw = sessionStorage.getItem(QA_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(QA_KEY);
    const j = JSON.parse(raw);
    if (!j || Date.now() - j.t > 15 * 60 * 1e3) return null;
    return quickAddSheet(S, j.o || {});
  } catch (e) {
    return null;
  }
}
const scBase = () => location.origin + location.pathname.replace(/index\.html$/, "");
const scUrl = (o) => {
  const parts = Object.entries(o).filter(([, v]) => v !== "" && v != null).map(([k, v]) => k + "=" + encodeURIComponent(v));
  return scBase() + "?" + parts.join("&");
};
async function scCopy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
  }
  try {
    const a = document.createElement("textarea");
    a.value = text;
    a.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(a);
    a.select();
    const ok = document.execCommand("copy");
    a.remove();
    return ok;
  } catch (e) {
    return false;
  }
}
function CopyBtn({ text, label = "Copy link", cls = "" }) {
  const [ok, setOk] = useState(false);
  return /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn " + cls, onClick: async () => {
    setOk(await scCopy(text));
    setTimeout(() => setOk(false), 1800);
  } }, /* @__PURE__ */ React.createElement(Ic, { n: ok ? "check" : "file", s: 15 }), ok ? "Copied" : label);
}
function ShortcutsSheet({ onClose }) {
  const { S } = useApp();
  const [type, setType] = useState("expense"), [cat, setCat] = useState(""), [wallet, setWallet] = useState(""), [to, setTo] = useState(""), [amount, setAmount] = useState(""), [note, setNote] = useState("");
  const isTx = type === "expense" || type === "income" || type === "transfer", isDebt = !isTx;
  const cats = isTx ? type === "transfer" ? [] : CATS[type] : catsFor(S, type);
  const usable = cats.includes(cat) ? cat : "";
  const build = (o) => scUrl(o);
  const url = build(isTx ? { add: type, cat: usable, amount: money(amount) ? amount : "", wallet, to: type === "transfer" ? to : "", note: note.trim() } : { add: type, cat: usable, amount: money(amount) ? amount : "", name: note.trim() });
  const types = [["expense", "Expense"], ["income", "Income"], ["transfer", "Transfer"], ["payable", "Payable"], ["receivable", "Receivable"]];
  const all = [
    ...CATS.expense.map((x) => ["Expense · " + x, build({ add: "expense", cat: x })]),
    ...CATS.income.map((x) => ["Income · " + x, build({ add: "income", cat: x })]),
    ...catsFor(S, "payable").map((x) => ["Payable · " + x, build({ add: "payable", cat: x })]),
    ...catsFor(S, "receivable").map((x) => ["Receivable · " + x, build({ add: "receivable", cat: x })])
  ];
  return /* @__PURE__ */ React.createElement(Sheet, { title: "Add to iOS Shortcuts", onClose }, /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-mu" }, "Make a Home Screen icon that opens Budgy straight on a pre-filled form, for example “Expense · Food”. Build a link below, then follow the steps. Nothing is saved until you tap Save."), /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3.5 space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold" }, "1. Build your link"), /* @__PURE__ */ React.createElement("div", { className: "chips", role: "tablist", "aria-label": "Type" }, types.map(([k, l]) => /* @__PURE__ */ React.createElement("button", { key: k, type: "button", role: "tab", "aria-selected": type === k, onClick: () => {
    setType(k);
    setCat("");
  }, className: "btn " + (type === k ? "btn-p" : "") }, l))), type !== "transfer" && /* @__PURE__ */ React.createElement(Field, { label: isTx ? "Category" : "Source", hint: isDebt && !cats.length ? "No sources yet. Add one in the Pending tab, or leave this and choose in the app." : void 0 }, /* @__PURE__ */ React.createElement("select", { className: "field", value: usable, onChange: (e) => setCat(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Choose in the app"), cats.map((x) => /* @__PURE__ */ React.createElement("option", { key: x }, x)))), isTx && /* @__PURE__ */ React.createElement("div", { className: "grid gap-3 " + (type === "transfer" ? "grid-cols-2" : "grid-cols-1") }, /* @__PURE__ */ React.createElement(Field, { label: type === "transfer" ? "From wallet" : "Wallet" }, /* @__PURE__ */ React.createElement("select", { className: "field", value: wallet, onChange: (e) => setWallet(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Choose in the app"), S.wallets.map((w) => /* @__PURE__ */ React.createElement("option", { key: w.id, value: w.name }, w.name)))), type === "transfer" && /* @__PURE__ */ React.createElement(Field, { label: "To wallet" }, /* @__PURE__ */ React.createElement("select", { className: "field", value: to, onChange: (e) => setTo(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Choose in the app"), S.wallets.map((w) => /* @__PURE__ */ React.createElement("option", { key: w.id, value: w.name }, w.name))))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement(Field, { label: "Amount (optional)", hint: "Leave empty to type it in the app." }, /* @__PURE__ */ React.createElement("input", { className: "field", inputMode: "decimal", placeholder: "0.00", value: amount, onChange: (e) => setAmount(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: isTx ? "Note (optional)" : "Name (optional)" }, /* @__PURE__ */ React.createElement("input", { className: "field", maxLength: 40, placeholder: isTx ? "e.g. Lunch" : "e.g. Phone", value: note, onChange: (e) => setNote(e.target.value) }))), /* @__PURE__ */ React.createElement(Field, { label: "Your link" }, /* @__PURE__ */ React.createElement("textarea", { className: "field !text-xs font-mono", rows: 3, readOnly: true, value: url, onFocus: (e) => e.target.select() })), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, /* @__PURE__ */ React.createElement(CopyBtn, { text: url, cls: "btn-p" }), /* @__PURE__ */ React.createElement("a", { className: "btn", href: url }, /* @__PURE__ */ React.createElement(Ic, { n: "right", s: 15 }), "Test link"))), /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3.5 space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold" }, "2. Put it on your Home Screen"), /* @__PURE__ */ React.createElement("ol", { className: "text-sm text-mu space-y-1.5 list-decimal pl-5" }, /* @__PURE__ */ React.createElement("li", null, "Open the ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Shortcuts"), " app and tap ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "+"), " to make a new shortcut."), /* @__PURE__ */ React.createElement("li", null, "Add the action ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Open URLs"), " and paste your link into it."), /* @__PURE__ */ React.createElement("li", null, "Optional: add ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Ask for Input"), " (type Number, prompt “Amount?”) above it. Then tap the end of ", /* @__PURE__ */ React.createElement("code", null, "amount="), " in the URL and insert that answer. Leave ", /* @__PURE__ */ React.createElement("code", null, "amount"), " out of the link if you would rather type it in Budgy."), /* @__PURE__ */ React.createElement("li", null, "Tap the shortcut’s name, choose ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Add to Home Screen"), ", name it (for example “Food”) and tap ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Add"), ".")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 pt-1" }, /* @__PURE__ */ React.createElement("a", { className: "btn", href: "shortcuts://create-shortcut" }, /* @__PURE__ */ React.createElement(Ic, { n: "phone", s: 15 }), "Open Shortcuts app")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu" }, "Repeat for each category you use. “All my links” below has one ready-made link per category.")), /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3.5 space-y-1.5 border-ac/40" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Ic, { n: "alert", s: 16, cls: "text-ac" }), "Good to know on iPhone"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu" }, "A Shortcut opens links in ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Safari"), ", not in the installed Home Screen app, and iOS keeps the two separate. Open the link once in Safari and sign in there, and Budgy will sync from your account. Guest data on this device stays in the Home Screen app, so use a signed-in account for Shortcuts.")), /* @__PURE__ */ React.createElement("details", { className: "glass-tile p-3.5" }, /* @__PURE__ */ React.createElement("summary", { className: "text-sm font-semibold cursor-pointer" }, "All my links (", all.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "mt-3 space-y-2" }, all.map(([l, u]) => /* @__PURE__ */ React.createElement("div", { key: l, className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm truncate min-w-0" }, l), /* @__PURE__ */ React.createElement(CopyBtn, { text: u, label: "Copy", cls: "!py-1.5 !px-3 !text-xs shrink-0" }))))), /* @__PURE__ */ React.createElement("details", { className: "glass-tile p-3.5" }, /* @__PURE__ */ React.createElement("summary", { className: "text-sm font-semibold cursor-pointer" }, "Link parameters"), /* @__PURE__ */ React.createElement("div", { className: "mt-3 text-xs text-mu space-y-1" }, /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("code", null, "add"), " expense, income, transfer, payable or receivable (required)"), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("code", null, "cat"), " category or source name, case does not matter"), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("code", null, "amount"), " a number such as 250 or 1250.50"), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("code", null, "wallet"), " wallet name (the “from” wallet for a transfer) · ", /* @__PURE__ */ React.createElement("code", null, "to"), " destination wallet"), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("code", null, "note"), " up to 40 characters · ", /* @__PURE__ */ React.createElement("code", null, "date"), " YYYY-MM-DD or today"), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("code", null, "name"), " and ", /* @__PURE__ */ React.createElement("code", null, "due"), " for payables and receivables"), /* @__PURE__ */ React.createElement("p", null, "Anything missing or not recognised is simply left for you to choose in the form.")))));
}
function ScBlock({ n, icon, title, children }) {
  return /* @__PURE__ */ React.createElement("div", { className: "sc-block" }, /* @__PURE__ */ React.createElement("div", { className: "sc-head" }, /* @__PURE__ */ React.createElement("span", { className: "sc-n" }, n), /* @__PURE__ */ React.createElement("span", { className: "sc-ic" }, /* @__PURE__ */ React.createElement(Ic, { n: icon, s: 15 })), /* @__PURE__ */ React.createElement("b", null, title)), /* @__PURE__ */ React.createElement("div", { className: "sc-body" }, children));
}
function BackTapSheet({ onClose }) {
  const { S } = useApp();
  const [cat, setCat] = useState(""), [wallet, setWallet] = useState("");
  const usable = CATS.expense.includes(cat) ? cat : "";
  const prefix = scUrl({ action: "addExpense", cat: usable, wallet }) + (usable || wallet ? "&" : "?") + "amount=";
  const test = prefix + "1&note=" + encodeURIComponent("Shortcut test");
  return /* @__PURE__ */ React.createElement(Sheet, { title: "Back Tap quick expense", onClose }, /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-mu" }, "Tap the back of your iPhone, type an amount in a small pop-up, and the expense is saved. Apple doesn’t allow a website to install a Shortcut for you, so build it once (about a minute):"), /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3.5 space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold" }, "1. Choose what it saves ", /* @__PURE__ */ React.createElement("span", { className: "text-mu font-normal" }, "(optional)")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement(Field, { label: "Category" }, /* @__PURE__ */ React.createElement("select", { className: "field", value: usable, onChange: (e) => setCat(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Other"), CATS.expense.map((x) => /* @__PURE__ */ React.createElement("option", { key: x }, x)))), /* @__PURE__ */ React.createElement(Field, { label: "Wallet" }, /* @__PURE__ */ React.createElement("select", { className: "field", value: wallet, onChange: (e) => setWallet(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "First wallet"), S.wallets.map((w) => /* @__PURE__ */ React.createElement("option", { key: w.id, value: w.name }, w.name)))))), /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3.5 space-y-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold" }, "2. Build the shortcut in the Shortcuts app"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu" }, "Tap ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Open Shortcuts"), ", then add these three actions in this order:"), /* @__PURE__ */ React.createElement(ScBlock, { n: "1", icon: "pen", title: "Ask for Text" }, /* @__PURE__ */ React.createElement("div", { className: "sc-row" }, /* @__PURE__ */ React.createElement("span", null, "Prompt"), /* @__PURE__ */ React.createElement("span", { className: "sc-chip" }, "Amount?")), /* @__PURE__ */ React.createElement("p", { className: "sc-hint" }, "On iOS 17 and later this action is called ", /* @__PURE__ */ React.createElement("b", null, "Ask for Input"), ". Keep the type on ", /* @__PURE__ */ React.createElement("b", null, "Text"), ". This is the small floating box that appears over whatever you’re doing.")), /* @__PURE__ */ React.createElement(ScBlock, { n: "2", icon: "file", title: "URL" }, /* @__PURE__ */ React.createElement("div", { className: "sc-url" }, prefix, /* @__PURE__ */ React.createElement("span", { className: "sc-var" }, "Provided Input")), /* @__PURE__ */ React.createElement("p", { className: "sc-hint" }, "Tap ", /* @__PURE__ */ React.createElement("b", null, "Copy URL"), " below, paste it into the URL action, then tap right after ", /* @__PURE__ */ React.createElement("code", null, "amount="), " and choose the variable ", /* @__PURE__ */ React.createElement("b", null, "Provided Input"), " (it appears as a blue chip).")), /* @__PURE__ */ React.createElement(ScBlock, { n: "3", icon: "right", title: "Open URLs" }, /* @__PURE__ */ React.createElement("div", { className: "sc-row" }, /* @__PURE__ */ React.createElement("span", null, "Input"), /* @__PURE__ */ React.createElement("span", { className: "sc-chip" }, "URL")), /* @__PURE__ */ React.createElement("p", { className: "sc-hint" }, "This opens Budgy, which saves the entry and shows a confirmation with Undo.")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 pt-1" }, /* @__PURE__ */ React.createElement(CopyBtn, { text: prefix, label: "Copy URL", cls: "btn-p" }), /* @__PURE__ */ React.createElement("a", { className: "btn", href: "shortcuts://create-shortcut" }, /* @__PURE__ */ React.createElement(Ic, { n: "phone", s: 15 }), "Open Shortcuts")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu" }, "Name it “Add Expense”. You can also type a note after the amount, for example ", /* @__PURE__ */ React.createElement("code", null, "250 lunch"), ". If that fails, or a note has special characters, add a ", /* @__PURE__ */ React.createElement("b", null, "URL Encode"), " action after Ask for Text and use its output.")), /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3.5 space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold" }, "3. Trigger it with Back Tap"), /* @__PURE__ */ React.createElement("ol", { className: "text-sm text-mu space-y-1.5 list-decimal pl-5" }, /* @__PURE__ */ React.createElement("li", null, "Open ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Settings"), " › ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Accessibility"), " › ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Touch"), "."), /* @__PURE__ */ React.createElement("li", null, "Scroll down and tap ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Back Tap"), "."), /* @__PURE__ */ React.createElement("li", null, "Choose ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Double Tap"), " or ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Triple Tap"), "."), /* @__PURE__ */ React.createElement("li", null, "Scroll to the ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Shortcuts"), " section and pick ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Add Expense"), "."))), /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3.5 space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold" }, "4. Test it"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu" }, "This opens your link with an amount of 1 and saves a ₱1.00 test expense. Tap ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Undo"), " on the confirmation to remove it."), /* @__PURE__ */ React.createElement("a", { className: "btn", href: test }, /* @__PURE__ */ React.createElement(Ic, { n: "check", s: 15 }), "Run test")), /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3.5 space-y-1.5 border-ac/40" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Ic, { n: "alert", s: 16, cls: "text-ac" }), "Good to know"), /* @__PURE__ */ React.createElement("ul", { className: "text-xs text-mu space-y-1.5 list-disc pl-4" }, /* @__PURE__ */ React.createElement("li", null, "Shortcuts opens links in ", /* @__PURE__ */ React.createElement("b", { className: "text-fg" }, "Safari"), ", not the Home Screen app, so Safari flashes open briefly after you type the amount. Sign in to Budgy once in Safari so entries sync to your account."), /* @__PURE__ */ React.createElement("li", null, "Nothing is saved if the amount is invalid, the wallet isn’t found, or an expense is bigger than the wallet balance. You’ll see a message instead."), /* @__PURE__ */ React.createElement("li", null, "A link can add an entry whenever you open it while signed in, so only tap links you trust. Every save shows an Undo button for a few seconds.")))));
}
function Toast({ t, onClose }) {
  useEffect(() => {
    if (!t) return;
    const id = setTimeout(onClose, t.ok ? 7e3 : 9e3);
    return () => clearTimeout(id);
  }, [t]);
  if (!t) return null;
  return /* @__PURE__ */ React.createElement("div", { className: "toast-wrap", role: "status", "aria-live": "polite" }, /* @__PURE__ */ React.createElement("div", { className: "toast fade" }, /* @__PURE__ */ React.createElement("span", { className: "toast-ic " + (t.ok ? "ok" : "bad") }, /* @__PURE__ */ React.createElement(Ic, { n: t.ok ? "check" : "alert", s: 16 })), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "toast-t" }, t.msg), t.sub && /* @__PURE__ */ React.createElement("div", { className: "toast-s" }, t.sub)), t.undo && /* @__PURE__ */ React.createElement("button", { className: "toast-b", onClick: () => {
    onClose();
    t.undo();
  } }, t.label || "Undo"), /* @__PURE__ */ React.createElement("button", { className: "toast-x", onClick: onClose, "aria-label": "Dismiss" }, /* @__PURE__ */ React.createElement(Ic, { n: "x", s: 14 }))));
}

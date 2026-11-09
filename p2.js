Object.assign(IC, {
  chev: ["m6 9 6 6 6-6"],
  dl: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  file: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8", "M8 17h5"],
  hist: ["M3 12a9 9 0 1 0 3-6.7L3 8", "M3 3v5h5", "M12 7v5l3 2"]
});
const CATS = { expense: ["Food", "Rent", "Transport", "Bills", "Fun", "Shopping", "Health", "Other"], income: ["Salary", "Freelance", "Allowance", "Gift", "Other"] };
const BASE = { payable: [], receivable: [] };
const catsFor = (S, k) => [...BASE[k], ...(S.srcs || []).filter((x) => x.kind === k && !BASE[k].includes(x.name)).map((x) => x.name)];
const daysTo = (d) => Math.round((/* @__PURE__ */ new Date(d + "T00:00") - /* @__PURE__ */ new Date(off(0) + "T00:00")) / 864e5);
const dueTxt = (d) => {
  const n = daysTo(d);
  return n < 0 ? Math.abs(n) + "d overdue" : n === 0 ? "Due today" : "Due in " + n + "d";
};
const WOpts = ({ ws, c }) => ws.map((w) => /* @__PURE__ */ React.createElement("option", { key: w.id, value: w.id }, w.name, " · ", php(c.bal[w.id])));
function Fold({ title, right, open: o0 = false, i = 0, children }) {
  const [o, setO] = useState(o0);
  return /* @__PURE__ */ React.createElement(Glass, { i, className: "p-4 sm:p-5" }, /* @__PURE__ */ React.createElement("button", { className: "w-full flex items-center justify-between gap-3 text-left", "aria-expanded": o, onClick: () => setO(!o) }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold min-w-0" }, title), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-2 text-sm text-mu shrink-0" }, right, /* @__PURE__ */ React.createElement(Ic, { n: "chev", s: 18, cls: "transition-transform " + (o ? "rotate-180" : "") }))), o && /* @__PURE__ */ React.createElement("div", { className: "mt-4 fade" }, children));
}
function TxSheet({ kind: k0, preset, item, onClose }) {
  const { S, c, addTx, updTx, delTx } = useApp();
  const edit = !!item;
  const [k, setK] = useState(edit ? item.type : k0 || "expense"), [m, setM] = useState("");
  const P = preset || {}, has = (id) => S.wallets.some((w) => w.id === id);
  const [f, setF] = useState(edit ? { amount: String(item.amount), category: item.type === "transfer" ? "" : item.category || "", wallet: has(item.wallet) ? item.wallet : S.wallets[0].id, to: has(item.to) ? item.to : (S.wallets[1] || S.wallets[0]).id, date: item.date, note: item.note || "" } : { amount: P.amount || "", category: P.category || "", wallet: P.wallet || S.wallets[0].id, to: P.to || (S.wallets[1] || S.wallets[0]).id, date: P.date || off(0), note: P.note || "" });
  const u = (key) => (e) => setF({ ...f, [key]: e.target.value });
  const base = edit ? calc({ ...S, tx: S.tx.filter((t) => t.id !== item.id) }) : c;
  const cats = edit && k !== "transfer" && f.category && !CATS[k].includes(f.category) ? [...CATS[k], f.category] : CATS[k];
  const save = () => {
    if (!money(f.amount) || +f.amount <= 0) return setM("Enter an amount greater than zero with at most two decimals.");
    if (k === "transfer" && f.wallet === f.to) return setM("Pick two different wallets.");
    const amt = +f.amount, touched = !edit || f.wallet !== item.wallet || amt !== item.amount || f.date !== item.date;
    if (k !== "income" && touched && f.date <= off(0) && amt > base.bal[f.wallet]) return setM("That wallet only has " + php(base.bal[f.wallet]) + (edit ? " without this transaction." : "."));
    const p = { amount: amt, category: k === "transfer" ? "Transfer" : f.category || CATS[k][0], date: f.date, note: f.note.trim(), wallet: f.wallet, ...k === "transfer" ? { to: f.to } : {} };
    if (edit) updTx(item.id, p);
    else addTx({ type: k, ...p });
    onClose();
  };
  return /* @__PURE__ */ React.createElement(Sheet, { title: edit ? "Edit transaction" : "Add transaction", onClose }, /* @__PURE__ */ React.createElement("form", { className: "space-y-3", onSubmit: (e) => {
    e.preventDefault();
    save();
  } }, edit ? /* @__PURE__ */ React.createElement("div", { className: "glass-tile px-4 py-3 flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm text-mu" }, "Type"), /* @__PURE__ */ React.createElement("span", { className: "font-semibold capitalize" }, k)) : /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-1 grid grid-cols-3 gap-1" }, ["expense", "income", "transfer"].map((t) => /* @__PURE__ */ React.createElement("button", { type: "button", key: t, "aria-pressed": k === t, onClick: () => {
    setK(t);
    setF({ ...f, category: "" });
  }, className: "btn !border-transparent capitalize " + (k === t ? "btn-p" : "!bg-transparent") }, t))), /* @__PURE__ */ React.createElement(Field, { label: "Amount (PHP)" }, /* @__PURE__ */ React.createElement("input", { className: "field", autoFocus: !edit, inputMode: "decimal", placeholder: "0.00", value: f.amount, onChange: u("amount") })), k !== "transfer" && /* @__PURE__ */ React.createElement(Field, { label: "Category" }, /* @__PURE__ */ React.createElement("select", { className: "field", value: f.category || CATS[k][0], onChange: u("category") }, cats.map((x) => /* @__PURE__ */ React.createElement("option", { key: x }, x)))), /* @__PURE__ */ React.createElement(Field, { label: k === "transfer" ? "From wallet" : "Wallet", hint: edit ? "Balances shown leave out this transaction." : void 0 }, /* @__PURE__ */ React.createElement("select", { className: "field", value: f.wallet, onChange: u("wallet") }, /* @__PURE__ */ React.createElement(WOpts, { ws: S.wallets, c: base }))), k === "transfer" && /* @__PURE__ */ React.createElement(Field, { label: "To wallet" }, /* @__PURE__ */ React.createElement("select", { className: "field", value: f.to, onChange: u("to") }, /* @__PURE__ */ React.createElement(WOpts, { ws: S.wallets, c: base }))), /* @__PURE__ */ React.createElement(Field, { label: "Date" }, /* @__PURE__ */ React.createElement("input", { className: "field", type: "date", value: f.date, onChange: u("date") })), /* @__PURE__ */ React.createElement(Field, { label: "Note" }, /* @__PURE__ */ React.createElement("input", { className: "field", maxLength: 40, placeholder: "Optional", value: f.note, onChange: u("note") })), /* @__PURE__ */ React.createElement(Err, { m }), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-p w-full" }, edit ? "Save changes" : "Save " + k)), edit && /* @__PURE__ */ React.createElement("div", { className: "mt-3 [&>button]:w-full" }, /* @__PURE__ */ React.createElement(Confirm, { danger: true, label: "Delete transaction", warn: "Delete this transaction? The wallet balance goes back to what it was before it.", yes: "Delete", onYes: () => {
    delTx(item.id);
    onClose();
  } })));
}
const HIST_TYPES = [["all", "All"], ["expense", "Expenses"], ["income", "Income"], ["transfer", "Transfers"]];
const histDay = (d) => {
  const n = daysTo(d);
  return n === 0 ? "Today" : n === -1 ? "Yesterday" : n === 1 ? "Tomorrow" : (/* @__PURE__ */ new Date(d + "T00:00")).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
};
function TxHistory({ openSheet }) {
  const { S, undoPay } = useApp();
  const [type, setType] = useState("all"), [wid, setWid] = useState("all"), [qs, setQs] = useState(""), [lim, setLim] = useState(40);
  const t0 = off(0), W = Object.fromEntries(S.wallets.map((w) => [w.id, w])), wn = (id) => (W[id] || {}).name || "Removed";
  const all = [
    ...S.tx.map((x) => ({ id: x.id, type: x.type, title: x.note || x.category, sub: x.category + " · " + wn(x.wallet) + (x.type === "transfer" ? " → " + wn(x.to) : ""), wallets: x.type === "transfer" ? [x.wallet, x.to] : [x.wallet], amount: x.amount, date: x.date, tx: x })),
    ...S.debts.flatMap((d) => (d.payments || []).map((p) => ({ id: p.id, type: d.kind === "payable" ? "expense" : "income", title: (d.kind === "payable" ? "Paid · " : "Received · ") + d.party, sub: d.cat + " · " + wn(p.wallet), wallets: [p.wallet], amount: p.amount, date: p.date, undo: [d.id, p.id] })))
  ].sort((a, b) => b.date.localeCompare(a.date));
  const term = qs.trim().toLowerCase();
  const rows = all.filter((x) => (type === "all" || x.type === type) && (wid === "all" || x.wallets.includes(wid)) && (!term || (x.title + " " + x.sub + " " + x.amount).toLowerCase().includes(term)));
  const groups = [];
  rows.slice(0, lim).forEach((x) => {
    const g = groups[groups.length - 1];
    if (g && g.date === x.date) g.items.push(x);
    else groups.push({ date: x.date, items: [x] });
  });
  const sign = (x) => x.type === "income" ? "+" : x.type === "expense" ? "−" : "";
  const tone = (x) => x.type === "income" ? "text-pos" : x.type === "expense" ? "text-neg" : "";
  const filtered = type !== "all" || wid !== "all" || !!term;
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement(Glass, { i: 0, className: "p-3.5 sm:p-4 space-y-3" }, /* @__PURE__ */ React.createElement("input", { className: "field", placeholder: "Search note, category, wallet or amount", "aria-label": "Search transactions", value: qs, onChange: (e) => {
    setQs(e.target.value);
    setLim(40);
  } }), /* @__PURE__ */ React.createElement("div", { className: "chips", "data-noswipe": true }, HIST_TYPES.map(([k, l]) => /* @__PURE__ */ React.createElement("button", { key: k, type: "button", "aria-pressed": type === k, onClick: () => {
    setType(k);
    setLim(40);
  }, className: "btn " + (type === k ? "btn-p" : "") }, l))), S.wallets.length > 1 && /* @__PURE__ */ React.createElement("select", { className: "field", "aria-label": "Filter by wallet", value: wid, onChange: (e) => {
    setWid(e.target.value);
    setLim(40);
  } }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All wallets"), S.wallets.map((w) => /* @__PURE__ */ React.createElement("option", { key: w.id, value: w.id }, w.name)))), !rows.length ? /* @__PURE__ */ React.createElement(Glass, { i: 1, className: "p-6 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "font-semibold" }, filtered ? "No matching transactions" : "No transactions yet"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-mu mt-1" }, filtered ? "Try a different filter or search." : "Tap + to add your first expense, income or transfer.")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-mu px-1" }, rows.length, " transaction", rows.length === 1 ? "" : "s", filtered ? " found" : "", " · newest first"), groups.map((g, gi) => {
    const net = q(g.items.reduce((a, x) => a + (x.type === "income" ? x.amount : x.type === "expense" ? -x.amount : 0), 0));
    return /* @__PURE__ */ React.createElement(Glass, { key: g.date, i: Math.min(gi + 1, 6), className: "p-3.5 sm:p-4" }, /* @__PURE__ */ React.createElement("div", { className: "mini-h" }, /* @__PURE__ */ React.createElement("b", null, histDay(g.date)), /* @__PURE__ */ React.createElement("span", { className: "tabular-nums" }, net === 0 ? "" : (net > 0 ? "+" : "−") + php(Math.abs(net)))), /* @__PURE__ */ React.createElement("div", { className: "mt-1.5" }, g.items.map((x, i) => {
      const body = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "grid place-items-center w-9 h-9 rounded-full shrink-0 " + (x.type === "income" ? "bg-pos/15 text-pos" : x.type === "expense" ? "bg-neg/15 text-neg" : "bg-fg/10 text-mu") }, /* @__PURE__ */ React.createElement(Ic, { n: x.type === "income" ? "up" : x.type === "expense" ? "down" : "swap", s: 15 })), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-[14px] font-medium truncate leading-[19px]" }, x.title, x.tx && x.date > t0 && /* @__PURE__ */ React.createElement("span", { className: "ml-1.5 align-middle text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-ac/15 text-ac" }, "Scheduled")), /* @__PURE__ */ React.createElement("div", { className: "text-[11.5px] text-mu truncate leading-[16px]" }, x.sub)), /* @__PURE__ */ React.createElement("div", { className: "text-[14px] font-semibold whitespace-nowrap tabular-nums text-right " + tone(x) }, sign(x), php(x.amount)));
      return /* @__PURE__ */ React.createElement("div", { key: x.id, className: "flex items-center gap-2.5 py-2 " + (i ? "border-t border-fg/10" : "") }, x.tx ? /* @__PURE__ */ React.createElement("button", { type: "button", "aria-label": "Edit " + x.title, onClick: () => openSheet({ k: "tx", item: x.tx }), className: "flex items-center gap-2.5 min-w-0 flex-1 text-left" }, body, /* @__PURE__ */ React.createElement(Ic, { n: "right", s: 14, cls: "text-mu shrink-0" })) : /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 min-w-0 flex-1" }, body), x.undo && /* @__PURE__ */ React.createElement(UndoBtn, { onClick: () => undoPay(x.undo[0], x.undo[1]), label: "Undo " + x.title }));
    })));
  }), rows.length > lim && /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn w-full", onClick: () => setLim(lim + 40) }, "Show more (", rows.length - lim, " left)")));
}
function DebtSheet({ kind, item, preset, fill, lock, onClose }) {
  const { S, addDebt, updDebt, set } = useApp(), cats = catsFor(S, kind), pay = kind === "payable";
  const F = fill || {};
  const [f, setF] = useState({ party: item ? item.party : F.party || "", total: item ? String(item.total) : F.total || "", due: item ? item.due : F.due || off(14), cat: item ? item.cat : preset || cats[0] || "__new", nc: "", rec: !!(item && isRecur(item)), freq: item && isRecur(item) ? item.frequency : "monthly", vary: !!(item && item.isVariableAmount) }), [m, setM] = useState("");
  const u = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const all = item && !cats.includes(item.cat) ? [...cats, item.cat] : cats;
  const save = () => {
    const nc = f.nc.trim(), isNew = f.cat === "__new", hit = all.find((x) => x.toLowerCase() === nc.toLowerCase()), cat = isNew ? hit || nc : f.cat;
    if (!f.party.trim()) return setM("Enter a name or description.");
    const wait = !!item && needsAmt(item) && f.rec && f.vary && !String(f.total).trim();
    if (!wait && (!money(f.total) || +f.total <= 0)) return setM("Enter an amount greater than zero with at most two decimals.");
    if (item && +f.total < (item.paid || 0)) return setM("The total can’t be lower than the " + php(item.paid) + " already settled.");
    if (!cat) return setM("Name the new source.");
    if (!f.due) return setM("Pick a due date.");
    if (isNew && !hit) set({ srcs: [...S.srcs || [], { kind, name: nc }] });
    const p = { party: f.party.trim(), total: wait ? 0 : +f.total, due: f.due, cat, isRecurring: f.rec, ...f.rec ? { frequency: f.freq, isVariableAmount: f.vary, recurDay: +f.due.slice(8), needsAmount: wait } : {} };
    item ? updDebt(item.id, p) : addDebt({ kind, wallet: S.wallets[0].id, ...p });
    onClose();
  };
  return /* @__PURE__ */ React.createElement(Sheet, { title: (item ? "Edit " : "Add ") + kind, onClose }, /* @__PURE__ */ React.createElement("form", { className: "space-y-3", onSubmit: (e) => {
    e.preventDefault();
    save();
  } }, /* @__PURE__ */ React.createElement(Field, { label: pay ? "Who or what do you owe?" : "Who owes you?" }, /* @__PURE__ */ React.createElement("input", { className: "field", autoFocus: true, maxLength: 40, placeholder: pay ? "e.g. Phone installment" : "e.g. Monthly allowance", value: f.party, onChange: u("party") })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement(Field, { label: f.rec && f.vary ? "Expected total (PHP)" : "Total (PHP)" }, /* @__PURE__ */ React.createElement("input", { className: "field", inputMode: "decimal", placeholder: "0.00", value: f.total, onChange: u("total") })), /* @__PURE__ */ React.createElement(Field, { label: "Due date" }, /* @__PURE__ */ React.createElement("input", { className: "field", type: "date", value: f.due, onChange: u("due") }))), lock && !item ? /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3 flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm text-mu" }, "Source"), /* @__PURE__ */ React.createElement("span", { className: "font-semibold truncate" }, f.cat)) : /* @__PURE__ */ React.createElement(Field, { label: "Source" }, /* @__PURE__ */ React.createElement("select", { className: "field", value: f.cat, onChange: u("cat") }, all.map((x) => /* @__PURE__ */ React.createElement("option", { key: x }, x)), /* @__PURE__ */ React.createElement("option", { value: "__new" }, "+ Add New Source"))), f.cat === "__new" && /* @__PURE__ */ React.createElement(Field, { label: "New source name" }, /* @__PURE__ */ React.createElement("input", { className: "field", maxLength: 24, placeholder: "e.g. Credit Card", value: f.nc, onChange: u("nc") })), /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3 space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-medium" }, "Recurring"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-mu" }, pay ? "The next bill is created when this one is paid." : "The next one is created when this is received.")), /* @__PURE__ */ React.createElement("button", { type: "button", role: "switch", "aria-checked": f.rec, "aria-label": "Recurring", onClick: () => setF({ ...f, rec: !f.rec }), className: "relative shrink-0 w-12 h-7 rounded-full transition-colors " + (f.rec ? "bg-ac" : "bg-fg/25") }, /* @__PURE__ */ React.createElement("i", { className: "absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform " + (f.rec ? "translate-x-5" : "") }))), f.rec && /* @__PURE__ */ React.createElement("div", { className: "space-y-3 fade" }, /* @__PURE__ */ React.createElement(Field, { label: "Repeats" }, /* @__PURE__ */ React.createElement("select", { className: "field", value: f.freq, onChange: u("freq") }, FREQS.map((x) => /* @__PURE__ */ React.createElement("option", { key: x, value: x }, FREQ_LABEL[x])))), /* @__PURE__ */ React.createElement("label", { className: "flex items-start gap-2.5 text-sm cursor-pointer" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", className: "mt-0.5 w-4 h-4 shrink-0", checked: f.vary, onChange: (e) => setF({ ...f, vary: e.target.checked }) }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "font-medium" }, "Variable amount"), /* @__PURE__ */ React.createElement("span", { className: "block text-xs text-mu" }, "The amount changes each cycle (like a utility bill). The next one starts at ", php(0), " and asks you to set the amount."))))), /* @__PURE__ */ React.createElement(Err, { m }), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-p w-full" }, item ? "Save changes" : "Add " + kind)));
}
function SourceSheet({ item, kind: k0, onClose }) {
  const { S, addSrc, renameSrc } = useApp();
  const [name, setName] = useState(item ? item.name : ""), [kind, setKind] = useState(item ? item.kind : k0 || "payable"), [m, setM] = useState("");
  const save = () => {
    const n = name.trim();
    if (!n) return setM("Name the source.");
    if (item && n === item.name) return onClose();
    if (hasSrc(S.srcs || [], kind, n) && !(item && n.toLowerCase() === item.name.toLowerCase())) return setM("You already have a " + kind + " source called “" + n + "”.");
    item ? renameSrc(item.kind, item.name, n) : addSrc(kind, n);
    onClose();
  };
  return /* @__PURE__ */ React.createElement(Sheet, { title: item ? "Edit name" : "Add source", onClose }, /* @__PURE__ */ React.createElement("form", { className: "space-y-3", onSubmit: (e) => {
    e.preventDefault();
    save();
  } }, !item && /* @__PURE__ */ React.createElement(Field, { label: "Type" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, [["payable", "Payable", "Money you owe"], ["receivable", "Receivable", "Money owed to you"]].map(([k, l, h]) => /* @__PURE__ */ React.createElement("button", { type: "button", key: k, onClick: () => setKind(k), "aria-pressed": kind === k, className: "btn flex-col !gap-0.5 !rounded-2xl !py-3 " + (kind === k ? "btn-p" : "") }, /* @__PURE__ */ React.createElement("span", null, l), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] opacity-80 font-normal" }, h))))), /* @__PURE__ */ React.createElement(Field, { label: "Source name", hint: item ? "Everything inside this source keeps its place." : "Add payables or receivables inside it afterwards." }, /* @__PURE__ */ React.createElement("input", { className: "field", autoFocus: true, maxLength: 24, placeholder: kind === "payable" ? "e.g. Credit Card" : "e.g. Family", value: name, onChange: (e) => setName(e.target.value) })), /* @__PURE__ */ React.createElement(Err, { m }), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-p w-full" }, item ? "Save name" : "Add source")));
}
function PaySheet({ item, onClose }) {
  const { S, c, payDebt } = useApp(), pay = item.kind === "payable", left = rem(item);
  const [v, setV] = useState(""), [m, setM] = useState("");
  const [w, setW] = useState(S.wallets.some((x) => x.id === item.wallet) ? item.wallet : S.wallets[0].id);
  const save = () => {
    if (!money(v) || +v <= 0) return setM("Enter an amount greater than zero with at most two decimals.");
    if (q(+v) > left) return setM("That’s more than the remaining " + php(left) + ".");
    if (pay && +v > c.bal[w]) return setM("This wallet only has " + php(c.bal[w]) + ". Pick another or pay less.");
    payDebt(item.id, q(+v), w);
    onClose();
  };
  return /* @__PURE__ */ React.createElement(Sheet, { title: pay ? "Record payment" : "Record receipt", onClose }, /* @__PURE__ */ React.createElement("form", { className: "space-y-3", onSubmit: (e) => {
    e.preventDefault();
    save();
  } }, /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3 flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "font-semibold truncate" }, item.party), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-mu" }, item.cat)), /* @__PURE__ */ React.createElement("div", { className: "text-right" }, /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-mu" }, "Remaining"), /* @__PURE__ */ React.createElement("div", { className: "font-semibold tabular-nums" }, php(left)))), /* @__PURE__ */ React.createElement(Field, { label: "Amount (PHP)", hint: "Partial amounts are fine." }, /* @__PURE__ */ React.createElement("input", { className: "field", autoFocus: true, inputMode: "decimal", placeholder: "0.00", value: v, onChange: (e) => setV(e.target.value) })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn !py-1.5 !text-xs", onClick: () => setV(String(pay ? Math.min(left, Math.max(0, c.bal[w])) : left)) }, pay ? "Pay the most this wallet allows" : "Full remaining amount"), /* @__PURE__ */ React.createElement(Field, { label: pay ? "Pay from" : "Receive into" }, /* @__PURE__ */ React.createElement("select", { className: "field", value: w, onChange: (e) => setW(e.target.value) }, /* @__PURE__ */ React.createElement(WOpts, { ws: S.wallets, c }))), isRecur(item) && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(Ic, { n: "repeat", s: 12 }), FREQ_LABEL[item.frequency], " · once this is fully ", pay ? "paid" : "received", ", the next one is created for ", fd(nextDue(item.due, item.frequency, item.recurDay)), item.isVariableAmount ? " at " + php(0) + " (you set the amount)" : "", "."), /* @__PURE__ */ React.createElement(Err, { m }), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-p w-full" }, pay ? "Record payment" : "Record receipt")));
}
function AllocSheet({ item, ask, onClose }) {
  const { S, c, setAllocations, clearAllocation } = useApp(), d = S.debts.find((x) => x.id === item.id) || item;
  const left = Math.max(0, rem(d)), cur = Object.fromEntries((d.allocations || []).map((x) => [x.walletId, x.amount]));
  const [v, setV] = useState(() => Object.fromEntries(S.wallets.map((w) => [w.id, cur[w.id] ? String(cur[w.id]) : ""])));
  const [m, setM] = useState(""), [conf, setConf] = useState(!!ask);
  const plan = Math.min((S.alloc || {})["d:" + d.id] || 0, Math.max(0, q(rem(d) - lockOf(d)))), mine = lockOf(d);
  const avail = (w) => Math.max(0, q(c.bal[w.id] - (c.lockW[w.id] || 0) + (cur[w.id] || 0)));
  const num = (w) => String(v[w.id]).trim() === "" ? 0 : money(v[w.id]) ? q(+v[w.id]) : NaN;
  const nums = S.wallets.map(num), bad = nums.some((n) => Number.isNaN(n)), total = q(nums.reduce((a, n) => a + (n || 0), 0)), had = (d.allocations || []).length > 0;
  const moveAll = (id) => {
    const t = Math.min(left, total || mine || left, avail(S.wallets.find((w) => w.id === id)));
    setV(Object.fromEntries(S.wallets.map((w) => [w.id, w.id === id && t > 0 ? String(t) : ""])));
    setM("");
  };
  const set = (id, x) => {
    setV({ ...v, [id]: x });
    setM("");
  };
  const fill = (w) => {
    const others = q(S.wallets.reduce((a, o) => a + (o.id === w.id ? 0 : num(o) || 0), 0));
    set(w.id, String(Math.max(0, Math.min(avail(w), q(left - others))) || ""));
  };
  const save = () => {
    if (bad) return setM("Use amounts with at most two decimals, or leave a wallet empty.");
    const over = S.wallets.find((w, i) => nums[i] > avail(w));
    if (over) return setM(over.name + " only has " + php(avail(over)) + " free to lock.");
    if (total > left) return setM("That’s more than the remaining " + php(left) + " for this payable.");
    if (q(total - mine) > Math.max(0, c.spendable)) return setM("Only " + php(Math.max(0, c.spendable)) + " of your Spendable balance is free to lock more.");
    setAllocations(d.id, S.wallets.map((w, i) => ({ walletId: w.id, amount: nums[i] })).filter((x) => x.amount > 0));
    onClose();
  };
  return /* @__PURE__ */ React.createElement(Sheet, { title: had ? "Edit allocation" : "Allocate funds", onClose }, /* @__PURE__ */ React.createElement("form", { className: "space-y-3", onSubmit: (e) => {
    e.preventDefault();
    save();
  } }, /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3 space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "font-semibold truncate" }, d.party), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-mu" }, d.cat, " · ", dueTxt(d.due))), /* @__PURE__ */ React.createElement("div", { className: "text-right shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-mu" }, "Remaining"), /* @__PURE__ */ React.createElement("div", { className: "font-semibold tabular-nums" }, php(left)))), /* @__PURE__ */ React.createElement(Bar, { pct: left ? Math.min(total, left) / left * 100 : 0 }), /* @__PURE__ */ React.createElement("div", { className: "text-xs tabular-nums " + (total > left ? "text-neg" : "text-mu") }, php(total), " / ", php(left), " allocated")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu" }, "Locked money stays in its wallet until you pay, but it is taken out of your Spendable balance."), S.wallets.length > 1 && /* @__PURE__ */ React.createElement(Field, { label: "Switch source wallet", hint: "Moves the whole locked amount into one wallet (up to what it has free)." }, /* @__PURE__ */ React.createElement("select", { className: "field", value: "", onChange: (e) => e.target.value && moveAll(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Move allocation to…"), S.wallets.map((w) => /* @__PURE__ */ React.createElement("option", { key: w.id, value: w.id }, w.name, " · free ", php(avail(w)))))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2.5" }, S.wallets.map((w) => /* @__PURE__ */ React.createElement("div", { key: w.id, className: "glass-tile p-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-3 text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "font-medium truncate min-w-0" }, w.name), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-mu tabular-nums shrink-0" }, "Free to lock ", php(avail(w)))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-2" }, /* @__PURE__ */ React.createElement("input", { className: "field flex-1 min-w-0", inputMode: "decimal", placeholder: "0.00", "aria-label": "Amount to lock from " + w.name, value: v[w.id], onChange: (e) => set(w.id, e.target.value) }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn !py-1.5 !px-2.5 !text-[11px] shrink-0", onClick: () => fill(w) }, "Max"), String(v[w.id]).trim() !== "" && /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn !py-1.5 !px-2.5 !text-[11px] shrink-0", "aria-label": "Clear " + w.name, onClick: () => set(w.id, "") }, "Clear"))))), /* @__PURE__ */ React.createElement(Err, { m }), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-p w-full" }, /* @__PURE__ */ React.createElement(Ic, { n: "lock", s: 16 }), had ? "Save allocation" : "Lock funds")), (had || plan > 0) && (conf ? /* @__PURE__ */ React.createElement("div", { className: "mt-3 glass-tile p-3 space-y-2.5", role: "alert" }, /* @__PURE__ */ React.createElement("p", { className: "text-[13px] leading-snug text-neg" }, "Unlock the ", php(q(mine + plan)), " set aside for “", d.party, "”? It goes back to your Spendable balance. Wallet balances don’t change."), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn flex-1", onClick: () => setConf(false) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn flex-1 !bg-neg !text-white", onClick: () => {
    clearAllocation(d.id);
    onClose();
  } }, "Yes, remove"))) : /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn w-full mt-3 text-neg", onClick: () => setConf(true) }, "Remove allocation")));
}
function GoalSheet({ item, onClose }) {
  const { addGoal, updGoal } = useApp();
  const [f, setF] = useState({ name: item ? item.name : "", target: item ? String(item.target) : "" }), [m, setM] = useState("");
  const save = () => {
    if (!f.name.trim()) return setM("Name your goal.");
    if (!money(f.target) || +f.target <= 0) return setM("Enter a target greater than zero with at most two decimals.");
    if (item && +f.target < item.saved) return setM("The target can’t be lower than the " + php(item.saved) + " already saved.");
    item ? updGoal(item.id, { name: f.name.trim(), target: +f.target }) : addGoal({ name: f.name.trim(), target: +f.target });
    onClose();
  };
  return /* @__PURE__ */ React.createElement(Sheet, { title: item ? "Edit goal" : "New goal", onClose }, /* @__PURE__ */ React.createElement("form", { className: "space-y-3", onSubmit: (e) => {
    e.preventDefault();
    save();
  } }, /* @__PURE__ */ React.createElement(Field, { label: "Goal name" }, /* @__PURE__ */ React.createElement("input", { className: "field", autoFocus: true, maxLength: 30, placeholder: "e.g. Emergency Fund", value: f.name, onChange: (e) => setF({ ...f, name: e.target.value }) })), /* @__PURE__ */ React.createElement(Field, { label: "Target (PHP)" }, /* @__PURE__ */ React.createElement("input", { className: "field", inputMode: "decimal", placeholder: "0.00", value: f.target, onChange: (e) => setF({ ...f, target: e.target.value }) })), /* @__PURE__ */ React.createElement(Err, { m }), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-p w-full" }, item ? "Save changes" : "Create goal")));
}
function MoneySheet({ item, onClose }) {
  const { c, addToGoal } = useApp(), need = q(item.target - item.saved), cash = Math.max(0, c.spendable), lim = q(Math.min(need, cash));
  const [v, setV] = useState(""), [m, setM] = useState("");
  const save = () => {
    if (!money(v) || +v <= 0) return setM("Enter an amount greater than zero with at most two decimals.");
    if (q(+v) > need) return setM("That’s more than the remaining target of " + php(need) + ".");
    if (q(+v) > cash) return setM("That’s more than your spendable balance of " + php(cash) + ".");
    addToGoal(item.id, q(+v));
    onClose();
  };
  return /* @__PURE__ */ React.createElement(Sheet, { title: "Add money · " + item.name, onClose }, /* @__PURE__ */ React.createElement("form", { className: "space-y-3", onSubmit: (e) => {
    e.preventDefault();
    save();
  } }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement(Tile, { l: "Remaining target", v: php(need) }), /* @__PURE__ */ React.createElement(Tile, { l: "Spendable balance", v: php(cash), tone: cash === 0 ? "text-neg" : "" })), /* @__PURE__ */ React.createElement(Field, { label: "Amount (PHP)", hint: "You can add up to " + php(lim) + " right now." }, /* @__PURE__ */ React.createElement("input", { className: "field", autoFocus: true, inputMode: "decimal", placeholder: "0.00", value: v, onChange: (e) => setV(e.target.value) })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn !py-1.5 !text-xs", disabled: lim <= 0, onClick: () => setV(String(lim)) }, "Add the maximum"), /* @__PURE__ */ React.createElement(Err, { m }), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-p w-full", disabled: lim <= 0 }, "Add money")));
}
const csv = (rows) => rows.map((r) => r.map((v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"').join(",")).join("\r\n");
const download = (name, text) => {
  const url = URL.createObjectURL(new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8" })), a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4e3);
};
function ReportSheet({ onClose }) {
  const { S, c } = useApp(), [p, setP] = useState("month"), t0 = off(0), mo = t0.slice(0, 7);
  const W = Object.fromEntries(S.wallets.map((w) => [w.id, w.name])), nm = (id) => W[id] || "Removed";
  const rows = [
    ...S.tx.filter((x) => x.date <= t0).map((x) => [x.date, x.type, x.category, x.note || "", nm(x.wallet), x.type === "transfer" ? nm(x.to) : "", x.amount]),
    ...S.debts.flatMap((d) => (d.payments || []).map((y) => [y.date, d.kind === "payable" ? "expense" : "income", d.cat, (d.kind === "payable" ? "Paid · " : "Received · ") + d.party, nm(y.wallet), "", y.amount]))
  ].filter((r) => p === "all" || r[0].startsWith(mo)).sort((a, b) => b[0].localeCompare(a[0]));
  const sum = (t) => q(rows.filter((r) => r[1] === t).reduce((a, r) => a + r[6], 0)), inc = sum("income"), exp = sum("expense");
  const cat = {};
  rows.filter((r) => r[1] === "expense").forEach((r) => {
    cat[r[2]] = q((cat[r[2]] || 0) + r[6]);
  });
  const top = Object.entries(cat).sort((a, b) => b[1] - a[1]).slice(0, 5), label = p === "all" ? "All time" : c.monthName + " " + t0.slice(0, 4);
  const stamp = t0.replace(/-/g, "");
  const txCsv = () => download("budgy-transactions-" + stamp + ".csv", csv([["Date", "Type", "Category", "Note", "Wallet", "To wallet", "Amount (PHP)"], ...rows]));
  const sumCsv = () => download("budgy-summary-" + stamp + ".csv", csv([
    ["Budgy summary", label],
    ["Generated", t0],
    [],
    ["Income", inc],
    ["Expenses", exp],
    ["Net cash flow", q(inc - exp)],
    [],
    ["Liquid cash", c.liquid],
    ["Allocated", c.allocated],
    ["Spendable", c.spendable],
    ["Total payables", c.pay],
    ["Total receivables", c.rec],
    ["Net worth", c.net],
    [],
    ["Wallet", "Type", "Balance"],
    ...S.wallets.map((w) => [w.name, w.type, c.bal[w.id]]),
    [],
    ["Goal", "Saved", "Target"],
    ...S.goals.map((g) => [g.name, g.saved, g.target]),
    [],
    ["Expense category", "Amount"],
    ...Object.entries(cat).sort((a, b) => b[1] - a[1])
  ]));
  return /* @__PURE__ */ React.createElement(Sheet, { title: "Reports", onClose }, /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-1 grid grid-cols-2 gap-1" }, [["month", "This month"], ["all", "All time"]].map(([k, l]) => /* @__PURE__ */ React.createElement("button", { key: k, "aria-pressed": p === k, onClick: () => setP(k), className: "btn !border-transparent " + (p === k ? "btn-p" : "!bg-transparent") }, l))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-2" }, /* @__PURE__ */ React.createElement(Tile, { l: "Income", v: php(inc), tone: "text-pos" }), /* @__PURE__ */ React.createElement(Tile, { l: "Expenses", v: php(exp), tone: "text-neg" }), /* @__PURE__ */ React.createElement(Tile, { l: "Net", v: php(q(inc - exp)), tone: inc - exp < 0 ? "text-neg" : "text-pos" })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement(Tile, { l: "Liquid cash", v: php(c.liquid) }), /* @__PURE__ */ React.createElement(Tile, { l: "Net worth", v: php(c.net), tone: c.net < 0 ? "text-neg" : "" }), /* @__PURE__ */ React.createElement(Tile, { l: "Payables", v: php(c.pay) }), /* @__PURE__ */ React.createElement(Tile, { l: "Receivables", v: php(c.rec) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold mb-2" }, "Top expenses · ", label), top.length ? /* @__PURE__ */ React.createElement("div", { className: "space-y-2.5" }, top.map(([k, v]) => /* @__PURE__ */ React.createElement("div", { key: k }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-xs mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-mu" }, k), /* @__PURE__ */ React.createElement("span", { className: "tabular-nums" }, php(v))), /* @__PURE__ */ React.createElement(Bar, { pct: v / top[0][1] * 100 })))) : /* @__PURE__ */ React.createElement("p", { className: "text-sm text-mu" }, "No expenses in this period.")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-p", onClick: txCsv, disabled: !rows.length }, /* @__PURE__ */ React.createElement(Ic, { n: "dl", s: 16 }), "Transactions CSV"), /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: sumCsv }, /* @__PURE__ */ React.createElement(Ic, { n: "dl", s: 16 }), "Summary CSV")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu" }, rows.length, " transaction", rows.length === 1 ? "" : "s", " in this period. CSV files open in Excel, Numbers and Google Sheets.")));
}
function P2Sheets({ sheet: s, onClose }) {
  if (s.k === "tx") return /* @__PURE__ */ React.createElement(TxSheet, { kind: s.kind, preset: s.preset, item: s.item, onClose });
  if (s.k === "debt") return /* @__PURE__ */ React.createElement(DebtSheet, { kind: s.kind, item: s.item, preset: s.preset, fill: s.fill, lock: s.lock, onClose });
  if (s.k === "source") return /* @__PURE__ */ React.createElement(SourceSheet, { item: s.item, kind: s.kind, onClose });
  if (s.k === "pay") return /* @__PURE__ */ React.createElement(PaySheet, { item: s.item, onClose });
  if (s.k === "alloc") return /* @__PURE__ */ React.createElement(AllocSheet, { item: s.item, ask: s.ask, onClose });
  if (s.k === "goal") return /* @__PURE__ */ React.createElement(GoalSheet, { item: s.item, onClose });
  if (s.k === "gmoney") return /* @__PURE__ */ React.createElement(MoneySheet, { item: s.item, onClose });
  if (s.k === "report") return /* @__PURE__ */ React.createElement(ReportSheet, { onClose });
  return null;
}
function QuickAddSheet({ onClose, openSheet }) {
  const rows = [["Expense", "down", { k: "tx", kind: "expense" }], ["Income", "up", { k: "tx", kind: "income" }], ["Transfer", "swap", { k: "tx", kind: "transfer" }], ["Payable", "clock", { k: "debt", kind: "payable", item: null }], ["Receivable", "clock", { k: "debt", kind: "receivable", item: null }], ["Savings goal", "target", { k: "goal", item: null }], ["Wallet", "wallet", { k: "wallet", item: null }]];
  return /* @__PURE__ */ React.createElement(Sheet, { title: "Quick add", onClose }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2" }, rows.map(([l, i, s], n) => /* @__PURE__ */ React.createElement("button", { key: l, className: "btn !justify-start !rounded-2xl !py-3.5 " + (n === 0 ? "btn-p sm:col-span-2" : ""), onClick: () => openSheet(s) }, /* @__PURE__ */ React.createElement(Ic, { n: i, s: 18 }), l))));
}
const UndoBtn = ({ onClick, label }) => /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn !py-1 !px-2 !text-[11px] shrink-0", "aria-label": label, title: "Reverse this entry and restore the balance", onClick }, /* @__PURE__ */ React.createElement(Ic, { n: "undo", s: 12 }), "Undo");
function DebtRow({ d, openSheet }) {
  const { S, delDebt, undoPay, clearAllocation } = useApp(), [h, setH] = useState(false);
  const pay = d.kind === "payable", r = rem(d), lk = lockOf(d), ask = needsAmt(d), done = r <= 0 && !ask, late = !done && d.due < off(0), W = Object.fromEntries(S.wallets.map((w) => [w.id, w.name]));
  return /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3.5 space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "font-medium break-words leading-snug min-w-0" }, d.party), isRecur(d) && /* @__PURE__ */ React.createElement("span", { className: "shrink-0 inline-flex items-center gap-1 text-[10px] font-medium text-mu", title: "Repeats " + d.frequency }, /* @__PURE__ */ React.createElement(Ic, { n: "repeat", s: 11 }), FREQ_LABEL[d.frequency])), /* @__PURE__ */ React.createElement("div", { className: "text-xs mt-0.5 leading-snug " + (late ? "text-neg" : done ? "text-pos" : "text-mu") }, done ? "Settled" : dueTxt(d.due), " · ", fd(d.due))), /* @__PURE__ */ React.createElement("div", { className: "text-right shrink-0 whitespace-nowrap" }, ask ? /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 rounded-full bg-neg/15 text-neg text-[11px] font-semibold px-2 py-0.5" }, /* @__PURE__ */ React.createElement(Ic, { n: "alert", s: 12 }), "Set Amount") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "font-semibold tabular-nums leading-snug " + (!pay && !done ? "text-pos" : "") }, php(Math.max(0, r))), /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-mu leading-snug" }, "of ", php(d.total))))), !ask && /* @__PURE__ */ React.createElement(Bar, { pct: d.total > 0 ? (d.paid || 0) / d.total * 100 : 0 }), pay && !done && lk > 0 && /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5", "aria-label": php(lk) + " of " + php(r) + " allocated" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs" }, /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 font-medium " + (lk >= r ? "text-pos" : "text-ac") }, /* @__PURE__ */ React.createElement(Ic, { n: "lock", s: 12 }), php(lk), " / ", php(r), " Allocated"), /* @__PURE__ */ React.createElement("span", { className: "text-mu" }, lk >= r ? "Fully locked" : php(q(r - lk)) + " unlocked")), /* @__PURE__ */ React.createElement(Bar, { gray: true, pct: lk / r * 100 }), /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-mu break-words leading-snug" }, (d.allocations || []).filter((x) => W[x.walletId]).map((x) => W[x.walletId] + " " + php(x.amount)).join(" · ")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 pt-0.5" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn !py-1 !px-2.5 !text-[11px]", onClick: () => openSheet({ k: "alloc", item: d }) }, /* @__PURE__ */ React.createElement(Ic, { n: "pen", s: 12 }), "Edit allocation"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn !py-1 !px-2.5 !text-[11px] text-neg", onClick: () => openSheet({ k: "alloc", item: d, ask: true }) }, "Remove"))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2" }, ask && /* @__PURE__ */ React.createElement("button", { className: "btn btn-p !py-1.5 !px-3 !text-xs", onClick: () => openSheet({ k: "debt", kind: d.kind, item: d }) }, /* @__PURE__ */ React.createElement(Ic, { n: "pen", s: 14 }), "Set Amount"), !done && !ask && /* @__PURE__ */ React.createElement("button", { className: "btn btn-p !py-1.5 !px-3 !text-xs", onClick: () => openSheet({ k: "pay", item: d }) }, pay ? "Pay" : "Receive"), /* @__PURE__ */ React.createElement("button", { className: "btn !py-1.5 !px-3 !text-xs", "aria-expanded": h, onClick: () => setH(!h) }, /* @__PURE__ */ React.createElement(Ic, { n: "hist", s: 14 }), h ? "Hide history" : "View history"), /* @__PURE__ */ React.createElement("span", { className: "ml-auto" }, /* @__PURE__ */ React.createElement(OptionsMenu, { label: "Options for " + d.party, items: [
    { label: "Edit", icon: "pen", onClick: () => openSheet({ k: "debt", kind: d.kind, item: d }) },
    ...pay && !done && !ask ? [{ label: lk > 0 ? "Edit Allocation" : "Allocate Funds", icon: "lock", onClick: () => openSheet({ k: "alloc", item: d }) }] : [],
    ...pay && (lk > 0 || (S.alloc || {})["d:" + d.id] > 0) ? [{ label: "Remove Allocation", icon: "trash", onClick: () => clearAllocation(d.id), confirm: { warn: "Unlock the " + php(q(lk + Math.min((S.alloc || {})["d:" + d.id] || 0, Math.max(0, q(r - lk))))) + " set aside for “" + d.party + "”? It goes back to your Spendable balance.", yes: "Yes, remove" } }] : [],
    { label: "Delete", icon: "trash", danger: true, onClick: () => delDebt(d.id), confirm: { warn: "Delete “" + d.party + "”? " + ((d.payments || []).length ? "Its payment history is deleted too and those payments go back to your wallets. " : "") + "This can’t be undone.", yes: "Yes, delete" } }
  ] }))), h && /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5 fade" }, (d.payments || []).length ? d.payments.slice().reverse().map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, className: "flex items-center justify-between gap-2 text-xs" }, /* @__PURE__ */ React.createElement("span", { className: "text-mu break-words min-w-0 flex-1 leading-snug" }, pay ? "Paid" : "Received", " · ", fd(p.date), " · ", W[p.wallet] || "Removed"), /* @__PURE__ */ React.createElement("span", { className: "tabular-nums shrink-0" }, pay ? "−" : "+", php(p.amount)), /* @__PURE__ */ React.createElement(UndoBtn, { onClick: () => undoPay(d.id, p.id), label: "Undo " + (pay ? "payment" : "receipt") + " of " + php(p.amount) }))) : /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu" }, "No payments recorded yet.")));
}
const dueLabel = (d) => {
  const n = daysTo(d), yr = (/* @__PURE__ */ new Date(d + "T00:00")).getFullYear() !== (/* @__PURE__ */ new Date()).getFullYear();
  const dt = (/* @__PURE__ */ new Date(d + "T00:00")).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: yr ? "numeric" : void 0 });
  return n === 0 ? "Due Today" : n === 1 ? "Due Tomorrow" : n < 0 ? "Overdue · " + dt : "Due " + dt;
};
const signedMoney = (n) => (n > 0 ? "+" : n < 0 ? "−" : "") + php(Math.abs(n));
function DueItem({ d, openSheet }) {
  const { delDebt } = useApp(), pay = d.kind === "payable", r = Math.max(0, rem(d));
  return /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3 flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-x-1.5 min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-medium break-words leading-snug min-w-0" }, d.party), isRecur(d) && /* @__PURE__ */ React.createElement("span", { className: "shrink-0 text-mu", title: "Repeats " + d.frequency }, /* @__PURE__ */ React.createElement(Ic, { n: "repeat", s: 11 }))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-mu min-w-0 mt-0.5" }, /* @__PURE__ */ React.createElement("span", { className: "shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold " + (pay ? "bg-neg/15 text-neg" : "bg-pos/15 text-pos") }, pay ? "Payable" : "Receivable"), /* @__PURE__ */ React.createElement("span", { className: "break-words min-w-0" }, d.cat, (d.paid || 0) > 0 ? " · " + php(d.paid) + " of " + php(d.total) + " settled" : ""))), /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold tabular-nums shrink-0 whitespace-nowrap " + (pay ? "text-neg" : "text-pos") }, pay ? "−" : "+", php(r)), /* @__PURE__ */ React.createElement("div", { className: "-mr-2 shrink-0" }, /* @__PURE__ */ React.createElement(OptionsMenu, { label: "Options for " + d.party, items: [
    { label: pay ? "Mark as Paid" : "Mark as Received", icon: "check", onClick: () => openSheet({ k: "pay", item: d }) },
    { label: "Edit", icon: "pen", onClick: () => openSheet({ k: "debt", kind: d.kind, item: d }) },
    { label: "Delete", icon: "trash", danger: true, onClick: () => delDebt(d.id), confirm: { warn: "Delete “" + d.party + "”? " + ((d.payments || []).length ? "Its payment history is deleted too and those payments go back to your wallets. " : "") + "This can’t be undone.", yes: "Yes, delete" } }
  ] })));
}
function DueSummary({ openSheet, kind }) {
  const { S } = useApp(), [open, setOpen] = useState({}), [all, setAll] = useState(true);
  const act = S.debts.filter((d) => d.kind === kind && rem(d) > 0 && !needsAmt(d) && d.due);
  const dates = [...new Set(act.map((d) => d.due))].sort();
  const groups = dates.map((date) => {
    const items = act.filter((d) => d.due === date).sort((a, b) => a.kind === b.kind ? a.party.localeCompare(b.party) : a.kind === "payable" ? -1 : 1);
    const pay = q(items.filter((d) => d.kind === "payable").reduce((a, d) => a + rem(d), 0)), rec = q(items.filter((d) => d.kind === "receivable").reduce((a, d) => a + rem(d), 0));
    return { date, items, pay, rec, np: items.filter((d) => d.kind === "payable").length, nr: items.filter((d) => d.kind === "receivable").length, late: daysTo(date) < 0, now: daysTo(date) === 0 };
  });
  if (!groups.length) return null;
  const isOpen = (g) => open[g.date] !== void 0 ? open[g.date] : g.late || g.now;
  const allOpen = groups.every(isOpen);
  const totPay = q(groups.reduce((a, g) => a + g.pay, 0)), totRec = q(groups.reduce((a, g) => a + g.rec, 0));
  return /* @__PURE__ */ React.createElement(Glass, { className: "p-4 sm:p-5" }, /* @__PURE__ */ React.createElement("button", { className: "w-full flex items-center justify-between gap-3 text-left", "aria-expanded": all, onClick: () => setAll(!all) }, /* @__PURE__ */ React.createElement("span", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "block font-semibold" }, "Due Date Summary"), /* @__PURE__ */ React.createElement("span", { className: "block text-xs text-mu" }, groups.length, " date", groups.length === 1 ? "" : "s", " · ", kind === "payable" ? "to pay " + php(totPay) : "to receive " + php(totRec))), /* @__PURE__ */ React.createElement(Ic, { n: "chev", s: 18, cls: "text-mu shrink-0 transition-transform " + (all ? "rotate-180" : "") })), all && /* @__PURE__ */ React.createElement("div", { className: "mt-4 space-y-2.5 fade" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-end" }, /* @__PURE__ */ React.createElement("button", { className: "btn !py-1 !px-2.5 !text-[11px]", onClick: () => setOpen(Object.fromEntries(groups.map((g) => [g.date, !allOpen]))) }, allOpen ? "Collapse all" : "Expand all")), groups.map((g) => {
    const on = isOpen(g), both = g.np > 0 && g.nr > 0, net = q(g.rec - g.pay);
    return /* @__PURE__ */ React.createElement("div", { key: g.date, className: "rounded-2xl border border-bd/60 bg-s2/40" }, /* @__PURE__ */ React.createElement("button", { className: "w-full flex items-center justify-between gap-3 text-left p-3", "aria-expanded": on, onClick: () => setOpen({ ...open, [g.date]: !on }) }, /* @__PURE__ */ React.createElement("span", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "block text-sm font-semibold " + (g.late ? "text-neg" : "") }, dueLabel(g.date)), /* @__PURE__ */ React.createElement("span", { className: "block text-[11px] text-mu" }, g.items.length, " item", g.items.length === 1 ? "" : "s", both ? " · " + g.np + " to pay, " + g.nr + " to receive" : "")), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-2 shrink-0 text-right" }, /* @__PURE__ */ React.createElement("span", null, both ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "block text-sm font-semibold tabular-nums" }, "Net ", signedMoney(net)), /* @__PURE__ */ React.createElement("span", { className: "block text-[11px] text-mu tabular-nums" }, "Pay ", php(g.pay), " · Get ", php(g.rec))) : g.np > 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "block text-[11px] text-mu" }, "Total Due"), /* @__PURE__ */ React.createElement("span", { className: "block text-sm font-semibold tabular-nums text-neg" }, php(g.pay))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "block text-[11px] text-mu" }, "Total to Receive"), /* @__PURE__ */ React.createElement("span", { className: "block text-sm font-semibold tabular-nums text-pos" }, php(g.rec)))), /* @__PURE__ */ React.createElement(Ic, { n: "chev", s: 16, cls: "text-mu transition-transform " + (on ? "rotate-180" : "") }))), on && /* @__PURE__ */ React.createElement("div", { className: "px-3 pb-3 space-y-2 fade" }, g.items.map((d) => /* @__PURE__ */ React.createElement(DueItem, { key: d.id, d, openSheet }))));
  })));
}
function Pending({ openSheet }) {
  const { S, c, delSrc, undoPay } = useApp();
  const [open, setOpen] = useState({}), [tab, setTab] = useState("payable");
  const isPay = tab === "payable";
  const list = (S.srcs || []).map((x) => ({ kind: x.kind, name: x.name }));
  S.debts.forEach((d) => {
    if (!list.some((x) => x.kind === d.kind && x.name === d.cat)) list.push({ kind: d.kind, name: d.cat });
  });
  const groups = list.filter((x) => x.kind === tab).map((x) => ({ ...x, key: x.kind + "|" + x.name, items: S.debts.filter((d) => d.kind === x.kind && d.cat === x.name).sort((a, b) => (rem(a) <= 0) - (rem(b) <= 0) || a.due.localeCompare(b.due)) }));
  const isOpen = (k) => open[k] !== false;
  const allOpen = groups.length > 0 && groups.every((g) => isOpen(g.key));
  const late = S.debts.filter((d) => d.kind === tab && rem(d) > 0 && d.due < off(0)).length;
  const openN = (k) => S.debts.filter((d) => d.kind === k && rem(d) > 0).length;
  const W = Object.fromEntries(S.wallets.map((w) => [w.id, w.name]));
  const hist = S.debts.filter((d) => d.kind === tab).flatMap((d) => (d.payments || []).map((p) => ({ d, p }))).sort((a, b) => b.p.date.localeCompare(a.p.date)).slice(0, 25);
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-1 grid grid-cols-2 gap-1", role: "tablist", "aria-label": "Payables or receivables", "data-noswipe": true }, [["payable", "Payables"], ["receivable", "Receivables"]].map(([k, l]) => /* @__PURE__ */ React.createElement("button", { key: k, type: "button", role: "tab", "aria-selected": tab === k, onClick: () => setTab(k), className: "btn !border-transparent !gap-2 " + (tab === k ? "btn-p" : "!bg-transparent") }, l, /* @__PURE__ */ React.createElement("span", { className: "min-w-[20px] rounded-full px-1.5 text-[11px] font-semibold tabular-nums " + (tab === k ? "bg-white/25" : "bg-fg/10 text-mu") }, openN(k))))), /* @__PURE__ */ React.createElement("div", { className: "fade", key: tab + "-sum" }, /* @__PURE__ */ React.createElement(Tile, { l: isPay ? "Total payables" : "Total receivables", v: php(isPay ? c.pay : c.rec), tone: isPay ? c.pay > 0 ? "text-neg" : "" : c.rec > 0 ? "text-pos" : "" })), /* @__PURE__ */ React.createElement(DueSummary, { key: tab, kind: tab, openSheet }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-mu" }, late ? /* @__PURE__ */ React.createElement("span", { className: "text-neg" }, late, " overdue") : "Nothing overdue"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, groups.length > 0 && /* @__PURE__ */ React.createElement("button", { className: "btn !py-1.5 !text-xs", onClick: () => setOpen({ ...open, ...Object.fromEntries(groups.map((g) => [g.key, !allOpen])) }) }, allOpen ? "Collapse all" : "Expand all"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-p !py-1.5 !text-xs", onClick: () => openSheet({ k: "source", item: null, kind: tab }) }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 14 }), "Add Source"))), !groups.length && /* @__PURE__ */ React.createElement(Empty, { t: isPay ? "No payable sources yet. Tap “Add Source” (for example a credit card or a loan), then add payables inside it." : "No receivable sources yet. Tap “Add Source” (for example a person or an employer), then add receivables inside it." }), /* @__PURE__ */ React.createElement("div", { className: "space-y-3", key: tab + "-list" }, groups.map((g) => {
    const on = isOpen(g.key), pay = g.kind === "payable", t = q(g.items.reduce((a, d) => a + Math.max(0, rem(d)), 0));
    return /* @__PURE__ */ React.createElement(Glass, { key: g.key, className: "p-4 sm:p-5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("button", { className: "min-w-0 flex-1 flex items-center justify-between gap-3 text-left", "aria-expanded": on, onClick: () => setOpen({ ...open, [g.key]: !on }) }, /* @__PURE__ */ React.createElement("span", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "flex flex-wrap items-center gap-x-2 gap-y-1" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold break-words leading-snug min-w-0" }, g.name), /* @__PURE__ */ React.createElement("span", { className: "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold " + (pay ? "bg-neg/15 text-neg" : "bg-pos/15 text-pos") }, pay ? "Payable" : "Receivable")), /* @__PURE__ */ React.createElement("span", { className: "block text-xs text-mu" }, g.items.length, " item", g.items.length === 1 ? "" : "s")), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-2 shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold tabular-nums whitespace-nowrap" }, php(t)), /* @__PURE__ */ React.createElement(Ic, { n: "chev", s: 18, cls: "text-mu transition-transform " + (on ? "rotate-180" : "") }))), /* @__PURE__ */ React.createElement("div", { className: "-mr-2 shrink-0" }, /* @__PURE__ */ React.createElement(OptionsMenu, { label: "Options for " + g.name, items: [
      { label: "Edit Name", icon: "pen", onClick: () => openSheet({ k: "source", item: { kind: g.kind, name: g.name } }) },
      { label: "Delete", icon: "trash", danger: true, onClick: () => delSrc(g.kind, g.name), confirm: { warn: "Delete “" + g.name + "”? " + (g.items.length ? "Its " + g.items.length + " item" + (g.items.length === 1 ? "" : "s") + " and payment history are deleted too, and those payments go back to your wallets. " : "") + "This can’t be undone.", yes: "Yes, delete" } }
    ] }))), on && /* @__PURE__ */ React.createElement("div", { className: "mt-3 space-y-3 fade" }, g.items.map((d) => /* @__PURE__ */ React.createElement(DebtRow, { key: d.id, d, openSheet })), !g.items.length && /* @__PURE__ */ React.createElement("p", { className: "text-sm text-mu text-center py-2" }, "Nothing in " + g.name + " yet."), /* @__PURE__ */ React.createElement("button", { className: "btn w-full !py-2 !text-sm", onClick: () => openSheet({ k: "debt", kind: g.kind, item: null, preset: g.name, lock: true }) }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 15 }), pay ? "Add payable" : "Add receivable")));
  })), hist.length > 0 && /* @__PURE__ */ React.createElement(Fold, { title: isPay ? "Payment history" : "Receipt history", right: /* @__PURE__ */ React.createElement("span", null, hist.length, " latest") }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, hist.map(({ d, p }) => {
    const pay = d.kind === "payable";
    return /* @__PURE__ */ React.createElement("div", { key: p.id, className: "flex items-center gap-2 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-[13px] font-medium break-words leading-snug" }, pay ? "Paid" : "Received", " · ", d.party), /* @__PURE__ */ React.createElement("div", { className: "text-mu break-words leading-snug" }, d.cat, " · ", W[p.wallet] || "Removed", " · ", fd(p.date))), /* @__PURE__ */ React.createElement("span", { className: "tabular-nums font-semibold shrink-0 whitespace-nowrap " + (pay ? "text-neg" : "text-pos") }, pay ? "−" : "+", php(p.amount)), /* @__PURE__ */ React.createElement(UndoBtn, { onClick: () => undoPay(d.id, p.id), label: "Undo " + (pay ? "payment" : "receipt") + " of " + php(p.amount) + " for " + d.party }));
  }))));
}
function Allocate({ openSheet }) {
  const { S, c, setAlloc } = useApp(), [pick, setPick] = useState(false);
  const pays = S.debts.filter((d) => d.kind === "payable" && rem(d) > 0).sort((a, b) => a.due.localeCompare(b.due));
  const recs = S.debts.filter((d) => d.kind === "receivable" && rem(d) > 0).sort((a, b) => a.due.localeCompare(b.due));
  const room = (d) => Math.max(0, q(rem(d) - lockOf(d))), cur = (d) => Math.min(S.alloc["d:" + d.id] || 0, room(d)), short = (d) => q(rem(d) - lockOf(d) - cur(d));
  const cash = Math.max(0, c.spendable), totalShort = q(pays.reduce((a, d) => a + short(d), 0));
  const urgent = pays.filter((d) => short(d) > 0 && d.due <= off(14));
  const smart = () => {
    let free = Math.max(0, q(c.liquid - c.saved - c.locked));
    const p = {};
    pays.forEach((d) => {
      const a = Math.min(room(d), free);
      p["d:" + d.id] = a;
      free = q(free - a);
    });
    setAlloc(p);
  };
  const clear = () => setAlloc(Object.fromEntries(pays.map((d) => ["d:" + d.id, 0])));
  const preview = (amt) => {
    const nc = q(cash + amt), cov = Math.min(nc, totalShort);
    return { nc, cov, left: q(totalShort - cov), spare: q(nc - cov) };
  };
  const recAll = q(recs.reduce((a, d) => a + rem(d), 0));
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement(Glass, { className: "p-5", style: { background: "linear-gradient(135deg, rgb(var(--a) / .26), rgb(var(--s1) / .5) 70%)", borderColor: "rgb(var(--a) / .3)" } }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-mu" }, "Unallocated cash"), /* @__PURE__ */ React.createElement("div", { className: "text-3xl font-semibold tracking-tight mt-1 tabular-nums " + (c.spendable < 0 ? "text-neg" : "") }, /* @__PURE__ */ React.createElement(Num, { v: c.spendable })), /* @__PURE__ */ React.createElement("div", { className: "mt-3" }, /* @__PURE__ */ React.createElement(Bar, { lg: true, pct: c.allocated / Math.max(c.liquid, 1) * 100 })), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-mu mt-2" }, php(c.allocated), " of ", php(c.liquid), " is locked", c.spendable < 0 ? ". Your allocations are higher than your cash." : "."), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 mt-4" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-p", onClick: smart, disabled: !pays.length }, /* @__PURE__ */ React.createElement(Ic, { n: "sparkle", s: 16 }), "Smart Plan"), /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: clear, disabled: !pays.length }, "Clear plan"), /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: () => pays.length === 1 && openSheet ? openSheet({ k: "alloc", item: pays[0] }) : setPick(!pick), disabled: !pays.length || !openSheet, "aria-expanded": pick }, /* @__PURE__ */ React.createElement(Ic, { n: "lock", s: 16 }), "Allocate to Payable")), pick && /* @__PURE__ */ React.createElement("div", { className: "mt-3 glass-tile p-2 space-y-1 fade", role: "menu", "aria-label": "Choose a payable to allocate to" }, /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-mu px-2 pt-1" }, "Choose a payable. It opens the same Allocate Funds sheet as Pending."), pays.map((d) => /* @__PURE__ */ React.createElement("button", { key: d.id, type: "button", role: "menuitem", className: "w-full flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-fg/5 active:bg-fg/10", onClick: () => {
    setPick(false);
    openSheet({ k: "alloc", item: d });
  } }, /* @__PURE__ */ React.createElement("span", { className: "min-w-0 truncate" }, d.party, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-mu" }, " · ", dueTxt(d.due))), /* @__PURE__ */ React.createElement("span", { className: "tabular-nums text-xs text-mu whitespace-nowrap" }, lockOf(d) > 0 ? php(lockOf(d)) + " locked · " : "", php(rem(d)), " left"))))), urgent.length > 0 && /* @__PURE__ */ React.createElement(Glass, { className: "p-4 sm:p-5", style: { borderColor: "rgb(var(--neg) / .4)" }, role: "alert" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 font-semibold text-neg" }, /* @__PURE__ */ React.createElement(Ic, { n: "alert", s: 18 }), "Priority payables are short"), /* @__PURE__ */ React.createElement("div", { className: "mt-3 space-y-2" }, urgent.map((d) => /* @__PURE__ */ React.createElement("div", { key: d.id, className: "flex justify-between gap-3 text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "min-w-0 truncate" }, d.party, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-mu" }, " · ", dueTxt(d.due))), /* @__PURE__ */ React.createElement("span", { className: "text-neg tabular-nums whitespace-nowrap" }, "Short ", php(short(d)))))), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu mt-3" }, cash >= totalShort ? "You have enough spendable cash to cover these. Tap Smart Plan." : "Spendable cash covers " + php(cash) + " of the " + php(totalShort) + " still unfunded.")), /* @__PURE__ */ React.createElement(Glass, { className: "p-4 sm:p-5" }, /* @__PURE__ */ React.createElement("h3", { className: "font-semibold" }, "Target allocation"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu mt-1" }, "Drag to set aside cash for each payable, earliest due first. Locked money leaves your spendable balance."), /* @__PURE__ */ React.createElement("div", { className: "mt-4 space-y-5" }, pays.length ? pays.map((d) => {
    const a = cur(d), mx = q(Math.min(room(d), a + cash)), s = short(d);
    return /* @__PURE__ */ React.createElement("div", { key: d.id }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between gap-3 text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "min-w-0 truncate" }, d.party, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-mu" }, " · ", d.cat, " · ", dueTxt(d.due))), /* @__PURE__ */ React.createElement("span", { className: "tabular-nums whitespace-nowrap" }, php(a))), /* @__PURE__ */ React.createElement("input", { type: "range", min: "0", max: mx, step: "0.01", value: Math.min(a, mx), "aria-label": "Amount to allocate to " + d.party, onChange: (e) => setAlloc({ ["d:" + d.id]: q(Math.min(+e.target.value, mx)) }) }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 text-xs" }, /* @__PURE__ */ React.createElement("span", { className: s > 0 ? "text-neg" : "text-pos" }, s > 0 ? "Short " + php(s) + " of " + php(rem(d)) : "Fully funded", lockOf(d) > 0 ? " · " + php(lockOf(d)) + " locked in wallets" : ""), /* @__PURE__ */ React.createElement("span", { className: "flex gap-1.5" }, openSheet && /* @__PURE__ */ React.createElement("button", { className: "btn !py-1 !px-2.5 !text-[11px]", onClick: () => openSheet({ k: "alloc", item: d }) }, /* @__PURE__ */ React.createElement(Ic, { n: "lock", s: 12 }), lockOf(d) > 0 ? "Edit lock" : "Lock funds"), /* @__PURE__ */ React.createElement("button", { className: "btn !py-1 !px-2.5 !text-[11px]", onClick: () => setAlloc({ ["d:" + d.id]: mx }) }, "Max"))));
  }) : /* @__PURE__ */ React.createElement(Empty, { t: "No open payables to plan for." }))), /* @__PURE__ */ React.createElement(Fold, { title: "Unallocated cash breakdown", right: /* @__PURE__ */ React.createElement("span", { className: "tabular-nums" }, php(c.spendable)) }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2 text-sm" }, [["Liquid cash", c.liquid, ""], ["Locked in wallets for payables", -c.locked, "text-ac"], ["Reserved by Smart Plan", -c.allocD, "text-ac"], ["Locked in savings goals", -c.saved, "text-ac"]].map(([l, v, t]) => /* @__PURE__ */ React.createElement("div", { key: l, className: "flex justify-between gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-mu" }, l), /* @__PURE__ */ React.createElement("span", { className: "tabular-nums " + t }, v < 0 ? "−" : "", php(Math.abs(v))))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between gap-3 border-t border-fg/10 pt-2 font-semibold" }, /* @__PURE__ */ React.createElement("span", null, "Spendable"), /* @__PURE__ */ React.createElement("span", { className: "tabular-nums " + (c.spendable < 0 ? "text-neg" : "") }, php(c.spendable)))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 mt-4" }, S.wallets.map((w) => /* @__PURE__ */ React.createElement(Tile, { key: w.id, l: w.name, v: php(c.bal[w.id]), tone: c.bal[w.id] < 0 ? "text-neg" : "" })))), /* @__PURE__ */ React.createElement(Fold, { title: "If your receivables arrive", right: /* @__PURE__ */ React.createElement("span", { className: "tabular-nums" }, recs.length ? "+" + php(recAll) : "none") }, recs.length ? /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3" }, [...recs.length > 1 ? [{ id: "all", party: "Everything owed to you", due: "", amt: recAll }] : [], ...recs.map((d) => ({ id: d.id, party: d.party, due: d.due, amt: rem(d) }))].map((r) => {
    const p = preview(r.amt);
    return /* @__PURE__ */ React.createElement("div", { key: r.id, className: "glass-tile p-3.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "font-medium truncate" }, r.party), r.due && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-mu" }, dueTxt(r.due))), /* @__PURE__ */ React.createElement("div", { className: "text-pos font-semibold tabular-nums whitespace-nowrap" }, "+", php(r.amt))), /* @__PURE__ */ React.createElement("div", { className: "mt-3 space-y-1 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-mu" }, "Spendable becomes"), /* @__PURE__ */ React.createElement("span", { className: "tabular-nums" }, php(p.nc))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-mu" }, "Unfunded payables covered"), /* @__PURE__ */ React.createElement("span", { className: "tabular-nums" }, php(p.cov))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-mu" }, p.left > 0 ? "Still short" : "Left over"), /* @__PURE__ */ React.createElement("span", { className: "tabular-nums " + (p.left > 0 ? "text-neg" : "text-pos") }, php(p.left > 0 ? p.left : p.spare)))));
  })) : /* @__PURE__ */ React.createElement(Empty, { t: "No receivables are waiting." })));
}
function GoalRow({ g, openSheet }) {
  const { delGoal } = useApp(), [o, setO] = useState(false), pc = g.saved / g.target * 100, done = g.saved >= g.target;
  return /* @__PURE__ */ React.createElement(Glass, { className: "p-4 sm:p-5" }, /* @__PURE__ */ React.createElement("button", { className: "w-full text-left", "aria-expanded": o, onClick: () => setO(!o) }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold truncate" }, g.name), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-2 text-sm shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: done ? "text-pos" : "text-mu" }, done ? "Completed" : pct1(pc)), /* @__PURE__ */ React.createElement(Ic, { n: "chev", s: 18, cls: "text-mu transition-transform " + (o ? "rotate-180" : "") }))), /* @__PURE__ */ React.createElement("div", { className: "mt-3" }, /* @__PURE__ */ React.createElement(Bar, { lg: true, pct: pc })), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-xs text-mu mt-2 tabular-nums" }, /* @__PURE__ */ React.createElement("span", null, php(g.saved), " saved"), /* @__PURE__ */ React.createElement("span", null, php(g.target)))), o && /* @__PURE__ */ React.createElement("div", { className: "mt-4 space-y-3 fade" }, /* @__PURE__ */ React.createElement(Tile, { l: "Remaining", v: php(Math.max(0, q(g.target - g.saved))) }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-p !py-1.5 !px-3 !text-xs", disabled: done, onClick: () => openSheet({ k: "gmoney", item: g }) }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 14 }), "Add money"), /* @__PURE__ */ React.createElement("span", { className: "ml-auto" }, /* @__PURE__ */ React.createElement(OptionsMenu, { label: "Options for " + g.name, items: [
    { label: "Edit goal", icon: "pen", onClick: () => openSheet({ k: "goal", item: g }) },
    { label: "Delete goal", icon: "trash", danger: true, onClick: () => delGoal(g.id), confirm: { warn: g.saved > 0 ? "Deleting this goal releases its " + php(g.saved) + " back to your spendable balance." : "This goal will be removed.", yes: "Yes, delete" } }
  ] })))));
}
function GoalsPage({ openSheet }) {
  const { S, c } = useApp();
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement(Tile, { l: "Total saved", v: php(c.saved), tone: "text-ac" }), /* @__PURE__ */ React.createElement(Tile, { l: "Spendable balance", v: php(c.spendable), tone: c.spendable < 0 ? "text-neg" : "" })), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-mu" }, S.goals.length, " goal", S.goals.length === 1 ? "" : "s", " · ", pct1(c.saved / Math.max(c.target, 1) * 100), " overall"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-p !py-1.5 !text-xs", onClick: () => openSheet({ k: "goal", item: null }) }, /* @__PURE__ */ React.createElement(Ic, { n: "plus", s: 14 }), "New goal")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-3 items-start" }, S.goals.map((g) => /* @__PURE__ */ React.createElement(GoalRow, { key: g.id, g, openSheet }))), !S.goals.length && /* @__PURE__ */ React.createElement(Empty, { t: "No savings goals yet. Create one to start saving toward it." }));
}

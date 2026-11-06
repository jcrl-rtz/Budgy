const IC = {
  home: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  wallet: ["M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1", "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"],
  swap: ["M16 3l4 4-4 4", "M20 7H4", "M8 21l-4-4 4-4", "M4 17h16"],
  pie: ["M21.21 15.89A10 10 0 1 1 8 2.83", "M22 12A10 10 0 0 0 12 2v10z"],
  target: ["M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0", "M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0", "M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0"],
  gear: ["M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z", "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0"],
  plus: ["M5 12h14", "M12 5v14"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  pen: ["M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"],
  trash: ["M3 6h18", "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"],
  up: ["M22 7 13.5 15.5 8.5 10.5 2 17", "M16 7h6v6"],
  down: ["M22 17 13.5 8.5 8.5 13.5 2 7", "M16 17h6v-6"],
  clock: ["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0", "M12 6v6l4 2"],
  check: ["M20 6 9 17l-5-5"],
  bank: ["M3 22h18", "M6 18v-7", "M10 18v-7", "M14 18v-7", "M18 18v-7", "M12 2l8 5H4z"],
  cash: ["M2 6h20v12H2z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6", "M6 12h.01", "M18 12h.01"],
  phone: ["M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z", "M12 18h.01"],
  sun: ["M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M12 2v2", "M12 20v2", "m4.93 4.93 1.41 1.41", "m17.66 17.66 1.41 1.41", "M2 12h2", "M20 12h2", "m6.34 17.66-1.41 1.41", "m19.07 4.93-1.41 1.41"],
  moon: ["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"],
  monitor: ["M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z", "M8 21h8", "M12 17v4"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  user: ["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  sparkle: ["M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"],
  lock: ["M5 11h14v10H5z", "M8 11V7a4 4 0 0 1 8 0v4"],
  alert: ["M12 9v4", "M12 17h.01", "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"]
};
IC.more = ["M5 12h.01", "M12 12h.01", "M19 12h.01"];
IC.pin = ["M12 17v5", "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"];
IC.undo = ["M9 14 4 9l5-5", "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"];
IC.palette = ["M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z", "M13.5 6.5h.01", "M17.5 10.5h.01", "M6.5 12.5h.01", "M8.5 7.5h.01"];
IC.repeat = ["m17 2 4 4-4 4", "M3 11v-1a4 4 0 0 1 4-4h14", "m7 22-4-4 4-4", "M21 13v1a4 4 0 0 1-4 4H3"];
IC.mail = ["M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "m22 7-10 6L2 7"];
const Ic = ({ n, s = 20, cls = "" }) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", className: cls, "aria-hidden": "true" }, (IC[n] || []).map((d, i) => /* @__PURE__ */ React.createElement("path", { key: i, d })));
function OptionsMenu({ items, label = "Options" }) {
  const [pos, setPos] = useState(null), [ask, setAsk] = useState(null), btn = useRef(null), pop = useRef(null);
  const close = () => {
    setPos(null);
    setAsk(null);
  };
  const toggle = () => {
    if (pos) return close();
    const r = btn.current.getBoundingClientRect(), W = 232, vw = window.innerWidth, vh = window.innerHeight;
    const left = Math.max(8, Math.min(r.right - W, vw - W - 8)), up = vh - r.bottom < 210 && r.top > vh - r.bottom;
    setPos(up ? { left, bottom: vh - r.top + 6, up: true } : { left, top: r.bottom + 6 });
  };
  useEffect(() => {
    if (!pos) return;
    const down = (e) => {
      if (pop.current && pop.current.contains(e.target)) return;
      if (btn.current && btn.current.contains(e.target)) return;
      close();
    };
    const key = (e) => {
      if (e.key === "Escape") {
        close();
        if (btn.current) btn.current.focus();
      }
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    addEventListener("scroll", close, true);
    addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
      removeEventListener("scroll", close, true);
      removeEventListener("resize", close);
    };
  }, [pos]);
  const run = (it) => {
    if (it.confirm) return setAsk(it);
    close();
    it.onClick();
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { ref: btn, type: "button", className: "btn btn-i shrink-0", "aria-label": label, title: label, "aria-haspopup": "menu", "aria-expanded": !!pos, onClick: toggle }, /* @__PURE__ */ React.createElement(Ic, { n: "more", s: 20 })), pos && ReactDOM.createPortal(
    /* @__PURE__ */ React.createElement("div", { ref: pop, role: "menu", "aria-label": label, className: "opt-menu" + (pos.up ? " up" : ""), style: { left: pos.left, top: pos.top, bottom: pos.bottom } }, ask ? /* @__PURE__ */ React.createElement("div", { className: "p-2.5 space-y-2.5", role: "alert" }, /* @__PURE__ */ React.createElement("p", { className: "text-[13px] leading-snug text-neg" }, ask.confirm.warn), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn flex-1 !py-2 !text-[13px]", onClick: () => setAsk(null) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-d flex-1 !py-2 !text-[13px] !bg-neg !text-white", onClick: () => {
      const f = ask.onClick;
      close();
      f();
    } }, ask.confirm.yes || "Yes, delete"))) : items.filter(Boolean).map((it, i) => /* @__PURE__ */ React.createElement("button", { key: i, type: "button", role: "menuitem", onClick: () => run(it), className: "opt-i " + (it.danger ? "danger" : "") }, it.icon && /* @__PURE__ */ React.createElement(Ic, { n: it.icon, s: 17 }), /* @__PURE__ */ React.createElement("span", null, it.label)))),
    document.body
  ));
}
const GoogleG = () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 48 48", width: "18", height: "18", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { fill: "#EA4335", d: "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" }), /* @__PURE__ */ React.createElement("path", { fill: "#4285F4", d: "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" }), /* @__PURE__ */ React.createElement("path", { fill: "#FBBC05", d: "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" }), /* @__PURE__ */ React.createElement("path", { fill: "#34A853", d: "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" }));
const WTYPES = { Cash: { icon: "cash", plural: "Cash" }, Bank: { icon: "bank", plural: "Banks" }, "E-Wallet": { icon: "phone", plural: "E-Wallets" } };
const WORDER = ["Cash", "Bank", "E-Wallet"];
function BrandMark({ size = 40, className = "" }) {
  const id = "bm" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 64 64", width: size, height: size, className: "shrink-0 " + className, style: { filter: "drop-shadow(0 6px 10px rgb(60 34 18 / .34)) drop-shadow(0 1px 2px rgb(0 0 0 / .22))" }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: id + "p", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#ffffff" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#f1e8de" })), /* @__PURE__ */ React.createElement("linearGradient", { id: id + "b", gradientUnits: "userSpaceOnUse", x1: "0", y1: "12", x2: "0", y2: "50" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#a06a43" }), /* @__PURE__ */ React.createElement("stop", { offset: ".55", stopColor: "#6e4429" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#43261a" })), /* @__PURE__ */ React.createElement("linearGradient", { id: id + "c", x1: "0", y1: "0", x2: "1", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#e3b07c" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#b57a48" })), /* @__PURE__ */ React.createElement("filter", { id: id + "d", x: "-20%", y: "-20%", width: "140%", height: "150%" }, /* @__PURE__ */ React.createElement("feDropShadow", { dx: "0", dy: "1.2", stdDeviation: "1.1", floodColor: "#3b1f10", floodOpacity: ".28" }))), /* @__PURE__ */ React.createElement("rect", { width: "64", height: "64", rx: "14.4", fill: "url(#" + id + "p)" }), /* @__PURE__ */ React.createElement("rect", { x: "3.2", y: "3.2", width: "57.6", height: "57.6", rx: "11.6", fill: "none", stroke: "#7b4d30", strokeOpacity: ".22", strokeWidth: ".9" }), /* @__PURE__ */ React.createElement("rect", { x: ".5", y: ".5", width: "63", height: "63", rx: "13.9", fill: "none", stroke: "#7b4d30", strokeOpacity: ".16" }), /* @__PURE__ */ React.createElement("g", { filter: "url(#" + id + "d)", transform: "translate(-1.9 1)", fill: "url(#" + id + "b)", stroke: "url(#" + id + "b)" }, /* @__PURE__ */ React.createElement("rect", { x: "21.1", y: "12.4", width: "6.4", height: "37.1", rx: "3.2", stroke: "none" }), /* @__PURE__ */ React.createElement("circle", { cx: "33.9", cy: "36.7", r: "9.6", fill: "none", strokeWidth: "6.4" })), /* @__PURE__ */ React.createElement("circle", { cx: "47.6", cy: "16.6", r: "3.3", fill: "url(#" + id + "c)" }));
}
const Glass = ({ className = "", i = 0, style, children, as: T = "div", ...rest }) => /* @__PURE__ */ React.createElement(T, { className: "glass stitch rise " + className, style: { animationDelay: i * 60 + "ms", ...style }, ...rest }, children);
const Bar = ({ pct, gray, lg }) => /* @__PURE__ */ React.createElement("div", { className: "bar " + (gray ? "gray " : "") + (lg ? "lg" : "") }, /* @__PURE__ */ React.createElement("i", { style: { width: Math.min(100, Math.max(0, pct || 0)) + "%" } }));
function Num({ v }) {
  const [d, setD] = useState(v), r = useRef(v);
  useEffect(() => {
    const a = r.current, t0 = performance.now();
    let f;
    const still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) {
      r.current = v;
      setD(v);
      return;
    }
    const st = (t) => {
      const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3);
      r.current = k >= 1 ? v : a + (v - a) * e;
      setD(r.current);
      if (k < 1) f = requestAnimationFrame(st);
    };
    f = requestAnimationFrame(st);
    return () => cancelAnimationFrame(f);
  }, [v]);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, php(d));
}
const Field = ({ label, children, hint }) => /* @__PURE__ */ React.createElement("label", { className: "block text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "text-mu" }, label), /* @__PURE__ */ React.createElement("div", { className: "mt-1.5" }, children), hint && /* @__PURE__ */ React.createElement("span", { className: "block text-xs text-mu mt-1" }, hint));
const Err = ({ m }) => m ? /* @__PURE__ */ React.createElement("p", { className: "text-sm text-neg", role: "alert" }, m) : null;
function Donut({ data, center, sub, size = 190 }) {
  const Rc = window.Recharts, total = data.reduce((a, d) => a + d.value, 0);
  if (!total) return /* @__PURE__ */ React.createElement("div", { className: "grid place-items-center text-sm text-mu", style: { height: size } }, "Nothing to chart yet");
  if (!Rc) return /* @__PURE__ */ React.createElement("div", { className: "grid place-items-center text-sm text-mu", style: { height: size } }, "Chart library unavailable offline");
  const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } = Rc;
  return /* @__PURE__ */ React.createElement("div", { className: "relative w-full", style: { height: size } }, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: "100%" }, /* @__PURE__ */ React.createElement(PieChart, null, /* @__PURE__ */ React.createElement(Pie, { data, dataKey: "value", nameKey: "name", innerRadius: "66%", outerRadius: "94%", paddingAngle: data.length > 1 ? 3 : 0, cornerRadius: 6, stroke: "none", isAnimationActive: false }, data.map((d) => /* @__PURE__ */ React.createElement(Cell, { key: d.name, fill: d.color }))), /* @__PURE__ */ React.createElement(Tooltip, { formatter: (v) => php(v), contentStyle: { background: "rgb(var(--s1) / .92)", border: "1px solid rgb(var(--fg) / .14)", borderRadius: 12, color: "rgb(var(--fg))", fontSize: 12 }, itemStyle: { color: "rgb(var(--fg))" } }))), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 grid place-items-center pointer-events-none text-center" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-lg font-semibold tabular-nums" }, center), /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-mu" }, sub))));
}
const palette = (accent, n) => ["rgb(" + accent + ")", "#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#fb923c", "#94a3b8"].slice(0, Math.max(n, 1));
function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6", role: "dialog", "aria-modal": "true", "aria-label": title }, /* @__PURE__ */ React.createElement("div", { className: "scrim absolute inset-0 bg-black/50 fade", onClick: onClose }), /* @__PURE__ */ React.createElement("div", { className: "sheet glass glass-strong stitch relative w-full md:max-w-md rounded-b-none md:!rounded-3xl !rounded-t-[1.75rem] p-5 max-h-[90dvh] overflow-y-auto", style: { paddingBottom: "max(env(safe-area-inset-bottom), 20px)" } }, /* @__PURE__ */ React.createElement("div", { className: "md:hidden mx-auto -mt-1 mb-3 h-1 w-10 rounded-full bg-fg/25", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-semibold" }, title), /* @__PURE__ */ React.createElement("button", { className: "btn btn-i", onClick: onClose, "aria-label": "Close" }, /* @__PURE__ */ React.createElement(Ic, { n: "x", s: 16 }))), children));
}
function WalletSheet({ item, onClose }) {
  const { addWallet, updateWallet } = useApp();
  const [f, setF] = useState({ name: item ? item.name : "", type: item ? item.type : "Bank", balance: "" }), [m, setM] = useState("");
  const u = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = () => {
    if (!f.name.trim()) return setM("Enter a wallet name.");
    if (!item && f.balance !== "" && !money(f.balance)) return setM("Enter a balance of zero or more with at most two decimals.");
    if (item) updateWallet(item.id, { name: f.name.trim(), type: f.type });
    else addWallet({ name: f.name.trim(), type: f.type, balance: +f.balance || 0 });
    onClose();
  };
  return /* @__PURE__ */ React.createElement(Sheet, { title: item ? "Edit wallet" : "Add wallet", onClose }, /* @__PURE__ */ React.createElement("form", { className: "space-y-3", onSubmit: (e) => {
    e.preventDefault();
    save();
  } }, /* @__PURE__ */ React.createElement(Field, { label: "Name" }, /* @__PURE__ */ React.createElement("input", { className: "field", autoFocus: true, maxLength: 30, placeholder: "e.g. BPI Savings", value: f.name, onChange: u("name") })), /* @__PURE__ */ React.createElement(Field, { label: "Type" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-2" }, WORDER.map((t) => /* @__PURE__ */ React.createElement("button", { type: "button", key: t, onClick: () => setF({ ...f, type: t }), "aria-pressed": f.type === t, className: "btn flex-col !gap-1 !rounded-2xl !py-3 " + (f.type === t ? "btn-p" : "") }, /* @__PURE__ */ React.createElement(Ic, { n: WTYPES[t].icon, s: 18 }), /* @__PURE__ */ React.createElement("span", { className: "text-xs" }, t))))), !item && /* @__PURE__ */ React.createElement(Field, { label: "Opening balance (PHP)" }, /* @__PURE__ */ React.createElement("input", { className: "field", inputMode: "decimal", placeholder: "0.00", value: f.balance, onChange: u("balance") })), /* @__PURE__ */ React.createElement(Err, { m }), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-p w-full" }, item ? "Save changes" : "Add wallet")));
}
function WalletColorSheet({ item, onClose }) {
  const { S, updateWallet } = useApp(), w = S.wallets.find((x) => x.id === item.id) || item, cur = cleanColor(w.color);
  const pick = (hex) => updateWallet(w.id, { color: hex });
  return /* @__PURE__ */ React.createElement(Sheet, { title: "Color code", onClose }, /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3 flex items-center gap-3" }, /* @__PURE__ */ React.createElement("i", { className: "w-3.5 h-3.5 rounded-full shrink-0 border border-fg/15", style: { background: cur || "transparent" } }), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "font-semibold truncate" }, w.name), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-mu" }, cur ? "Colour " + cur : "No colour yet"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-5 gap-3", role: "radiogroup", "aria-label": "Wallet colour" }, WALLET_COLORS.map(([n, hex]) => /* @__PURE__ */ React.createElement("button", { key: hex, type: "button", role: "radio", "aria-checked": cur === hex, "aria-label": n, title: n, onClick: () => pick(hex), className: "aspect-square rounded-full grid place-items-center transition-transform active:scale-90", style: { background: hex, boxShadow: cur === hex ? "0 0 0 2px rgb(var(--s1)), 0 0 0 4px " + hex : "none" } }, cur === hex && /* @__PURE__ */ React.createElement("span", { className: "text-white" }, /* @__PURE__ */ React.createElement(Ic, { n: "check", s: 18 }))))), /* @__PURE__ */ React.createElement("label", { className: "flex items-center justify-between gap-3 text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "text-mu" }, "Custom colour"), /* @__PURE__ */ React.createElement("input", { type: "color", "aria-label": "Custom colour", value: cur || "#6366f1", onChange: (e) => pick(cleanColor(e.target.value)), className: "w-14 h-9 rounded-lg bg-transparent border border-fg/15 cursor-pointer p-0.5" })), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn flex-1", disabled: !cur, onClick: () => pick("") }, "No colour"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-p flex-1", onClick: onClose }, "Done"))));
}
function BalanceSheet({ item, onClose }) {
  const { c, updateWallet } = useApp(), cur = c.bal[item.id];
  const [v, setV] = useState(String(cur)), [m, setM] = useState("");
  const want = signed(v) ? +v : null, delta = want === null ? 0 : q(want - cur);
  const save = () => {
    if (want === null) return setM("Enter a balance with at most two decimals. Use a minus sign for an overdrawn wallet.");
    updateWallet(item.id, { balance: q(item.balance + (want - cur)) });
    onClose();
  };
  return /* @__PURE__ */ React.createElement(Sheet, { title: "Edit balance", onClose }, /* @__PURE__ */ React.createElement("form", { className: "space-y-3", onSubmit: (e) => {
    e.preventDefault();
    save();
  } }, /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3 flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "font-semibold truncate" }, item.name), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-mu" }, item.type)), /* @__PURE__ */ React.createElement("div", { className: "text-right" }, /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-mu" }, "Current"), /* @__PURE__ */ React.createElement("div", { className: "font-semibold tabular-nums" }, php(cur)))), /* @__PURE__ */ React.createElement(Field, { label: "New balance (PHP)" }, /* @__PURE__ */ React.createElement("input", { className: "field", autoFocus: true, inputMode: "decimal", placeholder: "0.00", value: v, onChange: (e) => setV(e.target.value) })), /* @__PURE__ */ React.createElement("p", { className: "text-sm tabular-nums " + (delta > 0 ? "text-pos" : delta < 0 ? "text-neg" : "text-mu") }, delta === 0 ? "No change" : "Adjustment: " + (delta > 0 ? "+" : "−") + php(Math.abs(delta))), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu" }, "This corrects the wallet to the amount you really have. Transactions already recorded are kept."), /* @__PURE__ */ React.createElement(Err, { m }), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-p w-full" }, "Save balance")));
}
function DeleteWalletSheet({ item, onClose }) {
  const { S, c, deleteWallet } = useApp();
  const nTx = S.tx.filter((x) => x.wallet === item.id || x.to === item.id).length;
  const nPay = S.debts.reduce((a, d) => a + (d.payments || []).filter((p) => p.wallet === item.id).length, 0);
  const last = S.wallets.length < 2;
  return /* @__PURE__ */ React.createElement(Sheet, { title: "Delete wallet", onClose }, /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "glass-tile p-3 flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "font-semibold truncate" }, item.name), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-mu" }, item.type)), /* @__PURE__ */ React.createElement("div", { className: "font-semibold tabular-nums" }, php(c.bal[item.id]))), last ? /* @__PURE__ */ React.createElement("p", { className: "text-sm text-mu" }, "You need at least one wallet, so this one can’t be deleted. Add another wallet first.") : /* @__PURE__ */ React.createElement("div", { className: "text-sm text-neg flex gap-2", role: "alert" }, /* @__PURE__ */ React.createElement(Ic, { n: "alert", s: 18, cls: "shrink-0 mt-0.5" }), /* @__PURE__ */ React.createElement("span", null, "This also deletes ", nTx, " transaction", nTx === 1 ? "" : "s", nPay ? " and " + nPay + " payment" + (nPay === 1 ? "" : "s") + " on payables and receivables" : "", " that used this wallet. Your total liquid cash drops by ", php(c.bal[item.id]), ". This can’t be undone.")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("button", { className: "btn flex-1", onClick: onClose }, "Keep it"), !last && /* @__PURE__ */ React.createElement("button", { className: "btn btn-d flex-1", onClick: () => {
    deleteWallet(item.id);
    onClose();
  } }, "Yes, delete"))));
}
function Auth() {
  const { auth, fbEnabled } = useApp();
  const [mode, setMode] = useState("login"), [f, setF] = useState({ name: "", email: "", pw: "" }), [m, setM] = useState({ t: "", ok: false }), [busy, setBusy] = useState(false);
  const u = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const login = mode === "login";
  const go = async (fn) => {
    setBusy(true);
    setM({ t: "" });
    const r = await fn();
    setBusy(false);
    if (r) setM({ t: r });
  };
  const reset = () => go(async () => {
    if (!f.email.trim()) return "Enter your email first.";
    const r = await auth.reset(f.email);
    if (r) return r;
    setM({ t: "If that email has an account, a reset link is on its way.", ok: true });
    return "";
  });
  return /* @__PURE__ */ React.createElement("div", { className: "auth-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "auth-card rise space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("div", { className: "auth-halo" }, /* @__PURE__ */ React.createElement(BrandMark, { size: 72 })), /* @__PURE__ */ React.createElement("h1", { className: "text-[26px] font-bold tracking-tight leading-tight" }, login ? "Welcome back" : "Create your account"), /* @__PURE__ */ React.createElement("p", { className: "text-[13px] text-mu mt-1" }, login ? "Log in to sync your budget everywhere." : "Back up and sync across all your devices.")), /* @__PURE__ */ React.createElement("div", { className: "auth-seg", role: "tablist" }, /* @__PURE__ */ React.createElement("i", { className: login ? "" : "r", "aria-hidden": "true" }), [["login", "Log in"], ["signup", "Sign up"]].map(([k, l]) => /* @__PURE__ */ React.createElement("button", { key: k, type: "button", role: "tab", "aria-selected": mode === k, onClick: () => {
    setMode(k);
    setM({ t: "" });
  } }, l))), !fbEnabled && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu flex gap-2" }, /* @__PURE__ */ React.createElement(Ic, { n: "alert", s: 16, cls: "shrink-0" }), "Cloud sign-in couldn’t load. Check your connection, or continue on this device only."), /* @__PURE__ */ React.createElement("form", { className: "space-y-2.5", onSubmit: (e) => {
    e.preventDefault();
    go(() => login ? auth.signIn(f.email, f.pw) : auth.signUp(f.name, f.email, f.pw));
  } }, !login && /* @__PURE__ */ React.createElement("div", { className: "auth-f" }, /* @__PURE__ */ React.createElement(Ic, { n: "user", s: 18 }), /* @__PURE__ */ React.createElement("input", { className: "field", placeholder: "Display name", autoComplete: "name", value: f.name, onChange: u("name") })), /* @__PURE__ */ React.createElement("div", { className: "auth-f" }, /* @__PURE__ */ React.createElement(Ic, { n: "mail", s: 18 }), /* @__PURE__ */ React.createElement("input", { className: "field", type: "email", autoComplete: "email", placeholder: "Email", value: f.email, onChange: u("email") })), /* @__PURE__ */ React.createElement("div", { className: "auth-f" }, /* @__PURE__ */ React.createElement(Ic, { n: "lock", s: 18 }), /* @__PURE__ */ React.createElement("input", { className: "field", type: "password", autoComplete: login ? "current-password" : "new-password", placeholder: login ? "Password" : "Password (6+ characters)", value: f.pw, onChange: u("pw") })), m.t && /* @__PURE__ */ React.createElement("p", { className: "text-sm " + (m.ok ? "text-pos" : "text-neg"), role: "alert" }, m.t), /* @__PURE__ */ React.createElement("button", { type: "submit", disabled: busy || !fbEnabled || !f.email || !f.pw, className: "btn btn-p auth-go" }, busy ? "Please wait…" : login ? "Log in" : "Create account")), /* @__PURE__ */ React.createElement("div", { className: "auth-or" }, "or"), /* @__PURE__ */ React.createElement("button", { disabled: busy || !fbEnabled, className: "btn w-full !py-3 !rounded-[1.1rem]", onClick: () => go(auth.google) }, /* @__PURE__ */ React.createElement(GoogleG, null), "Continue with Google"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center gap-1.5 pt-0.5" }, login && /* @__PURE__ */ React.createElement("button", { className: "text-[13px] text-mu hover:text-fg", onClick: reset }, "Forgot password?"), /* @__PURE__ */ React.createElement("button", { className: "text-[13px] text-mu hover:text-fg", onClick: auth.useGuest }, "Continue on this device only"))));
}
window.Auth = Auth;
console.log("Auth loaded", !!window.Auth);

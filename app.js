var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const NAV = [["home", "Home", "home"], ["wallets", "Wallets", "wallet"], ["pending", "Pending", "swap"], ["plan", "Allocate", "pie"], ["goals", "Goals", "target"]];
const NAV_KEYS = NAV.map((n) => n[0]);
function ownsHorizontal(el, stop) {
  for (; el && el !== stop; el = el.parentElement) {
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.dataset && el.dataset.noswipe != null) return true;
    if (el.scrollWidth > el.clientWidth + 2) {
      const ox = getComputedStyle(el).overflowX;
      if (ox === "auto" || ox === "scroll") return true;
    }
  }
  return false;
}
function useSwipeTabs(ref, on, view, go, enabled) {
  const st = useRef({}).current;
  st.view = view;
  st.go = go;
  st.enabled = enabled;
  useEffect(() => {
    const el = ref.current;
    if (!on || !el) return;
    const reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    const rest = (anim) => {
      el.style.transition = anim ? "transform .32s var(--ease-out), opacity .32s" : "none";
      el.style.transform = "";
      el.style.opacity = "";
      if (anim) setTimeout(() => {
        el.style.transition = "";
      }, 340);
      else requestAnimationFrame(() => {
        el.style.transition = "";
      });
    };
    const start = (e) => {
      st.t = null;
      if (e.touches.length !== 1 || !st.enabled) return;
      const i = NAV_KEYS.indexOf(st.view);
      if (i < 0 || ownsHorizontal(e.target, el)) return;
      st.t = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now(), lock: 0, i, raw: 0 };
    };
    const move = (e) => {
      const s = st.t;
      if (!s) return;
      const dx = e.touches[0].clientX - s.x, dy = e.touches[0].clientY - s.y;
      if (!s.lock) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        s.lock = Math.abs(dx) > Math.abs(dy) * 1.3 ? 1 : -1;
      }
      if (s.lock !== 1) return;
      s.raw = dx;
      if (reduce) return;
      const edge = dx > 0 && s.i === 0 || dx < 0 && s.i === NAV_KEYS.length - 1, d = dx * (edge ? 0.22 : 0.65);
      el.style.transition = "none";
      el.style.transform = "translate3d(" + d + "px,0,0)";
      el.style.opacity = String(1 - Math.min(Math.abs(d) / 460, 0.4));
    };
    const end = () => {
      const s = st.t;
      st.t = null;
      if (!s || s.lock !== 1) return;
      const dist = Math.abs(s.raw), fast = dist / Math.max(Date.now() - s.time, 1) > 0.5;
      const j = s.i + (s.raw < 0 ? 1 : -1), commit = (dist > 72 || dist > 32 && fast) && j >= 0 && j < NAV_KEYS.length;
      if (!commit) return rest(true);
      if (reduce) {
        rest(false);
        return st.go(NAV_KEYS[j]);
      }
      el.style.transition = "transform .14s ease-in, opacity .14s ease-in";
      el.style.transform = "translate3d(" + (s.raw < 0 ? -46 : 46) + "px,0,0)";
      el.style.opacity = "0";
      setTimeout(() => {
        rest(false);
        st.go(NAV_KEYS[j]);
      }, 130);
    };
    const cancel = () => {
      if (st.t && st.t.lock === 1) rest(true);
      st.t = null;
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: true });
    el.addEventListener("touchend", end, { passive: true });
    el.addEventListener("touchcancel", cancel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", cancel);
    };
  }, [on]);
}
function FitTitle({ text, max = 30, min = 18, lines = 2 }) {
  const ref = useRef(null), lastW = useRef(0);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    let s = max;
    el.style.fontSize = s + "px";
    while (s > min && el.scrollHeight > s * 1.16 * lines + 2) {
      s -= 1;
      el.style.fontSize = s + "px";
    }
  };
  React.useLayoutEffect(fit, [text, max, min, lines]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const run = () => {
      const w = el.clientWidth;
      if (w !== lastW.current) {
        lastW.current = w;
        fit();
      }
    };
    const ro = window.ResizeObserver ? new ResizeObserver(run) : null;
    if (ro) ro.observe(el);
    else addEventListener("resize", run);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    return () => {
      if (ro) ro.disconnect();
      else removeEventListener("resize", run);
    };
  }, []);
  return /* @__PURE__ */ React.createElement("h1", { ref, className: "font-semibold tracking-tight", style: { lineHeight: 1.16, textWrap: "balance", overflowWrap: "break-word", hyphens: "auto" } }, text);
}
function budgyRecoverNow() {
  const done = () => {
    try {
      location.replace(location.pathname + "?r=" + Date.now());
    } catch (e) {
      location.reload();
    }
  };
  try {
    if (window.budgyRecover) return window.budgyRecover();
    const jobs = [];
    if (window.caches) jobs.push(caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))));
    if (navigator.serviceWorker) jobs.push(navigator.serviceWorker.getRegistrations().then((rs) => Promise.all(rs.map((r) => r.unregister()))));
    Promise.all(jobs).then(done, done);
  } catch (e) {
    done();
  }
}
function Missing({ name, error }) {
  return /* @__PURE__ */ React.createElement("div", { role: "alert", style: { margin: "16px 0", padding: 16, borderRadius: 20, border: "1px solid rgba(161,98,58,.35)", background: "rgba(161,98,58,.08)", font: "14px/1.45 system-ui, sans-serif" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, marginBottom: 4 } }, error ? "This screen hit a problem." : "This screen did not load."), /* @__PURE__ */ React.createElement("div", { style: { opacity: 0.75, marginBottom: 12 } }, "Your budget is safe. Tap Reload to fetch the latest files", name ? " (" + name + ")" : "", "."), /* @__PURE__ */ React.createElement("button", { onClick: budgyRecoverNow, style: { padding: "8px 16px", borderRadius: 999, border: 0, background: "rgb(161,98,58)", color: "#fff", font: "inherit", fontWeight: 600, cursor: "pointer" } }, "Reload"), error ? /* @__PURE__ */ React.createElement("details", { style: { marginTop: 10, opacity: 0.6, fontSize: 12 } }, /* @__PURE__ */ React.createElement("summary", null, "Details"), /* @__PURE__ */ React.createElement("pre", { style: { whiteSpace: "pre-wrap" } }, String(error.stack || error))) : null);
}
class Guard extends React.Component {
  constructor() {
    super(...arguments);
    __publicField(this, "state", { e: null });
  }
  static getDerivedStateFromError(e) {
    return { e };
  }
  componentDidCatch(e) {
    try {
      console.error('Budgy: "' + (this.props.name || "?") + '" crashed', e);
    } catch (x) {
    }
  }
  render() {
    return this.state.e ? this.props.soft ? null : /* @__PURE__ */ React.createElement(Missing, { name: this.props.name, error: this.state.e }) : this.props.children;
  }
}
function Slot({ c: Comp, name, soft, ...props }) {
  const ok = typeof Comp === "function" || Comp && typeof Comp === "object" && Comp.$$typeof;
  if (!ok) return soft ? null : /* @__PURE__ */ React.createElement(Missing, { name });
  return /* @__PURE__ */ React.createElement(Guard, { name, soft }, /* @__PURE__ */ React.createElement(Comp, { ...props }));
}
function parts() {
  return {
    Auth: typeof Auth !== "undefined" ? Auth : null,
    Home: typeof Home !== "undefined" ? Home : null,
    Wallets: typeof Wallets !== "undefined" ? Wallets : null,
    Pending: typeof Pending !== "undefined" ? Pending : null,
    Allocate: typeof Allocate !== "undefined" ? Allocate : null,
    GoalsPage: typeof GoalsPage !== "undefined" ? GoalsPage : null,
    Settings: typeof Settings !== "undefined" ? Settings : null,
    Ic: typeof Ic !== "undefined" ? Ic : null,
    Avatar: typeof Avatar !== "undefined" ? Avatar : null,
    BrandMark: typeof BrandMark !== "undefined" ? BrandMark : null,
    SyncBadge: typeof SyncBadge !== "undefined" ? SyncBadge : null,
    FitTitle: typeof FitTitle !== "undefined" ? FitTitle : null,
    Toast: typeof Toast !== "undefined" ? Toast : null,
    QuickAddSheet: typeof QuickAddSheet !== "undefined" ? QuickAddSheet : null,
    WalletSheet: typeof WalletSheet !== "undefined" ? WalletSheet : null,
    BalanceSheet: typeof BalanceSheet !== "undefined" ? BalanceSheet : null,
    WalletColorSheet: typeof WalletColorSheet !== "undefined" ? WalletColorSheet : null,
    P2Sheets: typeof P2Sheets !== "undefined" ? P2Sheets : null,
    P3Sheets: typeof P3Sheets !== "undefined" ? P3Sheets : null,
    DataSheet: typeof DataSheet !== "undefined" ? DataSheet : null,
    ShortcutsSheet: typeof ShortcutsSheet !== "undefined" ? ShortcutsSheet : null,
    BackTapSheet: typeof BackTapSheet !== "undefined" ? BackTapSheet : null,
    DeleteWalletSheet: typeof DeleteWalletSheet !== "undefined" ? DeleteWalletSheet : null,
    Onboarding: typeof Onboarding !== "undefined" ? Onboarding : null
  };
}
const VEIL_MIN = 900;
function Veil({ fade, name }) {
  const P = parts();
  return /* @__PURE__ */ React.createElement("div", { className: "veil" + (fade ? " out" : ""), role: "status", "aria-live": "polite", "aria-label": "Loading your budget" }, /* @__PURE__ */ React.createElement("div", { className: "veil-in" }, /* @__PURE__ */ React.createElement("div", { className: "veil-logo" }, /* @__PURE__ */ React.createElement(Slot, { c: P.BrandMark, name: "BrandMark", soft: true, size: 64 })), /* @__PURE__ */ React.createElement("div", { className: "veil-title" }, name ? "Welcome back, " + name : "Getting your budget ready"), /* @__PURE__ */ React.createElement("div", { className: "veil-sub" }, "Syncing your wallets and plans…"), /* @__PURE__ */ React.createElement("div", { className: "veil-bar", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", null))));
}
function App() {
  const { S, c, ready: providerReady, user, guest, sync, addTx, delTx } = useApp();
  const P = parts();
  const [forced, setForced] = useState(false);
  const loading = !providerReady && !forced;
  const ready = !loading;
  useEffect(() => {
    console.log("App init status:", { authExists: typeof Auth !== "undefined", loadingState: loading });
    if (!loading) return;
    const t = setTimeout(() => {
      console.warn("Budgy: still loading after 3s, forcing loading=false");
      setForced(true);
    }, 3e3);
    return () => clearTimeout(t);
  }, [loading]);
  const [view, setView] = useState("home"), [sheet, setSheet] = useState(null), [toast, setToast] = useState(null);
  const openSheet = (s) => setSheet(s), closeSheet = () => setSheet(null);
  const [dir, setDir] = useState(0), swipe = useRef(null);
  const goto = (v) => {
    const a = NAV_KEYS.indexOf(view), b = NAV_KEYS.indexOf(v);
    setDir(a < 0 || b < 0 ? 0 : b > a ? 1 : -1);
    setView(v);
    window.scrollTo({ top: 0 });
  };
  useSwipeTabs(swipe, ready && (!!user || guest), view, goto, !sheet);
  useEffect(() => {
    const el = document.querySelector(".safe-top");
    if (!el) return;
    const f = () => el.classList.toggle("on", window.scrollY > 6);
    f();
    addEventListener("scroll", f, { passive: true });
    return () => removeEventListener("scroll", f);
  }, []);
  useEffect(() => {
    if (!ready || !user && !guest || user && sync !== "synced" && sync !== "error") return;
    const dl = takeDeepLink();
    if (dl) {
      const r = buildDeepTx(S, c, dl);
      setView("home");
      setSheet(null);
      if (!r.ok) setToast({ ok: false, msg: r.error });
      else {
        const id = addTx(r.tx), sign = r.tx.type === "income" ? "+" : "−";
        setToast({ ok: true, msg: (r.tx.type === "income" ? "Income added " : "Expense added ") + sign + php(r.tx.amount), sub: r.tx.category + " · " + r.walletName + (r.tx.note ? " · " + r.tx.note : ""), undo: () => delTx(id) });
      }
      return;
    }
    const sh = takeQuickAdd(S);
    if (sh) {
      setView(sh.k === "debt" ? "pending" : "home");
      setSheet(sh);
    }
  }, [ready, user, guest, sync]);
  const [veil, setVeil] = useState({ done: false, fade: false }), veilT0 = useRef(0), uid = user ? user.uid || "u" : "";
  const veilReady = !!user && (sync === "synced" || sync === "error");
  useEffect(() => {
    if (!user) {
      veilT0.current = 0;
      setVeil({ done: false, fade: false });
      return;
    }
    veilT0.current = Date.now();
  }, [uid]);
  useEffect(() => {
    if (!user || veil.done) return;
    const wait = veilReady ? Math.max(0, VEIL_MIN - (Date.now() - (veilT0.current || Date.now()))) : 7e3;
    const a = setTimeout(() => setVeil((v) => ({ ...v, fade: true })), wait), b = setTimeout(() => setVeil({ done: true, fade: true }), wait + 420);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [veilReady, uid, veil.done]);
  const veiled = !!user && !veil.done;
  if (!ready) return /* @__PURE__ */ React.createElement("div", { id: "boot" }, /* @__PURE__ */ React.createElement("span", null));
  if (!user && !guest) return /* @__PURE__ */ React.createElement(Slot, { c: P.Auth, name: "Auth" });
  const hr = (/* @__PURE__ */ new Date()).getHours(), greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  const title = view === "home" ? greet + ", " + (S.name.trim() || "there") : view === "settings" ? "Settings" : (NAV.find((n) => n[0] === view) || NAV[0])[1];
  const page = { home: /* @__PURE__ */ React.createElement(Slot, { c: P.Home, name: "Home", goto, openSheet }), wallets: /* @__PURE__ */ React.createElement(Slot, { c: P.Wallets, name: "Wallets", openSheet }), pending: /* @__PURE__ */ React.createElement(Slot, { c: P.Pending, name: "Pending", openSheet }), plan: /* @__PURE__ */ React.createElement(Slot, { c: P.Allocate, name: "Allocate", openSheet }), goals: /* @__PURE__ */ React.createElement(Slot, { c: P.GoalsPage, name: "GoalsPage", openSheet }), settings: /* @__PURE__ */ React.createElement(Slot, { c: P.Settings, name: "Settings", openSheet }) }[view];
  const fresh = !S.tx.length && !S.debts.length && !S.goals.length && S.wallets.length <= 1 && S.wallets.every((w) => !+w.balance);
  const settled = user ? sync === "synced" || sync === "error" : true;
  const guide = !S.seen && fresh && settled && !veiled && !sheet || sheet && sheet.k === "guide";
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-dvh" }, veiled && /* @__PURE__ */ React.createElement(Veil, { fade: veil.fade, name: (S.name || "").trim().split(" ")[0] }), /* @__PURE__ */ React.createElement("aside", { className: "hidden rail:flex rail-surface fixed left-0 top-0 bottom-0 z-30 w-20 xl:w-64 flex-col items-center xl:items-stretch gap-2 px-2 xl:px-4 pb-4 overflow-y-auto", style: { paddingTop: "max(env(safe-area-inset-top), 16px)" } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center xl:justify-start gap-2.5 px-1 py-2" }, /* @__PURE__ */ React.createElement(Slot, { c: P.BrandMark, name: "BrandMark", soft: true, size: 40 }), /* @__PURE__ */ React.createElement("span", { className: "hidden xl:inline text-lg font-bold tracking-tight" }, "Budgy")), /* @__PURE__ */ React.createElement("button", { className: "fab w-14 h-14 xl:w-full xl:h-14 xl:gap-2.5 xl:rounded-full mt-2 shrink-0", "aria-label": "Quick add", title: "Quick add", onClick: () => openSheet({ k: "quick" }) }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement(Slot, { c: P.Ic, name: "Ic", soft: true, n: "plus", s: 24 }), /* @__PURE__ */ React.createElement("span", { className: "hidden xl:inline text-sm font-semibold" }, "Quick Add"))), /* @__PURE__ */ React.createElement("nav", { className: "mt-4 w-full flex flex-col gap-1.5", "aria-label": "Main" }, NAV.map(([k, l, ic]) => {
    const on = view === k;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: k,
        title: l,
        "aria-label": l,
        "aria-current": on ? "page" : void 0,
        onClick: () => goto(k),
        className: "group w-full flex flex-col xl:flex-row items-center gap-1 xl:gap-3 py-1 xl:py-0 xl:h-14 xl:px-4 xl:rounded-full transition-colors " + (on ? "text-fg xl:bg-ac/20" : "text-mu hover:text-fg xl:hover:bg-fg/5")
      },
      /* @__PURE__ */ React.createElement("span", { className: "grid place-items-center h-8 w-14 xl:h-6 xl:w-6 rounded-full transition-colors " + (on ? "bg-ac/25 text-ac xl:bg-transparent" : "group-hover:bg-fg/10 xl:group-hover:bg-transparent") }, /* @__PURE__ */ React.createElement(Slot, { c: P.Ic, name: "Ic", soft: true, n: ic, s: 22 })),
      /* @__PURE__ */ React.createElement("span", { className: "text-[11px] xl:text-sm leading-none " + (on ? "font-bold" : "font-medium") }, l)
    );
  })), /* @__PURE__ */ React.createElement("div", { className: "mt-auto w-full pt-4 space-y-3 flex flex-col items-center xl:items-stretch" }, /* @__PURE__ */ React.createElement("button", { className: "w-full flex items-center justify-center xl:justify-start gap-3 rounded-2xl xl:rounded-full px-1.5 xl:px-2 py-1.5 hover:bg-fg/5 transition-colors text-left", title: "Profile and settings", "aria-label": "Profile and settings", onClick: () => goto("settings") }, /* @__PURE__ */ React.createElement(Slot, { c: P.Avatar, name: "Avatar", soft: true, size: 36 }), /* @__PURE__ */ React.createElement("span", { className: "hidden xl:block min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "block text-sm font-medium truncate" }, S.name.trim() || "Your profile"), /* @__PURE__ */ React.createElement("span", { className: "block text-[11px] text-mu" }, "Settings"))), /* @__PURE__ */ React.createElement("div", { className: "hidden xl:block px-1" }, /* @__PURE__ */ React.createElement(Slot, { c: P.SyncBadge, name: "SyncBadge", soft: true })))), /* @__PURE__ */ React.createElement("main", { className: "rail:ml-20 xl:ml-64 px-4 rail:px-6 xl:px-8 min-w-0 pb-36 rail:pb-10", style: { paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.75rem)" } }, /* @__PURE__ */ React.createElement("header", { className: "flex items-center justify-between gap-3 mb-5 rail:pt-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("button", { className: "rail:hidden shrink-0 rounded-full active:scale-95 transition-transform", style: { boxShadow: "var(--e2)" }, "aria-label": "Profile and settings", onClick: () => goto("settings") }, /* @__PURE__ */ React.createElement(Slot, { c: P.Avatar, name: "Avatar", soft: true, size: 44 })), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-ac font-medium leading-tight mb-0.5" }, (/* @__PURE__ */ new Date()).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })), /* @__PURE__ */ React.createElement(Slot, { c: P.FitTitle, name: "FitTitle", soft: true, text: title, max: 30, min: 18, lines: 2 }))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 shrink-0" }, /* @__PURE__ */ React.createElement(Slot, { c: P.SyncBadge, name: "SyncBadge", soft: true, short: true }), /* @__PURE__ */ React.createElement("button", { "aria-label": "Reports", title: "Reports", onClick: () => openSheet({ k: "report" }), className: "btn btn-i" }, /* @__PURE__ */ React.createElement(Slot, { c: P.Ic, name: "Ic", soft: true, n: "file", s: 18 })), /* @__PURE__ */ React.createElement("button", { "aria-label": "Settings", title: "Settings", onClick: () => goto("settings"), className: "btn btn-i " + (view === "settings" ? "!bg-ac/20 !text-ac !border-ac/30" : "") }, /* @__PURE__ */ React.createElement(Slot, { c: P.Ic, name: "Ic", soft: true, n: "gear", s: 18 })))), /* @__PURE__ */ React.createElement("div", { ref: swipe, className: "swipe-area" }, /* @__PURE__ */ React.createElement("div", { key: view, className: "page-in" + (dir > 0 ? " from-r" : dir < 0 ? " from-l" : "") }, page))), /* @__PURE__ */ React.createElement("button", { className: "rail:hidden fab fixed right-4 z-40 w-14 h-14", style: { bottom: "calc(env(safe-area-inset-bottom) + 98px)" }, "aria-label": "Quick add", onClick: () => openSheet({ k: "quick" }) }, /* @__PURE__ */ React.createElement(Slot, { c: P.Ic, name: "Ic", soft: true, n: "plus", s: 26 })), /* @__PURE__ */ React.createElement("nav", { className: "rail:hidden navbar pillnav fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2.5rem)] max-w-sm", style: { bottom: "calc(env(safe-area-inset-bottom) + 14px)", "--i": Math.max(0, NAV_KEYS.indexOf(view)), "--n": NAV.length }, "aria-label": "Main" }, /* @__PURE__ */ React.createElement("i", { className: "pillnav-i" + (NAV_KEYS.indexOf(view) < 0 ? " off" : ""), "aria-hidden": "true" }), NAV.map(([k, l, ic]) => {
    const on = view === k;
    return /* @__PURE__ */ React.createElement("button", { key: k, "aria-label": l, title: l, "aria-current": on ? "page" : void 0, onClick: () => goto(k), className: "pn-btn" + (on ? " on" : "") }, /* @__PURE__ */ React.createElement(Slot, { c: P.Ic, name: "Ic", soft: true, n: ic, s: 23 }));
  })), sheet && sheet.k === "quick" && /* @__PURE__ */ React.createElement(Slot, { c: P.QuickAddSheet, name: "QuickAddSheet", soft: true, onClose: closeSheet, openSheet }), sheet && sheet.k === "wallet" && /* @__PURE__ */ React.createElement(Slot, { c: P.WalletSheet, name: "WalletSheet", soft: true, item: sheet.item, onClose: closeSheet }), sheet && sheet.k === "balance" && /* @__PURE__ */ React.createElement(Slot, { c: P.BalanceSheet, name: "BalanceSheet", soft: true, item: sheet.item, onClose: closeSheet }), sheet && sheet.k === "color" && /* @__PURE__ */ React.createElement(Slot, { c: P.WalletColorSheet, name: "WalletColorSheet", soft: true, item: sheet.item, onClose: closeSheet }), sheet && /* @__PURE__ */ React.createElement(Slot, { c: P.P2Sheets, name: "P2Sheets", soft: true, sheet, onClose: closeSheet }), sheet && /* @__PURE__ */ React.createElement(Slot, { c: P.P3Sheets, name: "P3Sheets", soft: true, sheet, onClose: closeSheet, openSheet }), sheet && sheet.k === "data" && /* @__PURE__ */ React.createElement(Slot, { c: P.DataSheet, name: "DataSheet", soft: true, onClose: closeSheet }), sheet && sheet.k === "shortcuts" && /* @__PURE__ */ React.createElement(Slot, { c: P.ShortcutsSheet, name: "ShortcutsSheet", soft: true, onClose: closeSheet }), sheet && sheet.k === "backtap" && /* @__PURE__ */ React.createElement(Slot, { c: P.BackTapSheet, name: "BackTapSheet", soft: true, onClose: closeSheet }), /* @__PURE__ */ React.createElement(Slot, { c: P.Toast, name: "Toast", soft: true, t: toast, onClose: () => setToast(null) }), sheet && sheet.k === "delete" && /* @__PURE__ */ React.createElement(Slot, { c: P.DeleteWalletSheet, name: "DeleteWalletSheet", soft: true, item: sheet.item, onClose: closeSheet }), guide && /* @__PURE__ */ React.createElement(Slot, { c: P.Onboarding, name: "Onboarding", soft: true, onClose: closeSheet }));
}
window.App = App;
console.log("App loaded", !!window.App);
class Boundary extends React.Component {
  constructor() {
    super(...arguments);
    __publicField(this, "state", { e: null });
  }
  static getDerivedStateFromError(e) {
    return { e };
  }
  componentDidCatch(e) {
    try {
      console.error("Budgy crashed", e);
    } catch (x) {
    }
  }
  render() {
    if (!this.state.e) return this.props.children;
    return /* @__PURE__ */ React.createElement("div", { style: { padding: 20, maxWidth: 520, margin: "0 auto" } }, /* @__PURE__ */ React.createElement(Missing, { name: "app", error: this.state.e }));
  }
}
let mounted = false;
const mount = () => {
  if (mounted) return;
  mounted = true;
  const ready = typeof Provider !== "undefined" && typeof App !== "undefined";
  const tree = ready ? /* @__PURE__ */ React.createElement(Provider, null, /* @__PURE__ */ React.createElement(App, null), typeof UpdatePrompt !== "undefined" ? /* @__PURE__ */ React.createElement(Guard, { name: "UpdatePrompt", soft: true }, /* @__PURE__ */ React.createElement(UpdatePrompt, null)) : null) : /* @__PURE__ */ React.createElement("div", { style: { padding: 20, maxWidth: 520, margin: "0 auto" } }, /* @__PURE__ */ React.createElement(Missing, { name: typeof Provider === "undefined" ? "Provider" : "App" }));
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Boundary, null, tree));
  window.__budgyBooted = true;
};
console.log("App init status (mount):", { authExists: typeof Auth !== "undefined", fbReady: !!window.fb, loadingState: !window.__budgyBooted });
if (window.fb) mount();
else {
  addEventListener("fb-ready", mount, { once: true });
  setTimeout(mount, 8e3);
}
const safeSwInit = () => {
  try {
    if (typeof swInit === "function") swInit();
  } catch (e) {
  }
};
if (document.readyState === "complete") safeSwInit();
else addEventListener("load", safeSwInit);

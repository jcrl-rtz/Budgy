Object.assign(IC, {
  image: ["M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z", "M9 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0", "m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"]
});
const RC = {
  paper: "#ffffff",
  ink: "#1b1b1d",
  mute: "#6f6a66",
  line: "#c7c2bd",
  brown: "#5b3a26",
  neg: "#b3261e",
  font: "'Space Mono', 'Inconsolata', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace"
};
const R_W = 380;
const R_TEETH = 20;
const rEl = (tag, css, text, kids) => {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (text != null) e.textContent = text;
  (kids || []).forEach((k) => k && e.appendChild(k));
  return e;
};
const rRow = (left, right, css) => rEl("div", "display:flex;flex-direction:row;align-items:flex-start;justify-content:space-between;width:100%;" + (css || ""), null, [left, right]);
const rTxt = (text, size, lh, extra) => rEl("div", "font-size:" + size + "px;line-height:" + lh + "px;" + (extra || ""), text);
const rDash = (m) => rEl("div", "height:0;margin:" + m + ";border-top:2px dashed " + RC.line + ";");
const rMoney = (n) => (n < 0 ? "-" : "") + "PHP " + new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n));
function rTeeth(top) {
  const d = R_W / R_TEETH, a = d / Math.SQRT2;
  const row = rEl("div", "position:relative;width:" + R_W + "px;height:" + d / 2 + "px;overflow:hidden;");
  for (let i = 0; i < R_TEETH; i++) row.appendChild(rEl("div", "position:absolute;width:" + a + "px;height:" + a + "px;left:" + (i * d + d / 2 - a / 2) + "px;top:" + (top ? d / 2 - a / 2 : -a / 2) + "px;background-color:" + RC.paper + ";transform:rotate(45deg);"));
  return row;
}
function rBarcode(ref) {
  const bars = [];
  for (let i = 0; i < 48; i++) {
    const k = ref.charCodeAt(i % ref.length) + i * 7;
    bars.push(rEl("div", "flex:none;width:" + (1 + k % 4) + "px;height:100%;margin-right:" + (1 + (k >> 2) % 2) + "px;background-color:" + RC.ink + ";"));
  }
  return rEl("div", "display:flex;flex-direction:row;justify-content:center;height:46px;width:100%;overflow:hidden;", null, bars);
}
function buildReceipt(S, c) {
  const now = /* @__PURE__ */ new Date();
  const p2 = (n) => String(n).padStart(2, "0");
  const when = now.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
  const ref = "BDG-" + now.getFullYear() + p2(now.getMonth() + 1) + p2(now.getDate()) + "-" + p2(now.getHours()) + p2(now.getMinutes());
  const order = (w) => {
    const i = WORDER.indexOf(w.type);
    return i < 0 ? WORDER.length : i;
  };
  const wallets = S.wallets.map((w, i) => ({ w, i })).sort((a, b) => order(a.w) - order(b.w) || a.i - b.i).map((x) => x.w);
  const wrap = rEl("div", "position:absolute;left:-10000px;top:0;width:" + (R_W + 48) + "px;padding:24px;box-sizing:border-box;font-family:" + RC.font + ";font-weight:400;color:" + RC.ink + ";-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;");
  wrap.setAttribute("aria-hidden", "true");
  const paper = rEl("div", "width:" + R_W + "px;");
  paper.appendChild(rTeeth(true));
  const card = rEl("div", "box-sizing:border-box;width:" + R_W + "px;padding:14px 28px 20px;background-color:" + RC.paper + ";");
  const K = 0.625, gx = (x) => (21 + (x - 33.9) * K).toFixed(2) + "px", gy = (y) => (21 + (y - 30.95) * K).toFixed(2) + "px", gs = (v) => (v * K).toFixed(2) + "px";
  const stem = rEl("div", "position:absolute;left:" + gx(21.1) + ";top:" + gy(12.4) + ";width:" + gs(6.4) + ";height:" + gs(37.1) + ";border-radius:" + gs(3.2) + ";background-color:" + RC.brown + ";");
  const bowl = rEl("div", "position:absolute;box-sizing:border-box;left:" + gx(21.1) + ";top:" + gy(36.7 - 12.8) + ";width:" + gs(25.6) + ";height:" + gs(25.6) + ";border-radius:50%;border:" + gs(6.4) + " solid " + RC.brown + ";");
  const logo = rEl("div", "position:relative;flex:none;box-sizing:border-box;width:46px;height:46px;border-radius:23px;border:2px solid " + RC.brown + ";margin:0 auto;", null, [stem, bowl]);
  card.appendChild(rEl("div", "display:flex;flex-direction:column;align-items:center;width:100%;", null, [
    logo,
    rTxt("BUDGY", 20, 28, "margin-top:8px;font-weight:700;text-align:center;width:100%;"),
    rTxt("BALANCE RECEIPT", 11, 16, "color:" + RC.mute + ";text-align:center;width:100%;")
  ]));
  card.appendChild(rDash("14px 0 10px"));
  const meta = (label, value, extra) => rRow(rTxt(label, 12, 20, "color:" + RC.mute + ";flex:none;"), rTxt(value, 12, 20, "text-align:right;margin-left:14px;min-width:0;" + (extra || "")));
  card.appendChild(rEl("div", "width:100%;", null, [
    meta("DATE", when, "white-space:nowrap;"),
    S.name ? meta("FOR", S.name, "word-break:break-word;") : null,
    meta("REF", ref, "white-space:nowrap;")
  ]));
  card.appendChild(rDash("10px 0 8px"));
  card.appendChild(rRow(rTxt("WALLET", 11, 16, "color:" + RC.mute + ";"), rTxt("AMOUNT", 11, 16, "color:" + RC.mute + ";text-align:right;"), "margin-bottom:2px;"));
  const list = rEl("div", "width:100%;");
  wallets.forEach((w) => {
    const bal = c.bal[w.id], neg = bal < 0;
    const left = rEl("div", "flex:1 1 auto;min-width:0;margin-right:12px;", null, [
      rTxt(w.name, 13, 20, "font-weight:700;word-break:break-word;"),
      rTxt(String(w.type || "wallet").toUpperCase(), 10, 14, "color:" + RC.mute + ";")
    ]);
    const right = rTxt(rMoney(bal), 13, 20, "flex:none;font-weight:700;text-align:right;white-space:nowrap;color:" + (neg ? RC.neg : RC.ink) + ";");
    list.appendChild(rRow(left, right, "padding:7px 0;"));
  });
  card.appendChild(list);
  card.appendChild(rDash("6px 0 12px"));
  card.appendChild(rEl("div", "height:0;border-top:2px solid " + RC.ink + ";margin-bottom:10px;"));
  card.appendChild(rRow(rTxt("TOTAL CASH", 16, 26, "font-weight:700;flex:none;"), rTxt(rMoney(c.liquid), 16, 26, "font-weight:700;text-align:right;white-space:nowrap;margin-left:12px;color:" + (c.liquid < 0 ? RC.neg : RC.ink) + ";")));
  card.appendChild(rTxt(wallets.length + " wallet" + (wallets.length === 1 ? "" : "s"), 11, 16, "color:" + RC.mute + ";"));
  card.appendChild(rEl("div", "height:0;border-top:2px solid " + RC.ink + ";margin-top:12px;"));
  card.appendChild(rEl("div", "margin-top:16px;width:100%;", null, [rBarcode(ref), rTxt(ref, 10, 16, "margin-top:6px;text-align:center;width:100%;color:" + RC.mute + ";")]));
  card.appendChild(rEl("div", "margin-top:14px;width:100%;", null, [
    rTxt("THANK YOU FOR BUDGETING WISELY", 11, 16, "font-weight:700;text-align:center;width:100%;"),
    rTxt("Made with Budgy", 10, 16, "margin-top:2px;text-align:center;width:100%;color:" + RC.brown + ";")
  ]));
  paper.appendChild(card);
  paper.appendChild(rTeeth(false));
  card.style.boxShadow = "0 8px 22px rgba(30,20,12,0.14)";
  wrap.appendChild(paper);
  return wrap;
}
async function loadReceiptFonts() {
  if (!document.fonts || !document.fonts.load) return;
  const sample = "BUDGY 0123456789 PHP ,.-: BALANCE RECEIPT abcdefghijklmnopqrstuvwxyz";
  try {
    await Promise.all(["400", "700"].map((w) => document.fonts.load(w + ' 16px "Space Mono"', sample)));
    if (document.fonts.ready) await document.fonts.ready;
  } catch (e) {
  }
}
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
async function renderReceiptBlob(S, c) {
  if (!window.html2canvas) throw new Error("The image tool has not loaded yet. Check your connection, then try again.");
  await loadReceiptFonts();
  const node = buildReceipt(S, c);
  document.body.appendChild(node);
  try {
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
      }
    }
    await nextFrame();
    await nextFrame();
    const w = Math.ceil(node.offsetWidth), h = Math.ceil(node.offsetHeight);
    let scale = Math.max(3, Math.min(4, Math.ceil(window.devicePixelRatio || 1)));
    while (w * scale * h * scale > 14e6 && scale > 2) scale--;
    const canvas = await window.html2canvas(node, {
      backgroundColor: null,
      scale,
      useCORS: true,
      logging: false,
      width: w,
      height: h,
      windowWidth: w + 48,
      windowHeight: h + 48,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      onclone: (doc) => {
        doc.documentElement.style.cssText += ";zoom:1;-webkit-text-size-adjust:100%;";
        doc.body.style.cssText += ";margin:0;transform:none;";
      }
    });
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    if (!blob) throw new Error("Could not create the image. Please try again.");
    return blob;
  } finally {
    node.remove();
  }
}
const receiptName = () => "budgy-balances-" + off(0) + ".png";
function ReceiptPreview({ blob, url, onClose }) {
  const [msg, setMsg] = useState({ ok: true, t: "" });
  const file = React.useMemo(() => {
    try {
      return new File([blob], receiptName(), { type: "image/png" });
    } catch (e) {
      return null;
    }
  }, [blob]);
  const canShare = !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] }));
  const download = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = receiptName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMsg({ ok: true, t: "Saved to your downloads." });
  };
  const share = async () => {
    try {
      await navigator.share({ files: [file], title: "Budgy balance receipt" });
      setMsg({ ok: true, t: "" });
    } catch (e) {
      if (!e || e.name !== "AbortError") setMsg({ ok: false, t: "Could not open the share sheet. Try Download instead." });
    }
  };
  return ReactDOM.createPortal(
    /* @__PURE__ */ React.createElement(Sheet, { title: "Receipt Preview", onClose }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-mu -mt-2 mb-3" }, "Check your receipt, then save or share it."), /* @__PURE__ */ React.createElement("div", { className: "rounded-[1.25rem] p-2.5 overflow-y-auto", style: { maxHeight: "52dvh", background: "rgb(var(--s2) / .55)", border: "1px solid rgb(var(--fg) / .08)", boxShadow: "inset 0 1px 3px rgb(0 0 0 / .14)", WebkitOverflowScrolling: "touch" } }, /* @__PURE__ */ React.createElement("img", { src: url, alt: "Preview of your balance receipt", className: "block w-full h-auto select-none", draggable: "false" })), msg.t && /* @__PURE__ */ React.createElement("p", { role: "status", className: "text-xs mt-2.5 text-center " + (msg.ok ? "text-mu" : "text-neg") }, msg.t), /* @__PURE__ */ React.createElement("div", { className: "grid gap-2.5 mt-4 " + (canShare ? "grid-cols-2" : "grid-cols-1") }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-p !py-3 !rounded-[1.1rem]", onClick: download }, /* @__PURE__ */ React.createElement(Ic, { n: "down", s: 16 }), "Download Image"), canShare && /* @__PURE__ */ React.createElement("button", { className: "btn !py-3 !rounded-[1.1rem]", onClick: share }, /* @__PURE__ */ React.createElement(Ic, { n: "up", s: 16 }), "Share")), /* @__PURE__ */ React.createElement("button", { className: "w-full mt-2 py-2.5 text-sm font-semibold text-mu hover:text-fg transition-colors", onClick: onClose }, "Close")),
    document.body
  );
}
function ReceiptButton() {
  const { S, c } = useApp();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ ok: true, t: "" });
  const [prev, setPrev] = useState(null);
  const run = async () => {
    if (busy) return;
    setBusy(true);
    setMsg({ ok: true, t: "" });
    try {
      const blob = await renderReceiptBlob(S, c);
      setPrev({ blob, url: URL.createObjectURL(blob) });
    } catch (e) {
      setMsg({ ok: false, t: e && e.message || "Could not export the receipt. Please try again." });
      setTimeout(() => setMsg((m) => m.t ? { ok: true, t: "" } : m), 5e3);
    }
    setBusy(false);
  };
  const close = () => {
    if (prev) URL.revokeObjectURL(prev.url);
    setPrev(null);
  };
  useEffect(() => () => {
    if (prev) URL.revokeObjectURL(prev.url);
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, msg.t && /* @__PURE__ */ React.createElement("span", { role: "status", className: "text-xs " + (msg.ok ? "text-mu" : "text-neg") }, msg.t), /* @__PURE__ */ React.createElement("button", { className: "btn", onClick: run, disabled: busy, "aria-label": "Preview balances as a PNG receipt" }, /* @__PURE__ */ React.createElement(Ic, { n: "image", s: 16 }), busy ? "Preparing..." : "Share Balances"), prev && /* @__PURE__ */ React.createElement(ReceiptPreview, { blob: prev.blob, url: prev.url, onClose: close }));
}

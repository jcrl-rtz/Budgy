/* =====================================================================
   receipt.js  (v6 Phase 1.5: white paper receipt, Space Mono, baseline-aligned rows, preview modal)
   "Share Balances" button -> renders the receipt PNG in the background -> opens a Receipt Preview modal (Download / Share / Close).
   Builds a temporary, off-screen DOM receipt (inline styles only, so html2canvas
   renders it the same on every device), captures it as a PNG and downloads it.
   Loaded after io.js and before shortcuts.js / app.js. Shares the global scope.
   Needs the html2canvas CDN script in index.html.
   ===================================================================== */
Object.assign(IC, {
  image: ['M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z', 'M9 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0', 'm21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21']
})

// White paper receipt (fixed hex values; it looks the same in light and dark mode).
// Space Mono (400 + 700) is loaded by index.html. loadReceiptFonts() waits for it before html2canvas runs, so text is measured and painted
// with the same glyphs. If the font cannot load (offline), the stack falls back to the system monospace and the layout still holds,
// because every row uses fixed line-heights and the label and value in a row share one font size (identical baselines).
const RC = {
  paper: '#ffffff', ink: '#1b1b1d', mute: '#6f6a66', line: '#c7c2bd', brown: '#5b3a26', neg: '#b3261e',
  font: "'Space Mono', 'Inconsolata', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace"
}
const R_W = 380 // paper width in CSS px (the snapshot is always taken at this fixed size)
const R_TEETH = 20 // zig-zag teeth across the top and bottom edge (380 / 20 = 19px each)

// Tiny element builder: text always goes in as textContent, so wallet names can never inject markup.
const rEl = (tag, css, text, kids) => {
  const e = document.createElement(tag)
  if (css) e.style.cssText = css
  if (text != null) e.textContent = text
  ;(kids || []).forEach((k) => k && e.appendChild(k))
  return e
}
// Same-size rows built from block elements with fixed line-heights: html2canvas places text by line box, so we never
// rely on flex vertical centring, letter-spacing on right-aligned text, or text-transform (all of which shift text in the PNG).
const rRow = (left, right, css) => rEl('div', 'display:flex;flex-direction:row;align-items:flex-start;justify-content:space-between;width:100%;' + (css || ''), null, [left, right])
// One text cell. Label and value of the same row are given the SAME size and line-height so their baselines line up exactly.
const rTxt = (text, size, lh, extra) => rEl('div', 'font-size:' + size + 'px;line-height:' + lh + 'px;' + (extra || ''), text)
// Dashed divider drawn as a real border (crisp at any scale).
const rDash = (m) => rEl('div', 'height:0;margin:' + m + ';border-top:2px dashed ' + RC.line + ';')
// Plain-text money for the paper ("PHP 1,234.00"): avoids the peso glyph, which many monospace fonts lack (it would fall back to another font and shift the digits).
const rMoney = (n) => (n < 0 ? '-' : '') + 'PHP ' + new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))
// Zig-zag paper edge made of 45-degree squares (each shows one triangle). top=true builds the upper edge, false the lower edge.
function rTeeth(top) {
  const d = R_W / R_TEETH, a = d / Math.SQRT2
  const row = rEl('div', 'position:relative;width:' + R_W + 'px;height:' + d / 2 + 'px;overflow:hidden;')
  for (let i = 0; i < R_TEETH; i++) row.appendChild(rEl('div', 'position:absolute;width:' + a + 'px;height:' + a + 'px;left:' + (i * d + d / 2 - a / 2) + 'px;top:' + (top ? d / 2 - a / 2 : -a / 2) + 'px;background-color:' + RC.paper + ';transform:rotate(45deg);'))
  return row
}
// Barcode drawn from the reference number, so every receipt gets its own (deterministic) pattern.
function rBarcode(ref) {
  const bars = []
  for (let i = 0; i < 48; i++) { const k = ref.charCodeAt(i % ref.length) + i * 7; bars.push(rEl('div', 'flex:none;width:' + (1 + (k % 4)) + 'px;height:100%;margin-right:' + (1 + ((k >> 2) % 2)) + 'px;background-color:' + RC.ink + ';')) }
  return rEl('div', 'display:flex;flex-direction:row;justify-content:center;height:46px;width:100%;overflow:hidden;', null, bars)
}

function buildReceipt(S, c) {
  const now = new Date()
  const p2 = (n) => String(n).padStart(2, '0')
  const when = now.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
  const ref = 'BDG-' + now.getFullYear() + p2(now.getMonth() + 1) + p2(now.getDate()) + '-' + p2(now.getHours()) + p2(now.getMinutes())
  const order = (w) => { const i = WORDER.indexOf(w.type); return i < 0 ? WORDER.length : i }
  const wallets = S.wallets.map((w, i) => ({ w, i })).sort((a, b) => order(a.w) - order(b.w) || a.i - b.i).map((x) => x.w)

  // Fixed-size transparent wrapper (room for the shadow). Off-screen but NOT display:none.
  const wrap = rEl('div', 'position:absolute;left:-10000px;top:0;width:' + (R_W + 48) + 'px;padding:24px;box-sizing:border-box;font-family:' + RC.font + ';font-weight:400;color:' + RC.ink + ';-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;')
  wrap.setAttribute('aria-hidden', 'true')
  const paper = rEl('div', 'width:' + R_W + 'px;')
  paper.appendChild(rTeeth(true))
  const card = rEl('div', 'box-sizing:border-box;width:' + R_W + 'px;padding:14px 28px 20px;background-color:' + RC.paper + ';')

  // Header: brown ring logo, wordmark, subtitle (all centred, no letter-spacing so they are truly centred in the PNG).
  // The ring and the "b" are plain absolutely-positioned boxes (no text), so html2canvas cannot shift the glyph. Geometry = BrandMark's "b" (64-unit grid),
  // scaled by K and centred on the ring's inner centre (21,21 inside a 46px border-box ring with a 2px border).
  const K = 0.625, gx = (x) => (21 + (x - 33.9) * K).toFixed(2) + 'px', gy = (y) => (21 + (y - 30.95) * K).toFixed(2) + 'px', gs = (v) => (v * K).toFixed(2) + 'px'
  const stem = rEl('div', 'position:absolute;left:' + gx(21.1) + ';top:' + gy(12.4) + ';width:' + gs(6.4) + ';height:' + gs(37.1) + ';border-radius:' + gs(3.2) + ';background-color:' + RC.brown + ';')
  const bowl = rEl('div', 'position:absolute;box-sizing:border-box;left:' + gx(21.1) + ';top:' + gy(36.7 - 12.8) + ';width:' + gs(25.6) + ';height:' + gs(25.6) + ';border-radius:50%;border:' + gs(6.4) + ' solid ' + RC.brown + ';')
  const logo = rEl('div', 'position:relative;flex:none;box-sizing:border-box;width:46px;height:46px;border-radius:23px;border:2px solid ' + RC.brown + ';margin:0 auto;', null, [stem, bowl])
  card.appendChild(rEl('div', 'display:flex;flex-direction:column;align-items:center;width:100%;', null, [
    logo,
    rTxt('BUDGY', 20, 28, 'margin-top:8px;font-weight:700;text-align:center;width:100%;'),
    rTxt('BALANCE RECEIPT', 11, 16, 'color:' + RC.mute + ';text-align:center;width:100%;')
  ]))
  card.appendChild(rDash('14px 0 10px'))

  // Meta: label and value share one size and line-height, so each row sits on a single baseline.
  const meta = (label, value, extra) => rRow(rTxt(label, 12, 20, 'color:' + RC.mute + ';flex:none;'), rTxt(value, 12, 20, 'text-align:right;margin-left:14px;min-width:0;' + (extra || '')))
  card.appendChild(rEl('div', 'width:100%;', null, [
    meta('DATE', when, 'white-space:nowrap;'),
    S.name ? meta('FOR', S.name, 'word-break:break-word;') : null,
    meta('REF', ref, 'white-space:nowrap;')
  ]))
  card.appendChild(rDash('10px 0 8px'))

  // Column heads, then one row per wallet: name and amount are the same size, so the amount's baseline equals the name's.
  card.appendChild(rRow(rTxt('WALLET', 11, 16, 'color:' + RC.mute + ';'), rTxt('AMOUNT', 11, 16, 'color:' + RC.mute + ';text-align:right;'), 'margin-bottom:2px;'))
  const list = rEl('div', 'width:100%;')
  wallets.forEach((w) => {
    const bal = c.bal[w.id], neg = bal < 0
    const left = rEl('div', 'flex:1 1 auto;min-width:0;margin-right:12px;', null, [
      rTxt(w.name, 13, 20, 'font-weight:700;word-break:break-word;'),
      rTxt(String(w.type || 'wallet').toUpperCase(), 10, 14, 'color:' + RC.mute + ';')
    ])
    const right = rTxt(rMoney(bal), 13, 20, 'flex:none;font-weight:700;text-align:right;white-space:nowrap;color:' + (neg ? RC.neg : RC.ink) + ';')
    list.appendChild(rRow(left, right, 'padding:7px 0;'))
  })
  card.appendChild(list)
  card.appendChild(rDash('6px 0 12px'))

  // Total: two solid rules like a till receipt; label and amount share one size.
  card.appendChild(rEl('div', 'height:0;border-top:2px solid ' + RC.ink + ';margin-bottom:10px;'))
  card.appendChild(rRow(rTxt('TOTAL CASH', 16, 26, 'font-weight:700;flex:none;'), rTxt(rMoney(c.liquid), 16, 26, 'font-weight:700;text-align:right;white-space:nowrap;margin-left:12px;color:' + (c.liquid < 0 ? RC.neg : RC.ink) + ';')))
  card.appendChild(rTxt(wallets.length + ' wallet' + (wallets.length === 1 ? '' : 's'), 11, 16, 'color:' + RC.mute + ';'))
  card.appendChild(rEl('div', 'height:0;border-top:2px solid ' + RC.ink + ';margin-top:12px;'))

  // Barcode + footer
  card.appendChild(rEl('div', 'margin-top:16px;width:100%;', null, [rBarcode(ref), rTxt(ref, 10, 16, 'margin-top:6px;text-align:center;width:100%;color:' + RC.mute + ';')]))
  card.appendChild(rEl('div', 'margin-top:14px;width:100%;', null, [
    rTxt('THANK YOU FOR BUDGETING WISELY', 11, 16, 'font-weight:700;text-align:center;width:100%;'),
    rTxt('Made with Budgy', 10, 16, 'margin-top:2px;text-align:center;width:100%;color:' + RC.brown + ';')
  ]))

  paper.appendChild(card)
  paper.appendChild(rTeeth(false))
  card.style.boxShadow = '0 8px 22px rgba(30,20,12,0.14)'
  wrap.appendChild(paper)
  return wrap
}

// Load the exact font weights used by the receipt before capturing, so text is measured and painted with the same glyphs.
// html2canvas is only started after this resolves (see renderReceiptBlob).
async function loadReceiptFonts() {
  if (!document.fonts || !document.fonts.load) return
  const sample = 'BUDGY 0123456789 PHP ,.-: BALANCE RECEIPT abcdefghijklmnopqrstuvwxyz'
  try {
    await Promise.all(['400', '700'].map((w) => document.fonts.load(w + ' 16px "Space Mono"', sample)))
    if (document.fonts.ready) await document.fonts.ready
  } catch (e) { /* fall back to the system monospace stack; layout still holds because every row has fixed line-heights */ }
}
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()))

// Renders the receipt off-screen with html2canvas and resolves to a PNG Blob. It never downloads or shares anything by itself.
async function renderReceiptBlob(S, c) {
  if (!window.html2canvas) throw new Error('The image tool has not loaded yet. Check your connection, then try again.')
  await loadReceiptFonts() // html2canvas only starts once Space Mono is ready
  const node = buildReceipt(S, c)
  document.body.appendChild(node)
  try {
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready } catch (e) {} }
    await nextFrame(); await nextFrame() // let layout settle before measuring
    const w = Math.ceil(node.offsetWidth), h = Math.ceil(node.offsetHeight)
    // Crisp on phones: use at least 3x (4x on very dense screens), but keep the canvas under the mobile limit (~16M px).
    let scale = Math.max(3, Math.min(4, Math.ceil(window.devicePixelRatio || 1)))
    while (w * scale * h * scale > 14e6 && scale > 2) scale--
    const canvas = await window.html2canvas(node, {
      backgroundColor: null, scale, useCORS: true, logging: false,
      width: w, height: h, windowWidth: w + 48, windowHeight: h + 48, scrollX: 0, scrollY: 0, x: 0, y: 0,
      onclone: (doc) => { // the clone is rendered with no page scroll or zoom, so nothing can shift while capturing
        doc.documentElement.style.cssText += ';zoom:1;-webkit-text-size-adjust:100%;'
        doc.body.style.cssText += ';margin:0;transform:none;'
      }
    })
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'))
    if (!blob) throw new Error('Could not create the image. Please try again.')
    return blob
  } finally {
    node.remove()
  }
}

const receiptName = () => 'budgy-balances-' + off(0) + '.png'

/* ---------- Receipt Preview modal ---------- */
// Shows the finished PNG so the person can check the design and alignment, then Download, Share or Close.
// Share appears only where the browser can share image files (Web Share API level 2); otherwise Download takes the full width.
function ReceiptPreview({ blob, url, onClose }) {
  const [msg, setMsg] = useState({ ok: true, t: '' })
  const file = React.useMemo(() => { try { return new File([blob], receiptName(), { type: 'image/png' }) } catch (e) { return null } }, [blob])
  const canShare = !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] }))
  const download = () => {
    const a = document.createElement('a')
    a.href = url; a.download = receiptName()
    document.body.appendChild(a); a.click(); a.remove()
    setMsg({ ok: true, t: 'Saved to your downloads.' })
  }
  const share = async () => {
    try { await navigator.share({ files: [file], title: 'Budgy balance receipt' }); setMsg({ ok: true, t: '' }) }
    catch (e) { if (!e || e.name !== 'AbortError') setMsg({ ok: false, t: 'Could not open the share sheet. Try Download instead.' }) } // AbortError = the person cancelled
  }
  return ReactDOM.createPortal(
    <Sheet title="Receipt Preview" onClose={onClose}>
      <p className="text-xs text-mu -mt-2 mb-3">Check your receipt, then save or share it.</p>
      <div className="rounded-[1.25rem] p-2.5 overflow-y-auto" style={{ maxHeight: '52dvh', background: 'rgb(var(--s2) / .55)', border: '1px solid rgb(var(--fg) / .08)', boxShadow: 'inset 0 1px 3px rgb(0 0 0 / .14)', WebkitOverflowScrolling: 'touch' }}>
        <img src={url} alt="Preview of your balance receipt" className="block w-full h-auto select-none" draggable="false" />
      </div>
      {msg.t && <p role="status" className={'text-xs mt-2.5 text-center ' + (msg.ok ? 'text-mu' : 'text-neg')}>{msg.t}</p>}
      <div className={'grid gap-2.5 mt-4 ' + (canShare ? 'grid-cols-2' : 'grid-cols-1')}>
        <button className="btn btn-p !py-3 !rounded-[1.1rem]" onClick={download}><Ic n="down" s={16} />Download Image</button>
        {canShare && <button className="btn !py-3 !rounded-[1.1rem]" onClick={share}><Ic n="up" s={16} />Share</button>}
      </div>
      <button className="w-full mt-2 py-2.5 text-sm font-semibold text-mu hover:text-fg transition-colors" onClick={onClose}>Close</button>
    </Sheet>,
    document.body
  )
}

function ReceiptButton() {
  const { S, c } = useApp()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState({ ok: true, t: '' })
  const [prev, setPrev] = useState(null) // { blob, url } while the preview modal is open
  const run = async () => {
    if (busy) return
    setBusy(true); setMsg({ ok: true, t: '' })
    try {
      const blob = await renderReceiptBlob(S, c)
      setPrev({ blob, url: URL.createObjectURL(blob) }) // opens the modal; nothing is downloaded yet
    } catch (e) {
      setMsg({ ok: false, t: (e && e.message) || 'Could not export the receipt. Please try again.' })
      setTimeout(() => setMsg((m) => (m.t ? { ok: true, t: '' } : m)), 5000)
    }
    setBusy(false)
  }
  const close = () => { if (prev) URL.revokeObjectURL(prev.url); setPrev(null) }
  useEffect(() => () => { if (prev) URL.revokeObjectURL(prev.url) }, []) // free the image if the page is left while it is open
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {msg.t && <span role="status" className={'text-xs ' + (msg.ok ? 'text-mu' : 'text-neg')}>{msg.t}</span>}
      <button className="btn" onClick={run} disabled={busy} aria-label="Preview balances as a PNG receipt"><Ic n="image" s={16} />{busy ? 'Preparing...' : 'Share Balances'}</button>
      {prev && <ReceiptPreview blob={prev.blob} url={prev.url} onClose={close} />}
    </div>
  )
}

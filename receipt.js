/* =====================================================================
   receipt.js  (v4 Phase 4; v5 final: aligned layout + crisp high-DPI capture)
   "Share Balances" button + modern brown digital receipt.
   Builds a temporary, off-screen DOM receipt (inline styles only, so html2canvas
   renders it the same on every device), captures it as a PNG and downloads it.
   Loaded after io.js and before shortcuts.js / app.js. Shares the global scope.
   Needs the html2canvas CDN script in index.html.
   ===================================================================== */
Object.assign(IC, {
  image: ['M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z', 'M9 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0', 'm21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21']
})

// Warm brown palette (fixed hex values; the receipt looks the same in light and dark mode).
// The font is the one the page already loads (Plus Jakarta Sans), so measuring and painting use the same glyphs.
const RC = {
  card1: '#6a4430', card2: '#2e1a11', ink: '#f8eedf', mute: '#c9ab92', gold: '#e8c28f', caramel: '#d49a62',
  line: 'rgba(232,194,143,0.30)', panel: 'rgba(232,194,143,0.13)', neg: '#ffa08d',
  font: "'Plus Jakarta Sans', Inter, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
}
const R_W = 380 // card width in CSS px (the snapshot is always taken at this fixed size)

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
// Dashed divider drawn as a real border (crisp at any scale).
const rDash = (m) => rEl('div', 'height:0;margin:' + m + ';border-top:2px dashed ' + RC.line + ';')

function buildReceipt(S, c) {
  const now = new Date()
  const p2 = (n) => String(n).padStart(2, '0')
  const when = now.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
  const ref = 'BDG-' + now.getFullYear() + p2(now.getMonth() + 1) + p2(now.getDate()) + '-' + p2(now.getHours()) + p2(now.getMinutes())
  const order = (w) => { const i = WORDER.indexOf(w.type); return i < 0 ? WORDER.length : i }
  const wallets = S.wallets.map((w, i) => ({ w, i })).sort((a, b) => order(a.w) - order(b.w) || a.i - b.i).map((x) => x.w)

  // Fixed-size, transparent wrapper (room for the shadow) so the PNG corners stay curved. Off-screen but NOT display:none.
  const wrap = rEl('div', 'position:absolute;left:-10000px;top:0;width:' + (R_W + 48) + 'px;padding:24px;box-sizing:border-box;font-family:' + RC.font + ';font-weight:500;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;')
  wrap.setAttribute('aria-hidden', 'true')
  const card = rEl('div', 'position:relative;overflow:hidden;box-sizing:border-box;width:' + R_W + 'px;border-radius:36px;padding:30px 26px 26px;color:' + RC.ink +
    ';background-color:' + RC.card2 + ';background-image:linear-gradient(158deg,' + RC.card1 + ' 0%,#4a2e20 46%,' + RC.card2 + ' 100%);border:1px solid ' + RC.line +
    ';box-shadow:0 22px 38px rgba(24,12,6,0.50),0 6px 12px rgba(24,12,6,0.35);')

  // 3D top highlight (a soft light edge) and bottom shade give the card a rounded, pillowy feel.
  card.appendChild(rEl('div', 'position:absolute;left:0;top:0;width:100%;height:150px;border-radius:36px 36px 0 0;background-image:linear-gradient(180deg,rgba(255,236,208,0.16) 0%,rgba(255,236,208,0) 100%);'))
  card.appendChild(rEl('div', 'position:absolute;left:0;bottom:0;width:100%;height:120px;border-radius:0 0 36px 36px;background-image:linear-gradient(0deg,rgba(0,0,0,0.26) 0%,rgba(0,0,0,0) 100%);'))

  // 3D watermark: a tilted rounded tile with a raised "B" (stacked offset copies fake the depth). Very low contrast.
  const wm = rEl('div', 'position:absolute;right:-46px;bottom:96px;width:230px;height:230px;transform:rotate(-14deg);')
  wm.appendChild(rEl('div', 'position:absolute;left:10px;top:12px;width:210px;height:210px;border-radius:60px;background-color:rgba(0,0,0,0.20);'))
  wm.appendChild(rEl('div', 'position:absolute;left:0;top:0;width:210px;height:210px;border-radius:60px;background-image:linear-gradient(135deg,rgba(255,236,208,0.10),rgba(255,236,208,0.03));border:2px solid rgba(255,236,208,0.08);'))
  wm.appendChild(rEl('div', 'position:absolute;left:5px;top:8px;width:210px;height:210px;line-height:210px;text-align:center;font-size:150px;font-weight:800;color:rgba(0,0,0,0.20);', 'b'))
  wm.appendChild(rEl('div', 'position:absolute;left:0;top:0;width:210px;height:210px;line-height:210px;text-align:center;font-size:150px;font-weight:800;color:rgba(255,236,208,0.09);', 'b'))
  card.appendChild(wm)

  const body = rEl('div', 'position:relative;width:100%;')

  // Header: logo + wordmark on the left, pill on the right. Every box has a fixed height and line-height = height.
  const logo = rEl('div', 'width:40px;height:40px;border-radius:13px;line-height:40px;text-align:center;font-size:22px;font-weight:800;color:#3a2318;background-image:linear-gradient(135deg,#f6d9b0,#c98f5c);box-shadow:0 3px 6px rgba(20,10,4,0.40);', 'B')
  const brand = rEl('div', 'display:flex;flex-direction:row;align-items:flex-start;', null, [
    logo,
    rEl('div', 'margin-left:11px;height:40px;line-height:40px;font-size:20px;font-weight:700;color:' + RC.ink + ';', 'Budgy')
  ])
  // Pill: no letter-spacing on the text; the side padding is symmetric, so the label sits dead centre.
  const pill = rEl('div', 'height:28px;line-height:26px;padding:0 13px;margin-top:6px;border-radius:999px;border:1px solid ' + RC.line + ';background-color:rgba(232,194,143,0.10);font-size:10px;font-weight:700;color:' + RC.gold + ';white-space:nowrap;', 'BALANCE RECEIPT')
  body.appendChild(rRow(brand, pill))

  // Meta block: timestamp on its own line, then "Prepared for", then the reference number (label left, value right).
  body.appendChild(rEl('div', 'margin-top:22px;', null, [
    rRow(rEl('div', 'font-size:11px;line-height:20px;font-weight:600;color:' + RC.caramel + ';', 'DATE'), rEl('div', 'font-size:12px;line-height:20px;text-align:right;color:' + RC.ink + ';', when)),
    S.name ? rRow(rEl('div', 'font-size:11px;line-height:20px;font-weight:600;color:' + RC.caramel + ';', 'FOR'), rEl('div', 'font-size:12px;line-height:20px;text-align:right;color:' + RC.ink + ';min-width:0;word-break:break-word;margin-left:16px;', S.name)) : null,
    rRow(rEl('div', 'font-size:11px;line-height:20px;font-weight:600;color:' + RC.caramel + ';', 'REF'), rEl('div', 'font-size:12px;line-height:20px;text-align:right;color:' + RC.ink + ';white-space:nowrap;font-variant-numeric:tabular-nums;', ref))
  ]))
  body.appendChild(rDash('18px 0 6px'))

  // Wallet rows: left = wallet name + type badge, right = bold amount (right edge identical on every row).
  const list = rEl('div', 'width:100%;')
  wallets.forEach((w, i) => {
    const bal = c.bal[w.id], neg = bal < 0
    const badge = rEl('div', 'display:inline-block;margin-top:6px;height:18px;line-height:17px;padding:0 9px;border-radius:999px;border:1px solid ' + RC.line + ';background-color:rgba(232,194,143,0.10);font-size:9.5px;font-weight:600;color:' + RC.gold + ';white-space:nowrap;', String(w.type || 'wallet').toUpperCase())
    const left = rEl('div', 'flex:1 1 auto;min-width:0;margin-right:14px;', null, [
      rEl('div', 'font-size:15px;line-height:20px;font-weight:600;color:' + RC.ink + ';word-break:break-word;', w.name),
      badge
    ])
    const right = rEl('div', 'flex:0 0 auto;max-width:190px;font-size:16px;line-height:20px;font-weight:700;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;color:' + (neg ? RC.neg : RC.ink) + ';', php(bal))
    list.appendChild(rRow(left, right, 'padding:13px 0;' + (i ? 'border-top:1px solid ' + RC.line + ';' : '')))
  })
  body.appendChild(list)
  body.appendChild(rDash('6px 0 18px'))

  // Total panel: label left, wallet count right, big amount right-aligned underneath.
  const total = rEl('div', 'box-sizing:border-box;width:100%;border-radius:24px;padding:16px 20px 18px;background-color:' + RC.panel + ';border:1px solid ' + RC.line + ';box-shadow:0 4px 10px rgba(20,10,4,0.30);', null, [
    rRow(
      rEl('div', 'font-size:11px;line-height:16px;font-weight:700;color:' + RC.gold + ';', 'TOTAL LIQUID CASH'),
      rEl('div', 'font-size:11px;line-height:16px;text-align:right;color:' + RC.mute + ';white-space:nowrap;margin-left:10px;', wallets.length + ' wallet' + (wallets.length === 1 ? '' : 's'))
    ),
    rEl('div', 'margin-top:10px;width:100%;font-size:32px;line-height:40px;font-weight:800;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;color:' + (c.liquid < 0 ? RC.neg : RC.ink) + ';', php(c.liquid))
  ])
  body.appendChild(total)

  // Footer (centred text with no letter-spacing, so it is truly centred in the PNG).
  body.appendChild(rEl('div', 'margin-top:22px;width:100%;text-align:center;', null, [
    rEl('div', 'font-size:12px;line-height:18px;color:' + RC.mute + ';', 'Thank you for budgeting wisely'),
    rEl('div', 'margin-top:6px;font-size:10px;line-height:14px;font-weight:700;color:rgba(232,194,143,0.65);', 'MADE WITH BUDGY')
  ]))

  card.appendChild(body)
  wrap.appendChild(card)
  return wrap
}

// Load the exact font weights used by the receipt before capturing, so text is measured and painted with the same glyphs.
async function loadReceiptFonts() {
  if (!document.fonts || !document.fonts.load) return
  const ws = ['500', '600', '700', '800'], sample = 'Budgy 0123456789 \u20B1 BALANCE RECEIPT'
  try {
    await Promise.all(ws.map((w) => document.fonts.load(w + ' 16px "Plus Jakarta Sans"', sample)))
    if (document.fonts.ready) await document.fonts.ready
  } catch (e) { /* fall back to the system font stack; layout still holds because every row has fixed line-heights */ }
}
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()))

async function exportReceiptPng(S, c) {
  if (!window.html2canvas) throw new Error('The image tool has not loaded yet. Check your connection, then try again.')
  await loadReceiptFonts()
  const node = buildReceipt(S, c)
  document.body.appendChild(node)
  try {
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
    const url = URL.createObjectURL(blob), a = document.createElement('a')
    a.href = url; a.download = 'budgy-balances-' + off(0) + '.png'
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  } finally {
    node.remove()
  }
}

function ReceiptButton() {
  const { S, c } = useApp()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState({ ok: true, t: '' })
  const run = async () => {
    if (busy) return
    setBusy(true); setMsg({ ok: true, t: '' })
    try { await exportReceiptPng(S, c); setMsg({ ok: true, t: 'Receipt saved as PNG.' }) }
    catch (e) { setMsg({ ok: false, t: (e && e.message) || 'Could not export the receipt. Please try again.' }) }
    setBusy(false)
    setTimeout(() => setMsg((m) => (m.t ? { ok: true, t: '' } : m)), 5000)
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {msg.t && <span role="status" className={'text-xs ' + (msg.ok ? 'text-mu' : 'text-neg')}>{msg.t}</span>}
      <button className="btn" onClick={run} disabled={busy} aria-label="Share balances as a PNG receipt"><Ic n="image" s={16} />{busy ? 'Preparing...' : 'Share Balances'}</button>
    </div>
  )
}

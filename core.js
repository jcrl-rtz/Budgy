/* =====================================================================
   core.js  (v4 Phase 1: flat Material You themes; wallet/leather themes removed. v4 Phase 2: Net Worth card display settings in the store)
   Helpers, themes, the Appearance Engine, money maths, sample data and the
   app store (local cache + Firebase sync). No UI in this file except the Provider.
   ===================================================================== */
const { useState, useEffect, useMemo, useRef, createContext, useContext } = React

/* ---------- Safe access to window.fb (firebase.js) and localStorage ---------- */
const FB_OFF = { enabled: false, onAuth: () => () => {}, signIn: () => Promise.reject(), signUp: () => Promise.reject(), google: () => Promise.reject(), reset: () => Promise.reject(), signOut: () => Promise.resolve(), watch: () => () => {}, save: () => Promise.reject(), setName: () => Promise.reject(), changePassword: () => Promise.reject(), deleteAccount: () => Promise.reject() }
const fb = new Proxy({}, { get: (_, k) => (window.fb || FB_OFF)[k] })
const errMsg = (e) => (window.errMsg ? window.errMsg(e) : 'Something went wrong. Please try again.')
const ls = {
  get: (k) => { try { return localStorage.getItem(k) } catch (e) { return null } },
  set: (k, v) => { if (window.__budgyResetting) return; try { localStorage.setItem(k, v) } catch (e) {} },
  del: (k) => { try { localStorage.removeItem(k) } catch (e) {} }
}
const KEY = 'budgy.state', TK = 'budgy.t', UIK = 'budgy.ui', GK = 'budgy.guest'

/* ---------- Small helpers ---------- */
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10)
const off = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d) }
const q = (n) => Math.round(n * 100) / 100
const php = (n) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
const pct1 = (x) => (Math.round(x * 10) / 10).toFixed(1) + '%'
const money = (v) => /^\d+(\.\d{1,2})?$/.test(String(v).trim())
const signed = (v) => /^-?\d+(\.\d{1,2})?$/.test(String(v).trim())
let cnt = 0
const nid = () => 'i' + Date.now().toString(36) + (cnt++).toString(36)
const rem = (d) => q(d.total - (d.paid || 0))
const fd = (s) => new Date(s + 'T00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
const mq = () => (window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null)

/* ---------- Appearance Engine ---------- */
// Look tokens for every theme. Android 17 / Material You: flat, solid surfaces with no page gradient, no card gradient and no texture.
// The hero card gets a single flat accent tint layer (not a gradient). `grain` and `stitch*` stay defined as inert values because the Net Worth
// credit card (.nc-grain / .nc-stitch in index.html) still reads them; they resolve to "nothing" for every theme.
const stdLook = (a, dark) => ({
  page: 'none',
  card: 'none',
  hero: 'linear-gradient(rgb(' + a + ' / ' + (dark ? '.14' : '.10') + '), rgb(' + a + ' / ' + (dark ? '.14' : '.10') + '))',
  grain: 'none', stitch: '255 255 255', stitchA: 0, s1a: 1, s2a: 1,
  edge: '0 0 0 0 transparent'
})
const lookOf = (th, dark, accent) => (th.look ? th.look(dark) : stdLook(accent, dark))
const accentOf = (th, dark) => (dark ? th.a : th.al || th.a)

// Colour presets. d = dark surfaces, l = light surfaces: [background, card, card-2, border].
const THEMES = [
  { id: 'classic', name: 'Classic', a: '225 29 72',  d: ['#09090b', '#111113', '#1a1a1d', '#27272a'], l: ['#f6f6f7', '#ffffff', '#f0f0f2', '#e4e4e7'] },
  { id: 'ocean',   name: 'Ocean',   a: '59 130 246', d: ['#080c14', '#0d1320', '#141c2c', '#1f2a3d'], l: ['#f3f6fb', '#ffffff', '#eaf0f8', '#dbe4f0'] },
  { id: 'forest',  name: 'Forest',  a: '16 185 129', d: ['#080d0b', '#0e1512', '#151f1a', '#203028'], l: ['#f3f8f5', '#ffffff', '#e9f1ec', '#d9e6de'] },
  { id: 'violet',  name: 'Violet',  a: '139 92 246', d: ['#0b0912', '#121019', '#1a1724', '#2a2639'], l: ['#f6f4fb', '#ffffff', '#eeeaf8', '#e0dbf0'] },
  { id: 'amber',   name: 'Amber',   a: '245 158 11', d: ['#0d0a06', '#15110b', '#1e1812', '#302819'], l: ['#faf7f1', '#ffffff', '#f4eee2', '#e8dfcc'] },
  { id: 'slate',   name: 'Slate',   a: '100 116 139', d: ['#0b0d10', '#121519', '#1a1e24', '#272d35'], l: ['#f4f5f7', '#ffffff', '#ebedf1', '#dcdfe5'] },
  { id: 'maroon',  name: 'Maroon',  a: '159 29 58',  d: ['#0d0809', '#150d0f', '#1f1417', '#33202a'], l: ['#faf5f6', '#ffffff', '#f4eaed', '#e8d6dc'] },
  { id: 'brown',   name: 'Brown',   a: '161 98 58',  d: ['#0d0a08', '#15100d', '#1e1814', '#302720'], l: ['#f9f6f3', '#ffffff', '#f2ebe5', '#e5d9ce'] },
  { id: 'yellow',  name: 'Yellow',  a: '234 179 8',  d: ['#0d0c06', '#15140b', '#1e1c12', '#302d19'], l: ['#fbf9ef', '#ffffff', '#f5f1dd', '#e9e2c0'] },
]
// Quick accent colours shown in Settings (plus a free colour picker).
const SWATCHES = [['Crimson', '225 29 72'], ['Violet', '139 92 246'], ['Azure', '59 130 246'], ['Emerald', '16 185 129'], ['Amber', '245 158 11'], ['Pink', '236 72 153'], ['Slate', '100 116 139']]
const MODES = [['light', 'Light', 'sun'], ['dark', 'Dark', 'moon'], ['system', 'System', 'monitor']]

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ')
const rgbToHex = (s) => '#' + s.split(' ').map((n) => (+n).toString(16).padStart(2, '0')).join('')
const lum = (rgb) => { const [r, g, b] = rgb.split(' ').map((n) => { n = +n / 255; return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4) }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const isDarkMode = (mode) => (mode === 'system' ? !!(mq() && mq().matches) : mode !== 'light')

// Writes the theme onto <html> as CSS variables. Tailwind colours (bg-ac, text-fg, ...) and the surface classes in index.html all read these.
function applyAppearance({ mode, theme, accent }) {
  const dark = isDarkMode(mode), th = THEMES.find((t) => t.id === theme) || THEMES[0], c = dark ? th.d : th.l, r = document.documentElement
  const lk = lookOf(th, dark, accent)
  const vars = {
    '--bg': hexToRgb(c[0]), '--s1': hexToRgb(c[1]), '--s2': hexToRgb(c[2]), '--bd': hexToRgb(c[3]),
    '--fg': lk.fg || (dark ? '250 250 250' : '24 24 27'), '--mu': lk.mu || (dark ? '161 161 170' : '82 82 91'),
    '--pos': dark ? '52 211 153' : '4 120 87', '--neg': dark ? '251 113 133' : '220 38 38',
    '--a': accent, '--on-a': lum(accent) > 0.179 ? '20 20 22' : '255 255 255', // pick whichever of dark/white text has the higher contrast on the accent
    '--page': lk.page, '--card-grad': lk.card, '--hero-grad': lk.hero, '--grain': lk.grain,
    '--stitch': lk.stitch, '--stitch-a': String(lk.stitchA), '--s1-a': String(lk.s1a), '--s2-a': String(lk.s2a), '--edge': lk.edge
  }
  Object.keys(vars).forEach((k) => r.style.setProperty(k, vars[k]))
  r.classList.toggle('light', !dark); r.classList.toggle('dark', dark); r.style.colorScheme = dark ? 'dark' : 'light'
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', c[0])
  ls.set(UIK, JSON.stringify({ mode, bg: vars['--bg'] })) // read by the tiny script in index.html to avoid a flash
}

/* ---------- Net Worth card display settings (v4 Phase 2) ---------- */
// S.cardStats = { order, hidden }. `order` always lists all four figures (their left-to-right order on the card); `hidden` lists the ones switched off.
// Keeping hidden figures in `order` means switching one back on returns it to the place the user gave it.
const CARD_KEYS = ['liquid', 'payables', 'expenses', 'receivables']
const cardDefault = () => ({ order: CARD_KEYS.slice(), hidden: [] })
const fixCard = (c) => {
  const o = c && typeof c === 'object' ? c : {}, order = []
  ;(Array.isArray(o.order) ? o.order : []).forEach((k) => { if (CARD_KEYS.includes(k) && !order.includes(k)) order.push(k) })
  CARD_KEYS.forEach((k) => { if (!order.includes(k)) order.push(k) })
  const hidden = (Array.isArray(o.hidden) ? o.hidden : []).filter((k, i, a) => CARD_KEYS.includes(k) && a.indexOf(k) === i)
  return { order, hidden }
}

/* ---------- Data model ---------- */
// Same shape as your earlier Budgy so existing cloud data keeps working. Phase 2 adds transactions, payables and goals screens on top of it.
const blank = () => ({
  name: '', avatar: null, seen: false, mode: 'dark', theme: 'classic', accent: '',
  wallets: [{ id: 'w1', name: 'Cash on Hand', type: 'Cash', balance: 0 }],
  tx: [], debts: [], goals: [], alloc: {}, srcs: [], cardStats: cardDefault()
})
const dataBlank = () => { const b = blank(); return { wallets: b.wallets, tx: b.tx, debts: b.debts, goals: b.goals, alloc: b.alloc, srcs: b.srcs } }
const fix = (s) => {
  const b = blank(), o = { ...b, ...s }
  o.wallets = Array.isArray(o.wallets) && o.wallets.length ? o.wallets : b.wallets
  ;['tx', 'debts', 'goals'].forEach((k) => { if (!Array.isArray(o[k])) o[k] = [] })
  if (!o.alloc || typeof o.alloc !== 'object') o.alloc = {}
  o.srcs = Array.isArray(o.srcs) ? o.srcs.filter((x) => x && (x.kind === 'payable' || x.kind === 'receivable') && typeof x.name === 'string' && x.name.trim()) : []
  // Phase 3: avatar is null or { k: 'emoji' | 'img', v: string }. An uploaded image is a small data URL, so it syncs inside the same document.
  const av = o.avatar; o.avatar = av && typeof av === 'object' && (av.k === 'emoji' || av.k === 'img') && typeof av.v === 'string' && av.v.length < 120000 ? { k: av.k, v: av.v } : null
  o.seen = !!o.seen
  o.cardStats = fixCard(o.cardStats)
  if (!THEMES.some((t) => t.id === o.theme)) o.theme = 'classic'
  if (!['light', 'dark', 'system'].includes(o.mode)) o.mode = 'dark'
  return o
}
const load = () => { try { const s = JSON.parse(ls.get(KEY)); if (s && s.wallets) return fix(s) } catch (e) {} return blank() }

// Demo data so the dashboard has something to show. Loaded on demand from Settings or the empty-state card.
const sample = () => ({
  wallets: [
    { id: 'w1', name: 'Cash on Hand', type: 'Cash', balance: 3200 },
    { id: 'w2', name: 'BDO Bank', type: 'Bank', balance: 41000 },
    { id: 'w3', name: 'GCash', type: 'E-Wallet', balance: 5300 },
    { id: 'w4', name: 'Maya', type: 'E-Wallet', balance: 1800 }
  ],
  tx: [
    { id: nid(), type: 'income', amount: 35000, category: 'Salary', date: off(-12), note: 'Monthly pay', wallet: 'w2' },
    { id: nid(), type: 'expense', amount: 9500, category: 'Rent', date: off(-10), note: 'Apartment', wallet: 'w2' },
    { id: nid(), type: 'expense', amount: 2450, category: 'Food', date: off(-6), note: 'Groceries', wallet: 'w1' },
    { id: nid(), type: 'transfer', amount: 3000, category: 'Transfer', date: off(-4), note: 'Top up GCash', wallet: 'w2', to: 'w3' },
    { id: nid(), type: 'expense', amount: 850, category: 'Transport', date: off(-3), note: 'Grab rides', wallet: 'w3' },
    { id: nid(), type: 'expense', amount: 1200, category: 'Fun', date: off(-2), note: 'Movie night', wallet: 'w4' },
    { id: nid(), type: 'expense', amount: 640, category: 'Food', date: off(-1), note: 'Lunch with team', wallet: 'w1' },
    { id: nid(), type: 'expense', amount: 1699, category: 'Bills', date: off(3), note: 'Internet bill', wallet: 'w2' },
    { id: nid(), type: 'income', amount: 8000, category: 'Freelance', date: off(5), note: 'Logo project', wallet: 'w3' }
  ],
  debts: [
    { id: nid(), kind: 'payable', cat: 'Installments', party: 'Phone installment', total: 4200.5, paid: 0, payments: [], due: off(8), wallet: 'w3' },
    { id: nid(), kind: 'payable', cat: 'School', party: '2nd semester balance', total: 40000, paid: 10000, payments: [{ id: nid(), amount: 10000, wallet: 'w2', date: off(-5) }], due: off(20), wallet: 'w2' },
    { id: nid(), kind: 'receivable', cat: 'Family', party: 'Monthly allowance', total: 5000, paid: 0, payments: [], due: off(9), wallet: 'w2' }
  ],
  goals: [
    { id: nid(), name: 'Emergency Fund', target: 60000, saved: 22000 },
    { id: nid(), name: 'New Laptop', target: 45000, saved: 12500 },
    { id: nid(), name: 'Baguio Trip', target: 15000, saved: 9000 }
  ],
  alloc: {},
  // Demo sources, so the demo Pending tab shows the same groups the demo payables use.
  srcs: [{ kind: 'payable', name: 'Installments' }, { kind: 'payable', name: 'School' }, { kind: 'receivable', name: 'Family' }]
})

/* ---------- Money maths ---------- */
// Wallet balance = opening balance + dated-today-or-earlier transactions + payments recorded on payables/receivables.
// Future-dated entries only feed the end-of-month projection.
function calc(S) {
  const t = off(0), n = new Date(), mo = t.slice(0, 7), em = iso(new Date(n.getFullYear(), n.getMonth() + 1, 0))
  const bal = Object.fromEntries(S.wallets.map((w) => [w.id, +w.balance || 0]))
  let spent = 0, pend = 0
  const cat = {}
  S.tx.forEach((x) => {
    if (x.date > t) { if (x.date <= em) pend += x.type === 'income' ? x.amount : x.type === 'expense' ? -x.amount : 0; return }
    if (!(x.wallet in bal)) return
    if (x.type === 'income') bal[x.wallet] += x.amount
    else if (x.type === 'expense') { bal[x.wallet] -= x.amount; if (x.date.startsWith(mo)) { spent += x.amount; cat[x.category] = (cat[x.category] || 0) + x.amount } }
    else if (x.to in bal) { bal[x.wallet] -= x.amount; bal[x.to] += x.amount }
  })
  let pay = 0, rec = 0, dPay = 0, dRec = 0
  S.debts.forEach((d) => {
    ;(d.payments || []).forEach((p) => { if (p.wallet in bal) bal[p.wallet] += d.kind === 'receivable' ? p.amount : -p.amount })
    const r = rem(d); if (r <= 0) return
    if (d.kind === 'payable') { pay += r; if (d.due <= em) dPay += r } else { rec += r; if (d.due <= em) dRec += r }
  })
  Object.keys(bal).forEach((k) => (bal[k] = q(bal[k])))
  Object.keys(cat).forEach((k) => (cat[k] = q(cat[k])))
  const liquid = q(Object.values(bal).reduce((a, b) => a + b, 0))
  const day = n.getDate(), dim = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate(), left = dim - day
  const fc = Math.trunc((q(spent) / day) * left * 100 + 1e-6) / 100 // forecast: what you'd still spend at this month's daily average
  const allocD = q(S.debts.filter((d) => d.kind === 'payable').reduce((a, d) => a + Math.min(S.alloc['d:' + d.id] || 0, Math.max(0, rem(d))), 0))
  const saved = q(S.goals.reduce((a, g) => a + g.saved, 0)), target = q(S.goals.reduce((a, g) => a + g.target, 0))
  return {
    bal, liquid, pay: q(pay), rec: q(rec), spent: q(spent), cat, pend: q(pend), dPay: q(dPay), dRec: q(dRec), fc,
    day, dim, left, monthPct: (day / dim) * 100, monthName: n.toLocaleDateString('en-PH', { month: 'long' }),
    net: q(liquid + rec - pay), allocD, saved, target, allocated: q(allocD + saved), spendable: q(liquid - allocD - saved),
    projected: q(liquid + pend + dRec - dPay - fc)
  }
}

/* ---------- Store ---------- */
const Ctx = createContext()
const useApp = () => useContext(Ctx)

function Provider({ children }) {
  const [S, setS] = useState(load), [user, setUser] = useState(null), [ready, setReady] = useState(false), [sync, setSync] = useState('local')
  const [guest, setGuestState] = useState(() => ls.get(GK) === '1'), [sysDark, setSysDark] = useState(() => !!(mq() && mq().matches))
  const R = useRef({ S: null, t: +(ls.get(TK) || 0), sent: 0, ready: false, mounted: false, skip: false, timer: 0, uid: null, lock: false }).current

  /* Appearance Engine: re-applies whenever mode / theme / accent change, and when the OS switches light/dark in System mode. */
  const ui = useMemo(() => {
    const th = THEMES.find((t) => t.id === S.theme) || THEMES[0], dark = S.mode === 'system' ? sysDark : S.mode !== 'light'
    return { mode: S.mode, theme: th.id, accent: S.accent || accentOf(th, dark), dark }
  }, [S.mode, S.theme, S.accent, sysDark])
  useEffect(() => { applyAppearance(ui) }, [ui])
  useEffect(() => {
    const m = mq(); if (!m || !m.addEventListener) return
    const f = () => setSysDark(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f)
  }, [])

  /* Sync plumbing. Last write wins by timestamp: the newer of local vs cloud is kept. */
  const push = (state) => {
    if (R.lock) return // account deletion in progress: never write
    const t = R.t || Date.now(); R.t = t; R.sent = t
    fb.save(R.uid, t, state || R.S).then(() => setSync('synced')).catch(() => setSync('error'))
  }
  const adopt = (d) => { const ns = fix(d.state); R.skip = true; R.t = d.t; R.sent = d.t; R.S = ns; ls.set(TK, String(d.t)); setS(ns); setSync('synced') }
  const wipeLocal = () => {
    const keep = { mode: R.S.mode, theme: R.S.theme, accent: R.S.accent, cardStats: R.S.cardStats } // appearance (and the card display settings) survive logging out
    const ns = { ...blank(), ...keep }
    R.skip = true; R.t = 0; R.sent = 0; R.ready = false; R.S = ns; setS(ns); ls.del(TK); ls.set(KEY, JSON.stringify(ns))
  }

  useEffect(() => { // auth state
    if (!fb.enabled) { setReady(true); return }
    return fb.onAuth((u) => { if (u) { ls.del(GK); setGuestState(false) } setUser(u); setReady(true) })
  }, [])

  useEffect(() => { // every change: cache locally right away, then debounce a save to Firestore
    R.S = S
    ls.set(KEY, JSON.stringify(S))
    if (!R.mounted) { R.mounted = true; return }
    if (R.skip) { R.skip = false; return }
    R.t = Date.now(); ls.set(TK, String(R.t))
    if (!R.uid || !R.ready || R.lock) return
    clearTimeout(R.timer); setSync('saving'); R.timer = setTimeout(() => push(), 600)
  }, [S])

  useEffect(() => { // subscribe to this user's cloud document
    R.uid = user ? user.uid : null; R.ready = false
    if (!user) { setSync('local'); return }
    setSync('connecting')
    return fb.watch(user.uid, (d, pending) => {
      if (pending || R.lock) return
      if (!d) { // brand-new account: upload whatever is on this device (or a fresh budget)
        const ns = fix(R.S.wallets.length && R.t ? R.S : blank()); if (!ns.name && user.name) ns.name = user.name
        R.skip = true; R.S = ns; setS(ns); R.ready = true; R.t = R.t || Date.now(); push(ns); return
      }
      if (!R.ready) { R.ready = true; if (d.t >= R.t) adopt(d); else push(); return }
      if (d.t > R.sent && d.t > R.t) adopt(d); else setSync('synced')
    }, () => setSync('error'))
  }, [user && user.uid])

  const c = useMemo(() => calc(S), [S])
  const run = async (fn) => { try { await fn(); return '' } catch (e) { return errMsg(e) } }
  const auth = {
    signIn: (e, p) => run(() => fb.signIn(e.trim(), p)),
    signUp: (n, e, p) => run(() => fb.signUp(n.trim(), e.trim(), p)),
    google: () => run(() => fb.google()),
    reset: (e) => run(() => fb.reset(e.trim())),
    // Phase 3 account controls. Each returns '' on success or a friendly error message.
    setName: (n) => run(async () => { if (user) await fb.setName(n) }),
    changePassword: (cur, nw) => run(() => fb.changePassword(cur, nw)),
    deleteAccount: async (pw) => {
      R.lock = true; clearTimeout(R.timer) // stop the sync listener from re-creating the document while it is being wiped
      const err = await run(() => fb.deleteAccount(pw))
      if (err) { R.lock = false; if (R.uid && R.ready) push(); return err } // failed: make sure the cloud copy is intact
      ls.del(GK); wipeLocal(); R.lock = false; return ''
    },
    logout: () => run(async () => { await fb.signOut(); wipeLocal() }),
    useGuest: () => { ls.set(GK, '1'); setGuestState(true) },
    leaveGuest: () => { ls.del(GK); setGuestState(false) }
  }
  const upd = (key, id, p) => setS((s) => ({ ...s, [key]: s[key].map((x) => (x.id === id ? { ...x, ...p } : x)) }))

  const api = {
    S, c, ui, user, guest, ready, sync, auth, fbEnabled: !!fb.enabled,
    set: (p) => setS((s) => ({ ...s, ...p })),
    // Wallets
    addWallet: (w) => setS((s) => ({ ...s, wallets: [...s.wallets, { id: nid(), ...w }] })),
    updateWallet: (id, p) => upd('wallets', id, p),
    deleteWallet: (id) => setS((s) => { // never the last wallet; removes its transactions and the payments made from it
      if (s.wallets.length < 2) return s
      const rest = s.wallets.filter((w) => w.id !== id)
      return {
        ...s, wallets: rest, tx: s.tx.filter((x) => x.wallet !== id && x.to !== id),
        debts: s.debts.map((d) => {
          const gone = (d.payments || []).filter((p) => p.wallet === id), amt = q(gone.reduce((a, p) => a + p.amount, 0))
          return { ...d, wallet: d.wallet === id ? rest[0].id : d.wallet, paid: q(Math.max(0, (d.paid || 0) - amt)), payments: (d.payments || []).filter((p) => p.wallet !== id) }
        })
      }
    }),
    // Transactions
    addTx: (x) => setS((s) => ({ ...s, tx: [{ id: nid(), ...x }, ...s.tx] })),
    // Payables and receivables (a payment moves money in or out of a wallet through calc())
    addDebt: (d) => setS((s) => ({ ...s, debts: [...s.debts, { id: nid(), paid: 0, payments: [], ...d }] })),
    updDebt: (id, p) => upd('debts', id, p),
    delDebt: (id) => setS((s) => { const a = { ...s.alloc }; delete a['d:' + id]; return { ...s, debts: s.debts.filter((d) => d.id !== id), alloc: a } }),
    payDebt: (id, amount, wallet) => setS((s) => ({ ...s, debts: s.debts.map((d) => (d.id === id ? { ...d, paid: q((d.paid || 0) + amount), payments: [...(d.payments || []), { id: nid(), amount, wallet, date: off(0) }] } : d)) })),
    // Smart Plan allocations, keyed 'd:<debtId>'
    setAlloc: (p) => setS((s) => ({ ...s, alloc: { ...s.alloc, ...p } })),
    // Goals
    addGoal: (g) => setS((s) => ({ ...s, goals: [...s.goals, { id: nid(), saved: 0, ...g }] })),
    updGoal: (id, p) => upd('goals', id, p),
    delGoal: (id) => setS((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })),
    addToGoal: (id, amt) => setS((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, saved: q(g.saved + amt) } : g)) })),
    // Data
    loadSample: () => setS((s) => ({ ...s, ...sample() })),
    clearData: () => setS((s) => ({ ...s, ...dataBlank() })),
    // Replaces the budget data with an already-validated backup (see io.js). Name, avatar and appearance are only replaced when the backup has them.
    restoreData: (d) => setS((s) => ({ ...s, ...d }))
  }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

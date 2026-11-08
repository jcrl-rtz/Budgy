/* =====================================================================
   io.js  (Phase 2B)
   Import / Export Data: a complete JSON backup + restore, and a CSV export of every transaction.
   Opened from Settings > "Import / Export Data" (and from the "Export my data first" shortcuts in p3.js).
   Loaded after p3.js and before app.js. Shares the global scope with the other files.
   ===================================================================== */
Object.assign(IC, {
  upl: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'],
  json: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1', 'M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1']
})

const BACKUP_APP = 'budgy', BACKUP_VERSION = 2
const MAX_BACKUP_BYTES = 8 * 1024 * 1024 // a real budget is a few hundred KB; anything bigger is not a Budgy backup

/* ---------- File helpers ---------- */
const saveFile = (name, text, type, bom) => {
  const url = URL.createObjectURL(new Blob([(bom ? '﻿' : '') + text], { type })), a = document.createElement('a')
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000)
}
// Spreadsheet apps run any cell that starts with = + - @ as a formula. Text cells that do get a leading apostrophe so they stay plain text.
const safeCell = (v) => { const s = String(v == null ? '' : v); return /^[=+\-@\t\r]/.test(s) ? "'" + s : s }
const csvOut = (rows) => rows.map((r) => r.map((v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\r\n')

/* ---------- Export ---------- */
// The backup holds everything needed to rebuild the budget on any device: wallets, transactions, payables / receivables (with their payment
// history), sources, goals, Smart Plan allocations, and the profile + appearance.
function buildBackup(S) {
  return {
    app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(),
    profile: { name: S.name || '', avatar: S.avatar || null, mode: S.mode, theme: S.theme, accent: S.accent || '', cardStats: fixCard(S.cardStats), homePin: HOME_KEYS.includes(S.homePin) ? S.homePin : 'net', showCashPie: S.showCashPie === true },
    data: { wallets: S.wallets, tx: S.tx, debts: S.debts, goals: S.goals, alloc: S.alloc || {}, srcs: S.srcs || [] }
  }
}

// Every transaction, oldest last: your entries plus the payments recorded on payables (expense) and receivables (income).
function buildTxRows(S) {
  const t0 = off(0), W = Object.fromEntries(S.wallets.map((w) => [w.id, w.name])), nm = (id) => W[id] || 'Removed wallet'
  const own = S.tx.map((x) => [x.date, x.type, safeCell(x.category), safeCell(x.note || ''), safeCell(nm(x.wallet)), x.type === 'transfer' ? safeCell(nm(x.to)) : '', x.amount, x.date > t0 ? 'Scheduled' : 'Posted'])
  const paid = S.debts.flatMap((d) => (d.payments || []).map((y) => [y.date, d.kind === 'payable' ? 'expense' : 'income', safeCell(d.cat), safeCell((d.kind === 'payable' ? 'Paid · ' : 'Received · ') + d.party), safeCell(nm(y.wallet)), '', y.amount, 'Posted']))
  return [...own, ...paid].sort((a, b) => b[0].localeCompare(a[0]))
}

/* ---------- Import: parse + strict validation ---------- */
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00'))
const isNum = (n) => typeof n === 'number' && isFinite(n)
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

// Turns untrusted JSON into clean budget data. Returns { data, profile, counts, skipped } or { error }.
function parseBackup(text) {
  let raw
  try { raw = JSON.parse(text) } catch (e) { return { error: 'That file is not valid JSON. Choose a backup file exported from Budgy.' } }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: 'This file does not look like a Budgy backup.' }
  // Accept the wrapped format ({ app, data, profile }) and a bare state object (the same shape Budgy keeps in local storage).
  const wrapped = raw.data && typeof raw.data === 'object'
  if (wrapped && raw.app && raw.app !== BACKUP_APP) return { error: 'This backup was made by a different app (' + str(String(raw.app), 30) + ').' }
  if (wrapped && isNum(raw.version) && raw.version > BACKUP_VERSION) return { error: 'This backup was made by a newer version of Budgy. Update the app and try again.' }
  const d = wrapped ? raw.data : raw, p = wrapped ? raw.profile || {} : raw
  if (!Array.isArray(d.wallets) && !Array.isArray(d.tx) && !Array.isArray(d.debts) && !Array.isArray(d.goals)) return { error: 'No wallets, transactions, payables or goals were found in this file.' }

  let skipped = 0
  const ids = new Set(), uid = (id) => { let k = str(String(id == null ? '' : id), 40) || nid(); while (ids.has(k)) k = nid(); ids.add(k); return k }

  const wallets = []
  ;(Array.isArray(d.wallets) ? d.wallets : []).forEach((w) => {
    if (!w || typeof w !== 'object' || !str(w.name, 40) || !isNum(+w.balance)) { skipped++; return }
    wallets.push({ id: uid(w.id), name: str(w.name, 40), type: str(w.type, 20) || 'Cash', balance: q(+w.balance), color: cleanColor(w.color) })
  })
  if (!wallets.length) wallets.push({ id: uid('w1'), name: 'Cash on Hand', type: 'Cash', balance: 0 })
  const wid = new Set(wallets.map((w) => w.id))

  const tx = []
  ;(Array.isArray(d.tx) ? d.tx : []).forEach((x) => {
    const ok = x && typeof x === 'object' && ['income', 'expense', 'transfer'].includes(x.type) && isNum(x.amount) && x.amount > 0 && isDate(x.date) && wid.has(x.wallet) && (x.type !== 'transfer' || (wid.has(x.to) && x.to !== x.wallet))
    if (!ok) { skipped++; return }
    const o = { id: uid(x.id), type: x.type, amount: q(x.amount), category: str(x.category, 40) || (x.type === 'transfer' ? 'Transfer' : 'Other'), date: x.date, note: str(x.note, 120), wallet: x.wallet }
    if (x.type === 'transfer') o.to = x.to
    tx.push(o)
  })

  const debts = []
  ;(Array.isArray(d.debts) ? d.debts : []).forEach((x) => {
    if (!x || typeof x !== 'object' || !['payable', 'receivable'].includes(x.kind) || !isNum(x.total) || x.total < 0 || (x.total === 0 && !(x.isRecurring && x.isVariableAmount && x.needsAmount)) || !isDate(x.due) || !str(x.party, 40)) { skipped++; return }
    const payments = (Array.isArray(x.payments) ? x.payments : []).filter((y) => y && isNum(y.amount) && y.amount > 0 && wid.has(y.wallet) && isDate(y.date)).map((y) => ({ id: uid(y.id), amount: q(y.amount), wallet: y.wallet, date: y.date }))
    const paid = q(payments.reduce((a, y) => a + y.amount, 0)) // always derived from the payment history so balances stay consistent
    debts.push({ id: uid(x.id), kind: x.kind, cat: str(x.cat, 24) || 'Other', party: str(x.party, 40), total: q(x.total), paid: Math.min(paid, q(x.total)), payments, due: x.due, wallet: wid.has(x.wallet) ? x.wallet : wallets[0].id })
    const al = x.kind === 'payable' ? cleanAllocs(x.allocations, wid) : [] // v8: wallet allocations survive backup / restore
    if (al.length) debts[debts.length - 1].allocations = al
    Object.assign(debts[debts.length - 1], cleanRecur({ ...x, due: x.due, total: x.total })) // v8 P2: recurring fields survive backup / restore
  })

  const goals = []
  ;(Array.isArray(d.goals) ? d.goals : []).forEach((g) => {
    if (!g || typeof g !== 'object' || !str(g.name, 40) || !isNum(g.target) || g.target <= 0) { skipped++; return }
    goals.push({ id: uid(g.id), name: str(g.name, 40), target: q(g.target), saved: q(Math.min(Math.max(0, isNum(g.saved) ? g.saved : 0), g.target)) })
  })

  // Smart Plan allocations are only kept for payables that exist in this backup.
  const alloc = {}, dids = new Set(debts.filter((x) => x.kind === 'payable').map((x) => x.id))
  if (d.alloc && typeof d.alloc === 'object') Object.keys(d.alloc).forEach((k) => { if (k.startsWith('d:') && dids.has(k.slice(2)) && isNum(d.alloc[k]) && d.alloc[k] >= 0) alloc[k] = q(d.alloc[k]) })

  // Sources: the ones listed in the backup plus any category the payables / receivables use, so nothing is hidden on the Pending tab.
  const seen = new Set(), srcs = []
  const addSrc = (kind, name) => { const n = str(name, 24), k = kind + '|' + n.toLowerCase(); if (n && !seen.has(k)) { seen.add(k); srcs.push({ kind, name: n }) } }
  ;(Array.isArray(d.srcs) ? d.srcs : []).forEach((x) => { if (x && (x.kind === 'payable' || x.kind === 'receivable')) addSrc(x.kind, x.name) })
  debts.forEach((x) => addSrc(x.kind, x.cat))

  const profile = {}
  if (typeof p.name === 'string') profile.name = p.name.trim().slice(0, 40)
  const av = p.avatar; if (av && typeof av === 'object' && (av.k === 'emoji' || av.k === 'img') && typeof av.v === 'string' && av.v.length < 120000) profile.avatar = { k: av.k, v: av.v }
  if (['light', 'dark', 'system'].includes(p.mode)) profile.mode = p.mode
  if (THEMES.some((t) => t.id === p.theme)) profile.theme = p.theme
  if (typeof p.accent === 'string' && (p.accent === '' || /^\d{1,3} \d{1,3} \d{1,3}$/.test(p.accent))) profile.accent = p.accent
  if (p.cardStats && typeof p.cardStats === 'object') profile.cardStats = fixCard(p.cardStats)
  if (HOME_KEYS.includes(p.homePin)) profile.homePin = p.homePin
  if (typeof p.showCashPie === 'boolean') profile.showCashPie = p.showCashPie

  return { data: { wallets, tx, debts, goals, alloc, srcs }, profile, counts: { wallets: wallets.length, tx: tx.length, debts: debts.length, goals: goals.length }, skipped, at: wrapped && typeof raw.exportedAt === 'string' ? raw.exportedAt.slice(0, 10) : '' }
}

/* ---------- Smart Importer (v9 P5): transactions from other budget apps ---------- */
// Pure helpers first (no React). The importer reads an array of JSON objects with unknown key names, guesses which key is the amount / date / note /
// category (and optionally an income-vs-expense column), lets the person confirm the guess, and only then creates Budgy transactions.
const SI_MAX_ROWS = 20000, SI_MAX_BYTES = 12 * 1024 * 1024
const siPad = (n) => (n < 10 ? '0' : '') + n
const siYmd = (y, m, d) => { const t = new Date(y, m - 1, d); return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === d && y >= 1990 && y <= 2100 ? y + '-' + siPad(m) + '-' + siPad(d) : null }
const siFlat = (o) => { // one level of nesting is flattened: { a: { b: 1 } } -> 'a.b'. Arrays and deeper objects are ignored.
  const r = {}
  Object.keys(o).forEach((k) => { const v = o[k]; if (v && typeof v === 'object') { if (!Array.isArray(v)) Object.keys(v).forEach((j) => { const x = v[j]; if (x == null || typeof x !== 'object') r[k + '.' + j] = x }) } else r[k] = v })
  return r
}
const siObjs = (a) => (Array.isArray(a) && a.length && a.filter((x) => x && typeof x === 'object' && !Array.isArray(x)).length >= Math.ceil(a.length * 0.8) ? a.filter((x) => x && typeof x === 'object' && !Array.isArray(x)) : null)
const siFind = (raw) => { // the array of transaction objects: the file itself, or the first array of objects inside it (also one level deeper)
  if (Array.isArray(raw)) return siObjs(raw)
  if (!raw || typeof raw !== 'object') return null
  for (const k of Object.keys(raw)) { const f = siObjs(raw[k]); if (f) return f }
  for (const k of Object.keys(raw)) { const v = raw[k]; if (v && typeof v === 'object' && !Array.isArray(v)) for (const j of Object.keys(v)) { const f = siObjs(v[j]); if (f) return f } }
  return null
}
function siParse(text) { // -> { error } | { native: true } | { rows, keys }
  let raw
  try { raw = JSON.parse(text) } catch (e) { return { error: 'That file is not valid JSON.' } }
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.app === BACKUP_APP) return { native: true }
  const found = siFind(raw)
  if (!found) return { error: 'No list of transactions was found. The file should be an array of objects, for example [{ "amount": 12.5, "date": "2024-03-01" }].' }
  if (found.length > SI_MAX_ROWS) return { error: 'This file has ' + found.length + ' rows. The limit is ' + SI_MAX_ROWS + ' per import; split the file and import it in parts.' }
  const rows = found.map(siFlat), seen = new Set(), keys = []
  rows.slice(0, 300).forEach((r) => Object.keys(r).forEach((k) => { if (!seen.has(k) && r[k] != null && r[k] !== '') { seen.add(k); keys.push(k) } }))
  if (!keys.length) return { error: 'The rows in this file have no usable fields.' }
  return { rows, keys }
}
const siNum = (v) => { // 12.5, "12.50", "₱1,234.50", "(45.00)", "45.00-", "1.234,50" -> number, otherwise null
  if (typeof v === 'number') return isFinite(v) ? v : null
  if (typeof v !== 'string') return null
  const t = v.trim(); if (!t || !/\d/.test(t) || /[a-df-z]{3,}/i.test(t.replace(/php|usd|eur|gbp|jpy|cr|dr/gi, ''))) return null
  const neg = /^\(.*\)$/.test(t) || /^[^\d.,]*-/.test(t) || /\d\s*-$/.test(t)
  let s = t.replace(/[^\d.,]/g, ''); if (!/\d/.test(s)) return null
  const dot = s.lastIndexOf('.'), com = s.lastIndexOf(',')
  if (dot >= 0 && com >= 0) s = dot > com ? s.replace(/,/g, '') : s.replace(/\./g, '').replace(',', '.')
  else if (com >= 0) s = (s.match(/,/g) || []).length === 1 && /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '')
  else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, '')
  const n = parseFloat(s); return isFinite(n) ? (neg ? -n : n) : null
}
const siSlash = (v) => (typeof v === 'string' ? v.trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/) : null)
const siOrder = (vals) => { // day-first or month-first for 05/03/2024 style dates: decided by the first value that can only be one of them
  let dmy = false, mdy = false, any = false
  vals.forEach((v) => { const m = siSlash(v); if (!m) return; any = true; if (+m[1] > 12) dmy = true; if (+m[2] > 12) mdy = true })
  return { any, order: dmy && !mdy ? 'dmy' : 'mdy', sure: dmy !== mdy }
}
const siDate = (v, order) => { // -> 'YYYY-MM-DD' or null. Handles ISO, 'YYYY-MM-DD HH:mm', DD/MM/YYYY, MM/DD/YYYY, 'Mar 5, 2024', epoch seconds / milliseconds.
  const ep = (n) => { const d = new Date(n); return isNaN(d) ? null : siYmd(d.getFullYear(), d.getMonth() + 1, d.getDate()) }
  if (typeof v === 'number') return v >= 1e12 ? ep(v) : v >= 1e9 && v < 1e11 ? ep(v * 1000) : null
  if (typeof v !== 'string') return null
  const t = v.trim(); if (!t) return null
  if (/^\d{10}$/.test(t)) return ep(+t * 1000)
  if (/^\d{13}$/.test(t)) return ep(+t)
  let m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/); if (m) return siYmd(+m[1], +m[2], +m[3])
  m = siSlash(t); if (m) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return order === 'dmy' ? siYmd(y, +m[2], +m[1]) : siYmd(y, +m[1], +m[2]) }
  if (/[a-z]{3}/i.test(t)) { const d = new Date(t); return isNaN(d) ? null : siYmd(d.getFullYear(), d.getMonth() + 1, d.getDate()) }
  return null
}
const siType = (v) => { // an income / expense column -> 'income' | 'expense' | 'skip' (transfers can't be imported) | null (not recognised)
  if (typeof v !== 'string') return null
  const t = v.trim().toLowerCase()
  if (/^(income|credit|deposit|in|inflow|receipt|received|revenue|earning|salary|refund|\+)$/.test(t)) return 'income'
  if (/^(expense|debit|withdrawal|out|outflow|payment|paid|spend|spending|purchase|charge|\-)$/.test(t)) return 'expense'
  return /transfer/.test(t) ? 'skip' : null
}
// Heuristic detection. Keys are tried against name patterns in priority order, and a key is only accepted when its values really look like that field.
function siDetect(keys, rows) {
  const sample = rows.slice(0, 200), used = new Set()
  const share = (k, f) => { let n = 0, g = 0; sample.forEach((r) => { const v = r[k]; if (v == null || v === '') return; n++; if (f(v)) g++ }); return n > 0 && g / n >= 0.6 }
  const pick = (pats, ok) => { for (const re of pats) { const k = keys.find((x) => !used.has(x) && re.test(x.toLowerCase()) && ok(x)); if (k) { used.add(k); return k } } return '' }
  const txt = (k) => share(k, (v) => typeof v === 'string' && siNum(v) === null && siDate(v, 'mdy') === null)
  const amount = pick([/^amount$/, /amount/, /price/, /^val|value/, /cost/, /sum|total|debit|credit/], (k) => share(k, (v) => siNum(v) !== null))
  const date = pick([/^date$/, /date/, /time|when|created|posted|^day$/], (k) => share(k, (v) => siDate(v, 'mdy') !== null))
  const type = pick([/^type$/, /kind|direction|flow|credit|debit|(trans|txn).*type/], (k) => share(k, (v) => { const t = siType(v); return !!t && t !== 'skip' }) && new Set(sample.map((r) => r[k])).size <= 12)
  const cat = pick([/cat/, /tag|group|label|class/], txt)
  const note = pick([/desc/, /note|memo|remark|comment/, /name|title|merchant|payee|vendor|detail/], txt)
  return { amount, date, note, cat, type }
}
// Builds the transactions for the current mapping. Returns what will be imported plus counts of what was left out and why.
function siBuild(rows, map, o) {
  const ord = o.order === 'auto' ? siOrder(map.date ? rows.map((r) => r[map.date]) : []).order : o.order
  const have = new Set(o.existing.map((t) => [t.date, t.type, t.amount, t.wallet, (t.note || '').toLowerCase()].join('|')))
  const list = [], out = { list, bad: 0, dup: 0, skip: 0 }
  rows.forEach((r) => {
    const a = siNum(r[map.amount]), date = map.date ? siDate(r[map.date], ord) : off(0)
    if (a === null || a === 0 || !date) return void out.bad++
    let type = null
    if (map.type) { type = siType(r[map.type]); if (type === 'skip') return void out.skip++ }
    if (!type) type = o.sign === 'expense' ? 'expense' : o.sign === 'income' ? 'income' : o.sign === 'flip' ? (a < 0 ? 'income' : 'expense') : a < 0 ? 'expense' : 'income'
    const raw = map.cat && r[map.cat] != null ? String(r[map.cat]).trim().slice(0, 40) : '', canon = (CATS[type] || []).find((c) => c.toLowerCase() === raw.toLowerCase())
    const t = { type, amount: q(Math.abs(a)), category: canon || raw || 'Other', date, note: map.note && r[map.note] != null ? String(r[map.note]).trim().slice(0, 120) : '', wallet: o.wallet }
    if (t.amount <= 0) return void out.bad++
    if (o.skipDup && have.has([t.date, t.type, t.amount, t.wallet, t.note.toLowerCase()].join('|'))) return void out.dup++
    list.push(t)
  })
  return out
}

function SmartImport({ file, rows, keys, redirected, onBack, onClose }) {
  const { S, addTxBatch } = useApp()
  const det = useMemo(() => siDetect(keys, rows), [rows, keys])
  const [map, setMap] = useState(det), [wallet, setWallet] = useState(S.wallets[0].id), [order, setOrder] = useState('auto'), [skipDup, setSkipDup] = useState(true), [m, setM] = useState('')
  const [sign, setSign] = useState(() => (!det.type && !rows.slice(0, 200).some((r) => siNum(r[det.amount]) < 0) ? 'expense' : 'auto'))
  const samp = useMemo(() => Object.fromEntries(keys.map((k) => { const r = rows.find((x) => x[k] != null && x[k] !== ''); return [k, r ? String(r[k]).slice(0, 28) : ''] })), [rows, keys])
  const first = rows[0] || {}, ds = map.date ? siOrder(rows.map((r) => r[map.date])) : { any: false }
  const res = useMemo(() => siBuild(rows, map, { order, sign, wallet, skipDup, existing: S.tx }), [rows, map, order, sign, wallet, skipDup, S.tx])
  const W = S.wallets.find((w) => w.id === wallet) || S.wallets[0]
  const inc = q(res.list.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0)), exp = q(res.list.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0))
  const FIELDS = [['amount', 'Amount', true], ['date', 'Date', false], ['note', 'Note', false], ['cat', 'Category', false], ['type', 'Income / expense column', false]]
  const hints = { amount: 'Required.', date: 'If none, every row is dated today.', note: 'Optional.', cat: 'Optional. Unmatched names are kept as their own category.', type: 'Optional. Values like income / expense or credit / debit.' }
  const go = () => {
    if (!map.amount) return setM('Choose which field holds the amount.')
    if (!res.list.length) return setM('Nothing to import with this mapping. Check the Amount and Date fields.')
    addTxBatch(res.list); onClose()
  }
  return (
    <Sheet title="Map your data" onClose={onClose}>
      <div className="space-y-4">
        <div className="min-w-0"><div className="text-sm font-semibold truncate">{file}</div><div className="text-xs text-mu">{rows.length} row{rows.length === 1 ? '' : 's'} found{redirected ? ' · not a Budgy backup, so it opened in the Smart Importer' : ''}</div></div>
        <div>
          <div className="text-xs text-mu mb-1.5 px-1">First row of your file</div>
          <div className="glass-tile p-3 max-h-40 overflow-auto space-y-1">{keys.slice(0, 14).map((k) => <div key={k} className="flex gap-3 text-xs"><span className="text-mu shrink-0 max-w-[45%] truncate">{k}</span><span className="min-w-0 flex-1 text-right break-words">{first[k] == null || first[k] === '' ? '—' : String(first[k]).slice(0, 60)}</span></div>)}{keys.length > 14 && <div className="text-[11px] text-mu">+ {keys.length - 14} more fields</div>}</div>
        </div>
        <div className="space-y-3">
          {FIELDS.map(([f, l, req]) => (
            <Field key={f} label={l + (req ? ' *' : '')} hint={map[f] ? 'Map “' + map[f] + '” → ' + l + (samp[map[f]] ? ' · e.g. ' + samp[map[f]] : '') : hints[f]}>
              <select className="field" value={map[f]} onChange={(e) => { setMap({ ...map, [f]: e.target.value }); setM('') }}>
                {!req && <option value="">— None —</option>}{req && !map[f] && <option value="">Choose a field…</option>}
                {keys.map((k) => <option key={k} value={k}>{k}{samp[k] ? '  ·  ' + samp[k] : ''}</option>)}
              </select>
            </Field>
          ))}
        </div>
        <div className="space-y-3">
          {!map.type && <Field label="Amounts are" hint={sign === 'auto' ? 'Negative numbers become expenses, positive numbers become income.' : undefined}><select className="field" value={sign} onChange={(e) => setSign(e.target.value)}><option value="auto">Signed (− expense, + income)</option><option value="expense">All expenses</option><option value="income">All income</option><option value="flip">Reversed (+ expense, − income)</option></select></Field>}
          {ds.any && <Field label="Date format" hint={order === 'auto' && !ds.sure ? 'Dates like 05/03/2024 are ambiguous here; month first is assumed.' : undefined}><select className="field" value={order} onChange={(e) => setOrder(e.target.value)}><option value="auto">Auto-detect</option><option value="dmy">Day / Month / Year</option><option value="mdy">Month / Day / Year</option></select></Field>}
          <Field label="Import into wallet" hint="Expenses are deducted from it and income is added to it."><select className="field" value={wallet} onChange={(e) => setWallet(e.target.value)}>{S.wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={skipDup} onChange={(e) => setSkipDup(e.target.checked)} />Skip rows already in my transactions</label>
        </div>
        <div className="glass-tile p-3.5 space-y-3" aria-live="polite">
          <div className="grid grid-cols-3 gap-2"><Tile l="Income" v={'+' + php(inc)} tone="text-pos" /><Tile l="Expenses" v={'−' + php(exp)} tone="text-neg" /><Tile l="Net" v={(inc - exp < 0 ? '−' : '+') + php(Math.abs(q(inc - exp)))} tone={inc - exp < 0 ? 'text-neg' : 'text-pos'} /></div>
          <p className="text-xs text-mu">{res.list.length} will be imported into {W.name}{res.bad ? ' · ' + res.bad + ' skipped (missing or invalid amount / date)' : ''}{res.dup ? ' · ' + res.dup + ' duplicate' + (res.dup === 1 ? '' : 's') + ' skipped' : ''}{res.skip ? ' · ' + res.skip + ' transfer' + (res.skip === 1 ? '' : 's') + ' skipped' : ''}.</p>
          {res.list.slice(0, 3).map((t, i) => <div key={i} className="flex items-center gap-2 text-xs border-t border-fg/10 pt-2"><div className="min-w-0 flex-1"><div className="text-[13px] font-medium truncate">{t.note || t.category}</div><div className="text-mu truncate">{t.category} · {fd(t.date)}</div></div><span className={'tabular-nums font-semibold shrink-0 ' + (t.type === 'income' ? 'text-pos' : 'text-neg')}>{t.type === 'income' ? '+' : '−'}{php(t.amount)}</span></div>)}
        </div>
        <Err m={m} />
        <div className="flex gap-2"><button type="button" className="btn flex-1" onClick={onBack}>Back</button><button type="button" className="btn btn-p flex-[2]" disabled={!res.list.length} onClick={go}>Import {res.list.length} transaction{res.list.length === 1 ? '' : 's'}</button></div>
      </div>
    </Sheet>
  )
}

/* ---------- The sheet ---------- */
function DataSheet({ onClose }) {
  const { S, user, restoreData } = useApp(), fileRef = useRef(null), smartRef = useRef(null), [smart, setSmart] = useState(null)
  const [msg, setMsg] = useState(''), [ok, setOk] = useState(''), [pick, setPick] = useState(null), [withProfile, setWithProfile] = useState(true), [busy, setBusy] = useState(false)
  const stamp = off(0), rows = useMemo(() => buildTxRows(S), [S])
  const hasData = S.tx.length || S.debts.length || S.goals.length || S.wallets.length > 1 || S.wallets.some((w) => +w.balance)

  const exportJson = () => { setMsg(''); saveFile('budgy-backup-' + stamp + '.json', JSON.stringify(buildBackup(S), null, 2), 'application/json;charset=utf-8'); setOk('Backup downloaded. Keep it somewhere safe.') }
  const exportCsv = () => { setMsg(''); saveFile('budgy-transactions-' + stamp + '.csv', csvOut([['Date', 'Type', 'Category', 'Note', 'Wallet', 'To wallet', 'Amount (PHP)', 'Status'], ...rows]), 'text/csv;charset=utf-8', true); setOk('Transactions CSV downloaded.') }

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = ''
    setMsg(''); setOk(''); setPick(null); if (!f) return
    if (f.size > MAX_BACKUP_BYTES) return setMsg('That file is too large to be a Budgy backup.')
    if (!/\.json$/i.test(f.name) && f.type !== 'application/json') return setMsg('Choose a .json backup file. (CSV files are export-only.)')
    setBusy(true)
    const r = new FileReader()
    r.onerror = () => { setBusy(false); setMsg('Could not read that file. Please try again.') }
    r.onload = () => { setBusy(false); const text = String(r.result), res = parseBackup(text); if (res.error) { const sp = siParse(text); if (sp.rows) setSmart({ ...sp, file: f.name, redirected: true }); else setMsg(res.error) } else { setPick({ ...res, file: f.name }); setWithProfile(Object.keys(res.profile).length > 0) } }
    r.readAsText(f)
  }
  const onSmart = (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = ''
    setMsg(''); setOk(''); setPick(null); if (!f) return
    if (f.size > SI_MAX_BYTES) return setMsg('That file is too large to import.')
    if (!/\.json$/i.test(f.name) && f.type !== 'application/json') return setMsg('Choose a .json file.')
    setBusy(true)
    const r = new FileReader()
    r.onerror = () => { setBusy(false); setMsg('Could not read that file. Please try again.') }
    r.onload = () => { setBusy(false); const sp = siParse(String(r.result)); if (sp.error) setMsg(sp.error); else if (sp.native) setMsg('This is a Budgy backup. Use “Restore from backup” instead.'); else setSmart({ ...sp, file: f.name }) }
    r.readAsText(f)
  }
  const restore = () => {
    if (!pick) return
    const patch = { ...pick.data }
    if (withProfile) Object.assign(patch, pick.profile)
    restoreData(patch)
    setOk('Backup restored: ' + pick.counts.wallets + ' wallets, ' + pick.counts.tx + ' transactions, ' + pick.counts.debts + ' payables and receivables, ' + pick.counts.goals + ' goals.')
    setPick(null)
  }

  if (smart) return <SmartImport file={smart.file} rows={smart.rows} keys={smart.keys} redirected={smart.redirected} onBack={() => setSmart(null)} onClose={onClose} />
  return (
    <Sheet title="Import / Export Data" onClose={onClose}>
      <div className="space-y-5">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Export</h3>
          <button className="btn btn-p w-full !justify-start" onClick={exportJson}><Ic n="json" s={17} />Full backup (JSON)</button>
          <p className="text-xs text-mu -mt-0.5 px-1">Everything: wallets, transactions, payables, receivables, goals, allocations, name and appearance. Use it to restore or move to another device.</p>
          <button className="btn w-full !justify-start" onClick={exportCsv} disabled={!rows.length}><Ic n="dl" s={17} />Transactions (CSV)</button>
          <p className="text-xs text-mu -mt-0.5 px-1">{rows.length} transaction{rows.length === 1 ? '' : 's'}, all time, including payments on payables and receivables. Opens in Excel, Numbers and Google Sheets.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Import</h3>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onFile} aria-label="Choose a Budgy backup file" />
          <button className="btn w-full !justify-start" onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}><Ic n="upl" s={17} />{busy ? 'Reading file…' : 'Restore from backup (JSON)'}</button>
          {!pick && <p className="text-xs text-mu px-1">Choose a file exported from Budgy. You will see what it contains before anything is changed.</p>}
          {pick && (
            <div className="glass-tile p-3.5 space-y-3 fade" role="alert">
              <div className="min-w-0"><div className="text-sm font-semibold truncate">{pick.file}</div><div className="text-xs text-mu">{pick.at ? 'Exported ' + pick.at : 'Backup file'}</div></div>
              <div className="grid grid-cols-2 gap-2"><Tile l="Wallets" v={pick.counts.wallets} /><Tile l="Transactions" v={pick.counts.tx} /><Tile l="Payables / receivables" v={pick.counts.debts} /><Tile l="Goals" v={pick.counts.goals} /></div>
              {pick.skipped > 0 && <p className="text-xs text-mu">{pick.skipped} invalid or incomplete item{pick.skipped === 1 ? ' was' : 's were'} left out.</p>}
              {Object.keys(pick.profile).length > 0 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={withProfile} onChange={(e) => setWithProfile(e.target.checked)} />Also restore my name, avatar and appearance</label>}
              <p className="text-sm text-neg">{hasData ? 'This replaces all of your current wallets, transactions, payables, receivables and goals' + (user ? ', here and in your cloud account' : '') + '. Export a backup first if you might want them back.' : 'This fills your empty budget with the contents of this file.'}</p>
              <div className="flex gap-2"><button className="btn flex-1" onClick={() => setPick(null)}>Cancel</button><button className="btn btn-d flex-1" onClick={restore}>Replace my data</button></div>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Import from another app</h3>
          <input ref={smartRef} type="file" accept=".json,application/json" className="hidden" onChange={onSmart} aria-label="Choose a JSON transaction export from another app" />
          <button className="btn w-full !justify-start" onClick={() => smartRef.current && smartRef.current.click()} disabled={busy}><Ic n="upl" s={17} />Smart import transactions (JSON)</button>
          <p className="text-xs text-mu px-1">Works with JSON exports from other budget apps. Budgy guesses the amount, date, note and category fields, you confirm the mapping and pick a wallet, and nothing is saved until you tap Import. It adds to your data and can be undone.</p>
        </section>

        <Err m={msg} />
        {ok && <p className="text-sm text-pos flex gap-2" role="status"><Ic n="check" s={18} cls="shrink-0 mt-0.5" />{ok}</p>}
      </div>
    </Sheet>
  )
}

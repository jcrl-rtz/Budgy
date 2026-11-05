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

/* ---------- The sheet ---------- */
function DataSheet({ onClose }) {
  const { S, user, restoreData } = useApp(), fileRef = useRef(null)
  const [msg, setMsg] = useState(''), [ok, setOk] = useState(''), [pick, setPick] = useState(null), [withProfile, setWithProfile] = useState(true), [busy, setBusy] = useState(false)
  const stamp = off(0).replace(/-/g, ''), rows = useMemo(() => buildTxRows(S), [S])
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
    r.onload = () => { setBusy(false); const res = parseBackup(String(r.result)); if (res.error) setMsg(res.error); else { setPick({ ...res, file: f.name }); setWithProfile(Object.keys(res.profile).length > 0) } }
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

        <Err m={msg} />
        {ok && <p className="text-sm text-pos flex gap-2" role="status"><Ic n="check" s={18} cls="shrink-0 mt-0.5" />{ok}</p>}
      </div>
    </Sheet>
  )
}

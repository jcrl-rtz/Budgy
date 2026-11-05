/* =====================================================================
   p2.js  (Phase 2)
   Entry sheets, Pending (payables + receivables), Allocate (Smart Plan), Goals, Reports.
   Loaded after pages.js and before app.js. Shares the global scope with the other files.
   ===================================================================== */
Object.assign(IC, {
  chev: ['m6 9 6 6 6-6'],
  dl: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  file: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M8 13h8', 'M8 17h5'],
  hist: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5', 'M12 7v5l3 2']
})

const CATS = { expense: ['Food', 'Rent', 'Transport', 'Bills', 'Fun', 'Shopping', 'Health', 'Other'], income: ['Salary', 'Freelance', 'Allowance', 'Gift', 'Other'] }
// Phase 2B: there are NO built-in sources. The Pending tab starts empty; every source is one the user adds with "+ Add New Source" (stored in S.srcs).
const BASE = { payable: [], receivable: [] }
const catsFor = (S, k) => [...BASE[k], ...(S.srcs || []).filter((x) => x.kind === k && !BASE[k].includes(x.name)).map((x) => x.name)]
const daysTo = (d) => Math.round((new Date(d + 'T00:00') - new Date(off(0) + 'T00:00')) / 864e5)
const dueTxt = (d) => { const n = daysTo(d); return n < 0 ? Math.abs(n) + 'd overdue' : n === 0 ? 'Due today' : 'Due in ' + n + 'd' }
const WOpts = ({ ws, c }) => ws.map((w) => <option key={w.id} value={w.id}>{w.name} · {php(c.bal[w.id])}</option>)

/* Collapsible glass card. Closed by default so screens stay quiet until you ask for detail. */
function Fold({ title, right, open: o0 = false, i = 0, children }) {
  const [o, setO] = useState(o0)
  return (
    <Glass i={i} className="p-4 sm:p-5">
      <button className="w-full flex items-center justify-between gap-3 text-left" aria-expanded={o} onClick={() => setO(!o)}>
        <span className="font-semibold min-w-0">{title}</span>
        <span className="flex items-center gap-2 text-sm text-mu shrink-0">{right}<Ic n="chev" s={18} cls={'transition-transform ' + (o ? 'rotate-180' : '')} /></span>
      </button>
      {o && <div className="mt-4 fade">{children}</div>}
    </Glass>
  )
}

/* ---------- Sheets ---------- */
function TxSheet({ kind: k0, preset, onClose }) {
  const { S, c, addTx } = useApp()
  const [k, setK] = useState(k0 || 'expense'), [m, setM] = useState('')
  const P = preset || {}
  const [f, setF] = useState({ amount: P.amount || '', category: P.category || '', wallet: P.wallet || S.wallets[0].id, to: P.to || (S.wallets[1] || S.wallets[0]).id, date: P.date || off(0), note: P.note || '' })
  const u = (key) => (e) => setF({ ...f, [key]: e.target.value })
  const save = () => {
    if (!money(f.amount) || +f.amount <= 0) return setM('Enter an amount greater than zero with at most two decimals.')
    if (k === 'transfer' && f.wallet === f.to) return setM('Pick two different wallets.')
    if (k !== 'income' && f.date <= off(0) && +f.amount > c.bal[f.wallet]) return setM('That wallet only has ' + php(c.bal[f.wallet]) + '.')
    addTx({ type: k, amount: +f.amount, category: k === 'transfer' ? 'Transfer' : f.category || CATS[k][0], date: f.date, note: f.note.trim(), wallet: f.wallet, ...(k === 'transfer' ? { to: f.to } : {}) })
    onClose()
  }
  return (
    <Sheet title="Add transaction" onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save() }}>
        <div className="glass-tile p-1 grid grid-cols-3 gap-1">{['expense', 'income', 'transfer'].map((t) => <button type="button" key={t} aria-pressed={k === t} onClick={() => { setK(t); setF({ ...f, category: '' }) }} className={'btn !border-transparent capitalize ' + (k === t ? 'btn-p' : '!bg-transparent')}>{t}</button>)}</div>
        <Field label="Amount (PHP)"><input className="field" autoFocus inputMode="decimal" placeholder="0.00" value={f.amount} onChange={u('amount')} /></Field>
        {k !== 'transfer' && <Field label="Category"><select className="field" value={f.category || CATS[k][0]} onChange={u('category')}>{CATS[k].map((x) => <option key={x}>{x}</option>)}</select></Field>}
        <Field label={k === 'transfer' ? 'From wallet' : 'Wallet'}><select className="field" value={f.wallet} onChange={u('wallet')}><WOpts ws={S.wallets} c={c} /></select></Field>
        {k === 'transfer' && <Field label="To wallet"><select className="field" value={f.to} onChange={u('to')}><WOpts ws={S.wallets} c={c} /></select></Field>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><input className="field" type="date" value={f.date} onChange={u('date')} /></Field>
          <Field label="Note"><input className="field" maxLength={40} placeholder="Optional" value={f.note} onChange={u('note')} /></Field>
        </div>
        <Err m={m} />
        <button type="submit" className="btn btn-p w-full">Save {k}</button>
      </form>
    </Sheet>
  )
}

// Add or edit a payable / receivable. The category list ends with "+ Add New Source".
function DebtSheet({ kind, item, preset, fill, onClose }) {
  const { S, addDebt, updDebt, set } = useApp(), cats = catsFor(S, kind), pay = kind === 'payable'
  const F = fill || {}
  const [f, setF] = useState({ party: item ? item.party : F.party || '', total: item ? String(item.total) : F.total || '', due: item ? item.due : F.due || off(14), cat: item ? item.cat : preset || cats[0] || '__new', nc: '' }), [m, setM] = useState('')
  const u = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const all = item && !cats.includes(item.cat) ? [...cats, item.cat] : cats
  const save = () => {
    const nc = f.nc.trim(), isNew = f.cat === '__new', hit = all.find((x) => x.toLowerCase() === nc.toLowerCase()), cat = isNew ? hit || nc : f.cat
    if (!f.party.trim()) return setM('Enter a name or description.')
    if (!money(f.total) || +f.total <= 0) return setM('Enter an amount greater than zero with at most two decimals.')
    if (item && +f.total < (item.paid || 0)) return setM('The total can’t be lower than the ' + php(item.paid) + ' already settled.')
    if (!cat) return setM('Name the new source.')
    if (!f.due) return setM('Pick a due date.')
    if (isNew && !hit) set({ srcs: [...(S.srcs || []), { kind, name: nc }] })
    const p = { party: f.party.trim(), total: +f.total, due: f.due, cat }
    item ? updDebt(item.id, p) : addDebt({ kind, wallet: S.wallets[0].id, ...p })
    onClose()
  }
  return (
    <Sheet title={(item ? 'Edit ' : 'Add ') + kind} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save() }}>
        <Field label={pay ? 'Who or what do you owe?' : 'Who owes you?'}><input className="field" autoFocus maxLength={40} placeholder={pay ? 'e.g. Phone installment' : 'e.g. Monthly allowance'} value={f.party} onChange={u('party')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Total (PHP)"><input className="field" inputMode="decimal" placeholder="0.00" value={f.total} onChange={u('total')} /></Field>
          <Field label="Due date"><input className="field" type="date" value={f.due} onChange={u('due')} /></Field>
        </div>
        <Field label="Category"><select className="field" value={f.cat} onChange={u('cat')}>{all.map((x) => <option key={x}>{x}</option>)}<option value="__new">+ Add New Source</option></select></Field>
        {f.cat === '__new' && <Field label="New source name"><input className="field" maxLength={24} placeholder="e.g. Credit Card" value={f.nc} onChange={u('nc')} /></Field>}
        <Err m={m} />
        <button type="submit" className="btn btn-p w-full">{item ? 'Save changes' : 'Add ' + kind}</button>
      </form>
    </Sheet>
  )
}

// Partial or full payment. Payables are paid from a wallet that has the money; receivables land in the wallet you choose.
function PaySheet({ item, onClose }) {
  const { S, c, payDebt } = useApp(), pay = item.kind === 'payable', left = rem(item)
  const [v, setV] = useState(''), [m, setM] = useState('')
  const [w, setW] = useState(S.wallets.some((x) => x.id === item.wallet) ? item.wallet : S.wallets[0].id)
  const save = () => {
    if (!money(v) || +v <= 0) return setM('Enter an amount greater than zero with at most two decimals.')
    if (q(+v) > left) return setM('That’s more than the remaining ' + php(left) + '.')
    if (pay && +v > c.bal[w]) return setM('This wallet only has ' + php(c.bal[w]) + '. Pick another or pay less.')
    payDebt(item.id, q(+v), w); onClose()
  }
  return (
    <Sheet title={pay ? 'Record payment' : 'Record receipt'} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save() }}>
        <div className="glass-tile p-3 flex items-center justify-between gap-3"><div className="min-w-0"><div className="font-semibold truncate">{item.party}</div><div className="text-xs text-mu">{item.cat}</div></div><div className="text-right"><div className="text-[11px] text-mu">Remaining</div><div className="font-semibold tabular-nums">{php(left)}</div></div></div>
        <Field label="Amount (PHP)" hint="Partial amounts are fine."><input className="field" autoFocus inputMode="decimal" placeholder="0.00" value={v} onChange={(e) => setV(e.target.value)} /></Field>
        <button type="button" className="btn !py-1.5 !text-xs" onClick={() => setV(String(pay ? Math.min(left, Math.max(0, c.bal[w])) : left))}>{pay ? 'Pay the most this wallet allows' : 'Full remaining amount'}</button>
        <Field label={pay ? 'Pay from' : 'Receive into'}><select className="field" value={w} onChange={(e) => setW(e.target.value)}><WOpts ws={S.wallets} c={c} /></select></Field>
        <Err m={m} />
        <button type="submit" className="btn btn-p w-full">{pay ? 'Record payment' : 'Record receipt'}</button>
      </form>
    </Sheet>
  )
}

function GoalSheet({ item, onClose }) {
  const { addGoal, updGoal } = useApp()
  const [f, setF] = useState({ name: item ? item.name : '', target: item ? String(item.target) : '' }), [m, setM] = useState('')
  const save = () => {
    if (!f.name.trim()) return setM('Name your goal.')
    if (!money(f.target) || +f.target <= 0) return setM('Enter a target greater than zero with at most two decimals.')
    if (item && +f.target < item.saved) return setM('The target can’t be lower than the ' + php(item.saved) + ' already saved.')
    item ? updGoal(item.id, { name: f.name.trim(), target: +f.target }) : addGoal({ name: f.name.trim(), target: +f.target })
    onClose()
  }
  return (
    <Sheet title={item ? 'Edit goal' : 'New goal'} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save() }}>
        <Field label="Goal name"><input className="field" autoFocus maxLength={30} placeholder="e.g. Emergency Fund" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Target (PHP)"><input className="field" inputMode="decimal" placeholder="0.00" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} /></Field>
        <Err m={m} />
        <button type="submit" className="btn btn-p w-full">{item ? 'Save changes' : 'Create goal'}</button>
      </form>
    </Sheet>
  )
}

// Add Money safety: the amount can't pass the goal's remaining target, nor the spendable balance (cash not already locked).
function MoneySheet({ item, onClose }) {
  const { c, addToGoal } = useApp(), need = q(item.target - item.saved), cash = Math.max(0, c.spendable), lim = q(Math.min(need, cash))
  const [v, setV] = useState(''), [m, setM] = useState('')
  const save = () => {
    if (!money(v) || +v <= 0) return setM('Enter an amount greater than zero with at most two decimals.')
    if (q(+v) > need) return setM('That’s more than the remaining target of ' + php(need) + '.')
    if (q(+v) > cash) return setM('That’s more than your spendable balance of ' + php(cash) + '.')
    addToGoal(item.id, q(+v)); onClose()
  }
  return (
    <Sheet title={'Add money · ' + item.name} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save() }}>
        <div className="grid grid-cols-2 gap-2"><Tile l="Remaining target" v={php(need)} /><Tile l="Spendable balance" v={php(cash)} tone={cash === 0 ? 'text-neg' : ''} /></div>
        <Field label="Amount (PHP)" hint={'You can add up to ' + php(lim) + ' right now.'}><input className="field" autoFocus inputMode="decimal" placeholder="0.00" value={v} onChange={(e) => setV(e.target.value)} /></Field>
        <button type="button" className="btn !py-1.5 !text-xs" disabled={lim <= 0} onClick={() => setV(String(lim))}>Add the maximum</button>
        <Err m={m} />
        <button type="submit" className="btn btn-p w-full" disabled={lim <= 0}>Add money</button>
      </form>
    </Sheet>
  )
}

/* ---------- Reports ---------- */
const csv = (rows) => rows.map((r) => r.map((v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\r\n')
const download = (name, text) => {
  const url = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a')
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000)
}

function ReportSheet({ onClose }) {
  const { S, c } = useApp(), [p, setP] = useState('month'), t0 = off(0), mo = t0.slice(0, 7)
  const W = Object.fromEntries(S.wallets.map((w) => [w.id, w.name])), nm = (id) => W[id] || 'Removed'
  const rows = [
    ...S.tx.filter((x) => x.date <= t0).map((x) => [x.date, x.type, x.category, x.note || '', nm(x.wallet), x.type === 'transfer' ? nm(x.to) : '', x.amount]),
    ...S.debts.flatMap((d) => (d.payments || []).map((y) => [y.date, d.kind === 'payable' ? 'expense' : 'income', d.cat, (d.kind === 'payable' ? 'Paid · ' : 'Received · ') + d.party, nm(y.wallet), '', y.amount]))
  ].filter((r) => p === 'all' || r[0].startsWith(mo)).sort((a, b) => b[0].localeCompare(a[0]))
  const sum = (t) => q(rows.filter((r) => r[1] === t).reduce((a, r) => a + r[6], 0)), inc = sum('income'), exp = sum('expense')
  const cat = {}; rows.filter((r) => r[1] === 'expense').forEach((r) => { cat[r[2]] = q((cat[r[2]] || 0) + r[6]) })
  const top = Object.entries(cat).sort((a, b) => b[1] - a[1]).slice(0, 5), label = p === 'all' ? 'All time' : c.monthName + ' ' + t0.slice(0, 4)
  const stamp = t0.replace(/-/g, '')
  const txCsv = () => download('budgy-transactions-' + stamp + '.csv', csv([['Date', 'Type', 'Category', 'Note', 'Wallet', 'To wallet', 'Amount (PHP)'], ...rows]))
  const sumCsv = () => download('budgy-summary-' + stamp + '.csv', csv([
    ['Budgy summary', label], ['Generated', t0], [],
    ['Income', inc], ['Expenses', exp], ['Net cash flow', q(inc - exp)], [],
    ['Liquid cash', c.liquid], ['Allocated', c.allocated], ['Spendable', c.spendable], ['Total payables', c.pay], ['Total receivables', c.rec], ['Net worth', c.net], [],
    ['Wallet', 'Type', 'Balance'], ...S.wallets.map((w) => [w.name, w.type, c.bal[w.id]]), [],
    ['Goal', 'Saved', 'Target'], ...S.goals.map((g) => [g.name, g.saved, g.target]), [],
    ['Expense category', 'Amount'], ...Object.entries(cat).sort((a, b) => b[1] - a[1])
  ]))
  return (
    <Sheet title="Reports" onClose={onClose}>
      <div className="space-y-4">
        <div className="glass-tile p-1 grid grid-cols-2 gap-1">{[['month', 'This month'], ['all', 'All time']].map(([k, l]) => <button key={k} aria-pressed={p === k} onClick={() => setP(k)} className={'btn !border-transparent ' + (p === k ? 'btn-p' : '!bg-transparent')}>{l}</button>)}</div>
        <div className="grid grid-cols-3 gap-2"><Tile l="Income" v={php(inc)} tone="text-pos" /><Tile l="Expenses" v={php(exp)} tone="text-neg" /><Tile l="Net" v={php(q(inc - exp))} tone={inc - exp < 0 ? 'text-neg' : 'text-pos'} /></div>
        <div className="grid grid-cols-2 gap-2"><Tile l="Liquid cash" v={php(c.liquid)} /><Tile l="Net worth" v={php(c.net)} tone={c.net < 0 ? 'text-neg' : ''} /><Tile l="Payables" v={php(c.pay)} /><Tile l="Receivables" v={php(c.rec)} /></div>
        <div>
          <div className="text-sm font-semibold mb-2">Top expenses · {label}</div>
          {top.length ? <div className="space-y-2.5">{top.map(([k, v]) => <div key={k}><div className="flex justify-between text-xs mb-1"><span className="text-mu">{k}</span><span className="tabular-nums">{php(v)}</span></div><Bar pct={(v / top[0][1]) * 100} /></div>)}</div> : <p className="text-sm text-mu">No expenses in this period.</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button className="btn btn-p" onClick={txCsv} disabled={!rows.length}><Ic n="dl" s={16} />Transactions CSV</button>
          <button className="btn" onClick={sumCsv}><Ic n="dl" s={16} />Summary CSV</button>
        </div>
        <p className="text-xs text-mu">{rows.length} transaction{rows.length === 1 ? '' : 's'} in this period. CSV files open in Excel, Numbers and Google Sheets.</p>
      </div>
    </Sheet>
  )
}

function P2Sheets({ sheet: s, onClose }) {
  if (s.k === 'tx') return <TxSheet kind={s.kind} preset={s.preset} onClose={onClose} />
  if (s.k === 'debt') return <DebtSheet kind={s.kind} item={s.item} preset={s.preset} fill={s.fill} onClose={onClose} />
  if (s.k === 'pay') return <PaySheet item={s.item} onClose={onClose} />
  if (s.k === 'goal') return <GoalSheet item={s.item} onClose={onClose} />
  if (s.k === 'gmoney') return <MoneySheet item={s.item} onClose={onClose} />
  if (s.k === 'report') return <ReportSheet onClose={onClose} />
  return null
}

function QuickAddSheet({ onClose, openSheet }) {
  const rows = [['Expense', 'down', { k: 'tx', kind: 'expense' }], ['Income', 'up', { k: 'tx', kind: 'income' }], ['Transfer', 'swap', { k: 'tx', kind: 'transfer' }], ['Payable', 'clock', { k: 'debt', kind: 'payable', item: null }], ['Receivable', 'clock', { k: 'debt', kind: 'receivable', item: null }], ['Savings goal', 'target', { k: 'goal', item: null }], ['Wallet', 'wallet', { k: 'wallet', item: null }]]
  return (
    <Sheet title="Quick add" onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {rows.map(([l, i, s], n) => <button key={l} className={'btn !justify-start !rounded-2xl !py-3.5 ' + (n === 0 ? 'btn-p sm:col-span-2' : '')} onClick={() => openSheet(s)}><Ic n={i} s={18} />{l}</button>)}
      </div>
    </Sheet>
  )
}

/* ---------- Pending ---------- */
// Phase 3: every payable / receivable has its own clearly visible Delete button (red, with a bin icon and the word "Delete").
// It asks once, inline, before removing the item together with its payment history.
function DebtDelete({ d, onYes }) {
  const [on, setOn] = useState(false)
  return (
    <div className="pt-3 border-t border-bd/60">
      {!on ? (
        <button type="button" className="btn btn-d w-full !py-2 !text-sm" aria-label={'Delete ' + d.party} onClick={() => setOn(true)}><Ic n="trash" s={16} />Delete</button>
      ) : (
        <div className="space-y-2 fade" role="alert">
          <p className="text-sm text-neg">Delete “{d.party}”? {(d.payments || []).length ? 'Its payment history is deleted too and those payments go back to your wallets. ' : ''}This can’t be undone.</p>
          <div className="flex gap-2">
            <button type="button" className="btn flex-1" onClick={() => setOn(false)}>Cancel</button>
            <button type="button" className="btn btn-d flex-1 !bg-neg !text-white" onClick={onYes}><Ic n="trash" s={16} />Yes, delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

function DebtRow({ d, openSheet }) {
  const { S, delDebt } = useApp(), [h, setH] = useState(false)
  const pay = d.kind === 'payable', r = rem(d), done = r <= 0, late = !done && d.due < off(0), W = Object.fromEntries(S.wallets.map((w) => [w.id, w.name]))
  return (
    <div className="glass-tile p-3.5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><div className="font-medium truncate">{d.party}</div><div className={'text-xs ' + (late ? 'text-neg' : done ? 'text-pos' : 'text-mu')}>{done ? 'Settled' : dueTxt(d.due)} · {fd(d.due)}</div></div>
        <div className="text-right shrink-0"><div className="font-semibold tabular-nums">{php(Math.max(0, r))}</div><div className="text-[11px] text-mu">of {php(d.total)}</div></div>
      </div>
      <Bar pct={((d.paid || 0) / d.total) * 100} />
      <div className="flex flex-wrap items-center gap-2">
        {!done && <button className="btn btn-p !py-1.5 !px-3 !text-xs" onClick={() => openSheet({ k: 'pay', item: d })}>{pay ? 'Pay' : 'Receive'}</button>}
        <button className="btn !py-1.5 !px-3 !text-xs" aria-expanded={h} onClick={() => setH(!h)}><Ic n="hist" s={14} />{h ? 'Hide history' : 'View history'}</button>
        <button className="btn btn-i !w-8 !h-8" aria-label={'Edit ' + d.party} onClick={() => openSheet({ k: 'debt', kind: d.kind, item: d })}><Ic n="pen" s={14} /></button>
      </div>
      <DebtDelete d={d} onYes={() => delDebt(d.id)} />
      {h && (
        <div className="space-y-1.5 fade">
          {(d.payments || []).length ? d.payments.slice().reverse().map((p) => <div key={p.id} className="flex justify-between gap-3 text-xs"><span className="text-mu truncate">{fd(p.date)} · {W[p.wallet] || 'Removed'}</span><span className="tabular-nums">{pay ? '−' : '+'}{php(p.amount)}</span></div>) : <p className="text-xs text-mu">No payments recorded yet.</p>}
        </div>
      )}
    </div>
  )
}

function Pending({ openSheet }) {
  const { S, c } = useApp()
  const [kind, setKind] = useState('payable'), [cat, setCat] = useState('all'), [open, setOpen] = useState({})
  const pay = kind === 'payable', mine = S.debts.filter((d) => d.kind === kind), cats = catsFor(S, kind)
  mine.forEach((d) => { if (!cats.includes(d.cat)) cats.push(d.cat) })
  const groups = cats.filter((k) => cat === 'all' || k === cat).map((k) => ({ k, items: mine.filter((d) => d.cat === k).sort((a, b) => (rem(a) <= 0) - (rem(b) <= 0) || a.due.localeCompare(b.due)) }))
  const isOpen = (k) => open[k] !== false // groups start expanded so every item (and its Delete button) is visible
  const allOpen = groups.length > 0 && groups.every((g) => isOpen(g.k))
  const late = mine.filter((d) => rem(d) > 0 && d.due < off(0)).length
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Tile l="Total payables" v={php(c.pay)} tone={c.pay > 0 ? 'text-neg' : ''} /><Tile l="Total receivables" v={php(c.rec)} tone={c.rec > 0 ? 'text-pos' : ''} />
      </div>
      <div className="glass !rounded-full p-1 grid grid-cols-2 gap-1" role="tablist">
        {[['payable', 'Payables'], ['receivable', 'Receivables']].map(([k, l]) => <button key={k} role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setCat('all'); setOpen({}) }} className={'btn !border-transparent ' + (kind === k ? 'btn-p' : '!bg-transparent')}>{l}</button>)}
      </div>
      <div className="chips" role="tablist" aria-label="Filter by category">
        {[['all', 'All'], ...cats.map((k) => [k, k])].map(([k, l]) => <button key={k} role="tab" aria-selected={cat === k} onClick={() => setCat(k)} className={'btn ' + (cat === k ? 'btn-p' : '')}>{l}</button>)}
        <button className="btn" onClick={() => openSheet({ k: 'debt', kind, item: null, preset: '__new' })}><Ic n="plus" s={14} />Add New Source</button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-mu">{late ? <span className="text-neg">{late} overdue</span> : 'Nothing overdue'}</span>
        <div className="flex gap-2">
          <button className="btn !py-1.5 !text-xs" onClick={() => setOpen({ ...open, ...Object.fromEntries(groups.map((g) => [g.k, !allOpen])) })}>{allOpen ? 'Collapse all' : 'Expand all'}</button>
          <button className="btn btn-p !py-1.5 !text-xs" onClick={() => openSheet({ k: 'debt', kind, item: null })}><Ic n="plus" s={14} />Add {pay ? 'payable' : 'receivable'}</button>
        </div>
      </div>
      {!groups.length && <Empty t={'No ' + (pay ? 'payable' : 'receivable') + ' sources yet. Tap “Add New Source” to create your first category, or use “Add ' + (pay ? 'payable' : 'receivable') + '”.'} />}
      <div className="space-y-3">
        {groups.map((g) => {
          const on = isOpen(g.k), t = q(g.items.reduce((a, d) => a + Math.max(0, rem(d)), 0))
          return (
            <Glass key={g.k} className="p-4 sm:p-5">
              <button className="w-full flex items-center justify-between gap-3 text-left" aria-expanded={on} onClick={() => setOpen({ ...open, [g.k]: !on })}>
                <span className="min-w-0"><span className="font-semibold">{g.k}</span><span className="block text-xs text-mu">{g.items.length} item{g.items.length === 1 ? '' : 's'}</span></span>
                <span className="flex items-center gap-2 shrink-0"><span className="font-semibold tabular-nums">{php(t)}</span><Ic n="chev" s={18} cls={'text-mu transition-transform ' + (on ? 'rotate-180' : '')} /></span>
              </button>
              {on && <div className="mt-3 space-y-3 fade">{g.items.length ? g.items.map((d) => <DebtRow key={d.id} d={d} openSheet={openSheet} />) : <Empty t={'Nothing in ' + g.k + ' yet.'} />}</div>}
            </Glass>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Allocate (Smart Plan) ---------- */
function Allocate() {
  const { S, c, setAlloc } = useApp()
  const pays = S.debts.filter((d) => d.kind === 'payable' && rem(d) > 0).sort((a, b) => a.due.localeCompare(b.due))
  const recs = S.debts.filter((d) => d.kind === 'receivable' && rem(d) > 0).sort((a, b) => a.due.localeCompare(b.due))
  const cur = (d) => Math.min(S.alloc['d:' + d.id] || 0, rem(d)), short = (d) => q(rem(d) - cur(d))
  const cash = Math.max(0, c.spendable), totalShort = q(pays.reduce((a, d) => a + short(d), 0))
  const urgent = pays.filter((d) => short(d) > 0 && d.due <= off(14))
  // Smart Plan: fund payables earliest-due first from cash that isn't locked in goals.
  const smart = () => { let free = Math.max(0, q(c.liquid - c.saved)); const p = {}; pays.forEach((d) => { const a = Math.min(rem(d), free); p['d:' + d.id] = a; free = q(free - a) }); setAlloc(p) }
  const clear = () => setAlloc(Object.fromEntries(pays.map((d) => ['d:' + d.id, 0])))
  const preview = (amt) => { const nc = q(cash + amt), cov = Math.min(nc, totalShort); return { nc, cov, left: q(totalShort - cov), spare: q(nc - cov) } }
  const recAll = q(recs.reduce((a, d) => a + rem(d), 0))
  return (
    <div className="space-y-4">
      <Glass className="p-5" style={{ background: 'linear-gradient(135deg, rgb(var(--a) / .26), rgb(var(--s1) / .5) 70%)', borderColor: 'rgb(var(--a) / .3)' }}>
        <div className="text-sm text-mu">Unallocated cash</div>
        <div className={'text-3xl font-semibold tracking-tight mt-1 tabular-nums ' + (c.spendable < 0 ? 'text-neg' : '')}><Num v={c.spendable} /></div>
        <div className="mt-3"><Bar lg pct={(c.allocated / Math.max(c.liquid, 1)) * 100} /></div>
        <div className="text-xs text-mu mt-2">{php(c.allocated)} of {php(c.liquid)} is locked{c.spendable < 0 ? '. Your allocations are higher than your cash.' : '.'}</div>
        <div className="flex flex-wrap gap-2 mt-4"><button className="btn btn-p" onClick={smart} disabled={!pays.length}><Ic n="sparkle" s={16} />Smart Plan</button><button className="btn" onClick={clear} disabled={!pays.length}>Clear plan</button></div>
      </Glass>

      {urgent.length > 0 && (
        <Glass className="p-4 sm:p-5" style={{ borderColor: 'rgb(var(--neg) / .4)' }} role="alert">
          <div className="flex items-center gap-2 font-semibold text-neg"><Ic n="alert" s={18} />Priority payables are short</div>
          <div className="mt-3 space-y-2">{urgent.map((d) => <div key={d.id} className="flex justify-between gap-3 text-sm"><span className="min-w-0 truncate">{d.party}<span className="text-xs text-mu"> · {dueTxt(d.due)}</span></span><span className="text-neg tabular-nums whitespace-nowrap">Short {php(short(d))}</span></div>)}</div>
          <p className="text-xs text-mu mt-3">{cash >= totalShort ? 'You have enough spendable cash to cover these. Tap Smart Plan.' : 'Spendable cash covers ' + php(cash) + ' of the ' + php(totalShort) + ' still unfunded.'}</p>
        </Glass>
      )}

      <Glass className="p-4 sm:p-5">
        <h3 className="font-semibold">Target allocation</h3>
        <p className="text-xs text-mu mt-1">Drag to set aside cash for each payable, earliest due first. Locked money leaves your spendable balance.</p>
        <div className="mt-4 space-y-5">
          {pays.length ? pays.map((d) => {
            const a = cur(d), mx = q(Math.min(rem(d), a + cash)), s = short(d)
            return (
              <div key={d.id}>
                <div className="flex justify-between gap-3 text-sm"><span className="min-w-0 truncate">{d.party}<span className="text-xs text-mu"> · {d.cat} · {dueTxt(d.due)}</span></span><span className="tabular-nums whitespace-nowrap">{php(a)}</span></div>
                <input type="range" min="0" max={mx} step="0.01" value={Math.min(a, mx)} aria-label={'Amount to allocate to ' + d.party} onChange={(e) => setAlloc({ ['d:' + d.id]: q(Math.min(+e.target.value, mx)) })} />
                <div className="flex items-center justify-between gap-2 text-xs"><span className={s > 0 ? 'text-neg' : 'text-pos'}>{s > 0 ? 'Short ' + php(s) + ' of ' + php(rem(d)) : 'Fully funded'}</span><button className="btn !py-1 !px-2.5 !text-[11px]" onClick={() => setAlloc({ ['d:' + d.id]: mx })}>Max</button></div>
              </div>
            )
          }) : <Empty t="No open payables to plan for." />}
        </div>
      </Glass>

      <Fold title="Unallocated cash breakdown" right={<span className="tabular-nums">{php(c.spendable)}</span>}>
        <div className="space-y-2 text-sm">
          {[['Liquid cash', c.liquid, ''], ['Reserved for payables', -c.allocD, 'text-ac'], ['Locked in savings goals', -c.saved, 'text-ac']].map(([l, v, t]) => <div key={l} className="flex justify-between gap-3"><span className="text-mu">{l}</span><span className={'tabular-nums ' + t}>{v < 0 ? '−' : ''}{php(Math.abs(v))}</span></div>)}
          <div className="flex justify-between gap-3 border-t border-fg/10 pt-2 font-semibold"><span>Spendable</span><span className={'tabular-nums ' + (c.spendable < 0 ? 'text-neg' : '')}>{php(c.spendable)}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">{S.wallets.map((w) => <Tile key={w.id} l={w.name} v={php(c.bal[w.id])} tone={c.bal[w.id] < 0 ? 'text-neg' : ''} />)}</div>
      </Fold>

      <Fold title="If your receivables arrive" right={<span className="tabular-nums">{recs.length ? '+' + php(recAll) : 'none'}</span>}>
        {recs.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...(recs.length > 1 ? [{ id: 'all', party: 'Everything owed to you', due: '', amt: recAll }] : []), ...recs.map((d) => ({ id: d.id, party: d.party, due: d.due, amt: rem(d) }))].map((r) => {
              const p = preview(r.amt)
              return (
                <div key={r.id} className="glass-tile p-3.5">
                  <div className="flex justify-between gap-3"><div className="min-w-0"><div className="font-medium truncate">{r.party}</div>{r.due && <div className="text-xs text-mu">{dueTxt(r.due)}</div>}</div><div className="text-pos font-semibold tabular-nums whitespace-nowrap">+{php(r.amt)}</div></div>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-mu">Spendable becomes</span><span className="tabular-nums">{php(p.nc)}</span></div>
                    <div className="flex justify-between"><span className="text-mu">Unfunded payables covered</span><span className="tabular-nums">{php(p.cov)}</span></div>
                    <div className="flex justify-between"><span className="text-mu">{p.left > 0 ? 'Still short' : 'Left over'}</span><span className={'tabular-nums ' + (p.left > 0 ? 'text-neg' : 'text-pos')}>{php(p.left > 0 ? p.left : p.spare)}</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : <Empty t="No receivables are waiting." />}
      </Fold>
    </div>
  )
}

/* ---------- Goals ---------- */
function GoalRow({ g, openSheet }) {
  const { delGoal } = useApp(), [o, setO] = useState(false), pc = (g.saved / g.target) * 100, done = g.saved >= g.target
  return (
    <Glass className="p-4 sm:p-5">
      <button className="w-full text-left" aria-expanded={o} onClick={() => setO(!o)}>
        <div className="flex items-center justify-between gap-3"><span className="font-semibold truncate">{g.name}</span><span className="flex items-center gap-2 text-sm shrink-0"><span className={done ? 'text-pos' : 'text-mu'}>{done ? 'Completed' : pct1(pc)}</span><Ic n="chev" s={18} cls={'text-mu transition-transform ' + (o ? 'rotate-180' : '')} /></span></div>
        <div className="mt-3"><Bar lg pct={pc} /></div>
        <div className="flex justify-between text-xs text-mu mt-2 tabular-nums"><span>{php(g.saved)} saved</span><span>{php(g.target)}</span></div>
      </button>
      {o && (
        <div className="mt-4 space-y-3 fade">
          <Tile l="Remaining" v={php(Math.max(0, q(g.target - g.saved)))} />
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-p !py-1.5 !px-3 !text-xs" disabled={done} onClick={() => openSheet({ k: 'gmoney', item: g })}><Ic n="plus" s={14} />Add money</button>
            <button className="btn !py-1.5 !px-3 !text-xs" onClick={() => openSheet({ k: 'goal', item: g })}><Ic n="pen" s={14} />Edit</button>
            <Confirm danger label="Delete" yes="Yes, delete" warn={g.saved > 0 ? 'Deleting this goal releases its ' + php(g.saved) + ' back to your spendable balance.' : 'This goal will be removed.'} onYes={() => delGoal(g.id)} />
          </div>
        </div>
      )}
    </Glass>
  )
}

function GoalsPage({ openSheet }) {
  const { S, c } = useApp()
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3"><Tile l="Total saved" v={php(c.saved)} tone="text-ac" /><Tile l="Spendable balance" v={php(c.spendable)} tone={c.spendable < 0 ? 'text-neg' : ''} /></div>
      <div className="flex items-center justify-between gap-3"><span className="text-xs text-mu">{S.goals.length} goal{S.goals.length === 1 ? '' : 's'} · {pct1((c.saved / Math.max(c.target, 1)) * 100)} overall</span><button className="btn btn-p !py-1.5 !text-xs" onClick={() => openSheet({ k: 'goal', item: null })}><Ic n="plus" s={14} />New goal</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">{S.goals.map((g) => <GoalRow key={g.id} g={g} openSheet={openSheet} />)}</div>
      {!S.goals.length && <Empty t="No savings goals yet. Create one to start saving toward it." />}
    </div>
  )
}

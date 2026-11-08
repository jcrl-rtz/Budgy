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
function TxSheet({ kind: k0, preset, item, onClose }) {
  const { S, c, addTx, updTx, delTx } = useApp()
  const edit = !!item
  const [k, setK] = useState(edit ? item.type : k0 || 'expense'), [m, setM] = useState('')
  const P = preset || {}, has = (id) => S.wallets.some((w) => w.id === id)
  const [f, setF] = useState(edit
    ? { amount: String(item.amount), category: item.type === 'transfer' ? '' : item.category || '', wallet: has(item.wallet) ? item.wallet : S.wallets[0].id, to: has(item.to) ? item.to : (S.wallets[1] || S.wallets[0]).id, date: item.date, note: item.note || '' }
    : { amount: P.amount || '', category: P.category || '', wallet: P.wallet || S.wallets[0].id, to: P.to || (S.wallets[1] || S.wallets[0]).id, date: P.date || off(0), note: P.note || '' })
  const u = (key) => (e) => setF({ ...f, [key]: e.target.value })
  // Edit mode: every wallet balance as it would be if this transaction were not counted. That is the money really available to it,
  // and it is what the wallet list and the "only has" check use, so changing wallet or amount never double-counts the old entry.
  const base = edit ? calc({ ...S, tx: S.tx.filter((t) => t.id !== item.id) }) : c
  const cats = edit && k !== 'transfer' && f.category && !CATS[k].includes(f.category) ? [...CATS[k], f.category] : CATS[k]
  const save = () => {
    if (!money(f.amount) || +f.amount <= 0) return setM('Enter an amount greater than zero with at most two decimals.')
    if (k === 'transfer' && f.wallet === f.to) return setM('Pick two different wallets.')
    const amt = +f.amount, touched = !edit || f.wallet !== item.wallet || amt !== item.amount || f.date !== item.date // a note-only edit is never blocked by today's balance
    if (k !== 'income' && touched && f.date <= off(0) && amt > base.bal[f.wallet]) return setM('That wallet only has ' + php(base.bal[f.wallet]) + (edit ? ' without this transaction.' : '.'))
    const p = { amount: amt, category: k === 'transfer' ? 'Transfer' : f.category || CATS[k][0], date: f.date, note: f.note.trim(), wallet: f.wallet, ...(k === 'transfer' ? { to: f.to } : {}) }
    if (edit) updTx(item.id, p); else addTx({ type: k, ...p })
    onClose()
  }
  return (
    <Sheet title={edit ? 'Edit transaction' : 'Add transaction'} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save() }}>
        {edit
          ? <div className="glass-tile px-4 py-3 flex items-center justify-between gap-3"><span className="text-sm text-mu">Type</span><span className="font-semibold capitalize">{k}</span></div>
          : <div className="glass-tile p-1 grid grid-cols-3 gap-1">{['expense', 'income', 'transfer'].map((t) => <button type="button" key={t} aria-pressed={k === t} onClick={() => { setK(t); setF({ ...f, category: '' }) }} className={'btn !border-transparent capitalize ' + (k === t ? 'btn-p' : '!bg-transparent')}>{t}</button>)}</div>}
        <Field label="Amount (PHP)"><input className="field" autoFocus={!edit} inputMode="decimal" placeholder="0.00" value={f.amount} onChange={u('amount')} /></Field>
        {k !== 'transfer' && <Field label="Category"><select className="field" value={f.category || CATS[k][0]} onChange={u('category')}>{cats.map((x) => <option key={x}>{x}</option>)}</select></Field>}
        <Field label={k === 'transfer' ? 'From wallet' : 'Wallet'} hint={edit ? 'Balances shown leave out this transaction.' : undefined}><select className="field" value={f.wallet} onChange={u('wallet')}><WOpts ws={S.wallets} c={base} /></select></Field>
        {k === 'transfer' && <Field label="To wallet"><select className="field" value={f.to} onChange={u('to')}><WOpts ws={S.wallets} c={base} /></select></Field>}
        <Field label="Date"><input className="field" type="date" value={f.date} onChange={u('date')} /></Field>
        <Field label="Note"><input className="field" maxLength={40} placeholder="Optional" value={f.note} onChange={u('note')} /></Field>
        <Err m={m} />
        <button type="submit" className="btn btn-p w-full">{edit ? 'Save changes' : 'Save ' + k}</button>
      </form>
      {/* Outside the <form>: Confirm's buttons must never submit it. */}
      {edit && <div className="mt-3 [&>button]:w-full"><Confirm danger label="Delete transaction" warn="Delete this transaction? The wallet balance goes back to what it was before it." yes="Delete" onYes={() => { delTx(item.id); onClose() }} /></div>}
    </Sheet>
  )
}

/* ---------- History: every transaction, newest first. Tap a transaction to edit it. ---------- */
const HIST_TYPES = [['all', 'All'], ['expense', 'Expenses'], ['income', 'Income'], ['transfer', 'Transfers']]
const histDay = (d) => { const n = daysTo(d); return n === 0 ? 'Today' : n === -1 ? 'Yesterday' : n === 1 ? 'Tomorrow' : new Date(d + 'T00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) }
function TxHistory({ openSheet }) {
  const { S, undoPay } = useApp()
  const [type, setType] = useState('all'), [wid, setWid] = useState('all'), [qs, setQs] = useState(''), [lim, setLim] = useState(40)
  const t0 = off(0), W = Object.fromEntries(S.wallets.map((w) => [w.id, w])), wn = (id) => (W[id] || {}).name || 'Removed'
  const all = [
    ...S.tx.map((x) => ({ id: x.id, type: x.type, title: x.note || x.category, sub: x.category + ' · ' + wn(x.wallet) + (x.type === 'transfer' ? ' → ' + wn(x.to) : ''), wallets: x.type === 'transfer' ? [x.wallet, x.to] : [x.wallet], amount: x.amount, date: x.date, tx: x })),
    ...S.debts.flatMap((d) => (d.payments || []).map((p) => ({ id: p.id, type: d.kind === 'payable' ? 'expense' : 'income', title: (d.kind === 'payable' ? 'Paid · ' : 'Received · ') + d.party, sub: d.cat + ' · ' + wn(p.wallet), wallets: [p.wallet], amount: p.amount, date: p.date, undo: [d.id, p.id] })))
  ].sort((a, b) => b.date.localeCompare(a.date))
  const term = qs.trim().toLowerCase()
  const rows = all.filter((x) => (type === 'all' || x.type === type) && (wid === 'all' || x.wallets.includes(wid)) && (!term || (x.title + ' ' + x.sub + ' ' + x.amount).toLowerCase().includes(term)))
  const groups = []
  rows.slice(0, lim).forEach((x) => { const g = groups[groups.length - 1]; if (g && g.date === x.date) g.items.push(x); else groups.push({ date: x.date, items: [x] }) })
  const sign = (x) => (x.type === 'income' ? '+' : x.type === 'expense' ? '−' : '')
  const tone = (x) => (x.type === 'income' ? 'text-pos' : x.type === 'expense' ? 'text-neg' : '')
  const filtered = type !== 'all' || wid !== 'all' || !!term
  return (
    <div className="space-y-3">
      <Glass i={0} className="p-3.5 sm:p-4 space-y-3">
        <input className="field" placeholder="Search note, category, wallet or amount" aria-label="Search transactions" value={qs} onChange={(e) => { setQs(e.target.value); setLim(40) }} />
        <div className="chips" data-noswipe>{HIST_TYPES.map(([k, l]) => <button key={k} type="button" aria-pressed={type === k} onClick={() => { setType(k); setLim(40) }} className={'btn ' + (type === k ? 'btn-p' : '')}>{l}</button>)}</div>
        {S.wallets.length > 1 && <select className="field" aria-label="Filter by wallet" value={wid} onChange={(e) => { setWid(e.target.value); setLim(40) }}><option value="all">All wallets</option>{S.wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select>}
      </Glass>
      {!rows.length ? (
        <Glass i={1} className="p-6 text-center"><div className="font-semibold">{filtered ? 'No matching transactions' : 'No transactions yet'}</div><p className="text-sm text-mu mt-1">{filtered ? 'Try a different filter or search.' : 'Tap + to add your first expense, income or transfer.'}</p></Glass>
      ) : (
        <>
          <div className="text-xs text-mu px-1">{rows.length} transaction{rows.length === 1 ? '' : 's'}{filtered ? ' found' : ''} · newest first</div>
          {groups.map((g, gi) => {
            const net = q(g.items.reduce((a, x) => a + (x.type === 'income' ? x.amount : x.type === 'expense' ? -x.amount : 0), 0))
            return (
              <Glass key={g.date} i={Math.min(gi + 1, 6)} className="p-3.5 sm:p-4">
                <div className="mini-h"><b>{histDay(g.date)}</b><span className="tabular-nums">{net === 0 ? '' : (net > 0 ? '+' : '−') + php(Math.abs(net))}</span></div>
                <div className="mt-1.5">
                  {g.items.map((x, i) => {
                    const body = (
                      <>
                        <span className={'grid place-items-center w-9 h-9 rounded-full shrink-0 ' + (x.type === 'income' ? 'bg-pos/15 text-pos' : x.type === 'expense' ? 'bg-neg/15 text-neg' : 'bg-fg/10 text-mu')}><Ic n={x.type === 'income' ? 'up' : x.type === 'expense' ? 'down' : 'swap'} s={15} /></span>
                        <div className="min-w-0 flex-1"><div className="text-[14px] font-medium truncate leading-[19px]">{x.title}{x.tx && x.date > t0 && <span className="ml-1.5 align-middle text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-ac/15 text-ac">Scheduled</span>}</div><div className="text-[11.5px] text-mu truncate leading-[16px]">{x.sub}</div></div>
                        <div className={'text-[14px] font-semibold whitespace-nowrap tabular-nums text-right ' + tone(x)}>{sign(x)}{php(x.amount)}</div>
                      </>
                    )
                    return (
                      <div key={x.id} className={'flex items-center gap-2.5 py-2 ' + (i ? 'border-t border-fg/10' : '')}>
                        {x.tx
                          ? <button type="button" aria-label={'Edit ' + x.title} onClick={() => openSheet({ k: 'tx', item: x.tx })} className="flex items-center gap-2.5 min-w-0 flex-1 text-left">{body}<Ic n="right" s={14} cls="text-mu shrink-0" /></button>
                          : <div className="flex items-center gap-2.5 min-w-0 flex-1">{body}</div>}
                        {x.undo && <UndoBtn onClick={() => undoPay(x.undo[0], x.undo[1])} label={'Undo ' + x.title} />}
                      </div>
                    )
                  })}
                </div>
              </Glass>
            )
          })}
          {rows.length > lim && <button type="button" className="btn w-full" onClick={() => setLim(lim + 40)}>Show more ({rows.length - lim} left)</button>}
        </>
      )}
    </div>
  )
}

// Add or edit a payable / receivable. The category list ends with "+ Add New Source".
function DebtSheet({ kind, item, preset, fill, lock, onClose }) {
  const { S, addDebt, updDebt, set } = useApp(), cats = catsFor(S, kind), pay = kind === 'payable'
  const F = fill || {}
  const [f, setF] = useState({ party: item ? item.party : F.party || '', total: item ? String(item.total) : F.total || '', due: item ? item.due : F.due || off(14), cat: item ? item.cat : preset || cats[0] || '__new', nc: '', rec: !!(item && isRecur(item)), freq: item && isRecur(item) ? item.frequency : 'monthly', vary: !!(item && item.isVariableAmount) }), [m, setM] = useState('')
  const u = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const all = item && !cats.includes(item.cat) ? [...cats, item.cat] : cats
  const save = () => {
    const nc = f.nc.trim(), isNew = f.cat === '__new', hit = all.find((x) => x.toLowerCase() === nc.toLowerCase()), cat = isNew ? hit || nc : f.cat
    if (!f.party.trim()) return setM('Enter a name or description.')
    const wait = !!item && needsAmt(item) && f.rec && f.vary && !String(f.total).trim() // a generated variable item may stay at ₱0 until its amount is known
    if (!wait && (!money(f.total) || +f.total <= 0)) return setM('Enter an amount greater than zero with at most two decimals.')
    if (item && +f.total < (item.paid || 0)) return setM('The total can’t be lower than the ' + php(item.paid) + ' already settled.')
    if (!cat) return setM('Name the new source.')
    if (!f.due) return setM('Pick a due date.')
    if (isNew && !hit) set({ srcs: [...(S.srcs || []), { kind, name: nc }] })
    const p = { party: f.party.trim(), total: wait ? 0 : +f.total, due: f.due, cat, isRecurring: f.rec, ...(f.rec ? { frequency: f.freq, isVariableAmount: f.vary, recurDay: +f.due.slice(8), needsAmount: wait } : {}) }
    item ? updDebt(item.id, p) : addDebt({ kind, wallet: S.wallets[0].id, ...p })
    onClose()
  }
  return (
    <Sheet title={(item ? 'Edit ' : 'Add ') + kind} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save() }}>
        <Field label={pay ? 'Who or what do you owe?' : 'Who owes you?'}><input className="field" autoFocus maxLength={40} placeholder={pay ? 'e.g. Phone installment' : 'e.g. Monthly allowance'} value={f.party} onChange={u('party')} /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={f.rec && f.vary ? 'Expected total (PHP)' : 'Total (PHP)'}><input className="field" inputMode="decimal" placeholder="0.00" value={f.total} onChange={u('total')} /></Field>
          <Field label="Due date"><input className="field" type="date" value={f.due} onChange={u('due')} /></Field>
        </div>
        {lock && !item
          ? <div className="glass-tile p-3 flex items-center justify-between gap-3"><span className="text-sm text-mu">Source</span><span className="font-semibold truncate">{f.cat}</span></div>
          : <Field label="Source"><select className="field" value={f.cat} onChange={u('cat')}>{all.map((x) => <option key={x}>{x}</option>)}<option value="__new">+ Add New Source</option></select></Field>}
        {f.cat === '__new' && <Field label="New source name"><input className="field" maxLength={24} placeholder="e.g. Credit Card" value={f.nc} onChange={u('nc')} /></Field>}
        <div className="glass-tile p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0"><div className="text-sm font-medium">Recurring</div><div className="text-xs text-mu">{pay ? 'The next bill is created when this one is paid.' : 'The next one is created when this is received.'}</div></div>
            <button type="button" role="switch" aria-checked={f.rec} aria-label="Recurring" onClick={() => setF({ ...f, rec: !f.rec })} className={'relative shrink-0 w-12 h-7 rounded-full transition-colors ' + (f.rec ? 'bg-ac' : 'bg-fg/25')}>
              <i className={'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ' + (f.rec ? 'translate-x-5' : '')} />
            </button>
          </div>
          {f.rec && (
            <div className="space-y-3 fade">
              <Field label="Repeats"><select className="field" value={f.freq} onChange={u('freq')}>{FREQS.map((x) => <option key={x} value={x}>{FREQ_LABEL[x]}</option>)}</select></Field>
              <label className="flex items-start gap-2.5 text-sm cursor-pointer">
                <input type="checkbox" className="mt-0.5 w-4 h-4 shrink-0" checked={f.vary} onChange={(e) => setF({ ...f, vary: e.target.checked })} />
                <span><span className="font-medium">Variable amount</span><span className="block text-xs text-mu">The amount changes each cycle (like a utility bill). The next one starts at {php(0)} and asks you to set the amount.</span></span>
              </label>
            </div>
          )}
        </div>
        <Err m={m} />
        <button type="submit" className="btn btn-p w-full">{item ? 'Save changes' : 'Add ' + kind}</button>
      </form>
    </Sheet>
  )
}

// Add a source (a group such as "Credit Card" or "Mom") or rename one. A source is either a payable source (money you owe) or a receivable source (money owed to you).
function SourceSheet({ item, onClose }) {
  const { S, addSrc, renameSrc } = useApp()
  const [name, setName] = useState(item ? item.name : ''), [kind, setKind] = useState(item ? item.kind : 'payable'), [m, setM] = useState('')
  const save = () => {
    const n = name.trim()
    if (!n) return setM('Name the source.')
    if (item && n === item.name) return onClose()
    if (hasSrc(S.srcs || [], kind, n) && !(item && n.toLowerCase() === item.name.toLowerCase())) return setM('You already have a ' + kind + ' source called “' + n + '”.')
    item ? renameSrc(item.kind, item.name, n) : addSrc(kind, n)
    onClose()
  }
  return (
    <Sheet title={item ? 'Edit name' : 'Add source'} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save() }}>
        {!item && (
          <Field label="Type">
            <div className="grid grid-cols-2 gap-2">
              {[['payable', 'Payable', 'Money you owe'], ['receivable', 'Receivable', 'Money owed to you']].map(([k, l, h]) => <button type="button" key={k} onClick={() => setKind(k)} aria-pressed={kind === k} className={'btn flex-col !gap-0.5 !rounded-2xl !py-3 ' + (kind === k ? 'btn-p' : '')}><span>{l}</span><span className="text-[11px] opacity-80 font-normal">{h}</span></button>)}
            </div>
          </Field>
        )}
        <Field label="Source name" hint={item ? 'Everything inside this source keeps its place.' : 'Add payables or receivables inside it afterwards.'}><input className="field" autoFocus maxLength={24} placeholder={kind === 'payable' ? 'e.g. Credit Card' : 'e.g. Family'} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Err m={m} />
        <button type="submit" className="btn btn-p w-full">{item ? 'Save name' : 'Add source'}</button>
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
        {isRecur(item) && <p className="text-xs text-mu flex items-center gap-1.5"><Ic n="repeat" s={12} />{FREQ_LABEL[item.frequency]} · once this is fully {pay ? 'paid' : 'received'}, the next one is created for {fd(nextDue(item.due, item.frequency, item.recurDay))}{item.isVariableAmount ? ' at ' + php(0) + ' (you set the amount)' : ''}.</p>}
        <Err m={m} />
        <button type="submit" className="btn btn-p w-full">{pay ? 'Record payment' : 'Record receipt'}</button>
      </form>
    </Sheet>
  )
}

/* v8 P1: lock money from one or more wallets for a single payable. Nothing leaves the wallet; the locked total just comes out of Spendable. */
function AllocSheet({ item, onClose }) {
  const { S, c, setAllocations } = useApp(), d = S.debts.find((x) => x.id === item.id) || item
  const left = Math.max(0, rem(d)), cur = Object.fromEntries((d.allocations || []).map((x) => [x.walletId, x.amount]))
  const [v, setV] = useState(() => Object.fromEntries(S.wallets.map((w) => [w.id, cur[w.id] ? String(cur[w.id]) : ''])))
  const [m, setM] = useState('')
  // What a wallet can still lock: its balance minus what OTHER payables already locked in it (this payable's own lock is being edited).
  const avail = (w) => Math.max(0, q(c.bal[w.id] - (c.lockW[w.id] || 0) + (cur[w.id] || 0)))
  const num = (w) => (String(v[w.id]).trim() === '' ? 0 : money(v[w.id]) ? q(+v[w.id]) : NaN)
  const nums = S.wallets.map(num), bad = nums.some((n) => Number.isNaN(n)), total = q(nums.reduce((a, n) => a + (n || 0), 0)), had = (d.allocations || []).length > 0
  const set = (id, x) => { setV({ ...v, [id]: x }); setM('') }
  const fill = (w) => { const others = q(S.wallets.reduce((a, o) => a + (o.id === w.id ? 0 : num(o) || 0), 0)); set(w.id, String(Math.max(0, Math.min(avail(w), q(left - others))) || '')) }
  const save = () => {
    if (bad) return setM('Use amounts with at most two decimals, or leave a wallet empty.')
    const over = S.wallets.find((w, i) => nums[i] > avail(w)); if (over) return setM(over.name + ' only has ' + php(avail(over)) + ' free to lock.')
    if (total > left) return setM('That’s more than the remaining ' + php(left) + ' for this payable.')
    setAllocations(d.id, S.wallets.map((w, i) => ({ walletId: w.id, amount: nums[i] })).filter((x) => x.amount > 0)); onClose()
  }
  return (
    <Sheet title={had ? 'Edit allocation' : 'Allocate funds'} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save() }}>
        <div className="glass-tile p-3 space-y-2">
          <div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="font-semibold truncate">{d.party}</div><div className="text-xs text-mu">{d.cat} · {dueTxt(d.due)}</div></div><div className="text-right shrink-0"><div className="text-[11px] text-mu">Remaining</div><div className="font-semibold tabular-nums">{php(left)}</div></div></div>
          <Bar pct={left ? (Math.min(total, left) / left) * 100 : 0} />
          <div className={'text-xs tabular-nums ' + (total > left ? 'text-neg' : 'text-mu')}>{php(total)} / {php(left)} allocated</div>
        </div>
        <p className="text-xs text-mu">Locked money stays in its wallet until you pay, but it is taken out of your Spendable balance.</p>
        <div className="space-y-2.5">
          {S.wallets.map((w) => (
            <div key={w.id} className="glass-tile p-3">
              <div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium truncate min-w-0">{w.name}</span><span className="text-xs text-mu tabular-nums shrink-0">Free to lock {php(avail(w))}</span></div>
              <div className="flex items-center gap-2 mt-2">
                <input className="field flex-1 min-w-0" inputMode="decimal" placeholder="0.00" aria-label={'Amount to lock from ' + w.name} value={v[w.id]} onChange={(e) => set(w.id, e.target.value)} />
                <button type="button" className="btn !py-1.5 !px-2.5 !text-[11px] shrink-0" onClick={() => fill(w)}>Max</button>
                {String(v[w.id]).trim() !== '' && <button type="button" className="btn !py-1.5 !px-2.5 !text-[11px] shrink-0" aria-label={'Clear ' + w.name} onClick={() => set(w.id, '')}>Clear</button>}
              </div>
            </div>
          ))}
        </div>
        <Err m={m} />
        <button type="submit" className="btn btn-p w-full"><Ic n="lock" s={16} />{had ? 'Save allocation' : 'Lock funds'}</button>
        {had && <button type="button" className="btn w-full text-neg" onClick={() => { setAllocations(d.id, []); onClose() }}>Remove allocation</button>}
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
  if (s.k === 'tx') return <TxSheet kind={s.kind} preset={s.preset} item={s.item} onClose={onClose} />
  if (s.k === 'debt') return <DebtSheet kind={s.kind} item={s.item} preset={s.preset} fill={s.fill} lock={s.lock} onClose={onClose} />
  if (s.k === 'source') return <SourceSheet item={s.item} onClose={onClose} />
  if (s.k === 'pay') return <PaySheet item={s.item} onClose={onClose} />
  if (s.k === 'alloc') return <AllocSheet item={s.item} onClose={onClose} />
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
// v7: edit and delete live in the standard (...) options menu on every payable / receivable (see OptionsMenu in ui.js).
const UndoBtn = ({ onClick, label }) => <button type="button" className="btn !py-1 !px-2 !text-[11px] shrink-0" aria-label={label} title="Reverse this entry and restore the balance" onClick={onClick}><Ic n="undo" s={12} />Undo</button>
function DebtRow({ d, openSheet }) {
  const { S, delDebt, undoPay, setAllocations } = useApp(), [h, setH] = useState(false)
  const pay = d.kind === 'payable', r = rem(d), lk = lockOf(d), ask = needsAmt(d), done = r <= 0 && !ask, late = !done && d.due < off(0), W = Object.fromEntries(S.wallets.map((w) => [w.id, w.name]))
  return (
    <div className="glass-tile p-3.5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0"><span className="font-medium break-words leading-snug min-w-0">{d.party}</span>{isRecur(d) && <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium text-mu" title={'Repeats ' + d.frequency}><Ic n="repeat" s={11} />{FREQ_LABEL[d.frequency]}</span>}</div><div className={'text-xs mt-0.5 leading-snug ' + (late ? 'text-neg' : done ? 'text-pos' : 'text-mu')}>{done ? 'Settled' : dueTxt(d.due)} · {fd(d.due)}</div></div>
        <div className="text-right shrink-0 whitespace-nowrap">{ask ? <span className="inline-flex items-center gap-1 rounded-full bg-neg/15 text-neg text-[11px] font-semibold px-2 py-0.5"><Ic n="alert" s={12} />Set Amount</span> : <><div className={'font-semibold tabular-nums leading-snug ' + (!pay && !done ? 'text-pos' : '')}>{php(Math.max(0, r))}</div><div className="text-[11px] text-mu leading-snug">of {php(d.total)}</div></>}</div>
      </div>
      {!ask && <Bar pct={d.total > 0 ? ((d.paid || 0) / d.total) * 100 : 0} />}
      {pay && !done && lk > 0 && (
        <div className="space-y-1.5" aria-label={php(lk) + ' of ' + php(r) + ' allocated'}>
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs"><span className={'inline-flex items-center gap-1 font-medium ' + (lk >= r ? 'text-pos' : 'text-ac')}><Ic n="lock" s={12} />{php(lk)} / {php(r)} Allocated</span><span className="text-mu">{lk >= r ? 'Fully locked' : php(q(r - lk)) + ' unlocked'}</span></div>
          <Bar gray pct={(lk / r) * 100} />
          <div className="text-[11px] text-mu break-words leading-snug">{(d.allocations || []).filter((x) => W[x.walletId]).map((x) => W[x.walletId] + ' ' + php(x.amount)).join(' · ')}</div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {ask && <button className="btn btn-p !py-1.5 !px-3 !text-xs" onClick={() => openSheet({ k: 'debt', kind: d.kind, item: d })}><Ic n="pen" s={14} />Set Amount</button>}
        {!done && !ask && <button className="btn btn-p !py-1.5 !px-3 !text-xs" onClick={() => openSheet({ k: 'pay', item: d })}>{pay ? 'Pay' : 'Receive'}</button>}
        <button className="btn !py-1.5 !px-3 !text-xs" aria-expanded={h} onClick={() => setH(!h)}><Ic n="hist" s={14} />{h ? 'Hide history' : 'View history'}</button>
        <span className="ml-auto"><OptionsMenu label={'Options for ' + d.party} items={[
          { label: 'Edit', icon: 'pen', onClick: () => openSheet({ k: 'debt', kind: d.kind, item: d }) },
          ...(pay && !done && !ask ? [{ label: lk > 0 ? 'Edit Allocation' : 'Allocate Funds', icon: 'lock', onClick: () => openSheet({ k: 'alloc', item: d }) }] : []),
          ...(pay && lk > 0 ? [{ label: 'Remove Allocation', icon: 'trash', onClick: () => setAllocations(d.id, []), confirm: { warn: 'Unlock the ' + php(lk) + ' set aside for “' + d.party + '”? It goes back to your Spendable balance.', yes: 'Yes, remove' } }] : []),
          { label: 'Delete', icon: 'trash', danger: true, onClick: () => delDebt(d.id), confirm: { warn: 'Delete “' + d.party + '”? ' + ((d.payments || []).length ? 'Its payment history is deleted too and those payments go back to your wallets. ' : '') + 'This can’t be undone.', yes: 'Yes, delete' } }
        ]} /></span>
      </div>
      {h && (
        <div className="space-y-1.5 fade">
          {(d.payments || []).length ? d.payments.slice().reverse().map((p) => <div key={p.id} className="flex items-center justify-between gap-2 text-xs"><span className="text-mu break-words min-w-0 flex-1 leading-snug">{pay ? 'Paid' : 'Received'} · {fd(p.date)} · {W[p.wallet] || 'Removed'}</span><span className="tabular-nums shrink-0">{pay ? '−' : '+'}{php(p.amount)}</span><UndoBtn onClick={() => undoPay(d.id, p.id)} label={'Undo ' + (pay ? 'payment' : 'receipt') + ' of ' + php(p.amount)} /></div>) : <p className="text-xs text-mu">No payments recorded yet.</p>}
        </div>
      )}
    </div>
  )
}

/* ---------- v8 Phase 6: Due Date Summary ---------- */
// Active payables / receivables (something left to settle, amount set) grouped by their exact due date. Each date is a collapsible breakdown with its
// totals (Total Due, Total to Receive, and the Net when a date has both). Every item has the standard (...) menu, so it can be marked paid /
// received, edited or deleted without leaving the summary. Dates that are already past are labelled Overdue and sorted first.
const dueLabel = (d) => {
  const n = daysTo(d), yr = new Date(d + 'T00:00').getFullYear() !== new Date().getFullYear()
  const dt = new Date(d + 'T00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: yr ? 'numeric' : undefined })
  return n === 0 ? 'Due Today' : n === 1 ? 'Due Tomorrow' : n < 0 ? 'Overdue · ' + dt : 'Due ' + dt
}
const signedMoney = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + php(Math.abs(n))

function DueItem({ d, openSheet }) {
  const { delDebt } = useApp(), pay = d.kind === 'payable', r = Math.max(0, rem(d))
  return (
    <div className="glass-tile p-3 flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5 min-w-0"><span className="text-sm font-medium break-words leading-snug min-w-0">{d.party}</span>{isRecur(d) && <span className="shrink-0 text-mu" title={'Repeats ' + d.frequency}><Ic n="repeat" s={11} /></span>}</div>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-mu min-w-0 mt-0.5"><span className={'shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold ' + (pay ? 'bg-neg/15 text-neg' : 'bg-pos/15 text-pos')}>{pay ? 'Payable' : 'Receivable'}</span><span className="break-words min-w-0">{d.cat}{(d.paid || 0) > 0 ? ' · ' + php(d.paid) + ' of ' + php(d.total) + ' settled' : ''}</span></div>
      </div>
      <div className={'text-sm font-semibold tabular-nums shrink-0 whitespace-nowrap ' + (pay ? 'text-neg' : 'text-pos')}>{pay ? '−' : '+'}{php(r)}</div>
      <div className="-mr-2 shrink-0"><OptionsMenu label={'Options for ' + d.party} items={[
        { label: pay ? 'Mark as Paid' : 'Mark as Received', icon: 'check', onClick: () => openSheet({ k: 'pay', item: d }) },
        { label: 'Edit', icon: 'pen', onClick: () => openSheet({ k: 'debt', kind: d.kind, item: d }) },
        { label: 'Delete', icon: 'trash', danger: true, onClick: () => delDebt(d.id), confirm: { warn: 'Delete “' + d.party + '”? ' + ((d.payments || []).length ? 'Its payment history is deleted too and those payments go back to your wallets. ' : '') + 'This can’t be undone.', yes: 'Yes, delete' } }
      ]} /></div>
    </div>
  )
}

function DueSummary({ openSheet }) {
  const { S } = useApp(), [open, setOpen] = useState({}), [all, setAll] = useState(true)
  const act = S.debts.filter((d) => rem(d) > 0 && !needsAmt(d) && d.due)
  const dates = [...new Set(act.map((d) => d.due))].sort()
  const groups = dates.map((date) => {
    const items = act.filter((d) => d.due === date).sort((a, b) => (a.kind === b.kind ? a.party.localeCompare(b.party) : a.kind === 'payable' ? -1 : 1))
    const pay = q(items.filter((d) => d.kind === 'payable').reduce((a, d) => a + rem(d), 0)), rec = q(items.filter((d) => d.kind === 'receivable').reduce((a, d) => a + rem(d), 0))
    return { date, items, pay, rec, np: items.filter((d) => d.kind === 'payable').length, nr: items.filter((d) => d.kind === 'receivable').length, late: daysTo(date) < 0, now: daysTo(date) === 0 }
  })
  if (!groups.length) return null
  const isOpen = (g) => (open[g.date] !== undefined ? open[g.date] : g.late || g.now) // today and overdue start expanded; later dates start collapsed
  const allOpen = groups.every(isOpen)
  const totPay = q(groups.reduce((a, g) => a + g.pay, 0)), totRec = q(groups.reduce((a, g) => a + g.rec, 0))
  return (
    <Glass className="p-4 sm:p-5">
      <button className="w-full flex items-center justify-between gap-3 text-left" aria-expanded={all} onClick={() => setAll(!all)}>
        <span className="min-w-0"><span className="block font-semibold">Due Date Summary</span><span className="block text-xs text-mu">{groups.length} date{groups.length === 1 ? '' : 's'} · to pay {php(totPay)} · to receive {php(totRec)}</span></span>
        <Ic n="chev" s={18} cls={'text-mu shrink-0 transition-transform ' + (all ? 'rotate-180' : '')} />
      </button>
      {all && (
        <div className="mt-4 space-y-2.5 fade">
          <div className="flex justify-end"><button className="btn !py-1 !px-2.5 !text-[11px]" onClick={() => setOpen(Object.fromEntries(groups.map((g) => [g.date, !allOpen])))}>{allOpen ? 'Collapse all' : 'Expand all'}</button></div>
          {groups.map((g) => {
            const on = isOpen(g), both = g.np > 0 && g.nr > 0, net = q(g.rec - g.pay)
            return (
              <div key={g.date} className="rounded-2xl border border-bd/60 bg-s2/40">
                <button className="w-full flex items-center justify-between gap-3 text-left p-3" aria-expanded={on} onClick={() => setOpen({ ...open, [g.date]: !on })}>
                  <span className="min-w-0">
                    <span className={'block text-sm font-semibold ' + (g.late ? 'text-neg' : '')}>{dueLabel(g.date)}</span>
                    <span className="block text-[11px] text-mu">{g.items.length} item{g.items.length === 1 ? '' : 's'}{both ? ' · ' + g.np + ' to pay, ' + g.nr + ' to receive' : ''}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0 text-right">
                    <span>
                      {both ? <><span className="block text-sm font-semibold tabular-nums">Net {signedMoney(net)}</span><span className="block text-[11px] text-mu tabular-nums">Pay {php(g.pay)} · Get {php(g.rec)}</span></>
                        : g.np > 0 ? <><span className="block text-[11px] text-mu">Total Due</span><span className="block text-sm font-semibold tabular-nums text-neg">{php(g.pay)}</span></>
                        : <><span className="block text-[11px] text-mu">Total to Receive</span><span className="block text-sm font-semibold tabular-nums text-pos">{php(g.rec)}</span></>}
                    </span>
                    <Ic n="chev" s={16} cls={'text-mu transition-transform ' + (on ? 'rotate-180' : '')} />
                  </span>
                </button>
                {on && <div className="px-3 pb-3 space-y-2 fade">{g.items.map((d) => <DueItem key={d.id} d={d} openSheet={openSheet} />)}</div>}
              </div>
            )
          })}
        </div>
      )}
    </Glass>
  )
}

// v7 final: ONE unified list of sources (no Payables / Receivables switch, no category filter). Each source is a card with its own (...) menu
// (Edit name, Delete) and its own "Add payable / Add receivable" button. New sources are added from the button at the top.
function Pending({ openSheet }) {
  const { S, c, delSrc, undoPay } = useApp()
  const [open, setOpen] = useState({})
  const list = (S.srcs || []).map((x) => ({ kind: x.kind, name: x.name }))
  S.debts.forEach((d) => { if (!list.some((x) => x.kind === d.kind && x.name === d.cat)) list.push({ kind: d.kind, name: d.cat }) }) // items whose source was never listed still show
  const groups = list.map((x) => ({ ...x, key: x.kind + '|' + x.name, items: S.debts.filter((d) => d.kind === x.kind && d.cat === x.name).sort((a, b) => (rem(a) <= 0) - (rem(b) <= 0) || a.due.localeCompare(b.due)) }))
  const isOpen = (k) => open[k] !== false // sources start expanded so every item is visible
  const allOpen = groups.length > 0 && groups.every((g) => isOpen(g.key))
  const late = S.debts.filter((d) => rem(d) > 0 && d.due < off(0)).length
  const W = Object.fromEntries(S.wallets.map((w) => [w.id, w.name]))
  const hist = S.debts.flatMap((d) => (d.payments || []).map((p) => ({ d, p }))).sort((a, b) => b.p.date.localeCompare(a.p.date)).slice(0, 25)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Tile l="Total payables" v={php(c.pay)} tone={c.pay > 0 ? 'text-neg' : ''} /><Tile l="Total receivables" v={php(c.rec)} tone={c.rec > 0 ? 'text-pos' : ''} />
      </div>
      <DueSummary openSheet={openSheet} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-mu">{late ? <span className="text-neg">{late} overdue</span> : 'Nothing overdue'}</span>
        <div className="flex gap-2">
          {groups.length > 0 && <button className="btn !py-1.5 !text-xs" onClick={() => setOpen({ ...open, ...Object.fromEntries(groups.map((g) => [g.key, !allOpen])) })}>{allOpen ? 'Collapse all' : 'Expand all'}</button>}
          <button className="btn btn-p !py-1.5 !text-xs" onClick={() => openSheet({ k: 'source', item: null })}><Ic n="plus" s={14} />Add Source</button>
        </div>
      </div>
      {!groups.length && <Empty t="No sources yet. Tap “Add Source” (for example a credit card or a person), then add payables or receivables inside it." />}
      <div className="space-y-3">
        {groups.map((g) => {
          const on = isOpen(g.key), pay = g.kind === 'payable', t = q(g.items.reduce((a, d) => a + Math.max(0, rem(d)), 0))
          return (
            <Glass key={g.key} className="p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <button className="min-w-0 flex-1 flex items-center justify-between gap-3 text-left" aria-expanded={on} onClick={() => setOpen({ ...open, [g.key]: !on })}>
                  <span className="min-w-0"><span className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="font-semibold break-words leading-snug min-w-0">{g.name}</span><span className={'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ' + (pay ? 'bg-neg/15 text-neg' : 'bg-pos/15 text-pos')}>{pay ? 'Payable' : 'Receivable'}</span></span><span className="block text-xs text-mu">{g.items.length} item{g.items.length === 1 ? '' : 's'}</span></span>
                  <span className="flex items-center gap-2 shrink-0"><span className="font-semibold tabular-nums whitespace-nowrap">{php(t)}</span><Ic n="chev" s={18} cls={'text-mu transition-transform ' + (on ? 'rotate-180' : '')} /></span>
                </button>
                <div className="-mr-2 shrink-0"><OptionsMenu label={'Options for ' + g.name} items={[
                  { label: 'Edit Name', icon: 'pen', onClick: () => openSheet({ k: 'source', item: { kind: g.kind, name: g.name } }) },
                  { label: 'Delete', icon: 'trash', danger: true, onClick: () => delSrc(g.kind, g.name), confirm: { warn: 'Delete “' + g.name + '”? ' + (g.items.length ? 'Its ' + g.items.length + ' item' + (g.items.length === 1 ? '' : 's') + ' and payment history are deleted too, and those payments go back to your wallets. ' : '') + 'This can’t be undone.', yes: 'Yes, delete' } }
                ]} /></div>
              </div>
              {on && (
                <div className="mt-3 space-y-3 fade">
                  {g.items.map((d) => <DebtRow key={d.id} d={d} openSheet={openSheet} />)}
                  {!g.items.length && <p className="text-sm text-mu text-center py-2">{'Nothing in ' + g.name + ' yet.'}</p>}
                  <button className="btn w-full !py-2 !text-sm" onClick={() => openSheet({ k: 'debt', kind: g.kind, item: null, preset: g.name, lock: true })}><Ic n="plus" s={15} />{pay ? 'Add payable' : 'Add receivable'}</button>
                </div>
              )}
            </Glass>
          )
        })}
      </div>
      {hist.length > 0 && (
        <Fold title="Payment history" right={<span>{hist.length} latest</span>}>
          <div className="space-y-2">
            {hist.map(({ d, p }) => {
              const pay = d.kind === 'payable'
              return (
                <div key={p.id} className="flex items-center gap-2 text-xs">
                  <div className="min-w-0 flex-1"><div className="text-[13px] font-medium break-words leading-snug">{pay ? 'Paid' : 'Received'} · {d.party}</div><div className="text-mu break-words leading-snug">{d.cat} · {W[p.wallet] || 'Removed'} · {fd(p.date)}</div></div>
                  <span className={'tabular-nums font-semibold shrink-0 whitespace-nowrap ' + (pay ? 'text-neg' : 'text-pos')}>{pay ? '−' : '+'}{php(p.amount)}</span>
                  <UndoBtn onClick={() => undoPay(d.id, p.id)} label={'Undo ' + (pay ? 'payment' : 'receipt') + ' of ' + php(p.amount) + ' for ' + d.party} />
                </div>
              )
            })}
          </div>
        </Fold>
      )}
    </div>
  )
}

/* ---------- Allocate (Smart Plan) ---------- */
function Allocate() {
  const { S, c, setAlloc } = useApp()
  const pays = S.debts.filter((d) => d.kind === 'payable' && rem(d) > 0).sort((a, b) => a.due.localeCompare(b.due))
  const recs = S.debts.filter((d) => d.kind === 'receivable' && rem(d) > 0).sort((a, b) => a.due.localeCompare(b.due))
  const room = (d) => Math.max(0, q(rem(d) - lockOf(d))), cur = (d) => Math.min(S.alloc['d:' + d.id] || 0, room(d)), short = (d) => q(rem(d) - lockOf(d) - cur(d)) // wallet locks (Allocate Funds on Pending) count first
  const cash = Math.max(0, c.spendable), totalShort = q(pays.reduce((a, d) => a + short(d), 0))
  const urgent = pays.filter((d) => short(d) > 0 && d.due <= off(14))
  // Smart Plan: fund payables earliest-due first from cash that isn't locked in goals.
  const smart = () => { let free = Math.max(0, q(c.liquid - c.saved - c.locked)); const p = {}; pays.forEach((d) => { const a = Math.min(room(d), free); p['d:' + d.id] = a; free = q(free - a) }); setAlloc(p) }
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
            const a = cur(d), mx = q(Math.min(room(d), a + cash)), s = short(d)
            return (
              <div key={d.id}>
                <div className="flex justify-between gap-3 text-sm"><span className="min-w-0 truncate">{d.party}<span className="text-xs text-mu"> · {d.cat} · {dueTxt(d.due)}</span></span><span className="tabular-nums whitespace-nowrap">{php(a)}</span></div>
                <input type="range" min="0" max={mx} step="0.01" value={Math.min(a, mx)} aria-label={'Amount to allocate to ' + d.party} onChange={(e) => setAlloc({ ['d:' + d.id]: q(Math.min(+e.target.value, mx)) })} />
                <div className="flex items-center justify-between gap-2 text-xs"><span className={s > 0 ? 'text-neg' : 'text-pos'}>{s > 0 ? 'Short ' + php(s) + ' of ' + php(rem(d)) : 'Fully funded'}{lockOf(d) > 0 ? ' · ' + php(lockOf(d)) + ' locked in wallets' : ''}</span><button className="btn !py-1 !px-2.5 !text-[11px]" onClick={() => setAlloc({ ['d:' + d.id]: mx })}>Max</button></div>
              </div>
            )
          }) : <Empty t="No open payables to plan for." />}
        </div>
      </Glass>

      <Fold title="Unallocated cash breakdown" right={<span className="tabular-nums">{php(c.spendable)}</span>}>
        <div className="space-y-2 text-sm">
          {[['Liquid cash', c.liquid, ''], ['Locked in wallets for payables', -c.locked, 'text-ac'], ['Reserved by Smart Plan', -c.allocD, 'text-ac'], ['Locked in savings goals', -c.saved, 'text-ac']].map(([l, v, t]) => <div key={l} className="flex justify-between gap-3"><span className="text-mu">{l}</span><span className={'tabular-nums ' + t}>{v < 0 ? '−' : ''}{php(Math.abs(v))}</span></div>)}
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
            <span className="ml-auto"><OptionsMenu label={'Options for ' + g.name} items={[
              { label: 'Edit goal', icon: 'pen', onClick: () => openSheet({ k: 'goal', item: g }) },
              { label: 'Delete goal', icon: 'trash', danger: true, onClick: () => delGoal(g.id), confirm: { warn: g.saved > 0 ? 'Deleting this goal releases its ' + php(g.saved) + ' back to your spendable balance.' : 'This goal will be removed.', yes: 'Yes, delete' } }
            ]} /></span>
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

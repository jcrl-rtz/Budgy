const { useState, useEffect, useMemo, useRef, createContext, useContext } = React
// firebase.js is a module that finishes loading on its own; this proxy reads window.fb only when it is first used.
const fb = new Proxy({}, { get: (_, k) => window.fb[k] })
const KEY = 'budgy.state', TK = 'budgy.t'

/* ---------- helpers ---------- */
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10)
const off = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d) }
const q = (n) => Math.round(n * 100) / 100
const php = (n) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)
const rem = (d) => q(d.total - d.paid)
const money = (v) => /^\d+(\.\d{1,2})?$/.test(String(v).trim())
const signed = (v) => /^-?\d+(\.\d{1,2})?$/.test(String(v).trim())
let cnt = 0; const nid = () => 'i' + Date.now().toString(36) + cnt++
const blank = () => ({ name: '', wallets: [{ id: 'w1', name: 'Cash on Hand', type: 'Cash', balance: 0 }], tx: [], debts: [], goals: [], alloc: {} })
const fix = (s) => ({ ...blank(), ...s })
const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.wallets) return fix(s) } catch {} return blank() }

// Wallet balance = starting balance + transactions + payments recorded on payables/receivables.
function calc(S) {
  const t = off(0), mo = t.slice(0, 7)
  const bal = Object.fromEntries(S.wallets.map((w) => [w.id, +w.balance]))
  let spent = 0; const cat = {}
  S.tx.forEach((x) => {
    if (x.date > t || !(x.wallet in bal)) return
    if (x.type === 'income') bal[x.wallet] += x.amount
    else if (x.type === 'expense') { bal[x.wallet] -= x.amount; if (x.date.startsWith(mo)) { spent += x.amount; cat[x.category] = (cat[x.category] || 0) + x.amount } }
    else if (x.to in bal) { bal[x.wallet] -= x.amount; bal[x.to] += x.amount }
  })
  S.debts.forEach((d) => (d.payments || []).forEach((p) => { if (p.wallet in bal) bal[p.wallet] += d.kind === 'receivable' ? p.amount : -p.amount }))
  let pay = 0, rec = 0
  S.debts.forEach((d) => { const r = rem(d); if (r > 0) d.kind === 'payable' ? (pay += r) : (rec += r) })
  Object.keys(bal).forEach((k) => (bal[k] = q(bal[k])))
  const liquid = q(Object.values(bal).reduce((a, b) => a + b, 0))
  const allocD = q(S.debts.filter((d) => d.kind === 'payable').reduce((a, d) => a + Math.min(S.alloc['d:' + d.id] || 0, Math.max(0, rem(d))), 0))
  const saved = q(S.goals.reduce((a, g) => a + g.saved, 0))
  return { bal, liquid, pay: q(pay), rec: q(rec), spent: q(spent), cat, net: q(liquid + rec - pay), saved, spendable: q(liquid - allocD - saved) }
}
// What deleting a payable/receivable does to each wallet (its recorded payments are reversed).
const effects = (S, d) => {
  const m = {}; (d.payments || []).forEach((p) => { m[p.wallet] = q((m[p.wallet] || 0) + (d.kind === 'payable' ? p.amount : -p.amount)) })
  return Object.entries(m).map(([id, amt]) => ({ name: (S.wallets.find((w) => w.id === id) || {}).name, amt })).filter((e) => e.name)
}

/* ---------- store ---------- */
const Ctx = createContext(), useApp = () => useContext(Ctx)
function Provider({ children }) {
  const [S, setS] = useState(load), [user, setUser] = useState(null), [ready, setReady] = useState(false), [sync, setSync] = useState('local')
  const R = useRef({ S: null, t: +(localStorage.getItem(TK) || 0), sent: 0, ready: false, mounted: false, skip: false, timer: 0, uid: null }).current
  const wipe = () => { R.skip = true; R.t = 0; R.sent = 0; R.ready = false; R.S = blank(); setS(blank()); try { localStorage.removeItem(TK); localStorage.removeItem(KEY) } catch {} }
  const push = (state) => { const t = Date.now(); R.t = t; R.sent = t; try { localStorage.setItem(TK, String(t)) } catch {} fb.save(R.uid, t, state || R.S).then(() => setSync('synced')).catch(() => setSync('error')) }
  const adopt = (d) => { const ns = fix(d.state); R.skip = true; R.t = d.t; R.sent = d.t; R.S = ns; try { localStorage.setItem(TK, String(d.t)) } catch {} setS(ns); setSync('synced') }

  useEffect(() => { if (!fb.enabled) { setReady(true); return } return fb.onAuth((u) => { setUser(u); setReady(true) }) }, [])
  useEffect(() => { // every change: cache locally right away, then debounce a save to Firestore
    R.S = S
    try { localStorage.setItem(KEY, JSON.stringify(S)) } catch {}
    if (!R.mounted) { R.mounted = true; return }
    if (R.skip) { R.skip = false; return }
    if (!R.uid || !R.ready) return
    clearTimeout(R.timer); setSync('saving'); R.timer = setTimeout(() => push(), 600)
  }, [S])
  useEffect(() => {
    R.uid = user ? user.uid : null; R.ready = false
    if (!user) { setSync('local'); return }
    setSync('connecting')
    return fb.watch(user.uid, (d, pending) => {
      if (pending) return
      if (!d) { const ns = fix(R.S.wallets.length && R.t ? R.S : blank()); if (!ns.name && user.name) ns.name = user.name; R.skip = true; R.S = ns; setS(ns); R.ready = true; push(ns); return }
      if (!R.ready) { R.ready = true; if (d.t >= R.t) adopt(d); else push(); return }
      if (d.t > R.sent && d.t > R.t) adopt(d); else setSync('synced')
    }, () => setSync('error'))
  }, [user && user.uid])

  const c = useMemo(() => calc(S), [S])
  const run = async (fn) => { try { await fn(); return '' } catch (e) { return window.errMsg(e) } }
  const auth = {
    signIn: (e, p) => run(() => fb.signIn(e.trim(), p)),
    signUp: (n, e, p) => run(() => fb.signUp(n.trim(), e.trim(), p)),
    google: () => run(() => fb.google()),
    reset: (e) => run(() => fb.reset(e.trim())),
    logout: () => run(async () => { await fb.signOut(); wipe() }),
  }
  const up = (key, id, p) => setS((s) => ({ ...s, [key]: s[key].map((x) => (x.id === id ? { ...x, ...p } : x)) }))
  const api = {
    S, c, user, ready, sync, auth,
    set: (p) => setS((s) => ({ ...s, ...p })),
    addTx: (x) => setS((s) => ({ ...s, tx: [{ id: nid(), date: off(0), ...x }, ...s.tx] })),
    // Wallets
    addWallet: (w) => setS((s) => ({ ...s, wallets: [...s.wallets, { id: nid(), ...w }] })),
    updateWallet: (id, p) => up('wallets', id, p),
    deleteWallet: (id) => setS((s) => { // never the last wallet; removes its transactions and payments
      if (s.wallets.length < 2) return s
      const rest = s.wallets.filter((w) => w.id !== id)
      return { ...s, wallets: rest, tx: s.tx.filter((x) => x.wallet !== id && x.to !== id),
        debts: s.debts.map((d) => { const gone = (d.payments || []).filter((p) => p.wallet === id), amt = q(gone.reduce((a, p) => a + p.amount, 0))
          return { ...d, wallet: d.wallet === id ? rest[0].id : d.wallet, paid: q(Math.max(0, d.paid - amt)), payments: (d.payments || []).filter((p) => p.wallet !== id) } }) }
    }),
    // Payables and receivables
    addDebt: (d) => setS((s) => ({ ...s, debts: [...s.debts, { id: nid(), paid: 0, payments: [], ...d }] })),
    updateDebt: (id, p) => up('debts', id, p),
    deleteDebt: (id) => setS((s) => { const alloc = { ...s.alloc }; delete alloc['d:' + id]; return { ...s, alloc, debts: s.debts.filter((d) => d.id !== id) } }), // balances are derived, so removing the payments restores the wallets
    payDebt: (id, amt, wallet) => setS((s) => {
      const d = s.debts.find((x) => x.id === id); if (!d || !(amt > 0) || amt > rem(d)) return s
      if (d.kind === 'payable' && amt > calc(s).bal[wallet]) return s
      return { ...s, debts: s.debts.map((x) => (x.id === id ? { ...x, paid: q(x.paid + amt), payments: [...(x.payments || []), { id: nid(), amount: amt, wallet, date: off(0) }] } : x)) }
    }),
    // Goals
    addGoal: (g) => setS((s) => ({ ...s, goals: [...s.goals, { id: nid(), saved: 0, ...g }] })),
    updateGoal: (id, p) => up('goals', id, p),
    deleteGoal: (id) => setS((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })),
    fundGoal: (id, a) => setS((s) => { const g = s.goals.find((x) => x.id === id); if (!g || !(a > 0) || a > q(g.target - g.saved) || a > calc(s).spendable) return s; return { ...s, goals: s.goals.map((x) => (x.id === id ? { ...x, saved: q(x.saved + a) } : x)) } }),
  }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

/* ---------- ui bits ---------- */
const IC = { home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10', wallet: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4', clock: 'M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', target: 'M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0', user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', plus: 'M5 12h14M12 5v14', x: 'M18 6 6 18M6 6l12 12' }
const Ic = ({ n, s = 22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={IC[n]} /></svg>
function Sheet({ title, onClose, children }) {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [])
  return <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="sheet glass relative w-full max-w-md !rounded-b-none p-5 max-h-[90dvh] overflow-y-auto" style={{ background: 'rgba(18,24,34,.92)', paddingBottom: 'max(env(safe-area-inset-bottom),20px)' }}>
      <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">{title}</h2><button className="btn !p-2" onClick={onClose} aria-label="Close"><Ic n="x" s={18} /></button></div>
      {children}
    </div>
  </div>
}
const Field = ({ label, children }) => <label className="block text-sm"><span className="mu">{label}</span><div className="mt-1">{children}</div></label>
const Err = ({ m }) => (m ? <p className="text-sm text-rose-400" role="alert">{m}</p> : null)
const Bar = ({ pct }) => <div className="bar"><i style={{ width: Math.min(100, Math.max(0, pct)) + '%' }} /></div>
const Stat = ({ l, v, tone = '' }) => <div className="glass p-4"><div className="mu text-xs">{l}</div><div className={'mt-1 text-lg font-bold tracking-tight ' + tone}>{v}</div></div>
function Danger({ label, warn, onConfirm }) {
  const [sure, setSure] = useState(false)
  return <div className="pt-3 mt-1 border-t border-white/10 space-y-2">
    {sure && <div className="text-sm text-rose-300" role="alert">{warn}</div>}
    <div className="flex gap-2">{sure && <button className="btn flex-1" onClick={() => setSure(false)}>Keep it</button>}<button className="btn btn-d flex-1" onClick={() => (sure ? onConfirm() : setSure(true))}>{sure ? 'Yes, delete' : label}</button></div>
  </div>
}

/* ---------- forms ---------- */
function WalletSheet({ item, onClose }) {
  const { S, c, addWallet, updateWallet, deleteWallet } = useApp()
  const cur = item ? c.bal[item.id] : 0
  const [f, setF] = useState({ name: item ? item.name : '', type: item ? item.type : 'Bank', balance: item ? String(cur) : '' }), [m, setM] = useState('')
  const u = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const nTx = item ? S.tx.filter((x) => x.wallet === item.id || x.to === item.id).length : 0
  const save = () => {
    if (!f.name.trim()) return setM('Enter a wallet name.')
    if (f.balance !== '' && !(item ? signed(f.balance) : money(f.balance))) return setM('Enter a balance with at most two decimals.')
    const want = +f.balance || 0
    // Editing sets the balance you actually have: the starting balance is shifted so the total matches what you typed.
    if (item) updateWallet(item.id, { name: f.name.trim(), type: f.type, balance: q(want - (cur - item.balance)) })
    else addWallet({ name: f.name.trim(), type: f.type, balance: want })
    onClose()
  }
  return <Sheet title={item ? 'Edit wallet' : 'Add wallet'} onClose={onClose}><div className="space-y-3">
    <Field label="Name"><input className="field" placeholder="e.g. BDO Savings" value={f.name} onChange={u('name')} /></Field>
    <Field label="Type"><select className="field" value={f.type} onChange={u('type')}>{['Cash', 'Bank', 'E-Wallet'].map((t) => <option key={t}>{t}</option>)}</select></Field>
    <Field label="Current balance (PHP)"><input className="field" inputMode="decimal" placeholder="0.00" value={f.balance} onChange={u('balance')} /></Field>
    <Err m={m} /><button className="btn btn-p w-full" onClick={save}>{item ? 'Save changes' : 'Add wallet'}</button>
    {item && (S.wallets.length > 1
      ? <Danger label="Delete wallet" warn={'This also deletes ' + nTx + ' transaction' + (nTx === 1 ? '' : 's') + ' and any payment history on payables and receivables that used this wallet. This cannot be undone.'} onConfirm={() => { deleteWallet(item.id); onClose() }} />
      : <p className="mu text-xs">You need at least one wallet, so this one cannot be deleted.</p>)}
  </div></Sheet>
}

function DebtSheet({ kind: k, item, onClose }) {
  const { S, addDebt, updateDebt, deleteDebt } = useApp()
  const kind = item ? item.kind : k, pay = kind === 'payable'
  const cats = [...new Set(S.debts.filter((d) => d.kind === kind).map((d) => d.cat))]
  const [f, setF] = useState({ party: item ? item.party : '', cat: item ? item.cat : cats[0] || (pay ? 'General Debt' : 'General Advance'), total: item ? String(item.total) : '', due: item ? item.due : off(14), wallet: item && S.wallets.some((w) => w.id === item.wallet) ? item.wallet : S.wallets[0].id }), [m, setM] = useState('')
  const u = (key) => (e) => setF({ ...f, [key]: e.target.value })
  const fx = item ? effects(S, item) : []
  const save = () => {
    if (!f.party.trim()) return setM('Enter who or what this is for.')
    if (!f.cat.trim()) return setM('Enter a category.')
    if (!money(f.total) || +f.total <= 0) return setM('Enter an amount greater than zero with at most two decimals.')
    if (item && +f.total <= item.paid) return setM(php(item.paid) + ' is already paid, so the total must be higher. To settle it, record the remaining payment instead.')
    if (!f.due) return setM('Pick a due date.')
    const d = { party: f.party.trim(), cat: f.cat.trim(), total: +f.total, due: f.due, wallet: f.wallet }
    item ? updateDebt(item.id, d) : addDebt({ kind, ...d }); onClose()
  }
  return <Sheet title={(item ? 'Edit ' : 'Add ') + kind} onClose={onClose}><div className="space-y-3">
    <Field label={pay ? 'Who do you owe?' : 'Who owes you?'}><input className="field" placeholder={pay ? 'e.g. Phone installment' : 'e.g. Lunch money'} value={f.party} onChange={u('party')} /></Field>
    <Field label="Category"><input className="field" list="debt-cats" value={f.cat} onChange={u('cat')} /><datalist id="debt-cats">{cats.map((x) => <option key={x} value={x} />)}</datalist></Field>
    <Field label="Total amount (PHP)"><input className="field" inputMode="decimal" placeholder="0.00" value={f.total} onChange={u('total')} /></Field>
    <Field label="Due date"><input className="field" type="date" value={f.due} onChange={u('due')} /></Field>
    <Field label={pay ? 'Pay from' : 'Receive into'}><select className="field" value={f.wallet} onChange={u('wallet')}>{S.wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
    <Err m={m} /><button className="btn btn-p w-full" onClick={save}>{item ? 'Save changes' : 'Add ' + kind}</button>
    {item && <Danger label={'Delete ' + kind} onConfirm={() => { deleteDebt(item.id); onClose() }}
      warn={fx.length ? <div><p>{php(item.paid)} has already been {pay ? 'paid' : 'received'}. Deleting reverses those payments, so your wallets change:</p><ul className="my-1.5 font-semibold">{fx.map((e) => <li key={e.name}>{e.name}: {e.amt > 0 ? '+' : '−'}{php(Math.abs(e.amt))}</li>)}</ul><p>This cannot be undone.</p></div> : 'No payments are recorded, so your wallets will not change. This cannot be undone.'} />}
  </div></Sheet>
}

function PaySheet({ d, onClose }) {
  const { S, c, payDebt } = useApp(), pay = d.kind === 'payable', left = rem(d)
  const [a, setA] = useState(''), [w, setW] = useState(S.wallets.some((x) => x.id === d.wallet) ? d.wallet : S.wallets[0].id), [m, setM] = useState('')
  const save = () => {
    if (!money(a) || +a <= 0) return setM('Enter an amount greater than zero with at most two decimals.')
    if (+a > left) return setM('That is more than the ' + php(left) + ' still remaining.')
    if (pay && +a > c.bal[w]) return setM('That wallet only has ' + php(c.bal[w]) + '.')
    payDebt(d.id, +a, w); onClose()
  }
  return <Sheet title={(pay ? 'Pay ' : 'Receive from ') + d.party} onClose={onClose}><div className="space-y-3">
    <p className="mu text-sm">Remaining: {php(left)}. {+a === left ? 'This will clear it from your pending list.' : ''}</p>
    <input className="field" inputMode="decimal" placeholder="Amount (PHP)" value={a} onChange={(e) => setA(e.target.value)} />
    <button className="btn w-full" onClick={() => setA(String(left))}>Use full amount</button>
    <Field label={pay ? 'Pay from' : 'Receive into'}><select className="field" value={w} onChange={(e) => setW(e.target.value)}>{S.wallets.map((x) => <option key={x.id} value={x.id}>{x.name} ({php(c.bal[x.id])})</option>)}</select></Field>
    <Err m={m} /><button className="btn btn-p w-full" onClick={save}>{pay ? 'Record payment' : 'Record receipt'}</button></div></Sheet>
}

function GoalSheet({ item, onClose }) {
  const { addGoal, updateGoal, deleteGoal } = useApp()
  const [f, setF] = useState({ name: item ? item.name : '', target: item ? String(item.target) : '' }), [m, setM] = useState('')
  const u = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name.trim()) return setM('Enter a goal name.')
    if (!money(f.target) || +f.target <= 0) return setM('Enter a target greater than zero with at most two decimals.')
    if (item && +f.target < item.saved) return setM('You have already saved ' + php(item.saved) + ', so the target cannot be lower.')
    item ? updateGoal(item.id, { name: f.name.trim(), target: +f.target }) : addGoal({ name: f.name.trim(), target: +f.target }); onClose()
  }
  return <Sheet title={item ? 'Edit goal' : 'Add goal'} onClose={onClose}><div className="space-y-3">
    <Field label="Goal"><input className="field" placeholder="e.g. New laptop" value={f.name} onChange={u('name')} /></Field>
    <Field label="Target (PHP)"><input className="field" inputMode="decimal" placeholder="0.00" value={f.target} onChange={u('target')} /></Field>
    {item && <p className="mu text-xs">Saved so far: {php(item.saved)}. Use Add money to fund this goal.</p>}
    <Err m={m} /><button className="btn btn-p w-full" onClick={save}>{item ? 'Save changes' : 'Add goal'}</button>
    {item && <Danger label="Delete goal" warn={(item.saved > 0 ? php(item.saved) + ' saved in this goal goes back to your spendable balance. ' : '') + 'This cannot be undone.'} onConfirm={() => { deleteGoal(item.id); onClose() }} />}
  </div></Sheet>
}

function FundSheet({ goal, onClose }) {
  const { c, fundGoal } = useApp()
  const left = q(goal.target - goal.saved), room = Math.max(0, c.spendable), max = Math.min(left, room)
  const [a, setA] = useState(''), [m, setM] = useState('')
  const save = () => {
    if (!money(a) || +a <= 0) return setM('Enter an amount greater than zero with at most two decimals.')
    if (+a > left) return setM('That is more than the ' + php(left) + ' this goal still needs.')
    if (+a > c.spendable) return setM('That is more than your spendable balance of ' + php(room) + '.')
    fundGoal(goal.id, +a); onClose()
  }
  return <Sheet title={'Add money to ' + goal.name} onClose={onClose}><div className="space-y-3">
    <p className="mu text-sm">Goal still needs {php(left)}. You can spend {php(room)}.</p>
    <input className="field" inputMode="decimal" placeholder="Amount (PHP)" value={a} onChange={(e) => setA(e.target.value)} />
    {max > 0 && <button className="btn w-full" onClick={() => setA(String(max))}>Add the most I can ({php(max)})</button>}
    <Err m={m} /><button className="btn btn-p w-full" onClick={save}>Add money</button></div></Sheet>
}

function TxSheet({ onClose }) {
  const { S, c, addTx } = useApp()
  const [f, setF] = useState({ type: 'expense', amount: '', category: 'Food', note: '', wallet: S.wallets[0].id, to: (S.wallets[1] || S.wallets[0]).id }), [m, setM] = useState('')
  const u = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const others = S.wallets.filter((w) => w.id !== f.wallet)
  const save = () => {
    if (!money(f.amount) || +f.amount <= 0) return setM('Enter an amount greater than zero with at most two decimals.')
    if (f.type === 'transfer') { if (!others.length) return setM('Add a second wallet to transfer between wallets.'); if (+f.amount > c.bal[f.wallet]) return setM('That wallet only has ' + php(c.bal[f.wallet]) + '.') }
    if (f.type !== 'transfer' && !f.category.trim()) return setM('Enter a category.')
    const x = { type: f.type, amount: +f.amount, wallet: f.wallet, note: f.note.trim(), category: f.type === 'transfer' ? 'Transfer' : f.category.trim() }
    if (f.type === 'transfer') x.to = others.some((w) => w.id === f.to) ? f.to : others[0].id
    addTx(x); onClose()
  }
  return <Sheet title="Add transaction" onClose={onClose}><div className="space-y-3">
    <div className="flex gap-2">{['expense', 'income', 'transfer'].map((t) => <button key={t} onClick={() => setF({ ...f, type: t })} className={'btn flex-1 ' + (f.type === t ? 'btn-p' : '')}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div>
    <input className="field" inputMode="decimal" placeholder="Amount (PHP)" value={f.amount} onChange={u('amount')} />
    <Field label={f.type === 'transfer' ? 'From' : 'Wallet'}><select className="field" value={f.wallet} onChange={u('wallet')}>{S.wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
    {f.type === 'transfer' ? <Field label="To"><select className="field" value={others.some((w) => w.id === f.to) ? f.to : (others[0] || {}).id} onChange={u('to')}>{others.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
      : <Field label="Category"><input className="field" value={f.category} onChange={u('category')} /></Field>}
    <input className="field" placeholder="Note (optional)" value={f.note} onChange={u('note')} />
    <Err m={m} /><button className="btn btn-p w-full" onClick={save}>Save transaction</button></div></Sheet>
}

/* ---------- screens ---------- */
const Head = ({ t, children }) => <div className="flex items-center justify-between mb-1"><h1 className="text-2xl font-extrabold tracking-tight">{t}</h1>{children}</div>

function Home({ openAdd }) {
  const { S, c } = useApp()
  const h = new Date().getHours(), g = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  const cats = Object.entries(c.cat).sort((a, b) => b[1] - a[1]).slice(0, 5)
  return <div className="space-y-4">
    <div><div className="mu text-sm">{g}</div><div className="text-2xl font-extrabold">{S.name || 'Welcome to Budgy'}</div></div>
    <div className="glass hero p-5"><div className="text-sm opacity-80">Net worth</div><div className="text-4xl font-extrabold tracking-tight">{php(c.net)}</div><div className="text-xs opacity-70 mt-1">Cash + receivables − payables</div></div>
    <div className="grid grid-cols-2 gap-3">
      <Stat l="Total cash" v={php(c.liquid)} /><Stat l="Spendable" v={php(c.spendable)} tone={c.spendable < 0 ? 'text-rose-400' : 'text-emerald-300'} />
      <Stat l="You owe" v={php(c.pay)} tone="text-rose-300" /><Stat l="Owed to you" v={php(c.rec)} tone="text-emerald-300" />
    </div>
    <div className="glass p-4 space-y-3"><div className="flex justify-between"><div className="font-semibold">Spent this month</div><div className="font-bold">{php(c.spent)}</div></div>
      {cats.length ? cats.map(([k, v]) => <div key={k}><div className="flex justify-between text-sm"><span>{k}</span><span className="mu">{php(v)}</span></div><Bar pct={(v / cats[0][1]) * 100} /></div>) : <p className="mu text-sm">No spending yet this month. Tap + to add an expense.</p>}</div>
    <div className="glass p-4 space-y-3"><div className="font-semibold">Recent activity</div>
      {S.tx.slice(0, 8).map((x) => <div key={x.id} className="flex justify-between gap-3 text-sm"><div className="min-w-0"><div className="truncate font-medium">{x.note || x.category}</div><div className="mu text-xs">{x.category} · {x.date}</div></div>
        <div className={'font-semibold whitespace-nowrap ' + (x.type === 'income' ? 'text-emerald-300' : '')}>{x.type === 'income' ? '+' : x.type === 'expense' ? '−' : ''}{php(x.amount)}</div></div>)}
      {!S.tx.length && <p className="mu text-sm">Your transactions will show up here.</p>}</div>
    <button onClick={openAdd} className="btn btn-p fixed right-5 z-30 !p-0 w-14 h-14 flex items-center justify-center shadow-2xl" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 96px)' }} aria-label="Add transaction"><Ic n="plus" s={26} /></button>
  </div>
}

function Wallets() {
  const { S, c } = useApp(), [form, setForm] = useState(null)
  return <div className="space-y-3"><Head t="Wallets"><button className="btn btn-p" onClick={() => setForm('new')}>Add wallet</button></Head>
    <div className="glass p-4"><div className="mu text-xs">Total across wallets</div><div className="text-2xl font-extrabold">{php(c.liquid)}</div></div>
    {S.wallets.map((w) => <button key={w.id} onClick={() => setForm(w)} className="glass p-4 w-full text-left block space-y-2">
      <div className="flex justify-between items-center gap-3"><div className="min-w-0"><div className="font-semibold truncate">{w.name}</div><div className="mu text-xs">{w.type} · tap to edit</div></div><div className={'font-bold ' + (c.bal[w.id] < 0 ? 'text-rose-300' : '')}>{php(c.bal[w.id])}</div></div>
      <Bar pct={c.liquid > 0 ? (c.bal[w.id] / c.liquid) * 100 : 0} /></button>)}
    {form && <WalletSheet item={form === 'new' ? null : form} onClose={() => setForm(null)} />}
  </div>
}

function Pending() {
  const { S } = useApp(), [kind, setKind] = useState('payable'), [form, setForm] = useState(null), [pay, setPay] = useState(null)
  const list = S.debts.filter((d) => d.kind === kind && rem(d) > 0).sort((a, b) => a.due.localeCompare(b.due)) // paid-off items drop out of this list
  const cur = (o) => o && S.debts.find((d) => d.id === o.id && rem(d) > 0)
  return <div className="space-y-3"><Head t="Pending" />
    <div className="glass p-1 flex">{[['payable', 'Payables'], ['receivable', 'Receivables']].map(([k, l]) => <button key={k} onClick={() => setKind(k)} className={'btn flex-1 ' + (kind === k ? 'btn-p' : '!bg-transparent')}>{l}</button>)}</div>
    <button className="btn w-full" onClick={() => setForm({ kind })}>Add {kind}</button>
    {!list.length && <div className="glass p-4 mu text-sm">Nothing pending. Settled items are cleared from this list.</div>}
    {list.map((d) => <div key={d.id} className="glass p-4 space-y-2">
      <div className="flex justify-between gap-3"><div className="min-w-0"><div className="font-semibold truncate">{d.party}</div><div className="mu text-xs">{d.cat} · due {d.due}{d.due < off(0) && <span className="text-rose-300"> · overdue</span>}</div></div>
        <div className="text-right"><div className="font-bold">{php(rem(d))}</div>{d.paid > 0 && <div className="mu text-xs">of {php(d.total)}</div>}</div></div>
      {d.paid > 0 && <Bar pct={(d.paid / d.total) * 100} />}
      <div className="flex gap-2"><button className="btn btn-p flex-1" onClick={() => setPay(d)}>{kind === 'payable' ? 'Pay' : 'Receive'}</button><button className="btn flex-1" onClick={() => setForm(d)}>Edit</button></div></div>)}
    {form && <DebtSheet {...(form.id ? { item: form } : { kind: form.kind })} onClose={() => setForm(null)} />}
    {cur(pay) && <PaySheet d={cur(pay)} onClose={() => setPay(null)} />}
  </div>
}

function Goals() {
  const { S, c } = useApp(), [form, setForm] = useState(null), [fund, setFund] = useState(null)
  return <div className="space-y-3"><Head t="Goals"><button className="btn btn-p" onClick={() => setForm('new')}>Add goal</button></Head>
    <div className="grid grid-cols-2 gap-3"><Stat l="Saved in goals" v={php(c.saved)} /><Stat l="Spendable" v={php(c.spendable)} tone={c.spendable < 0 ? 'text-rose-400' : 'text-emerald-300'} /></div>
    {!S.goals.length && <div className="glass p-4 mu text-sm">No goals yet. Add one to start setting money aside.</div>}
    {S.goals.map((g) => { const done = g.saved >= g.target; return <div key={g.id} className="glass p-4 space-y-2">
      <div className="flex justify-between gap-3"><div className="font-semibold truncate">{g.name}</div><div className="font-bold whitespace-nowrap">{Math.round((g.saved / g.target) * 100)}%</div></div>
      <Bar pct={(g.saved / g.target) * 100} /><div className="mu text-xs">{php(g.saved)} of {php(g.target)}{done ? ' · reached' : ''}</div>
      <div className="flex gap-2"><button disabled={done} className="btn btn-p flex-1" onClick={() => setFund(g)}>Add money</button><button className="btn flex-1" onClick={() => setForm(g)}>Edit</button></div></div> })}
    {form && <GoalSheet item={form === 'new' ? null : S.goals.find((g) => g.id === form.id)} onClose={() => setForm(null)} />}
    {fund && <FundSheet goal={S.goals.find((g) => g.id === fund.id) || fund} onClose={() => setFund(null)} />}
  </div>
}

function Me() {
  const { S, set, user, sync, auth } = useApp()
  const label = { synced: 'Synced to your account', saving: 'Saving…', connecting: 'Connecting…', error: 'Sync error. Changes are saved on this device and will retry.', local: 'This device only' }[sync]
  return <div className="space-y-3"><Head t="Profile" />
    <div className="glass p-4 space-y-3"><div className="mu text-sm break-all">{user.email}</div><div className="text-xs mu">{label}</div>
      <Field label="Display name"><input className="field" value={S.name} onChange={(e) => set({ name: e.target.value })} placeholder="Your name" /></Field></div>
    <button className="btn w-full" onClick={auth.logout}>Log out</button>
  </div>
}

function Auth() {
  const { auth } = useApp()
  const [mode, setMode] = useState('login'), [f, setF] = useState({ name: '', email: '', pw: '' }), [m, setM] = useState(''), [busy, setBusy] = useState(false)
  const u = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const go = async (fn) => { setBusy(true); setM(''); const r = await fn(); setBusy(false); if (r) setM(r) }
  const login = mode === 'login'
  return <div className="min-h-full flex items-center justify-center p-5"><div className="w-full max-w-sm glass p-6 space-y-3">
    <div className="text-4xl font-extrabold tracking-tight mb-1">Budgy</div>
    <h1 className="text-lg font-semibold">{login ? 'Log in to your budget' : 'Create your account'}</h1>
    {!login && <input className="field" placeholder="Display name" autoComplete="name" value={f.name} onChange={u('name')} />}
    <input className="field" type="email" autoComplete="email" placeholder="Email" value={f.email} onChange={u('email')} />
    <input className="field" type="password" autoComplete={login ? 'current-password' : 'new-password'} placeholder="Password" value={f.pw} onChange={u('pw')} />
    <Err m={m} />
    <button disabled={busy || !f.email || !f.pw} className="btn btn-p w-full" onClick={() => go(() => (login ? auth.signIn(f.email, f.pw) : auth.signUp(f.name, f.email, f.pw)))}>{login ? 'Log in' : 'Sign up'}</button>
    <button disabled={busy} className="btn w-full" onClick={() => go(auth.google)}>Continue with Google</button>
    {login && <button className="mu text-sm w-full" onClick={() => go(async () => { if (!f.email) return 'Enter your email first.'; const r = await auth.reset(f.email); return r || (setM('If that email has an account, a reset link is on its way.'), '') })}>Forgot password?</button>}
    <button className="mu text-sm w-full" onClick={() => { setMode(login ? 'signup' : 'login'); setM('') }}>{login ? 'New here? Create an account' : 'Have an account? Log in'}</button>
  </div></div>
}

const TABS = [['Home', 'home'], ['Wallets', 'wallet'], ['Pending', 'clock'], ['Goals', 'target'], ['Profile', 'user']]
function App() {
  const { user, ready } = useApp(), [tab, setTab] = useState(0), [add, setAdd] = useState(false)
  if (!ready) return <div className="h-full flex items-center justify-center"><span className="w-3 h-3 rounded-full bg-teal-300 animate-pulse" /></div>
  if (!user) return <Auth />
  return <div className="h-full flex flex-col">
    <main className="flex-1 overflow-y-auto px-4 safe-top" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 110px)' }}>
      <div className="mx-auto w-full max-w-md">{[<Home openAdd={() => setAdd(true)} />, <Wallets />, <Pending />, <Goals />, <Me />][tab]}</div>
    </main>
    <nav className="glass fixed left-1/2 -translate-x-1/2 z-40 !rounded-full px-2 py-2 flex gap-1 shadow-2xl max-w-[94vw]" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
      {TABS.map(([l, ic], i) => <button key={l} onClick={() => setTab(i)} aria-label={l} aria-current={tab === i} className={'flex flex-col items-center rounded-full px-3.5 py-1.5 transition ' + (tab === i ? 'bg-teal-300 text-[#06201c]' : 'mu')}><Ic n={ic} s={20} /><span className="text-[10px] font-semibold mt-0.5">{l}</span></button>)}
    </nav>
    {add && <TxSheet onClose={() => setAdd(false)} />}
  </div>
}

class Boundary extends React.Component {
  state = { e: null }
  static getDerivedStateFromError(e) { return { e } }
  render() { return this.state.e ? <pre style={{ padding: 16, whiteSpace: 'pre-wrap', color: '#fda4af', font: '13px monospace' }}>{'Budgy crashed:\n\n' + String(this.state.e.stack || this.state.e)}</pre> : this.props.children }
}
const mount = () => ReactDOM.createRoot(document.getElementById('root')).render(<Boundary><Provider><App /></Provider></Boundary>)
window.fb ? mount() : addEventListener('fb-ready', mount, { once: true })
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))

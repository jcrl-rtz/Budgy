/* =====================================================================
   ui.js  (Phase 1 of v3)
   Icons, Material surface primitives, bottom sheets / dialogs and the sign-in screen.
   ===================================================================== */

/* ---------- Icons (24px stroke icons) ---------- */
const IC = {
  home: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  wallet: ['M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1', 'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4'],
  swap: ['M16 3l4 4-4 4', 'M20 7H4', 'M8 21l-4-4 4-4', 'M4 17h16'],
  pie: ['M21.21 15.89A10 10 0 1 1 8 2.83', 'M22 12A10 10 0 0 0 12 2v10z'],
  target: ['M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0', 'M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0', 'M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0'],
  gear: ['M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'],
  plus: ['M5 12h14', 'M12 5v14'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  pen: ['M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'],
  trash: ['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'],
  up: ['M22 7 13.5 15.5 8.5 10.5 2 17', 'M16 7h6v6'],
  down: ['M22 17 13.5 8.5 8.5 13.5 2 7', 'M16 17h6v-6'],
  clock: ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', 'M12 6v6l4 2'],
  check: ['M20 6 9 17l-5-5'],
  bank: ['M3 22h18', 'M6 18v-7', 'M10 18v-7', 'M14 18v-7', 'M18 18v-7', 'M12 2l8 5H4z'],
  cash: ['M2 6h20v12H2z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6', 'M6 12h.01', 'M18 12h.01'],
  phone: ['M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M12 18h.01'],
  sun: ['M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z'],
  monitor: ['M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z', 'M8 21h8', 'M12 17v4'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  sparkle: ['M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z'],
  lock: ['M5 11h14v10H5z', 'M8 11V7a4 4 0 0 1 8 0v4'],
  alert: ['M12 9v4', 'M12 17h.01', 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z']
}
const Ic = ({ n, s = 20, cls = '' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
    {(IC[n] || []).map((d, i) => <path key={i} d={d} />)}
  </svg>
)
const GoogleG = () => (
  <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
)

/* ---------- Wallet types ---------- */
const WTYPES = { Cash: { icon: 'cash', plural: 'Cash' }, Bank: { icon: 'bank', plural: 'Banks' }, 'E-Wallet': { icon: 'phone', plural: 'E-Wallets' } }
const WORDER = ['Cash', 'Bank', 'E-Wallet']

/* ---------- Brand badge ---------- */
// Budgy mark: a glossy accent-coloured badge with a bevelled white "b". Follows the accent colour live (same look as the PNG app icons).
function BrandMark({ size = 40, className = '' }) {
  const id = 'bm' + React.useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={'shrink-0 ' + className} style={{ filter: 'drop-shadow(0 6px 10px rgb(var(--a) / .38)) drop-shadow(0 1px 2px rgb(0 0 0 / .3))' }} aria-hidden="true">
      <defs>
        <linearGradient id={id + 's'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".26" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".36" /></linearGradient>
        <linearGradient id={id + 'g'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".42" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <linearGradient id={id + 'w'} gradientUnits="userSpaceOnUse" x1="0" y1="12" x2="0" y2="50"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#ffd6e0" /></linearGradient>
        <clipPath id={id + 'c'}><rect width="64" height="64" rx="14.4" /></clipPath>
        <filter id={id + 'd'} x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.4" floodColor="#3b0010" floodOpacity=".42" /></filter>
      </defs>
      <rect width="64" height="64" rx="14.4" fill="rgb(var(--a))" />
      <rect width="64" height="64" rx="14.4" fill={'url(#' + id + 's)'} />
      <g clipPath={'url(#' + id + 'c)'}><ellipse cx="26" cy="-14" rx="52" ry="40" fill={'url(#' + id + 'g)'} opacity=".7" /></g>
      <rect x=".5" y=".5" width="63" height="63" rx="13.9" fill="none" stroke="#fff" strokeOpacity=".24" />
      <g filter={'url(#' + id + 'd)'}>
        <g transform="translate(0 -.4)" fill="#fff" stroke="#fff"><rect x="21.1" y="12.8" width="6.4" height="37.1" rx="3.2" stroke="none" /><circle cx="33.9" cy="37.1" r="9.6" fill="none" strokeWidth="6.4" /></g>
        <g fill={'url(#' + id + 'w)'} stroke={'url(#' + id + 'w)'}><rect x="21.1" y="12.8" width="6.4" height="37.1" rx="3.2" stroke="none" /><circle cx="33.9" cy="37.1" r="9.6" fill="none" strokeWidth="6.4" /></g>
      </g>
    </svg>
  )
}

/* ---------- Surface primitives ---------- */
// Material card: tonal gradient surface, elevation shadow and (in the leather themes) grain + stitching. `i` staggers the entrance animation.
// The class is still called `glass` so every existing screen picks up the new look without changes.
const Glass = ({ className = '', i = 0, style, children, as: T = 'div', ...rest }) => (
  <T className={'glass stitch rise ' + className} style={{ animationDelay: i * 60 + 'ms', ...style }} {...rest}>{children}</T>
)
const Bar = ({ pct, gray, lg }) => <div className={'bar ' + (gray ? 'gray ' : '') + (lg ? 'lg' : '')}><i style={{ width: Math.min(100, Math.max(0, pct || 0)) + '%' }} /></div>

// Animated currency counter
function Num({ v }) {
  const [d, setD] = useState(v), r = useRef(v)
  useEffect(() => {
    const a = r.current, t0 = performance.now(); let f
    const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches
    if (still) { r.current = v; setD(v); return }
    const st = (t) => { const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3); r.current = k >= 1 ? v : a + (v - a) * e; setD(r.current); if (k < 1) f = requestAnimationFrame(st) }
    f = requestAnimationFrame(st); return () => cancelAnimationFrame(f)
  }, [v])
  return <>{php(d)}</>
}

const Field = ({ label, children, hint }) => <label className="block text-sm"><span className="text-mu">{label}</span><div className="mt-1.5">{children}</div>{hint && <span className="block text-xs text-mu mt-1">{hint}</span>}</label>
const Err = ({ m }) => (m ? <p className="text-sm text-neg" role="alert">{m}</p> : null)

// Donut chart (Recharts). `data` = [{ name, value, color }]
function Donut({ data, center, sub, size = 190 }) {
  const Rc = window.Recharts, total = data.reduce((a, d) => a + d.value, 0)
  if (!total) return <div className="grid place-items-center text-sm text-mu" style={{ height: size }}>Nothing to chart yet</div>
  if (!Rc) return <div className="grid place-items-center text-sm text-mu" style={{ height: size }}>Chart library unavailable offline</div>
  const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } = Rc
  return (
    <div className="relative w-full" style={{ height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="94%" paddingAngle={data.length > 1 ? 3 : 0} cornerRadius={6} stroke="none" isAnimationActive={false}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={(v) => php(v)} contentStyle={{ background: 'rgb(var(--s1) / .92)', border: '1px solid rgb(var(--fg) / .14)', borderRadius: 12, color: 'rgb(var(--fg))', fontSize: 12 }} itemStyle={{ color: 'rgb(var(--fg))' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center pointer-events-none text-center"><div><div className="text-lg font-semibold tabular-nums">{center}</div><div className="text-[11px] text-mu">{sub}</div></div></div>
    </div>
  )
}
// Slice colours: the accent first, then a fixed set that reads well on every preset.
const palette = (accent, n) => ['rgb(' + accent + ')', '#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#fb923c', '#94a3b8'].slice(0, Math.max(n, 1))

/* ---------- Sheet: bottom sheet on phones, centred dialog on tablets and desktops ---------- */
function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k)
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = prev }
  }, [])
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="scrim absolute inset-0 bg-black/50 fade" onClick={onClose} />
      <div className="sheet glass glass-strong stitch relative w-full md:max-w-md rounded-b-none md:!rounded-3xl !rounded-t-[1.75rem] p-5 max-h-[90dvh] overflow-y-auto" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}>
        <div className="md:hidden mx-auto -mt-1 mb-3 h-1 w-10 rounded-full bg-fg/25" aria-hidden="true" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="btn btn-i" onClick={onClose} aria-label="Close"><Ic n="x" s={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ---------- Wallet sheets ---------- */
// Add a wallet, or edit its name and type. (Balances are changed with "Edit balance".)
function WalletSheet({ item, onClose }) {
  const { addWallet, updateWallet } = useApp()
  const [f, setF] = useState({ name: item ? item.name : '', type: item ? item.type : 'Bank', balance: '' }), [m, setM] = useState('')
  const u = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name.trim()) return setM('Enter a wallet name.')
    if (!item && f.balance !== '' && !money(f.balance)) return setM('Enter a balance of zero or more with at most two decimals.')
    if (item) updateWallet(item.id, { name: f.name.trim(), type: f.type })
    else addWallet({ name: f.name.trim(), type: f.type, balance: +f.balance || 0 })
    onClose()
  }
  return (
    <Sheet title={item ? 'Edit wallet' : 'Add wallet'} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save() }}>
        <Field label="Name"><input className="field" autoFocus maxLength={30} placeholder="e.g. BPI Savings" value={f.name} onChange={u('name')} /></Field>
        <Field label="Type">
          <div className="grid grid-cols-3 gap-2">
            {WORDER.map((t) => <button type="button" key={t} onClick={() => setF({ ...f, type: t })} aria-pressed={f.type === t} className={'btn flex-col !gap-1 !rounded-2xl !py-3 ' + (f.type === t ? 'btn-p' : '')}><Ic n={WTYPES[t].icon} s={18} /><span className="text-xs">{t}</span></button>)}
          </div>
        </Field>
        {!item && <Field label="Opening balance (PHP)"><input className="field" inputMode="decimal" placeholder="0.00" value={f.balance} onChange={u('balance')} /></Field>}
        <Err m={m} />
        <button type="submit" className="btn btn-p w-full">{item ? 'Save changes' : 'Add wallet'}</button>
      </form>
    </Sheet>
  )
}

// Set the balance to what you actually have. The wallet's starting balance is shifted so recorded transactions stay intact.
function BalanceSheet({ item, onClose }) {
  const { c, updateWallet } = useApp(), cur = c.bal[item.id]
  const [v, setV] = useState(String(cur)), [m, setM] = useState('')
  const want = signed(v) ? +v : null, delta = want === null ? 0 : q(want - cur)
  const save = () => {
    if (want === null) return setM('Enter a balance with at most two decimals. Use a minus sign for an overdrawn wallet.')
    updateWallet(item.id, { balance: q(item.balance + (want - cur)) }); onClose()
  }
  return (
    <Sheet title="Edit balance" onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save() }}>
        <div className="glass-tile p-3 flex items-center justify-between gap-3"><div className="min-w-0"><div className="font-semibold truncate">{item.name}</div><div className="text-xs text-mu">{item.type}</div></div><div className="text-right"><div className="text-[11px] text-mu">Current</div><div className="font-semibold tabular-nums">{php(cur)}</div></div></div>
        <Field label="New balance (PHP)"><input className="field" autoFocus inputMode="decimal" placeholder="0.00" value={v} onChange={(e) => setV(e.target.value)} /></Field>
        <p className={'text-sm tabular-nums ' + (delta > 0 ? 'text-pos' : delta < 0 ? 'text-neg' : 'text-mu')}>{delta === 0 ? 'No change' : 'Adjustment: ' + (delta > 0 ? '+' : '−') + php(Math.abs(delta))}</p>
        <p className="text-xs text-mu">This corrects the wallet to the amount you really have. Transactions already recorded are kept.</p>
        <Err m={m} />
        <button type="submit" className="btn btn-p w-full">Save balance</button>
      </form>
    </Sheet>
  )
}

function DeleteWalletSheet({ item, onClose }) {
  const { S, c, deleteWallet } = useApp()
  const nTx = S.tx.filter((x) => x.wallet === item.id || x.to === item.id).length
  const nPay = S.debts.reduce((a, d) => a + (d.payments || []).filter((p) => p.wallet === item.id).length, 0)
  const last = S.wallets.length < 2
  return (
    <Sheet title="Delete wallet" onClose={onClose}>
      <div className="space-y-3">
        <div className="glass-tile p-3 flex items-center justify-between gap-3"><div className="min-w-0"><div className="font-semibold truncate">{item.name}</div><div className="text-xs text-mu">{item.type}</div></div><div className="font-semibold tabular-nums">{php(c.bal[item.id])}</div></div>
        {last
          ? <p className="text-sm text-mu">You need at least one wallet, so this one can’t be deleted. Add another wallet first.</p>
          : <div className="text-sm text-neg flex gap-2" role="alert"><Ic n="alert" s={18} cls="shrink-0 mt-0.5" /><span>This also deletes {nTx} transaction{nTx === 1 ? '' : 's'}{nPay ? ' and ' + nPay + ' payment' + (nPay === 1 ? '' : 's') + ' on payables and receivables' : ''} that used this wallet. Your total liquid cash drops by {php(c.bal[item.id])}. This can’t be undone.</span></div>}
        <div className="flex gap-2"><button className="btn flex-1" onClick={onClose}>Keep it</button>{!last && <button className="btn btn-d flex-1" onClick={() => { deleteWallet(item.id); onClose() }}>Yes, delete</button>}</div>
      </div>
    </Sheet>
  )
}

/* ---------- Sign in / sign up ---------- */
function Auth() {
  const { auth, fbEnabled } = useApp()
  const [mode, setMode] = useState('login'), [f, setF] = useState({ name: '', email: '', pw: '' }), [m, setM] = useState({ t: '', ok: false }), [busy, setBusy] = useState(false)
  const u = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const login = mode === 'login'
  const go = async (fn) => { setBusy(true); setM({ t: '' }); const r = await fn(); setBusy(false); if (r) setM({ t: r }) }
  const reset = () => go(async () => {
    if (!f.email.trim()) return 'Enter your email first.'
    const r = await auth.reset(f.email); if (r) return r
    setM({ t: 'If that email has an account, a reset link is on its way.', ok: true }); return ''
  })
  return (
    <div className="min-h-dvh flex items-center justify-center p-5">
      <Glass className="w-full max-w-sm p-6 space-y-3.5" style={{ borderRadius: '1.75rem' }}>
        <div className="flex items-center gap-3 mb-1"><BrandMark size={46} /><div><div className="text-2xl font-bold tracking-tight leading-none">Budgy</div><div className="text-xs text-mu mt-1">Your money, clearly.</div></div></div>
        <div className="glass-tile p-1 grid grid-cols-2 gap-1" role="tablist">
          {[['login', 'Log in'], ['signup', 'Sign up']].map(([k, l]) => <button key={k} role="tab" aria-selected={mode === k} onClick={() => { setMode(k); setM({ t: '' }) }} className={'btn !border-transparent ' + (mode === k ? 'btn-p' : '!bg-transparent')}>{l}</button>)}
        </div>
        {!fbEnabled && <p className="text-xs text-mu flex gap-2"><Ic n="alert" s={16} cls="shrink-0" />Cloud sign-in couldn’t load. Check your connection, or continue on this device only.</p>}
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); go(() => (login ? auth.signIn(f.email, f.pw) : auth.signUp(f.name, f.email, f.pw))) }}>
          {!login && <input className="field" placeholder="Display name" autoComplete="name" value={f.name} onChange={u('name')} />}
          <input className="field" type="email" autoComplete="email" placeholder="Email" value={f.email} onChange={u('email')} />
          <input className="field" type="password" autoComplete={login ? 'current-password' : 'new-password'} placeholder={login ? 'Password' : 'Password (6+ characters)'} value={f.pw} onChange={u('pw')} />
          {m.t && <p className={'text-sm ' + (m.ok ? 'text-pos' : 'text-neg')} role="alert">{m.t}</p>}
          <button type="submit" disabled={busy || !fbEnabled || !f.email || !f.pw} className="btn btn-p w-full !py-3">{busy ? 'Please wait…' : login ? 'Log in' : 'Create account'}</button>
        </form>
        <div className="flex items-center gap-3 text-xs text-mu"><span className="h-px flex-1 bg-fg/15" />or<span className="h-px flex-1 bg-fg/15" /></div>
        <button disabled={busy || !fbEnabled} className="btn w-full !py-3" onClick={() => go(auth.google)}><GoogleG />Continue with Google</button>
        {login && <button className="text-sm text-mu w-full hover:text-fg" onClick={reset}>Forgot password?</button>}
        <button className="text-sm text-mu w-full hover:text-fg" onClick={auth.useGuest}>Continue on this device only</button>
      </Glass>
    </div>
  )
}

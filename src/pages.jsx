/* =====================================================================
   pages.js  (Phase 3 screens; v4 Phase 2: Net Worth card shows up to four customizable figures; v5 Phase 1: compact Home with auto-hiding empty sections)
   Shared helpers used by p2.js: Empty, Tile, Confirm.
   ===================================================================== */

const Empty = ({ t }) => <p className="text-sm text-mu py-6 text-center">{t}</p>
const Tile = ({ l, v, tone = '' }) => <div className="glass-tile p-3"><div className="text-[11px] sm:text-xs text-mu">{l}</div><div className={'mt-1 text-sm font-semibold tabular-nums ' + tone}>{v}</div></div>
// Small label + value pair used inside the hero cards.
const Mini = ({ l, v, tone = '' }) => <div className="min-w-0"><div className="text-[11px] text-mu truncate">{l}</div><div className={'mt-0.5 text-sm sm:text-base font-semibold tabular-nums truncate ' + tone}>{v}</div></div>

/* ---------- Net Worth credit card ---------- */
// A realistic physical card: tinted metal body, gold EMV chip, contactless mark, guilloche lines, holographic foil, a sweeping sheen
// and a glare that follows the mouse. The eye button hides every figure (handy in public).
// v4 Phase 2: the card carries up to four figures INSIDE its face (Liquid cash, Total payables, Monthly expenses, Receivables). The gear button
// opens "Customize card" where each figure can be switched on/off and reordered (stored in S.cardStats, synced and backed up with the budget).
// The strip re-balances for 1, 2, 3 or 4 figures; with none switched on the card shows its original dotted card number instead.
// Beside the card (below it on phones) sits the "statement": Spendable and a bar showing how cash, receivables and payables make up the total.
const CARD_STAT_DEFS = {
  liquid: { name: 'Liquid cash', short: 'Cash', hint: 'Money across all your wallets' },
  payables: { name: 'Total payables', short: 'Payables', hint: 'Everything you still owe' },
  expenses: { name: 'Monthly expenses', short: 'Expenses', hint: 'Spent so far this month' },
  receivables: { name: 'Receivables', short: 'Receivables', hint: 'Money others still owe you' }
}
const cardFigure = (k, c) => (k === 'liquid' ? c.liquid : k === 'payables' ? c.pay : k === 'expenses' ? c.spent : c.rec)
// Money text sized for the card face. Two figures or fewer keep the cents; with more figures the columns get narrower, so large amounts
// drop the cents (3 figures) or whole pesos (4 figures) and very large ones become 1.23M. The exact amount is always in the tooltip.
const cardAmt = (v, n, big) => {
  const a = Math.abs(v), sign = v < 0 ? '-' : '', lim = n <= 2 ? 1e9 : n === 3 ? 1e7 : 1e6
  if (a >= lim) return sign + '₱' + (a >= 1e9 ? (a / 1e9).toFixed(2) + 'B' : (a / 1e6).toFixed(2) + 'M')
  const dec = n <= 2 || (n === 3 && big < 1e5) ? 2 : 0
  return sign + '₱' + a.toLocaleString('en-PH', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
const Chevron = ({ up }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} /></svg>

// "Customize card" sheet: a switch per figure (show / hide) and up / down buttons (order). Changes apply to the card instantly and are saved with the budget.
function CardSettings({ onClose }) {
  const { S, set } = useApp()
  const cfg = fixCard(S.cardStats), on = (k) => !cfg.hidden.includes(k), count = cfg.order.filter(on).length
  const save = (p) => set({ cardStats: { ...cfg, ...p } })
  const toggle = (k) => save({ hidden: on(k) ? [...cfg.hidden, k] : cfg.hidden.filter((x) => x !== k) })
  const move = (k, d) => { const i = cfg.order.indexOf(k), j = i + d; if (j < 0 || j >= cfg.order.length) return; const o = cfg.order.slice(); o[i] = o[j]; o[j] = k; save({ order: o }) }
  const pristine = cfg.hidden.length === 0 && cfg.order.every((k, i) => k === CARD_KEYS[i])
  return (
    <Sheet title="Customize card" onClose={onClose}>
      <p className="text-sm text-mu -mt-1 mb-4">Choose which figures appear on your Net Worth card and in what order. Hidden figures stay available in the rest of the app.</p>
      <ul className="space-y-2" aria-label="Figures on the card">
        {cfg.order.map((k, i) => {
          const d = CARD_STAT_DEFS[k], active = on(k)
          return (
            <li key={k} className="glass-tile flex items-center gap-3 p-3">
              <button type="button" role="switch" aria-checked={active} aria-label={'Show ' + d.name + ' on the card'} onClick={() => toggle(k)} className={'relative shrink-0 w-12 h-7 rounded-full transition-colors ' + (active ? 'bg-ac' : 'bg-fg/25')}>
                <i className={'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ' + (active ? 'translate-x-5' : '')} />
              </button>
              <div className={'min-w-0 flex-1 ' + (active ? '' : 'opacity-60')}><div className="text-sm font-medium truncate">{d.name}</div><div className="text-xs text-mu truncate">{d.hint}</div></div>
              <div className="flex gap-1 shrink-0">
                <button type="button" className="btn btn-i" disabled={i === 0} aria-label={'Move ' + d.name + ' earlier'} title="Move earlier" onClick={() => move(k, -1)}><Chevron up /></button>
                <button type="button" className="btn btn-i" disabled={i === cfg.order.length - 1} aria-label={'Move ' + d.name + ' later'} title="Move later" onClick={() => move(k, 1)}><Chevron /></button>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-mu mt-3" aria-live="polite">{count ? 'Showing ' + count + ' of ' + CARD_KEYS.length + ' on the card.' : 'Nothing selected: the card shows its card number instead.'}</p>
      <div className="flex gap-2 mt-4">
        <button type="button" className="btn flex-1" disabled={pristine} onClick={() => set({ cardStats: cardDefault() })}>Reset</button>
        <button type="button" className="btn btn-p flex-1" onClick={onClose}>Done</button>
      </div>
    </Sheet>
  )
}

function NetWorthCard({ onPin }) {
  const { S, c } = useApp()
  const [hide, setHide] = useState(false), [edit, setEdit] = useState(false)
  const card = useRef(null), gear = useRef(null)
  const now = new Date()
  const holder = (S.name || '').trim() || 'Budgy Member'
  const asOf = String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getFullYear() % 100).padStart(2, '0')
  const digits = String(now.getFullYear())
  const mask = (v) => (hide ? '₱ ••••••' : php(v))

  // Figures chosen for the card face, in the user's order.
  const cfg = fixCard(S.cardStats)
  const stats = cfg.order.filter((k) => !cfg.hidden.includes(k)), shown = stats.length
  const figs = stats.map((k) => cardFigure(k, c)), big = figs.reduce((m, v) => Math.max(m, Math.abs(v)), 0)
  const face = (v) => (hide ? '₱ ••••' : cardAmt(v, shown, big))
  const closeEdit = () => { setEdit(false); setTimeout(() => gear.current && gear.current.focus(), 0) }

  // Tilt + glare follow the mouse. Touch is ignored so scrolling is never disturbed.
  const move = (e) => {
    const el = card.current
    if (!el || e.pointerType === 'touch') return
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg')
    el.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(2) + 'deg')
    el.style.setProperty('--gx', (x * 100).toFixed(1) + '%')
    el.style.setProperty('--gy', (y * 100).toFixed(1) + '%')
    el.classList.add('live')
  }
  const leave = () => {
    const el = card.current
    if (!el) return
    el.classList.remove('live')
    el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg')
  }

  // Composition bar: how big each part is relative to the three added together.
  const parts = [
    ['Cash', Math.max(c.liquid, 0), 'rgb(var(--a))'],
    ['Receivables', Math.max(c.rec, 0), 'rgb(var(--pos))'],
    ['Payables', Math.max(c.pay, 0), 'rgb(var(--neg))']
  ]
  const total = parts.reduce((a, x) => a + x[1], 0) || 1

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,460px)_minmax(0,1fr)] gap-4 md:gap-5 items-center">
      <div className="ncard-wrap rise">
        <div ref={card} className={'ncard' + (shown ? ' has-stats' : '')} onPointerMove={move} onPointerLeave={leave} onPointerCancel={leave} role="group" aria-label={'Net worth card. ' + (hide ? 'Amounts hidden.' : 'Net worth ' + php(c.net))}>
          <i className="nc-guil" /><i className="nc-ring" /><i className="nc-holo" /><i className="nc-grain" /><i className="nc-stitch" /><i className="nc-sheen" /><i className="nc-glare" />
          <div className="nc-body">
            <div className="nc-row">
              <div className="nc-brand"><span><Ic n="sparkle" s={11} /></span>Budgy</div>
              <div className="nc-tools">
                {onPin && <button type="button" className="nc-eye" aria-haspopup="dialog" aria-label="Change pinned card" title="Change pinned card" onClick={onPin}><Ic n="pin" s={16} /></button>}
                <button type="button" ref={gear} className="nc-eye" aria-haspopup="dialog" aria-label="Customize card" title="Customize card" onClick={() => setEdit(true)}><Ic n="gear" s={16} /></button>
                <button type="button" className="nc-eye" aria-pressed={hide} aria-label={hide ? 'Show amounts' : 'Hide amounts'} title={hide ? 'Show amounts' : 'Hide amounts'} onClick={() => setHide(!hide)}>
                  {hide
                                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.6 5.1A10.5 10.5 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3.2 4.1" /><path d="M6.6 6.6C3.9 8.4 2.5 12 2.5 12S6 19 12 19c1.6 0 3-.4 4.2-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
                                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" /><circle cx="12" cy="12" r="3" /></svg>}
                </button>
              </div>
            </div>

            <div className="nc-row">
              <svg className="nc-chip" viewBox="0 0 56 42" aria-hidden="true">
                <defs>
                  <linearGradient id="ncg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f7e3a1" /><stop offset=".45" stopColor="#d9b25c" /><stop offset="1" stopColor="#a67c2e" /></linearGradient>
                </defs>
                <rect x="1" y="1" width="54" height="40" rx="8" fill="url(#ncg)" stroke="#8a6620" strokeOpacity=".7" />
                <g fill="none" stroke="#7a5a1c" strokeOpacity=".75" strokeWidth="1.1">
                  <path d="M1 14h14c3 0 5 2 5 5v4c0 3-2 5-5 5H1" /><path d="M55 14H41c-3 0-5 2-5 5v4c0 3 2 5 5 5h14" />
                  <path d="M20 1v10M36 1v10M20 31v10M36 31v10" /><path d="M20 19h16M20 23h16" /><rect x="20" y="11" width="16" height="20" rx="4" />
                </g>
                <rect x="2" y="2" width="52" height="9" rx="6" fill="#fff" fillOpacity=".22" />
              </svg>
              <svg className="nc-nfc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><path d="M7 7.5a7 7 0 0 1 0 9" /><path d="M11 5a11 11 0 0 1 0 14" /><path d="M15 2.5a15 15 0 0 1 0 19" /><path d="M3.2 10.2a3 3 0 0 1 0 3.6" /></svg>
            </div>

            <div className="min-w-0">
              <div className="nc-label">Net worth</div>
              <div className={'nc-bal' + (c.net < 0 ? ' neg' : '')}>{hide ? '₱ ••••••••' : <Num v={c.net} />}</div>
            </div>

            <div className="nc-mid">
              {shown ? (
                <div className="nc-stats" data-n={shown} style={{ gridTemplateColumns: 'repeat(' + shown + ', minmax(0, 1fr))' }}>
                  {stats.map((k, i) => {
                    const d = CARD_STAT_DEFS[k], v = figs[i]
                    return (
                      <div key={k} className="nc-st" title={d.name + (k === 'expenses' ? ' (' + c.monthName + ')' : '') + (hide ? '' : ': ' + php(v))}>
                        <div className="nc-st-l">{shown <= 2 ? d.name : d.short}</div>
                        <div className={'nc-st-v' + (k === 'liquid' && v < 0 ? ' neg' : '')}>{face(v)}</div>
                      </div>
                    )
                  })}
                </div>
              ) : <div className="nc-num" aria-hidden="true">••••&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;{digits}</div>}
            </div>

            <div className="nc-row !items-end">
              <div className="min-w-0"><div className="nc-meta">Card holder</div><div className="nc-val">{holder}</div></div>
              <div className="shrink-0"><div className="nc-meta">As of</div><div className="nc-val">{asOf}</div></div>
              <div className="nc-net shrink-0" aria-hidden="true"><i /><i /></div>
            </div>
          </div>
        </div>
      </div>

      <Glass i={1} className="p-3.5 sm:p-4">
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-semibold text-[15px]">Statement</div>
          <div className="text-[11px] text-mu truncate">Cash + receivables − payables</div>
        </div>
        <div className="flex items-baseline justify-between gap-3 mt-1.5">
          <span className="text-xs text-mu">Spendable</span>
          <span className={'text-xl font-semibold tabular-nums ' + (c.spendable < 0 ? 'text-neg' : '')}>{mask(c.spendable)}</span>
        </div>
        <div className="mt-2.5">
          <div className="nc-bar" role="img" aria-label="Share of cash, receivables and payables">
            {parts.map(([n, v, col]) => <i key={n} style={{ width: (v / total) * 100 + '%', background: col }} />)}
          </div>
          <div className="flex flex-wrap gap-x-3.5 gap-y-0.5 mt-1.5 text-[11px] text-mu">
            {parts.map(([n, v, col]) => <span key={n} className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full inline-block" style={{ background: col }} />{n} {Math.round((v / total) * 100)}%</span>)}
          </div>
        </div>
      </Glass>
      {edit && ReactDOM.createPortal(<CardSettings onClose={closeEdit} />, document.body)}
    </div>
  )
}

/* ---------- Home ---------- */
// v7 Phase 2: the big card at the top is whichever metric the user PINS (S.homePin, default Net worth). Every other metric becomes a small
// summary card below it with a (...) button: "Pin to top" swaps it with the pinned one. Net worth keeps its credit-card look when pinned.
const HOME_DEFS = {
  net: { name: 'Net worth', hint: 'Cash + receivables − payables' },
  liquid: { name: 'Liquid cash', hint: 'Money across all your wallets', go: ['Open Wallets', 'wallets'] },
  spendable: { name: 'Spendable', hint: 'Cash left after allocations', go: ['Open Allocate', 'plan'] },
  spent: { name: 'Spent this month', hint: 'Expenses so far this month' },
  payables: { name: 'Total payables', hint: 'Everything you still owe', go: ['Open Pending', 'pending'] },
  receivables: { name: 'Receivables', hint: 'Money others still owe you', go: ['Open Pending', 'pending'] },
  allocated: { name: 'Allocated', hint: 'Set aside for payables and goals', go: ['Open Allocate', 'plan'] },
  projected: { name: 'Projected month-end', hint: 'Cash by the end of the month', go: ['Open Allocate', 'plan'] },
  pending: { name: 'Pending net', hint: 'Scheduled income minus expenses', go: ['Open Pending', 'pending'] }
}
const homeValue = (k, c) => ({ net: c.net, liquid: c.liquid, spendable: c.spendable, spent: c.spent, payables: c.pay, receivables: c.rec, allocated: c.allocated, projected: c.projected, pending: c.pend })[k]
const homeTone = (k, v) => (k === 'spent' ? 'text-neg' : k === 'pending' ? (v < 0 ? 'text-neg' : v > 0 ? 'text-pos' : '') : k === 'allocated' ? 'text-ac' : v < 0 ? 'text-neg' : '')
const homeText = (k, v) => (k === 'pending' ? (v > 0 ? '+' : v < 0 ? '−' : '') + php(Math.abs(v)) : php(v))

// "Pin a card" sheet: choose which metric is highlighted at the top of Home.
function PinSheet({ onClose }) {
  const { S, c, set } = useApp(), cur = HOME_KEYS.includes(S.homePin) ? S.homePin : 'net'
  return (
    <Sheet title="Pin a card" onClose={onClose}>
      <p className="text-sm text-mu -mt-1 mb-3">The pinned card is shown large at the top of Home. All the others become small cards below it.</p>
      <ul className="space-y-2" role="radiogroup" aria-label="Pinned card">
        {HOME_KEYS.map((k) => {
          const v = homeValue(k, c), on = k === cur
          return (
            <li key={k}>
              <button type="button" role="radio" aria-checked={on} onClick={() => { set({ homePin: k }); onClose() }} className={'glass-tile w-full flex items-center gap-3 p-3 text-left transition-transform active:scale-[.98] ' + (on ? 'ring-2 ring-ac' : '')}>
                <span className={'grid place-items-center w-8 h-8 rounded-full shrink-0 ' + (on ? 'bg-ac text-white' : 'bg-fg/10 text-mu')}><Ic n={on ? 'check' : 'pin'} s={15} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-medium truncate">{HOME_DEFS[k].name}</span><span className="block text-xs text-mu truncate">{HOME_DEFS[k].hint}</span></span>
                <span className={'text-sm font-semibold tabular-nums shrink-0 ' + homeTone(k, v)}>{homeText(k, v)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}

function Home({ goto, openSheet }) {
  const { S, c, ui, loadSample, set, undoPay } = useApp()
  const [pinOpen, setPinOpen] = useState(false)
  const t0 = off(0), W = Object.fromEntries(S.wallets.map((w) => [w.id, w]))
  const cats = Object.entries(c.cat).sort((a, b) => b[1] - a[1])
  const empty = !S.tx.length && !S.debts.length && !S.goals.length && S.wallets.every((w) => !+w.balance)
  const entries = [
    ...S.tx.filter((x) => x.date <= t0).map((x) => ({ id: x.id, type: x.type, title: x.note || x.category, sub: x.category + ' · ' + ((W[x.wallet] || {}).name || 'Removed') + (x.type === 'transfer' ? ' → ' + ((W[x.to] || {}).name || '?') : ''), amount: x.amount, date: x.date })),
    ...S.debts.flatMap((d) => (d.payments || []).map((p) => ({ id: p.id, type: d.kind === 'payable' ? 'expense' : 'income', title: (d.kind === 'payable' ? 'Paid · ' : 'Received · ') + d.party, sub: d.cat + ' · ' + ((W[p.wallet] || {}).name || 'Removed'), amount: p.amount, date: p.date, undo: [d.id, p.id] })))
  ].sort((a, b) => b.date.localeCompare(a.date))
  const pal = palette(ui.accent, Math.max(cats.length, 1))
  const goalPct = (c.saved / Math.max(c.target, 1)) * 100
  const actions = [['Expense', 'down', 'expense'], ['Income', 'up', 'income'], ['Transfer', 'swap', 'transfer']]
  const showCats = cats.length > 0, showGoals = S.goals.length > 0, showRecent = entries.length > 0
  const topCats = cats.slice(0, 5), catSum = Math.max(topCats.reduce((a, [, v]) => a + v, 0), 1)

  const pin = HOME_KEYS.includes(S.homePin) ? S.homePin : 'net'
  const hv = homeValue(pin, c), hd = HOME_DEFS[pin]
  // On a brand-new empty budget the planning figures would all read zero, so they stay out of the small cards.
  const small = HOME_KEYS.filter((k) => k !== pin && !(empty && ['allocated', 'projected', 'pending'].includes(k)))
  const goItem = (k) => (HOME_DEFS[k].go ? [{ label: HOME_DEFS[k].go[0], icon: 'right', onClick: () => goto(HOME_DEFS[k].go[1]) }] : [])

  return (
    <div className="space-y-3">
      {empty && (
        <Glass className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4" style={{ borderColor: 'rgb(var(--a) / .35)' }}>
          <span className="hidden sm:grid place-items-center w-11 h-11 rounded-2xl bg-ac/15 text-ac shrink-0"><Ic n="sparkle" s={20} /></span>
          <div className="flex-1"><div className="font-semibold">Let’s get you started</div><p className="text-sm text-mu mt-0.5">Set your wallet balances, or load sample data to preview the app.</p></div>
          <div className="flex gap-2 shrink-0"><button className="btn" onClick={() => goto('wallets')}>Set up wallets</button><button className="btn btn-p" onClick={loadSample}>Load sample data</button></div>
        </Glass>
      )}

      {/* Pinned card (large). Net worth keeps its credit-card look; every other metric gets a big summary card. */}
      {pin === 'net' ? (
        <NetWorthCard onPin={() => setPinOpen(true)} />
      ) : (
        <Glass i={0} className="p-5 sm:p-6" style={{ background: 'linear-gradient(135deg, rgb(var(--a) / .24), rgb(var(--s1) / .5) 72%)', borderColor: 'rgb(var(--a) / .32)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm text-mu"><Ic n="pin" s={14} /><span className="truncate">{hd.name}</span></div>
              <div className={'text-3xl sm:text-4xl font-semibold tracking-tight mt-1 tabular-nums ' + homeTone(pin, hv)}>{pin === 'pending' ? homeText(pin, hv) : <Num v={hv} />}</div>
              <div className="text-xs text-mu mt-1">{pin === 'spent' ? 'Spent in ' + c.monthName : hd.hint}</div>
            </div>
            <OptionsMenu label={'Options for pinned ' + hd.name} items={[{ label: 'Change pinned card', icon: 'pin', onClick: () => setPinOpen(true) }, ...goItem(pin)]} />
          </div>
          {pin === 'spent' && (
            <div className="mt-4">
              <Bar pct={c.monthPct} />
              <div className="flex items-center justify-between gap-3 mt-2 text-[11px] text-mu"><b className="text-fg font-semibold">{c.left === 0 ? 'Last day' : c.left + ' day' + (c.left === 1 ? '' : 's') + ' left'}</b><span className="tabular-nums">forecast {php(c.fc)}</span></div>
            </div>
          )}
        </Glass>
      )}

      {/* Quick actions: always three across, never truncated */}
      <div className="grid grid-cols-3 gap-2">
        {actions.map(([l, ic, kind]) => (
          <button key={kind} className="glass qa transition-transform duration-200 active:scale-95" style={{ borderRadius: '1.1rem' }} onClick={() => openSheet({ k: 'tx', kind })} aria-label={'Add ' + l.toLowerCase()}>
            <span className="qa-i"><Ic n={ic} s={14} /></span><span>{l}</span>
          </button>
        ))}
      </div>

      {/* Small summary cards: everything that is not pinned. Two across on phones, four across on wide screens. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 max-lg:[&>*:last-child:nth-child(odd)]:col-span-2">
        {small.map((k, i) => {
          const v = homeValue(k, c), d = HOME_DEFS[k]
          return (
            <Glass key={k} i={i + 1} className="p-3 sm:p-3.5">
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0"><div className="text-[11px] text-mu truncate">{k === 'spent' ? 'Spent in ' + c.monthName : d.name}</div><div className={'mt-1 text-base sm:text-lg font-semibold tracking-tight tabular-nums truncate ' + homeTone(k, v)}>{homeText(k, v)}</div></div>
                <div className="-mr-1.5 -mt-1.5 shrink-0"><OptionsMenu label={'Options for ' + d.name} items={[{ label: 'Pin to top', icon: 'pin', onClick: () => set({ homePin: k }) }, ...goItem(k)]} /></div>
              </div>
              <div className="text-[11px] text-mu mt-0.5 truncate">{d.hint}</div>
            </Glass>
          )
        })}
      </div>

      {/* Small cards, side by side from 640px */}
      {(showCats || showGoals) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start sm:[&>*:last-child:nth-child(odd)]:col-span-2">
          {showCats && (
            <Glass i={3} className="p-3.5 sm:p-4">
              <div className="mini-h"><b>Top spending</b><span className="tabular-nums">{php(c.spent)}</span></div>
              <div className="stack-bar mt-2.5" role="img" aria-label="Spending by category">{topCats.map(([k, v], i) => <i key={k} style={{ width: (v / catSum) * 100 + '%', background: pal[i % pal.length] }} />)}</div>
              <div className="mt-2 space-y-1">{topCats.slice(0, 3).map(([k, v], i) => <div key={k} className="flex items-center justify-between gap-2 text-xs leading-[18px]"><span className="flex items-center gap-2 text-mu min-w-0"><i className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: pal[i % pal.length] }} /><span className="truncate">{k}</span></span><span className="text-neg tabular-nums shrink-0">{php(v)}</span></div>)}</div>
              {cats.length > 3 && <p className="text-[11px] text-mu mt-1.5">+ {cats.length - 3} more</p>}
            </Glass>
          )}
          {showGoals && (
            <Glass i={4} className="p-3.5 sm:p-4">
              <div className="mini-h"><b>Savings goals</b><span>{pct1(goalPct)} overall</span></div>
              <div className="mt-2.5 space-y-2.5">{S.goals.slice(0, 2).map((g) => <div key={g.id}><div className="flex justify-between gap-2 text-xs leading-[18px] mb-1"><span className="truncate">{g.name}</span><span className="text-mu whitespace-nowrap tabular-nums">{php(g.saved)} / {php(g.target)}</span></div><Bar pct={(g.saved / g.target) * 100} /></div>)}</div>
              <button className="link-b mt-2" onClick={() => goto('goals')}>{S.goals.length > 2 ? '+ ' + (S.goals.length - 2) + ' more · Open goals' : 'Open goals'}</button>
            </Glass>
          )}
        </div>
      )}

      {showRecent && (
        <Glass i={5} className="p-3.5 sm:p-4">
          <div className="mini-h"><b>Recent activity</b><span>{Math.min(4, entries.length) + ' latest'}</span></div>
          <div className="mt-1.5">
            {entries.slice(0, 4).map((x, i) => (
              <div key={x.id} className={'flex items-center gap-2.5 py-1.5 ' + (i ? 'border-t border-fg/10' : '')}>
                <span className={'grid place-items-center w-8 h-8 rounded-full shrink-0 ' + (x.type === 'income' ? 'bg-pos/15 text-pos' : x.type === 'expense' ? 'bg-neg/15 text-neg' : 'bg-fg/10 text-mu')}><Ic n={x.type === 'income' ? 'up' : x.type === 'expense' ? 'down' : 'swap'} s={14} /></span>
                <div className="min-w-0 flex-1"><div className="text-[13px] font-medium truncate leading-[18px]">{x.title}</div><div className="text-[11px] text-mu truncate leading-[15px]">{x.sub} · {fd(x.date)}</div></div>
                <div className={'text-[13px] font-semibold whitespace-nowrap tabular-nums text-right ' + (x.type === 'income' ? 'text-pos' : x.type === 'expense' ? 'text-neg' : '')}>{x.type === 'income' ? '+' : x.type === 'expense' ? '−' : ''}{php(x.amount)}</div>
                {x.undo && <UndoBtn onClick={() => undoPay(x.undo[0], x.undo[1])} label={'Undo ' + x.title} />}
              </div>
            ))}
          </div>
        </Glass>
      )}
      {pinOpen && ReactDOM.createPortal(<PinSheet onClose={() => setPinOpen(false)} />, document.body)}
    </div>
  )
}

/* ---------- Wallets ---------- */
// Layout: one summary card with a single segmented bar, a folded breakdown chart, a filter row, then calm wallet cards.
function Wallets({ openSheet }) {
  const { S, c, ui } = useApp()
  const [filter, setFilter] = useState('all')
  const share = (bal) => (c.liquid > 0 ? Math.max(0, (bal / c.liquid) * 100) : 0) // percentage of liquid cash
  const byType = WORDER.map((t) => { const ws = S.wallets.filter((w) => w.type === t); return { t, n: ws.length, total: q(ws.reduce((a, w) => a + c.bal[w.id], 0)) } })
  const typeCol = palette(ui.accent, 3)
  const shown = S.wallets.filter((w) => filter === 'all' || w.type === filter)
  const pos = S.wallets.filter((w) => c.bal[w.id] > 0), pal = palette(ui.accent, pos.length)
  const colorOf = Object.fromEntries(pos.map((w, i) => [w.id, cleanColor(w.color) || pal[i % pal.length]]))

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Glass i={0} className="p-5 sm:p-6" style={{ background: 'linear-gradient(135deg, rgb(var(--a) / .24), rgb(var(--s1) / .5) 72%)', borderColor: 'rgb(var(--a) / .32)' }}>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0"><div className="text-sm text-mu">Total liquid cash</div><div className={'text-3xl sm:text-4xl font-semibold tracking-tight mt-1 tabular-nums ' + (c.liquid < 0 ? 'text-neg' : '')}><Num v={c.liquid} /></div></div>
          <div className="text-right text-xs text-mu shrink-0"><div>{S.wallets.length} wallet{S.wallets.length === 1 ? '' : 's'}</div><div className="mt-0.5">{php(c.spendable)} spendable</div></div>
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-fg/10 mt-5 gap-0.5" role="img" aria-label="Share of liquid cash by wallet type">
          {byType.map(({ t, total }, i) => share(total) > 0 && <i key={t} className="block h-full transition-all duration-700" style={{ width: share(total) + '%', background: typeCol[i] }} />)}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {byType.map(({ t, n, total }, i) => (
            <div key={t} className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-mu"><i className="w-2 h-2 rounded-full shrink-0" style={{ background: typeCol[i] }} /><span className="truncate">{WTYPES[t].plural} ({n})</span></div>
              <div className="text-sm font-semibold tabular-nums mt-0.5 truncate">{php(total)}</div>
              <div className="text-[10px] text-mu">{pct1(share(total))}</div>
            </div>
          ))}
        </div>
      </Glass>

      {S.showCashPie && <Fold i={1} open title="Where your cash sits" right={<span>{pos.length} with funds</span>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <Donut size={190} data={pos.map((w) => ({ name: w.name, value: c.bal[w.id], color: colorOf[w.id] }))} center={php(c.liquid)} sub="liquid cash" />
          <div className="space-y-2.5">
            {pos.length ? pos.slice().sort((a, b) => c.bal[b.id] - c.bal[a.id]).map((w) => <div key={w.id} className="flex items-center gap-2 text-sm"><i className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorOf[w.id] }} /><span className="truncate flex-1">{w.name}</span><span className="text-mu text-xs tabular-nums">{pct1(share(c.bal[w.id]))}</span></div>) : <p className="text-sm text-mu">Add money to a wallet to see how your cash is spread.</p>}
          </div>
        </div>
      </Fold>}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="chips" role="tablist" aria-label="Filter wallets">
          {[['all', 'All'], ...WORDER.map((t) => [t, WTYPES[t].plural])].map(([k, l]) => <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className={'btn ' + (filter === k ? 'btn-p' : '')}>{l}</button>)}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ReceiptButton />
          <button className="btn btn-p" onClick={() => openSheet({ k: 'wallet', item: null })}><Ic n="plus" s={16} />Add wallet</button>
        </div>
      </div>

      {/* Wallet cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
        {shown.map((w, i) => {
          const bal = c.bal[w.id], neg = bal < 0, hex = cleanColor(w.color)
          return (
            <Glass key={w.id} i={i + 2} className="p-4 sm:p-5" style={hex ? { borderColor: hex + '66' } : undefined}>
              {hex && <i aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ background: 'linear-gradient(135deg, ' + hex + '2e, ' + hex + '0d 55%, transparent 85%)' }} />}
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className={'grid place-items-center w-10 h-10 rounded-2xl shrink-0 ' + (hex ? '' : 'bg-ac/15 text-ac')} style={hex ? { background: hex + '29', color: hex } : undefined}><Ic n={(WTYPES[w.type] || WTYPES.Cash).icon} s={19} /></span>
                  <div className="min-w-0 flex-1"><div className="font-semibold truncate flex items-center gap-1.5">{hex && <i className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: hex }} />}<span className="truncate">{w.name}</span></div><div className="text-xs text-mu">{w.type}</div></div>
                  <div className="text-right shrink-0"><div className={'text-lg font-semibold tabular-nums ' + (neg ? 'text-neg' : '')}><Num v={bal} /></div><div className="text-[11px] text-mu">{pct1(share(bal))} of cash</div></div>
                  <div className="-mr-2 shrink-0"><OptionsMenu label={'Options for ' + w.name} items={[
                    { label: 'Edit Balance', icon: 'cash', onClick: () => openSheet({ k: 'balance', item: w }) },
                    { label: 'Edit Name', icon: 'pen', onClick: () => openSheet({ k: 'wallet', item: w }) },
                    { label: 'Color Code', icon: 'palette', onClick: () => openSheet({ k: 'color', item: w }) },
                    { label: 'Delete', icon: 'trash', danger: true, onClick: () => openSheet({ k: 'delete', item: w }) }
                  ]} /></div>
                </div>
                <div className="mt-3"><Bar pct={share(bal)} /></div>
              </div>
            </Glass>
          )
        })}
      </div>
      {!shown.length && <Empty t={'No ' + (WTYPES[filter] ? WTYPES[filter].plural.toLowerCase() : 'wallets') + ' yet.'} />}
    </div>
  )
}

/* ---------- Settings ---------- */
// Two-step confirm button for destructive actions.
function Confirm({ label, warn, yes, onYes, danger }) {
  const [on, setOn] = useState(false)
  if (!on) return <button className={'btn ' + (danger ? 'btn-d' : '')} onClick={() => setOn(true)}>{label}</button>
  return (
    <div className="w-full space-y-2" role="alert">
      <p className={'text-sm ' + (danger ? 'text-neg' : 'text-mu')}>{warn}</p>
      <div className="flex gap-2"><button className="btn flex-1" onClick={() => setOn(false)}>Cancel</button><button className={'btn flex-1 ' + (danger ? 'btn-d' : 'btn-p')} onClick={() => { onYes(); setOn(false) }}>{yes}</button></div>
    </div>
  )
}

// Full-width settings row: icon, label, optional hint, chevron.
const Row = ({ icon, label, hint, onClick, danger, disabled }) => (
  <button disabled={disabled} onClick={onClick} className={'w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors disabled:opacity-50 ' + (danger ? 'text-neg hover:bg-neg/10' : 'hover:bg-fg/5')}>
    <span className={'grid place-items-center w-9 h-9 rounded-full shrink-0 ' + (danger ? 'bg-neg/15' : 'bg-ac/15 text-ac')}><Ic n={icon} s={17} /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{label}</span>{hint && <span className="block text-xs text-mu truncate">{hint}</span>}</span>
    <Ic n="right" s={16} cls="text-mu shrink-0" />
  </button>
)

/* Live preview tile for a theme: the real page gradient, a flat card surface. */
function ThemeChip({ t, dark, on, onPick }) {
  const lk = lookOf(t, dark, t.a), col = dark ? t.d : t.l, acc = 'rgb(' + accentOf(t, dark) + ')'
  const grainLayer = (extra) => lk.grain !== 'none' && <i className="absolute inset-0 pointer-events-none" style={{ backgroundImage: lk.grain, backgroundSize: '220px 220px', mixBlendMode: 'soft-light', ...extra }} />
  return (
    <button aria-pressed={on} onClick={onPick} className="text-left rounded-2xl p-2 sm:p-2.5 relative overflow-hidden transition-transform active:scale-[.97]" style={{ backgroundColor: col[0], backgroundImage: lk.page, border: '1px solid ' + (on ? acc : col[3]), boxShadow: on ? '0 0 0 2px ' + acc : 'var(--e1)' }}>
      {grainLayer()}
      <div className="relative rounded-xl p-2 overflow-hidden" style={{ backgroundColor: col[1], border: '1px solid ' + col[3], boxShadow: 'var(--e1)' }}>
        {grainLayer()}
        <div className="relative h-1.5 w-8 rounded-full" style={{ background: acc }} />
        <div className="relative h-1.5 w-12 rounded-full mt-1.5" style={{ background: col[3] }} />
      </div>
      <div className="relative text-[13px] sm:text-sm font-medium mt-2 flex items-center gap-1" style={{ color: 'rgb(' + (lk.fg || (dark ? '250 250 250' : '24 24 27')) + ')' }}>{t.name}{on && <Ic n="check" s={14} />}</div>
    </button>
  )
}

function Settings({ openSheet }) {
  const { S, ui, user, guest, auth, set, loadSample, clearData, addSrc, delSrc } = useApp()
  const upd = useUpdate(), [ver, setVer] = useState(''), [chk, setChk] = useState('')
  useEffect(() => { swVersion().then(setVer) }, [upd])
  const check = async () => { setChk('checking'); setChk(await checkUpdate()) }
  const chkTxt = { checking: 'Checking…', latest: 'You are on the latest version.', available: 'A new version is ready.', error: 'Could not check. Are you online?', unsupported: 'Updates are not supported in this browser.' }[chk]
  const hasNew = !!upd || chk === 'available'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5 items-start">
      {/* Profile */}
      <Glass i={0} className="p-5">
        <div className="flex items-center gap-4">
          <Avatar size={64} cls="ring-2 ring-ac/30" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-lg truncate">{S.name.trim() || 'Add your name'}</div>
            <div className="text-xs text-mu truncate">{user ? user.email : guest ? 'Guest on this device' : 'Not signed in'}</div>
            <div className="mt-2"><SyncBadge /></div>
          </div>
        </div>
        <button className="btn w-full mt-4" onClick={() => openSheet({ k: 'profile' })}><Ic n="pen" s={15} />Edit name &amp; avatar</button>
        <button className="btn btn-p w-full mt-2" onClick={() => openSheet({ k: 'data' })}><Ic n="dl" s={15} />Import / Export Data</button>
      </Glass>

      {/* Account & security */}
      <Glass i={1} className="p-3 sm:p-4">
        <h3 className="font-semibold px-2 pt-1 pb-2">Account &amp; security</h3>
        {user ? (
          <div className="space-y-0.5">
            <Row icon="key" label="Change password" hint={hasPassword(user) ? 'Confirm your current password first' : 'Managed by Google'} onClick={() => openSheet({ k: 'password' })} />
            <Row icon="logout" label="Log out" hint="Your data stays safe in your account" onClick={auth.logout} />
            <Row danger icon="trash" label="Delete account" hint="Permanently erase your account and data" onClick={() => openSheet({ k: 'delacct' })} />
          </div>
        ) : (
          <div className="px-2 pb-2">
            <p className="text-sm text-mu">{guest ? 'You are using Budgy on this device only. Sign in to back up and sync across your phone and computer.' : 'Not signed in.'}</p>
            <button className="btn btn-p mt-3 w-full" onClick={auth.leaveGuest}>Sign in or create account</button>
          </div>
        )}
      </Glass>

      {/* Display */}
      <Glass i={2} className="p-3 sm:p-4">
        <h3 className="font-semibold px-2 pt-1 pb-2">Display</h3>
        <div className="px-2 pb-2 flex items-center gap-3">
          <div className="min-w-0 flex-1"><div className="text-sm font-medium">Cash pie chart</div><div className="text-xs text-mu">Show “Where your cash sits” on the Wallets tab. Off by default, since Total liquid cash already shows the sum.</div></div>
          <button type="button" role="switch" aria-checked={S.showCashPie === true} aria-label="Show the cash pie chart" onClick={() => set({ showCashPie: !S.showCashPie })} className={'relative shrink-0 w-12 h-7 rounded-full transition-colors ' + (S.showCashPie ? 'bg-ac' : 'bg-fg/25')}>
            <i className={'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ' + (S.showCashPie ? 'translate-x-5' : '')} />
          </button>
        </div>
      </Glass>

      {/* Pending sources: Payables / Receivables and any other source, with add, rename and delete */}
      <Glass i={2} className="p-3 sm:p-4">
        <h3 className="font-semibold px-2 pt-1 pb-1">Pending sources</h3>
        <p className="text-xs text-mu px-2 pb-2">Sources group your payables and receivables on the Pending tab.</p>
        <div className="space-y-1">
          {(S.srcs || []).map((x) => {
            const n = S.debts.filter((d) => d.kind === x.kind && d.cat === x.name).length, pay = x.kind === 'payable'
            return (
              <div key={x.kind + '|' + x.name} className="flex items-center gap-2 rounded-2xl px-2 py-1">
                <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{x.name}</div><div className="text-xs text-mu">{pay ? 'Payable' : 'Receivable'} · {n} item{n === 1 ? '' : 's'}</div></div>
                <OptionsMenu label={'Options for ' + x.name} items={[
                  { label: 'Edit Name', icon: 'pen', onClick: () => openSheet({ k: 'source', item: { kind: x.kind, name: x.name } }) },
                  { label: 'Delete', icon: 'trash', danger: true, onClick: () => delSrc(x.kind, x.name), confirm: { warn: 'Delete “' + x.name + '”? ' + (n ? 'Its ' + n + ' item' + (n === 1 ? '' : 's') + ' and payment history are deleted too. ' : '') + 'This can’t be undone.', yes: 'Yes, delete' } }
                ]} />
              </div>
            )
          })}
          {!(S.srcs || []).length && <p className="text-sm text-mu px-2 py-1">No sources yet.</p>}
        </div>
        <div className="flex flex-wrap gap-2 px-2 pt-2 pb-1">
          {PS_DEFAULTS.filter((x) => !hasSrc(S.srcs || [], x.kind, x.name)).map((x) => <button key={x.kind} className="btn !py-1.5 !text-xs" onClick={() => addSrc(x.kind, x.name)}><Ic n="plus" s={14} />Restore “{x.name}”</button>)}
          <button className="btn btn-p !py-1.5 !text-xs" onClick={() => openSheet({ k: 'source', item: null })}><Ic n="plus" s={14} />Add source</button>
        </div>
      </Glass>

      {/* App & storage */}
      <Glass i={2} className="p-3 sm:p-4">
        <h3 className="font-semibold px-2 pt-1 pb-2">App &amp; storage</h3>
        <div className="px-2 pb-2 flex items-center justify-between gap-3">
          <div className="min-w-0"><div className="text-sm">{hasNew ? 'Update available' : 'Version'}</div><div className="text-xs text-mu truncate">{chkTxt || ver || 'Checks automatically while the app is open.'}</div></div>
          {hasNew ? <button className="btn btn-p !py-1.5 !px-3.5 !text-xs shrink-0" onClick={applyUpdate}>Update Now</button> : <button className="btn !py-1.5 !px-3.5 !text-xs shrink-0" disabled={chk === 'checking'} onClick={check}><Ic n="refresh" s={14} cls={chk === 'checking' ? 'animate-spin' : ''} />Check</button>}
        </div>
        <div className="space-y-0.5">
          <Row icon="book" label="Replay welcome guide" hint="A quick tour of Budgy" onClick={() => openSheet({ k: 'guide' })} />
          <Row danger icon="refresh" label="Reset site data / Clear cache" hint="Fresh start on this device. Cloud data is kept" onClick={() => openSheet({ k: 'reset' })} />
        </div>
      </Glass>

      {/* Appearance */}
      <Glass i={3} className="p-5 md:col-span-2">
        <h3 className="font-semibold">Appearance</h3>
        <div className="text-xs text-mu mt-4 mb-2">Mode</div>
        <div className="glass-tile p-1 inline-grid grid-cols-3 gap-1 w-full sm:w-auto" role="radiogroup" aria-label="Colour mode">
          {MODES.map(([k, l, ic]) => <button key={k} role="radio" aria-checked={S.mode === k} onClick={() => set({ mode: k })} className={'btn !rounded-xl sm:!px-5 !border-transparent ' + (S.mode === k ? 'btn-p' : '!bg-transparent')}><Ic n={ic} s={16} />{l}</button>)}
        </div>
        <div className="text-xs text-mu mt-5 mb-2">Colour presets</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEMES.map((t) => <ThemeChip key={t.id} t={t} dark={ui.dark} on={S.theme === t.id} onPick={() => set({ theme: t.id, accent: '' })} />)}
        </div>
        <p className="text-xs text-mu mt-3">A theme sets the surfaces and accent. Fine-tune the accent in the card next to this one.</p>
      </Glass>

      {/* Accent */}
      <Glass i={4} className="p-5">
        <h3 className="font-semibold mb-3">Accent colour</h3>
        <div className="flex flex-wrap gap-3">
          {SWATCHES.map(([n, col]) => <button key={n} title={n} aria-label={n} aria-pressed={ui.accent === col} onClick={() => set({ accent: col })} className="relative w-9 h-9 rounded-full transition-transform hover:scale-110 active:scale-90" style={{ background: 'rgb(' + col + ')' }}>{ui.accent === col && <span className="absolute -inset-1.5 rounded-full border-2 border-fg/80" />}</button>)}
        </div>
        <label className="flex items-center gap-3 mt-5 text-sm text-mu">Custom<input type="color" className="w-12 h-9" value={rgbToHex(ui.accent)} onInput={(e) => set({ accent: hexToRgb(e.target.value) })} onChange={(e) => set({ accent: hexToRgb(e.target.value) })} aria-label="Custom accent colour" /></label>
        {S.accent && <button className="btn mt-4 !py-1.5 !text-xs" onClick={() => set({ accent: '' })}>Reset to preset accent</button>}
      </Glass>

      {/* Back Tap quick expense (v6) */}
      <Glass i={4} className="p-5 md:col-span-2 xl:col-span-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <span className="hidden sm:grid place-items-center w-11 h-11 rounded-2xl bg-ac/15 text-ac shrink-0"><Ic n="phone" s={20} /></span>
          <div className="flex-1 min-w-0"><h3 className="font-semibold">Back Tap quick expense</h3><p className="text-sm text-mu mt-0.5">Tap the back of your iPhone, type an amount in a small pop-up, and Budgy saves it. Includes ready-to-copy steps for the Shortcuts app.</p></div>
          <button className="btn btn-p w-full sm:w-auto shrink-0" onClick={() => openSheet({ k: 'backtap' })}><Ic n="sparkle" s={16} />Set up Back Tap</button>
        </div>
      </Glass>

      {/* Data */}
      <Glass i={5} className="p-5 md:col-span-2 xl:col-span-3">
        <h3 className="font-semibold">Data</h3>
        <div className="flex flex-wrap gap-3 mt-3">
          <button className="btn btn-p w-full sm:w-auto" onClick={() => openSheet({ k: 'data' })}><Ic n="dl" s={16} />Import / Export Data</button>
          <button className="btn w-full sm:w-auto" onClick={() => openSheet({ k: 'shortcuts' })}><Ic n="phone" s={16} />Add to iOS Shortcuts</button>
        </div>
        <p className="text-sm text-mu mt-4">Load demo data to preview the app, or clear all wallets, transactions, payables and goals. Your name, avatar and appearance settings are kept.</p>
        <div className="flex flex-wrap gap-3 mt-4 items-start">
          <div className="w-full sm:w-72"><Confirm label="Load sample data" yes="Replace my data" warn="This replaces your current wallets, transactions, payables and goals with demo data." onYes={loadSample} /></div>
          <div className="w-full sm:w-72"><Confirm danger label="Clear all data" yes="Yes, clear everything" warn="This permanently deletes all wallets, transactions, payables and goals, here and in your cloud account." onYes={clearData} /></div>
        </div>
      </Glass>
    </div>
  )
}

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

function NetWorthCard() {
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

      <Glass i={1} className="p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-semibold">Statement</div>
          <div className="text-xs text-mu">Cash + receivables − payables</div>
        </div>
        <div className="grid grid-cols-1 gap-2.5 mt-3">
          <Tile l="Spendable" v={mask(c.spendable)} tone={c.spendable < 0 ? 'text-neg' : ''} />
        </div>
        <div className="mt-4">
          <div className="nc-bar" role="img" aria-label="Share of cash, receivables and payables">
            {parts.map(([n, v, col]) => <i key={n} style={{ width: (v / total) * 100 + '%', background: col }} />)}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-mu">
            {parts.map(([n, v, col]) => <span key={n} className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full inline-block" style={{ background: col }} />{n} {Math.round((v / total) * 100)}%</span>)}
          </div>
        </div>
      </Glass>
      {edit && ReactDOM.createPortal(<CardSettings onClose={closeEdit} />, document.body)}
    </div>
  )
}

/* ---------- Home ---------- */
// v5 Phase 1 layout: the Net Worth credit card, one slim "this month" card, three compact quick actions, then up to five sections in a
// two-column grid on wide screens. A section with no data (no spending, no goals, no activity, or a brand-new empty budget) is not rendered
// at all, so there are no empty boxes. When the visible sections are an odd number, the last one stretches across both columns.
function Home({ goto, openSheet }) {
  const { S, c, ui, loadSample } = useApp()
  const t0 = off(0), W = Object.fromEntries(S.wallets.map((w) => [w.id, w]))
  const cats = Object.entries(c.cat).sort((a, b) => b[1] - a[1])
  const mx = Math.max(c.liquid, c.projected, 1)
  const empty = !S.tx.length && !S.debts.length && !S.goals.length && S.wallets.every((w) => !+w.balance)
  const entries = [
    ...S.tx.filter((x) => x.date <= t0).map((x) => ({ id: x.id, type: x.type, title: x.note || x.category, sub: x.category + ' · ' + ((W[x.wallet] || {}).name || 'Removed') + (x.type === 'transfer' ? ' → ' + ((W[x.to] || {}).name || '?') : ''), amount: x.amount, date: x.date })),
    ...S.debts.flatMap((d) => (d.payments || []).map((p) => ({ id: p.id, type: d.kind === 'payable' ? 'expense' : 'income', title: (d.kind === 'payable' ? 'Paid · ' : 'Received · ') + d.party, sub: d.cat + ' · ' + ((W[p.wallet] || {}).name || 'Removed'), amount: p.amount, date: p.date })))
  ].sort((a, b) => b.date.localeCompare(a.date))
  const pal = palette(ui.accent, cats.length)
  const donut = cats.map(([k, v], i) => ({ name: k, value: v, color: pal[i % pal.length] }))
  const goalPct = (c.saved / Math.max(c.target, 1)) * 100
  const actions = [['Expense', 'down', 'expense'], ['Income', 'up', 'income'], ['Transfer', 'swap', 'transfer']]
  // What has data to show. Anything false is left out of the page entirely.
  const showFunds = !empty, showProj = !empty
  const showCats = cats.length > 0, showGoals = S.goals.length > 0, showRecent = entries.length > 0

  return (
    <div className="space-y-3.5">
      {empty && (
        <Glass className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4" style={{ borderColor: 'rgb(var(--a) / .35)' }}>
          <span className="hidden sm:grid place-items-center w-11 h-11 rounded-2xl bg-ac/15 text-ac shrink-0"><Ic n="sparkle" s={20} /></span>
          <div className="flex-1"><div className="font-semibold">Let’s get you started</div><p className="text-sm text-mu mt-0.5">Set your wallet balances, or load sample data to preview the app.</p></div>
          <div className="flex gap-2 shrink-0"><button className="btn" onClick={() => goto('wallets')}>Set up wallets</button><button className="btn btn-p" onClick={loadSample}>Load sample data</button></div>
        </Glass>
      )}

      {/* Net Worth credit card + statement */}
      <NetWorthCard />

      {/* This month, in one slim row */}
      <Glass i={1} className="p-3.5 sm:p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0"><div className="text-xs text-mu">Spent in {c.monthName}</div><div className="text-xl sm:text-2xl font-semibold tracking-tight tabular-nums text-neg mt-0.5"><Num v={c.spent} /></div></div>
          <div className="text-right text-xs text-mu shrink-0"><div><b className="text-fg font-semibold">{c.left === 0 ? 'Last day' : c.left + ' day' + (c.left === 1 ? '' : 's') + ' left'}</b></div><div className="mt-0.5 tabular-nums">forecast {php(c.fc)}</div></div>
        </div>
        <div className="mt-2.5"><Bar pct={c.monthPct} /><div className="flex justify-between text-[10px] text-mu mt-1"><span>Day {c.day}</span><span>of {c.dim}</span></div></div>
      </Glass>

      {/* Quick actions: compact pills, icon beside label */}
      <div className="grid grid-cols-3 gap-2.5">
        {actions.map(([l, ic, kind]) => <button key={kind} className="glass !rounded-2xl py-2.5 px-2 flex items-center justify-center gap-2 text-sm font-medium transition-transform duration-200 active:scale-95" onClick={() => openSheet({ k: 'tx', kind })}><span className="grid place-items-center w-8 h-8 rounded-full bg-ac/15 text-ac shrink-0"><Ic n={ic} s={16} /></span><span className="truncate">{l}</span></button>)}
      </div>

      {/* Sections: only those that have data */}
      {(showFunds || showProj || showCats || showGoals || showRecent) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start lg:[&>*:last-child:nth-child(odd)]:col-span-2">
          {showFunds && (
            <Fold open i={2} title="Allocated funds" right={<span className="tabular-nums">{php(c.spendable)} spendable</span>}>
              <div className="grid grid-cols-3 gap-2"><Tile l="Liquid cash" v={php(c.liquid)} /><Tile l="Allocated" v={php(c.allocated)} tone="text-ac" /><Tile l="Spendable" v={php(c.spendable)} tone={c.spendable < 0 ? 'text-neg' : ''} /></div>
              <div className="mt-3"><Bar lg pct={(c.allocated / Math.max(c.liquid, 1)) * 100} /></div>
              <p className="text-xs text-mu mt-2">{php(c.allocD)} reserved for payables · {php(c.saved)} in savings goals. Allocated money is locked from spending.{c.spendable < 0 ? ' Allocations currently exceed your cash.' : ''}</p>
              <button className="btn mt-3 !py-1.5 !px-3 !text-xs" onClick={() => goto('plan')}>Manage allocation</button>
            </Fold>
          )}

          {showProj && (
            <Fold open i={3} title="End-of-month projection" right={<span className={'tabular-nums ' + (c.projected < 0 ? 'text-neg' : '')}>{php(c.projected)}</span>}>
              <div className="space-y-3.5">
                <div><div className="flex justify-between text-sm mb-1.5"><span className="text-mu">Current balance</span><span className="tabular-nums">{php(c.liquid)}</span></div><Bar lg gray pct={(c.liquid / mx) * 100} /></div>
                <div><div className="flex justify-between text-sm mb-1.5"><span className="text-mu">Projected balance</span><span className={'font-semibold tabular-nums ' + (c.projected < 0 ? 'text-neg' : '')}>{php(c.projected)}</span></div><Bar lg pct={(c.projected / mx) * 100} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3.5">
                {[['Pending net', c.pend], ['Receivables due', c.dRec], ['Payables due', -c.dPay], ['Forecast expenses', -c.fc]].map(([a, b]) => <Tile key={a} l={a} v={(b > 0 ? '+' : b < 0 ? '−' : '') + php(Math.abs(b))} tone={b < 0 ? 'text-neg' : b > 0 ? 'text-pos' : ''} />)}
              </div>
            </Fold>
          )}

          {showCats && (
            <Fold open i={4} title="Spending by category" right={<span className="tabular-nums">{php(c.spent)}</span>}>
              <Donut data={donut} size={150} center={php(c.spent)} sub={'this ' + c.monthName.slice(0, 3)} />
              <div className="space-y-2 mt-2.5">{cats.slice(0, 4).map(([k, v], i) => <div key={k}><div className="flex justify-between text-xs mb-1"><span className="flex items-center gap-2 text-mu"><i className="w-2 h-2 rounded-full inline-block" style={{ background: pal[i % pal.length] }} />{k}</span><span className="text-neg tabular-nums">{php(v)}</span></div><Bar pct={(v / cats[0][1]) * 100} /></div>)}</div>
              {cats.length > 4 && <p className="text-[11px] text-mu mt-2">+ {cats.length - 4} more {cats.length - 4 === 1 ? "category" : "categories"}</p>}
            </Fold>
          )}

          {showGoals && (
            <Fold open i={5} title="Savings goals" right={<span>{pct1(goalPct) + ' overall'}</span>}>
              <div className="space-y-3.5">{S.goals.map((g) => <div key={g.id}><div className="flex justify-between text-sm mb-1.5 gap-2"><span className="truncate">{g.name}</span><span className="text-mu text-xs whitespace-nowrap tabular-nums">{php(g.saved)} / {php(g.target)}</span></div><Bar pct={(g.saved / g.target) * 100} /></div>)}</div>
              <button className="btn mt-3.5 !py-1.5 !px-3 !text-xs" onClick={() => goto('goals')}>Open goals</button>
            </Fold>
          )}

          {showRecent && (
            <div className="lg:col-span-2">
              <Fold open i={6} title="Recent activity" right={<span>{Math.min(5, entries.length) + ' latest'}</span>}>
                {entries.slice(0, 5).map((x, i) => (
                  <div key={x.id} className={'flex items-center gap-3 py-2 ' + (i ? 'border-t border-fg/10' : '')}>
                    <span className={'grid place-items-center w-9 h-9 rounded-full shrink-0 ' + (x.type === 'income' ? 'bg-pos/15 text-pos' : x.type === 'expense' ? 'bg-neg/15 text-neg' : 'bg-fg/10 text-mu')}><Ic n={x.type === 'income' ? 'up' : x.type === 'expense' ? 'down' : 'swap'} s={16} /></span>
                    <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{x.title}</div><div className="text-xs text-mu truncate">{x.sub} · {fd(x.date)}</div></div>
                    <div className={'text-sm font-semibold whitespace-nowrap tabular-nums text-right ' + (x.type === 'income' ? 'text-pos' : x.type === 'expense' ? 'text-neg' : '')}>{x.type === 'income' ? '+' : x.type === 'expense' ? '−' : ''}{php(x.amount)}</div>
                  </div>
                ))}
              </Fold>
            </div>
          )}
        </div>
      )}
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
  const colorOf = Object.fromEntries(pos.map((w, i) => [w.id, pal[i % pal.length]]))

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

      <Fold i={1} title="Where your cash sits" right={<span>{pos.length} with funds</span>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <Donut size={190} data={pos.map((w) => ({ name: w.name, value: c.bal[w.id], color: colorOf[w.id] }))} center={php(c.liquid)} sub="liquid cash" />
          <div className="space-y-2.5">
            {pos.length ? pos.slice().sort((a, b) => c.bal[b.id] - c.bal[a.id]).map((w) => <div key={w.id} className="flex items-center gap-2 text-sm"><i className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorOf[w.id] }} /><span className="truncate flex-1">{w.name}</span><span className="text-mu text-xs tabular-nums">{pct1(share(c.bal[w.id]))}</span></div>) : <p className="text-sm text-mu">Add money to a wallet to see how your cash is spread.</p>}
          </div>
        </div>
      </Fold>

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
          const bal = c.bal[w.id], neg = bal < 0
          return (
            <Glass key={w.id} i={i + 2} className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-2xl bg-ac/15 text-ac shrink-0"><Ic n={(WTYPES[w.type] || WTYPES.Cash).icon} s={19} /></span>
                <div className="min-w-0 flex-1"><div className="font-semibold truncate">{w.name}</div><div className="text-xs text-mu">{w.type}</div></div>
                <div className="text-right shrink-0"><div className={'text-lg font-semibold tabular-nums ' + (neg ? 'text-neg' : '')}><Num v={bal} /></div><div className="text-[11px] text-mu">{pct1(share(bal))} of cash</div></div>
              </div>
              <div className="mt-3"><Bar pct={share(bal)} /></div>
              <div className="flex gap-2 mt-4">
                <button className="btn flex-1 !py-2" onClick={() => openSheet({ k: 'balance', item: w })}>Edit balance</button>
                <button className="btn btn-i shrink-0" aria-label={'Rename or change type of ' + w.name} title="Edit wallet" onClick={() => openSheet({ k: 'wallet', item: w })}><Ic n="pen" s={15} /></button>
                <button className="btn btn-d btn-i shrink-0" aria-label={'Delete ' + w.name} title="Delete wallet" onClick={() => openSheet({ k: 'delete', item: w })}><Ic n="trash" s={15} /></button>
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
  const { S, ui, user, guest, auth, set, loadSample, clearData } = useApp()
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

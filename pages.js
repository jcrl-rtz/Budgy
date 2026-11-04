/* =====================================================================
   pages.js  (Phase 3: Home and Wallets redesigned, Settings rebuilt)
   Shared helpers used by p2.js: Empty, Tile, Confirm.
   ===================================================================== */

const Empty = ({ t }) => <p className="text-sm text-mu py-6 text-center">{t}</p>
const Tile = ({ l, v, tone = '' }) => <div className="glass-tile p-3"><div className="text-[11px] sm:text-xs text-mu">{l}</div><div className={'mt-1 text-sm font-semibold tabular-nums ' + tone}>{v}</div></div>
// Small label + value pair used inside the hero cards.
const Mini = ({ l, v, tone = '' }) => <div className="min-w-0"><div className="text-[11px] text-mu truncate">{l}</div><div className={'mt-0.5 text-sm sm:text-base font-semibold tabular-nums truncate ' + tone}>{v}</div></div>

/* ---------- Home ---------- */
// Layout: one hero card, one slim "this month" card, three quick actions, then five folded sections.
// Every section below the quick actions starts collapsed so the screen stays calm until you ask for detail.
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

  return (
    <div className="space-y-4">
      {empty && (
        <Glass className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4" style={{ borderColor: 'rgb(var(--a) / .35)' }}>
          <span className="hidden sm:grid place-items-center w-11 h-11 rounded-2xl bg-ac/15 text-ac shrink-0"><Ic n="sparkle" s={20} /></span>
          <div className="flex-1"><div className="font-semibold">Let’s get you started</div><p className="text-sm text-mu mt-0.5">Set your wallet balances, or load sample data to preview the app.</p></div>
          <div className="flex gap-2 shrink-0"><button className="btn" onClick={() => goto('wallets')}>Set up wallets</button><button className="btn btn-p" onClick={loadSample}>Load sample data</button></div>
        </Glass>
      )}

      {/* Hero: the one number that matters, with three supporting figures */}
      <Glass i={0} className="p-5 sm:p-6" style={{ background: 'linear-gradient(135deg, rgb(var(--a) / .28), rgb(var(--s1) / .5) 72%)', borderColor: 'rgb(var(--a) / .35)' }}>
        <div className="text-sm text-mu">Net worth</div>
        <div className={'text-3xl sm:text-4xl font-semibold tracking-tight mt-1 tabular-nums ' + (c.net < 0 ? 'text-neg' : '')}><Num v={c.net} /></div>
        <div className="text-xs text-mu mt-1">Cash + receivables − payables</div>
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-fg/10">
          <Mini l="Liquid cash" v={php(c.liquid)} />
          <Mini l="Spendable" v={php(c.spendable)} tone={c.spendable < 0 ? 'text-neg' : ''} />
          <Mini l="Payables" v={php(c.pay)} tone={c.pay > 0 ? 'text-neg' : ''} />
        </div>
      </Glass>

      {/* This month, in one slim row */}
      <Glass i={1} className="p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0"><div className="text-xs text-mu">Spent in {c.monthName}</div><div className="text-xl sm:text-2xl font-semibold tracking-tight tabular-nums text-neg mt-0.5"><Num v={c.spent} /></div></div>
          <div className="text-right text-xs text-mu shrink-0"><div><b className="text-fg font-semibold">{c.left === 0 ? 'Last day' : c.left + ' day' + (c.left === 1 ? '' : 's') + ' left'}</b></div><div className="mt-0.5">forecast {php(c.fc)}</div></div>
        </div>
        <div className="mt-3"><Bar pct={c.monthPct} /><div className="flex justify-between text-[10px] text-mu mt-1"><span>Day {c.day}</span><span>of {c.dim}</span></div></div>
      </Glass>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2.5">
        {actions.map(([l, ic, kind]) => <button key={kind} className="glass backdrop-blur-md !rounded-2xl py-3 flex flex-col items-center gap-1.5 text-sm font-medium transition-transform active:scale-95 hover:bg-fg/5" onClick={() => openSheet({ k: 'tx', kind })}><span className="grid place-items-center w-9 h-9 rounded-full bg-ac/15 text-ac"><Ic n={ic} s={17} /></span>{l}</button>)}
      </div>

      {/* Folded sections (all closed by default) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Fold i={2} title="Allocated funds" right={<span className="tabular-nums">{php(c.spendable)} spendable</span>}>
          <div className="grid grid-cols-3 gap-2"><Tile l="Liquid cash" v={php(c.liquid)} /><Tile l="Allocated" v={php(c.allocated)} tone="text-ac" /><Tile l="Spendable" v={php(c.spendable)} tone={c.spendable < 0 ? 'text-neg' : ''} /></div>
          <div className="mt-3"><Bar lg pct={(c.allocated / Math.max(c.liquid, 1)) * 100} /></div>
          <p className="text-xs text-mu mt-2">{php(c.allocD)} reserved for payables · {php(c.saved)} in savings goals. Allocated money is locked from spending.{c.spendable < 0 ? ' Allocations currently exceed your cash.' : ''}</p>
          <button className="btn mt-3 !py-1.5 !px-3 !text-xs" onClick={() => goto('plan')}>Manage allocation</button>
        </Fold>

        <Fold i={3} title="End-of-month projection" right={<span className={'tabular-nums ' + (c.projected < 0 ? 'text-neg' : '')}>{php(c.projected)}</span>}>
          <div className="space-y-4">
            <div><div className="flex justify-between text-sm mb-1.5"><span className="text-mu">Current balance</span><span className="tabular-nums">{php(c.liquid)}</span></div><Bar lg gray pct={(c.liquid / mx) * 100} /></div>
            <div><div className="flex justify-between text-sm mb-1.5"><span className="text-mu">Projected balance</span><span className={'font-semibold tabular-nums ' + (c.projected < 0 ? 'text-neg' : '')}>{php(c.projected)}</span></div><Bar lg pct={(c.projected / mx) * 100} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {[['Pending net', c.pend], ['Receivables due', c.dRec], ['Payables due', -c.dPay], ['Forecast expenses', -c.fc]].map(([a, b]) => <Tile key={a} l={a} v={(b > 0 ? '+' : b < 0 ? '−' : '') + php(Math.abs(b))} tone={b < 0 ? 'text-neg' : b > 0 ? 'text-pos' : ''} />)}
          </div>
        </Fold>

        <Fold i={4} title="Spending by category" right={<span className="tabular-nums">{cats.length ? php(c.spent) : 'None yet'}</span>}>
          {cats.length ? (
            <>
              <Donut data={donut} size={170} center={php(c.spent)} sub={'this ' + c.monthName.slice(0, 3)} />
              <div className="space-y-2.5 mt-3">{cats.slice(0, 6).map(([k, v], i) => <div key={k}><div className="flex justify-between text-xs mb-1"><span className="flex items-center gap-2 text-mu"><i className="w-2 h-2 rounded-full inline-block" style={{ background: pal[i % pal.length] }} />{k}</span><span className="text-neg tabular-nums">{php(v)}</span></div><Bar pct={(v / cats[0][1]) * 100} /></div>)}</div>
            </>
          ) : <Empty t="No expenses recorded this month." />}
        </Fold>

        <Fold i={5} title="Savings goals" right={<span>{S.goals.length ? pct1(goalPct) + ' overall' : 'None yet'}</span>}>
          <div className="space-y-4">{S.goals.length ? S.goals.map((g) => <div key={g.id}><div className="flex justify-between text-sm mb-1.5 gap-2"><span className="truncate">{g.name}</span><span className="text-mu text-xs whitespace-nowrap tabular-nums">{php(g.saved)} / {php(g.target)}</span></div><Bar pct={(g.saved / g.target) * 100} /></div>) : <Empty t="No savings goals defined." />}</div>
          {S.goals.length > 0 && <button className="btn mt-4 !py-1.5 !px-3 !text-xs" onClick={() => goto('goals')}>Open goals</button>}
        </Fold>

        <div className="lg:col-span-2">
          <Fold i={6} title="Recent activity" right={<span>{entries.length ? Math.min(7, entries.length) + ' latest' : 'None yet'}</span>}>
            {entries.slice(0, 7).map((x, i) => (
              <div key={x.id} className={'flex items-center gap-3 py-2.5 ' + (i ? 'border-t border-fg/10' : '')}>
                <span className={'grid place-items-center w-9 h-9 rounded-full shrink-0 ' + (x.type === 'income' ? 'bg-pos/15 text-pos' : x.type === 'expense' ? 'bg-neg/15 text-neg' : 'bg-fg/10 text-mu')}><Ic n={x.type === 'income' ? 'up' : x.type === 'expense' ? 'down' : 'swap'} s={16} /></span>
                <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{x.title}</div><div className="text-xs text-mu truncate">{x.sub} · {fd(x.date)}</div></div>
                <div className={'text-sm font-semibold whitespace-nowrap tabular-nums ' + (x.type === 'income' ? 'text-pos' : x.type === 'expense' ? 'text-neg' : '')}>{x.type === 'income' ? '+' : x.type === 'expense' ? '−' : ''}{php(x.amount)}</div>
              </div>
            ))}
            {!entries.length && <Empty t="No transactions recorded yet. Tap + to add one." />}
          </Fold>
        </div>
      </div>
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
        <button className="btn btn-p" onClick={() => openSheet({ k: 'wallet', item: null })}><Ic n="plus" s={16} />Add wallet</button>
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
        <div className="text-xs text-mu mt-5 mb-2">Presets</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const col = ui.dark ? t.d : t.l, on = S.theme === t.id
            return (
              <button key={t.id} aria-pressed={on} onClick={() => set({ theme: t.id, accent: t.a })} className="text-left rounded-2xl p-2.5 transition-transform active:scale-[.97]" style={{ background: col[0], border: '1px solid ' + (on ? 'rgb(' + t.a + ')' : col[3]), boxShadow: on ? '0 0 0 1px rgb(' + t.a + ')' : 'none' }}>
                <div className="rounded-xl p-2" style={{ background: col[1], border: '1px solid ' + col[3] }}><div className="h-1.5 w-8 rounded-full" style={{ background: 'rgb(' + t.a + ')' }} /><div className="h-1.5 w-12 rounded-full mt-1.5" style={{ background: col[3] }} /></div>
                <div className="text-sm font-medium mt-2 flex items-center gap-1" style={{ color: ui.dark ? '#fafafa' : '#18181b' }}>{t.name}{on && <Ic n="check" s={14} />}</div>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-mu mt-3">A preset sets the surface colours and the accent. Fine-tune the accent in the card next to this one.</p>
      </Glass>

      {/* Accent */}
      <Glass i={4} className="p-5">
        <h3 className="font-semibold mb-3">Accent colour</h3>
        <div className="flex flex-wrap gap-3">
          {SWATCHES.map(([n, col]) => <button key={n} title={n} aria-label={n} aria-pressed={ui.accent === col} onClick={() => set({ accent: col })} className="relative w-9 h-9 rounded-full transition-transform hover:scale-110 active:scale-90" style={{ background: 'rgb(' + col + ')' }}>{ui.accent === col && <span className="absolute -inset-1.5 rounded-full border-2 border-fg/80" />}</button>)}
        </div>
        <label className="flex items-center gap-3 mt-5 text-sm text-mu">Custom<input type="color" className="w-12 h-9" value={rgbToHex(ui.accent)} onInput={(e) => set({ accent: hexToRgb(e.target.value) })} onChange={(e) => set({ accent: hexToRgb(e.target.value) })} aria-label="Custom accent colour" /></label>
        {S.accent && S.accent !== (THEMES.find((t) => t.id === S.theme) || THEMES[0]).a && <button className="btn mt-4 !py-1.5 !text-xs" onClick={() => set({ accent: '' })}>Reset to preset accent</button>}
      </Glass>

      {/* Data */}
      <Glass i={5} className="p-5 md:col-span-2 xl:col-span-3">
        <h3 className="font-semibold">Data</h3>
        <p className="text-sm text-mu mt-1">Load demo data to preview the app, or clear all wallets, transactions, payables and goals. Your name, avatar and appearance settings are kept.</p>
        <div className="flex flex-wrap gap-3 mt-4 items-start">
          <div className="w-full sm:w-72"><Confirm label="Load sample data" yes="Replace my data" warn="This replaces your current wallets, transactions, payables and goals with demo data." onYes={loadSample} /></div>
          <div className="w-full sm:w-72"><Confirm danger label="Clear all data" yes="Yes, clear everything" warn="This permanently deletes all wallets, transactions, payables and goals, here and in your cloud account." onYes={clearData} /></div>
        </div>
      </Glass>
    </div>
  )
}

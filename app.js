/* =====================================================================
   app.js  (Phase 3)
   The responsive shell: sidebar on tablets/desktops, floating pill nav + circular FAB on phones.
   Phase 3 adds: avatar + sync badge in the header, the onboarding guide, the in-app update prompt and the account sheets.
   ===================================================================== */
const NAV = [['home', 'Home', 'home'], ['wallets', 'Wallets', 'wallet'], ['pending', 'Pending', 'swap'], ['plan', 'Allocate', 'pie'], ['goals', 'Goals', 'target']]

function App() {
  const { S, ready, user, guest, sync } = useApp()
  const [view, setView] = useState('home'), [sheet, setSheet] = useState(null)
  const openSheet = (s) => setSheet(s), closeSheet = () => setSheet(null)
  const goto = (v) => { setView(v); window.scrollTo({ top: 0 }) }

  if (!ready) return <div id="boot"><span /></div>
  if (!user && !guest) return <Auth />

  const hr = new Date().getHours(), greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'
  const title = view === 'home' ? greet + ', ' + (S.name.trim() || 'there') : view === 'settings' ? 'Settings' : (NAV.find((n) => n[0] === view) || NAV[0])[1]
  const page = { home: <Home goto={goto} openSheet={openSheet} />, wallets: <Wallets openSheet={openSheet} />, pending: <Pending openSheet={openSheet} />, plan: <Allocate />, goals: <GoalsPage openSheet={openSheet} />, settings: <Settings openSheet={openSheet} /> }[view]

  // Onboarding: shown once, only to a brand-new budget, and only after the cloud copy has been checked (so returning users never see a flash of it).
  const fresh = !S.tx.length && !S.debts.length && !S.goals.length && S.wallets.length <= 1 && S.wallets.every((w) => !+w.balance)
  const settled = user ? sync === 'synced' || sync === 'error' : true
  const guide = (!S.seen && fresh && settled && !sheet) || (sheet && sheet.k === 'guide')

  return (
    <div className="min-h-dvh">
      {/* Tablet / desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-30 w-[4.5rem] lg:w-60 flex-col p-2 lg:p-4 glass backdrop-blur-md backdrop-saturate-150 !rounded-none !border-y-0 !border-l-0">
        <div className="flex items-center justify-center lg:justify-start gap-2.5 px-1 py-3"><img src="./icons/icon-192.png" alt="" className="w-9 h-9 rounded-xl shrink-0" /><span className="hidden lg:inline text-lg font-bold tracking-tight">Budgy</span></div>
        <nav className="mt-4 space-y-1" aria-label="Main">
          {NAV.map(([k, l, ic]) => (
            <button key={k} title={l} aria-label={l} aria-current={view === k ? 'page' : undefined} onClick={() => goto(k)} className={'w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors ' + (view === k ? 'bg-ac/15 text-ac' : 'text-mu hover:text-fg hover:bg-fg/5')}>
              <Ic n={ic} s={19} /><span className="hidden lg:inline">{l}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <button className="w-full flex items-center justify-center lg:justify-start gap-3 rounded-2xl px-1.5 lg:px-2 py-1.5 hover:bg-fg/5 transition-colors text-left" title="Profile and settings" aria-label="Profile and settings" onClick={() => goto('settings')}>
            <Avatar size={34} /><span className="hidden lg:block min-w-0"><span className="block text-sm font-medium truncate">{S.name.trim() || 'Your profile'}</span><span className="block text-[11px] text-mu">Settings</span></span>
          </button>
          <div className="hidden lg:block px-1"><SyncBadge /></div>
          <button className="btn btn-p w-full !rounded-2xl !py-3" aria-label="Quick add" onClick={() => openSheet({ k: 'quick' })}><Ic n="plus" s={18} /><span className="hidden lg:inline">Quick Add</span></button>
        </div>
      </aside>

      {/* Content uses the full width next to the sidebar */}
      <main className="md:ml-[4.5rem] lg:ml-60 px-4 md:px-6 lg:px-8 min-w-0 pb-36 md:pb-10" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
        <header className="flex items-center justify-between gap-3 mb-5 md:pt-2">
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden shrink-0 rounded-full active:scale-95 transition-transform" aria-label="Profile and settings" onClick={() => goto('settings')}><Avatar size={44} /></button>
            <div className="min-w-0">
              <div className="text-xs text-ac font-medium">{new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight truncate">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SyncBadge short cls="backdrop-blur-md" />
            <button aria-label="Reports" title="Reports" onClick={() => openSheet({ k: 'report' })} className="btn btn-i backdrop-blur-md"><Ic n="file" s={18} /></button>
            <button aria-label="Settings" title="Settings" onClick={() => goto('settings')} className={'btn btn-i backdrop-blur-md ' + (view === 'settings' ? '!bg-ac/15 !text-ac !border-ac/30' : '')}><Ic n="gear" s={18} /></button>
          </div>
        </header>
        <div key={view} className="fade">{page}</div>
      </main>

      {/* Phone: floating pill navigation + circular FAB */}
      <button className="md:hidden fixed right-4 z-40 w-14 h-14 rounded-full bg-ac text-onac grid place-items-center active:scale-90 transition-transform" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 88px)', boxShadow: '0 14px 30px -10px rgb(var(--a) / .85), inset 0 1px 0 rgb(255 255 255 / .35)' }} aria-label="Quick add" onClick={() => openSheet({ k: 'quick' })}><Ic n="plus" s={26} /></button>
      <nav className="md:hidden glass backdrop-blur-md backdrop-saturate-150 fixed left-1/2 -translate-x-1/2 z-40 !rounded-full px-2 py-2 flex gap-1 max-w-[94vw]" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }} aria-label="Main">
        {NAV.map(([k, l, ic]) => (
          <button key={k} aria-label={l} aria-current={view === k ? 'page' : undefined} onClick={() => goto(k)} className={'flex flex-col items-center rounded-full px-3.5 py-1.5 transition-colors ' + (view === k ? 'bg-ac text-onac' : 'text-mu')}>
            <Ic n={ic} s={20} /><span className="text-[10px] font-semibold mt-0.5">{l}</span>
          </button>
        ))}
      </nav>

      {/* Sheets */}
      {sheet && sheet.k === 'quick' && <QuickAddSheet onClose={closeSheet} openSheet={openSheet} />}
      {sheet && sheet.k === 'wallet' && <WalletSheet item={sheet.item} onClose={closeSheet} />}
      {sheet && sheet.k === 'balance' && <BalanceSheet item={sheet.item} onClose={closeSheet} />}
      {sheet && <P2Sheets sheet={sheet} onClose={closeSheet} />}
      {sheet && <P3Sheets sheet={sheet} onClose={closeSheet} openSheet={openSheet} />}
      {sheet && sheet.k === 'delete' && <DeleteWalletSheet item={sheet.item} onClose={closeSheet} />}
      {guide && <Onboarding onClose={closeSheet} />}
    </div>
  )
}

class Boundary extends React.Component {
  state = { e: null }
  static getDerivedStateFromError(e) { return { e } }
  render() { return this.state.e ? <pre style={{ padding: 16, whiteSpace: 'pre-wrap', color: '#fda4af', font: '13px monospace' }}>{'Budgy crashed:\n\n' + String(this.state.e.stack || this.state.e)}</pre> : this.props.children }
}

let mounted = false
// UpdatePrompt sits outside <App /> so it also shows on the sign-in screen.
const mount = () => { if (mounted) return; mounted = true; ReactDOM.createRoot(document.getElementById('root')).render(<Boundary><Provider><App /><UpdatePrompt /></Provider></Boundary>) }
if (window.fb) mount()
else { addEventListener('fb-ready', mount, { once: true }); setTimeout(mount, 10000) } // if Firebase never loads, start in this-device-only mode

// Service worker + automatic update checks (see p3.js). Registers now if the page has already loaded.
if (document.readyState === 'complete') swInit(); else addEventListener('load', swInit)

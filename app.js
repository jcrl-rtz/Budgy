/* =====================================================================
   app.js  (Phase 1 of v3)
   The responsive shell.
   - Phones: header + floating Material navigation bar + rounded-square FAB.
   - From 700px wide (small tablets, landscape phones, desktops): the bar becomes a vertical navigation rail on the left
     (icons with labels; it widens into a full drawer at 1280px). The breakpoint is called "rail" in the Tailwind config in index.html.
   - The header never truncates: the greeting wraps onto as many lines as it needs and shrinks its font to stay tidy.
   ===================================================================== */
const NAV = [['home', 'Home', 'home'], ['wallets', 'Wallets', 'wallet'], ['pending', 'Pending', 'swap'], ['plan', 'Allocate', 'pie'], ['goals', 'Goals', 'target']]

const NAV_KEYS = NAV.map((n) => n[0])

/* v7 swipe between tabs. True when the touch began inside something that scrolls sideways or takes horizontal input
   (inputs, sliders, chip rows, wide tables), so those keep their own gestures. */
function ownsHorizontal(el, stop) {
  for (; el && el !== stop; el = el.parentElement) {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el.dataset && el.dataset.noswipe != null)) return true
    if (el.scrollWidth > el.clientWidth + 2) { const ox = getComputedStyle(el).overflowX; if (ox === 'auto' || ox === 'scroll') return true }
  }
  return false
}

/* Finger-following swipe on the content area. The page drags with the finger (with a rubber band on the first / last tab); past a distance or a quick flick
   it slides out and the next tab slides in. Only transform + opacity are touched, so it stays on the GPU. Disabled while a sheet is open. */
function useSwipeTabs(ref, on, view, go, enabled) {
  const st = useRef({}).current
  st.view = view; st.go = go; st.enabled = enabled
  useEffect(() => {
    const el = ref.current; if (!on || !el) return
    const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)
    const rest = (anim) => {
      el.style.transition = anim ? 'transform .32s var(--ease-out), opacity .32s' : 'none'
      el.style.transform = ''; el.style.opacity = ''
      if (anim) setTimeout(() => { el.style.transition = '' }, 340); else requestAnimationFrame(() => { el.style.transition = '' })
    }
    const start = (e) => {
      st.t = null
      if (e.touches.length !== 1 || !st.enabled) return
      const i = NAV_KEYS.indexOf(st.view); if (i < 0 || ownsHorizontal(e.target, el)) return
      st.t = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now(), lock: 0, i, raw: 0 }
    }
    const move = (e) => {
      const s = st.t; if (!s) return
      const dx = e.touches[0].clientX - s.x, dy = e.touches[0].clientY - s.y
      if (!s.lock) { if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return; s.lock = Math.abs(dx) > Math.abs(dy) * 1.3 ? 1 : -1 }
      if (s.lock !== 1) return
      s.raw = dx
      if (reduce) return
      const edge = (dx > 0 && s.i === 0) || (dx < 0 && s.i === NAV_KEYS.length - 1), d = dx * (edge ? 0.22 : 0.65)
      el.style.transition = 'none'; el.style.transform = 'translate3d(' + d + 'px,0,0)'; el.style.opacity = String(1 - Math.min(Math.abs(d) / 460, 0.4))
    }
    const end = () => {
      const s = st.t; st.t = null; if (!s || s.lock !== 1) return
      const dist = Math.abs(s.raw), fast = dist / Math.max(Date.now() - s.time, 1) > 0.5
      const j = s.i + (s.raw < 0 ? 1 : -1), commit = (dist > 72 || (dist > 32 && fast)) && j >= 0 && j < NAV_KEYS.length
      if (!commit) return rest(true)
      if (reduce) { rest(false); return st.go(NAV_KEYS[j]) }
      el.style.transition = 'transform .14s ease-in, opacity .14s ease-in'; el.style.transform = 'translate3d(' + (s.raw < 0 ? -46 : 46) + 'px,0,0)'; el.style.opacity = '0'
      setTimeout(() => { rest(false); st.go(NAV_KEYS[j]) }, 130)
    }
    const cancel = () => { if (st.t && st.t.lock === 1) rest(true); st.t = null }
    el.addEventListener('touchstart', start, { passive: true }); el.addEventListener('touchmove', move, { passive: true })
    el.addEventListener('touchend', end, { passive: true }); el.addEventListener('touchcancel', cancel, { passive: true })
    return () => { el.removeEventListener('touchstart', start); el.removeEventListener('touchmove', move); el.removeEventListener('touchend', end); el.removeEventListener('touchcancel', cancel) }
  }, [on])
}

/* Title that wraps instead of truncating. It starts at `max` px and steps down toward `min` px until it fits in `lines` lines;
   if it still needs more lines at the minimum size, it simply wraps further (it is never cut off with an ellipsis). */
function FitTitle({ text, max = 30, min = 18, lines = 2 }) {
  const ref = useRef(null), lastW = useRef(0)
  const fit = () => {
    const el = ref.current; if (!el) return
    let s = max; el.style.fontSize = s + 'px'
    while (s > min && el.scrollHeight > s * 1.16 * lines + 2) { s -= 1; el.style.fontSize = s + 'px' }
  }
  React.useLayoutEffect(fit, [text, max, min, lines])
  useEffect(() => {
    const el = ref.current; if (!el) return
    const run = () => { const w = el.clientWidth; if (w !== lastW.current) { lastW.current = w; fit() } } // width only, so resizing the font can never loop
    const ro = window.ResizeObserver ? new ResizeObserver(run) : null
    if (ro) ro.observe(el); else addEventListener('resize', run)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit) // re-measure once the Sora font has loaded
    return () => { if (ro) ro.disconnect(); else removeEventListener('resize', run) }
  }, [])
  return <h1 ref={ref} className="font-semibold tracking-tight" style={{ lineHeight: 1.16, textWrap: 'balance', overflowWrap: 'break-word', hyphens: 'auto' }}>{text}</h1>
}

function App() {
  const { S, c, ready, user, guest, sync, addTx, delTx } = useApp()
  const [view, setView] = useState('home'), [sheet, setSheet] = useState(null), [toast, setToast] = useState(null)
  const openSheet = (s) => setSheet(s), closeSheet = () => setSheet(null)
  const [dir, setDir] = useState(0), swipe = useRef(null)
  // dir tells the page transition which side the new tab comes from (+1 = from the right, -1 = from the left, 0 = Settings / deep links).
  const goto = (v) => { const a = NAV_KEYS.indexOf(view), b = NAV_KEYS.indexOf(v); setDir(a < 0 || b < 0 ? 0 : b > a ? 1 : -1); setView(v); window.scrollTo({ top: 0 }) }
  useSwipeTabs(swipe, ready && (!!user || guest), view, goto, !sheet)

  // Fades in the status-bar guard (see .safe-top in index.html) once the page has scrolled.
  useEffect(() => {
    const el = document.querySelector('.safe-top'); if (!el) return
    const f = () => el.classList.toggle('on', window.scrollY > 6)
    f(); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f)
  }, [])

  // Phase 3: an iOS Shortcuts / quick-add link (?add=expense&cat=Food ...) opens the matching form, pre-filled, once the budget is ready.
  // Links are captured at load time in shortcuts.js, so signing in first does not lose them.
  useEffect(() => {
    if (!ready || (!user && !guest) || (user && sync !== 'synced' && sync !== 'error')) return
    // v6: a deep link (?action=addExpense&amount=250) is saved straight away. A toast confirms it (with Undo) or says why nothing was saved.
    const dl = takeDeepLink()
    if (dl) {
      const r = buildDeepTx(S, c, dl)
      setView('home'); setSheet(null)
      if (!r.ok) setToast({ ok: false, msg: r.error })
      else {
        const id = addTx(r.tx), sign = r.tx.type === 'income' ? '+' : '−'
        setToast({ ok: true, msg: (r.tx.type === 'income' ? 'Income added ' : 'Expense added ') + sign + php(r.tx.amount), sub: r.tx.category + ' · ' + r.walletName + (r.tx.note ? ' · ' + r.tx.note : ''), undo: () => delTx(id) })
      }
      return
    }
    const sh = takeQuickAdd(S)
    if (sh) { setView(sh.k === 'debt' ? 'pending' : 'home'); setSheet(sh) }
  }, [ready, user, guest, sync])

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
      {/* Side rail: tablets, landscape phones and desktops. Icons with labels; widens into a drawer at 1280px. */}
      <aside className="hidden rail:flex rail-surface fixed left-0 top-0 bottom-0 z-30 w-20 xl:w-64 flex-col items-center xl:items-stretch gap-2 px-2 xl:px-4 pb-4 overflow-y-auto" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
        <div className="flex items-center justify-center xl:justify-start gap-2.5 px-1 py-2">
          <BrandMark size={40} />
          <span className="hidden xl:inline text-lg font-bold tracking-tight">Budgy</span>
        </div>
        <button className="fab w-14 h-14 xl:w-full xl:h-14 xl:gap-2.5 xl:rounded-full mt-2 shrink-0" aria-label="Quick add" title="Quick add" onClick={() => openSheet({ k: 'quick' })}>
          <span className="flex items-center gap-2.5"><Ic n="plus" s={24} /><span className="hidden xl:inline text-sm font-semibold">Quick Add</span></span>
        </button>
        <nav className="mt-4 w-full flex flex-col gap-1.5" aria-label="Main">
          {NAV.map(([k, l, ic]) => {
            const on = view === k
            return (
              <button key={k} title={l} aria-label={l} aria-current={on ? 'page' : undefined} onClick={() => goto(k)}
                className={'group w-full flex flex-col xl:flex-row items-center gap-1 xl:gap-3 py-1 xl:py-0 xl:h-14 xl:px-4 xl:rounded-full transition-colors ' + (on ? 'text-fg xl:bg-ac/20' : 'text-mu hover:text-fg xl:hover:bg-fg/5')}>
                <span className={'grid place-items-center h-8 w-14 xl:h-6 xl:w-6 rounded-full transition-colors ' + (on ? 'bg-ac/25 text-ac xl:bg-transparent' : 'group-hover:bg-fg/10 xl:group-hover:bg-transparent')}><Ic n={ic} s={22} /></span>
                <span className={'text-[11px] xl:text-sm leading-none ' + (on ? 'font-bold' : 'font-medium')}>{l}</span>
              </button>
            )
          })}
        </nav>
        <div className="mt-auto w-full pt-4 space-y-3 flex flex-col items-center xl:items-stretch">
          <button className="w-full flex items-center justify-center xl:justify-start gap-3 rounded-2xl xl:rounded-full px-1.5 xl:px-2 py-1.5 hover:bg-fg/5 transition-colors text-left" title="Profile and settings" aria-label="Profile and settings" onClick={() => goto('settings')}>
            <Avatar size={36} /><span className="hidden xl:block min-w-0"><span className="block text-sm font-medium truncate">{S.name.trim() || 'Your profile'}</span><span className="block text-[11px] text-mu">Settings</span></span>
          </button>
          <div className="hidden xl:block px-1"><SyncBadge /></div>
        </div>
      </aside>

      {/* Content. The top padding clears the notch / status bar plus a comfortable margin, so the header is never drawn under it. */}
      <main className="rail:ml-20 xl:ml-64 px-4 rail:px-6 xl:px-8 min-w-0 pb-36 rail:pb-10" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.75rem)' }}>
        <header className="flex items-center justify-between gap-3 mb-5 rail:pt-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button className="rail:hidden shrink-0 rounded-full active:scale-95 transition-transform" style={{ boxShadow: 'var(--e2)' }} aria-label="Profile and settings" onClick={() => goto('settings')}><Avatar size={44} /></button>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-ac font-medium leading-tight mb-0.5">{new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
              <FitTitle text={title} max={30} min={18} lines={2} />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SyncBadge short />
            <button aria-label="Reports" title="Reports" onClick={() => openSheet({ k: 'report' })} className="btn btn-i"><Ic n="file" s={18} /></button>
            <button aria-label="Settings" title="Settings" onClick={() => goto('settings')} className={'btn btn-i ' + (view === 'settings' ? '!bg-ac/20 !text-ac !border-ac/30' : '')}><Ic n="gear" s={18} /></button>
          </div>
        </header>
        <div ref={swipe} className="swipe-area">
          <div key={view} className={'page-in' + (dir > 0 ? ' from-r' : dir < 0 ? ' from-l' : '')}>{page}</div>
        </div>
      </main>

      {/* Phone: rounded-square FAB + floating pill navigation. A solid accent circle slides under the active icon (CSS var --i = active index). */}
      <button className="rail:hidden fab fixed right-4 z-40 w-14 h-14" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 98px)' }} aria-label="Quick add" onClick={() => openSheet({ k: 'quick' })}><Ic n="plus" s={26} /></button>
      <nav className="rail:hidden navbar pillnav fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2.5rem)] max-w-sm" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 14px)', '--i': Math.max(0, NAV_KEYS.indexOf(view)), '--n': NAV.length }} aria-label="Main">
        <i className={'pillnav-i' + (NAV_KEYS.indexOf(view) < 0 ? ' off' : '')} aria-hidden="true" />
        {NAV.map(([k, l, ic]) => {
          const on = view === k
          return (
            <button key={k} aria-label={l} title={l} aria-current={on ? 'page' : undefined} onClick={() => goto(k)} className={'pn-btn' + (on ? ' on' : '')}><Ic n={ic} s={23} /></button>
          )
        })}
      </nav>

      {/* Sheets */}
      {sheet && sheet.k === 'quick' && <QuickAddSheet onClose={closeSheet} openSheet={openSheet} />}
      {sheet && sheet.k === 'wallet' && <WalletSheet item={sheet.item} onClose={closeSheet} />}
      {sheet && sheet.k === 'balance' && <BalanceSheet item={sheet.item} onClose={closeSheet} />}
      {sheet && sheet.k === 'color' && <WalletColorSheet item={sheet.item} onClose={closeSheet} />}
      {sheet && <P2Sheets sheet={sheet} onClose={closeSheet} />}
      {sheet && <P3Sheets sheet={sheet} onClose={closeSheet} openSheet={openSheet} />}
      {sheet && sheet.k === 'data' && <DataSheet onClose={closeSheet} />}
      {sheet && sheet.k === 'shortcuts' && <ShortcutsSheet onClose={closeSheet} />}
      {sheet && sheet.k === 'backtap' && <BackTapSheet onClose={closeSheet} />}
      <Toast t={toast} onClose={() => setToast(null)} />
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

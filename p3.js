/* =====================================================================
   p3.js  (Phase 3)
   PWA auto-update, Reset Site Data, avatar + profile editor, sync badge,
   password change, account deletion and the onboarding guide.
   Loaded after p2.js and before app.js. Shares the global scope.
   ===================================================================== */
try { Object.assign(IC, {
  cloud: ['M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z'],
  cloudoff: ['m2 2 20 20', 'M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193', 'M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07'],
  camera: ['M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z', 'M15 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0'],
  key: ['m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4'],
  refresh: ['M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 'M8 16H3v5'],
  shield: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'],
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm17 8-5-5-5 5', 'M12 3v12'],
  right: ['m9 18 6-6-6-6'],
  left: ['m15 18-6-6 6-6'],
  info: ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', 'M12 16v-4', 'M12 8h.01'],
  book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z']
}) } catch (e) { console.error('p3 icons', e) }

/* =====================================================================
   PWA AUTO-UPDATE
   One small shared object tracks the service worker so any component can react to "a new version is waiting".
   ===================================================================== */
// SW, swOk and swNotify are created first in core.js (var / function declarations, so no temporal dead zone). Re-declared here only as a safety net.
var SW = window.__budgySW = window.__budgySW || { reg: null, waiting: null, listeners: new Set(), updating: false, hadController: false }

// Watch a registration: remember a worker that has finished installing while an older one still controls the page.
function swWatch(reg) {
  const track = (w) => {
    if (!w) return
    const done = () => { if (w.state === 'installed' && navigator.serviceWorker.controller) { SW.waiting = w; swNotify() } }
    w.addEventListener('statechange', done); done()
  }
  if (reg.waiting && navigator.serviceWorker.controller) { SW.waiting = reg.waiting; swNotify() }
  reg.addEventListener('updatefound', () => track(reg.installing))
}

// Called once from app.js. Registers sw.js and keeps asking the browser whether a newer sw.js exists while the app is open.
function swInit() {
  if (!swOk() || !('serviceWorker' in navigator) || SW.reg) return
  SW.hadController = !!navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // First-ever install also fires this (clients.claim). Only reload when we are switching from an older version.
    if (SW.reloading || !(SW.updating || SW.hadController)) return
    SW.reloading = true; location.reload()
  })
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((reg) => {
    SW.reg = reg; swWatch(reg)
    const check = () => reg.update().catch(() => {})
    setInterval(check, 60000) // every minute while open
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check() }) // returning to the app
    addEventListener('online', check)
    addEventListener('focus', check)
    check()
  }).catch(() => {})
}

// "Update Now": tell the waiting worker to take over, then reload (controllerchange does the reload; the timer is a safety net).
function applyUpdate() {
  if (!swOk()) return location.reload()
  SW.updating = true
  const w = SW.waiting || (SW.reg && SW.reg.waiting)
  if (w) { w.postMessage({ type: 'SKIP_WAITING' }); setTimeout(() => location.reload(), 4000) } else location.reload()
}

// Manual check from Settings. Resolves 'available' | 'latest' | 'error' | 'unsupported'.
async function checkUpdate() {
  if (!swOk() || !SW.reg) return 'unsupported'
  try { await SW.reg.update() } catch (e) { return 'error' }
  const inst = SW.reg.installing
  if (inst) await new Promise((res) => { const f = () => ['installed', 'activated', 'redundant'].includes(inst.state) && res(); inst.addEventListener('statechange', f); f(); setTimeout(res, 15000) })
  return SW.waiting || SW.reg.waiting ? 'available' : 'latest'
}

// Which cache version this page is running (asks the active worker).
function swVersion() {
  return new Promise((res) => {
    const c = navigator.serviceWorker && navigator.serviceWorker.controller
    if (!c) return res('')
    const ch = new MessageChannel(); ch.port1.onmessage = (e) => res((e.data && e.data.version) || '')
    c.postMessage({ type: 'GET_VERSION' }, [ch.port2]); setTimeout(() => res(''), 1500)
  })
}

function useUpdate() {
  const [w, setW] = useState(() => (swOk() ? SW.waiting || null : null))
  useEffect(() => {
    if (!swOk() || !SW.listeners) return
    SW.listeners.add(setW); setW(SW.waiting || null)
    return () => { if (swOk() && SW.listeners) SW.listeners.delete(setW) }
  }, [])
  return w
}

// Floating prompt shown whenever a new version is waiting.
function UpdatePrompt() {
  const w = useUpdate(), [hide, setHide] = useState(false), [busy, setBusy] = useState(false)
  if (!swOk() || !w || hide) return null
  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-[60] w-[min(94vw,26rem)] fade" style={{ top: 'calc(env(safe-area-inset-top) + 10px)' }} role="status" aria-live="polite">
      <div className="glass glass-strong !rounded-2xl flex items-center gap-3 p-3 pl-4" style={{ borderColor: 'rgb(var(--a) / .4)' }}>
        <span className="grid place-items-center w-9 h-9 rounded-full bg-ac/15 text-ac shrink-0"><Ic n="refresh" s={17} cls={busy ? 'animate-spin' : ''} /></span>
        <div className="min-w-0 flex-1"><div className="text-sm font-semibold leading-tight">New version ready</div><div className="text-xs text-mu leading-tight mt-0.5">Update to get the latest improvements.</div></div>
        {!busy && <button className="btn !py-1.5 !px-3 !text-xs !bg-transparent !border-transparent text-mu" onClick={() => setHide(true)}>Later</button>}
        <button className="btn btn-p !py-1.5 !px-3.5 !text-xs" disabled={busy} onClick={() => { setBusy(true); applyUpdate() }}>{busy ? 'Updating…' : 'Update Now'}</button>
      </div>
    </div>
  )
}

/* =====================================================================
   RESET SITE DATA
   localStorage + sessionStorage + service workers + Cache API + IndexedDB (Firestore offline copy and sign-in), then a cache-busted reload.
   Cloud data is never touched.
   ===================================================================== */
const SITE_FILES = ['./', 'index.html', 'core.js', 'ui.js', 'pages.js', 'p2.js', 'p3.js', 'app.js', 'firebase.js', 'manifest.json', 'sw.js']
async function resetSiteData() {
  window.__budgyResetting = true // core.js stops writing to localStorage from here on, so nothing re-saves while we clear
  const guard = (p) => Promise.resolve(p).catch(() => {})
  const wipeCaches = () => (window.caches ? caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))) : null)
  const job = async () => {
    await guard(Promise.race([fb.signOut(), new Promise((r) => setTimeout(r, 1500))]))                     // stop the live Firestore listener
    await guard(Promise.all(SITE_FILES.map((f) => fetch(f, { cache: 'reload' }).catch(() => {}))))          // refresh the browser's HTTP cache too
    if ('serviceWorker' in navigator) await guard(navigator.serviceWorker.getRegistrations().then((rs) => Promise.all(rs.map((r) => r.unregister()))))
    await guard(wipeCaches())
    if (window.indexedDB && indexedDB.databases) await guard(indexedDB.databases().then((dbs) => Promise.all(dbs.filter((d) => d.name).map((d) => new Promise((res) => { const r = indexedDB.deleteDatabase(d.name); r.onsuccess = r.onerror = r.onblocked = () => res() })))))
  }
  await Promise.race([job(), new Promise((r) => setTimeout(r, 9000))])
  await guard(wipeCaches())
  try { localStorage.clear() } catch (e) {}
  try { sessionStorage.clear() } catch (e) {}
  location.replace(location.pathname + '?r=' + Date.now()) // fresh navigation; the marker is stripped again on startup
}
// Remove the ?r= marker left by a reset so the address bar stays clean.
if (/^\?r=\d+$/.test(location.search)) { try { history.replaceState(null, '', location.pathname + location.hash) } catch (e) {} }

/* =====================================================================
   AVATAR + SYNC BADGE
   ===================================================================== */
const EMOJI = ['🐻', '🦊', '🐼', '🐯', '🐸', '🦉', '🐙', '🦄', '🐳', '🐱', '🐶', '🌵', '🍉', '🚀', '⭐', '🔥']

// Centre-crop any picture to a small square JPEG so it fits comfortably inside the synced budget document.
function resizeImage(file, px = 192) {
  return new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej(new Error('That file is not a picture.'))
    if (file.size > 12 * 1024 * 1024) return rej(new Error('That picture is too large. Choose one under 12 MB.'))
    const url = URL.createObjectURL(file), img = new Image()
    img.onload = () => {
      try {
        const side = Math.min(img.naturalWidth, img.naturalHeight), cv = document.createElement('canvas'); cv.width = cv.height = px
        const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, px, px)
        x.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, px, px)
        res(cv.toDataURL('image/jpeg', 0.85))
      } catch (e) { rej(new Error('That picture could not be processed.')) } finally { URL.revokeObjectURL(url) }
    }
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('That picture could not be read. Try a JPG or PNG.')) }
    img.src = url
  })
}

// `av` overrides the saved avatar (used for the live preview in the editor).
function Avatar({ size = 40, av, name, cls = '' }) {
  const { S, user } = useApp()
  const a = av !== undefined ? av : S.avatar, nm = (name !== undefined ? name : S.name) || (user && user.email) || '?'
  const box = { width: size, height: size, fontSize: size * 0.42 }
  if (a && a.k === 'img') return <img src={a.v} alt="" className={'rounded-full object-cover shrink-0 ' + cls} style={box} />
  if (a && a.k === 'emoji') return <span className={'rounded-full grid place-items-center bg-ac/15 shrink-0 leading-none ' + cls} style={{ ...box, fontSize: size * 0.52 }} aria-hidden="true">{a.v}</span>
  if (user && user.photo && av === undefined) return <img src={user.photo} alt="" referrerPolicy="no-referrer" className={'rounded-full object-cover shrink-0 ' + cls} style={box} />
  return <span className={'rounded-full grid place-items-center bg-ac text-onac font-semibold shrink-0 ' + cls} style={box} aria-hidden="true">{nm.trim().charAt(0).toUpperCase()}</span>
}

const SYNC_UI = {
  synced: ['Synced', 'cloud', 'bg-pos/15 text-pos'],
  saving: ['Saving…', 'refresh', 'bg-amber-400/15 text-amber-500'],
  connecting: ['Connecting…', 'refresh', 'bg-fg/10 text-mu'],
  error: ['Sync error', 'cloudoff', 'bg-neg/15 text-neg'],
  local: ['This device only', 'cloudoff', 'bg-fg/10 text-mu']
}
// Cloud status pill. `short` hides the words on very small screens.
function SyncBadge({ short, cls = '' }) {
  const { user, sync } = useApp(), k = user ? sync : 'local', [l, ic, tone] = SYNC_UI[k] || SYNC_UI.local
  const tip = user ? 'Your budget is saved privately to your account.' : 'Sign in under Settings to back up and sync across devices.'
  return (
    <span title={tip} role="status" className={'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ' + tone + ' ' + cls}>
      <Ic n={ic} s={13} cls={k === 'saving' || k === 'connecting' ? 'animate-spin' : ''} /><span className={short ? 'hidden sm:inline' : ''}>{l}</span>
    </span>
  )
}

/* =====================================================================
   PROFILE SHEET: display name + avatar
   ===================================================================== */
function ProfileSheet({ onClose }) {
  const { S, user, set, auth } = useApp()
  const [name, setName] = useState(S.name), [av, setAv] = useState(S.avatar), [m, setM] = useState(''), [busy, setBusy] = useState(false)
  const file = useRef(null)
  const pick = async (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = ''
    if (!f) return
    setM(''); setBusy(true)
    try { setAv({ k: 'img', v: await resizeImage(f) }) } catch (er) { setM(er.message) }
    setBusy(false)
  }
  const save = async () => {
    setBusy(true); set({ name: name.trim(), avatar: av })
    if (user) await auth.setName(name) // also update the sign-in profile; the dashboard greeting already uses the synced name
    setBusy(false); onClose()
  }
  return (
    <Sheet title="Edit profile" onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save() }}>
        <div className="flex flex-col items-center gap-3">
          <Avatar size={92} av={av} name={name} cls="ring-2 ring-ac/40" />
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className="btn !py-2" disabled={busy} onClick={() => file.current && file.current.click()}><Ic n="upload" s={16} />Upload photo</button>
            {av && <button type="button" className="btn !py-2" onClick={() => setAv(null)}>Remove</button>}
          </div>
          <input ref={file} type="file" accept="image/*" className="hidden" onChange={pick} aria-label="Upload a profile picture" />
        </div>
        <div>
          <div className="text-sm text-mu mb-2">Or pick an avatar</div>
          <div className="grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="Avatar">
            {EMOJI.map((e) => {
              const on = av && av.k === 'emoji' && av.v === e
              return <button type="button" key={e} role="radio" aria-checked={!!on} aria-label={'Avatar ' + e} onClick={() => setAv({ k: 'emoji', v: e })} className={'aspect-square rounded-xl grid place-items-center text-xl transition-transform active:scale-90 ' + (on ? 'bg-ac/20 ring-2 ring-ac' : 'bg-fg/5 hover:bg-fg/10')}>{e}</button>
            })}
          </div>
        </div>
        <Field label="Display name" hint="Shown in your dashboard greeting."><input className="field" maxLength={24} placeholder="Your name" autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        {user && <div className="flex items-center justify-between gap-3 text-xs text-mu"><span className="truncate">{user.email}</span><SyncBadge /></div>}
        <Err m={m} />
        <div className="flex gap-2"><button type="button" className="btn flex-1" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-p flex-1" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button></div>
      </form>
    </Sheet>
  )
}

/* =====================================================================
   PASSWORD CHANGE (re-authenticates first)
   ===================================================================== */
const hasPassword = (user) => !!(user && (user.providers || []).includes('password'))

function PasswordSheet({ onClose }) {
  const { user, auth } = useApp()
  const [f, setF] = useState({ cur: '', nw: '', cf: '' }), [show, setShow] = useState(false), [m, setM] = useState(''), [ok, setOk] = useState(''), [busy, setBusy] = useState(false)
  const u = (k) => (e) => setF({ ...f, [k]: e.target.value })
  if (!hasPassword(user)) return (
    <Sheet title="Change password" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-mu">You signed in with Google, so there is no Budgy password to change. Manage your password in your Google account.</p>
        <button className="btn btn-p w-full" onClick={onClose}>Got it</button>
      </div>
    </Sheet>
  )
  const submit = async () => {
    setM(''); setOk('')
    if (!f.cur) return setM('Enter your current password.')
    if (f.nw.length < 6) return setM('Use at least 6 characters for the new password.')
    if (f.nw === f.cur) return setM('Choose a password you have not used just now.')
    if (f.nw !== f.cf) return setM('The new passwords do not match.')
    setBusy(true); const r = await auth.changePassword(f.cur, f.nw); setBusy(false)
    if (r) return setM(r)
    setOk('Password updated. Use it next time you log in.'); setF({ cur: '', nw: '', cf: '' })
    setTimeout(onClose, 1600)
  }
  const forgot = async () => { setM(''); const r = await auth.reset(user.email); if (r) setM(r); else setOk('A reset link is on its way to ' + user.email + '.') }
  const t = show ? 'text' : 'password'
  return (
    <Sheet title="Change password" onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <p className="text-xs text-mu flex gap-2"><Ic n="shield" s={15} cls="shrink-0 mt-0.5 text-ac" />For your security, confirm your current password first.</p>
        <Field label="Current password"><input className="field" type={t} autoFocus autoComplete="current-password" value={f.cur} onChange={u('cur')} /></Field>
        <Field label="New password" hint="At least 6 characters."><input className="field" type={t} autoComplete="new-password" value={f.nw} onChange={u('nw')} /></Field>
        <Field label="Confirm new password"><input className="field" type={t} autoComplete="new-password" value={f.cf} onChange={u('cf')} /></Field>
        <label className="flex items-center gap-2 text-sm text-mu"><input type="checkbox" style={{ accentColor: 'rgb(var(--a))' }} checked={show} onChange={(e) => setShow(e.target.checked)} />Show passwords</label>
        <Err m={m} />
        {ok && <p className="text-sm text-pos" role="status">{ok}</p>}
        <button type="submit" className="btn btn-p w-full" disabled={busy || !f.cur || !f.nw || !f.cf}>{busy ? 'Updating…' : 'Update password'}</button>
        <button type="button" className="text-sm text-mu w-full hover:text-fg" onClick={forgot}>Forgot your current password? Email me a reset link</button>
      </form>
    </Sheet>
  )
}

/* =====================================================================
   ACCOUNT DELETION
   Needs: a fresh sign-in (password or Google pop-up), typing DELETE, and ticking the acknowledgement.
   ===================================================================== */
function DeleteAccountSheet({ onClose, openSheet }) {
  const { user, auth } = useApp()
  const [pw, setPw] = useState(''), [word, setWord] = useState(''), [sure, setSure] = useState(false), [m, setM] = useState(''), [busy, setBusy] = useState(false)
  const needPw = hasPassword(user), ready = word.trim().toUpperCase() === 'DELETE' && sure && (!needPw || pw) && !busy
  const go = async () => {
    if (!ready) return
    setM(''); setBusy(true); const r = await auth.deleteAccount(pw); setBusy(false)
    if (r) return setM(r)
    onClose() // signed out and wiped: the app falls back to the sign-in screen
  }
  return (
    <Sheet title="Delete account" onClose={busy ? () => {} : onClose}>
      <form className="space-y-3.5" onSubmit={(e) => { e.preventDefault(); go() }}>
        <div className="flex gap-2.5 text-sm text-neg" role="alert"><Ic n="alert" s={19} cls="shrink-0 mt-0.5" /><div><b className="font-semibold">This permanently deletes your account.</b> It cannot be undone.</div></div>
        <ul className="glass-tile p-3.5 space-y-2 text-sm text-mu">
          {['Your budget in the cloud: wallets, transactions, payables, receivables and goals', 'Your sign-in account (' + (user ? user.email : '') + ')', 'The copy saved on this device'].map((t) => <li key={t} className="flex gap-2"><Ic n="x" s={15} cls="shrink-0 mt-0.5 text-neg" />{t}</li>)}
        </ul>
        <button type="button" className="btn w-full !py-2" onClick={() => { onClose(); openSheet({ k: 'data' }) }}><Ic n="dl" s={16} />Export my data first</button>
        {needPw
          ? <Field label="Your password" hint="Confirms it is really you."><input className="field" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          : <p className="text-xs text-mu">You signed in with Google. You will be asked to confirm with Google in a pop-up.</p>}
        <Field label={'Type DELETE to confirm'}><input className="field" autoCapitalize="characters" autoComplete="off" placeholder="DELETE" value={word} onChange={(e) => setWord(e.target.value)} /></Field>
        <label className="flex items-start gap-2.5 text-sm"><input type="checkbox" className="mt-1" style={{ accentColor: 'rgb(var(--neg))' }} checked={sure} onChange={(e) => setSure(e.target.checked)} /><span>I understand my data will be erased forever and cannot be recovered.</span></label>
        <Err m={m} />
        <div className="flex gap-2"><button type="button" className="btn flex-1" disabled={busy} onClick={onClose}>Keep my account</button><button type="submit" className="btn btn-d flex-1" disabled={!ready}>{busy ? 'Deleting…' : 'Delete forever'}</button></div>
      </form>
    </Sheet>
  )
}

/* =====================================================================
   RESET SITE DATA sheet
   ===================================================================== */
function ResetSheet({ onClose, openSheet }) {
  const { user, sync } = useApp()
  const [busy, setBusy] = useState(false), [sure, setSure] = useState(false)
  const risky = user ? sync === 'saving' || sync === 'error' || sync === 'connecting' : true
  const go = () => { setBusy(true); resetSiteData() }
  return (
    <Sheet title="Reset site data" onClose={busy ? () => {} : onClose}>
      <div className="space-y-3.5">
        <p className="text-sm text-mu">Use this if the app looks stuck or out of date. It gives you a completely fresh start on <b className="text-fg font-semibold">this device</b>:</p>
        <ul className="glass-tile p-3.5 space-y-1.5 text-sm text-mu">
          {['Saved settings and the local copy of your budget', 'Session data and the offline cache', 'Installed service workers (the app re-installs itself)', 'Your sign-in on this device (log in again afterwards)'].map((t) => <li key={t} className="flex gap-2"><Ic n="check" s={15} cls="shrink-0 mt-0.5 text-ac" />{t}</li>)}
        </ul>
        {user
          ? <p className="text-sm text-mu">Your cloud budget is <b className="text-fg font-semibold">not</b> deleted. It comes back when you log in.</p>
          : <p className="text-sm text-neg flex gap-2" role="alert"><Ic n="alert" s={18} cls="shrink-0 mt-0.5" />You are using Budgy on this device only, so your budget lives here and will be permanently lost. Export it first.</p>}
        {user && risky && <p className="text-sm text-neg flex gap-2" role="alert"><Ic n="alert" s={18} cls="shrink-0 mt-0.5" />Sync is not up to date right now. Changes that have not reached the cloud yet would be lost. Wait for the green “Synced” badge first.</p>}
        {!user && <button className="btn w-full !py-2" onClick={() => { onClose(); openSheet({ k: 'data' }) }}><Ic n="dl" s={16} />Export my data first</button>}
        {(!user || risky) && <label className="flex items-start gap-2.5 text-sm"><input type="checkbox" className="mt-1" style={{ accentColor: 'rgb(var(--neg))' }} checked={sure} onChange={(e) => setSure(e.target.checked)} /><span>I understand and want to reset anyway.</span></label>}
        <div className="flex gap-2"><button className="btn flex-1" disabled={busy} onClick={onClose}>Cancel</button><button className="btn btn-d flex-1" disabled={busy || ((!user || risky) && !sure)} onClick={go}>{busy ? 'Resetting…' : 'Reset and reload'}</button></div>
      </div>
    </Sheet>
  )
}

function P3Sheets({ sheet: s, onClose, openSheet }) {
  if (s.k === 'profile') return <ProfileSheet onClose={onClose} />
  if (s.k === 'password') return <PasswordSheet onClose={onClose} />
  if (s.k === 'delacct') return <DeleteAccountSheet onClose={onClose} openSheet={openSheet} />
  if (s.k === 'reset') return <ResetSheet onClose={onClose} openSheet={openSheet} />
  return null
}

/* =====================================================================
   ONBOARDING GUIDE
   Shown once to brand-new users (flag `seen` syncs with the budget). Replay it from Settings.
   ===================================================================== */
function Onboarding({ onClose }) {
  const { S, user, set, loadSample } = useApp()
  const [i, setI] = useState(0), nm = S.name.trim() || (user && user.name) || ''
  const fresh = !S.tx.length && !S.debts.length && !S.goals.length
  const steps = [
    { ic: 'sparkle', t: nm ? 'Welcome, ' + nm + '!' : 'Welcome to Budgy', d: 'Your money, clearly. Here is a 30-second tour of how everything fits together.', pts: ['Track every wallet in one place', 'Plan for bills and goals before you spend', 'Works offline and syncs across your devices'] },
    { ic: 'wallet', t: 'Wallets hold your money', d: 'Add your cash, bank accounts and e-wallets. Your total liquid cash is the sum of them all.', pts: ['Use the ... menu on a wallet to edit its balance, name or colour', 'Transfers between wallets keep totals correct', 'Open the Wallets tab to add or rename them'] },
    { ic: 'plus', t: 'Log money with one tap', d: 'The + button adds expenses, income and transfers. Balances and charts update instantly.', pts: ['Future-dated entries feed your month-end projection', 'Spending by category appears on Home', 'Everything is saved on your device first'] },
    { ic: 'swap', t: 'Plan ahead with Pending and Allocate', d: 'Pending tracks what you owe and what is owed to you, including part payments. Allocate sets money aside so you do not overspend.', pts: ['Allocated cash is locked from spending', 'Smart Plan pays the earliest due date first', 'Spendable shows what is truly free to use'] },
    { ic: 'target', t: 'Goals and reports', d: 'Create savings goals and add money towards them. Export your history any time from the file icon at the top.', pts: ['Goals cannot take more than you can spare', 'Reports export to CSV for Excel or Sheets', 'Pick a theme and accent in Settings'] },
    { ic: 'cloud', t: 'Sync and stay up to date', d: 'Sign in to back up your budget and see it on every device. Install Budgy to your home screen for an app-like feel.', pts: ['A green “Synced” badge means you are backed up', 'New versions are offered inside the app. No reinstalling', 'Replay this guide any time from Settings'] }
  ]
  const s = steps[i], last = i === steps.length - 1
  const done = () => { set({ seen: true }); onClose() }
  const go = (n) => setI(Math.max(0, Math.min(steps.length - 1, n)))
  useEffect(() => {
    const k = (e) => { if (e.key === 'ArrowRight') go(i + 1); else if (e.key === 'ArrowLeft') go(i - 1); else if (e.key === 'Escape') done() }
    addEventListener('keydown', k)
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = prev }
  }, [i])
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Welcome guide">
      <div className="absolute inset-0 bg-black/60 fade" onClick={done} />
      <div className="sheet glass glass-strong relative w-full max-w-md !rounded-3xl p-6 max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1.5" aria-label={'Step ' + (i + 1) + ' of ' + steps.length}>{steps.map((_, n) => <button key={n} aria-label={'Go to step ' + (n + 1)} onClick={() => go(n)} className={'h-1.5 rounded-full transition-all ' + (n === i ? 'w-6 bg-ac' : 'w-1.5 bg-fg/25')} />)}</div>
          <button className="text-sm text-mu hover:text-fg" onClick={done}>{last ? 'Close' : 'Skip'}</button>
        </div>
        <div key={i} className="fade text-center">
          <span className="mx-auto grid place-items-center w-16 h-16 rounded-3xl bg-ac/15 text-ac" style={{ boxShadow: '0 0 0 8px rgb(var(--a) / .07)' }}><Ic n={s.ic} s={30} /></span>
          <h2 className="text-xl font-semibold tracking-tight mt-5">{s.t}</h2>
          <p className="text-sm text-mu mt-2 leading-relaxed">{s.d}</p>
          <ul className="text-left mt-5 space-y-2.5">{s.pts.map((p) => <li key={p} className="flex items-start gap-2.5 text-sm"><span className="grid place-items-center w-5 h-5 rounded-full bg-ac/15 text-ac shrink-0 mt-px"><Ic n="check" s={12} /></span><span>{p}</span></li>)}</ul>
        </div>
        <div className="mt-7 space-y-2">
          {last && fresh && <button className="btn w-full" onClick={() => { loadSample(); done() }}><Ic n="sparkle" s={16} />Explore with sample data</button>}
          <div className="flex gap-2">
            {i > 0 && <button className="btn" onClick={() => go(i - 1)} aria-label="Back"><Ic n="left" s={16} />Back</button>}
            <button className="btn btn-p flex-1 !py-3" autoFocus onClick={() => (last ? done() : go(i + 1))}>{last ? (fresh ? 'Start fresh' : 'Done') : 'Next'}{!last && <Ic n="right" s={16} />}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

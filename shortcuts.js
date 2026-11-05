/* =====================================================================
   shortcuts.js  (v4 Phase 3)
   Quick-add links for iOS Shortcuts (and any bookmark, widget or QR code).

   A link such as   https://YOU.github.io/REPO/?add=expense&cat=Food&amount=250&wallet=Cash
   opens Budgy with the Add transaction form already filled in. Nothing is saved until you tap Save.

   Parameters (all optional except add):
     add     expense | income | transfer | payable | receivable
     cat     category (expense / income) or source name (payable / receivable). Matched ignoring case.
     amount  number, e.g. 250 or 1250.50 (commas and a peso sign are ignored)
     wallet  wallet name (matched ignoring case) for expense / income / transfer; "from" wallet for a transfer
     to      destination wallet name (transfer only)
     note    note, up to 40 characters
     date    YYYY-MM-DD or "today" (transactions)
     name    who / what (payable / receivable)
     due     YYYY-MM-DD (payable / receivable)

   Loaded after io.js and before app.js. Shares the global scope with the other files.
   ===================================================================== */

/* ---------- 1. Capture a quick-add link the moment the page loads ---------- */
// The link is stored for this tab and the address bar is cleaned, so a refresh never re-opens the form
// and signing in first (which can take a while) does not lose it.
const QA_KEY = 'budgy.qa'
;(function captureQuickAdd() {
  try {
    const p = new URLSearchParams(location.search)
    if (!p.get('add')) return
    const o = {}; p.forEach((v, k) => { o[k] = v })
    sessionStorage.setItem(QA_KEY, JSON.stringify({ t: Date.now(), o }))
    history.replaceState(null, '', location.pathname + location.hash)
  } catch (e) {}
})()

/* ---------- 2. Turn a captured link into a sheet for App to open ---------- */
const qaClean = (v, n) => String(v == null ? '' : v).trim().slice(0, n)
const qaDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '').trim()) ? String(v).trim() : '')
const qaPick = (list, v) => { const s = qaClean(v, 40).toLowerCase(); return s ? list.find((x) => String(x).toLowerCase() === s) || '' : '' }

function quickAddSheet(S, r) {
  const t = qaClean(r.add, 12).toLowerCase()
  const amt = String(r.amount || '').replace(/[^\d.]/g, ''), amount = money(amt) && +amt > 0 ? amt : ''
  const wallet = (v) => { const s = qaClean(v, 40).toLowerCase(); const w = s && S.wallets.find((x) => x.id === v || x.name.toLowerCase() === s); return w ? w.id : '' }
  if (t === 'expense' || t === 'income' || t === 'transfer') {
    const d = String(r.date || '').toLowerCase() === 'today' ? '' : qaDate(r.date)
    return { k: 'tx', kind: t, preset: { amount, category: t === 'transfer' ? '' : qaPick(CATS[t], r.cat), wallet: wallet(r.wallet), to: wallet(r.to), note: qaClean(r.note, 40), date: d } }
  }
  if (t === 'payable' || t === 'receivable') {
    const cat = qaPick(catsFor(S, t), r.cat)
    return { k: 'debt', kind: t, item: null, preset: cat || undefined, fill: { party: qaClean(r.name || r.note, 40), total: amount, due: qaDate(r.due || r.date) } }
  }
  return null
}

// Returns the sheet for a link waiting in this tab (at most 15 minutes old) and clears it. Null when there is none.
function takeQuickAdd(S) {
  try {
    const raw = sessionStorage.getItem(QA_KEY); if (!raw) return null
    sessionStorage.removeItem(QA_KEY)
    const j = JSON.parse(raw); if (!j || Date.now() - j.t > 15 * 60 * 1000) return null
    return quickAddSheet(S, j.o || {})
  } catch (e) { return null }
}

/* ---------- 3. Link builder ---------- */
// The app's own address, without index.html and without any query string.
const scBase = () => location.origin + location.pathname.replace(/index\.html$/, '')
const scUrl = (o) => {
  const parts = Object.entries(o).filter(([, v]) => v !== '' && v != null).map(([k, v]) => k + '=' + encodeURIComponent(v))
  return scBase() + '?' + parts.join('&')
}
async function scCopy(text) {
  try { await navigator.clipboard.writeText(text); return true } catch (e) {}
  try { const a = document.createElement('textarea'); a.value = text; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); const ok = document.execCommand('copy'); a.remove(); return ok } catch (e) { return false }
}

function CopyBtn({ text, label = 'Copy link', cls = '' }) {
  const [ok, setOk] = useState(false)
  return <button type="button" className={'btn ' + cls} onClick={async () => { setOk(await scCopy(text)); setTimeout(() => setOk(false), 1800) }}><Ic n={ok ? 'check' : 'file'} s={15} />{ok ? 'Copied' : label}</button>
}

function ShortcutsSheet({ onClose }) {
  const { S } = useApp()
  const [type, setType] = useState('expense'), [cat, setCat] = useState(''), [wallet, setWallet] = useState(''), [to, setTo] = useState(''), [amount, setAmount] = useState(''), [note, setNote] = useState('')
  const isTx = type === 'expense' || type === 'income' || type === 'transfer', isDebt = !isTx
  const cats = isTx ? (type === 'transfer' ? [] : CATS[type]) : catsFor(S, type)
  const usable = cats.includes(cat) ? cat : ''
  const build = (o) => scUrl(o)
  const url = build(isTx
    ? { add: type, cat: usable, amount: money(amount) ? amount : '', wallet, to: type === 'transfer' ? to : '', note: note.trim() }
    : { add: type, cat: usable, amount: money(amount) ? amount : '', name: note.trim() })
  const types = [['expense', 'Expense'], ['income', 'Income'], ['transfer', 'Transfer'], ['payable', 'Payable'], ['receivable', 'Receivable']]

  // One ready-made link per category, so each home-screen icon can open straight into its own category.
  const all = [
    ...CATS.expense.map((x) => ['Expense · ' + x, build({ add: 'expense', cat: x })]),
    ...CATS.income.map((x) => ['Income · ' + x, build({ add: 'income', cat: x })]),
    ...catsFor(S, 'payable').map((x) => ['Payable · ' + x, build({ add: 'payable', cat: x })]),
    ...catsFor(S, 'receivable').map((x) => ['Receivable · ' + x, build({ add: 'receivable', cat: x })])
  ]

  return (
    <Sheet title="Add to iOS Shortcuts" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-mu">Make a Home Screen icon that opens Budgy straight on a pre-filled form, for example “Expense · Food”. Build a link below, then follow the steps. Nothing is saved until you tap Save.</p>

        <div className="glass-tile p-3.5 space-y-3">
          <div className="text-sm font-semibold">1. Build your link</div>
          <div className="chips" role="tablist" aria-label="Type">
            {types.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={type === k} onClick={() => { setType(k); setCat('') }} className={'btn ' + (type === k ? 'btn-p' : '')}>{l}</button>)}
          </div>
          {type !== 'transfer' && (
            <Field label={isTx ? 'Category' : 'Source'} hint={isDebt && !cats.length ? 'No sources yet. Add one in the Pending tab, or leave this and choose in the app.' : undefined}>
              <select className="field" value={usable} onChange={(e) => setCat(e.target.value)}><option value="">Choose in the app</option>{cats.map((x) => <option key={x}>{x}</option>)}</select>
            </Field>
          )}
          {isTx && (
            <div className={'grid gap-3 ' + (type === 'transfer' ? 'grid-cols-2' : 'grid-cols-1')}>
              <Field label={type === 'transfer' ? 'From wallet' : 'Wallet'}><select className="field" value={wallet} onChange={(e) => setWallet(e.target.value)}><option value="">Choose in the app</option>{S.wallets.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}</select></Field>
              {type === 'transfer' && <Field label="To wallet"><select className="field" value={to} onChange={(e) => setTo(e.target.value)}><option value="">Choose in the app</option>{S.wallets.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}</select></Field>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (optional)" hint="Leave empty to type it in the app."><input className="field" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
            <Field label={isTx ? 'Note (optional)' : 'Name (optional)'}><input className="field" maxLength={40} placeholder={isTx ? 'e.g. Lunch' : 'e.g. Phone'} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          </div>
          <Field label="Your link"><textarea className="field !text-xs font-mono" rows={3} readOnly value={url} onFocus={(e) => e.target.select()} /></Field>
          <div className="flex flex-wrap gap-2">
            <CopyBtn text={url} cls="btn-p" />
            <a className="btn" href={url}><Ic n="right" s={15} />Test link</a>
          </div>
        </div>

        <div className="glass-tile p-3.5 space-y-2">
          <div className="text-sm font-semibold">2. Put it on your Home Screen</div>
          <ol className="text-sm text-mu space-y-1.5 list-decimal pl-5">
            <li>Open the <b className="text-fg">Shortcuts</b> app and tap <b className="text-fg">+</b> to make a new shortcut.</li>
            <li>Add the action <b className="text-fg">Open URLs</b> and paste your link into it.</li>
            <li>Optional: add <b className="text-fg">Ask for Input</b> (type Number, prompt “Amount?”) above it. Then tap the end of <code>amount=</code> in the URL and insert that answer. Leave <code>amount</code> out of the link if you would rather type it in Budgy.</li>
            <li>Tap the shortcut’s name, choose <b className="text-fg">Add to Home Screen</b>, name it (for example “Food”) and tap <b className="text-fg">Add</b>.</li>
          </ol>
          <div className="flex flex-wrap gap-2 pt-1">
            <a className="btn" href="shortcuts://create-shortcut"><Ic n="phone" s={15} />Open Shortcuts app</a>
          </div>
          <p className="text-xs text-mu">Repeat for each category you use. “All my links” below has one ready-made link per category.</p>
        </div>

        <div className="glass-tile p-3.5 space-y-1.5 border-ac/40">
          <div className="text-sm font-semibold flex items-center gap-2"><Ic n="alert" s={16} cls="text-ac" />Good to know on iPhone</div>
          <p className="text-xs text-mu">A Shortcut opens links in <b className="text-fg">Safari</b>, not in the installed Home Screen app, and iOS keeps the two separate. Open the link once in Safari and sign in there, and Budgy will sync from your account. Guest data on this device stays in the Home Screen app, so use a signed-in account for Shortcuts.</p>
        </div>

        <details className="glass-tile p-3.5">
          <summary className="text-sm font-semibold cursor-pointer">All my links ({all.length})</summary>
          <div className="mt-3 space-y-2">
            {all.map(([l, u]) => (
              <div key={l} className="flex items-center justify-between gap-2">
                <span className="text-sm truncate min-w-0">{l}</span>
                <CopyBtn text={u} label="Copy" cls="!py-1.5 !px-3 !text-xs shrink-0" />
              </div>
            ))}
          </div>
        </details>

        <details className="glass-tile p-3.5">
          <summary className="text-sm font-semibold cursor-pointer">Link parameters</summary>
          <div className="mt-3 text-xs text-mu space-y-1">
            <p><code>add</code> expense, income, transfer, payable or receivable (required)</p>
            <p><code>cat</code> category or source name, case does not matter</p>
            <p><code>amount</code> a number such as 250 or 1250.50</p>
            <p><code>wallet</code> wallet name (the “from” wallet for a transfer) · <code>to</code> destination wallet</p>
            <p><code>note</code> up to 40 characters · <code>date</code> YYYY-MM-DD or today</p>
            <p><code>name</code> and <code>due</code> for payables and receivables</p>
            <p>Anything missing or not recognised is simply left for you to choose in the form.</p>
          </div>
        </details>
      </div>
    </Sheet>
  )
}

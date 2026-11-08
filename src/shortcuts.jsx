/* =====================================================================
   shortcuts.js  (v4 Phase 3; v6 final: one-step deep link + Back Tap setup)
   Quick-add links for iOS Shortcuts (and any bookmark, widget or QR code).

   v6 DEEP LINK (silent save):  https://YOU.github.io/REPO/?action=addExpense&amount=250
     action  addExpense | addIncome
     amount  "250", "1,250.50" or "250 lunch" (anything after the number becomes the note)
     cat, wallet, note   optional (wallet defaults to your first wallet, category to Other)
   The entry is saved straight away, the address bar is cleaned, and a toast with an Undo button confirms it.
   Nothing is saved when the amount is missing/invalid, the wallet is unknown, or an expense is bigger than the wallet's balance.

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

/* ---------- 1b. v6 deep link receiver: ?action=addExpense&amount=250 ---------- */
// Captured the moment the page loads (same idea as above), so signing in first never loses it. Handled by App once the budget is ready.
const DL_KEY = 'budgy.dl'
;(function captureDeepLink() {
  try {
    const p = new URLSearchParams(location.search)
    if (!p.get('action')) return
    const o = {}; p.forEach((v, k) => { o[k] = v })
    sessionStorage.setItem(DL_KEY, JSON.stringify({ t: Date.now(), o }))
    history.replaceState(null, '', location.pathname + location.hash) // a refresh can never save it twice
  } catch (e) {}
})()

// Returns the waiting link (at most 15 minutes old) and clears it, or null.
function takeDeepLink() {
  try {
    const raw = sessionStorage.getItem(DL_KEY); if (!raw) return null
    sessionStorage.removeItem(DL_KEY)
    const j = JSON.parse(raw); if (!j || !j.o || Date.now() - j.t > 15 * 60 * 1000) return null
    return j.o
  } catch (e) { return null }
}

// Turns a link into a ready-to-save entry: { ok: true, tx } or { ok: false, error }. Pure: it saves nothing.
function buildDeepTx(S, c, r) {
  const act = qaClean(r.action, 20).toLowerCase()
  const type = act === 'addexpense' ? 'expense' : act === 'addincome' ? 'income' : ''
  if (!type) return { ok: false, error: 'Unknown shortcut action.' }
  // "250", "₱1,250.50" or "250 lunch": the first number is the amount, whatever follows is the note.
  const m = /^[^\d.]*(\d[\d,]*(?:\.\d+)?|\.\d+)\s*(.*)$/.exec(String(r.amount == null ? '' : r.amount).trim())
  const amount = m ? q(parseFloat(m[1].replace(/,/g, ''))) : 0
  if (!(amount > 0) || amount > 1e7) return { ok: false, error: 'Not saved: couldn’t read that amount.' }
  const want = qaClean(r.wallet, 40).toLowerCase()
  const w = want ? S.wallets.find((x) => x.id === r.wallet || x.name.toLowerCase() === want) : S.wallets[0]
  if (!w) return { ok: false, error: 'Not saved: no wallet called “' + qaClean(r.wallet, 40) + '”.' }
  if (type === 'expense' && amount > c.bal[w.id]) return { ok: false, error: 'Not saved: ' + w.name + ' only has ' + php(c.bal[w.id]) + '.' }
  const category = qaPick(CATS[type], r.cat) || 'Other'
  const note = qaClean(r.note, 40) || qaClean(m[2], 40)
  return { ok: true, tx: { type, amount, category, date: off(0), note, wallet: w.id }, walletName: w.name }
}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

/* ---------- 4. Back Tap quick expense: setup sheet ---------- */
// One small "block" drawn like a Shortcuts action, so the steps can be copied by eye.
function ScBlock({ n, icon, title, children }) {
  return (
    <div className="sc-block">
      <div className="sc-head"><span className="sc-n">{n}</span><span className="sc-ic"><Ic n={icon} s={15} /></span><b>{title}</b></div>
      <div className="sc-body">{children}</div>
    </div>
  )
}

function BackTapSheet({ onClose }) {
  const { S } = useApp()
  const [cat, setCat] = useState(''), [wallet, setWallet] = useState('')
  const usable = CATS.expense.includes(cat) ? cat : ''
  const prefix = scUrl({ action: 'addExpense', cat: usable, wallet }) + (usable || wallet ? '&' : '?') + 'amount='
  const test = prefix + '1&note=' + encodeURIComponent('Shortcut test')
  return (
    <Sheet title="Back Tap quick expense" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-mu">Tap the back of your iPhone, type an amount in a small pop-up, and the expense is saved. Apple doesn’t allow a website to install a Shortcut for you, so build it once (about a minute):</p>

        <div className="glass-tile p-3.5 space-y-3">
          <div className="text-sm font-semibold">1. Choose what it saves <span className="text-mu font-normal">(optional)</span></div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><select className="field" value={usable} onChange={(e) => setCat(e.target.value)}><option value="">Other</option>{CATS.expense.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Wallet"><select className="field" value={wallet} onChange={(e) => setWallet(e.target.value)}><option value="">First wallet</option>{S.wallets.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}</select></Field>
          </div>
        </div>

        <div className="glass-tile p-3.5 space-y-2.5">
          <div className="text-sm font-semibold">2. Build the shortcut in the Shortcuts app</div>
          <p className="text-xs text-mu">Tap <b className="text-fg">Open Shortcuts</b>, then add these three actions in this order:</p>
          <ScBlock n="1" icon="pen" title="Ask for Text">
            <div className="sc-row"><span>Prompt</span><span className="sc-chip">Amount?</span></div>
            <p className="sc-hint">On iOS 17 and later this action is called <b>Ask for Input</b>. Keep the type on <b>Text</b>. This is the small floating box that appears over whatever you’re doing.</p>
          </ScBlock>
          <ScBlock n="2" icon="file" title="URL">
            <div className="sc-url">{prefix}<span className="sc-var">Provided Input</span></div>
            <p className="sc-hint">Tap <b>Copy URL</b> below, paste it into the URL action, then tap right after <code>amount=</code> and choose the variable <b>Provided Input</b> (it appears as a blue chip).</p>
          </ScBlock>
          <ScBlock n="3" icon="right" title="Open URLs">
            <div className="sc-row"><span>Input</span><span className="sc-chip">URL</span></div>
            <p className="sc-hint">This opens Budgy, which saves the entry and shows a confirmation with Undo.</p>
          </ScBlock>
          <div className="flex flex-wrap gap-2 pt-1">
            <CopyBtn text={prefix} label="Copy URL" cls="btn-p" />
            <a className="btn" href="shortcuts://create-shortcut"><Ic n="phone" s={15} />Open Shortcuts</a>
          </div>
          <p className="text-xs text-mu">Name it “Add Expense”. You can also type a note after the amount, for example <code>250 lunch</code>. If that fails, or a note has special characters, add a <b>URL Encode</b> action after Ask for Text and use its output.</p>
        </div>

        <div className="glass-tile p-3.5 space-y-2">
          <div className="text-sm font-semibold">3. Trigger it with Back Tap</div>
          <ol className="text-sm text-mu space-y-1.5 list-decimal pl-5">
            <li>Open <b className="text-fg">Settings</b> › <b className="text-fg">Accessibility</b> › <b className="text-fg">Touch</b>.</li>
            <li>Scroll down and tap <b className="text-fg">Back Tap</b>.</li>
            <li>Choose <b className="text-fg">Double Tap</b> or <b className="text-fg">Triple Tap</b>.</li>
            <li>Scroll to the <b className="text-fg">Shortcuts</b> section and pick <b className="text-fg">Add Expense</b>.</li>
          </ol>
        </div>

        <div className="glass-tile p-3.5 space-y-2">
          <div className="text-sm font-semibold">4. Test it</div>
          <p className="text-xs text-mu">This opens your link with an amount of 1 and saves a ₱1.00 test expense. Tap <b className="text-fg">Undo</b> on the confirmation to remove it.</p>
          <a className="btn" href={test}><Ic n="check" s={15} />Run test</a>
        </div>

        <div className="glass-tile p-3.5 space-y-1.5 border-ac/40">
          <div className="text-sm font-semibold flex items-center gap-2"><Ic n="alert" s={16} cls="text-ac" />Good to know</div>
          <ul className="text-xs text-mu space-y-1.5 list-disc pl-4">
            <li>Shortcuts opens links in <b className="text-fg">Safari</b>, not the Home Screen app, so Safari flashes open briefly after you type the amount. Sign in to Budgy once in Safari so entries sync to your account.</li>
            <li>Nothing is saved if the amount is invalid, the wallet isn’t found, or an expense is bigger than the wallet balance. You’ll see a message instead.</li>
            <li>A link can add an entry whenever you open it while signed in, so only tap links you trust. Every save shows an Undo button for a few seconds.</li>
          </ul>
        </div>
      </div>
    </Sheet>
  )
}

/* ---------- 5. Toast (confirmation with optional Undo / Redo button; v9 P2: t.label names the button, default "Undo") ---------- */
function Toast({ t, onClose }) {
  useEffect(() => {
    if (!t) return
    const id = setTimeout(onClose, t.ok ? 7000 : 9000)
    return () => clearTimeout(id)
  }, [t])
  if (!t) return null
  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      <div className="toast fade">
        <span className={'toast-ic ' + (t.ok ? 'ok' : 'bad')}><Ic n={t.ok ? 'check' : 'alert'} s={16} /></span>
        <div className="min-w-0 flex-1"><div className="toast-t">{t.msg}</div>{t.sub && <div className="toast-s">{t.sub}</div>}</div>
        {t.undo && <button className="toast-b" onClick={() => { onClose(); t.undo() }}>{t.label || 'Undo'}</button>}
        <button className="toast-x" onClick={onClose} aria-label="Dismiss"><Ic n="x" s={14} /></button>
      </div>
    </div>
  )
}

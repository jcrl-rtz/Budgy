# Budgy v5 Final (Phase 2 of 2): aligned brown receipt, crisp export, smooth polish

Plain files only (no build step). Upload every file to the root of your `main` branch, as before.

## What changed in v5 Final
| Area | Change |
|---|---|
| Receipt layout | `receipt.js` rebuilt. Root causes of the misaligned text fixed: the receipt asked for a font (Sora) the page never loads, so it is now Plus Jakarta Sans and the weights are loaded before capture; `letter-spacing` and `text-transform` are no longer used on right-aligned or centred text (html2canvas pads the trailing edge, which pushed amounts and pills off-line); every text box has a fixed `line-height`. |
| Receipt design | Warm dark-brown card with cream/caramel accents, 36px curved corners, soft top highlight and bottom shade, 3D tilted "b" watermark, crisp dashed dividers. Wallet name and type badge on the left, bold amounts right-aligned on a single edge, DATE / FOR / REF as label-left, value-right rows, and a total panel with the large amount right-aligned. |
| Export quality | Capture is at least 3x (up to 4x on very dense screens), reduced automatically so the canvas stays under the mobile size limit; fixed width/height, no page scroll or zoom in the clone, two frames of layout settling before capture. |
| Polish | `index.html`: `dvh`-aware sheets, safe-area padding, scroll containment behind modals, paint containment on cards, no sticky hover on touch screens, lighter blur on small phones. |
| Updates | `sw.js` `VERSION` is `budgy-v5-final-1`, so installed copies show the Update Now prompt. |

# Budgy v5, Phase 1 of 2: viewport, smooth motion, compact Home, new type and brand

Plain files only (no build step). Upload every file to the root of your `main` branch, as before.

## What changed in v5 Phase 1
| Area | Change |
|---|---|
| Viewport | `index.html` viewport is now `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`. Inputs stay at 16px and `touch-action: manipulation` is set on controls, so phones no longer zoom or resize on taps or tab switches. |
| Motion | Tab changes use a new `.page-in` class (fade + 10px lift, `cubic-bezier(.22,1,.36,1)`). Sheets use a spring-style curve. `.rise`, `.sheet`, `.page-in`, `.fab`, `.navbar` use `will-change` and `translateZ(0)` so they animate on the GPU. Only transform and opacity are animated. |
| Home tab | Tighter spacing, compact quick-action pills, top 4 categories, last 5 activities. Sections with no data are not rendered at all: Spending by category, Savings goals, Recent activity, and (on a brand-new empty budget) Allocated funds and Projection. An odd number of visible sections makes the last one span both columns on wide screens. |
| Typography | Plus Jakarta Sans (Inter as fallback for the peso sign), tighter tracking, lining tabular figures on every amount. |
| Brand | New glossy 3D "b" badge: `BrandMark` component (`ui.js`, follows the accent colour) used in the side rail and sign-in screen, plus regenerated `icon-192`, `icon-512`, `apple-touch-icon` and `maskable-512` PNGs. |
| Glass | Surfaces use `backdrop-filter: blur(16px)`, layered soft shadows, a top sheen and a static accent-tinted backdrop. Browsers without backdrop-filter fall back to solid surfaces. |
| Updates | `sw.js` `VERSION` is `budgy-v5p1-1`, so installed copies show the Update Now prompt. |

Files touched: `index.html`, `pages.js`, `ui.js`, `app.js`, `sw.js`, `README.md`, four icon PNGs. The Net Worth card is unchanged.

---

# Budgy v4, Phase 3 of 4: Pending Delete buttons and iOS Shortcuts quick-add

Plain files only (no build step). Upload every file to the root of your `main` branch, as before.

## What changed in v4 Phase 4 (final): receipt export
| Area | Change |
|---|---|
| Share Balances | New **Share Balances** button in the Wallets tab toolbar (next to Add wallet). It builds a temporary off-screen receipt, captures it with html2canvas at 3x, downloads `budgy-balances-YYYY-MM-DD.png`, then removes the element. |
| Receipt design | Rounded warm-brown card, cream and caramel text, dashed dividers, every wallet with its type and balance, a Total liquid cash panel, the Budgy logo and a faint diagonal Budgy watermark. Negative balances show in soft red. Corners are transparent in the PNG. |
| Files | New `receipt.js` (loaded after `io.js`); `pages.js` renders `<ReceiptButton />`; `index.html` loads `html2canvas@1.4.1` from jsDelivr; `sw.js` `VERSION` is `budgy-v4final-1` and `receipt.js` is in the offline cache list. |

## What changed in v4 Phase 3
| Area | Change |
|---|---|
| Pending Delete | Every payable and receivable now has its own full-width red **Delete** button (bin icon) at the foot of its card (`DebtDelete` in `p2.js`). It asks once, inline, then removes the item, its payment history and its Smart Plan allocation (`delDebt`). Category groups now **start expanded**, so each item and its Delete button is visible without an extra tap (they can still be collapsed). |
| Add to iOS Shortcuts | New **Add to iOS Shortcuts** button in Settings > Data opens a sheet (`shortcuts.js`) with a link builder, setup steps, a ready-made link for every category, and a parameter reference. |
| Quick-add links | `?add=expense&cat=Food&amount=250&wallet=Cash` opens the Add form pre-filled. Nothing is saved until you tap Save. Links are captured at load, so signing in first does not lose them. |
| Updates | `sw.js` `VERSION` is `budgy-v4p3-1`; `shortcuts.js` is in the offline cache list and `index.html`. |

Files touched: `p2.js`, `app.js`, `pages.js`, `index.html`, `sw.js`, `README.md`. New: `shortcuts.js`.

## Quick-add link parameters
| Parameter | Meaning |
|---|---|
| `add` | `expense`, `income`, `transfer`, `payable` or `receivable` (required) |
| `cat` | Category (expense / income) or source name (payable / receivable). Case ignored. |
| `amount` | Number, e.g. `250` or `1250.50` (commas and a peso sign are ignored) |
| `wallet` | Wallet name (the "from" wallet for a transfer) |
| `to` | Destination wallet (transfer only) |
| `note` | Up to 40 characters (used as the name for payables / receivables when `name` is missing) |
| `date` | `YYYY-MM-DD` or `today` |
| `name`, `due` | Who / what and due date for payables and receivables |

Anything missing or not recognised is left for you to choose in the form. Example: `https://YOU.github.io/REPO/?add=expense&cat=Food&wallet=Cash`

## Setting up a Shortcut (iPhone)
1. Settings > Data > **Add to iOS Shortcuts**, build a link and tap **Copy link**.
2. In the Shortcuts app, tap **+**, add **Open URLs** and paste the link.
3. Optional: add **Ask for Input** (Number) above it and insert the answer after `amount=`.
4. Tap the shortcut name > **Add to Home Screen**.

Note: Shortcuts opens links in Safari, not in the installed Home Screen app, and iOS keeps their storage separate. Sign in once in Safari so Budgy syncs from your account. Guest (device-only) data cannot be shared between the two.

---

# Budgy v4, Phase 2 of 4: Net Worth card figures and display settings

Plain files only (no build step). Upload every file to the root of your `main` branch, as before.

## What changed in v4 Phase 2
| Area | Change |
|---|---|
| Figures inside the card | The Net Worth credit card now carries **Liquid cash, Total payables, Monthly expenses and Receivables** on its face, in a strip that replaces the dotted card number. Foil, EMV chip, contactless mark, guilloche, sheen, glare and tilt are untouched. The eye button hides these figures too. |
| Customize card | A new **gear button** on the card (next to the eye) opens **Customize card**: a switch per figure (show / hide) and up / down buttons to reorder. Changes apply instantly. **Reset** restores all four in the default order. |
| Balanced layout | The strip re-balances for 1, 2, 3 or 4 figures: full labels and cents for 1-2, short labels for 3-4, no cents for large amounts at 3 figures, whole pesos at 4 figures and 1.23M style for very large amounts. The exact amount is always in the tooltip. With none switched on the card shows its original dotted card number. With any figure on, the card is a little taller (1.42:1 instead of 1.586:1) so nothing crowds; the shape animates when you switch between none and some. |
| Statement panel | The panel beside the card no longer repeats the four figures (they live on the card now). It keeps **Spendable** and the cash / receivables / payables composition bar. |
| State | `S.cardStats = { order, hidden }` (`core.js`: `CARD_KEYS`, `cardDefault`, `fixCard`). It is validated by `fix()`, syncs to the cloud with the rest of the budget, survives logging out and Clear all data, and is included in the JSON backup and restore (`io.js`, under the profile / appearance section). Older budgets simply get the default (all four shown). |
| Updates | `sw.js` `VERSION` is `budgy-v4p2-1`. |

Files touched: `pages.js` (card + Customize sheet), `core.js` (state), `index.html` (card CSS block), `io.js` (backup / restore), `sw.js` (version), `README.md`.

---

# Budgy v3, Final (Phase 2B), no-build React

Plain files only. React 18, ReactDOM, Recharts, Babel, Tailwind and Firebase v10 all load from CDNs. No Vite, no npm.

## What changed in Phase 2B (data and settings)
| Area | Change |
|---|---|
| Zero default categories | `BASE` in `p2.js` is empty. SPayLater, Tuition, Transportation, Utangs (and the receivable defaults Allowance, Utangs, Other) are gone. The Pending tab starts empty with a hint; every source is one the user creates with **Add New Source** (stored in `S.srcs`). With no sources, the Add sheet opens straight on "New source name". `blank()`, `dataBlank()` and `fix()` in `core.js` now include `srcs`, so **Clear all data** also removes custom sources. The opt-in "Load sample data" demo uses neutral names (Installments, School, Family). |
| Import / Export Data | New `io.js`. A **Import / Export Data** button sits in the Settings profile card and at the top of the Settings Data card (also reached from the "Export my data first" shortcuts). **Full backup (JSON)** saves wallets, transactions, payables and receivables with payment history, sources, goals, allocations, name, avatar and appearance. **Restore from backup (JSON)** validates the file, shows a preview with counts, and only replaces data after you confirm. Invalid items are dropped and counted; paid amounts are recomputed from payment history; allocations for missing payables are discarded. **Transactions (CSV)** exports every transaction (all time, including future-dated "Scheduled" ones and payments on payables / receivables), with formula-injection protection and a UTF-8 BOM for Excel. |
| Cloud sync | A restore goes through the normal store update, so signed-in users sync it to the cloud like any other edit. |
| Updates | `sw.js` `VERSION` is `budgy-v3p2b-1` and `io.js` is in the offline cache list. |

## What changed in Phase 2A (Home tab)
| Area | Change |
|---|---|
| Net Worth card | The hero is now a realistic **credit card** (`NetWorthCard` in `pages.js`, styles in the `Net Worth credit card` block of `index.html`). Accent-tinted dark metal body, radial colour blending, guilloche lines, holographic foil, gold EMV chip, contactless mark, card holder name, an "As of" month, and a two-circle network mark. A light sheen sweeps across it and a glare plus slight 3D tilt follow the mouse (touch is ignored so scrolling is never disturbed; reduced-motion turns both off). The eye button hides every amount. In the leather themes the card also gets the grain and stitching. The card body stays dark in light mode so the white text always has contrast. |
| Statement | Beside the card (below it on phones): Liquid cash, Receivables, Payables, Spendable, and a bar showing how cash, receivables and payables make up the total. |
| Expanded Home | Allocated funds, End-of-month projection, Spending by category, Savings goals and Recent activity are **open by default** (`<Fold open>`). Their headers can still be tapped to fold them. Other tabs keep their folded defaults. |
| Updates | `sw.js` `VERSION` is `budgy-v3p2a-1`. |

## What changed in Phase 1
| Area | Change |
|---|---|
| Header | Top padding is now `safe-area-inset-top + 1.75rem`, plus a status-bar guard strip (`.safe-top`) that fades in once the page scrolls, so nothing is drawn behind the clock or notch. |
| Greeting | `FitTitle` in `app.js`: wraps onto extra lines, steps its font from 30px down to 18px to fit in two lines, and never truncates. The avatar, title and action buttons share one balanced row. |
| Navigation | From **700px** wide (small tablets, landscape phones, desktops) the floating bar becomes a vertical **side rail** (icon + label, FAB on top, profile at the bottom). At 1280px it widens into a full drawer. Phones keep the floating Material bar and a rounded-square FAB. The `rail` breakpoint is defined in the Tailwind config in `index.html`. |
| Design system | Heavy glass blur is gone. Surfaces are tonal gradients with border and four elevation levels (`--e1` to `--e4`). Every old `.glass` class picks up the new look, so no screen had to be rewritten. |
| Wallet themes | **Brown Leather**, **Black Leather**, **Navy Blue**, each with a light and a dark version. Procedural pebbled grain (inline SVG, no image files), stitching, lit edges and rich gradients. They appear under Settings > Appearance > Wallet themes. |

## Files
| File | What it does |
|---|---|
| `index.html` | CDN scripts, Tailwind config (incl. `rail` screen), design-system CSS, theme tokens |
| `core.js` | Helpers, **themes + texture engine**, Appearance Engine, money maths, store + Firebase sync |
| `ui.js` | Icons, surface primitives, sheets (with grab handle on phones), sign-in screen |
| `pages.js` | Home (with the Net Worth credit card), Wallets, Settings (with live theme previews) |
| `p2.js` | Entry sheets, Pending, Allocate, Goals, Reports (unchanged except blur classes removed) |
| `io.js` | Import / Export Data sheet: JSON backup + restore, transactions CSV |
| `receipt.js` | Share Balances button and the brown PNG receipt (html2canvas) |
| `p3.js` | Onboarding, profile, password, account deletion, update checker (unchanged except blur classes removed) |
| `app.js` | Responsive shell: header, side rail, bottom bar, `FitTitle` |
| `firebase.js`, `firestore.rules`, `manifest.json`, `icons/` | Unchanged |
| `sw.js` | `VERSION` bumped to `budgy-v3p1-1` so installed apps offer the update |

## Adding another theme
Add an object to `THEMES` in `core.js`. A leather-style theme needs `d` and `l` surface colours (`[background, card, card-2, border]`), accents `a` and `al`, and a `look(dark)` function returning `page`, `card`, `hero` gradients, `grain: grain(strength, size)`, `stitch`, `stitchA`, `s1a`, `s2a` and `edge`. `card` and `hero` must each be ONE gradient (the grain is blended as the layer above it).

## Deploy (GitHub Pages)
1. Upload every file (keep `icons/` and `.nojekyll`) to the root of your `main` branch.
2. Firebase console > Firestore > Rules: paste `firestore.rules` and **Publish**. Account deletion needs these rules.
3. Authentication > Settings > Authorized domains: add `YOUR-USERNAME.github.io`. Enable Email/Password and Google sign-in.

## Shipping updates (important)
Every time you deploy new files, **change `VERSION` in `sw.js`** (for example `budgy-v3p1-2`). That one-line change is what tells installed apps a new version exists.
- Open apps re-check every minute, when the app returns to the foreground, and when the device reconnects.
- A new version waits quietly, then a **New version ready / Update Now** prompt appears. Update Now tells the waiting worker to take over (`skipWaiting`) and reloads.
- Settings > App & storage > **Check** does the same check on demand.
- Nobody needs to remove the app from the home screen. Devices still on Phase 2 pick up Phase 3 on their next open, because the Phase 2 worker already serves your files network-first.

## Phase 3 features
- **Home**: hero net worth, a slim "spent this month" card, Expense / Income / Transfer shortcuts, then Allocated funds, Projection, Spending by category, Savings goals and Recent activity (expanded by default since Phase 2A).
- **Wallets**: one summary card with a segmented bar by wallet type, a collapsed "Where your cash sits" chart, filters, and compact wallet cards.
- **Onboarding**: a six-step welcome guide for brand-new budgets only (once cloud sync has been checked). Replay it from Settings.
- **Profile**: edit display name, upload a photo (centre-cropped to 192 px and stored inside your synced budget) or pick an emoji avatar. A **Synced** cloud badge shows in the header and profile card.
- **Security**: change password (re-enter current password first). Google accounts are told to manage their password with Google.
- **Delete account**: requires re-authentication (password, or the Google pop-up), typing `DELETE`, and ticking an acknowledgement. It removes `users/{uid}/budget/*` first, then the sign-in account, then the copy on the device. An "Export my data first" shortcut is included. You must be online.
- **Reset Site Data / Clear Cache**: clears localStorage, sessionStorage, all service workers, the Cache API and IndexedDB (Firestore's offline copy and the sign-in session), then does a cache-busted reload. Cloud data is **not** deleted; you log in again afterwards. Guests and unsynced devices must tick an acknowledgement first because their data would be lost.

## Data
One private document per user at `users/{uid}/budget/v2`, `{ t, json }`. Name, avatar, appearance and the onboarding flag live inside that JSON, so they sync with everything else.

## Firestore rules summary
Only the signed-in owner can read, write or delete anything under `users/{uid}/...`. Writes to `budget/*` must be exactly `{ t: number, json: string }` and under the size limit. Everything else is denied.

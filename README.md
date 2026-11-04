# Budgy: Phase 3 (final, no-build React)

Plain files only. React 18, ReactDOM, Recharts, Babel, Tailwind and Firebase v10 all load from CDNs. No Vite, no npm.

## Files
| File | What it does |
|---|---|
| `index.html` | CDN scripts, Tailwind config, Liquid Glass CSS, theme tokens |
| `core.js` | Helpers, themes, Appearance Engine, money maths, store + Firebase sync (now with avatar, onboarding flag, delete-account lock) |
| `ui.js` | Icons, glass primitives, sheets, sign-in screen |
| `pages.js` | **Redesigned** Home and Wallets, rebuilt Settings |
| `p2.js` | Entry sheets, Pending, Allocate, Goals, Reports |
| `p3.js` | **New.** Onboarding guide, avatar + profile editor, Synced badge, password change, account deletion, PWA update checker, Reset Site Data |
| `app.js` | Responsive shell, header avatar, update prompt, mount |
| `firebase.js` | Firebase Auth + Firestore adapter (adds re-authentication, password change, account wipe) |
| `sw.js`, `manifest.json`, `icons/` | Offline cache, update handshake, install metadata |
| `firestore.rules` | Paste into Firebase console > Firestore > Rules > Publish |

## Deploy (GitHub Pages)
1. Upload every file (keep `icons/` and `.nojekyll`) to the root of your `main` branch.
2. Firebase console > Firestore > Rules: paste `firestore.rules` and **Publish**. Account deletion needs these rules.
3. Authentication > Settings > Authorized domains: add `YOUR-USERNAME.github.io`. Enable Email/Password and Google sign-in.

## Shipping updates (important)
Every time you deploy new files, **change `VERSION` in `sw.js`** (for example `budgy-p3-v2`). That one-line change is what tells installed apps a new version exists.
- Open apps re-check every minute, when the app returns to the foreground, and when the device reconnects.
- A new version waits quietly, then a **New version ready / Update Now** prompt appears. Update Now tells the waiting worker to take over (`skipWaiting`) and reloads.
- Settings > App & storage > **Check** does the same check on demand.
- Nobody needs to remove the app from the home screen. Devices still on Phase 2 pick up Phase 3 on their next open, because the Phase 2 worker already serves your files network-first.

## Phase 3 features
- **Home**: hero net worth, a slim "spent this month" card, Expense / Income / Transfer shortcuts, then Allocated funds, Projection, Spending by category, Savings goals and Recent activity, all collapsed until tapped.
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

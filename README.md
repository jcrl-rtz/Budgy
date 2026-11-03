# Budgy (no-build)

Plain files only: index.html, app.js, firebase.js, sw.js, manifest.json, icons/. React, Babel, Tailwind and Firebase load from CDNs.

## Deploy
1. Upload every file here (keep `icons/`, `.nojekyll`) to the root of your `main` branch.
2. Settings > Pages > Source: Deploy from a branch > `main` / (root).
3. Firebase console > Authentication > Settings > Authorized domains: add `YOUR-USERNAME.github.io`.
4. Firestore > Rules: paste `firestore.rules` and publish.

Open it through the https:// Pages address. Opening index.html straight from disk will not work.
Data lives at `users/{uid}/budget/v2`, the same place the earlier Vite version used, so existing data carries over.

// Firebase v10 (modular SDK) loaded straight from Google's CDN. No bundler needed.
// Data model: one private document per user at users/{uid}/budget/v2, holding { t: lastChangeMillis, json: '<whole app state>' }.
// Phase 1 keeps this exact path and shape so everything you save now carries into Phase 2 and your earlier Budgy data.
const V = '10.14.1', B = 'https://www.gstatic.com/firebasejs/' + V + '/'
const cfg = {
  apiKey: "AIzaSyCE9GTATxWI4dL0o1bjFiMVBdBeivHK664",
  authDomain: "budglyyy.firebaseapp.com",
  projectId: "budglyyy",
  storageBucket: "budglyyy.firebasestorage.app",
  messagingSenderId: "954492047084",
  appId: "1:954492047084:web:9702dc342bd44b2bbd1fc9",
  measurementId: "G-N30J5VT7M4"
}
const M = {
  'auth/invalid-credential': 'Email or password is incorrect.', 'auth/wrong-password': 'Email or password is incorrect.', 'auth/user-not-found': 'Email or password is incorrect.',
  'auth/email-already-in-use': 'That email already has an account. Log in instead.', 'auth/weak-password': 'Use at least 6 characters.', 'auth/invalid-email': 'Enter a valid email address.',
  'auth/missing-password': 'Enter your password.', 'auth/popup-closed-by-user': '', 'auth/cancelled-popup-request': '',
  'auth/unauthorized-domain': 'This site address is not authorized in Firebase. Add it under Authentication > Settings > Authorized domains.',
  'auth/network-request-failed': 'No connection. Try again when you are online.', 'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'app/not-configured': 'Could not load Firebase. Check your connection and reload.',
  'app/wrong-password': 'Current password is incorrect.', 'app/no-user': 'You are not signed in.', 'app/offline': 'You need to be online for this. Check your connection and try again.',
  'auth/requires-recent-login': 'For your security, please log out, log back in and try again.', 'auth/popup-blocked': 'Your browser blocked the Google pop-up. Allow pop-ups for this site and try again.',
  'auth/user-mismatch': 'That Google account does not match the one you are signed in with.', 'auth/user-disabled': 'This account has been disabled.',
  'permission-denied': 'Firestore refused the request. Publish the latest firestore.rules in the Firebase console and try again.'
}
window.errMsg = (e) => (e && e.code in M ? M[e.code] : 'Something went wrong. Please try again.')
const off = () => { throw Object.assign(new Error('off'), { code: 'app/not-configured' }) }
let fb = { enabled: false, onAuth: () => () => {}, signIn: off, signUp: off, google: off, reset: off, signOut: off, watch: () => () => {}, save: off, setName: off, changePassword: off, deleteAccount: off }
try {
  const [A, Au, F] = await Promise.all([import(B + 'firebase-app.js'), import(B + 'firebase-auth.js'), import(B + 'firebase-firestore.js')])
  const app = A.initializeApp(cfg), auth = Au.getAuth(app)
  let db
  try { db = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) }) } catch { db = F.getFirestore(app) }
  const ref = (uid) => F.doc(db, 'users/' + uid + '/budget/v2')
  const me = () => { if (!auth.currentUser) throw Object.assign(new Error('no user'), { code: 'app/no-user' }); return auth.currentUser }
  // Fresh sign-in proof. Email/password accounts re-enter their password; Google accounts get the Google pop-up again.
  const reauth = async (pw) => {
    const u = me()
    if (u.providerData.some((p) => p.providerId === 'password')) {
      if (!pw) throw Object.assign(new Error('pw'), { code: 'auth/missing-password' })
      try { await Au.reauthenticateWithCredential(u, Au.EmailAuthProvider.credential(u.email, pw)) }
      catch (e) { throw ['auth/invalid-credential', 'auth/wrong-password'].includes(e.code) ? Object.assign(new Error('wrong'), { code: 'app/wrong-password' }) : e }
    } else await Au.reauthenticateWithPopup(u, new Au.GoogleAuthProvider())
  }
  fb = {
    enabled: true,
    onAuth: (cb) => Au.onAuthStateChanged(auth, (u) => cb(u && { uid: u.uid, email: u.email, name: u.displayName || '', photo: u.photoURL || '', providers: u.providerData.map((p) => p.providerId) })),
    signIn: (e, p) => Au.signInWithEmailAndPassword(auth, e, p),
    signUp: async (name, e, p) => { const r = await Au.createUserWithEmailAndPassword(auth, e, p); if (name) await Au.updateProfile(r.user, { displayName: name }); return r },
    google: async () => { const p = new Au.GoogleAuthProvider(); try { return await Au.signInWithPopup(auth, p) } catch (e) { if (e.code === 'auth/popup-blocked') return Au.signInWithRedirect(auth, p); throw e } },
    reset: (e) => Au.sendPasswordResetEmail(auth, e),
    signOut: () => Au.signOut(auth),
    // The whole budget is one JSON string in one document (avoids Firestore nested-array limits).
    watch: (uid, cb, err) => F.onSnapshot(ref(uid), (s) => { const d = s.exists() ? s.data() : null; cb(d && { t: d.t, state: JSON.parse(d.json) }, s.metadata.hasPendingWrites) }, err),
    save: (uid, t, state) => F.setDoc(ref(uid), { t, json: JSON.stringify(state) }),
    // ---- Phase 3 account controls ----
    setName: async (name) => { if (auth.currentUser) await Au.updateProfile(auth.currentUser, { displayName: name.trim() }) },
    changePassword: async (cur, nw) => { await reauth(cur); await Au.updatePassword(auth.currentUser, nw) },
    // Order matters: re-authenticate, wipe the Firestore records while still signed in (the rules need request.auth), then delete the sign-in account.
    deleteAccount: async (pw) => {
      if (!navigator.onLine) throw Object.assign(new Error('offline'), { code: 'app/offline' })
      await reauth(pw)
      const u = me()
      const snap = await F.getDocs(F.collection(db, 'users/' + u.uid + '/budget'))
      if (!snap.empty) { const b = F.writeBatch(db); snap.forEach((d) => b.delete(d.ref)); await b.commit() }
      await Au.deleteUser(u)
    },
  }
} catch (e) { console.error('Firebase failed to load', e) }
window.fb = fb
window.dispatchEvent(new Event('fb-ready'))

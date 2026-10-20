import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { firebaseConfig } from './firebase.config';

/** The only module with static firebase imports — load it via `await import('@/firebase')`. */
type Fb = { db: Firestore; auth: Auth; user: User };

let memo: Promise<Fb> | null = null;

export async function getFirebase(): Promise<Fb> {
  // Forget a failed attempt (e.g. offline sign-in) so the next call retries.
  memo ??= init().catch((e) => { memo = null; throw e; });
  return memo;
}

async function init(): Promise<Fb> {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  let db: Firestore;
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch {
    // Unsupported browser (no IndexedDB) or already initialised.
    db = getFirestore(app);
  }
  const auth = getAuth(app);
  await auth.authStateReady(); // restores a previous anonymous user, works offline
  if (!auth.currentUser) await signInAnonymously(auth);
  const user = await new Promise<User>((resolve, reject) => {
    let off: (() => void) | null = null;
    let done = false;
    off = onAuthStateChanged(auth, (u) => {
      if (!u || done) return;
      done = true;
      resolve(u);
      queueMicrotask(() => off?.());
    }, reject);
  });
  return { db, auth, user };
}

import { ref, type Ref } from 'vue';
import { useStored, onStoredChange, setStored } from './useStore';

/**
 * Two-phone sync of the slug-scoped lists (done / visited / picks / packed) through one Firestore doc:
 *   rooms/{roomId} = { updatedAt, keys: { '<slug>:<list>': { v: <value>, t: <ms of the write> } } }
 * Merge is last-writer-wins per key on `t`. The Firebase SDK is only loaded (dynamic import) once a room exists.
 */

type FS = typeof import('firebase/firestore');
type DocRef = import('firebase/firestore').DocumentReference;
type DocSnap = import('firebase/firestore').DocumentSnapshot;
type Entry = { v: unknown; t: number };

export type SyncState = 'off' | 'connecting' | 'live' | 'offline' | 'error';

export const syncState: Ref<SyncState> = ref('off');
export const roomId: Ref<string | null> = useStored<string | null>('et:room', null);
export const lastError: Ref<string | null> = ref(null);

/** Local write time per synced key (key without the `et:` prefix). */
const localT = useStored<Record<string, number>>('et:sync:t', {});

const SYNC_RE = /^et:[^:]+:(done|visited|picks|packed)$/;
const ROOM_RE = /^[a-z2-9]{20}$/;
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const DEBOUNCE_MS = 300;
const CONNECT_GRACE_MS = 6000;

let started = false;
let hooked = false;
let applying = false;
let gen = 0; // bumps on every (re)listen / leave; stale async work checks it
let activeRoom: string | null = null;
let unsub: (() => void) | null = null;
let fs: FS | null = null;
let docRef: DocRef | null = null;
let heardServer = false; // this listener got at least one snapshot from the server
let lastFromCache = true;
let graceTimer: ReturnType<typeof setTimeout> | null = null;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

function readLocal(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? undefined : JSON.parse(raw);
  } catch { return undefined; }
}

function recordT(k: string, t: number) {
  localT.value = { ...localT.value, [k]: t };
}

function fail(e: unknown, my: number) {
  if (my !== gen) return;
  lastError.value = errMsg(e);
  // A network failure while the phone is offline is not an error — retried on 'online'.
  syncState.value = isOffline() ? 'offline' : 'error';
  stopListener();
  activeRoom = null;
}

function clearGrace() {
  if (graceTimer) { clearTimeout(graceTimer); graceTimer = null; }
}

function stopListener() {
  clearGrace();
  unsub?.();
  unsub = null;
  docRef = null;
}

/** Write one key to the room doc (fire-and-forget; queued by Firestore while offline). */
function push(k: string) {
  if (!fs || !docRef) return; // not attached yet — reconcile() pushes it after the first server snapshot
  const v = readLocal('et:' + k);
  if (v === undefined) return;
  const t = localT.value[k] ?? Date.now();
  if (localT.value[k] == null) recordT(k, t);
  const my = gen;
  fs.setDoc(docRef, { updatedAt: fs.serverTimestamp(), keys: { [k]: { v, t } } }, { merge: true })
    .catch((e) => fail(e, my));
}

function onLocalChange(key: string) {
  if (applying || !SYNC_RE.test(key)) return;
  const k = key.slice(3);
  // Never stamp below an already-applied remote t (clock skew between phones would revert the edit).
  recordT(k, Math.max(Date.now(), (localT.value[k] ?? 0) + 1));
  if (!roomId.value) return;
  const prev = timers.get(k);
  if (prev) clearTimeout(prev);
  timers.set(k, setTimeout(() => { timers.delete(k); push(k); }, DEBOUNCE_MS));
}

/** Push every syncable local key that is newer than the room (or missing there). */
function reconcile(remote: Record<string, Entry>) {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && SYNC_RE.test(key)) keys.push(key.slice(3));
    }
  } catch { return; }
  for (const k of keys) {
    if (timers.has(k)) continue; // a debounced push is already on its way
    const lt = localT.value[k];
    const r = remote[k];
    if (!r || (lt != null && lt > r.t)) push(k);
  }
}

function onSnap(snap: DocSnap, my: number) {
  if (my !== gen) return;
  const data = snap.data() as { keys?: Record<string, Entry> } | undefined;
  const remote = data?.keys ?? {};

  applying = true;
  try {
    for (const [k, e] of Object.entries(remote)) {
      if (!e || typeof e.t !== 'number' || e.v === undefined || !SYNC_RE.test('et:' + k)) continue;
      if (e.t > (localT.value[k] ?? 0)) {
        setStored('et:' + k, e.v);
        recordT(k, e.t);
      }
    }
  } finally {
    applying = false;
  }

  const { fromCache, hasPendingWrites } = snap.metadata;
  lastFromCache = fromCache;
  if (!fromCache) {
    heardServer = true;
    clearGrace();
    syncState.value = 'live';
    lastError.value = null;
    // Seeds a fresh room on join, and re-pushes local wins that a stale offline write overwrote.
    if (!hasPendingWrites) reconcile(remote);
  } else if (isOffline() || heardServer) {
    syncState.value = 'offline';
  } else {
    // Cached snapshot at start-up: give the server a moment before calling it offline.
    armGrace();
  }
}

/** While 'connecting', fall back to 'offline' if the server stays silent. */
function armGrace() {
  if (graceTimer) return;
  const my = gen;
  graceTimer = setTimeout(() => {
    graceTimer = null;
    if (my === gen && syncState.value === 'connecting') syncState.value = 'offline';
  }, CONNECT_GRACE_MS);
}

async function listen(id: string): Promise<void> {
  if (activeRoom === id && (unsub || syncState.value === 'connecting')) return;
  stopListener();
  const my = ++gen;
  activeRoom = id;
  heardServer = false;
  lastFromCache = true;
  syncState.value = 'connecting';
  lastError.value = null;
  try {
    const [{ getFirebase }, mod] = await Promise.all([import('@/firebase'), import('firebase/firestore')]);
    const { db } = await getFirebase();
    if (my !== gen) return;
    fs = mod;
    const ref = mod.doc(db, 'rooms', id);
    docRef = ref;
    unsub = mod.onSnapshot(ref, { includeMetadataChanges: true }, (s) => onSnap(s, my), (e) => fail(e, my));
  } catch (e) {
    fail(e, my);
  }
}

function onNet() {
  if (!roomId.value) return;
  if (isOffline()) {
    if (syncState.value !== 'error') syncState.value = 'offline';
    return;
  }
  if (!unsub) { void listen(roomId.value); return; } // failed earlier — retry now
  if (heardServer && !lastFromCache) { syncState.value = 'live'; return; }
  syncState.value = 'connecting';
  armGrace();
}

function hook() {
  if (hooked) return;
  hooked = true;
  onStoredChange((key) => onLocalChange(key));
  window.addEventListener('online', onNet);
  window.addEventListener('offline', onNet);
}

/** Call once at app start. No-op (no SDK load) without a room. */
export function startSync(): void {
  if (started) return;
  started = true;
  hook();
  if (roomId.value) void listen(roomId.value);
}

function newRoomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export async function createRoom(): Promise<string> {
  const id = newRoomId();
  await joinRoom(id);
  return id;
}

/** Join (or switch to) a room. Network trouble shows up in syncState/lastError, not as a rejection. */
export async function joinRoom(id: string): Promise<void> {
  const code = id.trim().toLowerCase();
  if (!ROOM_RE.test(code)) throw new Error('Invalid room code');
  hook();
  roomId.value = code;
  await listen(code);
}

/** Stop syncing; local data (and per-key write times) stay on this phone. */
export function leaveRoom(): void {
  gen++;
  stopListener();
  activeRoom = null;
  timers.forEach(clearTimeout);
  timers.clear();
  roomId.value = null;
  try { localStorage.removeItem('et:room'); } catch { /* ignore */ }
  syncState.value = 'off';
  lastError.value = null;
}

export function shareLink(slug: string): string {
  if (!roomId.value) return '';
  return `${location.origin}${location.pathname}#/t/${slug}?room=${roomId.value}`;
}

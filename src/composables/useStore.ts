import { effectScope, ref, watch, type Ref } from 'vue';

const cache = new Map<string, Ref<unknown>>();
/** Detached scope: persistence watchers must outlive the component that first asked for a key. */
const scope = effectScope(true);
const subscribers = new Set<(key: string, value: unknown) => void>();
/** True while setStored writes — the watch persists but skips subscribers. */
let silent = false;

/** Reactive localStorage-backed ref (shared per key). */
export function useStored<T>(key: string, initial: T): Ref<T> {
  if (cache.has(key)) return cache.get(key) as Ref<T>;
  let value = initial;
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) value = JSON.parse(raw) as T;
  } catch { /* private mode etc. */ }
  const r = ref(value) as Ref<T>;
  // Sync flush so the `silent` flag set by setStored is still up when this runs.
  scope.run(() => {
    watch(r, (v) => {
      try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
      if (!silent) subscribers.forEach((cb) => cb(key, v));
    }, { deep: true, flush: 'sync' });
  });
  cache.set(key, r as Ref<unknown>);
  return r;
}

/** Subscribe to every stored-ref write (except setStored). Returns an unsubscribe. */
export function onStoredChange(cb: (key: string, value: unknown) => void): () => void {
  subscribers.add(cb);
  return () => { subscribers.delete(cb); };
}

/** Set a stored value (creating the shared ref if needed) and persist it without notifying onStoredChange. */
export function setStored(key: string, value: unknown): void {
  const r = useStored<unknown>(key, value);
  silent = true;
  try {
    r.value = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  } finally {
    silent = false;
  }
}

/** Set of done ids (timeline items / visited places / packed items). */
export function useChecklist(scope: string) {
  const set = useStored<string[]>(`et:${scope}`, []);
  const has = (id: string) => set.value.includes(id);
  const toggle = (id: string) => {
    set.value = has(id) ? set.value.filter((x) => x !== id) : [...set.value, id];
  };
  return { set, has, toggle };
}

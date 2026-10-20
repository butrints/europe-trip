import { ref, watch, type Ref } from 'vue';

const cache = new Map<string, Ref<unknown>>();

/** Reactive localStorage-backed ref (shared per key). */
export function useStored<T>(key: string, initial: T): Ref<T> {
  if (cache.has(key)) return cache.get(key) as Ref<T>;
  let value = initial;
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) value = JSON.parse(raw) as T;
  } catch { /* private mode etc. */ }
  const r = ref(value) as Ref<T>;
  watch(r, (v) => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
  }, { deep: true });
  cache.set(key, r as Ref<unknown>);
  return r;
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

import { ref } from 'vue';

/** Global route-sheet state: which route id is open (null = closed). */
export const openRouteId = ref<string | null>(null);
export const openRoute = (id: string) => { openRouteId.value = id; };
export const closeRoute = () => { openRouteId.value = null; };

/** Toast bus. */
const listeners = new Set<(m: string) => void>();
export const toast = (m: string) => listeners.forEach((l) => l(m));
export const onToast = (l: (m: string) => void) => { listeners.add(l); return () => listeners.delete(l); };

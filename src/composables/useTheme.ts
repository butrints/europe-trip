import { computed, ref, watchEffect } from 'vue';
import { useStored } from './useStore';

export type ThemePref = 'auto' | 'light' | 'dark';

const pref = useStored<ThemePref>('et:theme', 'light');
const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const dark = ref(false);

function apply() {
  dark.value = pref.value === 'dark' || (pref.value === 'auto' && !!mq?.matches);
  document.documentElement.dataset.theme = dark.value ? 'dark' : 'light';
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    m.content = dark.value ? '#0E1014' : '#F2F3F5';
  });
}

let bound = false;
export function useTheme() {
  if (!bound) {
    bound = true;
    watchEffect(apply);
    mq?.addEventListener('change', apply);
  }
  const isDark = computed(() => dark.value);
  const cycle = () => {
    pref.value = pref.value === 'light' ? 'dark' : pref.value === 'dark' ? 'auto' : 'light';
  };
  return { pref, isDark, cycle };
}

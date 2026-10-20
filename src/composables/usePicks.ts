import { computed } from 'vue';
import { useStored } from './useStore';

/**
 * "Picks": places the traveller adds to a given day themselves.
 * Days are not scripted — anchors (flights, trains, booked slots) are fixed, the rest is built here.
 */
export function usePicks(slug: string) {
  const map = useStored<Record<string, string[]>>(`et:${slug}:picks`, {});
  const forDay = (date: string) => computed(() => map.value[date] ?? []);
  const has = (date: string, placeId: string) => (map.value[date] ?? []).includes(placeId);
  const daysWith = (placeId: string) => Object.keys(map.value).filter((d) => map.value[d]?.includes(placeId));
  const toggle = (date: string, placeId: string) => {
    const cur = map.value[date] ?? [];
    map.value = { ...map.value, [date]: cur.includes(placeId) ? cur.filter((x) => x !== placeId) : [...cur, placeId] };
  };
  const move = (date: string, placeId: string, dir: -1 | 1) => {
    const cur = [...(map.value[date] ?? [])];
    const i = cur.indexOf(placeId), j = i + dir;
    if (i < 0 || j < 0 || j >= cur.length) return;
    [cur[i], cur[j]] = [cur[j], cur[i]];
    map.value = { ...map.value, [date]: cur };
  };
  return { map, forDay, has, daysWith, toggle, move };
}

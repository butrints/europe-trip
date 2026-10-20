<script setup lang="ts">
import { computed, ref } from 'vue';
import { syncState, roomId, lastError, createRoom, joinRoom, leaveRoom, shareLink } from '@/composables/useSync';
import { toast } from '@/composables/useSheet';
import Icon from '@/components/ui/Icon.vue';

const props = defineProps<{ slug: string }>();

const joining = ref(false);
const joinText = ref('');
const busy = ref(false);

const stateText = computed(() => {
  switch (syncState.value) {
    case 'connecting': return 'Connecting…';
    case 'live': return `Live · room ${(roomId.value ?? '').slice(0, 6)}…`;
    case 'offline': return 'Offline · changes queued, will sync later';
    case 'error': return `Error: ${lastError.value ?? 'unknown'}`;
    default: return 'Not synced · each phone keeps its own ticks';
  }
});

const link = computed(() => (roomId.value ? shareLink(props.slug) : ''));

async function create() {
  if (busy.value) return;
  busy.value = true;
  try {
    await createRoom();
    toast('Room created — now share the link');
  } catch (e) {
    toast((e as Error).message);
  } finally {
    busy.value = false;
  }
}

function extractId(text: string): string {
  const raw = text.trim();
  const m = raw.match(/room=([a-z2-9]{20})/);
  if (m) return m[1];
  return raw;
}

async function join() {
  if (busy.value) return;
  busy.value = true;
  try {
    await joinRoom(extractId(joinText.value));
    toast('Joined');
    joining.value = false;
    joinText.value = '';
  } catch (e) {
    toast((e as Error).message);
  } finally {
    busy.value = false;
  }
}

async function share() {
  const url = shareLink(props.slug);
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Trip sync', url });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return; // user cancelled
      // other errors (e.g. NotAllowedError on desktop) fall through to the clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast('Link copied');
  } catch (e) {
    toast((e as Error).message);
  }
}

function leave() {
  leaveRoom();
  toast('Left the room — your ticks stay on this phone');
}
</script>

<template>
  <div class="card pad sync">
    <div class="head">
      <div class="ico-tile solid" style="--k: var(--sec)"><Icon name="share" /></div>
      <div class="ht">
        <b>Sync with Elmedina</b>
        <span class="state"><i class="sdot" :class="syncState" />{{ stateText }}</span>
      </div>
    </div>

    <template v-if="!roomId">
      <div class="btns">
        <button class="btn btn-fill" :disabled="busy" @click="create">Create room</button>
        <button class="btn btn-tonal" @click="joining = !joining">Join with link</button>
      </div>
      <form v-if="joining" class="joinrow" @submit.prevent="join">
        <input v-model="joinText" class="inp" type="text" placeholder="Paste link or room code" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="Room link or code" />
        <button class="btn btn-fill btn-sm" type="submit" :disabled="busy || !joinText.trim()">Join</button>
      </form>
    </template>

    <template v-else>
      <div class="btns">
        <button class="btn btn-fill" @click="share">Share link</button>
        <button class="btn btn-tonal" @click="leave">Leave</button>
      </div>
      <p class="link">{{ link }}</p>
    </template>

    <p class="note">Synced: picks, done, visited, packing. If you both edit the same list while offline, the later change wins.</p>
  </div>
</template>

<style scoped>
.sync { display: grid; gap: 12px; }
.head { display: flex; align-items: center; gap: 12px; }
.ht { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.ht b { font-size: 15px; font-weight: 700; }
.state { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--fg-2); }
.sdot { width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--fg-3); }
.sdot.live { background: var(--k-free); }
.sdot.connecting, .sdot.offline { background: var(--k-food); }
.sdot.error { background: var(--k-home); }
.btns { display: flex; gap: 8px; }
.btns .btn { flex: 1; }
.btn:disabled { opacity: .55; }
.joinrow { display: flex; gap: 8px; align-items: center; }
.inp { flex: 1; min-width: 0; height: 46px; padding: 0 14px; border-radius: var(--r-lg); background: var(--card); border: 1px solid var(--line); font-size: 15px; outline: none; transition: border-color .2s, box-shadow .2s; }
.inp::placeholder { color: var(--fg-3); }
.inp:focus { border-color: var(--sec); box-shadow: 0 0 0 3px var(--sec-soft); }
.link { font-size: 12px; color: var(--fg-3); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; word-break: break-all; overflow-wrap: anywhere; }
.note { font-size: 12px; color: var(--fg-3); }
</style>

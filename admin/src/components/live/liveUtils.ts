import type { LiveFeatureFlags, LiveStatus } from '@/types/live';

const DATE_TIME = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
const TIME = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

export const formatWhen = (iso: string): string => DATE_TIME.format(new Date(iso));
export const formatTimeOnly = (iso: string): string => TIME.format(new Date(iso));

export const formatDuration = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
};

export const formatSeconds = (sec: number): string => {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
};

export const formatBytes = (n: number): string => (n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(1)} GB` : n >= 1024 ** 2 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** ISO -> value of <input type="datetime-local"> in the browser's time zone */
export const toLocalInput = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** next quarter of an hour, at least 15 minutes from now */
export const defaultStart = (): string => {
  const d = new Date(Date.now() + 15 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return toLocalInput(d.toISOString());
};

export const FEATURES: { key: keyof LiveFeatureFlags; label: string; hint: string }[] = [
  { key: 'chat', label: 'Live chat', hint: 'Students and the teacher can type messages' },
  { key: 'handRaise', label: 'Raise hand', hint: 'Students ask to speak; you allow their mic with one click' },
  { key: 'polls', label: 'Live polls', hint: 'Ask a quick question and see the votes' },
  { key: 'reactions', label: 'Reactions', hint: 'Emoji floating over the video' },
  { key: 'studentCamera', label: 'Student camera', hint: 'Allow students to show their face when you permit it' },
  { key: 'recording', label: 'Recording', hint: 'Save the class so students can watch it later' },
];

export const STATUS_STYLE: Record<LiveStatus, string> = {
  live: 'bg-[#FDE0DA] text-[#B4281A]',
  scheduled: 'bg-[#E4F4DC] text-ok',
  ended: 'bg-[#EFE6DA] text-veda-muted',
  cancelled: 'bg-[#EFE6DA] text-veda-muted',
};

/** capacity advice shown next to the "max students" field */
export const capacityAdvice = (n: number): { tone: 'ok' | 'warn'; text: string } =>
  n <= 25
    ? { tone: 'ok', text: 'Smooth HD video and audio for everyone.' }
    : n <= 60
      ? { tone: 'warn', text: 'Works well, the video quality lowers automatically. Teacher needs a good internet connection (10+ Mbps upload).' }
      : { tone: 'warn', text: 'Very large class: video is kept low quality and needs a strong teacher connection (20+ Mbps upload). For regular classes this big, a media server (SFU) is recommended.' };
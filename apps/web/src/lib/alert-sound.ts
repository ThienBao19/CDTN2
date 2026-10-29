"use client";

// Âm báo cho người nhà, tạo bằng Web Audio nên không cần file âm thanh.
// Trình duyệt (nhất là iPhone) chỉ cho phát tiếng sau một lần chạm vào trang:
// unlockSound() được gọi ở lần chạm đầu tiên.

type Tone = { freq: number; start: number; duration: number };

const STAGE_TONES: Tone[] = [
  { freq: 880, start: 0, duration: 0.18 },
  { freq: 1320, start: 0.2, duration: 0.3 },
];
// Một hồi chuông: 3 nốt đi lên, lặp lại cho tới khi người dùng tắt
const RING_TONES: Tone[] = [
  { freq: 988, start: 0, duration: 0.22 },
  { freq: 1319, start: 0.25, duration: 0.22 },
  { freq: 1568, start: 0.5, duration: 0.4 },
];
const RING_PERIOD_MS = 1600;
const STAGE_VIBRATION = [200, 100, 200];
const RING_VIBRATION = [600, 300, 600, 300];

let context: AudioContext | null = null;
let ringTimer: ReturnType<typeof setInterval> | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  return context;
}

function play(tones: Tone[]): void {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  tones.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.4, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + duration + 0.05);
  });
}

function vibrate(pattern: number[]): void {
  // iPhone không hỗ trợ rung từ trang web; Android thì có
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
}

// Gọi trong một thao tác chạm của người dùng để mở khóa âm thanh
export function unlockSound(): void {
  const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
  if (session) session.type = "playback"; // iOS 17+: vẫn kêu khi bật chế độ im lặng
  void audio()?.resume();
}

export function playStageSound(): void {
  play(STAGE_TONES);
  vibrate(STAGE_VIBRATION);
}

export function startRinging(): void {
  if (ringTimer) return;
  const ring = () => {
    play(RING_TONES);
    vibrate(RING_VIBRATION);
  };
  ring();
  ringTimer = setInterval(ring, RING_PERIOD_MS);
}

export function stopRinging(): void {
  if (ringTimer) clearInterval(ringTimer);
  ringTimer = null;
  vibrate([0]);
}

export function isRinging(): boolean {
  return ringTimer !== null;
}

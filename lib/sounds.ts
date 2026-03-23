let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("wordbox_sound") !== "off";
}

export function toggleSound(): boolean {
  const next = !isSoundEnabled();
  localStorage.setItem("wordbox_sound", next ? "on" : "off");
  return next;
}

export function playPlaceSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.value = 440;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
}

function playNote(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration = 0.28,
  gainLevel = 0.2
) {
  // Two oscillators per note: square + detuned sine → rich, bright tone
  const configs: { type: OscillatorType; detune: number; level: number }[] = [
    { type: "square", detune: 0,  level: gainLevel * 0.6 },
    { type: "sine",   detune: 7,  level: gainLevel * 0.4 },
  ];

  configs.forEach(({ type, detune, level }) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);

    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;

    // Sharp attack, exponential decay
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(level, startTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

export function playWinSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Low-end thump at the very start for physical impact
  const thump = ctx.createOscillator();
  const thumpGain = ctx.createGain();
  thump.connect(thumpGain);
  thumpGain.connect(ctx.destination);
  thump.type = "sine";
  thump.frequency.setValueAtTime(90, now);
  thump.frequency.exponentialRampToValueAtTime(40, now + 0.06);
  thumpGain.gain.setValueAtTime(0.35, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  thump.start(now);
  thump.stop(now + 0.08);

  // 7-note fanfare arpeggio: C4 E4 G4 C5 E5 G5 C6
  const freqs = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
  const spacing = 0.07; // 70ms between notes

  freqs.forEach((freq, i) => {
    playNote(ctx, freq, now + i * spacing, 0.28, 0.18);
  });

  // Triumphant landing chord after the arpeggio: C5 + E5 + G5 together
  const chordStart = now + freqs.length * spacing + 0.02;
  [523.25, 659.25, 783.99].forEach((freq) => {
    playNote(ctx, freq, chordStart, 0.55, 0.22);
  });
}

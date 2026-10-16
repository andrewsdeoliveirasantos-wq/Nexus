// Web Audio API sound generator for appointments, alarms, and task checkmarks
// Works 100% in all modern browsers without requiring external audio files.

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioContext = new AudioCtx();
      }
    }
    if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }
    return sharedAudioContext;
  } catch (err) {
    console.warn('Web Audio API not supported or blocked:', err);
    return null;
  }
}

/**
 * Initializes and unlocks the audio context upon user click
 */
export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * Checks if sound notifications are globally enabled
 */
export function isSoundAlertEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem('gestao_sound_alerts_enabled');
  return stored !== 'false';
}

/**
 * Toggles global sound notifications
 */
export function setSoundAlertEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('gestao_sound_alerts_enabled', enabled ? 'true' : 'false');
}

/**
 * Plays a pleasant, distinct 3-tone chime for scheduled commitments/appointments
 */
export function playAppointmentAlertSound(): void {
  if (!isSoundAlertEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // First sequence of tones (E5 -> G#5 -> B5)
    const tones = [
      { freq: 659.25, start: 0.0, duration: 0.15 },
      { freq: 830.61, start: 0.16, duration: 0.15 },
      { freq: 987.77, start: 0.32, duration: 0.35 },
      // Repeat sequence after a short pause for clarity
      { freq: 659.25, start: 0.8, duration: 0.15 },
      { freq: 830.61, start: 0.96, duration: 0.15 },
      { freq: 987.77, start: 1.12, duration: 0.45 },
    ];

    tones.forEach((tone) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(tone.freq, now + tone.start);

      // Envelope: quick attack and smooth decay
      gain.gain.setValueAtTime(0.001, now + tone.start);
      gain.gain.exponentialRampToValueAtTime(0.35, now + tone.start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + tone.start + tone.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + tone.start);
      osc.stop(now + tone.start + tone.duration);
    });
  } catch (e) {
    console.warn('Error playing appointment sound:', e);
  }
}

/**
 * Plays an urgent two-tone alert for Emergencies / Socorros do Dia
 */
export function playEmergencyAlarmSound(): void {
  if (!isSoundAlertEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 880, start: 0.0, duration: 0.18 },
      { freq: 1174.66, start: 0.2, duration: 0.22 },
      { freq: 880, start: 0.5, duration: 0.18 },
      { freq: 1174.66, start: 0.7, duration: 0.3 },
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Gives a slightly punchier timbre
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      gain.gain.setValueAtTime(0.001, now + n.start);
      gain.gain.exponentialRampToValueAtTime(0.4, now + n.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.start);
      osc.stop(now + n.start + n.duration);
    });
  } catch (e) {
    console.warn('Error playing emergency alarm sound:', e);
  }
}

/**
 * Plays a satisfying crisp "ding" when the user marks a task/commitment with a CHECK
 */
export function playCheckmarkSound(): void {
  if (!isSoundAlertEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, now); // C6
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch (e) {
    console.warn('Error playing checkmark sound:', e);
  }
}

/**
 * Triggers a test sound so the user can verify their audio volume and unlock browser sound
 */
export function testSoundAlert(): void {
  unlockAudio();
  playAppointmentAlertSound();
}

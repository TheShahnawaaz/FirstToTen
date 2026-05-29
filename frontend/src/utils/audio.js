// Synthesize sound effects on the fly using the Web Audio API
// This avoids downloading audio assets and works 100% offline.

let audioCtx = null;
let soundEnabled = true;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const toggleMute = () => {
  soundEnabled = !soundEnabled;
  return soundEnabled;
};

export const isMuted = () => !soundEnabled;

// Generic synth tone player
const playTone = (freq, type, duration, volStart, volEnd = 0.0001, delay = 0) => {
  if (!soundEnabled) return;
  
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    
    gainNode.gain.setValueAtTime(volStart, ctx.currentTime + delay);
    gainNode.gain.exponentialRampToValueAtTime(volEnd, ctx.currentTime + delay + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch (err) {
    console.warn('Audio synthesis failed:', err);
  }
};

export const playClick = () => {
  playTone(800, 'sine', 0.05, 0.05);
};

export const playTick = () => {
  playTone(120, 'triangle', 0.04, 0.1);
};

export const playWrong = () => {
  // Synthesize a buzzer: two quick discordant square/sawtooth tones sliding down
  playTone(180, 'sawtooth', 0.15, 0.12);
  playTone(175, 'square', 0.15, 0.1);
};

export const playCorrect = () => {
  // Rising major 3rd/5th chime
  playTone(523.25, 'sine', 0.15, 0.08, 0.01, 0); // C5
  playTone(659.25, 'sine', 0.15, 0.08, 0.01, 0.06); // E5
  playTone(783.99, 'sine', 0.25, 0.1, 0.01, 0.12); // G5
};

export const playMatchStart = () => {
  playTone(261.63, 'sine', 0.15, 0.08, 0.01, 0); // C4
  playTone(329.63, 'sine', 0.15, 0.08, 0.01, 0.08); // E4
  playTone(392.00, 'sine', 0.15, 0.08, 0.01, 0.16); // G4
  playTone(523.25, 'sine', 0.4, 0.1, 0.01, 0.24); // C5
};

export const playVictory = () => {
  const tones = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6 arpeggio
  tones.forEach((freq, idx) => {
    playTone(freq, 'triangle', 0.3, 0.08, 0.01, idx * 0.08);
  });
};

export const playDefeat = () => {
  // Descending heavy minor chord
  playTone(220.00, 'sawtooth', 0.4, 0.1, 0.01, 0); // A3
  playTone(261.63, 'square', 0.4, 0.08, 0.01, 0.05); // C4
  playTone(311.13, 'sine', 0.5, 0.06, 0.01, 0.1); // Eb4
  playTone(196.00, 'triangle', 0.6, 0.12, 0.01, 0.18); // G3 (resolved down)
};

export default {
  toggleMute,
  isMuted,
  playClick,
  playTick,
  playWrong,
  playCorrect,
  playMatchStart,
  playVictory,
  playDefeat
};

/**
 * DTMF (Dual-Tone Multi-Frequency) Audio Generator
 * Generates authentic DTMF tones for keypad feedback
 */

// DTMF frequency map (4x4 matrix)
// Low frequencies (rows) and high frequencies (columns)
const DTMF_FREQUENCIES: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  'A': [697, 1633],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  'B': [770, 1633],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  'C': [852, 1633],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
  'D': [941, 1633],
};

/**
 * Plays a DTMF tone for the given digit
 * @param tone - The DTMF digit to play ('0'-'9', '*', '#', 'A'-'D')
 * @param duration - Duration in milliseconds (default: 100ms)
 * @param volume - Volume level 0-1 (default: 0.3)
 */
export function playDtmfTone(
  tone: string,
  duration: number = 100,
  volume: number = 0.3
): void {
  const frequencies = DTMF_FREQUENCIES[tone.toUpperCase()];

  if (!frequencies) {
    console.warn(`Invalid DTMF tone: ${tone}`);
    return;
  }

  try {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const [lowFreq, highFreq] = frequencies;

    // Create two oscillators for the two frequencies
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();

    // Create gain nodes for volume control
    const gainNode1 = audioContext.createGain();
    const gainNode2 = audioContext.createGain();
    const masterGain = audioContext.createGain();

    // Configure oscillators
    oscillator1.frequency.value = lowFreq;
    oscillator2.frequency.value = highFreq;
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';

    // Connect the audio graph
    oscillator1.connect(gainNode1);
    oscillator2.connect(gainNode2);
    gainNode1.connect(masterGain);
    gainNode2.connect(masterGain);
    masterGain.connect(audioContext.destination);

    // Set volume levels (each oscillator at half volume, master at requested volume)
    const currentTime = audioContext.currentTime;
    gainNode1.gain.setValueAtTime(0.5, currentTime);
    gainNode2.gain.setValueAtTime(0.5, currentTime);

    // Apply fade in/out envelope for cleaner sound
    masterGain.gain.setValueAtTime(0, currentTime);
    masterGain.gain.linearRampToValueAtTime(volume, currentTime + 0.005); // 5ms fade in
    masterGain.gain.setValueAtTime(volume, currentTime + (duration / 1000) - 0.01);
    masterGain.gain.linearRampToValueAtTime(0, currentTime + (duration / 1000)); // 10ms fade out

    // Start and stop oscillators
    const durationSec = duration / 1000;
    oscillator1.start(currentTime);
    oscillator2.start(currentTime);
    oscillator1.stop(currentTime + durationSec);
    oscillator2.stop(currentTime + durationSec);

    // Clean up after playback
    setTimeout(() => {
      try {
        audioContext.close();
      } catch (err) {
        // Ignore errors during cleanup
      }
    }, duration + 100);

  } catch (error) {
    console.error('Failed to play DTMF tone:', error);
  }
}

/**
 * Preloads audio context to reduce latency on first DTMF tone
 * Call this once during initialization
 */
export function initDtmfAudio(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Resume context in case it's suspended (required by some browsers)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    // Close immediately after initialization
    setTimeout(() => {
      audioContext.close();
    }, 100);
  } catch (error) {
    console.warn('Failed to initialize DTMF audio:', error);
  }
}

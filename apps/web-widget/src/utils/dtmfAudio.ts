/**
 * DTMF (Dual-Tone Multi-Frequency) Audio Generator
 * Generates authentic DTMF tones for keypad feedback and in-band transmission
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
 * Plays a DTMF tone locally (for user feedback)
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
 * Generates DTMF tone and injects it into a MediaStream (for in-band transmission)
 * This is required for Jambonz which expects DTMF as audio tones, not RFC 2833
 *
 * @param tone - The DTMF digit to send
 * @param stream - The MediaStream to inject the tone into
 * @param duration - Duration in milliseconds (default: 250ms for better detection)
 * @returns Promise that resolves when tone is sent
 */
export async function sendDtmfInBand(
  tone: string,
  stream: MediaStream,
  duration: number = 250
): Promise<void> {
  const frequencies = DTMF_FREQUENCIES[tone.toUpperCase()];

  if (!frequencies) {
    console.warn(`Invalid DTMF tone: ${tone}`);
    return;
  }

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const [lowFreq, highFreq] = frequencies;

    // Create media stream source from the original stream
    const streamSource = audioContext.createMediaStreamSource(stream);

    // Create DTMF oscillators
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();

    // Create gain nodes
    const dtmfGain = audioContext.createGain();
    const streamGain = audioContext.createGain();
    const mixerGain = audioContext.createGain();

    // Configure DTMF oscillators
    oscillator1.frequency.value = lowFreq;
    oscillator2.frequency.value = highFreq;
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';

    // Create destination for mixed audio
    const destination = audioContext.createMediaStreamDestination();

    // Connect DTMF tones
    oscillator1.connect(dtmfGain);
    oscillator2.connect(dtmfGain);

    // Connect original stream
    streamSource.connect(streamGain);

    // Mix both to destination
    dtmfGain.connect(mixerGain);
    streamGain.connect(mixerGain);
    mixerGain.connect(destination);

    // Set gains (DTMF louder than speech for detection)
    const currentTime = audioContext.currentTime;
    const durationSec = duration / 1000;

    // DTMF tone with envelope
    dtmfGain.gain.setValueAtTime(0, currentTime);
    dtmfGain.gain.linearRampToValueAtTime(0.7, currentTime + 0.01); // 10ms fade in
    dtmfGain.gain.setValueAtTime(0.7, currentTime + durationSec - 0.01);
    dtmfGain.gain.linearRampToValueAtTime(0, currentTime + durationSec); // 10ms fade out

    // Reduce stream volume during DTMF (ducking)
    streamGain.gain.setValueAtTime(0.3, currentTime);
    streamGain.gain.setValueAtTime(0.3, currentTime + durationSec);
    streamGain.gain.linearRampToValueAtTime(1.0, currentTime + durationSec + 0.05);

    mixerGain.gain.setValueAtTime(1.0, currentTime);

    // Start DTMF tones
    oscillator1.start(currentTime);
    oscillator2.start(currentTime);
    oscillator1.stop(currentTime + durationSec);
    oscillator2.stop(currentTime + durationSec);

    // Replace track in original stream
    const audioTrack = destination.stream.getAudioTracks()[0];
    if (audioTrack) {
      const oldTrack = stream.getAudioTracks()[0];
      if (oldTrack) {
        stream.removeTrack(oldTrack);
      }
      stream.addTrack(audioTrack);

      // Restore original track after DTMF
      setTimeout(() => {
        stream.removeTrack(audioTrack);
        if (oldTrack && oldTrack.readyState === 'live') {
          stream.addTrack(oldTrack);
        }
        audioContext.close();
      }, duration + 100);
    }

    // Wait for tone to complete
    await new Promise(resolve => setTimeout(resolve, duration));

  } catch (error) {
    console.error('Failed to send in-band DTMF:', error);
    throw error;
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

import * as Tone from 'tone';

class PianoEngine {
  private synth: Tone.Sampler | null = null;
  private victoryPlayer: Tone.Player | null = null;
  private isLoaded = false;

  constructor() {
    // We use a sampler for better piano sound
    // Using high quality samples from a public CDN
    this.synth = new Tone.Sampler({
      urls: {
        A0: "A0.mp3",
        C1: "C1.mp3",
        "D#1": "Ds1.mp3",
        "F#1": "Fs1.mp3",
        A1: "A1.mp3",
        C2: "C2.mp3",
        "D#2": "Ds2.mp3",
        "F#2": "Fs2.mp3",
        A2: "A2.mp3",
        C3: "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        A3: "A3.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        A5: "A5.mp3",
        C6: "C6.mp3",
        "D#6": "Ds6.mp3",
        "F#6": "Fs6.mp3",
        A6: "A6.mp3",
        C7: "C7.mp3",
        "D#7": "Ds7.mp3",
        "F#7": "Fs7.mp3",
        A7: "A7.mp3",
        C8: "C8.mp3",
        A0_mp3: "A0.mp3", // Dummy entry to keep keys consistent if needed
      },
      release: 1,
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      onload: () => {
        this.isLoaded = true;
      }
    }).toDestination();

    // Load victory sound
    this.victoryPlayer = new Tone.Player({
      url: "https://assets.mixkit.co/active_storage/sfx/1476/1476-preview.mp3",
      autostart: false,
    });

    // Soften the sound with a low-pass filter to remove "sharpness"
    const softFilter = new Tone.Filter({
      frequency: 1200,
      type: "lowpass",
    }).toDestination();

    this.victoryPlayer.volume.value = -6; // Reduce volume for a softer feel
    this.victoryPlayer.connect(softFilter);
  }

  async init() {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }
  }

  playNote(note: string, duration: string = '4n') {
    if (!this.isLoaded || !this.synth) return;
    this.synth.triggerAttackRelease(note, duration);
  }

  // Support for continuous play/sustain
  triggerAttack(note: string) {
    if (!this.isLoaded || !this.synth) return;
    this.synth.triggerAttack(note);
  }

  triggerRelease(note: string) {
    if (!this.isLoaded || !this.synth) return;
    this.synth.triggerRelease(note);
  }

  playVictory() {
    if (this.victoryPlayer && this.victoryPlayer.loaded) {
      this.victoryPlayer.start();
      // Ensure it only lasts for 2 seconds
      this.victoryPlayer.stop("+2");
    }
  }

  stopAll() {
    this.synth?.releaseAll();
    this.victoryPlayer?.stop();
  }
}

export const pianoEngine = new PianoEngine();

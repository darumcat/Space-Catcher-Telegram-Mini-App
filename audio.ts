
// Улучшенный звуковой движок
// Использует oscillator nodes для создания приятной аркадной музыки и звуков

class AudioManager {
  private ctx: AudioContext | null = null;
  private bgmInterval: number | null = null;
  private isMuted: boolean = false;
  private noteIndex: number = 0;

  constructor() {
    try {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
    } catch (e) {
      console.error('Web Audio API error');
    }
  }

  private init() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Общая функция для проигрывания тона
  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1, slideTo?: number) {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playGood() { // Зеленый шар (Coin sound)
    this.playTone(600, 'sine', 0.1, 0.1, 1200);
  }

  public playBad() { // Красный куб (Damage)
    this.playTone(150, 'sawtooth', 0.3, 0.2, 50);
  }

  public playBonus(type: 'gold' | 'blue' | 'yellow' | 'purple') {
    switch(type) {
        case 'gold': // Дзинь!
            this.playTone(1200, 'sine', 0.3, 0.1);
            setTimeout(() => this.playTone(1600, 'sine', 0.4, 0.1), 100);
            break;
        case 'blue': // Power up
            this.playTone(440, 'square', 0.1, 0.05);
            setTimeout(() => this.playTone(554, 'square', 0.1, 0.05), 100);
            setTimeout(() => this.playTone(659, 'square', 0.2, 0.05), 200);
            break;
        case 'yellow': // Slow down (warp)
            this.playTone(800, 'triangle', 0.5, 0.1, 200);
            break;
        case 'purple': // Shield (Low hum up)
            this.playTone(220, 'sine', 0.5, 0.1, 880);
            break;
    }
  }

  // Мелодичная фоновая музыка
  // Простая секвенция C Minor Pentatonic
  public startBgm() {
    if (!this.ctx || this.bgmInterval) return;
    this.init();

    const sequence = [
        261.63, 0, 311.13, 0, // C4, Eb4
        392.00, 0, 311.13, 0, // G4, Eb4
        261.63, 261.63, 466.16, 0, // C4, C4, Bb4
        392.00, 0, 523.25, 0  // G4, C5
    ];
    
    const bassSequence = [
        65.41, 65.41, 77.78, 77.78, // C2, Eb2
        98.00, 98.00, 77.78, 77.78  // G2, Eb2
    ];

    this.noteIndex = 0;
    const tempo = 250; // ms per step

    this.bgmInterval = window.setInterval(() => {
        if (this.isMuted || !this.ctx) return;

        // Melody
        const note = sequence[this.noteIndex % sequence.length];
        if (note > 0) {
            this.playTone(note, 'sine', 0.3, 0.05); // Soft sine
        }

        // Bass (каждый 2-й шаг)
        if (this.noteIndex % 2 === 0) {
            const bass = bassSequence[(this.noteIndex / 2) % bassSequence.length];
             this.playTone(bass, 'triangle', 0.4, 0.05);
        }

        this.noteIndex++;
    }, tempo);
  }

  public stopBgm() {
    if (this.bgmInterval) {
        clearInterval(this.bgmInterval);
        this.bgmInterval = null;
    }
  }
}

export const audioManager = new AudioManager();

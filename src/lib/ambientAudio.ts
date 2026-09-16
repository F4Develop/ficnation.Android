// FicNation Generative Ambient Sound Engine (Web Audio API)

export type SoundscapeType = "rain" | "fire" | "library" | "night" | "synthwave" | "ocean";

export interface SoundscapeInfo {
  id: SoundscapeType;
  name: string;
  icon: string;
  description: string;
  tag: string;
}

export const SOUNDSCAPES: SoundscapeInfo[] = [
  {
    id: "rain",
    name: "Lluvia Serena",
    icon: "🌧️",
    description: "Gotas suaves sobre el cristal con murmullo calmante.",
    tag: "Concentración",
  },
  {
    id: "fire",
    name: "Fuego & Chimenea",
    icon: "🔥",
    description: "Cálido crepitar de leña y brasas en una noche fría.",
    tag: "Calidez",
  },
  {
    id: "library",
    name: "Biblioteca Arcana",
    icon: "📚",
    description: "Dron ambiental etéreo de silencio y concentración.",
    tag: "Lectura Profunda",
  },
  {
    id: "night",
    name: "Noche Estrellada",
    icon: "🌌",
    description: "Brisa suave bajo el firmamento con grillos lejanos.",
    tag: "Relajación",
  },
  {
    id: "synthwave",
    name: "Synthwave Cósmico",
    icon: "🪐",
    description: "Acordes espaciales progresivos y atmósfera cyberpunk.",
    tag: "Inmersión",
  },
  {
    id: "ocean",
    name: "Océano Profundo",
    icon: "🌊",
    description: "Marea constante y olas rítmicas de calma infinita.",
    tag: "Paz Mental",
  },
];

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: { stop: () => void }[] = [];
  private currentTrack: SoundscapeType | null = null;
  private volume: number = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentTrack(): SoundscapeType | null {
    return this.currentTrack;
  }

  public isPlaying(): boolean {
    return this.currentTrack !== null;
  }

  public stop() {
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
      } catch {}
    });
    this.activeNodes = [];
    this.currentTrack = null;
  }

  public play(track: SoundscapeType) {
    this.initContext();
    this.stop();
    this.currentTrack = track;

    if (!this.ctx || !this.masterGain) return;

    switch (track) {
      case "rain":
        this.startRain();
        break;
      case "fire":
        this.startFire();
        break;
      case "library":
        this.startLibrary();
        break;
      case "night":
        this.startNight();
        break;
      case "synthwave":
        this.startSynthwave();
        break;
      case "ocean":
        this.startOcean();
        break;
    }
  }

  // 1. LLUVIA
  private startRain() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02; // Pink-brown noise
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1100;

    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.6;

    noise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.masterGain);
    noise.start();

    this.activeNodes.push({
      stop: () => {
        noise.stop();
        noise.disconnect();
      },
    });
  }

  // 2. FUEGO
  private startFire() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const crackle = Math.random() > 0.996 ? (Math.random() * 2 - 1) * 0.8 : (Math.random() * 2 - 1) * 0.08;
      data[i] = crackle;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 1.2;

    const fireGain = ctx.createGain();
    fireGain.gain.value = 0.8;

    source.connect(filter);
    filter.connect(fireGain);
    fireGain.connect(this.masterGain);
    source.start();

    this.activeNodes.push({
      stop: () => {
        source.stop();
        source.disconnect();
      },
    });
  }

  // 3. BIBLIOTECA
  private startLibrary() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const freqs = [65.41, 130.81, 196.0, 261.63]; // C chord drone
    const oscillators: OscillatorNode[] = [];

    const libGain = ctx.createGain();
    libGain.gain.value = 0.15;
    libGain.connect(this.masterGain);

    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      osc.connect(libGain);
      osc.start();
      oscillators.push(osc);
    });

    this.activeNodes.push({
      stop: () => {
        oscillators.forEach((o) => {
          o.stop();
          o.disconnect();
        });
      },
    });
  }

  // 4. NOCHE
  private startNight() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 4200;

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 4.5;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 800;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    const nightGain = ctx.createGain();
    nightGain.gain.value = 0.05;

    osc1.connect(nightGain);
    nightGain.connect(this.masterGain);

    osc1.start();
    lfo.start();

    this.activeNodes.push({
      stop: () => {
        osc1.stop();
        lfo.stop();
        osc1.disconnect();
        lfo.disconnect();
      },
    });
  }

  // 5. SYNTHWAVE
  private startSynthwave() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const freqs = [110, 164.81, 220, 277.18]; // A minor warm synth chord
    const oscs: OscillatorNode[] = [];

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 450;

    const synthGain = ctx.createGain();
    synthGain.gain.value = 0.18;

    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = f;
      osc.connect(filter);
      osc.start();
      oscs.push(osc);
    });

    filter.connect(synthGain);
    synthGain.connect(this.masterGain);

    this.activeNodes.push({
      stop: () => {
        oscs.forEach((o) => {
          o.stop();
          o.disconnect();
        });
      },
    });
  }

  // 6. OCÉANO
  private startOcean() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;

    // LFO para emular el flujo de olas (cada 6 segundos)
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.16;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 350;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const oceanGain = ctx.createGain();
    oceanGain.gain.value = 0.45;

    noise.connect(filter);
    filter.connect(oceanGain);
    oceanGain.connect(this.masterGain);

    noise.start();
    lfo.start();

    this.activeNodes.push({
      stop: () => {
        noise.stop();
        lfo.stop();
        noise.disconnect();
        lfo.disconnect();
      },
    });
  }
}

export const ambientEngine = typeof window !== "undefined" ? new AmbientEngine() : (null as any);

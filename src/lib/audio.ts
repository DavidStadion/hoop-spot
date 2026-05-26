// Synthesized football audio — no asset files needed.
// Uses Web Audio API; lazily initialised on first user gesture (browsers block autoplay).

class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private crowdNode: AudioBufferSourceNode | null = null;
  private crowdGain: GainNode | null = null;
  private crowdBuffer: AudioBuffer | null = null;
  private muted = false;

  /** Must be called from a user gesture (click/tap). */
  init() {
    if (this.ctx) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    this.crowdBuffer = this.buildCrowdBuffer();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) {
      this.master.gain.cancelScheduledValues(this.ctx!.currentTime);
      this.master.gain.linearRampToValueAtTime(m ? 0 : 1, this.ctx!.currentTime + 0.15);
    }
  }

  /** 4-second loop of pink-noise filtered to feel like crowd murmur. */
  private buildCrowdBuffer(): AudioBuffer {
    const ctx = this.ctx!;
    const duration = 4;
    const buf = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      // Pink-ish noise via simple averaging filter
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        last = 0.985 * last + 0.015 * white;
        // Slow amplitude wobble for crowd "swell"
        const wobble = 0.85 + 0.15 * Math.sin(i / ctx.sampleRate * 0.7 + ch);
        data[i] = last * 6 * wobble; // boost pink noise
      }
    }
    return buf;
  }

  // ─── Crowd ambient ────────────────────────────────────────────
  startCrowd(intensity = 0.18) {
    if (!this.ctx || !this.crowdBuffer || !this.master) return;
    this.stopCrowd();
    const src = this.ctx.createBufferSource();
    src.buffer = this.crowdBuffer;
    src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 850;
    lp.Q.value = 0.6;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 150;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    src.connect(hp).connect(lp).connect(gain).connect(this.master);
    src.start();
    gain.gain.linearRampToValueAtTime(intensity, this.ctx.currentTime + 1.2);
    this.crowdNode = src;
    this.crowdGain = gain;
  }

  /** Briefly raise crowd volume — used during build-up + huge after goal. */
  crowdSwell(target = 0.55, attack = 0.25, hold = 0.6, release = 1.4) {
    if (!this.ctx || !this.crowdGain) return;
    const now = this.ctx.currentTime;
    const baseline = 0.18;
    this.crowdGain.gain.cancelScheduledValues(now);
    this.crowdGain.gain.setValueAtTime(this.crowdGain.gain.value, now);
    this.crowdGain.gain.linearRampToValueAtTime(target, now + attack);
    this.crowdGain.gain.setValueAtTime(target, now + attack + hold);
    this.crowdGain.gain.linearRampToValueAtTime(baseline, now + attack + hold + release);
  }

  stopCrowd() {
    if (!this.ctx || !this.crowdNode || !this.crowdGain) return;
    const now = this.ctx.currentTime;
    this.crowdGain.gain.cancelScheduledValues(now);
    this.crowdGain.gain.linearRampToValueAtTime(0, now + 0.6);
    const src = this.crowdNode;
    setTimeout(() => { try { src.stop(); } catch { /* noop */ } }, 700);
    this.crowdNode = null;
    this.crowdGain = null;
  }

  // ─── Kick / pass ──────────────────────────────────────────────
  kick(intensity = 1) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    // Body: low oscillator with quick pitch drop
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.09);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.45 * intensity, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.14);

    // Click: tiny noise burst for the "thwack"
    const click = this.ctx.createBufferSource();
    const cBuf = this.ctx.createBuffer(1, 1024, this.ctx.sampleRate);
    const cData = cBuf.getChannelData(0);
    for (let i = 0; i < cData.length; i++) cData[i] = (Math.random() * 2 - 1) * Math.exp(-i / 200);
    click.buffer = cBuf;
    const cGain = this.ctx.createGain();
    cGain.gain.value = 0.18 * intensity;
    const cFilter = this.ctx.createBiquadFilter();
    cFilter.type = 'bandpass';
    cFilter.frequency.value = 1800;
    click.connect(cFilter).connect(cGain).connect(this.master);
    click.start(now);
  }

  // ─── Whistle ──────────────────────────────────────────────────
  whistle() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 2200;
    // Vibrato
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 8;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 35;
    lfo.connect(lfoGain).connect(osc.frequency);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.setValueAtTime(0.18, now + 0.32);
    gain.gain.linearRampToValueAtTime(0, now + 0.42);
    osc.connect(gain).connect(this.master);
    osc.start(now); lfo.start(now);
    osc.stop(now + 0.45); lfo.stop(now + 0.45);
  }

  // ─── Swish ────────────────────────────────────────────────────
  // Short noise burst, band-passed and fast-decaying — net through the rim.
  swish() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.35, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.9;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(5200, now);
    bp.frequency.exponentialRampToValueAtTime(2200, now + 0.32);
    bp.Q.value = 1.6;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.33);
    src.connect(bp).connect(gain).connect(this.master);
    src.start(now);
    src.stop(now + 0.36);
  }

  // ─── Pass — short hand-off click, gentler than a kick ─────────
  pass() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const cBuf = this.ctx.createBuffer(1, 512, this.ctx.sampleRate);
    const cData = cBuf.getChannelData(0);
    for (let i = 0; i < cData.length; i++) cData[i] = (Math.random() * 2 - 1) * Math.exp(-i / 90);
    const click = this.ctx.createBufferSource();
    click.buffer = cBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 0.8;
    const g = this.ctx.createGain();
    g.gain.value = 0.12;
    click.connect(f).connect(g).connect(this.master);
    click.start(now);
  }

  // ─── Dribble bounce — short low thud ──────────────────────────
  bounce() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(g).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  /** Alias for backward compat — calls the basket roar. */
  goalRoar() { this.basketRoar(); }

  // ─── Basket roar ──────────────────────────────────────────────
  basketRoar() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    // Cheer: white noise with rising lowpass sweep, long release
    const noise = this.ctx.createBufferSource();
    const nBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2.4, this.ctx.sampleRate);
    const nData = nBuf.getChannelData(0);
    for (let i = 0; i < nData.length; i++) nData[i] = (Math.random() * 2 - 1) * 0.6;
    noise.buffer = nBuf;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(400, now);
    lp.frequency.linearRampToValueAtTime(2400, now + 0.4);
    lp.frequency.linearRampToValueAtTime(1200, now + 2.2);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.42, now + 0.18);
    gain.gain.setValueAtTime(0.42, now + 0.8);
    gain.gain.linearRampToValueAtTime(0.0, now + 2.2);
    noise.connect(lp).connect(gain).connect(this.master);
    noise.start(now);
    noise.stop(now + 2.4);

    // Triumphant tone underneath
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 220;
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 330;
    const tg = this.ctx.createGain();
    tg.gain.setValueAtTime(0, now);
    tg.gain.linearRampToValueAtTime(0.12, now + 0.15);
    tg.gain.linearRampToValueAtTime(0, now + 1.2);
    const tlp = this.ctx.createBiquadFilter();
    tlp.type = 'lowpass';
    tlp.frequency.value = 1500;
    osc1.connect(tlp); osc2.connect(tlp);
    tlp.connect(tg).connect(this.master);
    osc1.start(now); osc2.start(now);
    osc1.stop(now + 1.3); osc2.stop(now + 1.3);

    // Big crowd swell
    this.crowdSwell(0.65, 0.2, 1.0, 1.6);
  }

  // ─── Correct / wrong answer pings ─────────────────────────────
  correctPing() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C E G
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const gain = this.ctx!.createGain();
      const t = now + i * 0.08;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.16, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain).connect(this.master!);
      osc.start(t);
      osc.stop(t + 0.42);
    });
  }

  wrongBuzz() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 180;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 600;
    osc.connect(lp).connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.55);
  }
}

export const audio = new Audio();

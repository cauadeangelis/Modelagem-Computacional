// Áudio 100% sintetizado com Web Audio (seção 13): música em 4 camadas e efeitos.
import { G } from '../jogo.js';
import { CONFIG } from '../configuracao.js';
import { mulberry32, hashString } from '../utilitarios/matematica.js';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const PHRYG = [0, 1, 3, 5, 7, 8, 10];
const PENTA = [0, 2, 4, 7, 9];
const PENTA_MIN = [0, 3, 5, 7, 10];
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// timbre da melodia, escala e clima por região (seção 13.1)
const SONGS = {
  // tabela 13.1 do Documento do Mundo: Base = Dó maior pentatônica; R0 = Fá maior; R1 = Lá menor pentatônica…
  base: { root: 60, chord: MAJOR, melScale: PENTA, timbre: 'flauta', prog: [0, 4, 5, 3], drums: 'leve' },
  r0: { root: 65, chord: MAJOR, melScale: MAJOR, timbre: 'violao', prog: [0, 3, 4, 0], drums: 'leve' },
  r1: { root: 57, chord: MINOR, melScale: PENTA_MIN, timbre: 'marimba', prog: [0, 5, 3, 6], drums: 'selva' },
  r2: { root: 62, chord: DORIAN, melScale: DORIAN, timbre: 'metal', prog: [0, 3, 0, 6], drums: 'engrenagem' },
  r3: { root: 55, chord: MAJOR, melScale: MAJOR, timbre: 'caliope', prog: [0, 3, 4, 4], drums: 'valsa' },
  r4: { root: 65, chord: MAJOR, melScale: MAJOR, timbre: 'ukulele', prog: [0, 5, 3, 4], drums: 'praia' },
  usina: { root: 52, chord: PHRYG, melScale: PHRYG, timbre: 'drone', prog: [0, 1, 0, 6], drums: 'usina' },
};

function degree(scale, root, d) {
  const n = scale.length;
  const o = Math.floor(d / n);
  return root + scale[((d % n) + n) % n] + 12 * o;
}

function genMelody(id, song) {
  const rnd = mulberry32(hashString(id) + 3);
  const notes = []; // 64 passos de semicolcheia
  let d = 7;
  const n = song.melScale.length;
  for (let s = 0; s < 64; s += 2) {
    const bar = Math.floor(s / 16);
    const strong = s % 8 === 0;
    if (rnd() < (strong ? 0.85 : 0.5)) {
      d += Math.floor(rnd() * 5) - 2;
      d = Math.max(n - 1, Math.min(n * 2 + 2, d));
      if (s === 62 || (bar === 3 && s >= 56)) d = n; // termina na tônica
      notes.push({ s, m: degree(song.melScale, song.root, d), len: strong && rnd() < 0.5 ? 4 : 2 });
    }
  }
  return notes;
}

export class Audio {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.region = null;
    this.tracks = {};
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = G.options.volume; this.master.connect(c.destination);
    this.musicBus = c.createGain(); this.musicBus.gain.value = G.options.music * 0.5; this.musicBus.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = 0.9; this.sfxBus.connect(this.master);
    // buffer de ruído branco
    const len = c.sampleRate * 1.5;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.ready = true;
    this.step = 0;
    this.nextTime = c.currentTime + 0.1;
    this.stepDur = 60 / CONFIG.music.bpm / 4;
    for (const id in SONGS) this.tracks[id] = { id, song: SONGS[id], mel: genMelody(id, SONGS[id]), gain: null, active: false };
    this.timer = setInterval(() => this.schedule(), 30);
  }
  unlock() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  setVolume(v) { G.options.volume = v; if (this.master) this.master.gain.value = v; }
  setMusic(v) { G.options.music = v; if (this.musicBus) this.musicBus.gain.value = v * 0.5; }

  // ---------- música ----------
  setRegion(id) {
    if (!this.ready || this.region === id) return;
    const c = this.ctx, now = c.currentTime, X = CONFIG.music.crossfade;
    // crossfade de 2 s: todas as outras faixas ativas (inclusive camadas da cinemática) saem
    for (const oid in this.tracks) {
      const old = this.tracks[oid];
      if (oid === id || !old.gain) continue;
      old.gain.gain.cancelScheduledValues(now);
      old.gain.gain.setValueAtTime(old.gain.gain.value, now);
      old.gain.gain.linearRampToValueAtTime(0, now + X);
      const g = old.gain;
      setTimeout(() => { if (this.region !== old.id && old.gain === g && !old.layer) { old.active = false; g.disconnect(); old.gain = null; } }, X * 1000 + 200);
      old.layer = false;
    }
    this.fadeTrack(id, 1, X);
    this.region = id;
  }
  // camada extra sem desligar as outras (panorâmica da cinemática, §15.1)
  addLayer(id, vol = 0.5, time = 1.2) {
    if (!this.ready || !this.tracks[id]) return;
    this.tracks[id].layer = true;
    this.fadeTrack(id, vol, time);
  }
  fadeTrack(id, vol, time) {
    const tr = this.tracks[id];
    if (!tr) return;
    const c = this.ctx, now = c.currentTime;
    if (!tr.gain) { tr.gain = c.createGain(); tr.gain.gain.value = 0; tr.gain.connect(this.musicBus); }
    tr.gain.gain.cancelScheduledValues(now);
    tr.gain.gain.setValueAtTime(tr.gain.gain.value, now);
    tr.gain.gain.linearRampToValueAtTime(vol, now + time);
    tr.active = true;
  }
  stopMusic() {
    if (!this.ready) return;
    for (const id in this.tracks) { const t = this.tracks[id]; if (t.gain) { t.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3); } }
    this.region = null;
    setTimeout(() => { for (const id in this.tracks) { const t = this.tracks[id]; if (this.region !== id) t.active = false; } }, 1200);
  }

  schedule() {
    if (!this.ready || this.ctx.state !== 'running') return;
    const c = this.ctx;
    while (this.nextTime < c.currentTime + 0.12) {
      if (!this.tactical) for (const id in this.tracks) { const tr = this.tracks[id]; if (tr.active && tr.gain) this.playStep(tr, this.step, this.nextTime); }
      if (this.tactical) this.tacticalMusic(this.step, this.nextTime);
      this.step = (this.step + 1) % 64;
      this.nextTime += this.stepDur;
    }
  }

  beginTactical() { this.tactical = { battery: 1, error: Infinity, tau: .01, integrity: 100, rho: 0 }; }
  endTactical() { this.tactical = null; this.stepDur = 60 / CONFIG.music.bpm / 4; }
  tacticalStep(trace, level, state) {
    this.tactical = { battery: state.battery / state.batteryMax, error: trace.err, tau: level.tau, integrity: state.integrity, rho: trace.rho };
    if (!this.ready || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime + .005, out = this.sfxBus;
    if (trace.flags.length) {
      this.tone(out, 120, t, .35, .12, 'sawtooth', { slide: 35, lp: 700 });
      this.noise(out, t, .2, .08, 'bandpass', 500); return;
    }
    if (level.kind === 'root' && Number.isFinite(state.fx)) this.tone(out, state.fx < 0 ? 220 : 440, t, .13, .06, 'sine');
    if (trace.rho < .1 && trace.p >= 2) { const octave = Math.min(8, Math.max(0, Math.floor(-Math.log10(Math.max(trace.err, 1e-16))))); [0, 4, 7].forEach((n, i) => this.tone(out, mtof(60 + 2 * octave + n), t + i * .07, .15, .07, 'triangle')); }
    else if (trace.rho > .8) this.tone(out, 440, t, .05, .06, 'square', { decay: true });
    else this.sfx('acerto');
    if (trace.formula.includes('↔')) { this.noise(out, t, .13, .08, 'highpass', 1500); this.sfx('toc'); }
    if (level.scenario === 'readings') this.sfx(state.rounding === 'truncate' ? 'vapor' : 'sino');
  }
  tacticalMusic(step, t) {
    const v = this.tactical, o = this.musicBus, sd = 60 / (v.integrity < 30 ? 130 : 90) / 4; this.stepDur = sd;
    if (step % 16 === 0) [48, 55, 60].forEach(m => this.padNote(o, mtof(m), t, sd * 16, .025, 'sine'));
    if (v.battery < .5 && step % 4 === 0) this.pluck(o, mtof(36 + (step % 8 ? 7 : 0)), t, sd * 2, .08, 'triangle');
    if (v.error < .01 && v.rho <= .8 && step % 4 === 0) this.kick(o, t, .1);
    if (v.error < 10 * v.tau && step % 2 === 0) this.pluck(o, mtof(72 + [0, 4, 7, 12][Math.floor(step / 2) % 4]), t, sd, .045, 'triangle');
  }

  playStep(tr, s, t) {
    const S = tr.song, out = tr.gain, sd = this.stepDur;
    const bar = Math.floor(s / 16), inBar = s % 16;
    const ch = S.prog[bar];
    // pad: acorde por compasso
    if (inBar === 0) {
      const notes = [0, 2, 4].map((k) => degree(S.chord, S.root - 12, ch + k));
      for (const m of notes) this.padNote(out, mtof(m), t, sd * 16, S.timbre === 'drone' ? 0.05 : 0.035, S.timbre === 'drone' ? 'sawtooth' : 'triangle');
    }
    // baixo
    const bassSteps = S.drums === 'valsa' ? [0, 6, 12] : S.drums === 'selva' ? [0, 6, 8, 14] : [0, 8];
    if (bassSteps.includes(inBar)) this.tone(out, mtof(degree(S.chord, S.root - 24, ch + (inBar === 8 && S.drums !== 'usina' ? 4 : 0))), t, sd * 3, 0.16, S.timbre === 'metal' ? 'square' : 'triangle', { lp: 500 });
    // melodia
    for (const n of tr.mel) if (n.s === s) this.instrument(S.timbre, out, mtof(n.m), t, sd * n.len);
    // percussão
    this.drums(S.drums, out, inBar, t, s);
  }

  instrument(name, out, f, t, dur) {
    switch (name) {
      case 'flauta': this.tone(out, f, t, dur * 1.1, 0.09, 'sine', { vib: 5, attack: 0.04 }); break;
      case 'violao': this.pluck(out, f, t, 0.5, 0.12, 'triangle'); break;
      case 'marimba': this.pluck(out, f, t, 0.35, 0.13, 'sine'); this.pluck(out, f * 4, t, 0.1, 0.03, 'sine'); break;
      case 'metal': this.tone(out, f, t, dur, 0.06, 'square', { lp: 1300, attack: 0.005, decay: true }); break;
      case 'caliope': this.tone(out, f, t, dur, 0.06, 'sawtooth', { vib: 6, lp: 2400, attack: 0.02 }); break;
      case 'ukulele': this.pluck(out, f, t, 0.32, 0.12, 'triangle'); break;
      case 'drone': if (Math.random() < 0.6) this.tone(out, f / 2, t, dur * 2, 0.05, 'sawtooth', { lp: 600, vib: 2 }); break;
    }
  }

  drums(kind, out, s, t, step) {
    if (kind === 'leve') { if (s % 4 === 2) this.noise(out, t, 0.04, 0.025, 'highpass', 6000); if (s === 0) this.kick(out, t, 0.12); }
    else if (kind === 'selva') {
      if (s === 0 || s === 8 || s === 11) this.kick(out, t, 0.2);
      if (s === 4 || s === 12) this.noise(out, t, 0.08, 0.08, 'bandpass', 1800);
      if (s % 2 === 1) this.noise(out, t, 0.03, 0.03, 'highpass', 7000);
      if (s === 14) this.tone(out, 180, t, 0.12, 0.08, 'sine', { slide: 110 });
    } else if (kind === 'engrenagem') {
      if (s % 4 === 0) this.kick(out, t, 0.18);
      if (s % 2 === 1) this.tone(out, 1800, t, 0.02, 0.03, 'square');
      if (s === 6 || s === 14) this.noise(out, t, 0.06, 0.06, 'bandpass', 3000);
    } else if (kind === 'valsa') {
      if (s === 0) this.kick(out, t, 0.18);
      if (s === 6 || s === 12) this.noise(out, t, 0.05, 0.05, 'bandpass', 2500);
    } else if (kind === 'praia') {
      if (s === 0 || s === 10) this.kick(out, t, 0.14);
      if (s % 4 === 2) this.noise(out, t, 0.06, 0.03, 'highpass', 5000);
      if (step === 0) this.noise(out, t, 3.5, 0.03, 'lowpass', 600, true); // ondas
    } else if (kind === 'usina') {
      if (s % 4 === 0) this.kick(out, t, 0.25);
      if (s === 8) this.noise(out, t, 0.1, 0.08, 'bandpass', 900);
      if (step % 32 === 0) { this.tone(out, 660, t, 0.25, 0.03, 'square'); this.tone(out, 520, t + 0.3, 0.25, 0.03, 'square'); }
    }
  }

  // ---------- primitivas ----------
  tone(out, f, t, dur, vol, type = 'sine', o = {}) {
    if (!this.ready) return;
    const c = this.ctx;
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
    const g = c.createGain();
    const a = o.attack ?? 0.01;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    if (o.decay) g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    else { g.gain.setValueAtTime(vol, t + Math.max(a, dur * 0.7)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08); }
    let node = osc;
    if (o.vib) {
      const lfo = c.createOscillator(); lfo.frequency.value = o.vib;
      const lg = c.createGain(); lg.gain.value = f * 0.012;
      lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t); lfo.stop(t + dur + 0.1);
    }
    if (o.lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; node.connect(fl); node = fl; }
    node.connect(g); g.connect(out);
    osc.start(t); osc.stop(t + dur + 0.12);
  }
  pluck(out, f, t, dur, vol, type) { this.tone(out, f, t, dur, vol, type, { attack: 0.004, decay: true }); }
  padNote(out, f, t, dur, vol, type) {
    for (const det of [-6, 6]) {
      const c = this.ctx;
      const osc = c.createOscillator(); osc.type = type; osc.frequency.value = f; osc.detune.value = det;
      const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 900;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.4); g.gain.setValueAtTime(vol, t + dur - 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      osc.connect(fl); fl.connect(g); g.connect(out); osc.start(t); osc.stop(t + dur + 0.05);
    }
  }
  noise(out, t, dur, vol, ftype = 'bandpass', freq = 2000, swell = false) {
    if (!this.ready) return;
    const c = this.ctx;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    if (dur > 1.4) src.loop = true;
    const fl = c.createBiquadFilter(); fl.type = ftype; fl.frequency.value = freq; fl.Q.value = ftype === 'bandpass' ? 1.2 : 0.7;
    const g = c.createGain();
    if (swell) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.5); g.gain.linearRampToValueAtTime(0.0001, t + dur); }
    else { g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    src.connect(fl); fl.connect(g); g.connect(out);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }
  kick(out, t, vol) { this.tone(out, 140, t, 0.16, vol, 'sine', { slide: 45, attack: 0.002, decay: true }); }

  // ---------- efeitos ----------
  sfx(name, opt = {}) {
    if (!this.ready || this.ctx.state !== 'running') return;
    const o = this.sfxBus, t = this.ctx.currentTime + 0.005;
    const N = (f) => mtof(f);
    switch (name) {
      case 'passo_grama': this.noise(o, t, 0.06, 0.05, 'bandpass', 2000); break;
      case 'passo_areia': this.noise(o, t, 0.09, 0.05, 'lowpass', 1000); break;
      case 'passo_madeira': this.tone(o, 220, t, 0.04, 0.09, 'square', { decay: true, lp: 900 }); break;
      case 'passo_pedra': this.tone(o, 800, t, 0.03, 0.05, 'triangle', { decay: true }); break;
      case 'pulo': this.tone(o, 300, t, 0.12, 0.12, 'triangle', { slide: 600 }); break;
      case 'aterrissa': this.tone(o, 120, t, 0.08, 0.2, 'sine', { decay: true, slide: 70 }); break;
      case 'ping': this.tone(o, 880, t, 0.15, 0.1, 'sine', { decay: true }); break;
      case 'semente': [72, 76, 79].forEach((m, i) => this.tone(o, N(m + 12), t + i * 0.07, 0.12, 0.09, 'triangle', { decay: true })); break;
      case 'dica': this.tone(o, 1046, t, 0.5, 0.08, 'sine', { decay: true }); this.tone(o, 1318, t + 0.18, 0.6, 0.08, 'sine', { decay: true }); break;
      case 'porta': this.tone(o, 150, t, 0.45, 0.08, 'sawtooth', { slide: 90, lp: 700 }); break;
      case 'bandeira': [67, 72, 76, 79].forEach((m, i) => this.tone(o, N(m), t + i * 0.13, i === 3 ? 0.5 : 0.12, 0.1, 'square', { lp: 2500 })); break;
      case 'derrota': [55, 54, 53].forEach((m, i) => this.tone(o, N(m), t + i * 0.32, i === 2 ? 0.7 : 0.28, 0.1, 'sawtooth', { lp: 900, vib: i === 2 ? 6 : 0 })); break;
      case 'splash': this.noise(o, t, 0.3, 0.12, 'highpass', 800); break;
      case 'piu': this.tone(o, 2200, t, 0.08, 0.05, 'sine', { slide: 3200 }); this.tone(o, 2400, t + 0.12, 0.08, 0.05, 'sine', { slide: 3400 }); break;
      case 'pop': this.tone(o, 400, t, 0.07, 0.12, 'sine', { slide: 900 }); break;
      case 'toc': this.tone(o, 900, t, 0.05, 0.15, 'square', { decay: true, lp: 1800 }); this.tone(o, 1400, t + 0.06, 0.05, 0.08, 'square', { decay: true, lp: 2500 }); break;
      case 'sino': this.tone(o, 660, t, 1.4, 0.12, 'sine', { decay: true }); this.tone(o, 1320, t, 0.9, 0.05, 'sine', { decay: true }); this.tone(o, 1980, t, 0.5, 0.03, 'sine', { decay: true }); break;
      case 'badalada': for (let i = 0; i < 3; i++) { this.tone(o, 330, t + i * 0.7, 1.2, 0.1, 'sine', { decay: true }); this.tone(o, 660, t + i * 0.7, 0.8, 0.04, 'sine', { decay: true }); } break;
      case 'plof': this.noise(o, t, 0.12, 0.12, 'lowpass', 500); this.tone(o, 150, t, 0.12, 0.12, 'sine', { slide: 80, decay: true }); break;
      case 'miau': this.tone(o, 620, t, 0.14, 0.07, 'triangle', { slide: 980 }); this.tone(o, 980, t + 0.13, 0.32, 0.06, 'triangle', { slide: 560, decay: true, vib: 7 }); break;
      case 'arroto': this.tone(o, 95, t, 0.35, 0.12, 'sawtooth', { slide: 60, lp: 500 }); break;
      case 'nevoa': this.noise(o, t, 2.5, 0.12, 'lowpass', 700, true); [60, 64, 67, 72].forEach((m, i) => this.tone(o, N(m + 12), t + 0.5 + i * 0.2, 0.6, 0.05, 'sine', { decay: true })); break;
      case 'gritinhos': for (let i = 0; i < 4; i++) this.tone(o, 900 + Math.random() * 500, t + i * 0.15, 0.25, 0.03, 'sine', { slide: 1500 + Math.random() * 600 }); break;
      case 'acerto': this.tone(o, N(76), t, 0.1, 0.1, 'triangle', { decay: true }); this.tone(o, N(83), t + 0.08, 0.2, 0.1, 'triangle', { decay: true }); break;
      case 'erro': this.tone(o, 180, t, 0.18, 0.1, 'square', { lp: 800 }); this.tone(o, 140, t + 0.16, 0.25, 0.1, 'square', { lp: 800 }); break;
      case 'explosao': this.noise(o, t, 1.4, 0.35, 'lowpass', 400); this.tone(o, 80, t, 1.0, 0.3, 'sine', { slide: 30, decay: true }); break;
      case 'vitoria': [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => this.tone(o, N(m), t + i * 0.08, 0.3, 0.08, 'square', { decay: true, lp: 3000 })); break;
      case 'vento': this.noise(o, t, 1.2, 0.08, 'bandpass', 900, true); break;
      case 'vapor': this.noise(o, t, 0.8, 0.1, 'highpass', 2500, true); break;
      case 'mola': this.tone(o, 200, t, 0.3, 0.1, 'triangle', { slide: 800 }); break;
      case 'tick': this.tone(o, 1500, t, 0.02, 0.05, 'square', { decay: true }); break;
      case 'blip': this.tone(o, opt.f || 600, t, 0.012, 0.05, opt.w || 'square'); break;
    }
  }

  blip(pitch, wave) {
    if (!this.ready) return;
    this.tone(this.sfxBus, pitch * (0.9 + Math.random() * 0.25), this.ctx.currentTime + 0.002, 0.012, 0.045, wave || 'square');
  }
  // voz de balão: blips curtos (12 ms por caractere, até ~14)
  voice(text, pitch = 500, wave = 'square', max = 14) {
    if (!this.ready || this.ctx.state !== 'running') return;
    const n = Math.min(max, Math.ceil(String(text).length / 3));
    const t0 = this.ctx.currentTime + 0.01;
    for (let i = 0; i < n; i++) this.tone(this.sfxBus, pitch * (0.85 + Math.random() * 0.35), t0 + i * 0.055, 0.012, 0.04, wave);
  }
}

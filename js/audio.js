/* Mil Vidas — som no estilo 16 bits.
 * Sintetizador próprio em WebAudio (ondas de pulso, triângulo e ruído + eco),
 * efeitos sonoros e músicas compostas na hora: cada vida tem temas próprios
 * para infância, juventude, vida adulta e velhice.
 */
(function () {
  'use strict';
  const G = globalThis.G;
  const Snd = (G.sound = {});
  const PREF = 'milvidas_som_v1';
  const pref = { music: true, sfx: true };
  try { Object.assign(pref, JSON.parse(localStorage.getItem(PREF) || '{}')); } catch (e) { /* ignora */ }
  Snd.pref = pref;
  const savePref = () => { try { localStorage.setItem(PREF, JSON.stringify(pref)); } catch (e) { /* ignora */ } };

  let ac = null, master, musicBus, sfxBus, waves = {}, noiseBuf;
  const MUS_VOL = 0.2, SFX_VOL = 0.32;

  function pulse(duty) {
    const n = 48, re = new Float32Array(n), im = new Float32Array(n);
    for (let i = 1; i < n; i++) re[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
    return ac.createPeriodicWave(re, im);
  }

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return true; }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.7;
    const comp = ac.createDynamicsCompressor();
    master.connect(comp); comp.connect(ac.destination);
    // eco (marca registrada do som dos 16 bits)
    const delay = ac.createDelay(1); delay.delayTime.value = 0.21;
    const fb = ac.createGain(); fb.gain.value = 0.3;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1700;
    delay.connect(lp); lp.connect(fb); fb.connect(delay);
    const wet = ac.createGain(); wet.gain.value = 0.38; lp.connect(wet); wet.connect(master);
    const warm = ac.createBiquadFilter(); warm.type = 'lowpass'; warm.frequency.value = 5000;
    musicBus = ac.createGain(); musicBus.gain.value = pref.music ? MUS_VOL : 0;
    sfxBus = ac.createGain(); sfxBus.gain.value = pref.sfx ? SFX_VOL : 0;
    musicBus.connect(warm); sfxBus.connect(warm); warm.connect(master); warm.connect(delay);
    waves = { p25: pulse(0.25), p12: pulse(0.125), p50: pulse(0.5) };
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    document.addEventListener('visibilitychange', () => { if (!ac) return; document.hidden ? ac.suspend() : ac.resume(); });
    return true;
  }

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function tone(bus, freq, t, dur, o) {
    o = o || {};
    const osc = ac.createOscillator();
    const w = o.w || 'p25';
    if (waves[w]) osc.setPeriodicWave(waves[w]); else osc.type = w;
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    if (o.vib && dur > 0.25) {
      const lfo = ac.createOscillator(), lg = ac.createGain();
      lfo.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(freq * 0.012, t + 0.25);
      lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t); lfo.stop(t + dur + 0.3);
    }
    const g = ac.createGain();
    const v = o.v == null ? 0.2 : o.v, a = o.a || 0.005, rel = o.r == null ? 0.06 : o.r;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.setValueAtTime(v * (o.sus == null ? 0.8 : o.sus), t + Math.max(a, dur - 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel);
    osc.connect(g); g.connect(bus);
    osc.start(t); osc.stop(t + dur + rel + 0.02);
  }

  function noise(bus, t, dur, o) {
    o = o || {};
    const src = ac.createBufferSource(); src.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = o.type || 'highpass'; f.frequency.setValueAtTime(o.f || 6000, t);
    if (o.fTo) f.frequency.exponentialRampToValueAtTime(o.fTo, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(o.v == null ? 0.2 : o.v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  function kick(bus, t, v) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(v || 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.18);
  }

  /* ---------------- efeitos sonoros ---------------- */
  const seq = (notes, step, o) => { const t0 = ac.currentTime + 0.01; notes.forEach((n, i) => n != null && tone(sfxBus, mtof(n), t0 + i * step, (o && o.dur) || step, o)); };
  const SFX = {
    blip: () => tone(sfxBus, 1250 + Math.random() * 80, ac.currentTime, 0.018, { w: 'p12', v: 0.035, r: 0.01 }),
    select: () => tone(sfxBus, 880, ac.currentTime, 0.035, { w: 'p25', v: 0.12, r: 0.02 }),
    confirm: () => seq([76, 83], 0.05, { w: 'p25', v: 0.14 }),
    ok: () => seq([72, 76, 79, 84], 0.055, { w: 'p25', v: 0.16 }),
    fail: () => { seq([67, 63, 58], 0.09, { w: 'p25', v: 0.15 }); },
    coin: () => { const t = ac.currentTime; tone(sfxBus, mtof(83), t, 0.05, { w: 'p50', v: 0.13 }); tone(sfxBus, mtof(88), t + 0.05, 0.22, { w: 'p50', v: 0.13, r: 0.15 }); },
    item: () => seq([79, 84, 88, 91, 96], 0.04, { w: 'triangle', v: 0.25, r: 0.12 }),
    title: () => {
      const t = ac.currentTime + 0.01;
      [[67, 0, 0.09], [67, 0.1, 0.09], [67, 0.2, 0.09], [72, 0.3, 0.45]].forEach(([n, s, d]) => { tone(sfxBus, mtof(n), t + s, d, { w: 'p25', v: 0.16, vib: true }); tone(sfxBus, mtof(n - 12), t + s, d, { w: 'triangle', v: 0.25 }); });
      tone(sfxBus, mtof(76), t + 0.3, 0.45, { w: 'p12', v: 0.08 });
    },
    hurt: () => { const t = ac.currentTime; noise(sfxBus, t, 0.14, { f: 900, type: 'lowpass', v: 0.35 }); tone(sfxBus, 320, t, 0.14, { w: 'p50', v: 0.14, slide: 70 }); },
    heal: () => seq([72, 79, 84], 0.07, { w: 'triangle', v: 0.25, r: 0.15 }),
    travel: () => noise(sfxBus, ac.currentTime, 0.5, { type: 'bandpass', f: 300, fTo: 2400, v: 0.25 }),
    birth: () => seq([84, 88, 91, 96, 91, 96], 0.09, { w: 'triangle', v: 0.25, r: 0.3 }),
    death: () => seq([69, 67, 64, 60, null, 57], 0.32, { w: 'triangle', v: 0.3, r: 0.4, dur: 0.3 }),
    stat: () => seq([76, 83], 0.05, { w: 'p12', v: 0.1 }),
    page: () => noise(sfxBus, ac.currentTime, 0.06, { f: 3000, v: 0.12 }),
    slash: () => { const t = ac.currentTime; noise(sfxBus, t, 0.12, { type: 'bandpass', f: 2500, fTo: 600, v: 0.3 }); },
    hit: () => { const t = ac.currentTime; noise(sfxBus, t, 0.1, { f: 400, type: 'lowpass', v: 0.4 }); tone(sfxBus, 180, t, 0.08, { w: 'p50', v: 0.15, slide: 60 }); },
    miss: () => noise(sfxBus, ac.currentTime, 0.15, { type: 'bandpass', f: 1200, fTo: 3500, v: 0.12 }),
    warn: () => seq([62, 61, 62, 61], 0.09, { w: 'p25', v: 0.14 }),
    victory: () => seq([67, 72, 76, 79, null, 76, 79, 84], 0.09, { w: 'p25', v: 0.16, r: 0.12 }),
  };
  Snd.play = function (name) {
    if (!pref.sfx || !init() || !SFX[name]) return;
    try { SFX[name](); } catch (e) { /* ignora */ }
  };

  /* ---------------- música procedural ---------------- */
  const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], mixo: [0, 2, 4, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11] };
  const MOODS = {
    menu: { scale: 'lydian', bpm: 84, drums: 0, lead: 'triangle', arp: 'p12', prog: [[0, 3, 4, 0], [0, 5, 3, 4], [0, 1, 4, 0]] },
    inf: { scale: 'major', bpm: 112, drums: 1, lead: 'p25', arp: 'p12', prog: [[0, 3, 4, 0], [0, 5, 3, 4], [0, 4, 5, 3]] },
    jov: { scale: 'mixo', bpm: 132, drums: 2, lead: 'p25', arp: 'p12', prog: [[0, 6, 3, 0], [0, 3, 6, 4], [0, 6, 5, 6]] },
    adu: { scale: 'dorian', bpm: 118, drums: 2, lead: 'p50', arp: 'p12', prog: [[0, 3, 0, 4], [0, 6, 5, 4], [0, 2, 3, 4]] },
    vel: { scale: 'minor', bpm: 78, drums: 0, lead: 'triangle', arp: 'p12', prog: [[0, 5, 3, 4], [0, 3, 6, 2], [0, 5, 6, 4]] },
    morte: { scale: 'minor', bpm: 62, drums: 0, lead: 'triangle', arp: null, prog: [[0, 5, 6, 4], [0, 3, 4, 0]] },
    luta: { scale: 'minor', bpm: 152, drums: 2, lead: 'p25', arp: 'p12', prog: [[0, 5, 6, 4], [0, 6, 5, 4], [0, 3, 5, 4]] },
  };
  const RHYTHMS = [
    [1, 2, 0, 0, 1, 0, 1, 0, 1, 2, 2, 2, 0, 0, 1, 0],
    [1, 2, 2, 2, 1, 2, 1, 2, 1, 2, 2, 2, 2, 2, 0, 0],
    [1, 0, 1, 0, 1, 2, 1, 0, 1, 2, 2, 0, 1, 0, 1, 0],
    [1, 2, 2, 0, 1, 2, 2, 0, 1, 2, 1, 2, 1, 2, 2, 2],
    [0, 0, 1, 2, 1, 2, 1, 0, 1, 2, 2, 2, 1, 2, 2, 0],
    [1, 2, 2, 2, 2, 2, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2],
  ];
  function compose(moodId, seed) {
    const m = MOODS[moodId] || MOODS.menu;
    const r = G.art ? G.art.rng(seed) : Math.random;
    const ri = (n) => Math.floor(r() * n);
    const sc = SCALES[m.scale];
    const root = 45 + ri(8);
    const note = (deg, oct) => root + 12 * (oct + Math.floor(deg / 7)) + sc[((deg % 7) + 7) % 7];
    const prog = m.prog[ri(m.prog.length)];
    const bars = 8, steps = bars * 16;
    const ev = Array.from({ length: steps }, () => []);
    // melodia em forma A A'
    let deg = 7 + prog[0];
    const melA = [];
    for (let bar = 0; bar < 4; bar++) {
      const ch = prog[bar];
      const rh = RHYTHMS[ri(RHYTHMS.length)];
      const notes = [];
      for (let i = 0; i < 16; i++) {
        if (rh[i] !== 1) continue;
        let len = 1; while (i + len < 16 && rh[i + len] === 2) len++;
        if (i % 8 === 0) { const tones = [ch, ch + 2, ch + 4, ch + 7].map((x) => x + 7); deg = tones.reduce((a, b) => (Math.abs(b - deg) < Math.abs(a - deg) ? b : a)); }
        else deg += [-2, -1, -1, 1, 1, 2][ri(6)];
        deg = Math.max(5, Math.min(16, deg));
        notes.push([i, len, deg]);
      }
      melA.push(notes);
    }
    for (let bar = 0; bar < bars; bar++) {
      const ch = prog[bar % 4];
      const base = bar * 16;
      let notes = melA[bar % 4];
      if (bar === bars - 1) notes = [[0, 4, notes[0] ? notes[0][2] : 7], [4, 4, 9], [8, 8, 7]];
      else if (bar >= 4 && r() < 0.5) notes = notes.map(([i, l, d]) => [i, l, i % 8 === 0 ? d : d + (r() < 0.5 ? 1 : -1)]);
      for (const [i, len, d] of notes) ev[base + i].push({ k: 'lead', m: note(d, 1), len });
      // baixo
      const bpat = m.drums === 2 ? [[0, 3, 0], [4, 2, 0], [6, 2, 4], [8, 3, 0], [12, 2, 4], [14, 2, 7]] : m.drums === 1 ? [[0, 6, 0], [8, 4, 4], [12, 4, 0]] : [[0, 16, 0]];
      for (const [i, len, off] of bpat) ev[base + i].push({ k: 'bass', m: note(ch + off, -1), len });
      // arpejo
      if (m.arp) for (let i = 0; i < 16; i += 2) ev[base + i].push({ k: 'arp', m: note(ch + [0, 2, 4, 7][(i / 2) % 4], 0), len: 1 });
      // bateria
      if (m.drums) {
        ev[base].push({ k: 'kick' }); ev[base + 8].push({ k: 'kick' });
        if (m.drums === 2) { ev[base + 4].push({ k: 'snare' }); ev[base + 12].push({ k: 'snare' }); if (bar % 4 === 3) ev[base + 14].push({ k: 'snare' }); }
        for (let i = 0; i < 16; i += m.drums === 2 ? 2 : 4) ev[base + i].push({ k: 'hat' });
      }
    }
    return { m, ev, steps, sixteenth: 60 / m.bpm / 4 };
  }

  let song = null, songKey = null, step = 0, nextT = 0, timer = null, wanted = null;
  function schedule() {
    if (!song || !ac) return;
    while (nextT < ac.currentTime + 0.15) {
      const sx = song.sixteenth, m = song.m;
      for (const e of song.ev[step]) {
        if (e.k === 'lead') tone(musicBus, mtof(e.m), nextT, e.len * sx * 0.95, { w: m.lead, v: m.lead === 'triangle' ? 0.32 : 0.13, vib: true, r: 0.08 });
        else if (e.k === 'bass') tone(musicBus, mtof(e.m), nextT, e.len * sx * 0.9, { w: 'triangle', v: 0.34, r: 0.04 });
        else if (e.k === 'arp') tone(musicBus, mtof(e.m + 12), nextT, sx * 0.8, { w: m.arp, v: 0.035, r: 0.02 });
        else if (e.k === 'kick') kick(musicBus, nextT, 0.45);
        else if (e.k === 'snare') noise(musicBus, nextT, 0.12, { f: 1800, v: 0.22 });
        else if (e.k === 'hat') noise(musicBus, nextT, 0.03, { f: 8000, v: 0.08 });
      }
      nextT += sx;
      step = (step + 1) % song.steps;
    }
  }
  function startWanted() {
    if (!wanted || !pref.music || !init()) return;
    const key = wanted.mood + ':' + wanted.seed;
    if (key === songKey) return;
    songKey = key;
    song = compose(wanted.mood, wanted.seed);
    step = 0; nextT = ac.currentTime + 0.08;
    musicBus.gain.cancelScheduledValues(ac.currentTime);
    musicBus.gain.setValueAtTime(0, ac.currentTime); musicBus.gain.linearRampToValueAtTime(MUS_VOL, ac.currentTime + 0.6);
    if (!timer) timer = setInterval(schedule, 30);
  }
  Snd.music = function (mood, seed) { wanted = { mood, seed: seed >>> 0 }; if (ac) startWanted(); };
  Snd.stopMusic = function () { wanted = null; song = null; songKey = null; };

  Snd.toggleMusic = function () {
    pref.music = !pref.music; savePref();
    if (ac) musicBus.gain.setValueAtTime(pref.music ? MUS_VOL : 0, ac.currentTime);
    if (pref.music) { songKey = null; startWanted(); }
    return pref.music;
  };
  Snd.toggleSfx = function () {
    pref.sfx = !pref.sfx; savePref();
    if (ac) sfxBus.gain.setValueAtTime(pref.sfx ? SFX_VOL : 0, ac.currentTime);
    return pref.sfx;
  };

  // navegadores só liberam áudio depois de um toque do jogador
  const unlock = () => { if (init()) startWanted(); };
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);
})();

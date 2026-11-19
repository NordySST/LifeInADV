/* Mil Vidas — motor do jogo
 * Responsável por: estado do personagem, sorteio de eventos, aplicação de efeitos,
 * memória entre partidas (para evitar repetição) e texto com variáveis.
 */
(function () {
  'use strict';
  const G = (globalThis.G = {});

  G.events = {};   // id -> evento
  G.list = [];     // todos os eventos escritos à mão
  G.gens = [];     // geradores procedurais

  G.add = function (arr) {
    for (const e of arr) {
      if (G.events[e.id]) throw new Error('Evento duplicado: ' + e.id);
      G.events[e.id] = e;
      G.list.push(e);
    }
  };
  G.addGen = function (g) { G.gens.push(g); };

  /* ---------------- Aleatoriedade ---------------- */
  G.rand = Math.random;
  G.seed = function (n) {
    let a = n >>> 0;
    G.rand = function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const R = (G.R = {
    f: () => G.rand(),
    int: (a, b) => a + Math.floor(G.rand() * (b - a + 1)),
    pick: (a) => a[Math.floor(G.rand() * a.length)],
    idx: (a) => Math.floor(G.rand() * a.length),
    chance: (p) => G.rand() < p,
    wpick(items, wf) {
      let tot = 0;
      const ws = items.map((i) => { const w = Math.max(0, wf ? wf(i) : (i.w == null ? 10 : i.w)); tot += w; return w; });
      if (tot <= 0) return null;
      let r = G.rand() * tot;
      for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
      return items[items.length - 1];
    },
    sample(a, n) {
      const c = a.slice();
      for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(G.rand() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
      return c.slice(0, n);
    },
  });

  /* ---------------- Constantes ---------------- */
  G.STATS = { for: 'Força', agi: 'Agilidade', int: 'Intelecto', car: 'Carisma', sor: 'Sorte' };
  G.STAGES = [
    { id: 'inf', nome: 'Infância', ate: 12 },
    { id: 'jov', nome: 'Juventude', ate: 19 },
    { id: 'adu', nome: 'Vida adulta', ate: 49 },
    { id: 'vel', nome: 'Velhice', ate: 999 },
  ];
  G.JOBS = {
    mago: 'Mago', soldado: 'Soldado', ladrao: 'Ladrão', mercador: 'Mercador',
    sacerdote: 'Sacerdote', bardo: 'Bardo', fazendeiro: 'Fazendeiro', aventureiro: 'Aventureiro',
  };
  G.stage = (s) => G.STAGES.find((x) => s.age <= x.ate).id;
  G.stageName = (s) => G.STAGES.find((x) => s.age <= x.ate).nome;
  G.stat = (s, k) => s.st[k] + s.items.reduce((a, i) => a + (i.s === k ? i.b : 0), 0);
  G.region = (s) => s.world.regions[s.reg];

  /* ---------------- Meta (memória entre vidas) ---------------- */
  const META_KEY = 'milvidas_meta_v1';
  const SAVE_KEY = 'milvidas_save_v1';
  const store = (() => { try { return globalThis.localStorage || null; } catch (e) { return null; } })();
  function blankMeta() { return { seen: {}, proc: {}, runs: 0, best: null, titles: {}, causes: {} }; }
  G.meta = blankMeta();
  try { if (store) G.meta = Object.assign(blankMeta(), JSON.parse(store.getItem(META_KEY) || '{}')); } catch (e) { /* ignora */ }
  G.saveMeta = () => { try { store && store.setItem(META_KEY, JSON.stringify(G.meta)); } catch (e) { /* ignora */ } };
  G.resetMeta = () => { G.meta = blankMeta(); G.saveMeta(); };
  G.saveGame = (s) => { try { store && (s && s.alive ? store.setItem(SAVE_KEY, JSON.stringify(s)) : store.removeItem(SAVE_KEY)); } catch (e) { /* ignora */ } };
  G.loadGame = () => { try { const t = store && store.getItem(SAVE_KEY); return t ? JSON.parse(t) : null; } catch (e) { return null; } };

  /* ---------------- Criação de personagem ---------------- */
  G.newLife = function () {
    const world = G.gen.world();
    const sexo = R.pick(['m', 'f']);
    const s = {
      v: 1, name: G.gen.first(sexo), sexo, sur: G.gen.surname(),
      age: 0, turn: 0, hp: 10, maxHp: 10, gold: 0,
      st: { for: 2, agi: 2, int: 2, car: 2, sor: 2 },
      f: {}, items: [], job: null, titles: [], log: [], seen: {}, last: {}, queue: [],
      world, reg: 0, lifespan: R.int(58, 92), alive: true, cause: null, procCount: 0,
      ppl: {
        pai: G.gen.first('m'), mae: G.gen.first('f'),
        amigo: G.gen.first(R.pick(['m', 'f'])), rival: G.gen.first(R.pick(['m', 'f'])),
        mentor: G.gen.first(R.pick(['m', 'f'])) + ' ' + G.gen.surname(),
        irmao: G.gen.first(R.pick(['m', 'f'])),
      },
    };
    const o = R.pick(G.ORIGINS);
    s.origin = o.id; s.originName = o.nome; s.f['o_' + o.id] = true;
    for (const k in o.fx) s.st[k] = Math.max(0, s.st[k] + o.fx[k]);
    s.gold = o.gold || 0;
    const traits = [];
    for (const t of R.sample(G.TRAITS, G.TRAITS.length)) {
      if (traits.length >= 2) break;
      if (traits.some((x) => (t.nao || []).includes(x.id) || (x.nao || []).includes(t.id))) continue;
      traits.push(t);
    }
    s.traits = traits.map((t) => t.id);
    for (const t of traits) {
      s.f['t_' + t.id] = true;
      for (const k in t.fx || {}) {
        if (k === 'maxHp') { s.maxHp += t.fx[k]; s.hp = s.maxHp; }
        else if (k === 'gold') s.gold += t.fx[k];
        else s.st[k] = Math.max(0, s.st[k] + t.fx[k]);
      }
    }
    s.queue.push({ id: 'nascimento', at: 0 });
    return s;
  };
  G.traitName = (id) => (G.TRAITS.find((t) => t.id === id) || { nome: id }).nome;

  /* ---------------- Texto com variáveis ---------------- */
  G.ctx = function (s) {
    const reg = G.region(s);
    const cri = G.gen.creature(reg.biome, s.age);
    return Object.assign({}, s.ppl, {
      nome: s.name, sobrenome: s.sur, cidade: s.world.homeTown, lugar: reg.name, bioma: reg.biome,
      npc: G.gen.first(R.pick(['m', 'f'])), npc2: G.gen.first(R.pick(['m', 'f'])),
      vila: G.gen.town(), vila2: G.gen.town(), taverna: G.gen.tavern(),
      criatura: cri.full, deus: R.pick(s.world.gods).nome, item: G.gen.item().n,
      profissao: s.job ? G.JOBS[s.job] : 'sem ofício',
      reino: s.world.kingdom, rei: s.world.king, _cri: cri,
    });
  };
  G.fill = (t, s, ctx) => String(t).replace(/\{(\w+)\}/g, (m, k) => (ctx && ctx[k] != null ? ctx[k] : s.ppl[k] != null ? s.ppl[k] : m));
  function txt(t, s, ctx) {
    if (typeof t === 'function') t = t(s, ctx);
    if (Array.isArray(t)) t = R.pick(t);
    return G.fill(t || '', s, ctx);
  }
  G.txt = txt;

  /* ---------------- Sorteio de eventos ---------------- */
  function stageOk(e, st) { if (!e.st) return true; return Array.isArray(e.st) ? e.st.includes(st) : e.st === st; }
  function eligible(e, s, fromQueue) {
    if (!e) return false;
    if (e.chainOnly && !fromQueue) return false;
    if (!stageOk(e, G.stage(s))) return false;
    if (e.minAge != null && s.age < e.minAge) return false;
    if (e.maxAge != null && s.age > e.maxAge) return false;
    const once = e.once !== false;
    if (once && s.seen[e.id]) return false;
    if (!once && s.last[e.id] != null && s.turn - s.last[e.id] < (e.cd || 12)) return false;
    if (e.req && !e.req(s)) return false;
    return true;
  }
  G.eligible = eligible;

  // Quanto mais vezes um evento foi visto em vidas anteriores, menos provável ele fica.
  // Eventos nunca vistos recebem um bônus — o jogo "puxa" você para o desconhecido.
  function novelty(key) {
    const c = G.meta.seen[key] || 0;
    return c === 0 ? 3 : 1 / (1 + 0.7 * Math.min(c, 6));
  }
  G.novelty = novelty;

  function instance(e, s, proc) {
    const ctx = G.ctx(s);
    if (e.ctx) e.ctx(s, ctx);
    return { id: e.id, key: e.key || e.id, proc: !!proc, e, ctx, text: txt(e.text, s, ctx) };
  }

  G.next = function (s) {
    if (!s.alive) return null;
    if (s.age >= s.lifespan && !s.seen.morte_velhice) return instance(G.events.morte_velhice, s);
    // 1) eventos encadeados que já venceram
    s.queue.sort((a, b) => a.at - b.at);
    for (let i = 0; i < s.queue.length; i++) {
      const q = s.queue[i];
      if (q.at > s.turn) break;
      const e = G.events[q.id];
      if (eligible(e, s, true)) { s.queue.splice(i, 1); return instance(e, s); }
      if (!e || s.turn - q.at > 25) { s.queue.splice(i, 1); i--; }
    }
    // 2) procedural x escrito à mão
    const st = G.stage(s);
    const cands = G.list.filter((e) => eligible(e, s, false));
    const gens = G.gens.filter((g) => stageOk(g, st) && (!g.req || g.req(s)));
    const pProc = cands.length === 0 ? 1 : { inf: 0.2, jov: 0.33, adu: 0.42, vel: 0.3 }[st];
    if (gens.length && R.chance(pProc)) {
      for (let tries = 0; tries < 6; tries++) {
        const g = R.wpick(gens, (x) => x.w || 10);
        const ev = g.make(s);
        if (!ev) continue;
        ev.id = ev.id || 'proc_' + g.id;
        ev.once = false;
        // evita repetir a mesma combinação procedural na mesma vida
        if (s.seen[ev.key] && tries < 5) continue;
        return instance(ev, s, true);
      }
    }
    const e = R.wpick(cands, (x) => (x.w || 10) * novelty(x.id));
    if (e) return instance(e, s);
    return instance(G.events.tempo_passa, s);
  };

  /* ---------------- Escolhas e efeitos ---------------- */
  G.chance = function (s, check) {
    const v = G.stat(s, check.s);
    const sor = G.stat(s, 'sor');
    const p = 0.5 + (v - check.d) * 0.11 + (check.s === 'sor' ? 0 : (sor - 3) * 0.02);
    return Math.max(0.05, Math.min(0.95, p));
  };
  G.check = (s, c, ctx) => (typeof c.check === 'function' ? c.check(s, ctx) : c.check);
  G.choices = function (s, inst) {
    const cs = inst.e.choices || [{ t: 'Continuar', out: inst.e.out || {} }];
    return cs.filter((c) => !c.req || c.req(s, inst.ctx));
  };

  function asArr(x) { return x == null ? [{}] : Array.isArray(x) ? x : [x]; }

  // opts (vindo do combate): { ok, outcome, dmg, cause }
  G.choose = function (s, inst, idx, opts) {
    const c = G.choices(s, inst)[idx];
    if (c.combat && !(opts && opts.combat) && G.combat) opts = G.combat.auto(s, inst, c);
    opts = opts || {};
    let outs, ok = null;
    const ck = G.check(s, c, inst.ctx);
    if (opts.outcome) outs = opts.outcome;
    else if (opts.ok != null) { ok = opts.ok; outs = ok ? c.ok : c.fail; }
    else if (ck) {
      ok = R.chance(G.chance(s, ck));
      outs = ok ? c.ok : c.fail;
    } else outs = c.out;
    if (typeof outs === 'function') outs = outs(s, inst.ctx);
    const pool = asArr(outs).filter((o) => !o.req || o.req(s, inst.ctx));
    const o = R.wpick(pool.length ? pool : [{}], (x) => (x.w == null ? 10 : x.w)) || {};
    const text = txt(o.t, s, inst.ctx);
    s.seen[inst.key] = 1; s.seen[inst.id] = 1; s.last[inst.id] = s.turn;
    const chips = G.apply(s, o, inst.ctx);
    if (opts.dmg > 0 && s.alive) chips.push(...G.apply(s, { fx: { hp: -opts.dmg }, cause: opts.cause }, inst.ctx));
    if (opts.combat) chips.unshift(ok === true ? { k: 'ok', t: 'Vitória' } : ok === false ? { k: 'bad', t: 'Derrota' } : { k: 'info', t: 'Combate encerrado' });
    else if (ok === true) chips.unshift({ k: 'ok', t: 'Sucesso' });
    else if (ok === false) chips.unshift({ k: 'bad', t: 'Falha' });

    // registra o evento
    G.meta.seen[inst.key] = (G.meta.seen[inst.key] || 0) + 1;
    if (inst.proc) { s.procCount++; G.meta.proc[inst.key] = 1; }
    s.log.push({ age: s.age, ev: inst.text, ch: c.t, res: text, chips: chips.filter((x) => x.k !== 'hide') });

    // passagem do tempo
    if (s.alive) {
      s.turn++;
      const st = G.stage(s);
      s.age += st === 'inf' || st === 'jov' ? 1 : R.int(1, 2);
      if (o.age) s.age += o.age;
      // a velhice cobra seu preço
      if (G.stage(s) === 'vel' && R.chance(0.12)) { s.hp -= 1; }
      if (s.hp <= 0 && s.alive) { s.alive = false; s.cause = s.cause || 'a fragilidade da idade'; }
    }
    if (!s.alive) G.finish(s);
    G.saveMeta();
    G.saveGame(s);
    return { text, chips, ok, dead: !s.alive, combat: !!opts.combat };
  };

  G.apply = function (s, o, ctx) {
    const chips = [];
    const val = (v) => (Array.isArray(v) ? R.int(v[0], v[1]) : v);
    if (o.fx) {
      for (const k in o.fx) {
        const v = val(o.fx[k]);
        if (!v) continue;
        const sg = v > 0 ? '+' : '';
        if (G.STATS[k]) { s.st[k] = Math.max(0, Math.min(20, s.st[k] + v)); chips.push({ k: v > 0 ? 'ok' : 'bad', t: sg + v + ' ' + G.STATS[k] }); }
        else if (k === 'hp') { s.hp = Math.min(s.maxHp, s.hp + v); chips.push({ k: v > 0 ? 'ok' : 'bad', t: sg + v + ' Vida' }); }
        else if (k === 'maxHp') { s.maxHp = Math.max(1, s.maxHp + v); s.hp = Math.min(s.maxHp, v > 0 ? s.hp + v : s.hp); chips.push({ k: v > 0 ? 'ok' : 'bad', t: sg + v + ' Vida máx.' }); }
        else if (k === 'gold') { const before = s.gold; s.gold = Math.max(0, s.gold + v); const d = s.gold - before; if (d) chips.push({ k: d > 0 ? 'gold' : 'bad', t: (d > 0 ? '+' : '') + d + ' ouro' }); }
      }
    }
    for (const f of [].concat(o.set || [])) s.f[f] = true;
    for (const f of [].concat(o.unset || [])) delete s.f[f];
    if (o.inc) for (const k in o.inc) s.f[k] = (s.f[k] || 0) + o.inc[k];
    if (o.trait && !s.traits.includes(o.trait)) {
      s.traits.push(o.trait); s.f['t_' + o.trait] = true;
      chips.push({ k: 'info', t: 'Traço: ' + G.traitName(o.trait) });
    }
    if (o.item) {
      const it = typeof o.item === 'function' ? o.item(s, ctx) : o.item === 'gen' ? G.gen.item() : typeof o.item === 'string' ? { n: o.item, tag: o.item } : o.item;
      s.items.push(it);
      chips.push({ k: 'item', t: it.n + (it.b ? ' (+' + it.b + ' ' + G.STATS[it.s] + ')' : '') });
    }
    if (o.lose) {
      const i = s.items.findIndex((x) => x.tag === o.lose || x.n === o.lose);
      const j = o.lose === 'any' ? R.idx(s.items) : i;
      if (s.items.length && j >= 0) { chips.push({ k: 'bad', t: 'Perdeu: ' + s.items[j].n }); s.items.splice(j, 1); }
    }
    if (o.job) { s.job = o.job; chips.push({ k: 'info', t: 'Ofício: ' + G.JOBS[o.job] }); }
    if (o.title && !s.titles.includes(o.title)) { const t = G.fill(o.title, s, ctx); s.titles.push(t); chips.push({ k: 'title', t }); }
    if (o.ppl) for (const k in o.ppl) s.ppl[k] = G.fill(o.ppl[k], s, ctx);
    if (o.chain) {
      const list = Array.isArray(o.chain[0]) ? o.chain : [o.chain];
      for (const [id, a, b] of list) s.queue.push({ id, at: s.turn + 1 + R.int(a || 0, b == null ? a || 0 : b) });
    }
    if (o.travel) {
      const others = s.world.regions.map((r, i) => i).filter((i) => i !== s.reg);
      s.reg = o.travel === 'home' ? 0 : R.pick(others);
      chips.push({ k: 'travel', t: G.region(s).name });
    }
    if (o.fn) o.fn(s, ctx, chips);
    if (o.die) { s.alive = false; s.cause = G.fill(o.die, s, ctx); }
    if (s.hp <= 0 && s.alive) { s.alive = false; s.cause = G.fill(o.cause || 'ferimentos graves', s, ctx); }
    return chips;
  };

  /* ---------------- Fim da vida ---------------- */
  G.score = (s) => s.age * 2 + Math.floor(s.gold / 5) + s.titles.length * 25 + Object.keys(s.seen).length + (s.f.casado ? 15 : 0) + (s.f.filhos || 0) * 10;
  G.finish = function (s) {
    if (s.finished) return;
    s.finished = true;
    const m = G.meta;
    m.runs++;
    const sc = G.score(s);
    if (!m.best || sc > m.best.score) m.best = { score: sc, name: s.name + ' ' + s.sur, age: s.age };
    for (const t of s.titles) m.titles[t] = 1;
    m.causes[s.cause] = (m.causes[s.cause] || 0) + 1;
    G.saveMeta();
  };
  G.discovery = function () {
    const total = G.list.length;
    const seen = G.list.filter((e) => G.meta.seen[e.id]).length;
    return { seen, total, proc: Object.keys(G.meta.proc).length };
  };
})();

/* Mil Vidas — combate.
 * Criaturas comuns: combate NARRADO. O jogador escolhe uma postura, a luta corre sozinha em
 * rodadas animadas e, no momento crítico, o jogador toma uma decisão.
 * Chefes: combate em RODADAS. A cada turno o jogador escolhe Atacar, Defender, a técnica do
 * ofício ou Fugir; o chefe avisa antes de usar o golpe especial.
 * Este módulo só calcula; a interface (ui.js) anima e narra.
 */
(function () {
  'use strict';
  const G = globalThis.G;
  const R = G.R;
  const C = (G.combat = {});
  const st = (s, k) => G.stat(s, k);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // técnica de cada ofício
  const TECH = {
    soldado: { label: 'Muralha de escudo', stat: 'for', kind: 'guard', desc: 'ataca protegido' },
    mago: { label: 'Lançar um feitiço', stat: 'int', kind: 'power', desc: 'muito dano' },
    ladrao: { label: 'Golpe pelas costas', stat: 'agi', kind: 'crit', desc: 'golpes críticos' },
    bardo: { label: 'Canção hipnótica', stat: 'car', kind: 'stun', desc: 'atordoa o inimigo' },
    sacerdote: { label: 'Luz sagrada', stat: 'sor', kind: 'heal', desc: 'recupera vida' },
    aventureiro: { label: 'Instinto de aventureiro', stat: 'sor', kind: 'crit', desc: 'golpes críticos' },
    fazendeiro: { label: 'Força da lavoura', stat: 'for', kind: 'power', desc: 'muito dano' },
    mercador: { label: 'Pó nos olhos', stat: 'int', kind: 'stun', desc: 'atordoa o inimigo' },
  };
  C.TECH = TECH;
  const POSTURES = [
    { id: 'agr', label: 'Atacar com tudo', stat: 'for', desc: 'mais dano, mais risco' },
    { id: 'cau', label: 'Lutar com cautela', stat: 'agi', desc: 'recebe menos dano' },
    { id: 'ast', label: 'Procurar um ponto fraco', stat: 'int', desc: 'golpes críticos' },
  ];

  C.enemyOf = (s, inst, c) => (typeof c.combat.enemy === 'function' ? c.combat.enemy(s, inst.ctx) : c.combat.enemy);

  C.start = function (s, enemy) {
    const pow = Math.max(2, enemy.pow || 4), boss = !!enemy.boss;
    const hp = Math.round(boss ? 8 + pow * 1.4 : 4 + pow * 1.3);
    return {
      boss, e: Object.assign({}, enemy, { pow, hp, max: hp }),
      hero: { hp: s.hp, max: s.maxHp }, dmg: 0, round: 0, cd: 0, guard: false, stun: 0, charge: false,
      posture: null, over: false, result: null, lines: [],
    };
  };

  C.hitChance = (s, stat, pow, bonus) => clamp(0.58 + (st(s, stat) - pow) * 0.08 + (bonus || 0) + (st(s, 'sor') - 3) * 0.015, 0.12, 0.94);

  function heroStrike(s, b, stat, mult, critB) {
    if (!R.chance(C.hitChance(s, stat, defPow(b), 0))) return { who: 'hero', kind: 'atk', hit: false, dmg: 0 };
    let d = Math.max(1, Math.round((2 + st(s, stat) / (b.boss ? 2.5 : 3) + R.int(0, 2)) * mult));
    const crit = R.chance(0.1 + (critB || 0));
    if (crit) d = Math.round(d * 1.8);
    d = Math.min(d, b.e.hp);
    b.e.hp -= d;
    return { who: 'hero', kind: 'atk', hit: true, dmg: d, crit };
  }
  function foeStrike(s, b, mult) {
    if (b.stun > 0) { b.stun--; return { who: 'foe', kind: 'stunned', hit: false, dmg: 0 }; }
    const def = st(s, 'agi') * (b.posture === 'cau' ? 1.35 : 1) + (b.guard ? 3 : 0);
    if (!R.chance(clamp(0.52 + (defPow(b) - def) * 0.07, 0.12, 0.88))) return { who: 'foe', kind: 'atk', hit: false, dmg: 0 };
    let d = Math.max(1, Math.round((1 + b.e.pow / (b.boss ? 4 : 3.5)) * (mult || 1)));
    if (b.posture === 'cau') d = Math.max(1, d - 1);
    if (b.posture === 'agr') d += 1;
    if (b.guard) d = Math.ceil(d / 2);
    d = Math.min(d, Math.max(0, b.hero.hp));
    b.dmg += d; b.hero.hp -= d;
    return { who: 'foe', kind: 'atk', hit: d > 0, dmg: d };
  }
  // chefes são grandes: mais fáceis de acertar e de previsíveis, mas batem forte e aguentam muito
  const defPow = (b) => (b.boss ? b.e.pow - 3 : b.e.pow);
  function heal(b, n) { const h = Math.min(n, b.dmg); if (h <= 0) return null; b.dmg -= h; b.hero.hp += h; return { who: 'hero', kind: 'heal', dmg: h }; }
  function checkEnd(b) {
    if (b.e.hp <= 0) { b.over = true; b.result = 'win'; }
    else if (b.hero.hp <= 0) { b.over = true; b.result = 'lose'; }
    return b.over;
  }

  /* ---------- combate narrado ---------- */
  C.postures = function (s) {
    const L = POSTURES.slice();
    const j = TECH[s.job];
    if (j) L.push({ id: 'tec', label: j.label, stat: j.stat, desc: 'técnica do seu ofício: ' + j.desc });
    return L.map((p) => Object.assign({ chance: C.hitChance(s, p.stat, 0, 0) }, p));
  };
  C.round = function (s, b) {
    b.round++;
    const ev = [], P = b.posture, tech = P === 'tec' ? TECH[s.job] : null;
    const stat = P === 'agr' ? 'for' : P === 'cau' ? 'agi' : P === 'ast' ? 'int' : tech.stat;
    let mult = P === 'agr' ? 1.35 : P === 'cau' ? 0.85 : 1, critB = P === 'ast' ? 0.25 : 0;
    b.guard = false;
    if (tech) {
      if (tech.kind === 'power') mult = 1.5;
      if (tech.kind === 'crit') critB = 0.35;
      if (tech.kind === 'guard') { b.guard = true; mult = 0.95; }
      if (tech.kind === 'stun' && b.round === 1 && R.chance(C.hitChance(s, stat, b.e.pow, 0))) { b.stun = 1; ev.push({ who: 'hero', kind: 'stun' }); }
      if (tech.kind === 'heal' && b.round === 2) { const h = heal(b, 2); if (h) ev.push(h); }
    }
    ev.push(heroStrike(s, b, stat, mult, critB));
    if (checkEnd(b)) return ev;
    ev.push(foeStrike(s, b));
    checkEnd(b);
    return ev;
  };
  C.decision = function (s, b) {
    const er = b.e.hp / b.e.max, hr = b.hero.hp / b.hero.max;
    if (er <= 0.4) return { kind: 'ferido', opts: [{ id: 'perseguir', label: 'Avançar para acabar com isso', stat: 'for' }, { id: 'deixar', label: 'Deixar ir embora' }] };
    if (hr <= 0.45) return { kind: 'cansado', opts: [{ id: 'firme', label: 'Lutar até o fim', stat: 'for' }, { id: 'recuar', label: 'Recuar enquanto pode', stat: 'agi' }] };
    return { kind: 'abertura', opts: [{ id: 'arriscar', label: 'Golpe arriscado', stat: 'for' }, { id: 'guarda', label: 'Manter a guarda', stat: 'agi' }] };
  };
  C.decide = function (s, b, id) {
    const ev = [];
    if (id === 'deixar') { b.over = true; b.result = 'spare'; return ev; }
    if (id === 'recuar') {
      if (R.chance(C.hitChance(s, 'agi', b.e.pow, 0.1))) { b.over = true; b.result = 'retreat'; return ev; }
      ev.push({ who: 'hero', kind: 'stumble' }, foeStrike(s, b, 1.2));
      if (!checkEnd(b)) { b.over = true; b.result = 'retreat'; }
      return ev;
    }
    if (id === 'guarda') {
      b.guard = true;
      ev.push(heroStrike(s, b, 'agi', 0.8, 0));
      if (!checkEnd(b)) { ev.push(foeStrike(s, b)); checkEnd(b); }
      b.guard = false;
      return ev;
    }
    // perseguir, arriscar, firme: golpe forte com risco
    ev.push(heroStrike(s, b, 'for', id === 'firme' ? 1.2 : 1.6, 0.15));
    if (!checkEnd(b)) { ev.push(foeStrike(s, b, id === 'arriscar' ? 1.3 : 1)); checkEnd(b); }
    return ev;
  };
  C.conclude = function (s, b) {
    if (!b.over) {
      b.over = true;
      b.result = b.e.hp / b.e.max < b.hero.hp / b.hero.max ? 'flee' : 'retreat';
    }
    return b.result;
  };

  /* ---------- combate em rodadas (chefes) ---------- */
  C.bossActions = function (s, b) {
    const j = TECH[s.job];
    return [
      { id: 'atk', label: 'Atacar', stat: 'for' },
      { id: 'def', label: 'Defender', stat: 'agi', desc: b.charge ? 'reduz o golpe especial' : 'reduz o dano e recupera o fôlego' },
      { id: 'tec', label: j ? j.label : 'Golpe desesperado', stat: j ? j.stat : 'sor', desc: b.cd > 0 ? 'pronto em ' + b.cd + ' turno(s)' : j ? j.desc : 'tudo ou nada', disabled: b.cd > 0 },
      { id: 'fugir', label: 'Fugir', stat: 'agi', desc: 'difícil contra um chefe' },
    ].map((a) => Object.assign({ chance: a.id === 'def' ? null : C.hitChance(s, a.stat, a.id === 'fugir' ? b.e.pow : defPow(b), 0) }, a));
  };
  C.bossTurn = function (s, b, act) {
    b.round++;
    const ev = [];
    b.guard = false;
    if (act === 'fugir') {
      if (R.chance(C.hitChance(s, 'agi', b.e.pow, 0))) { b.over = true; b.result = 'retreat'; return ev; }
      ev.push({ who: 'hero', kind: 'stumble' });
    } else if (act === 'def') {
      b.guard = true;
      ev.push({ who: 'hero', kind: 'guard' });
      if (R.chance(0.45)) { const h = heal(b, 1); if (h) ev.push(h); }
    } else if (act === 'tec') {
      const j = TECH[s.job], stat = j ? j.stat : 'sor';
      b.cd = 3;
      if (j && j.kind === 'heal') { const h = heal(b, 3); ev.push(h || { who: 'hero', kind: 'guard' }); }
      else if (j && j.kind === 'stun') {
        if (R.chance(C.hitChance(s, stat, b.e.pow, 0))) { b.stun = 1; ev.push({ who: 'hero', kind: 'stun' }); } else ev.push({ who: 'hero', kind: 'atk', hit: false, dmg: 0 });
      } else if (j && j.kind === 'guard') { b.guard = true; ev.push(heroStrike(s, b, stat, 1.25, 0)); }
      else ev.push(heroStrike(s, b, stat, j && j.kind === 'power' ? 1.9 : 1.5, j && j.kind === 'crit' ? 0.4 : 0.1));
    } else ev.push(heroStrike(s, b, 'for', 1, 0.08));
    if (act !== 'tec' && b.cd > 0) b.cd--;
    if (checkEnd(b)) return ev;
    if (b.charge) { b.charge = false; ev.push(Object.assign(foeStrike(s, b, 2.2), { special: true })); }
    else {
      ev.push(foeStrike(s, b));
      if (b.round % 3 === 2) { b.charge = true; ev.push({ who: 'foe', kind: 'charge' }); }
    }
    checkEnd(b);
    return ev;
  };

  /* ---------- resultado ---------- */
  C.resultOpts = function (s, b) {
    const o = { combat: true, dmg: b.dmg, cause: 'lutando contra ' + b.e.name, battle: b };
    if (b.result === 'win') o.ok = true;
    else if (b.result === 'flee') o.outcome = { t: G.R.pick([cap(b.e.name) + ' fugiu ferido e desapareceu.', 'Ferido, ' + b.e.name + ' bateu em retirada. A vitória é sua, ainda que sem prêmio.']), fx: { gold: [0, 4] } };
    else if (b.result === 'spare') o.outcome = { t: 'Você deixou ' + b.e.name + ' ir embora. Há algo de nobre em saber parar.', fx: { sor: 1 } };
    else o.ok = false;
    return o;
  };
  // usado quando não há interface (simulador)
  C.auto = function (s, inst, c) {
    const b = C.start(s, C.enemyOf(s, inst, c));
    if (b.boss) {
      let n = 0;
      while (!b.over && n++ < 40) {
        const acts = C.bossActions(s, b).filter((a) => !a.disabled);
        const a = b.charge ? 'def' : b.hero.hp <= 2 && R.chance(0.5) ? 'fugir' : acts.some((x) => x.id === 'tec') ? 'tec' : 'atk';
        C.bossTurn(s, b, a);
      }
      if (!b.over) { b.over = true; b.result = 'retreat'; }
    } else {
      b.posture = R.pick(C.postures(s)).id;
      C.round(s, b);
      if (!b.over) C.round(s, b);
      if (!b.over) C.decide(s, b, R.pick(C.decision(s, b).opts).id);
      if (!b.over) C.round(s, b);
      C.conclude(s, b);
    }
    return C.resultOpts(s, b);
  };

  /* ---------- narração ---------- */
  const cap = (t) => String(t).charAt(0).toUpperCase() + String(t).slice(1);
  C.cap = cap;
  C.narrate = function (ev, b) {
    const n = b.e.name, N = cap(n), P = R.pick;
    if (ev.kind === 'atk' && ev.who === 'hero') {
      if (!ev.hit) return P([N + ' desvia do seu golpe.', 'Você erra por pouco.', 'Seu ataque corta só o ar.']);
      return (ev.crit ? P(['Golpe perfeito! ', 'Em cheio! ']) : '') + P(['Você acerta ' + n + '.', 'Seu golpe encontra o alvo.', 'Você fere ' + n + '.', N + ' cambaleia com o golpe.']);
    }
    if (ev.kind === 'atk' && ev.who === 'foe') {
      if (ev.special) return ev.hit ? N + ' libera um ataque devastador!' : 'Você escapa do ataque devastador por um triz!';
      if (!ev.hit) return P(['Você se esquiva.', 'O ataque passa raspando.', 'Você bloqueia o golpe.']);
      return P([N + ' acerta você.', 'Você sente o golpe de ' + n + '.', N + ' encontra uma brecha na sua guarda.']);
    }
    if (ev.kind === 'stunned') return N + ' ainda está atordoado.';
    if (ev.kind === 'stun') return N + ' fica atordoado.';
    if (ev.kind === 'heal') return 'Você recupera o fôlego.';
    if (ev.kind === 'guard') return 'Você ergue a guarda e espera.';
    if (ev.kind === 'stumble') return 'Você tenta fugir, mas tropeça.';
    if (ev.kind === 'charge') return N + ' se prepara para um golpe terrível… Defenda-se!';
    return '';
  };
  C.decisionText = function (d, b) {
    const N = cap(b.e.name);
    return { ferido: N + ' está ferido e recua, ofegante.', cansado: 'Você está ferido e cansado. ' + N + ' não dá trégua.', abertura: 'Uma abertura aparece na guarda de ' + b.e.name + '.' }[d.kind];
  };
})();

/* Mil Vidas — interface de livro ilustrado. */
(function () {
  'use strict';
  const G = globalThis.G;
  const A = G.art;
  const SND = G.sound;
  const app = document.getElementById('app');
  const ABR = { for: 'FOR', agi: 'AGI', int: 'INT', car: 'CAR', sor: 'SOR' };
  let S = null, cur = null, phase = 'choose', res = null, spec = null;

  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (sel, root) => (root || app).querySelector(sel);
  const on = (sel, fn, root) => (root || app).querySelectorAll(sel).forEach((el) => el.addEventListener('click', fn));
  const ic = (n, cls) => `<img class="ic ${cls || ''}" src="${A.icon(n)}" alt="">`;
  const seedOf = (s) => A.hash(s.name + s.sur + s.world.homeTown);
  const rule = () => `<div class="rule">${ic('orn')}</div>`;

  // papel texturizado
  try { const p = A.paper(); document.body.style.backgroundImage = `url(${p})`; document.documentElement.style.setProperty('--paper-img', `url(${p})`); } catch (e) { /* ignora */ }

  function chipIcon(c) {
    if (c.k === 'gold') return ic('coin');
    if (c.k === 'item') return ic('item');
    if (c.k === 'title') return ic('title');
    if (c.k === 'travel') return ic('travel');
    if (c.k === 'xp' || c.k === 'level') return ic('star');
    if (/Vida/.test(c.t)) return ic('heart');
    for (const k in G.STATS) if (c.t.includes(G.STATS[k])) return ic(k);
    return '';
  }
  const fxHtml = (chips) => (chips || []).filter((c) => c.k !== 'ok' || c.t !== 'Sucesso').filter((c) => c.t !== 'Falha').map((c) => `<div class="fx ${c.k}">${chipIcon(c)}${esc(c.t)}</div>`).join('');
  const chipsHtml = (chips) => (chips || []).map((c) => `<span class="chip ${c.k}">${chipIcon(c)}${esc(c.t)}</span>`).join('');

  /* ---------------- animação ---------------- */
  let anim = null, rafId = 0, last = 0;
  const t0 = performance.now();
  function loop(now) {
    rafId = requestAnimationFrame(loop);
    if (!anim || now - last < 100) return;
    last = now;
    const t = (now - t0) / 1000;
    for (const a of anim) if (a.cv.isConnected) a.draw(a.cv, t);
  }
  function animate(list) { anim = list; if (!rafId) rafId = requestAnimationFrame(loop); last = 0; }

  let typing = null;
  function screen(html, cls) {
    anim = null;
    if (typing) typing.cancel();
    app.innerHTML = `<div class="screen ${cls || ''}">${html}</div>`;
    window.scrollTo(0, 0);
    return app.firstElementChild;
  }

  /* ---------------- texto que se escreve ---------------- */
  function typewrite(el, text, done) {
    if (typing) typing.cancel();
    let i = 0;
    el.textContent = '';
    const id = setInterval(() => {
      i += 2;
      el.textContent = text.slice(0, i);
      if (i % 6 === 0 && text[i] !== ' ') SND.play('blip');
      if (i >= text.length) finish();
    }, 18);
    function finish() { clearInterval(id); el.textContent = text; typing = null; if (done) done(); }
    typing = { finish, cancel() { clearInterval(id); typing = null; } };
  }

  /* ---------------- menu ---------------- */
  function menu() {
    bToken++;
    const d = G.discovery(), save = G.loadGame(), m = G.meta;
    const seed = (Date.now() / 60000) | 0;
    screen(`
      <div class="title-art"><canvas class="px" id="tcv"></canvas>
        <div class="logo"><h1>Mil Vidas</h1><p>cada vida, uma história</p></div>
      </div>
      <nav class="opts">
        ${save ? `<button class="opt" id="cont">${ic('orn', 'orn')}<span>Continuar a vida de ${esc(save.name)}, ${save.age} anos</span></button>` : ''}
        <button class="opt" id="new">${ic('orn', 'orn')}<span>Nova vida</span></button>
        <button class="opt" id="gal">${ic('orn', 'orn')}<span>Crônicas</span></button>
        <button class="opt" id="snd">${ic('orn', 'orn')}<span>Som e música</span></button>
        <button class="opt" id="cred">${ic('orn', 'orn')}<span>Créditos</span></button>
      </nav>
      ${rule()}
      <div class="stats3">
        <div><b>${m.runs}</b><span>vidas vividas</span></div>
        <div><b>${d.seen}/${d.total}</b><span>eventos descobertos</span></div>
        <div><b>${d.proc}</b><span>variações vistas</span></div>
      </div>
      <p class="hint blink">Toque para ativar o som</p>`, 'menu');
    const cv = $('#tcv');
    animate([{ cv, draw: (c, t) => A.renderTitle(c, t, seed) }]);
    A.renderTitle(cv, 0, seed);
    SND.music('menu', seed);
    on('#new', () => { SND.play('confirm'); if (!save) creation(); else ask('Começar uma nova vida? A vida de ' + save.name + ' será perdida.', creation); });
    on('#cont', () => { SND.play('confirm'); S = G.fixState(save); ensureLook(S); next(); });
    on('#gal', () => { SND.play('confirm'); gallery(); });
    on('#snd', () => { SND.play('confirm'); soundMenu(); });
    on('#cred', () => { SND.play('confirm'); credits(); });
    document.addEventListener('pointerdown', () => { const h = $('.hint'); if (h) h.remove(); }, { once: true });
  }
  function ensureLook(s) { if (!s.look) s.look = A.newLook(s.name + s.sur, s.sexo); }

  function credits() {
    const div = modal(`
      <h3>Créditos</h3>
      <p class="story" style="text-indent:0">Ilustrações de cenários, criaturas e personagens: <b>Luis Zuno (ansimuz)</b>, pacotes Gothicvania, Sideview Fantasy, Magic Cliffs, Magical Road, Forest e Mountain at Dusk (CC0) e Battle Background: Hazy Hills (CC-BY 3.0), via OpenGameArt.org.</p>
      <p class="story" style="text-indent:0">Fontes: Alegreya (Juan Pablo del Peral, Huerta Tipográfica) e Pixelify Sans (Stefie Justprince), licença SIL OFL.</p>
      <p class="story" style="text-indent:0">Onde não há ilustração pronta, a arte, a música e os efeitos sonoros são gerados pelo próprio jogo.</p>
      <nav class="opts"><button class="opt" id="close">${ic('orn', 'orn')}<span>Fechar</span></button></nav>`);
    on('#close', () => { SND.play('select'); div.remove(); }, div);
  }

  /* ---------------- janelas ---------------- */
  function modal(html) {
    const div = document.createElement('div');
    div.className = 'modal';
    div.innerHTML = `<div class="sheet">${html}</div>`;
    const sh = div.firstElementChild;
    try { sh.style.backgroundImage = `url(${A.paper()})`; } catch (e) { /* ignora */ }
    app.appendChild(div);
    div.addEventListener('click', (e) => { if (e.target === div) { SND.play('select'); div.remove(); } });
    return div;
  }
  function ask(text, onYes) {
    const div = modal(`<p class="ask">${esc(text)}</p>
      <nav class="opts"><button class="opt" id="no">${ic('orn', 'orn')}<span>Não</span></button>
      <button class="opt danger" id="yes">${ic('orn', 'orn')}<span>Sim</span></button></nav>`);
    on('#no', () => { SND.play('select'); div.remove(); }, div);
    on('#yes', () => { SND.play('confirm'); div.remove(); onYes(); }, div);
  }
  function soundMenu() {
    const div = modal(`
      <h3>Som</h3>
      <nav class="opts">
        <button class="opt" id="mus">${ic('music')}<span>Música: <b>${SND.pref.music ? 'ligada' : 'desligada'}</b></span></button>
        <button class="opt" id="sfx">${ic(SND.pref.sfx ? 'sound' : 'mute')}<span>Efeitos: <b>${SND.pref.sfx ? 'ligados' : 'desligados'}</b></span></button>
        <button class="opt" id="ok">${ic('orn', 'orn')}<span>Voltar</span></button>
      </nav>`);
    on('#mus', () => { SND.toggleMusic(); div.remove(); soundMenu(); }, div);
    on('#sfx', () => { SND.toggleSfx(); SND.play('confirm'); div.remove(); soundMenu(); }, div);
    on('#ok', () => { SND.play('select'); div.remove(); }, div);
  }

  /* ---------------- criação ---------------- */
  function creation() {
    S = G.newLife();
    ensureLook(S);
    const stats = Object.keys(G.STATS).map((k) => `<div class="stat">${ic(k)}<span>${G.STATS[k]}</span><b>${S.st[k]}</b></div>`).join('');
    screen(`
      <h2 class="banner">Uma nova vida</h2>
      <p class="subtitle">Ainda não escrita</p>
      ${rule()}
      <div class="pc-head">
        <div class="frame"><canvas class="px portrait big" id="pcv"></canvas></div>
        <div>
          <div class="big-name">${esc(S.name)} ${esc(S.sur)}</div>
          <div class="muted"><i>${esc(S.originName)}</i></div>
          <div class="chips">${S.traits.map((t) => `<span class="chip info">${esc(G.traitName(t))}</span>`).join('')}</div>
        </div>
      </div>
      <div class="stats-grid">${stats}</div>
      <div class="row">${ic('heart')}<span>${S.maxHp} de vida</span><span class="sp"></span>${ic('coin')}<span>${S.gold} de ouro</span></div>
      <div class="row"><span class="lbl">Terra natal</span><span>${esc(S.world.homeTown)}, ${esc(S.world.regions[0].name)}</span></div>
      <div class="row"><span class="lbl">Reino</span><span>${esc(S.world.kingdom)}</span></div>
      <div class="row"><span class="lbl">Deuses</span><span>${S.world.gods.map((g) => esc(g.nome) + ' <i>' + esc(g.dom) + '</i>').join(', ')}</span></div>
      ${rule()}
      <nav class="opts">
        <button class="opt" id="go">${ic('orn', 'orn')}<span><b>Nascer</b></span></button>
        <button class="opt" id="re">${ic('orn', 'orn')}<span>Sortear outra vida</span></button>
        <button class="opt" id="back">${ic('orn', 'orn')}<span>Voltar</span></button>
      </nav>`, 'create');
    A.portraitCanvas($('#pcv'), S, 'inf');
    on('#go', () => { SND.play('birth'); next(); });
    on('#re', () => { SND.play('page'); creation(); });
    on('#back', () => { SND.play('select'); menu(); });
  }

  /* ---------------- jogo ---------------- */
  function next() {
    if (!S.alive) return death();
    cur = G.next(S);
    spec = A.specFor(S, cur);
    phase = 'choose';
    res = null;
    SND.music(G.stage(S), seedOf(S) + G.stage(S).length);
    render();
  }

  function hearts() {
    let h = '';
    for (let i = 0; i < Math.ceil(S.maxHp / 2); i++) { const v = S.hp - i * 2; h += ic(v >= 2 ? 'heart' : v === 1 ? 'half' : 'empty', 'hrt'); }
    return h;
  }
  function hud() {
    const stats = Object.keys(G.STATS).map((k) => {
      const v = G.stat(S, k), bonus = v - S.st[k];
      return `<div class="st" title="${G.STATS[k]}">${ic(k)}<b>${v}${bonus ? `<sup>${bonus > 0 ? '+' : ''}${bonus}</sup>` : ''}</b></div>`;
    }).join('');
    return `
      <header class="hud">
        <button class="pbtn" id="sheet" aria-label="Ficha"><div class="frame"><canvas class="px portrait" id="pcv"></canvas></div></button>
        <div class="plate">${esc(S.name)} ${esc(S.sur)}</div>
        <div class="hearts">${hearts()}<span class="gold">${ic('coin')}${S.gold}</span></div>
        <div class="ageline">${S.age} anos · ${esc(G.stageName(S))}${S.job ? ' · ' + G.JOBS[S.job] : ''}</div>
        <div class="xpline"><span class="lv">Nv ${S.lvl}</span><div class="xpbar" title="${S.xp}/${G.xpNeed(S.lvl)} exp"><div style="width:${Math.round((100 * S.xp) / G.xpNeed(S.lvl))}%"></div></div>${S.pts ? `<button class="ptsbtn" id="lvup">+${S.pts}</button>` : ''}</div>
        <div class="hud-stats">${stats}</div>
        ${rule()}
      </header>`;
  }

  function render() {
    const last = S.log[S.log.length - 1];
    let body;
    if (phase === 'choose') {
      const cs = G.choices(S, cur);
      body = `
        <p class="story" id="txt"></p>
        <nav class="opts hidden" id="ch">
          ${cs.map((c, i) => {
            const ck = G.check(S, c, cur.ctx);
            let badge = '';
            if (ck) { const p = Math.round(G.chance(S, ck) * 100); badge = `<span class="badge ${p >= 65 ? 'easy' : p >= 40 ? 'mid' : 'hard'}">${ic(ck.s)}${p}%</span>`; }
            if (c.combat) { const en = G.combat.enemyOf(S, cur, c); badge = en.boss ? '<span class="badge hard">CHEFE</span>' : '<span class="badge mid">COMBATE</span>'; }
            return `<button class="opt choice" data-i="${i}">${ic('orn', 'orn')}<span>${esc(G.fill(c.t, S, cur.ctx))}</span>${badge}</button>`;
          }).join('')}
        </nav>`;
    } else {
      const tag = res.combat ? (res.ok === true ? '<span class="tag ok">‹ Vitória ›</span>' : res.ok === false ? '<span class="tag bad">‹ Derrota ›</span>' : '<span class="tag">‹ Fim do combate ›</span>') : res.ok === true ? '<span class="tag ok">‹ Sucesso ›</span>' : res.ok === false ? '<span class="tag bad">‹ Falha ›</span>' : '';
      const blog = res.lines ? `<details class="bt-sum"><summary>Rever o combate</summary>${res.lines.map((l) => `<p class="bt-line">${esc(l)}</p>`).join('')}</details>` : '';
      body = `
        <p class="story">${esc(last.ev)}</p>
        <p class="picked">${ic('orn')}${esc(last.ch)}</p>
        ${tag}
        ${blog}
        <p class="story" id="txt"></p>
        <div class="effects hidden" id="fx">${fxHtml(res.chips)}</div>
        ${rule()}
        <nav class="opts hidden" id="ch"><button class="opt" id="cont">${ic('orn', 'orn')}<span>${S.alive ? 'Continuar' : 'Fim da jornada…'}</span></button></nav>`;
    }
    screen(`
      ${hud()}
      <main class="page">
        <div class="vignette" id="sw"><canvas class="px" id="scv"></canvas></div>
        <div class="place">${esc(G.region(S).name)}</div>
        ${body}
      </main>
      <nav class="bar">
        <button id="diary">${ic('book')}<span>Diário</span></button>
        <button id="sheet2">${ic('bag')}<span>Ficha</span></button>
        <button id="snd">${ic(SND.pref.music || SND.pref.sfx ? 'sound' : 'mute')}<span>Som</span></button>
        <button id="tomenu">${ic('menu')}<span>Menu</span></button>
      </nav>`, 'game');
    A.portraitCanvas($('#pcv'), S);
    const cv = $('#scv');
    A.render(cv, spec, (performance.now() - t0) / 1000, S);
    animate([{ cv, draw: (c, t) => A.render(c, spec, t, S) }]);

    const reveal = () => { for (const id of ['#ch', '#fx']) { const el = $(id); if (el) el.classList.remove('hidden'); } };
    typewrite($('#txt'), phase === 'choose' ? cur.text : res.text, () => { reveal(); if (phase === 'result') resultSounds(); });
    on('.page', () => typing && typing.finish());

    on('.choice', (e) => {
      e.stopPropagation();
      const i = +e.currentTarget.dataset.i;
      if (G.choices(S, cur)[i].combat) { startCombat(i); return; }
      SND.play('confirm');
      res = G.choose(S, cur, i);
      phase = 'result';
      render();
      const sw = $('#sw');
      if (res.chips.some((c) => /Vida/.test(c.t) && c.k === 'bad')) sw.classList.add('shake');
      if (res.chips.some((c) => c.k === 'title')) sw.classList.add('flash');
    });
    on('#cont', (e) => { e.stopPropagation(); SND.play('page'); if (S.alive && S.pts > 0) levelUp(next); else next(); });
    on('#lvup', (e) => { e.stopPropagation(); levelUp(render); });
    on('#sheet', sheet); on('#sheet2', sheet);
    on('#diary', diary);
    on('#snd', soundMenu);
    on('#tomenu', () => { SND.play('select'); menu(); });
  }

  /* ---------------- combate ---------------- */
  let battle = null, bToken = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const nowT = () => (performance.now() - t0) / 1000;
  const STAT_ABR = { for: 'FOR', agi: 'AGI', int: 'INT', car: 'CAR', sor: 'SOR' };
  function chanceBadge(stat, p) { const v = Math.round(p * 100); return `<span class="badge ${v >= 65 ? 'easy' : v >= 40 ? 'mid' : 'hard'}">${ic(stat)}${v}%</span>`; }

  function startCombat(i) {
    const CB = G.combat, c = G.choices(S, cur)[i];
    const enemy = CB.enemyOf(S, cur, c);
    battle = CB.start(S, enemy);
    battle.idx = i; battle.choice = G.fill(c.t, S, cur.ctx);
    spec.fig = { t: 'criatura', c: { base: enemy.base || 'lobo', adj: enemy.adj || '', pow: enemy.pow, tipo: enemy.tipo || 'fera', g: enemy.g } };
    A.resetScene(spec);
    if (battle.boss) { SND.music('luta', seedOf(S) + 7); SND.play('warn'); } else SND.play('slash');
    phase = 'combat';
    const token = ++bToken;
    renderCombat();
    (battle.boss ? bossLoop : narratedFlow)(token);
  }

  function renderCombat() {
    const b = battle, CB = G.combat;
    screen(`
      ${hud()}
      <main class="page">
        <div class="vignette" id="sw"><canvas class="px" id="scv"></canvas></div>
        <div class="place">${esc(G.region(S).name)}</div>
        <p class="story">${esc(cur.text)}</p>
        <p class="picked">${ic('orn')}${esc(b.choice)}</p>
        <section class="battle ${b.boss ? 'boss' : ''}">
          <div class="bt-row"><span class="bt-name">Você</span><div class="bt-bar hero"><div id="hbar"></div></div><b id="hhp"></b></div>
          <div class="bt-row"><span class="bt-name">${esc(CB.cap(b.e.name))}${b.boss ? ' <span class="tag boss">CHEFE</span>' : ''}</span><div class="bt-bar foe"><div id="fbar"></div></div><b id="fhp"></b></div>
          <div class="bt-log" id="blog"></div>
          <p class="bt-prompt" id="bprompt"></p>
          <nav class="opts" id="bopts"></nav>
        </section>
      </main>`, 'game');
    A.portraitCanvas($('#pcv'), S);
    const cv = $('#scv');
    A.render(cv, spec, nowT(), S);
    animate([{ cv, draw: (c, t) => A.render(c, spec, t, S) }]);
    bars();
  }
  function bars() {
    const b = battle;
    const hb = $('#hbar'), fb = $('#fbar');
    if (!hb) return;
    hb.style.width = Math.max(0, (100 * b.hero.hp) / b.hero.max) + '%';
    fb.style.width = Math.max(0, (100 * b.e.hp) / b.e.max) + '%';
    $('#hhp').textContent = Math.max(0, b.hero.hp) + '/' + b.hero.max;
    $('#fhp').textContent = Math.max(0, b.e.hp) + '/' + b.e.max;
  }
  function addLine(text, cls) {
    if (!text) return;
    battle.lines.push(text);
    const lg = $('#blog');
    if (!lg) return;
    const p = document.createElement('p');
    p.className = 'bt-line ' + (cls || '');
    p.textContent = text;
    lg.appendChild(p);
    p.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function ask2(prompt, opts) {
    return new Promise((resolve) => {
      const pr = $('#bprompt'), box = $('#bopts');
      if (!box) return;
      pr.textContent = prompt || '';
      box.innerHTML = opts.map((o, i) => `<button class="opt bopt" data-i="${i}" ${o.disabled ? 'disabled' : ''}>${ic('orn', 'orn')}<span>${esc(o.label)}${o.desc ? `<small>${esc(o.desc)}</small>` : ''}</span>${o.chance != null ? chanceBadge(o.stat, o.chance) : ''}</button>`).join('');
      box.querySelectorAll('.bopt').forEach((el) => el.addEventListener('click', (e) => {
        e.stopPropagation();
        const o = opts[+el.dataset.i];
        if (o.disabled) return;
        SND.play('confirm');
        pr.textContent = ''; box.innerHTML = '';
        resolve(o);
      }));
    });
  }
  async function play(evs, token) {
    const b = battle;
    for (const ev of evs) {
      if (token !== bToken) return;
      const t = nowT();
      const sw = $('#sw');
      if (ev.kind === 'atk' && ev.who === 'hero') {
        A.fx(spec, [{ who: 0, kind: 'lunge', dur: 0.35 }], t); SND.play('slash');
        await wait(170);
        if (ev.hit) { A.fx(spec, [{ who: 1, kind: 'hit', dur: 0.45 }, { who: 1, kind: 'text', text: '-' + ev.dmg + (ev.crit ? '!' : ''), col: ev.crit ? [255, 220, 80] : [255, 255, 255], dur: 0.9 }], nowT()); SND.play('hit'); }
        else { A.fx(spec, [{ who: 1, kind: 'text', text: 'ERROU', col: [220, 220, 220], dur: 0.8 }], nowT()); SND.play('miss'); }
      } else if (ev.kind === 'atk' && ev.who === 'foe') {
        A.fx(spec, [{ who: 1, kind: 'lunge', dur: 0.35 }], t);
        await wait(170);
        if (ev.hit) { A.fx(spec, [{ who: 0, kind: 'hit', dur: 0.45 }, { who: 0, kind: 'text', text: '-' + ev.dmg, col: [255, 90, 90], dur: 0.9 }], nowT()); SND.play('hurt'); if (sw) { sw.classList.remove('shake'); void sw.offsetWidth; sw.classList.add('shake'); } }
        else { A.fx(spec, [{ who: 0, kind: 'text', text: 'ESQUIVA', col: [200, 230, 255], dur: 0.8 }], nowT()); SND.play('miss'); }
      } else if (ev.kind === 'heal') { A.fx(spec, [{ who: 0, kind: 'heal', dur: 0.6 }, { who: 0, kind: 'text', text: '+' + ev.dmg, col: [120, 255, 140], dur: 0.9 }], t); SND.play('heal'); }
      else if (ev.kind === 'guard') { A.fx(spec, [{ who: 0, kind: 'guard', dur: 0.5 }], t); SND.play('select'); }
      else if (ev.kind === 'stun') { A.fx(spec, [{ who: 1, kind: 'stun', dur: 0.6 }, { who: 1, kind: 'text', text: '!', col: [255, 240, 120], dur: 0.8 }], t); SND.play('stat'); }
      else if (ev.kind === 'stunned') { A.fx(spec, [{ who: 1, kind: 'text', text: 'ZZZ', col: [255, 240, 160], dur: 0.8 }], t); }
      else if (ev.kind === 'charge') { A.fx(spec, [{ who: 1, kind: 'charge', dur: 0.9 }], t); SND.play('warn'); }
      else if (ev.kind === 'stumble') { A.fx(spec, [{ who: 0, kind: 'text', text: '!', col: [255, 255, 255], dur: 0.6 }], t); }
      addLine(G.combat.narrate(ev, b), ev.who === 'foe' && ev.hit ? 'bad' : ev.who === 'hero' && (ev.hit || ev.kind === 'heal') ? 'good' : '');
      bars();
      await wait(620);
    }
  }
  async function narratedFlow(token) {
    const b = battle, CB = G.combat;
    addLine(CB.cap(b.e.name) + ' encara você. A luta começa.');
    const ps = CB.postures(S).map((p) => Object.assign({}, p, { chance: CB.hitChance(S, p.stat, b.e.pow, 0) }));
    const p = await ask2('Como você vai lutar?', ps);
    if (token !== bToken) return;
    b.posture = p.id;
    await play(CB.round(S, b), token);
    if (!b.over) await play(CB.round(S, b), token);
    if (!b.over && token === bToken) {
      const d = CB.decision(S, b);
      const o = await ask2(CB.decisionText(d, b), d.opts.map((x) => Object.assign({}, x, { chance: x.stat ? CB.hitChance(S, x.stat, b.e.pow, 0) : null })));
      if (token !== bToken) return;
      await play(CB.decide(S, b, o.id), token);
    }
    if (!b.over) await play(CB.round(S, b), token);
    CB.conclude(S, b);
    if (token === bToken) finishCombat();
  }
  async function bossLoop(token) {
    const b = battle, CB = G.combat;
    addLine(CB.cap(b.e.name) + ' se ergue diante de você. É uma luta de vida ou morte.');
    while (!b.over && token === bToken) {
      const o = await ask2(b.charge ? CB.cap(b.e.name) + ' está prestes a desferir um golpe terrível!' : 'Sua vez.', CB.bossActions(S, b));
      if (token !== bToken) return;
      await play(CB.bossTurn(S, b, o.id), token);
    }
    if (token === bToken) finishCombat();
  }
  async function finishCombat() {
    const b = battle, CB = G.combat;
    const end = { win: 'Vitória!', lose: 'Você caiu.', flee: CB.cap(b.e.name) + ' foge.', spare: 'A luta termina.', retreat: 'Você recua.' }[b.result];
    addLine(end, b.result === 'win' ? 'good' : b.result === 'lose' ? 'bad' : '');
    if (b.result === 'win') { A.fx(spec, [{ who: 1, kind: 'hit', dur: 0.8 }], nowT()); SND.play('victory'); }
    await wait(900);
    res = G.choose(S, cur, b.idx, CB.resultOpts(S, b));
    res.lines = b.lines.slice();
    res.result = b.result;
    battle = null;
    phase = 'result';
    render();
  }

  function resultSounds() {
    const c = res.chips, q = [];
    if (res.dead) q.push('death');
    else {
      if (res.ok === true) q.push('ok'); else if (res.ok === false) q.push('fail');
      if (c.some((x) => x.k === 'title')) q.push('title');
      if (c.some((x) => x.k === 'item')) q.push('item');
      if (c.some((x) => x.k === 'gold')) q.push('coin');
      if (c.some((x) => x.k === 'travel')) q.push('travel');
      if (c.some((x) => /Vida/.test(x.t) && x.k === 'bad')) q.push('hurt');
      else if (c.some((x) => /Vida/.test(x.t) && x.k === 'ok')) q.push('heal');
      if (!q.length && c.some((x) => x.k === 'ok')) q.push('stat');
    }
    q.slice(0, 3).forEach((n, i) => setTimeout(() => SND.play(n), i * 280));
  }

  /* ---------------- subir de nível ---------------- */
  function levelUp(done) {
    if (!S.pts) { if (done) done(); return; }
    SND.play('title');
    const keys = Object.keys(G.STATS), add = {};
    keys.forEach((k) => (add[k] = 0));
    const total = S.pts;
    const left = () => total - keys.reduce((a, k) => a + add[k], 0);
    const div = modal(`
      <h3>${ic('star')} Nível ${S.lvl}!</h3>
      <p class="lv-sub">Distribua <b id="left">${total}</b> ${total === 1 ? 'ponto' : 'pontos'} entre os atributos.</p>
      <div class="lv-grid">${keys.map((k) => `<div class="stat lv-row">${ic(k)}<span>${G.STATS[k]}</span><b id="v_${k}">${S.st[k]}</b>
        <button class="mini" data-k="${k}" data-d="-1" aria-label="tirar">−</button><button class="mini" data-k="${k}" data-d="1" aria-label="pôr">+</button></div>`).join('')}</div>
      <nav class="opts"><button class="opt" id="lvok" disabled>${ic('orn', 'orn')}<span>Confirmar</span></button>
      <button class="opt" id="lvlater">${ic('orn', 'orn')}<span>Decidir depois</span></button></nav>`);
    const upd = () => {
      for (const k of keys) {
        div.querySelector('#v_' + k).textContent = S.st[k] + add[k];
        div.querySelector('#v_' + k).className = add[k] ? 'up' : '';
        div.querySelector(`[data-k="${k}"][data-d="-1"]`).disabled = !add[k];
        div.querySelector(`[data-k="${k}"][data-d="1"]`).disabled = !left() || S.st[k] + add[k] >= 20;
      }
      div.querySelector('#left').textContent = left();
      div.querySelector('#lvok').disabled = left() > 0;
    };
    div.querySelectorAll('.mini').forEach((b) => b.addEventListener('click', () => { add[b.dataset.k] += +b.dataset.d; SND.play('select'); upd(); }));
    on('#lvok', () => {
      for (const k of keys) for (let i = 0; i < add[k]; i++) G.spend(S, k);
      G.saveGame(S); SND.play('stat'); div.remove(); if (done) done();
    }, div);
    on('#lvlater', () => { SND.play('select'); div.remove(); if (done) done(); }, div);
    upd();
  }

  function sheet() {
    SND.play('page');
    const ppl = [
      ['Pai', S.ppl.pai, !S.f.o_orfao && !S.f.o_templo], ['Mãe', S.ppl.mae, !S.f.o_orfao && !S.f.o_templo],
      ['Irmão(ã)', S.ppl.irmao, S.f.irmao], ['Amigo(a)', S.ppl.amigo, S.f.amigo], ['Rival', S.ppl.rival, S.f.rival || S.f.rival_odio],
      ['Mentor(a)', S.ppl.mentor, S.f.mentor], ['Amor', S.ppl.amor, S.ppl.amor && !S.f.casado], ['Cônjuge', S.ppl.conjuge, S.f.casado],
      ['Filho(a)', S.ppl.filho, S.ppl.filho], ['Cão', S.ppl.cao, S.f.cao && !S.f.cao_morto], ['Cavalo', S.ppl.cavalo, S.f.cavalo],
    ].filter((p) => p[2] && p[1]);
    const div = modal(`
      <div class="pc-head">
        <div class="frame"><canvas class="px portrait big" id="mpcv"></canvas></div>
        <div><div class="big-name">${esc(S.name)} ${esc(S.sur)}</div>
          <div class="muted">${S.age} anos · ${S.job ? G.JOBS[S.job] : 'sem ofício'}</div>
          <div class="muted"><i>${esc(S.originName)}</i></div>
          <div class="chips">${S.traits.map((t) => `<span class="chip info">${esc(G.traitName(t))}</span>`).join('')}</div></div>
      </div>
      <h4>Nível ${S.lvl}</h4>
      <div class="xpline big"><div class="xpbar"><div style="width:${Math.round((100 * S.xp) / G.xpNeed(S.lvl))}%"></div></div><span class="muted">${S.xp}/${G.xpNeed(S.lvl)} exp</span></div>
      ${S.pts ? `<nav class="opts"><button class="opt" id="lvup2">${ic('star', 'orn')}<span>Distribuir ${S.pts} pontos</span></button></nav>` : ''}
      <h4>Atributos</h4>
      <div class="stats-grid">${Object.keys(G.STATS).map((k) => `<div class="stat">${ic(k)}<span>${G.STATS[k]}</span><b>${G.stat(S, k)}</b></div>`).join('')}</div>
      <h4>Inventário</h4>
      ${S.items.length ? S.items.map((i) => `<div class="li">${ic('item')}${esc(i.n)} ${i.b ? `<small>(${i.b > 0 ? '+' : ''}${i.b} ${ABR[i.s]})</small>` : ''}</div>`).join('') : '<div class="li muted"><i>Nada além da roupa do corpo.</i></div>'}
      <h4>Títulos</h4>
      ${S.titles.length ? S.titles.map((t) => `<div class="li">${ic('title')}${esc(t)}</div>`).join('') : '<div class="li muted"><i>Nenhum ainda.</i></div>'}
      <h4>Pessoas</h4>
      ${ppl.length ? ppl.map((p) => `<div class="li"><span class="lbl">${p[0]}</span>${esc(p[1])}</div>`).join('') : '<div class="li muted"><i>Ninguém.</i></div>'}
      <h4>Mundo</h4>
      <div class="li">${esc(S.world.kingdom)} — governante: ${esc(S.world.king)}</div>
      ${S.world.regions.map((r, i) => `<div class="li">${i === S.reg ? ic('travel') : '<span class="dot">·</span>'}${esc(r.name)}</div>`).join('')}
      <nav class="opts"><button class="opt" id="close">${ic('orn', 'orn')}<span>Fechar</span></button></nav>`);
    A.portraitCanvas(div.querySelector('#mpcv'), S);
    on('#close', () => { SND.play('select'); div.remove(); }, div);
    on('#lvup2', () => { div.remove(); levelUp(phase === 'choose' && cur ? render : null); }, div);
  }

  function logHtml(s) {
    return s.log.map((l) => `
      <div class="entry">
        <div class="age">${l.age} anos</div>
        <div class="ev">${esc(l.ev)}</div>
        <div class="ch">» ${esc(l.ch)}</div>
        <div class="res">${esc(l.res)}</div>
        ${l.chips && l.chips.length ? `<div class="chips">${chipsHtml(l.chips)}</div>` : ''}
      </div>`).join('') || '<div class="li muted"><i>Sua história começa aqui.</i></div>';
  }
  function diary() {
    SND.play('page');
    const div = modal(`<h3>Diário de ${esc(S.name)}</h3><div class="log">${logHtml(S)}</div>
      <nav class="opts"><button class="opt" id="close">${ic('orn', 'orn')}<span>Fechar</span></button></nav>`);
    const lg = div.querySelector('.log'); lg.scrollTop = lg.scrollHeight;
    on('#close', () => { SND.play('select'); div.remove(); }, div);
  }

  /* ---------------- morte ---------------- */
  function death() {
    const d = G.discovery(), sc = G.score(S), dead = S;
    G.saveGame(null);
    SND.music('morte', seedOf(dead));
    screen(`
      <div class="vignette"><canvas class="px" id="gcv"></canvas></div>
      <div class="tomb">
        <div class="pc-head">
          <div class="frame"><canvas class="px portrait" id="dpcv"></canvas></div>
          <div style="text-align:left"><div class="big-name">${esc(dead.name)} ${esc(dead.sur)}</div>
          <div class="muted">${dead.job ? G.JOBS[dead.job] + ' · ' : ''}${dead.age} anos</div></div>
        </div>
        <p class="epitaph">Aqui jaz quem partiu por ${esc(G.fill(dead.cause || 'causas desconhecidas', dead, {}))}.</p>
        ${dead.titles.length ? `<div class="chips center">${dead.titles.map((t) => `<span class="chip title">${ic('title')}${esc(t)}</span>`).join('')}</div>` : ''}
        <div class="stats3" style="width:100%">
          <div><b>${sc}</b><span>pontos</span></div>
          <div><b>${dead.gold}</b><span>ouro</span></div>
          <div><b>${dead.log.length}</b><span>eventos</span></div>
        </div>
        <p class="muted" style="font-size:.85rem"><i>Eventos descobertos: ${d.seen}/${d.total} · Variações: ${d.proc}</i></p>
      </div>
      ${rule()}
      <nav class="opts">
        <button class="opt" id="again">${ic('orn', 'orn')}<span><b>Viver outra vida</b></span></button>
        <button class="opt" id="read">${ic('orn', 'orn')}<span>Reler esta história</span></button>
        <button class="opt" id="tomenu">${ic('orn', 'orn')}<span>Menu</span></button>
      </nav>`, 'death');
    const cv = $('#gcv');
    A.renderGrave(cv, dead, 0);
    animate([{ cv, draw: (c, t) => A.renderGrave(c, dead, t) }]);
    A.portraitCanvas($('#dpcv'), dead);
    on('#again', () => { SND.play('confirm'); creation(); });
    on('#read', () => { SND.play('page'); const m = modal(`<h3>A vida de ${esc(dead.name)}</h3><div class="log">${logHtml(dead)}</div><nav class="opts"><button class="opt" id="close">${ic('orn', 'orn')}<span>Fechar</span></button></nav>`); on('#close', () => m.remove(), m); });
    on('#tomenu', () => { SND.play('select'); menu(); });
  }

  /* ---------------- crônicas ---------------- */
  function gallery() {
    const m = G.meta, d = G.discovery();
    const titles = Object.keys(m.titles);
    const causes = Object.entries(m.causes).sort((a, b) => b[1] - a[1]).slice(0, 8);
    screen(`
      <h2 class="banner">Crônicas</h2>
      <p class="subtitle">Tudo o que suas vidas deixaram para trás</p>
      ${rule()}
      <div>
        <div class="row"><span class="lbl">Vidas vividas</span><span class="sp"></span><b>${m.runs}</b></div>
        <div class="row"><span class="lbl">Melhor vida</span><span class="sp"></span><span>${m.best ? esc(m.best.name) + ' · ' + m.best.score + ' pts' : '—'}</span></div>
        <div class="row"><span class="lbl">Eventos</span><span class="sp"></span><b>${d.seen}/${d.total}</b></div>
        <div class="progress"><div style="width:${Math.round((100 * d.seen) / d.total)}%"></div></div>
        <div class="row"><span class="lbl">Variações</span><span class="sp"></span><b>${d.proc}</b></div>
        <h4>Títulos (${titles.length})</h4>
        ${titles.length ? `<div class="chips">${titles.map((t) => `<span class="chip title">${ic('title')}${esc(t)}</span>`).join('')}</div>` : '<div class="li muted"><i>Nenhum ainda.</i></div>'}
        <h4>Como suas vidas terminaram</h4>
        ${causes.length ? causes.map(([c, n]) => `<div class="li">${esc(c)} <small>×${n}</small></div>`).join('') : '<div class="li muted"><i>Ninguém morreu ainda.</i></div>'}
      </div>
      ${rule()}
      <nav class="opts">
        <button class="opt" id="back">${ic('orn', 'orn')}<span>Voltar</span></button>
        <button class="opt danger" id="reset">${ic('orn', 'orn')}<span>Apagar todo o progresso</span></button>
      </nav>`, 'gallery');
    on('#back', () => { SND.play('select'); menu(); });
    on('#reset', () => { SND.play('select'); ask('Apagar todas as crônicas e descobertas? Isso não pode ser desfeito.', () => { G.resetMeta(); G.saveGame(null); gallery(); }); });
  }

  app.addEventListener('pointerover', (e) => { const o = e.target.closest && e.target.closest('.opt'); if (o && e.pointerType === 'mouse' && o !== app._hov) { app._hov = o; SND.play('select'); } });

  // botão "voltar" do Android (app via Capacitor)
  const cap = globalThis.Capacitor;
  const isApp = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  if (isApp && cap.Plugins && cap.Plugins.App) {
    cap.Plugins.App.addListener('backButton', () => {
      const m = app.querySelector('.modal');
      if (m) { SND.play('select'); m.remove(); return; }
      if (app.querySelector('.screen.menu')) { cap.Plugins.App.exitApp(); return; }
      SND.play('select');
      menu();
    });
  }

  menu();
  if (!isApp && 'serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();

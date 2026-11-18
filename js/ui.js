/* Mil Vidas — interface (telas, botões, ficha do personagem). */
(function () {
  'use strict';
  const G = globalThis.G;
  const app = document.getElementById('app');
  const ABR = { for: 'FOR', agi: 'AGI', int: 'INT', car: 'CAR', sor: 'SOR' };
  const ICON = { for: '💪', agi: '🪶', int: '📜', car: '🎭', sor: '🍀' };
  let S = null, cur = null, phase = 'choose', res = null;

  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (sel) => app.querySelector(sel);
  const on = (sel, fn) => app.querySelectorAll(sel).forEach((el) => el.addEventListener('click', fn));
  const chipsHtml = (chips) => (chips || []).map((c) => `<span class="chip ${c.k}">${esc(c.t)}</span>`).join('');

  /* ---------------- Menu ---------------- */
  function menu() {
    const d = G.discovery();
    const save = G.loadGame();
    const m = G.meta;
    app.innerHTML = `
      <div class="screen menu">
        <div class="logo">
          <div class="sigil">✦</div>
          <h1>Mil Vidas</h1>
          <p class="tag">Cada vida, uma história diferente.</p>
        </div>
        <div class="menu-btns">
          ${save ? `<button class="btn primary" id="cont">Continuar a vida de ${esc(save.name)} (${save.age} anos)</button>` : ''}
          <button class="btn ${save ? '' : 'primary'}" id="new">Nova vida</button>
          <button class="btn ghost" id="gal">Crônicas</button>
        </div>
        <div class="stats-mini">
          <div><b>${m.runs}</b><span>vidas vividas</span></div>
          <div><b>${d.seen}/${d.total}</b><span>eventos descobertos</span></div>
          <div><b>${d.proc}</b><span>situações procedurais</span></div>
        </div>
      </div>`;
    on('#new', () => { if (!save || confirm('Começar uma nova vida? A vida atual será perdida.')) creation(); });
    on('#cont', () => { S = save; next(); });
    on('#gal', gallery);
  }

  /* ---------------- Criação ---------------- */
  function creation() {
    S = G.newLife();
    const st = Object.keys(G.STATS).map((k) => `<div class="stat"><span>${ICON[k]} ${G.STATS[k]}</span><b>${S.st[k]}</b></div>`).join('');
    app.innerHTML = `
      <div class="screen create">
        <h2>Uma nova vida começa</h2>
        <div class="card">
          <div class="big-name">${esc(S.name)} ${esc(S.sur)}</div>
          <div class="row"><span class="lbl">Origem</span><span>${esc(S.originName)}</span></div>
          <div class="row"><span class="lbl">Traços</span><span>${S.traits.map((t) => `<span class="chip info">${esc(G.traitName(t))}</span>`).join(' ')}</span></div>
          <div class="row"><span class="lbl">Terra natal</span><span>${esc(S.world.homeTown)}, ${esc(S.world.regions[0].name)}</span></div>
          <div class="row"><span class="lbl">Reino</span><span>${esc(S.world.kingdom)}</span></div>
          <div class="row"><span class="lbl">Deuses</span><span>${S.world.gods.map((g) => esc(g.nome) + ' <i>' + esc(g.dom) + '</i>').join(', ')}</span></div>
          <div class="stats-grid">${st}</div>
          <div class="row"><span class="lbl">Vida</span><span>${S.maxHp} ❤</span><span class="lbl" style="margin-left:auto">Ouro</span><span>${S.gold} 🪙</span></div>
        </div>
        <div class="menu-btns">
          <button class="btn primary" id="go">Nascer</button>
          <button class="btn" id="re">Sortear outra vida</button>
          <button class="btn ghost" id="back">Voltar</button>
        </div>
      </div>`;
    on('#go', next);
    on('#re', creation);
    on('#back', menu);
  }

  /* ---------------- Jogo ---------------- */
  function next() {
    if (!S.alive) return death();
    cur = G.next(S);
    phase = 'choose';
    res = null;
    render();
  }

  function header() {
    const pct = Math.max(0, Math.round((S.hp / S.maxHp) * 100));
    const stats = Object.keys(G.STATS).map((k) => {
      const v = G.stat(S, k);
      const bonus = v - S.st[k];
      return `<div class="st" title="${G.STATS[k]}"><small>${ABR[k]}</small><b>${v}${bonus ? `<sup>${bonus > 0 ? '+' : ''}${bonus}</sup>` : ''}</b></div>`;
    }).join('');
    return `
      <header class="hud">
        <div class="hud-top">
          <button class="who" id="sheet">
            <span class="nm">${esc(S.name)} ${esc(S.sur)}</span>
            <span class="sub">${S.age} anos · ${esc(G.stageName(S))}${S.job ? ' · ' + G.JOBS[S.job] : ''}</span>
          </button>
          <div class="gold">🪙 ${S.gold}</div>
        </div>
        <div class="hp"><div class="hp-bar" style="width:${pct}%"></div><span>❤ ${Math.max(0, S.hp)}/${S.maxHp}</span></div>
        <div class="hud-stats">${stats}</div>
        <div class="where">🧭 ${esc(G.region(S).name)}</div>
      </header>`;
  }

  function logHtml() {
    const items = S.log.slice(-40).map((l) => `
      <div class="entry">
        <div class="age">${l.age} anos</div>
        <div class="ev">${esc(l.ev)}</div>
        <div class="ch">➜ ${esc(l.ch)}</div>
        <div class="res">${esc(l.res)}</div>
        ${l.chips && l.chips.length ? `<div class="chips">${chipsHtml(l.chips)}</div>` : ''}
      </div>`).join('');
    return items || '<div class="entry empty">Sua história começa aqui.</div>';
  }

  function render() {
    let body;
    if (phase === 'choose') {
      const cs = G.choices(S, cur);
      body = `
        <div class="card event ${cur.proc ? 'proc' : ''}">
          <div class="age-tag">${S.age} anos</div>
          <p>${esc(cur.text)}</p>
        </div>
        <div class="choices">
          ${cs.map((c, i) => {
            const ck = G.check(S, c, cur.ctx);
            let badge = '';
            if (ck) {
              const p = Math.round(G.chance(S, ck) * 100);
              const cls = p >= 65 ? 'easy' : p >= 40 ? 'mid' : 'hard';
              badge = `<span class="badge ${cls}">${ICON[ck.s]} ${ABR[ck.s]} ${p}%</span>`;
            }
            return `<button class="btn choice" data-i="${i}"><span>${esc(G.fill(c.t, S, cur.ctx))}</span>${badge}</button>`;
          }).join('')}
        </div>`;
    } else {
      const last = S.log[S.log.length - 1];
      body = `
        <div class="card event result">
          <div class="age-tag">${last.age} anos · ${esc(last.ch)}</div>
          <p>${esc(res.text)}</p>
          <div class="chips">${chipsHtml(res.chips)}</div>
        </div>
        <div class="choices"><button class="btn primary" id="cont">${S.alive ? 'Continuar' : 'Fim da jornada…'}</button></div>`;
    }
    app.innerHTML = `
      <div class="screen game">
        ${header()}
        <main class="story" id="story">${logHtml()}</main>
        <section class="now">${body}</section>
      </div>`;
    const story = $('#story');
    story.scrollTop = story.scrollHeight;
    on('#sheet', sheet);
    on('.choice', (e) => {
      const i = +e.currentTarget.dataset.i;
      res = G.choose(S, cur, i);
      phase = 'result';
      render();
    });
    on('#cont', next);
  }

  /* ---------------- Ficha ---------------- */
  function sheet() {
    const ppl = [
      ['Pai', S.ppl.pai, !S.f.o_orfao && !S.f.o_templo], ['Mãe', S.ppl.mae, !S.f.o_orfao && !S.f.o_templo],
      ['Irmão(ã)', S.ppl.irmao, S.f.irmao], ['Melhor amigo(a)', S.ppl.amigo, S.f.amigo], ['Rival', S.ppl.rival, S.f.rival || S.f.rival_odio],
      ['Mentor(a)', S.ppl.mentor, S.f.mentor], ['Amor', S.ppl.amor, S.ppl.amor && !S.f.casado], ['Cônjuge', S.ppl.conjuge, S.f.casado],
      ['Filho(a)', S.ppl.filho, S.ppl.filho], ['Cão', S.ppl.cao, S.f.cao && !S.f.cao_morto], ['Cavalo', S.ppl.cavalo, S.f.cavalo],
    ].filter((p) => p[2] && p[1]);
    const div = document.createElement('div');
    div.className = 'modal';
    div.innerHTML = `
      <div class="sheet card">
        <h3>${esc(S.name)} ${esc(S.sur)}</h3>
        <div class="row"><span class="lbl">Origem</span><span>${esc(S.originName)}</span></div>
        <div class="row"><span class="lbl">Ofício</span><span>${S.job ? G.JOBS[S.job] : '—'}</span></div>
        <div class="row"><span class="lbl">Traços</span><span>${S.traits.map((t) => `<span class="chip info">${esc(G.traitName(t))}</span>`).join(' ')}</span></div>
        <h4>Atributos</h4>
        <div class="stats-grid">${Object.keys(G.STATS).map((k) => `<div class="stat"><span>${ICON[k]} ${G.STATS[k]}</span><b>${G.stat(S, k)}</b></div>`).join('')}</div>
        <h4>Inventário</h4>
        ${S.items.length ? S.items.map((i) => `<div class="li">🎒 ${esc(i.n)} ${i.b ? `<small>(${i.b > 0 ? '+' : ''}${i.b} ${G.STATS[i.s]})</small>` : ''}</div>`).join('') : '<div class="li muted">Nada além da roupa do corpo.</div>'}
        <h4>Títulos</h4>
        ${S.titles.length ? S.titles.map((t) => `<div class="li">🏅 ${esc(t)}</div>`).join('') : '<div class="li muted">Nenhum ainda.</div>'}
        <h4>Pessoas</h4>
        ${ppl.length ? ppl.map((p) => `<div class="li"><span class="lbl">${p[0]}</span> ${esc(p[1])}</div>`).join('') : '<div class="li muted">Ninguém.</div>'}
        <h4>Mundo</h4>
        <div class="li">${esc(S.world.kingdom)}, governado por ${esc(S.world.king)}</div>
        ${S.world.regions.map((r, i) => `<div class="li">${i === S.reg ? '📍' : '·'} ${esc(r.name)}</div>`).join('')}
        <div class="menu-btns">
          <button class="btn" id="close">Fechar</button>
          <button class="btn ghost" id="tomenu">Menu principal</button>
        </div>
      </div>`;
    app.appendChild(div);
    div.querySelector('#close').onclick = () => div.remove();
    div.querySelector('#tomenu').onclick = () => { div.remove(); menu(); };
    div.addEventListener('click', (e) => { if (e.target === div) div.remove(); });
  }

  /* ---------------- Morte ---------------- */
  function death() {
    const d = G.discovery();
    const sc = G.score(S);
    G.saveGame(null);
    app.innerHTML = `
      <div class="screen death">
        <div class="tomb card">
          <div class="rip">✝</div>
          <div class="big-name">${esc(S.name)} ${esc(S.sur)}</div>
          <div class="epi">${S.job ? G.JOBS[S.job] + ' · ' : ''}${S.age} anos</div>
          <p class="cause"><span class="lbl">Causa da morte</span><br>${esc(G.fill(S.cause || 'causas desconhecidas', S, {}))}</p>
          ${S.titles.length ? `<div class="chips center">${S.titles.map((t) => `<span class="chip gold">🏅 ${esc(t)}</span>`).join('')}</div>` : ''}
          <div class="stats-mini">
            <div><b>${sc}</b><span>pontos</span></div>
            <div><b>${S.gold}</b><span>ouro</span></div>
            <div><b>${S.log.length}</b><span>eventos</span></div>
          </div>
          <p class="disc">Eventos descobertos: <b>${d.seen}/${d.total}</b> · Situações procedurais: <b>${d.proc}</b></p>
        </div>
        <details class="card recap"><summary>Reler a história desta vida</summary>${logHtml()}</details>
        <div class="menu-btns">
          <button class="btn primary" id="again">Viver outra vida</button>
          <button class="btn ghost" id="tomenu">Menu</button>
        </div>
      </div>`;
    on('#again', creation);
    on('#tomenu', menu);
  }

  /* ---------------- Crônicas ---------------- */
  function gallery() {
    const m = G.meta, d = G.discovery();
    const titles = Object.keys(m.titles);
    const causes = Object.entries(m.causes).sort((a, b) => b[1] - a[1]).slice(0, 8);
    app.innerHTML = `
      <div class="screen gallery">
        <h2>Crônicas</h2>
        <div class="card">
          <div class="row"><span class="lbl">Vidas vividas</span><b>${m.runs}</b></div>
          <div class="row"><span class="lbl">Melhor vida</span><span>${m.best ? esc(m.best.name) + ' — ' + m.best.score + ' pts (' + m.best.age + ' anos)' : '—'}</span></div>
          <div class="row"><span class="lbl">Eventos descobertos</span><b>${d.seen}/${d.total}</b></div>
          <div class="progress"><div style="width:${Math.round((100 * d.seen) / d.total)}%"></div></div>
          <div class="row"><span class="lbl">Situações procedurais vistas</span><b>${d.proc}</b></div>
          <h4>Títulos conquistados (${titles.length})</h4>
          ${titles.length ? `<div class="chips">${titles.map((t) => `<span class="chip gold">${esc(t)}</span>`).join('')}</div>` : '<div class="li muted">Nenhum ainda.</div>'}
          <h4>Como suas vidas terminaram</h4>
          ${causes.length ? causes.map(([c, n]) => `<div class="li">${esc(c)} <small>×${n}</small></div>`).join('') : '<div class="li muted">Ninguém morreu ainda.</div>'}
        </div>
        <div class="menu-btns">
          <button class="btn" id="back">Voltar</button>
          <button class="btn ghost danger" id="reset">Apagar todo o progresso</button>
        </div>
      </div>`;
    on('#back', menu);
    on('#reset', () => { if (confirm('Apagar todas as crônicas e descobertas?')) { G.resetMeta(); G.saveGame(null); gallery(); } });
  }

  menu();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();

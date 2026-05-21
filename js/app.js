/**
 * BAUM Festival 11 - Complete Application Module
 * TODO - Este archivo contiene toda la lógica. Luego se puede dividir en más módulos
 */

import { STAGES_LIST, LINEUP, LINEUP_DAY23 } from './config.js';
import {
  saved, curTab, curStage, stageFilter, hintGone, swipeListenersAttached,
  mockTime, isMockActive, contentUpdateInterval, festivalDay,
  updateSavedState
} from './state.js';
import {
  getLineupForDay, getEventMinutes, toMin, isNow, isUp, pct, remMin, elMin,
  fmtMin, fmtClock, getCurrentMinutes, stageColor, hasConflict, getConflictingArtist
} from './helpers.js';

// Export functions for global scope
window.goTab = goTab;
window.changeFestivalDay = changeFestivalDay;
window.toggleSave = toggleSave;
window.setSF = setSF;
window.goNowStage = goNowStage;
window.openLegalModal = openLegalModal;
window.closeLegalModal = closeLegalModal;
window.openTestMenu = openTestMenu;
window.closeTestMenu = closeTestMenu;
window.setMockTime = setMockTime;
window.disableMock = disableMock;
window.onClockClick = onClockClick;
window.adjustSimTime = adjustSimTime;
window.hideConflictToast = hideConflictToast;

// ═══════════════════════════════ RENDERIZADO ═══════════════════════════════

function progressHTML(a, si) {
  let p = pct(a), rem = remMin(a), el = elMin(a);
  let barW = Math.max(2, p);
  let sid = si !== undefined ? si : '';
  return `<div class="prog-block"><div class="prog-top-row"><div class="prog-side"><div class="prog-time-big">${a.start}</div><div class="prog-time-micro">Inicio</div></div><div class="prog-center-block"><div class="prog-rem-num" id="pr-rem-${sid}">${fmtMin(rem)}</div><div class="prog-rem-lbl">restantes</div></div><div class="prog-side right"><div class="prog-time-big">${a.end}</div><div class="prog-time-micro">Fin</div></div></div><div class="prog-bar-outer"><div class="prog-bar-inner" id="pr-bar-${sid}" style="width:${barW}%"></div></div><div class="prog-bottom-row"><span class="prog-bot-txt" id="pr-el-${sid}">${fmtMin(el)} tocado</span><span class="prog-pct-pill" id="pr-pct-${sid}">${p}%</span><span class="prog-bot-txt" id="pr-remb-${sid}">${fmtMin(rem)} restante</span></div></div>`;
}

function countdownHTML(a, si) {
  let timeUntilStart = Math.max(0, getEventMinutes(a.start));
  let sid = si !== undefined ? si : '';
  return `<div class="prog-block"><div class="prog-top-row"><div class="prog-side"><div class="prog-time-big">${a.start}</div><div class="prog-time-micro">Inicia</div></div><div class="prog-center-block"><div class="prog-rem-num" id="cd-rem-${sid}">${fmtMin(timeUntilStart)}</div><div class="prog-rem-lbl">para comenzar</div></div><div class="prog-side right"><div class="prog-time-big">${a.end}</div><div class="prog-time-micro">Fin</div></div></div></div>`;
}

function renderNow() {
  let views = '';
  STAGES_LIST.forEach((st, si) => {
    let acts = getLineupForDay().filter(a => a.stage === st.name);
    let nowA = acts.find(a => isNow(a));
    let upA = acts.filter(a => isUp(a)).sort((a,b) => toMin(a.start) - toMin(b.start));
    let heroHTML = '';
    let displayArtist = nowA || upA[0];
    let isLive = !!nowA;
    if (displayArtist) {
      let sv = saved.has(displayArtist.id);
      heroHTML = `<div class="hero"><div class="hero-shine"></div><div class="hero-grid"></div><div class="hero-top"><div class="live-pill"><div class="live-dot ${isLive ? '' : 'inactive'}"></div><span class="live-txt">${isLive ? 'En escena' : 'Próximo'}</span></div><button class="hero-save-btn" data-artist-id="${displayArtist.id}" onclick="toggleSave(${displayArtist.id})"><i class="ti ${sv ? 'ti-heart-filled' : 'ti-heart'}"></i></button></div><div class="hero-name">${displayArtist.name}${displayArtist.extra ? `<span class="hero-extra">${displayArtist.extra}</span>` : ''}</div><div class="hero-sub">${st.name} · ${displayArtist.start} → ${displayArtist.end}</div><div class="hero-tags">${displayArtist.tags.map(t => `<span class="hero-tag">${t}</span>`).join('')}</div>${isLive ? progressHTML(displayArtist, si) : countdownHTML(displayArtist, si)}</div>`;
    } else {
      heroHTML = `<div class="hero hero-empty"><div class="hero-top"><div class="live-pill" style="background:rgba(255,184,208,.08)"><div style="width:7px;height:7px;border-radius:50%;background:rgba(255,184,208,.25)"></div><span class="live-txt" style="color:rgba(255,184,208,.35)">Festival finalizado</span></div></div><div class="hero-name" style="font-size:32px;color:rgba(255,184,208,.3);margin:10px 0 6px">–</div><div class="hero-sub" style="color:rgba(255,184,208,.25)">No hay más artistas en este escenario</div></div>`;
    }
    let nextHTML = '';
    let allArtistsWithStatus = acts.map(a => ({artist:a,isPassed:getEventMinutes(a.end) < 0}));
    allArtistsWithStatus.sort((a, b) => {if (a.isPassed && !b.isPassed) return 1; if (!a.isPassed && b.isPassed) return -1; return getEventMinutes(a.artist.start) - getEventMinutes(b.artist.start);});
    // Filter out the display artist to avoid duplication
    let filteredArtists = allArtistsWithStatus.filter(item => !displayArtist || item.artist.id !== displayArtist.id);
    if (filteredArtists.length) {
      nextHTML = `<div class="next-section-lbl">A continuación</div>`;
      filteredArtists.forEach(item => {let a = item.artist; let sv = saved.has(a.id); let classes = `ac ${sv ? 'sv' : ''} ${item.isPassed ? 'passed' : ''}`; nextHTML += `<div class="${classes}"><div class="ac-tb"><div class="ac-t">${a.start}</div><div class="ac-te">→${a.end}</div></div><div class="ac-b"><div class="ac-n">${a.name}</div><div class="ac-s">${a.tags.join(' · ')}</div></div><button class="ac-btn" data-artist-id="${a.id}" onclick="toggleSave(${a.id})"><i class="ti ${sv ? 'ti-heart-filled' : 'ti-heart'}"></i></button></div>`;});
    }
    views += `<div class="s-view" data-s="${si}">${heroHTML}${nextHTML}</div>`;
  });
  return `<div class="now-wrap"><div class="dots-row" id="dots"></div><div class="stage-name-lbl" id="snlbl">STAMM</div><div class="swipe-vp" id="svp"><div class="swipe-track" id="strk">${views}</div><div class="sw-hint" id="shint"><i class="ti ti-arrows-left-right" style="font-size:13px"></i> desliza entre escenarios</div></div></div>`;
}

function renderLineup() {
  const stagesOpts = ['Todos', ...STAGES_LIST.map(s => s.name)];
  let currentFilter = window.stageFilter || stageFilter || 'Todos';
  let pills = stagesOpts.map(s => `<button class="sf-pill ${currentFilter === s ? 'active' : ''}" onclick="setSF('${s}')">${s}</button>`).join('');
  let filtered = currentFilter === 'Todos' ? getLineupForDay() : getLineupForDay().filter(a => a.stage === currentFilter);
  let sorted = [...filtered].sort((a,b) => toMin(a.start) - toMin(b.start));
  let liveNow = getLineupForDay().filter(a => isNow(a));
  let groups = {};
  sorted.forEach(a => {let h = a.start.split(':')[0]; if (!groups[h]) groups[h] = []; groups[h].push(a);});
  let conflicts = [...saved].filter(id => hasConflict(getLineupForDay().find(a => a.id === id)));
  let liveBar = liveNow.length ? `<div class="live-now-bar"><span class="live-dot" style="width:7px;height:7px;border-radius:50%;background:var(--primary-accent);animation:blink 1.3s infinite;display:inline-block;margin-right:6px;vertical-align:middle"></span>${liveNow.length} set${liveNow.length > 1 ? 's' : ''} en vivo ahora</div>` : '';
  let body = liveBar;
  let hours = Object.keys(groups).sort((a,b) => {let ah = parseInt(a) < 15 ? parseInt(a)+24 : parseInt(a); let bh = parseInt(b) < 15 ? parseInt(b)+24 : parseInt(b); return ah - bh;});
  hours.forEach(h => {body += `<div class="time-divider"><span class="time-divider-lbl">${h}:00</span><div class="time-divider-line"></div></div>`; groups[h].forEach(a => {let sv = saved.has(a.id), np = isNow(a), conf = hasConflict(a); let sc = stageColor(a.stage); let stageSafe = a.stage.toLowerCase().replace(/\s+/g, '-'); let badges = ''; if (np) badges += `<span class="badge-live">En vivo · ${fmtMin(remMin(a))}</span>`; if (conf) badges += `<span class="badge-conflict">⚡ Conflicto</span>`; body += `<div class="lc ${sv ? 'sv' : ''} ${np ? 'np' : ''} stage-${stageSafe}" style="${np ? '--np-c:'+sc : ''}; --stage-border-color: ${sc}"><div class="lc-tb"><div class="lc-ts">${a.start}</div><div class="lc-te">→${a.end}</div></div><div class="lc-b"><div class="lc-n">${a.name}</div><div class="lc-stg" style="color:${sc}">${a.stage}</div><div class="lc-row">${badges}${a.tags.map(t => `<span class="lc-tag">${t}</span>`).join('')}</div></div><button class="lc-sv-btn ${sv ? 'on' : ''}" data-artist-id="${a.id}" onclick="toggleSave(${a.id})"><i class="ti ${sv ? 'ti-heart-filled' : 'ti-heart'}"></i></button></div>`;});});
  return `<div class="lineup-wrap"><div class="stage-filter-bar">${pills}</div><div class="lineup-list">${body}</div></div>`;
}

function renderAgenda() {
  if (!saved.size) {return `<div class="agenda-wrap"><div class="empty-state"><i class="ti ti-heart"></i><p>Nada guardado todavía.<br>Toca ♥ en cualquier artista<br>para armar tu lineup personal.</p></div></div>`;}

  let savedArtists = getLineupForDay().filter(a => saved.has(a.id)).sort((a,b) => toMin(a.start) - toMin(b.start));
  let liveNow = savedArtists.filter(a => isNow(a));

  let liveBar = liveNow.length ? `<div class="live-now-bar"><span class="live-dot" style="width:7px;height:7px;border-radius:50%;background:var(--primary-accent);animation:blink 1.3s infinite;display:inline-block;margin-right:6px;vertical-align:middle"></span>${liveNow.length} set${liveNow.length > 1 ? 's' : ''} en vivo ahora</div>` : '';
  let body = liveBar + `<div style="padding:12px 16px 8px;font-size:12px;color:rgba(255,184,208,.6)">Tu agenda guardada · ${saved.size} artista${saved.size>1?'s':''}</div>`;

  let groups = {};
  savedArtists.forEach(a => {let h = a.start.split(':')[0]; if (!groups[h]) groups[h] = []; groups[h].push(a);});
  let hours = Object.keys(groups).sort((a,b) => {let ah = parseInt(a) < 15 ? parseInt(a)+24 : parseInt(a); let bh = parseInt(b) < 15 ? parseInt(b)+24 : parseInt(b); return ah - bh;});

  hours.forEach(h => {
    body += `<div class="time-divider"><span class="time-divider-lbl">${h}:00</span><div class="time-divider-line"></div></div>`;
    groups[h].forEach(a => {
      let sv = saved.has(a.id), np = isNow(a), conf = hasConflict(a);
      let sc = stageColor(a.stage);
      let stageSafe = a.stage.toLowerCase().replace(/\s+/g, '-');
      let badges = '';
      if (np) badges += `<span class="badge-live">En vivo · ${fmtMin(remMin(a))}</span>`;
      if (conf) badges += `<span class="badge-conflict">⚡ Conflicto</span>`;
      body += `<div class="lc ${sv ? 'sv' : ''} ${np ? 'np' : ''} stage-${stageSafe}" style="${np ? '--np-c:'+sc : ''}; --stage-border-color: ${sc}"><div class="lc-tb"><div class="lc-ts">${a.start}</div><div class="lc-te">→${a.end}</div></div><div class="lc-b"><div class="lc-n">${a.name}</div><div class="lc-stg" style="color:${sc}">${a.stage}</div><div class="lc-row">${badges}${a.tags.map(t => `<span class="lc-tag">${t}</span>`).join('')}</div></div><button class="lc-sv-btn ${sv ? 'on' : ''}" data-artist-id="${a.id}" onclick="toggleSave(${a.id})"><i class="ti ${sv ? 'ti-heart-filled' : 'ti-heart'}"></i></button></div>`;
    });
  });

  return `<div class="lineup-wrap"><div class="lineup-list">${body}</div></div>`;
}

function renderStages() {
  let html = `<div class="stages-wrap"><div class="disclaimer-box">ℹ️ Información de escenarios sujeta a cambios. Consulta la web oficial para detalles.</div><div class="sec-lbl" style="padding-top:4px">Escenarios del festival</div>`;
  STAGES_LIST.forEach((st, si) => {
    let acts = getLineupForDay().filter(a => a.stage === st.name);
    let nowA = acts.find(a => isNow(a));
    let upA = acts.filter(a => isUp(a)).sort((a,b) => toMin(a.start) - toMin(b.start));
    let nextArtist = upA[0];
    let p = nowA ? pct(nowA) : 0;
    let rem = nowA ? remMin(nowA) : 0;
    let timeUntilNext = nextArtist ? Math.max(0, getEventMinutes(nextArtist.start)) : 0;
    let svHere = [...saved].filter(id => getLineupForDay().find(a => a.id === id && a.stage === st.name)).length;
    let status = nowA ? 'EN VIVO' : (nextArtist ? 'PRÓXIMO' : 'FINALIZADO');

    html += `<div class="stage-card" style="--stage-color:${st.color};background:${st.color}">
      <div class="sc-header">
        <div class="sc-title-group">
          <div class="sc-name">${st.name}</div>
          <div class="sc-desc">${st.desc}</div>
        </div>
        <div class="sc-status-badge ${status.toLowerCase()}">${status}</div>
      </div>
      <div class="sc-content">
        ${nowA ? `
          <div class="sc-now-playing">
            <div class="sc-artist-name">${nowA.name}</div>
            <div class="sc-progress">
              <div class="sc-progress-bar"><div class="sc-progress-fill" id="st-bar-${si}" style="width:${p}%"></div></div>
              <div class="sc-progress-text">${fmtMin(elMin(nowA))} tocado · ${fmtMin(rem)} restante (${p}%)</div>
            </div>
            <div class="sc-times"><span>${nowA.start}</span> - <span>${nowA.end}</span></div>
          </div>
        ` : (nextArtist ? `
          <div class="sc-next-playing">
            <div class="sc-next-label">Próximo artista</div>
            <div class="sc-artist-name">${nextArtist.name}</div>
            <div class="sc-next-time">En ${fmtMin(timeUntilNext)}</div>
            <div class="sc-times"><span>${nextArtist.start}</span> - <span>${nextArtist.end}</span></div>
          </div>
        ` : `
          <div class="sc-finished">
            <div class="sc-finished-text">Este escenario ha finalizado sus presentaciones</div>
          </div>
        `)}
      </div>
      ${svHere ? `<div class="sc-saved-info">♥ ${svHere} artista${svHere>1?'s':''} guardado${svHere>1?'s':''}</div>` : ''}
    </div>`;
  });
  return html;
}

// ═══════════════════════════════ FUNCIONES PRINCIPALES ═══════════════════════════════

function setDayStyles(day) {
  let dayAccent = day === 22 ? '#FF1E78' : '#00D9FF';
  let dayRgb = day === 22 ? '255,184,208' : '0,217,255';
  document.documentElement.style.setProperty('--primary-accent', dayAccent);
  document.documentElement.style.setProperty('--primary-light-rgb', dayRgb);
  document.documentElement.style.setProperty('--accent-live', dayAccent);
}

function changeFestivalDay(day) {
  window.festivalDay = day;
  window.curStage = 0;
  window.stageFilter = 'Todos';
  document.body.classList.remove('day-22', 'day-23');
  document.body.classList.add(`day-${day}`);
  setDayStyles(day);
  let dayName = day === 22 ? 'Vie 22' : 'Sab 23';
  let headerDate = document.getElementById('headerDate');
  if (headerDate) headerDate.textContent = dayName + ' · Mayo';
  document.querySelectorAll('.day-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(day.toString()));
  });
  const c = document.getElementById('content');
  if (c) {
    if (window.curTab === 'now') c.innerHTML = renderNow();
    else if (window.curTab === 'lineup') c.innerHTML = renderLineup();
    else if (window.curTab === 'agenda') c.innerHTML = renderAgenda();
    else if (window.curTab === 'stages') c.innerHTML = renderStages();
    if (window.curTab === 'now' || window.curTab === 'agenda') { window.swipeListenersAttached = false; initSwipe(); }
  }
  updateBadge();
}

function toggleSave(id) {
  let wasAdded = !saved.has(id);
  if (saved.has(id)) {
    saved.delete(id);
  } else {
    saved.add(id);
  }
  localStorage.setItem('baum_saved', JSON.stringify([...saved]));
  document.querySelectorAll(`[data-artist-id="${id}"] i`).forEach(icon => {
    if (saved.has(id)) {
      icon.className = 'ti ti-heart-filled';
      let btn = icon.closest('button');
      if (btn) {
        btn.classList.add('save-pop');
        setTimeout(() => btn.classList.remove('save-pop'), 350);
      }
    } else {
      icon.className = 'ti ti-heart';
    }
  });
  updateBadge();
  // Re-render current view to reflect changes, preserving stage/position and scroll
  if (window.curTab === 'agenda' || window.curTab === 'now' || window.curTab === 'lineup') {
    const c = document.getElementById('content');
    if (c) {
      let savedStage = window.curStage;
      // Capture scroll position of the active scroll container
      let scrollSelector = window.curTab === 'now' ? `.s-view[data-s="${savedStage}"]` : '.lineup-list';
      let scrollEl = c.querySelector(scrollSelector);
      let savedScroll = scrollEl ? scrollEl.scrollTop : 0;

      if (window.curTab === 'agenda') c.innerHTML = renderAgenda();
      else if (window.curTab === 'lineup') c.innerHTML = renderLineup();
      else if (window.curTab === 'now') c.innerHTML = renderNow();

      if (window.curTab === 'now') {
        window.swipeListenersAttached = false;
        initSwipe();
        // Restore the stage position after reinitializing swipe
        if (savedStage > 0) goNowStage(savedStage);
      }
      // Restore scroll position after re-render
      let newScrollEl = c.querySelector(scrollSelector);
      if (newScrollEl) newScrollEl.scrollTop = savedScroll;
    }
  }
  if (wasAdded) {
    let art = getLineupForDay().find(a => a.id === id);
    if (art) {
      let conflictingArtist = getConflictingArtist(art);
      if (conflictingArtist) {
        showConflictToast(art, conflictingArtist);
      }
    }
  }
}

function updateBadge() {
  let badge = document.getElementById('agenda-badge');
  if (badge) badge.textContent = saved.size ? `(${saved.size}) ` : '';
}

function goTab(tab) {
  window.curTab = tab;
  ['now','lineup','agenda','stages'].forEach((t, i) => {
    document.querySelectorAll('.tab')[i].classList.toggle('active', t === tab);
  });
  if (window.contentUpdateInterval) clearInterval(window.contentUpdateInterval);
  const c = document.getElementById('content');
  if (tab === 'now') c.innerHTML = renderNow();
  else if (tab === 'lineup') c.innerHTML = renderLineup();
  else if (tab === 'agenda') c.innerHTML = renderAgenda();
  else if (tab === 'stages') c.innerHTML = renderStages();
  if (tab === 'now') {
    window.swipeListenersAttached = false;
    initSwipe();
  }
  updateBadge();
}

function setSF(stage) {
  window.stageFilter = stage;
  const c = document.getElementById('content');
  if (c) c.innerHTML = renderLineup();
}

function goNowStage(si) {
  window.curStage = si;
  let currentStage = STAGES_LIST[si];
  if (currentStage) {
    let stageColor = currentStage.color;
    document.documentElement.style.setProperty('--primary-accent', stageColor);
    document.documentElement.style.setProperty('--primary-light-rgb', stageColor.includes('00D9FF') ? '0,217,255' : '255,184,208');
  }
  let snlbl = document.getElementById('snlbl');
  if (snlbl) snlbl.textContent = currentStage.name;
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === si));
  let strk = document.getElementById('strk');
  if (strk) strk.style.transform = `translateX(calc(-${si} * 100%))`;
}

function initSwipe() {
  if (window.swipeListenersAttached) return;
  window.swipeListenersAttached = true;
  let svp = document.getElementById('svp');
  if (!svp) return;
  let startX = 0, currentX = 0, isMouseDown = false;

  // Touch support
  svp.addEventListener('touchstart', e => {startX = e.touches[0].clientX; currentX = startX;}, {passive: true});
  svp.addEventListener('touchmove', e => {currentX = e.touches[0].clientX;}, {passive: true});
  svp.addEventListener('touchend', handleSwipeEnd);

  // Mouse support
  svp.addEventListener('mousedown', e => {isMouseDown = true; startX = e.clientX; currentX = startX;});
  svp.addEventListener('mousemove', e => {if (isMouseDown) currentX = e.clientX;});
  svp.addEventListener('mouseup', handleSwipeEnd);
  svp.addEventListener('mouseleave', () => {isMouseDown = false;});

  // Keyboard support
  document.addEventListener('keydown', e => {
    if (window.curTab === 'now' || window.curTab === 'agenda') {
      if (e.key === 'ArrowLeft' && window.curStage < STAGES_LIST.length - 1) goNowStage(window.curStage + 1);
      if (e.key === 'ArrowRight' && window.curStage > 0) goNowStage(window.curStage - 1);
    }
  });

  function handleSwipeEnd() {
    isMouseDown = false;
    let diff = startX - currentX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && window.curStage < STAGES_LIST.length - 1) {
        goNowStage(window.curStage + 1);
      } else if (diff < 0 && window.curStage > 0) {
        goNowStage(window.curStage - 1);
      }
    }
  }

  let dots = document.getElementById('dots');
  if (dots) {
    dots.innerHTML = STAGES_LIST.map((_, i) => `<div class="dot ${i === window.curStage ? 'active' : ''}" onclick="goNowStage(${i})"></div>`).join('');
  }
}

function updateClock() {
  let el = document.getElementById('clock');
  if (el) {
    el.textContent = fmtClock(getCurrentMinutes());
    if (window.isMockActive) {
      el.style.color = 'var(--accent-live)';
      el.style.fontWeight = '900';
    } else {
      el.style.color = 'var(--primary-accent)';
      el.style.fontWeight = '400';
    }
  }
  updateNowLive();
}

function updateNowLive() {
  STAGES_LIST.forEach((_, si) => {
    let acts = getLineupForDay().filter(a => a.stage === STAGES_LIST[si].name);
    let nowA = acts.find(a => isNow(a));
    if (nowA) {
      let rem = remMin(nowA);
      let el = elMin(nowA);
      let p = pct(nowA);
      ['pr-rem-', 'pr-el-', 'pr-pct-', 'pr-remb-', 'st-bar-', 'st-meta-'].forEach(id => {
        let el_id = document.getElementById(id + si);
        if (el_id) {
          if (id === 'pr-rem-') el_id.textContent = fmtMin(rem);
          if (id === 'pr-el-') el_id.textContent = fmtMin(el) + ' tocado';
          if (id === 'pr-pct-') el_id.textContent = p + '%';
          if (id === 'pr-remb-') el_id.textContent = fmtMin(rem) + ' restante';
          if (id === 'st-bar-') el_id.style.width = Math.max(2, p) + '%';
          if (id === 'st-meta-') el_id.textContent = fmtMin(rem) + ' restante · ' + p + '%';
        }
      });
    }
    let upA = acts.filter(a => isUp(a)).sort((a,b) => toMin(a.start) - toMin(b.start))[0];
    if (upA) {
      let timeUntil = getEventMinutes(upA.start);
      let el_id = document.getElementById('st-next-' + si);
      if (el_id) el_id.textContent = fmtMin(Math.max(0, timeUntil));
    }
    [...document.querySelectorAll('cd-rem-' + si)].forEach(el => {
      if (el && upA) el.textContent = fmtMin(Math.max(0, getEventMinutes(upA.start)));
    });
  });
}

function onClockClick() {
  const modal = document.getElementById('testModal');
  if (modal && modal.classList.contains('open')) return;
  const now = Date.now();
  if (!window.clockTaps) window.clockTaps = [];
  const taps = window.clockTaps;

  // Reset if too long since last tap
  if (taps.length > 0 && now - taps[taps.length - 1] > 3000) {
    window.clockTaps = [now];
    return;
  }

  taps.push(now);
  if (taps.length < 5) return;

  // Pattern: ●●●  ●●  (3 fast taps, pause, 2 fast taps)
  const [t1, t2, t3, t4, t5] = taps.slice(-5);
  if (t2 - t1 < 500 && t3 - t2 < 500 && t4 - t3 >= 600 && t5 - t4 < 500) {
    window.clockTaps = [];
    openTestMenu();
  } else {
    window.clockTaps = taps.slice(-4);
  }
}

function openLegalModal() {
  document.getElementById('legalModal').style.display = 'flex';
}

function closeLegalModal() {
  document.getElementById('legalModal').style.display = 'none';
}

function openTestMenu() {
  if (window.isMockActive && window.mockTime != null) {
    window.simHour = Math.floor(window.mockTime / 60);
    window.simMin = window.mockTime % 60;
  } else {
    const mins = getCurrentMinutes();
    let h = Math.floor(mins / 60);
    let m = Math.round((mins % 60) / 5) * 5;
    if (m >= 60) { h++; m = 0; }
    window.simHour = Math.min(27, Math.max(15, h));
    window.simMin = Math.min(55, Math.max(0, m));
  }
  updateDisplay();
  const modal = document.getElementById('testModal');
  modal.classList.remove('open');
  void modal.offsetWidth; // force reflow so the CSS animation restarts each time
  modal.classList.add('open');
}

function adjustSimTime(field, delta) {
  if (field === 'hour') {
    window.simHour = Math.min(27, Math.max(15, (window.simHour || 16) + delta));
  } else {
    window.simMin = (((window.simMin || 0) + delta) + 60) % 60;
  }
  updateDisplay();
}

function closeTestMenu() {
  document.getElementById('testModal').classList.remove('open');
}

function setMockTime() {
  window.mockTime = (window.simHour || 16) * 60 + (window.simMin || 0);
  window.isMockActive = true;
  const badge = document.getElementById('mockStatus');
  if (badge) badge.style.display = 'flex';
  const mt = document.getElementById('mockTime');
  if (mt) mt.textContent = String(window.simHour || 16).padStart(2,'0') + ':' + String(window.simMin || 0).padStart(2,'0');
  updateClock();
  goTab(window.curTab);
  closeTestMenu();
}

function disableMock() {
  window.isMockActive = false;
  window.mockTime = null;
  const badge = document.getElementById('mockStatus');
  if (badge) badge.style.display = 'none';
  updateClock();
  goTab(window.curTab);
  closeTestMenu();
}

function updateDisplay() {
  const display = document.getElementById('testDisplay');
  if (display) display.textContent = String(window.simHour || 16).padStart(2,'0') + ':' + String(window.simMin || 0).padStart(2,'0');
}

function showConflictToast(a, b) {
  let toast = document.getElementById('conflictToast');
  document.getElementById('conflictMsg').innerHTML = `${a.name} ↔ ${b.name}`;
  toast.classList.remove('hidden');
  clearTimeout(window._conflictTimer);
  window._conflictTimer = setTimeout(() => hideConflictToast(), 5000);
}

function hideConflictToast() {
  let toast = document.getElementById('conflictToast');
  if (toast) toast.classList.add('hidden');
}

// ═══════════════════════════════ INICIALIZACIÓN ═══════════════════════════════

document.addEventListener('click', (e) => {
  let modal = document.getElementById('testModal');
  if (modal && modal.classList.contains('open') && e.target === modal) {
    closeTestMenu();
  }
});

document.body.classList.add(`day-${window.festivalDay}`);
setDayStyles(window.festivalDay);
window.curStage = 0;
window.curTab = 'now';
updateClock();
goTab('now');
updateBadge();
setInterval(updateClock, 1000);

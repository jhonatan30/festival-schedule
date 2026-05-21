/**
 * BAUM Festival 11 - Complete Application Module
 * TODO - Este archivo contiene toda la lógica. Luego se puede dividir en más módulos
 */

import { STAGES_LIST, LINEUP, LINEUP_DAY23 } from './config.js';
import {
  saved, curTab, curStage, stageFilter, hintGone, swipeListenersAttached,
  mockTime, isMockActive, clockClickCount, contentUpdateInterval, festivalDay,
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
    if (allArtistsWithStatus.length) {
      nextHTML = `<div class="next-section-lbl">A continuación</div>`;
      allArtistsWithStatus.forEach(item => {let a = item.artist; let sv = saved.has(a.id); let classes = `ac ${sv ? 'sv' : ''} ${item.isPassed ? 'passed' : ''}`; nextHTML += `<div class="${classes}"><div class="ac-tb"><div class="ac-t">${a.start}</div><div class="ac-te">→${a.end}</div></div><div class="ac-b"><div class="ac-n">${a.name}</div><div class="ac-s">${a.tags.join(' · ')}</div></div><button class="ac-btn" data-artist-id="${a.id}" onclick="toggleSave(${a.id})"><i class="ti ${sv ? 'ti-heart-filled' : 'ti-heart'}"></i></button></div>`;});
    }
    views += `<div class="s-view" data-s="${si}">${heroHTML}${nextHTML}</div>`;
  });
  return `<div class="now-wrap"><div class="dots-row" id="dots"></div><div class="stage-name-lbl" id="snlbl">STAMM</div><div class="swipe-vp" id="svp"><div class="swipe-track" id="strk">${views}</div><div class="sw-hint" id="shint"><i class="ti ti-arrows-left-right" style="font-size:13px"></i> desliza entre escenarios</div></div></div>`;
}

function renderLineup() {
  const stagesOpts = ['Todos', ...STAGES_LIST.map(s => s.name)];
  let pills = stagesOpts.map(s => `<button class="sf-pill ${stageFilter === s ? 'active' : ''}" onclick="setSF('${s}')">${s}</button>`).join('');
  let filtered = stageFilter === 'Todos' ? getLineupForDay() : getLineupForDay().filter(a => a.stage === stageFilter);
  let sorted = [...filtered].sort((a,b) => toMin(a.start) - toMin(b.start));
  let liveNow = getLineupForDay().filter(a => isNow(a));
  let groups = {};
  sorted.forEach(a => {let h = a.start.split(':')[0]; if (!groups[h]) groups[h] = []; groups[h].push(a);});
  let conflicts = [...saved].filter(id => hasConflict(getLineupForDay().find(a => a.id === id)));
  let liveBar = liveNow.length ? `<div class="live-now-bar"><span class="live-dot" style="width:7px;height:7px;border-radius:50%;background:var(--primary-accent);animation:blink 1.3s infinite;display:inline-block;margin-right:6px;vertical-align:middle"></span>${liveNow.length} set${liveNow.length > 1 ? 's' : ''} en vivo ahora</div>` : '';
  let body = liveBar + `<div class="disclaimer-box">ℹ️ Esta es una guía no oficial. Los horarios pueden cambiar sin previo aviso.</div>`;
  let hours = Object.keys(groups).sort((a,b) => {let ah = parseInt(a) < 15 ? parseInt(a)+24 : parseInt(a); let bh = parseInt(b) < 15 ? parseInt(b)+24 : parseInt(b); return ah - bh;});
  hours.forEach(h => {body += `<div class="time-divider"><span class="time-divider-lbl">${h}:00</span><div class="time-divider-line"></div></div>`; groups[h].forEach(a => {let sv = saved.has(a.id), np = isNow(a), conf = hasConflict(a); let sc = stageColor(a.stage); let badges = ''; if (np) badges += `<span class="badge-live">En vivo · ${fmtMin(remMin(a))}</span>`; if (conf) badges += `<span class="badge-conflict">⚡ Conflicto</span>`; body += `<div class="lc ${sv ? 'sv' : ''} ${np ? 'np' : ''}" style="${np ? '--np-c:'+sc : ''}"><div class="lc-tb"><div class="lc-ts">${a.start}</div><div class="lc-te">→${a.end}</div></div><div class="lc-b"><div class="lc-n">${a.name}</div><div class="lc-stg" style="color:${sc}">${a.stage}</div><div class="lc-row">${badges}${a.tags.map(t => `<span class="lc-tag">${t}</span>`).join('')}</div></div><button class="lc-sv-btn ${sv ? 'on' : ''}" data-artist-id="${a.id}" onclick="toggleSave(${a.id})"><i class="ti ${sv ? 'ti-heart-filled' : 'ti-heart'}"></i></button></div>`;});});
  return `<div class="lineup-wrap"><div class="stage-filter-bar">${pills}</div><div class="lineup-list">${body}</div></div>`;
}

function renderAgenda() {
  if (!saved.size) {return `<div class="agenda-wrap"><div class="empty-state"><i class="ti ti-heart"></i><p>Nada guardado todavía.<br>Toca ♥ en cualquier artista<br>para armar tu lineup personal.</p></div></div>`;}
  let views = '';
  let savedArtists = getLineupForDay().filter(a => saved.has(a.id));
  STAGES_LIST.forEach((st, si) => {
    let acts = savedArtists.filter(a => a.stage === st.name).sort((a,b) => toMin(a.start) - toMin(b.start));
    if (!acts.length) {
      views += `<div class="s-view" data-s="${si}"><div class="hero hero-empty"><div class="hero-top"><div class="live-pill" style="background:rgba(var(--primary-light-rgb),.08)"><div style="width:7px;height:7px;border-radius:50%;background:rgba(var(--primary-light-rgb),.25)"></div><span class="live-txt" style="color:rgba(var(--primary-light-rgb),.35)">Sin artistas guardados</span></div></div><div class="hero-name" style="font-size:32px;color:rgba(var(--primary-light-rgb),.3);margin:10px 0 6px">–</div><div class="hero-sub" style="color:rgba(var(--primary-light-rgb),.25)">Guarda artistas de ${st.name} a tu agenda</div></div></div>`;
      return;
    }
    let nowA = acts.find(a => isNow(a));
    let upA = acts.filter(a => isUp(a)).sort((a,b) => toMin(a.start) - toMin(b.start));
    let displayArtist = nowA || upA[0];
    let isLive = !!nowA;
    let heroHTML = '';
    if (displayArtist) {
      let sv = saved.has(displayArtist.id);
      heroHTML = `<div class="hero"><div class="hero-shine"></div><div class="hero-grid"></div><div class="hero-top"><div class="live-pill"><div class="live-dot ${isLive ? '' : 'inactive'}"></div><span class="live-txt">${isLive ? 'En escena' : 'Próximo en tu agenda'}</span></div><button class="hero-save-btn" data-artist-id="${displayArtist.id}" onclick="toggleSave(${displayArtist.id})"><i class="ti ${sv ? 'ti-heart-filled' : 'ti-heart'}"></i></button></div><div class="hero-name">${displayArtist.name}${displayArtist.extra ? `<span class="hero-extra">${displayArtist.extra}</span>` : ''}</div><div class="hero-sub">${st.name} · ${displayArtist.start} → ${displayArtist.end}</div><div class="hero-tags">${displayArtist.tags.map(t => `<span class="hero-tag">${t}</span>`).join('')}</div>${isLive ? progressHTML(displayArtist, si) : countdownHTML(displayArtist, si)}</div>`;
    }
    let nextHTML = '';
    let allArtistsWithStatus = acts.map(a => ({artist:a,isPassed:getEventMinutes(a.end) < 0}));
    allArtistsWithStatus.sort((a, b) => {if (a.isPassed && !b.isPassed) return 1; if (!a.isPassed && b.isPassed) return -1; return getEventMinutes(a.artist.start) - getEventMinutes(b.artist.start);});
    if (allArtistsWithStatus.length) {
      nextHTML = `<div class="next-section-lbl">Tu lineup en ${st.name}</div>`;
      allArtistsWithStatus.forEach(item => {let a = item.artist; let sv = saved.has(a.id); let hasConf = hasConflict(a); let classes = `ac ${sv ? 'sv' : ''} ${item.isPassed ? 'passed' : ''} ${hasConf ? 'conflict' : ''}`; nextHTML += `<div class="${classes}" ${hasConf ? 'style="outline:1px solid #FFD700"' : ''}><div class="ac-tb"><div class="ac-t">${a.start}</div><div class="ac-te">→${a.end}</div></div><div class="ac-b"><div class="ac-n">${a.name}</div><div class="ac-s">${hasConf ? '⚡ Conflicto · ' : ''}${a.tags.join(' · ')}</div></div><button class="ac-btn" data-artist-id="${a.id}" onclick="toggleSave(${a.id})"><i class="ti ${sv ? 'ti-heart-filled' : 'ti-heart'}"></i></button></div>`;});
    }
    views += `<div class="s-view" data-s="${si}">${heroHTML}${nextHTML}</div>`;
  });
  return `<div class="now-wrap"><div class="disclaimer-box" style="margin:12px 16px 8px;font-size:12px">ℹ️ Tu agenda guardada · ${saved.size} artista${saved.size>1?'s':''} seleccionado${saved.size>1?'s':''}<br>Desliza para ver por escenario</div><div class="dots-row" id="dots"></div><div class="stage-name-lbl" id="snlbl">STAMM</div><div class="swipe-vp" id="svp"><div class="swipe-track" id="strk">${views}</div><div class="sw-hint" id="shint"><i class="ti ti-arrows-left-right" style="font-size:13px"></i> desliza entre escenarios</div></div></div>`;
}

function renderStages() {
  let html = `<div class="stages-wrap"><div class="disclaimer-box">ℹ️ Información de escenarios sujeta a cambios. Consulta la web oficial para detalles.</div><div class="sec-lbl" style="padding-top:4px">Escenarios activos</div>`;
  STAGES_LIST.forEach((st, si) => {
    let acts = getLineupForDay().filter(a => a.stage === st.name);
    let nowA = acts.find(a => isNow(a));
    let upA = acts.filter(a => isUp(a)).sort((a,b) => toMin(a.start) - toMin(b.start));
    let p = nowA ? pct(nowA) : 0;
    let rem = nowA ? remMin(nowA) : 0;
    let svHere = [...saved].filter(id => getLineupForDay().find(a => a.id === id && a.stage === st.name)).length;
    let nextArtist = nowA ? upA[0] : upA[0];
    let timeUntilNext = nextArtist ? Math.max(0, getEventMinutes(nextArtist.start)) : 0;
    html += `<div class="stage-card" style="background:${st.color}" onclick="goNowStage(${si})"><div class="sc-shine"></div><div class="sc-grid"></div><div class="sc-top"><div><div class="sc-name">${st.name}</div><div class="sc-desc">${st.desc}</div>${svHere ? `<div class="sc-saved-badge" style="margin-top:4px">♥ ${svHere} guardado${svHere>1?'s':''}</div>` : ''}</div><div class="sc-badge" style="background:rgba(0,0,0,.15)"><div class="sc-badge-dot"></div>Escenario</div></div><div class="sc-bottom">${nowA ? `<div class="sc-now-box"><div class="sc-now-name">${nowA.name}</div><div class="sc-now-time" id="st-now-${si}">${fmtMin(rem)}</div></div>` : `<div class="sc-now-box" style="opacity:.65"><div class="sc-now-micro">Próximo en</div><div class="sc-now-name" id="st-next-${si}" style="font-size:14px;font-weight:700">${nextArtist ? fmtMin(timeUntilNext) : '–'}</div></div>`}${nowA ? `<div class="sc-prog-outer"><div class="sc-prog-fill" id="st-bar-${si}" style="width:${p}%"></div></div><div class="sc-meta"><span class="sc-meta-txt">${nowA.start}</span><span class="sc-meta-center" id="st-meta-${si}">${fmtMin(rem)} restante · ${p}%</span><span class="sc-meta-txt">${nowA.end}</span></div>` : ''}</div></div>`;
  });
  html += `<div class="venue-card">📍 <strong>Corferias</strong> · Cra 40 #22C-67, Bogotá<br>🕓 Apertura puertas: 15:00<br>🔞 Evento para mayores de 18 años<br>🎟 <a href="https://www.ticketmaster.com.co" target="_blank" style="color:var(--primary-accent);font-weight:700;text-decoration:none">ticketmaster.com.co ↗</a></div></div>`;
  return html;
}

// ═══════════════════════════════ FUNCIONES PRINCIPALES ═══════════════════════════════

function changeFestivalDay(day) {
  window.festivalDay = day;
  window.curStage = 0;
  document.body.classList.remove('day-22', 'day-23');
  document.body.classList.add(`day-${day}`);
  let dayAccent = day === 22 ? '#FF1E78' : '#00D9FF';
  let dayRgb = day === 22 ? '255,184,208' : '0,217,255';
  document.documentElement.style.setProperty('--primary-accent', dayAccent);
  document.documentElement.style.setProperty('--primary-light-rgb', dayRgb);
  document.documentElement.style.setProperty('--accent-live', dayAccent);
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
  if (tab === 'now' || tab === 'agenda') {
    window.swipeListenersAttached = false;
    initSwipe();
  }
  updateBadge();
}

function setSF(stage) {
  window.stageFilter = stage;
  document.getElementById('content').innerHTML = renderLineup();
}

function goNowStage(si) {
  window.curStage = si;
  let currentStage = STAGES_LIST[si];
  if (currentStage) {
    let stageColor = currentStage.color;
    document.documentElement.style.setProperty('--primary-accent', stageColor);
    document.documentElement.style.setProperty('--primary-light-rgb', stageColor.includes('00D9FF') ? '0,217,255' : '255,184,208');
  }
  document.getElementById('snlbl').textContent = currentStage.name;
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === si));
  let strk = document.getElementById('strk');
  if (strk) strk.style.transform = `translateX(calc(-${si} * 100%))`;
}

function initSwipe() {
  if (window.swipeListenersAttached) return;
  window.swipeListenersAttached = true;
  let svp = document.getElementById('svp');
  if (!svp) return;
  let startX = 0, currentX = 0;
  svp.addEventListener('touchstart', e => {startX = e.touches[0].clientX; currentX = startX;}, {passive: true});
  svp.addEventListener('touchmove', e => {currentX = e.touches[0].clientX;}, {passive: true});
  svp.addEventListener('touchend', () => {
    let diff = startX - currentX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && window.curStage < STAGES_LIST.length - 1) {
        goNowStage(window.curStage + 1);
      } else if (diff < 0 && window.curStage > 0) {
        goNowStage(window.curStage - 1);
      }
    }
  });
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
  window.clockClickCount++;
  if (window.clockClickCount === 5) {
    let btn = document.getElementById('testBtn');
    if (btn) { btn.style.visibility = 'visible'; btn.style.pointerEvents = 'auto'; }
    openTestMenu();
    window.clockClickCount = 0;
  }
}

function openLegalModal() {
  document.getElementById('legalModal').style.display = 'flex';
}

function closeLegalModal() {
  document.getElementById('legalModal').style.display = 'none';
}

function openTestMenu() {
  document.getElementById('testModal').classList.add('open');
}

function closeTestMenu() {
  document.getElementById('testModal').classList.remove('open');
}

function setMockTime() {
  let hour = parseInt(document.getElementById('testHour').value);
  let min = parseInt(document.getElementById('testMin').value);
  window.mockTime = hour * 60 + min;
  window.isMockActive = true;
  updateDisplay();
  document.getElementById('mockStatus').style.display = 'block';
  updateClock();
  goTab(window.curTab);
}

function disableMock() {
  window.isMockActive = false;
  window.mockTime = null;
  document.getElementById('mockStatus').style.display = 'none';
  updateDisplay();
  updateClock();
  goTab(window.curTab);
}

function updateDisplay() {
  if (window.isMockActive) {
    let hour = Math.floor(window.mockTime / 60);
    let min = window.mockTime % 60;
    document.getElementById('testDisplay').textContent = String(hour).padStart(2,'0') + ':' + String(min).padStart(2,'0');
    document.getElementById('mockTime').textContent = String(hour).padStart(2,'0') + ':' + String(min).padStart(2,'0');
  }
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

document.getElementById('testHour').addEventListener('change', updateDisplay);
document.getElementById('testMin').addEventListener('change', updateDisplay);

document.body.classList.add(`day-${window.festivalDay}`);
updateClock();
goTab('now');
updateBadge();
setInterval(updateClock, 1000);

/**
 * BAUM Festival 11 - Complete Application Module
 * TODO - Este archivo contiene toda la lógica. Luego se puede dividir en más módulos
 */

import { STAGES_LIST, LINEUP, LINEUP_DAY23 } from './config.js';
import {
  saved, curTab, curStage, stageFilter, hintGone, swipeListenersAttached,
  contentUpdateInterval, festivalDay,
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
window.hideConflictToast = hideConflictToast;
window.showAgendaRoute = showAgendaRoute;
window.closeAgendaRoute = closeAgendaRoute;
window.selectRouteStep = selectRouteStep;
window.openNavSheet = openNavSheet;
window.closeNavSheet = closeNavSheet;

// ── Map data constants ──────────────────────────────────────────────────────
const WALK_MINUTES = {
  'Stamm|Todalanoche': 3,
  'BAUM|Stamm': 5,
  'BAUM|Todalanoche': 8,
  'BAUM|Páramo': 5,
  'Páramo|Stamm': 6,
  'Páramo|Todalanoche': 9,
  'Páramo|Resident Advisor': 3,
  'BAUM|Resident Advisor': 4,
  'Resident Advisor|Stamm': 7,
  'Resident Advisor|Todalanoche': 10,
};
const MAP_LAYOUT = {
  'Stamm':            { x:20,  y:20,  w:78,  h:46 },
  'Todalanoche':      { x:104, y:20,  w:64,  h:46 },
  'BAUM':             { x:174, y:20,  w:106, h:46 },
  'Páramo':           { x:128, y:90,  w:108, h:50 },
  'Resident Advisor': { x:20,  y:152, w:90,  h:50 },
};
function walkTime(stageA, stageB) {
  return WALK_MINUTES[[stageA, stageB].sort().join('|')] || 5;
}

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
    let acts = getLineupForDay()
      .filter(a => a.stage === st.name)
      .sort((a, b) => toMin(a.start) - toMin(b.start));
    let nowA = acts.find(a => isNow(a));
    let upA = acts.filter(a => isUp(a)).sort((a, b) => toMin(a.start) - toMin(b.start));
    let heroArtist = nowA || upA[0] || null;
    let isLive = !!nowA;
    let stageHTML = '';
    if (acts.length === 0) {
      stageHTML = `<div class="hero hero-empty"><div class="hero-top"><div class="live-pill" style="background:rgba(255,184,208,.08)"><div style="width:7px;height:7px;border-radius:50%;background:rgba(255,184,208,.25)"></div><span class="live-txt" style="color:rgba(255,184,208,.35)">Sin artistas</span></div></div><div class="hero-name" style="font-size:32px;color:rgba(255,184,208,.3);margin:10px 0 6px">–</div><div class="hero-sub" style="color:rgba(255,184,208,.25)">No hay artistas en este escenario</div></div>`;
    } else {
      acts.forEach(a => {
        const isPast = getEventMinutes(a.end) < 0;
        const isHero = heroArtist && a.id === heroArtist.id;
        const sv = saved.has(a.id);
        if (isHero) {
          stageHTML += `<div class="hero"><div class="hero-shine"></div><div class="hero-grid"></div><div class="hero-top"><div class="live-pill"><div class="live-dot ${isLive ? '' : 'inactive'}"></div><span class="live-txt">${isLive ? 'En escena' : 'Próximo'}</span></div><button class="hero-save-btn" data-artist-id="${a.id}" onclick="toggleSave(${a.id})"><i class="ti ${sv ? 'ti-heart-filled' : 'ti-heart'}"></i></button></div><div class="hero-name">${a.name}${a.extra ? `<span class="hero-extra">${a.extra}</span>` : ''}</div><div class="hero-sub">${st.name} · ${a.start} → ${a.end}</div><div class="hero-tags">${a.tags.map(t => `<span class="hero-tag">${t}</span>`).join('')}</div>${isLive ? progressHTML(a, si) : countdownHTML(a, si)}</div>`;
        } else {
          stageHTML += `<div class="ac ${sv ? 'sv' : ''} ${isPast ? 'passed' : ''}"><div class="ac-tb"><div class="ac-t">${a.start}</div><div class="ac-te">→${a.end}</div></div><div class="ac-b"><div class="ac-n">${a.name}</div><div class="ac-s">${a.tags.join(' · ')}</div></div><button class="ac-btn" data-artist-id="${a.id}" onclick="toggleSave(${a.id})"><i class="ti ${sv ? 'ti-heart-filled' : 'ti-heart'}"></i></button></div>`;
        }
      });
      if (!heroArtist) {
        stageHTML += `<div class="hero hero-empty"><div class="hero-top"><div class="live-pill" style="background:rgba(255,184,208,.08)"><div style="width:7px;height:7px;border-radius:50%;background:rgba(255,184,208,.25)"></div><span class="live-txt" style="color:rgba(255,184,208,.35)">Festival finalizado</span></div></div><div class="hero-name" style="font-size:32px;color:rgba(255,184,208,.3);margin:10px 0 6px">–</div><div class="hero-sub" style="color:rgba(255,184,208,.25)">No hay más artistas en este escenario</div></div>`;
      }
    }
    views += `<div class="s-view" data-s="${si}">${stageHTML}</div>`;
  });
  return `<div class="now-wrap"><div class="dots-row" id="dots"></div><div class="stage-name-lbl" id="snlbl">STAMM</div><div class="swipe-vp" id="svp"><div class="swipe-track" id="strk">${views}</div><div class="sw-hint" id="shint"><i class="ti ti-arrows-left-right" style="font-size:13px"></i> desliza entre escenarios</div></div></div>`;
}

function renderLineup() {
  const stagesOpts = ['Todos', ...STAGES_LIST.map(s => s.name)];
  let currentFilter = window.stageFilter || stageFilter || 'Todos';
  let pills = stagesOpts.map(s => {
    const color = s === 'Todos' ? 'var(--primary-accent)' : stageColor(s);
    return `<button class="sf-pill ${currentFilter === s ? 'active' : ''}" onclick="setSF('${s}')" style="--pill-color:${color}">${s}</button>`;
  }).join('');
  let filtered = currentFilter === 'Todos' ? getLineupForDay() : getLineupForDay().filter(a => a.stage === currentFilter);
  let sorted = [...filtered].sort((a,b) => toMin(a.start) - toMin(b.start));
  let liveNow = getLineupForDay().filter(a => isNow(a));
  let groups = {};
  sorted.forEach(a => {let h = a.start.split(':')[0]; if (!groups[h]) groups[h] = []; groups[h].push(a);});
  let liveBar = liveNow.length ? `<div class="live-now-bar"><span class="live-dot" style="width:7px;height:7px;border-radius:50%;background:var(--primary-accent);animation:blink 1.3s infinite;display:inline-block;margin-right:6px;vertical-align:middle"></span>${liveNow.length} set${liveNow.length > 1 ? 's' : ''} en vivo ahora</div>` : '';
  let body = liveBar;
  let hours = Object.keys(groups).sort((a,b) => {let ah = parseInt(a) < 15 ? parseInt(a)+24 : parseInt(a); let bh = parseInt(b) < 15 ? parseInt(b)+24 : parseInt(b); return ah - bh;});
  hours.forEach(h => {body += `<div class="time-divider"><span class="time-divider-lbl">${h}:00</span><div class="time-divider-line"></div></div>`; groups[h].forEach(a => {let sv = saved.has(a.id), np = isNow(a), conf = hasConflict(a); let sc = stageColor(a.stage); let stageSafe = a.stage.toLowerCase().replace(/\s+/g, '-'); let badges = ''; if (np) badges += `<span class="badge-live">En vivo · <span id="bl-rem-${a.id}">${fmtMin(remMin(a))}</span></span>`; if (conf) badges += `<span class="badge-conflict">⚡ Conflicto</span>`; body += `<div class="lc ${sv ? 'sv' : ''} ${np ? 'np' : ''} stage-${stageSafe}" style="${np ? '--np-c:'+sc : ''}; --stage-border-color: ${sc}"><div class="lc-tb"><div class="lc-ts">${a.start}</div><div class="lc-te">→${a.end}</div></div><div class="lc-b"><div class="lc-n">${a.name}</div><div class="lc-stg" style="color:${sc}">${a.stage}</div><div class="lc-row">${badges}${a.tags.map(t => `<span class="lc-tag">${t}</span>`).join('')}</div></div><button class="lc-sv-btn ${sv ? 'on' : ''}" data-artist-id="${a.id}" onclick="toggleSave(${a.id})"><i class="ti ${sv ? 'ti-heart-filled' : 'ti-heart'}"></i></button></div>`;});});
  return `<div class="lineup-wrap"><div class="stage-filter-bar">${pills}</div><div class="lineup-list">${body}</div></div>`;
}

function renderAgenda() {
  if (!saved.size) {return `<div class="agenda-wrap"><div class="empty-state"><i class="ti ti-heart"></i><p>Nada guardado todavía.<br>Toca ♥ en cualquier artista<br>para armar tu lineup personal.</p></div></div>`;}

  let savedArtists = getLineupForDay().filter(a => saved.has(a.id)).sort((a,b) => toMin(a.start) - toMin(b.start));
  let liveNow = savedArtists.filter(a => isNow(a));

  let liveBar = liveNow.length ? `<div class="live-now-bar"><span class="live-dot" style="width:7px;height:7px;border-radius:50%;background:var(--primary-accent);animation:blink 1.3s infinite;display:inline-block;margin-right:6px;vertical-align:middle"></span>${liveNow.length} set${liveNow.length > 1 ? 's' : ''} en vivo ahora</div>` : '';
  let routeBtn = savedArtists.length >= 2 ? `<button class="route-btn" onclick="showAgendaRoute()"><i class="ti ti-route"></i> Ver ruta del día</button>` : '';
  let body = liveBar + routeBtn + `<div style="padding:12px 16px 8px;font-size:12px;color:rgba(255,184,208,.6)">Tu agenda guardada · ${saved.size} artista${saved.size>1?'s':''}</div>`;

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
      if (np) badges += `<span class="badge-live">En vivo · <span id="bl-rem-${a.id}">${fmtMin(remMin(a))}</span></span>`;
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

    let stub = st.name.substring(0, 4).toUpperCase();
    let content = nowA ? `
      <div class="sc-now-playing">
        <div class="sc-artist-name">${nowA.name}</div>
        <div class="sc-progress">
          <div class="sc-progress-bar"><div class="sc-progress-fill" id="st-bar-${si}" style="width:${p}%"></div></div>
          <div class="sc-progress-text" id="st-meta-${si}">${fmtMin(elMin(nowA))} tocado · ${fmtMin(rem)} restante</div>
        </div>
        <div class="sc-times"><span>${nowA.start}</span> - <span>${nowA.end}</span></div>
      </div>` : (nextArtist ? `
      <div class="sc-next-playing">
        <div class="sc-next-label">Próximo artista</div>
        <div class="sc-artist-name">${nextArtist.name}</div>
        <div class="sc-next-time">En <span id="st-next-${si}">${fmtMin(timeUntilNext)}</span></div>
        <div class="sc-times"><span>${nextArtist.start}</span> - <span>${nextArtist.end}</span></div>
      </div>` : `
      <div class="sc-finished">
        <div class="sc-finished-text">Este escenario ha finalizado sus presentaciones</div>
      </div>`);

    html += `<div class="stage-card" style="--stage-color:${st.color};background:${st.color}">
      <div class="sc-stub">${stub}</div>
      <div class="sc-body">
        <div class="sc-header">
          <div class="sc-title-group">
            <div class="sc-name">${st.name}</div>
            <div class="sc-desc">${st.desc}</div>
          </div>
          <div class="sc-status-badge ${status.toLowerCase()}">${status}</div>
        </div>
        <div class="sc-divider"></div>
        <div class="sc-content">${content}</div>
        ${svHere ? `<div class="sc-saved-info">♥ ${svHere} artista${svHere>1?'s':''} guardado${svHere>1?'s':''}</div>` : ''}
        <button class="sc-lineup-btn" onclick="event.stopPropagation();goStageLineup('${st.name}')">Ver en lineup <i class="ti ti-arrow-right"></i></button>
      </div>
    </div>`;
  });
  return html;
}

// ═══════════════════════════════ MAPA ═══════════════════════════════

function renderMapSVG(highlightStage, compact, routeMode) {
  const lineup = getLineupForDay();
  const stagesSVG = STAGES_LIST.map(st => {
    const pos = MAP_LAYOUT[st.name];
    if (!pos) return '';
    const nowA = lineup.find(a => a.stage === st.name && isNow(a));
    const isSelected = st.name === highlightStage;
    const cx = pos.x + pos.w / 2;
    const cy = pos.y + pos.h / 2;
    const words = st.name.split(' ');
    let nameTxt = words.length === 1
      ? `<text x="${cx}" y="${cy+5}" text-anchor="middle" class="map-stage-name">${st.name}</text>`
      : words.length === 2
        ? `<text x="${cx}" y="${cy-3}" text-anchor="middle" class="map-stage-name">${words[0]}</text><text x="${cx}" y="${cy+11}" text-anchor="middle" class="map-stage-name">${words[1]}</text>`
        : `<text x="${cx}" y="${cy-3}" text-anchor="middle" class="map-stage-name">${words.slice(0,2).join(' ')}</text><text x="${cx}" y="${cy+11}" text-anchor="middle" class="map-stage-name">${words.slice(2).join(' ')}</text>`;
    const safeId = 'map-g-' + st.name.replace(/\s+/g,'-').replace(/[^a-zA-Z0-9-]/g,'');
    const interactAttr = routeMode ? '' : ` data-stage="${st.name}" onclick="showMapStageInfo(this.getAttribute('data-stage'))"`;
    return `<g class="map-stage-group${isSelected?' selected':''}" id="${safeId}"${interactAttr}>
      <rect x="${pos.x}" y="${pos.y}" width="${pos.w}" height="${pos.h}" rx="4" fill="${st.color}22" stroke="${st.color}" stroke-width="${isSelected?'2.5':'1.5'}"/>
      ${nameTxt}
      ${nowA ? `<circle cx="${pos.x+pos.w-8}" cy="${pos.y+8}" r="5" fill="${st.color}" class="map-live-pulse"/>` : ''}
    </g>`;
  }).join('');
  const svgClass = `map-svg${compact?' map-svg--compact':''}${routeMode?' route-mode':''}`;
  const svgId = routeMode ? ' id="routeMapSvg"' : '';
  return `<svg viewBox="0 0 380 215" class="${svgClass}"${svgId}>
    <defs>
      <marker id="routeArrowHead" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
        <path d="M0,0 L0,7 L7,3.5 z" fill="white" fill-opacity=".75"/>
      </marker>
    </defs>
    <rect x="12" y="10" width="360" height="198" rx="8" fill="rgba(13,27,61,.45)" stroke="rgba(255,184,208,.14)" stroke-width="1.5"/>
    <text x="192" y="8" text-anchor="middle" class="map-street">CARRERA 40</text>
    <text x="192" y="214" text-anchor="middle" class="map-street">CARRERA 37</text>
    <line x1="98"  y1="43" x2="104" y2="43" stroke="rgba(255,184,208,.12)" stroke-width="6" stroke-dasharray="2,2"/>
    <line x1="168" y1="43" x2="174" y2="43" stroke="rgba(255,184,208,.12)" stroke-width="6" stroke-dasharray="2,2"/>
    <line x1="59"  y1="66" x2="59"  y2="152" stroke="rgba(255,184,208,.09)" stroke-width="1.5" stroke-dasharray="5,4"/>
    <line x1="182" y1="66" x2="182" y2="90"  stroke="rgba(255,184,208,.09)" stroke-width="1.5" stroke-dasharray="5,4"/>
    <line x1="110" y1="152" x2="128" y2="140" stroke="rgba(255,184,208,.09)" stroke-width="1.5" stroke-dasharray="5,4"/>
${stagesSVG}
    <g id="routeArrow"></g>
  </svg>`;
}


function showAgendaRoute() {
  const savedArtists = getLineupForDay().filter(a => saved.has(a.id)).sort((a,b) => toMin(a.start)-toMin(b.start));
  if (savedArtists.length < 2) return;
  let timeline = '';
  savedArtists.forEach((a, i) => {
    const sc = stageColor(a.stage);
    const isLive = isNow(a);
    timeline += `<div class="route-step" onclick="selectRouteStep(${i})">
      <div class="route-step-time">${a.start}</div>
      <div class="route-step-dot" style="background:${sc}"></div>
      <div class="route-step-info">
        ${isLive ? `<div class="map-info-status-live"><span style="width:5px;height:5px;border-radius:50%;background:var(--primary-accent);display:inline-block;animation:blink 1.3s infinite"></span>EN VIVO</div>` : ''}
        <div class="route-step-artist">${a.name}${a.extra?` <span style="font-size:11px;opacity:.45">${a.extra}</span>`:''}</div>
        <div class="route-step-stage" style="color:${sc}">${a.stage} · ${a.start} → ${a.end}</div>
      </div>
    </div>`;
    if (i < savedArtists.length - 1) {
      const next = savedArtists[i+1];
      if (a.stage !== next.stage) {
        const mins = walkTime(a.stage, next.stage);
        timeline += `<div class="route-transfer">
          <div class="route-transfer-line"></div>
          <div class="route-transfer-card">
            <i class="ti ti-walk" style="font-size:13px"></i>
            <span>Caminar a ${next.stage}</span>
            <span class="route-transfer-badge">~${mins} min</span>
          </div>
        </div>`;
      } else {
        timeline += `<div class="route-same-stage">
          <div class="route-same-line"></div>
          <span class="route-same-text">Mismo escenario</span>
        </div>`;
      }
    }
  });
  const overlay = document.createElement('div');
  overlay.className = 'route-overlay';
  overlay.id = 'routeOverlay';
  overlay.innerHTML = `
    <div class="route-header">
      <button class="route-close-btn" onclick="closeAgendaRoute()"><i class="ti ti-arrow-left"></i></button>
      <span class="route-header-title">Tu ruta del día</span>
    </div>
    <div class="route-map-mini">${renderMapSVG(null, true, true)}</div>
    <div class="route-timeline">${timeline}</div>`;
  document.querySelector('.shell').appendChild(overlay);
  selectRouteStep(0);
}

function closeAgendaRoute() {
  const overlay = document.getElementById('routeOverlay');
  if (overlay) overlay.remove();
}

function selectRouteStep(idx) {
  const artists = getLineupForDay().filter(a => saved.has(a.id)).sort((a,b) => toMin(a.start)-toMin(b.start));
  if (!artists[idx]) return;
  const currentStage = artists[idx].stage;
  const prevStage    = idx > 0 ? artists[idx - 1].stage : null;
  document.querySelectorAll('#routeOverlay .route-step').forEach((el, i) => {
    el.classList.toggle('route-step--selected', i === idx);
  });
  document.querySelectorAll('#routeMapSvg .map-stage-group').forEach(g => g.classList.remove('route-active'));
  const safeCurrent = 'map-g-' + currentStage.replace(/\s+/g,'-').replace(/[^a-zA-Z0-9-]/g,'');
  const currentGrp = document.getElementById(safeCurrent);
  if (currentGrp) currentGrp.classList.add('route-active');
  if (prevStage && prevStage !== currentStage) {
    const safePrev = 'map-g-' + prevStage.replace(/\s+/g,'-').replace(/[^a-zA-Z0-9-]/g,'');
    const prevGrp = document.getElementById(safePrev);
    if (prevGrp) prevGrp.classList.add('route-active');
  }
  const arrowEl = document.getElementById('routeArrow');
  if (!arrowEl) return;
  if (prevStage && prevStage !== currentStage) {
    const fp = MAP_LAYOUT[prevStage], tp = MAP_LAYOUT[currentStage];
    if (fp && tp) {
      const x1 = fp.x + fp.w/2, y1 = fp.y + fp.h/2;
      const x2 = tp.x + tp.w/2, y2 = tp.y + tp.h/2;
      const dx = x2-x1, dy = y2-y1, dist = Math.sqrt(dx*dx+dy*dy);
      const pad = 22, ux = dx/dist, uy = dy/dist;
      arrowEl.innerHTML = `<line x1="${(x1+ux*pad).toFixed(1)}" y1="${(y1+uy*pad).toFixed(1)}" x2="${(x2-ux*pad).toFixed(1)}" y2="${(y2-uy*pad).toFixed(1)}" stroke="white" stroke-opacity=".75" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#routeArrowHead)"/>`;
    }
  } else {
    arrowEl.innerHTML = '';
  }
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
  goTab(window.curTab || 'now');
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

const TAB_META = {
  now:    { icon: 'ti-player-play-filled', name: 'AHORA' },
  lineup: { icon: 'ti-list',              name: 'LINEUP' },
  agenda: { icon: 'ti-heart',             name: 'MI AGENDA' },
  stages: { icon: 'ti-building-circus',   name: 'ESCENARIOS' },
};

function goTab(tab) {
  window.curTab = tab;
  document.querySelectorAll('.nav-item[data-tab]').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  const meta = TAB_META[tab];
  if (meta) {
    const icon = document.getElementById('hdrSectionIcon');
    const name = document.getElementById('hdrSectionName');
    if (icon) icon.className = `ti ${meta.icon}`;
    if (name) name.textContent = meta.name;
  }
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

function openNavSheet() {
  document.getElementById('navSheet').classList.add('open');
  document.getElementById('navBackdrop').classList.add('open');
  document.getElementById('hamBtn').classList.add('open');
}

function closeNavSheet() {
  document.getElementById('navSheet').classList.remove('open');
  document.getElementById('navBackdrop').classList.remove('open');
  document.getElementById('hamBtn').classList.remove('open');
}

function setSF(stage) {
  window.stageFilter = stage;
  const c = document.getElementById('content');
  if (c) c.innerHTML = renderLineup();
}

function goStageLineup(stage) {
  window.stageFilter = stage;
  goTab('lineup');
}
window.goStageLineup = goStageLineup;

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
    el.style.color = 'var(--primary-accent)';
    el.style.fontWeight = '400';
  }
  updateNowLive();
}

function updateNowLive() {
  STAGES_LIST.forEach((_, si) => {
    const acts = getLineupForDay().filter(a => a.stage === STAGES_LIST[si].name);
    const nowA = acts.find(a => isNow(a));

    if (nowA) {
      const rem = remMin(nowA), el = elMin(nowA), p = pct(nowA);
      const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
      set('pr-rem-' + si, fmtMin(rem));
      set('pr-el-'  + si, fmtMin(el) + ' tocado');
      set('pr-pct-' + si, p + '%');
      set('pr-remb-'+ si, fmtMin(rem) + ' restante');
      set('st-meta-'+ si, fmtMin(el) + ' tocado · ' + fmtMin(rem) + ' restante');
      const bar = document.getElementById('pr-bar-' + si);
      if (bar) bar.style.width = Math.max(2, p) + '%';
      const stBar = document.getElementById('st-bar-' + si);
      if (stBar) stBar.style.width = Math.max(2, p) + '%';
    }

    const upA = acts.filter(a => isUp(a)).sort((a, b) => toMin(a.start) - toMin(b.start))[0];
    if (upA) {
      const t = fmtMin(Math.max(0, getEventMinutes(upA.start)));
      const cdEl = document.getElementById('cd-rem-' + si);
      if (cdEl) cdEl.textContent = t;
      const stNext = document.getElementById('st-next-' + si);
      if (stNext) stNext.textContent = t;
    }
  });

  // Update "En vivo · X" badges in Lineup and Agenda tabs
  getLineupForDay().filter(a => isNow(a)).forEach(a => {
    const bl = document.getElementById('bl-rem-' + a.id);
    if (bl) bl.textContent = fmtMin(remMin(a));
  });
}

function openLegalModal() {
  document.getElementById('legalModal').style.display = 'flex';
}

function closeLegalModal() {
  document.getElementById('legalModal').style.display = 'none';
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


document.body.classList.add(`day-${window.festivalDay}`);
setDayStyles(window.festivalDay);
window.curStage = 0;
window.curTab = 'now';
updateClock();
goTab('now');
updateBadge();
setInterval(updateClock, 1000);

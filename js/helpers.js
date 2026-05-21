/**
 * BAUM Festival 11 - Helper Functions
 * Funciones utilitarias para cálculos, formateo y lógica
 */

import { LINEUP, LINEUP_DAY23, STAGES_LIST } from './config.js';
import { saved, festivalDay, mockTime, isMockActive } from './state.js';

/**
 * Obtiene el lineup del día actual
 */
export function getLineupForDay() {
  return festivalDay === 22 ? LINEUP : LINEUP_DAY23;
}

/**
 * Calcula minutos desde ahora hasta un evento
 * Negativo = ya pasó, Positivo = falta aún
 */
export function getEventMinutes(t) {
  let nowDate = new Date();
  let nowMs;

  if (isMockActive && mockTime !== null) {
    let mockDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), festivalDay);
    let mockHour = Math.floor(mockTime / 60);
    let mockMin = mockTime % 60;
    mockDate.setHours(mockHour, mockMin, 0, 0);
    nowMs = mockDate.getTime();
  } else {
    nowMs = nowDate.getTime();
  }

  let [h, m] = t.split(':').map(Number);
  let eventDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), festivalDay);
  if (h < 15) eventDate.setDate(festivalDay + 1);
  eventDate.setHours(h, m, 0, 0);
  let eventMs = eventDate.getTime();
  return (eventMs - nowMs) / 60000;
}

/**
 * Convierte tiempo "HH:MM" a minutos desde medianoche
 * Para horarios after-midnight: suma 24 horas
 */
export function toMin(t) {
  let [h, m] = t.split(':').map(Number);
  if (h < 15) h += 24;
  return h * 60 + m;
}

/**
 * ¿Está tocando ahora?
 */
export function isNow(a) {
  let startMin = getEventMinutes(a.start);
  let endMin = getEventMinutes(a.end);
  return startMin <= 0 && endMin > 0;
}

/**
 * ¿Está próximo?
 */
export function isUp(a) {
  return getEventMinutes(a.start) > 0;
}

/**
 * Porcentaje de progreso (0-100)
 */
export function pct(a) {
  let start = getEventMinutes(a.start);
  let end = getEventMinutes(a.end);
  let elapsed = -start;
  if (start > 0 || end < 0) return 0;
  return Math.min(100, Math.max(0, Math.round(elapsed / (end - start) * 100)));
}

/**
 * Minutos restantes del set
 */
export function remMin(a) {
  return Math.max(0, getEventMinutes(a.end));
}

/**
 * Minutos transcurridos del set
 */
export function elMin(a) {
  return Math.max(0, -getEventMinutes(a.start));
}

/**
 * Formatea minutos a "1d 2h 30m 45s"
 */
export function fmtMin(m) {
  if (m <= 0) return '0s';
  let d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = Math.floor(m % 60), s = Math.round((m % 1) * 60);
  if (d > 0) {
    return h > 0 ? (d + 'd ' + h + 'h ' + String(mm).padStart(2,'0') + 'm ' + String(s).padStart(2,'0') + 's') : (d + 'd ' + String(mm).padStart(2,'0') + 'm ' + String(s).padStart(2,'0') + 's');
  }
  if (h > 0) {
    return h + 'h ' + String(mm).padStart(2,'0') + 'm ' + String(s).padStart(2,'0') + 's';
  }
  return mm + 'm ' + String(s).padStart(2,'0') + 's';
}

/**
 * Formatea minutos desde midnight a "HH:MM"
 */
export function fmtClock(m) {
  let h = Math.floor(m / 60) % 24, mm = m % 60;
  return String(h).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
}

/**
 * Obtiene minutos actuales desde midnight
 */
export function getCurrentMinutes() {
  if (isMockActive && mockTime !== null) {
    return mockTime;
  }
  let now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Obtiene color del escenario
 */
export function stageColor(s) {
  return (STAGES_LIST.find(x => x.name === s) || {color:'#FF1E78'}).color;
}

/**
 * Detecta conflicto de horario para un artista guardado
 */
export function hasConflict(a) {
  if (!saved.has(a.id)) return false;
  return [...saved].some(sid => {
    if (sid === a.id) return false;
    let b = getLineupForDay().find(x => x.id === sid);
    if (!b) return false;
    return toMin(a.start) < toMin(b.end) && toMin(a.end) > toMin(b.start);
  });
}

/**
 * Obtiene el artista con el que hay conflicto
 */
export function getConflictingArtist(a) {
  return [...saved].find(sid => {
    if (sid === a.id) return false;
    let b = getLineupForDay().find(x => x.id === sid);
    if (!b) return false;
    return toMin(a.start) < toMin(b.end) && toMin(a.end) > toMin(b.start);
  });
}

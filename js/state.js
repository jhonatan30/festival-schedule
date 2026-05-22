/**
 * BAUM Festival 11 - Global State Management
 * Gestiona el estado reactivo de la aplicación
 */

// Guardado de artistas (persiste en localStorage)
export let saved = new Set(JSON.parse(localStorage.getItem('baum_saved') || '[]'));

// UI State
export let curTab = 'now';
export let curStage = 0;
export let stageFilter = 'Todos';
export let hintGone = false;
export let swipeListenersAttached = false;

// Intervals
export let contentUpdateInterval = null;

// Festival State
export let festivalDay = 22;

/**
 * Actualiza el state de guardados y persiste en localStorage
 */
export function updateSavedState(updater) {
  updater(saved);
  localStorage.setItem('baum_saved', JSON.stringify([...saved]));
}

/**
 * Reinicia el estado (útil para testing)
 */
export function resetState() {
  saved.clear();
  curTab = 'now';
  curStage = 0;
  stageFilter = 'Todos';
  hintGone = false;
  swipeListenersAttached = false;
  festivalDay = 22;
  localStorage.clear();
}

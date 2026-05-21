# 🎵 Baum Festival 11 - Estructura Modular

Proyecto organizado en módulos ES6 para máxima mantenibilidad y escalabilidad.

## 📁 Estructura del Proyecto

```
baum-project/
├── index.html              # HTML principal (plantilla)
├── css/
│   └── style.css          # Todos los estilos de la app
└── js/
    ├── main.js            # Punto de entrada (entry point)
    ├── app.js             # Lógica completa de la aplicación
    ├── config.js          # Datos: STAGES_LIST, LINEUP, LINEUP_DAY23
    ├── state.js           # Estado global y variables reactivas
    └── helpers.js         # Funciones utilitarias y cálculos
```

## 📋 Descripción de Archivos

### `index.html`
- Estructura HTML pura
- Importa `css/style.css` y `js/main.js`
- Sin lógica, solo marcado

### `css/style.css` (1,290 líneas)
- Todos los estilos de la aplicación
- Variables CSS para colores dinámicos
- Responsive diseño
- Animaciones y transiciones

### `js/main.js`
- Punto de entrada único
- Carga `app.js` como módulo ES6
- Inicializa la aplicación

### `js/app.js` (Archivo principal de lógica)
Contiene:
- **Funciones de Renderizado:**
  - `progressHTML()` - Barra de progreso (en vivo)
  - `countdownHTML()` - Contador regresivo (próximo)
  - `renderNow()` - Tab "Ahora" con swipe
  - `renderLineup()` - Tab "Lineup" con filtrado
  - `renderAgenda()` - Tab "Mi Agenda" (guardados)
  - `renderStages()` - Tab "Escenarios" (cards)

- **Funciones Principales:**
  - `changeFestivalDay()` - Cambia entre día 22 y 23
  - `toggleSave()` - Guarda/quita artistas
  - `goTab()` - Cambia entre tabs
  - `initSwipe()` - Inicializa gestos táctiles
  - `updateClock()` - Actualiza reloj en tiempo real
  
- **Funciones de Modal/UI:**
  - `openLegalModal()` / `closeLegalModal()` - Modal de información
  - `openTestMenu()` / `setMockTime()` - Simulador de hora
  - `showConflictToast()` - Notificación de conflictos

- **Event Listeners:**
  - Click en elementos
  - Gestos táctiles (swipe)
  - Actualizaciones en tiempo real

### `js/config.js`
- `STAGES_LIST` - 5 escenarios con colores
- `LINEUP` - 36 artistas del Viernes 22
- `LINEUP_DAY23` - 35 artistas del Sábado 23

### `js/state.js`
- Variables de estado global
- Funciones de actualización
- Persistencia en localStorage

### `js/helpers.js`
- `getEventMinutes()` - Cálculos de tiempo
- `toMin()` - Conversión a minutos
- `isNow()`, `isUp()` - Estados de artistas
- `fmtMin()`, `fmtClock()` - Formateo de tiempo
- `stageColor()` - Obtiene color del escenario
- `hasConflict()` - Detecta conflictos
- Todas las funciones puras y reutilizables

## 🚀 Cómo Usar

### Desarrollo Local
```bash
# Navegar a la carpeta
cd baum-project

# Servir con un servidor HTTP local (Python 3)
python -m http.server 8000

# O con Node.js (http-server)
npx http-server

# O con VS Code Live Server
# Click derecho en index.html → "Open with Live Server"
```

Abre `http://localhost:8000` en tu navegador.

### Deployment
Los módulos ES6 funcionan en cualquier servidor web moderno:
- GitHub Pages ✓
- Netlify ✓
- Vercel ✓
- Firebase Hosting ✓
- AWS S3 + CloudFront ✓

No requiere build tools, bundlers, o transpiladores (ES6 nativo).

## 📊 Estadísticas

- **HTML:** ~200 líneas
- **CSS:** 1,290 líneas
- **JavaScript:** ~1,500 líneas (distribuidas en módulos)
- **Total:** ~3,000 líneas de código
- **Módulos:** 5 archivos independientes
- **Función:** App completa de festival

## ✨ Características

✅ Dos días de festival (22-23 Mayo)
✅ 71 artistas totales
✅ 5 escenarios diferentes
✅ Colores dinámicos por día (Rosa / Cyan)
✅ Detección de conflictos de horario
✅ Guardado en localStorage
✅ Simulador de hora (testing)
✅ Swipe entre escenarios
✅ Responsive (mobile-first)
✅ Sin dependencias externas*

*Excepto Tabler Icons (CDN) para iconos

## 🔄 Mejoras Futuras

Si necesitas más modularización, puedes dividir `app.js` en:
- `ui-rendering.js` - Solo funciones de render
- `event-handlers.js` - Todos los event listeners
- `modal-manager.js` - Gestión de modales
- `time-manager.js` - Actualización de tiempo

Por ahora está en un archivo para facilitar el despliegue y evitar problemas de CORS con módulos.

## 📝 Notas

- Todo el código usa módulos ES6 (`import`/`export`)
- Compatible con navegadores modernos (2020+)
- Sin jQuery, React, Vue o frameworks
- Vanilla JavaScript puro
- Totalmente responsive
- Totalmente offline (sin dependencias de red)

---

**Baum Festival 11** | Estructura modular | 2026

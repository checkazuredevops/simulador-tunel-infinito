---
inclusion: auto
---

# Structure Steering

## Árbol del proyecto

```
simulador-tunel-infinito/
├── .kiro/
│   ├── specs/
│   │   └── simulador-tunel-infinito/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   └── steering/
│       ├── product.md
│       ├── tech.md
│       └── structure.md
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js
│   ├── game/
│   │   ├── Game.js
│   │   ├── TunnelManager.js
│   │   ├── ObstacleManager.js
│   │   ├── Player.js
│   │   ├── input.js
│   │   ├── state.js
│   │   └── constants.js
│   ├── ui/
│   │   ├── HUD.vue
│   │   ├── GameOver.vue
│   │   └── App.vue
│   └── styles/
│       └── main.css
├── public/
│   └── assets/
│       ├── vehicle.glb
│       └── obstacle.glb
└── tests/
    ├── position.property.test.js
    ├── scoring.property.test.js
    ├── recycling.property.test.js
    ├── collision.property.test.js
    ├── tunnel.test.js
    ├── player.test.js
    └── ui.test.js
```

## Responsabilidades por carpeta

- **`.kiro/specs/simulador-tunel-infinito/`**: artefactos del Feature Spec. Fuente de verdad del alcance, la arquitectura y el plan de tareas. No se editan a mano sin motivo: si algo cambia, se actualizan los tres documentos de forma coherente.
- **`.kiro/steering/`**: contexto persistente para Kiro (producto, técnico, estructura). No contiene código ni assets.
- **`src/game/`**: toda la lógica de juego y de render. Es la capa que habla con Three.js.
- **`src/ui/`**: componentes Vue. Solo consumen el estado reactivo expuesto por `src/game/state.js`; no manipulan objetos de Three.js directamente.
- **`src/styles/`**: CSS global y variables. Los estilos de componentes Vue viven dentro de cada `.vue` (bloque `<style scoped>`).
- **`public/assets/`**: modelos `.glb` locales como respaldo si el CDN falla.
- **`tests/`**: pruebas unitarias y de UI. Los `.property.test.js` corresponden a property-based testing con fast-check.

## Convenciones

- **Nombres de archivos**: `PascalCase` para clases y componentes Vue (`Game.js`, `HUD.vue`); `camelCase` para módulos utilitarios (`input.js`, `state.js`, `constants.js`).
- **Nombres de carpetas**: `kebab-case` cuando aplica (ej. `simulador-tunel-infinito`), `camelCase` para las que agrupan módulos (`game`, `ui`, `styles`).
- **Idioma del código**: identificadores en inglés (`posicionLateral` se mantiene tal cual por trazabilidad con el spec); comentarios y textos de UI en español.
- **Estilo JS**: ESM, `const` por defecto, sin `var`, sin clases innecesarias. Una responsabilidad por archivo.
- **Estilo CSS**: clases en `kebab-case`, sin frameworks de utilidades; variables CSS en `:root` para colores y tipografía.
- **Imports**: rutas relativas dentro de `src/`; nunca rutas absolutas desde la raíz.

## Ubicación de pruebas

- **Unitarias de lógica** (`tests/*.test.js`): clamp de posición, scoring, reciclaje, colisión.
- **Property-based** (`tests/*.property.test.js`): propiedades de correctitud con fast-check, trazadas a las secciones `## Propiedades de Correctitud` del `design.md`.
- **UI** (`tests/ui.test.js`): montaje de `HUD.vue` y `GameOver.vue` con `@vue/test-utils` y `jsdom`.

## Archivos que no deben tocarse sin motivo explícito

- `.kiro/specs/simulador-tunel-infinito/requirements.md`: fuente de verdad del alcance. Cualquier capacidad nueva debe nacer aquí, no en el código.
- `.kiro/specs/simulador-tunel-infinito/design.md`: arquitectura acordada. Cambios estructurales requieren actualizarlo antes que el código.
- `.kiro/steering/*.md`: contexto persistente; ediciones solo cuando cambie el producto, el stack o la estructura.
- `package.json` y `vite.config.js`: tocar solo si se añade o cambia una dependencia o configuración de build de forma justificada.

# Power: threejs-runner

## Propósito

Empaqueta en un único Power instalable el conocimiento y las herramientas necesarias para construir y mantener juegos **endless runner** con Three.js: túnel procedural, reciclaje de segmentos, colisiones por bounding box y HUD reactivo con Vue. Incluye un Skill con instrucciones específicas del dominio, un recurso de referencia rápida y un servidor MCP Fetch como demostración funcional de integración de herramientas.

## Problema que resuelve

Sin contexto específico del dominio, un agente genérico no sabe que un endless runner debe usar **pools fijos** de segmentos y obstáculos para mantener 60 fps, que el delta debe recortarse a `0.05` para evitar teletransportes, que `posicionLateral` siempre debe acotarse a los límites del túnel, o que las colisiones deben resolverse con AABB simple y no con SAT. Este Power inyecta esas convenciones en el contexto del agente cuando el usuario habla de Three.js, túnel procedural o reciclaje de objetos.

## Requisitos previos

- **Kiro IDE** (versión que soporte Powers con Agent Plugins).
- **Node.js 18+** (para el proyecto Three.js/Vue).
- **Python 3.10+** y **`uv`** instalado, para ejecutar el servidor MCP Fetch vía `uvx` . Si no tienes `uv`, instálalo desde https://docs.astral.sh/uv/getting-started/installation/.

## Instalación desde carpeta local

1. Abre el panel **Powers** en Kiro IDE.
2. Selecciona **Add Custom Power** → **Import power from a folder**.
3. Selecciona la carpeta `powers/threejs-runner/` (la que contiene `plugin.json`) .
4. Pulsa **Install**.
5. Verifica que el Power aparece como activo en el panel Powers.

## Configuración

El Power no requiere configuración adicional más allá de tener `uv` disponible para el MCP Fetch. Todos los parámetros del juego (límites laterales, tamaño del pool, velocidad base) viven en el código del proyecto, no en el Power.

## Skills incluidos

### `threejs-endless-runner`

Skill con instrucciones específicas para el núcleo del juego: pool fijo de segmentos, delta acotado, clamp lateral, colisiones AABB y HUD reactivo. Se activa cuando el usuario menciona Three.js, endless runner, túnel procedural, reciclaje de segmentos o colisiones por bounding box.

- **Propósito:** guiar la implementación y el mantenimiento del núcleo del juego.
- **Instrucciones:** 8 pasos de trabajo que cubren lectura previa del código, pool fijo, delta acotado, clamp lateral, AABB, HUD reactivo, fallback geométrico y pruebas.
- **Casos de uso:** implementar o modificar `Game.js`, `TunnelManager.js`, `ObstacleManager.js`, `Player.js`.
- **Condiciones de activación:** cuando el usuario trabaja en el núcleo de un endless runner con Three.js.
- **Entradas:** archivos de `src/game/`, el spec y el steering técnico del proyecto.
- **Salida esperada:** código coherente con el spec, sin instanciaciones en el bucle caliente y sin valores fuera de rango.
- **Dependencias:** Three.js `^0.169`, Vue 3 `^3.5`, Vitest, fast-check.

## Recursos incluidos

### `resources/game-invariants.md`

Referencia rápida de las 4 invariantes críticas del MVP. Cada invariante incluye la regla, el motivo y la señal de alarma que indica que se ha violado.

- **Nombre:** `game-invariants.md`.
- **Propósito:** que el Skill pueda recordar las reglas críticas sin cargar todo el spec.
- **Formato:** Markdown.
- **Skill que lo usa:** `threejs-endless-runner` (sección `## Recursos`).
- **Condiciones de uso:** se consulta solo cuando la tarea en curso toca alguna de las 4 invariantes (pool fijo, clamp lateral, delta recortado, AABB). No se carga por defecto.

## Configuración MCP incluida

El Power incluye un `mcp.json` con el servidor **Fetch** de referencia, que expone una única herramienta `fetch` para descargar URLs y convertirlas a markdown .

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "fetch": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    }
  }
}
```

**En Windows**, si el servidor da timeouts al conectar, añade la variable de entorno `PYTHONIOENCODING=utf-8` a la configuración del servidor. El equipo de MCP documenta este problema como específico de Windows .

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "fetch": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-fetch"],
      "env": { "PYTHONIOENCODING": "utf-8" }
    }
  }
}
```

> **Nota:** esta variante con `env` es la recomendada en Windows. El `mcp.json` del Power no incluye `env` por defecto; si experimentas timeouts, edítalo manualmente para añadir la variable.

## Variables de entorno requeridas

| Variable | Valor | Cuándo | Propósito |
|---|---|---|---|
| `PYTHONIOENCODING` | `utf-8` | Solo Windows, si el MCP Fetch da timeouts | Evita problemas de encoding en la comunicación stdio con el servidor Python . |

No hay secretos ni credenciales. El servidor Fetch no requiere autenticación.

## Ejemplos de uso

- *"Ayúdame a implementar el reciclaje de segmentos del túnel"* → activa el Skill y aplica las convenciones de pool fijo.
- *"¿Cómo debo detectar la colisión del vehículo con los obstáculos?"* → activa el Skill y sugiere `Box3.intersectsBox`.
- *"Recuérdame las invariantes que no debo romper"* → el Skill consulta `resources/game-invariants.md`.
- *"Carga la documentación de Three.js sobre Box3"* → el MCP Fetch obtiene la página oficial y la convierte a markdown.

## Validación

Para comprobar que el Power funciona:

1. Abre Kiro IDE en el proyecto `simulador-tunel-infinito`.
2. Menciona en el chat: *"trabajemos en el reciclaje de segmentos del túnel"*.
3. Verifica que Kiro activa el Power `threejs-runner` (visible en el panel Powers o en el contexto del chat).
4. Pide: *"recuérdame las invariantes del juego"* para verificar que el Skill consulta el recurso.
5. Pide: *"carga la página de Three.js sobre Box3"* para probar el MCP Fetch.

## Seguridad

- El MCP Fetch **puede acceder a direcciones IP locales e internas** y representa un riesgo de seguridad si se usa sobre URLs no confiables. El equipo de MCP lo advierte explícitamente .
- El servidor Fetch respeta `robots.txt` por defecto para peticiones iniciadas por el modelo .
- No se incluyen secretos ni credenciales en el Power.
- El Skill no tiene permisos de shell ni de escritura; solo guía el comportamiento del agente.
- El recurso `game-invariants.md` es solo lectura y no contiene datos sensibles.

## Limitaciones conocidas

- El MCP Fetch **no busca en la web**: solo descarga URLs que el usuario o el agente le proporcionen explícitamente .
- La respuesta se trunca por defecto a 5000 caracteres; se puede ampliar o paginar con los argumentos `max_length` y `start_index` .
- El Power no incluye hooks ni steering adicionales; el hook `build-check-core` y los steering del proyecto viven en `.kiro/` y son independientes del Power.
- El recurso `game-invariants.md` es una referencia rápida, no sustituye al spec ni al diseño del proyecto.

## Desinstalación o reversión

1. Abre el panel **Powers** en Kiro IDE.
2. Localiza `threejs-runner` en la lista de Powers instalados.
3. Selecciona **Uninstall** (o **Disable** si solo quieres desactivarlo temporalmente).
4. El MCP Fetch incluido se desactiva junto con el Power; Kiro gestiona internamente su ciclo de vida.

# Configuración y validación del MCP

## Objetivo dentro del aplicativo

Permitir que el agente consulte documentación técnica actual de Three.js (por ejemplo, la API de `Box3`, `FogExp2` o `GLTFLoader`) directamente desde el chat, sin salir del flujo de trabajo. Aunque el MCP Fetch no es crítico para el MVP, sirve como demostración funcional del punto 6 y como utilidad real cuando se trabaja en el núcleo del juego.

## Servidor seleccionado y razón de la elección

**Servidor:** Fetch (`mcp-server-fetch`), implementación de referencia oficial del equipo de MCP .

**Razón de la elección:**
- Es una implementación de referencia mantenida por el equipo de MCP, no un paquete de terceros no auditado.
- Expone una única herramienta (`fetch`), lo que minimiza el consumo de contexto y el riesgo.
- Convierte HTML a markdown, formato ideal para que el agente consuma documentación técnica.
- No requiere credenciales ni OAuth.
- Se ejecuta con `uvx` sin instalación previa, lo que simplifica la validación .

**Alternativa considerada y descartada:** Context7 (MCP especializado en documentación de librerías). Se descartó porque requiere una API key y su integración es más pesada para un MVP que no depende críticamente de documentación externa.

## Herramientas que se utilizarán

| Herramienta | Descripción | Uso en el proyecto |
|---|---|---|
| `fetch` | Descarga una URL y convierte su contenido a markdown . | Consultar la documentación de Three.js sobre `Box3`, `FogExp2`, `GLTFLoader` o cualquier otra API usada en `src/game/`. |

Argumentos de `fetch` :
- `url` (string, requerido): URL a descargar.
- `max_length` (integer, opcional): máximo de caracteres a devolver (por defecto 5000).
- `start_index` (integer, opcional): índice de inicio para paginar contenido largo.
- `raw` (boolean, opcional): devuelve el contenido sin conversión a markdown.

## Prerrequisitos

- **Python 3.10+** instalado y disponible en el `PATH`.
- **`uv`** instalado (recomendado por el equipo de MCP para ejecutar servidores Python vía `uvx`) .
- **Kiro IDE** con soporte para MCP .
- **Node.js** (opcional): si está instalado, el servidor Fetch usa un simplificador de HTML más robusto .

## Instalación desde PowerShell

### 1. Verificar Python

```powershell
python --version
```

Esperado: `Python 3.10.x` o superior.

### 2. Instalar `uv` (si no está instalado)

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 3. Verificar `uv`

```powershell
uv --version
```

Esperado: una versión de `uv` (por ejemplo, `uv 0.5.x`).

### 4. Verificar que `uvx` puede ejecutar el servidor Fetch

```powershell
uvx mcp-server-fetch --help
```

Esperado: ayuda del servidor Fetch sin errores. La primera ejecución puede tardar unos segundos porque `uvx` descarga el paquete.

### 5. Verificar la configuración del workspace

La configuración ya fue creada en `.kiro/settings/mcp.json`. Para verificarla:

```powershell
Get-Content .kiro/settings/mcp.json
```

## Configuración externa o web

**Ninguna.** El servidor Fetch no requiere cuenta, proyecto, endpoint, OAuth ni credenciales. Solo necesita conexión a internet para descargar las URLs que se le soliciten.

## Variables de entorno y secretos

| Variable | Valor | Propósito |
|---|---|---|
| `PYTHONIOENCODING` | `utf-8` | Evita timeouts por problemas de encoding en Windows . |

No hay secretos ni credenciales. La configuración usa `env` en `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"],
      "env": {
        "PYTHONIOENCODING": "utf-8"
      },
      "disabled": false,
      "autoApprove": [],
      "disabledTools": []
    }
  }
}
```

## Activación en Kiro

1. Abre la paleta de comandos con `Ctrl + Shift + P` en Windows/Linux o `Cmd + Shift + P` en macOS .
2. Selecciona `Kiro: Open workspace MCP config (JSON)` .
3. Verifica que el archivo `.kiro/settings/mcp.json` contiene la configuración del servidor `fetch`.
4. Guarda el archivo (`Ctrl + S`). Kiro reconecta los servidores automáticamente .
5. Abre el panel **MCP servers** en Kiro y comprueba que `fetch` aparece como conectado .
6. Si hay errores, haz clic derecho sobre el servidor en el panel MCP y selecciona **Show MCP Logs** .

## Prueba funcional

Una vez que el servidor aparece conectado en el panel MCP, ejecuta este prompt en el chat de Kiro:

```
Usa la herramienta fetch del MCP para cargar la documentación de Three.js sobre Box3 desde https://threejs.org/docs/#api/en/math/Box3 y dime qué métodos tiene para detectar intersecciones entre cajas.
```

**Resultado esperado:** Kiro invoca la herramienta `fetch`, descarga la página de Three.js sobre `Box3` y responde con los métodos relevantes (por ejemplo, `intersectsBox`). No afirmes que la prueba se ejecutó hasta que el usuario lo confirme en Kiro.

## Seguridad y permisos

- **Riesgo de IP interna:** el servidor Fetch puede acceder a direcciones IP locales e internas, lo que representa un riesgo de seguridad si se usa sobre URLs no confiables . En este proyecto, el uso previsto es exclusivamente documentación pública en internet.
- **`robots.txt`:** por defecto, el servidor respeta `robots.txt` para peticiones iniciadas por el modelo .
- **`autoApprove` vacío:** ninguna herramienta se autoaprueba. El usuario debe confirmar cada llamada a `fetch` .
- **`disabledTools` vacío:** todas las herramientas del servidor están disponibles (solo hay una, `fetch`).
- **Sin secretos:** la configuración no incluye credenciales.

## Solución de problemas

| Problema | Causa probable | Solución |
|---|---|---|
| El servidor no aparece en el panel MCP | Config no guardada o JSON inválido | Verifica el JSON y guarda el archivo . |
| Error de conexión | `uv` no instalado o no está en el `PATH` | Ejecuta `uv --version`; si falla, reinstala `uv` . |
| Timeout en Windows | Encoding de caracteres | Añade `PYTHONIOENCODING=utf-8` en `env` . |
| El servidor no responde | Puerto o proceso bloqueado | Revisa `Show MCP Logs` en el panel MCP . |
| `fetch` no encuentra la URL | URL inválida o sin conexión | Verifica la URL y la conexión a internet. |

## Desinstalación o reversión

1. Abre la paleta de comandos y selecciona `Kiro: Open workspace MCP config (JSON)`.
2. Elimina la entrada `fetch` del objeto `mcpServers` (o pon `"disabled": true` para desactivarlo temporalmente).
3. Guarda el archivo. Kiro desconecta el servidor automáticamente.

**Nota:** si el Power `threejs-runner` está instalado, su propio `mcp.json` incluye una configuración de Fetch independiente. Desinstalar el Power desde el panel Powers elimina esa configuración gestionada por Kiro.

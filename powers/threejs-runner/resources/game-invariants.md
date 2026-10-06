# Invariantes del juego

Referencia rápida de las 4 invariantes críticas del endless runner. Cada una incluye la regla, el motivo y la señal de alarma que indica que se ha violado.

## 1. Pool fijo de segmentos y obstáculos

**Regla:** el número de segmentos de túnel vivos en escena debe ser siempre igual a `POOL_SIZE`. Lo mismo aplica al pool de obstáculos. Los segmentos y obstáculos que quedan detrás de la cámara se reciclan al frente, reutilizando su geometría y material existentes.

**Motivo:** instanciar geometría o material en el bucle caliente dispara el recolector de basura y provoca caídas de framerate por debajo de 60 fps.

**Señal de alarma:** presencia de `new THREE.Mesh`, `new THREE.BoxGeometry`, `new THREE.CylinderGeometry` o `new THREE.MeshStandardMaterial` dentro de la función que corre en `requestAnimationFrame`.

**Cómo verificarlo:** `escena.children.filter(esSegmento).length === POOL_SIZE` tras cualquier número de frames.

## 2. Clamp lateral de posicionLateral

**Regla:** tras cualquier actualización, `posicionLateral` debe quedar dentro del intervalo cerrado `[-LIMITE, +LIMITE]`. Si el valor propuesto lo supera, se recorta al límite correspondiente.

**Motivo:** sin clamp, el vehículo atraviesa las paredes del túnel y la experiencia se rompe visualmente.

**Señal de alarma:** asignaciones directas a `posicionLateral` sin pasar por `Math.max(-LIMITE, Math.min(LIMITE, valor))` (o equivalente).

**Cómo verificarlo:** generar secuencias aleatorias de teclas y comprobar que `posicionLateral` nunca sale del rango, incluso manteniendo la tecla de movimiento pulsada durante muchos frames.

## 3. Delta recortado a 0.05

**Regla:** antes de usarse en cualquier desplazamiento, el delta de tiempo debe estar acotado con `Math.min(delta, 0.05)`.

**Motivo:** cuando la pestaña pierde el foco, `requestAnimationFrame` deja de dispararse y el siguiente frame trae un `delta` gigante. Sin recorte, el vehículo y los obstáculos se teletransportan y la detección de colisiones deja de ser fiable.

**Señal de alarma:** uso de `delta` (o `clock.getDelta()`) directamente en actualizaciones de posición sin un `Math.min` previo.

**Cómo verificarlo:** en el navegador, cambiar de pestaña durante unos segundos y volver. El vehículo no debe aparecer desplazado de forma brusca ni atravesar obstáculos sin colisión.

## 4. Colisión por bounding box alineada a ejes

**Regla:** la detección de colisión entre el vehículo y los obstáculos se resuelve con `Box3.intersectsBox`. Si las proyecciones de ambas cajas se solapan en los tres ejes (X, Y, Z), hay colisión y el juego termina.

**Motivo:** los obstáculos y el vehículo tienen formas aproximadamente cúbicas o cilíndricas; el AABB es suficiente para el MVP y evita introducir SAT u otras pruebas más costosas.

**Señal de alarma:** cálculos manuales de solape, uso de distancias entre centros, o pruebas con esferas en lugar de `Box3`.

**Cómo verificarlo:** generar pares de cajas con centros y dimensiones aleatorios y comparar `Box3.intersectsBox` contra un cálculo explícito de solape en los tres ejes.

---

## Uso desde el Skill

Este recurso se consulta cuando el Skill `threejs-endless-runner` necesita recordar las invariantes mientras trabaja en el núcleo del juego. No sustituye al spec ni al diseño: es una referencia rápida de las reglas que no deben romperse bajo ninguna circunstancia.

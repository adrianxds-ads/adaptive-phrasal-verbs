# Adaptive Phrasal Verbs

PWA hermana de Adaptive English para automatizar 120 phrasal verbs prioritarios mediante repetición rápida.

## v0.4.0

- interfaz y audio conservados del modelo Adaptive English
- 15 preguntas por nivel
- reloj fijo de 15 segundos
- banco ampliado de 50 a 120 phrasal verbs
- contextos ultracortos: máximo 7 palabras
- modo meaning reducido a reconocimiento instantáneo
- paraphrases recortadas para lectura rápida
- cuatro opciones por pregunta con un banco amplio de distractores
- distractores progresivos: mismo verbo base, misma familia semántica, partícula y confusiones reales
- a mayor nivel, menor ventana de distractores y mayor similitud entre opciones
- entrenamiento English-only
- cinco modos: context, meaning, close contrast, particle y Cambridge paraphrase
- mastery exige exposición en varios tipos de ejercicio
- progreso local conservado mediante la misma clave de almacenamiento

Publicación: https://adrianxds-ads.github.io/adaptive-phrasal-verbs/


## 24/10/2026 · Reparación local del vencimiento en respuestas

**Base:** `1314737` (`main`). En la rama aislada `repair/phrasal-deadline-20261024` se reprodujo en Edge móvil un acierto después de vencer el reloj de 15 s cuando su callback iba retrasado (250 ms). En `app.js`, `answer()` valida ahora `Date.now() >= deadline`: descarta la opción tardía y registra `timeout`, sin cambiar el banco, la prelectura, las claves de progreso ni las recompensas.

**Prueba:** `python test-phrasal-deadline-browser.py`: FAIL sobre base (acierto tardío), PASS tras el parche (tiempo agotado, sin puntos, un registro y acierto dentro de plazo). Edge aislado 360×740 y 412×915, 0 errores JS. También `node --check app.js` y `git diff --check`. **Estado:** commit local aislado, no fusionado ni publicado, sin Argon ni datos reales; Pixel 10 pendiente.


### 24/10/2026 · Cierre de integración aislada y preparación PWA

- Recorrido de navegador: partida completa de 15 preguntas mediante botones (8/15; aciertos y errores); pantalla final, sesión y nivel recuperados tras recarga, sin errores JavaScript. Nivel simulado: 1 → 2. Perfiles Edge separados, sin datos personales. Test común: `C:\Users\adria\AppData\Local\Temp\hub-four-quizzes-fullround-20261024.py` (ejecutado para cuatro ramas; PASS).
- Prelectura: cuatro tarjetas ocultas antes de revelar, temporizador de respuesta activado después, único registro y modo `READ_FIRST` comprobados (PASS). Test común: `C:\Users\adria\AppData\Local\Temp\hub-four-quizzes-readfirst-20261024.py`.
- Versión candidata: `0.13.20`; el HTML actualiza rutas `app.js` y `service-worker.js`, se fuerza revisión del service worker y `build-assets.js` incorpora las huellas SHA-256 actualizadas. Cache build candidato: `ea5e61b32c1a92e1`. Verificado que los hashes corresponden a los archivos locales, sin tocar claves de almacenamiento, contenido pedagógico, Hub o Core.
- Reejecutadas tras preparar caché: pruebas de deadline, `node --check` en JS y `git diff --check` (PASS). En Cloze también batería oficial de 900 preguntas y temporizador adaptativo (PASS).
- Estado: cambios locales listos para revisión de integración, pero sin fusión ni despliegue. No se ha probado funcionamiento offline real con service worker ni en Pixel 10. Hasta publicación autorizada, Hub `versions.json` y versiones públicas siguen iguales.

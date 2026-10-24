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


### 24/10/2026 · PWA offline con service worker real (cierre de versión candidata)

La primera prueba con servidor local en `127.0.0.1` identificó una huella desactualizada para `/adrian-core/components/adrian-sync.js` en `build-assets.js`: se esperaba `c675d9b7…`, aunque tanto el Core publicado como el archivo local daban SHA-256 `8372851b…`. Los workers con precarga obligatoria (Grammar y Classroom) no se activaban. Se actualizó **solo** ese hash en el manifiesto de esta rama y se recalculó `AdrianRelease.build` (sin tocar `adrian-core`, sus imports, claves de almacenamiento ni código pedagógico).

Prueba repetida: Edge en contexto nuevo, instalación y activación efectivas del service worker, recarga online, desconexión de red, recarga offline e inicio del quiz con cuatro respuestas. **PASS**; caché `1554eb82ae628384` con 33 recursos, marcador de datos conservado, cero errores JS. Las otras tres ramas también dieron PASS. Comprobación global: 0 ficheros faltantes y 0 huellas SHA-256 discordantes en los cuatro manifiestos (comparados contra archivos locales, ahora equivalentes al recurso Core publicado).

Evidencia reproducible en el entorno Windows: `C:\Users\adria\AppData\Local\Temp\hub-offline-candidate-server-20261024.py` y `hub-offline-candidates-test-20261024.py`. El servidor de pruebas escucha solo en loopback y se detiene tras las pruebas. **No equivale** a actualización desde una caché real anterior, prueba física Pixel 10 ni despliegue. Sigue pendiente autorización para fusionar/publicar.


### 24/10/2026 · Verificación de actualización desde versión anterior (QA aislado)

- Versiones simuladas: `0.13.19` → `0.13.20`, con fuentes de `main` originales y rama candidata, y el recurso histórico de Core recuperado del commit `550f924` para conservar las huellas antiguas. Una respuesta real de prueba antes del cambio, comprobación de historial/nivel después y partida iniciada offline. **Sin navegador, progreso ni datos del usuario.**
- El service worker histórico se activó correctamente. Tras registrar una respuesta, la actualización estándar cambió el controlador y el caché sin perder el historial; el arranque offline funcionó.
- Prueba compartida reproducible: `_repair_cloze_20261024/test-four-pwa-upgrade.py` (Playwright + Edge en contextos nuevos, servidor HTTP solo en 127.0.0.1; prueba conjunta: **4/4 PASS**). La salida distingue tres cambios completos de service worker y la recuperación de progreso de Grammar con instalación nueva.
- No fusionado, no publicado ni comprobado en Pixel 10. No modifica las claves de progreso ni los bancos de preguntas. La sustitución de la caché antigua ya instalada de Grammar requiere comprobación posterior; ninguna prueba local certifica lo que ocurrirá en un dispositivo real.

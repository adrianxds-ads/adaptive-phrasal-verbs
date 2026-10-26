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


### 24/10/2026 · Publicación comprobada (0.13.20)

- Integración en `main` por fast-forward, sin reescribir historial: `4b46b79`. Push a `origin/main` aceptado; GitHub Pages sirve desde `main` (raíz).
- Verificación HTTP pública: `app.js`, `index.html`, `service-worker.js` y `build-assets.js` con HTTP 200 y SHA-256 idéntico a los archivos publicados previstos. Build de caché: `1554eb82ae628384`.
- Verificación de uso: Edge en perfil **temporal y aislado**, navegación a `https://adrianxds-ads.github.io/adaptive-phrasal-verbs/`, instalación del service worker actualizado, recarga offline e inicio del quiz con cuatro respuestas (PASS; sin errores JS). La sincronización remota se bloqueó en las pruebas para no crear datos ficticios.
- Transición histórica 0.13.19 → 0.13.20 probada con service worker antiguo activo.
- Publicación y funcionamiento en navegador verificados; **no se ha verificado todavía el Pixel 10 ni una actualización física de una instalación previa**. No se alteraron claves ni registros de progreso de usuarios. No se modificaron Hub ni Core.


### 24/10/2026 · Cierre verificado en Pixel 10 real

- **Dispositivo:** Pixel 10, Android 17; WebAPK instalado y abierto de forma normal mediante ADB. Chrome DevTools remoto confirmó `APP_VERSION=0.13.20`, la activación del service worker de la versión publicada y el arranque funcional. Sin reinstalación, borrado de cachés ni respuesta a ejercicios.
- **Progreso conservado:** el registro de respuestas, el nivel y las sesiones se conservaron sin alteraciones durante la actualización.
- **Prueba offline física:** se simuló la pérdida de conexión solo en la pestaña mediante Chrome DevTools (sin apagar Wi‑Fi ni datos móviles). Recarga sin red correcta, interfaz cargada, service worker activo y mismos contadores antes/después. Después se restauró la red de la pestaña y se verificó el arranque online (**PASS**).
- **Protección:** antes de la primera recarga se verificó una copia de seguridad local del almacenamiento. La posterior compresión GZIP de las claves de estudio se decodificó y comparó con los contadores e historiales originales; Classroom también se comprobó con registro IndexedDB respaldado y SHA-256 válido. Estas copias permanecen solo en el ordenador autorizado, fuera de Git; no se han publicado los contenidos de las copias locales.
- **Resultado:** versión publicada y funcionamiento **comprobados en el dispositivo objetivo**. Se devolvió ChatGPT al primer plano del Pixel y se retiró el túnel temporal de depuración. Sin bloqueos técnicos pendientes de esta reparación.


### 26/10/2026 · Cloze Arena v2 · adaptación Mobile First (rama no publicada)

- **Referencia:** Cloze Arena & Mission Deck v2 publicada (GitHub b2-multiple-choice-cloze, main 25fdd85); diseño aprobado, sin modificar la referencia.
- **Integración:** hub-arena-mobile-v2.css y hub-arena-mobile-v2.js idénticos en Grammar/Phrasal/Classroom. Portada OLED/teal, estadísticas breves, HUD único, 15 segmentos, temporizador visual y opciones táctiles 2×2; resultados con detalles secundarios plegables.
- **Contratos conservados:** los motores originales, puntuación, bancos de preguntas, almacenamiento, sincronización y reglas de tiempo (15 segundos habitualmente y excepciones propias) no se modificaron. El nuevo HUD refleja los valores de los temporizadores existentes; no crea otro cronómetro.
- **PWA:** index.html y service-worker.js incorporan los nuevos recursos y build-assets.js incluye huellas SHA-256 y nueva identidad de caché.
- **QA verificadas en Edge temporal:** nueve de nueve combinaciones de 360x800, 390x844 y 412x915 para las tres apps; sesiones de 15 respuestas completas en las tres; pausa Grammar validada. Evidencias locales en la carpeta QA del espacio de revisión.
- **Pendiente:** el arranque de partida offline no superó la prueba consistente en el perfil aislado. Sí se comprobó la caché y carga de la portada sin red. Resolver antes de publicar y comprobar en Pixel 10 la experiencia PWA real.
- **Estado:** exclusivamente rama local feature/cloze-arena-mobile-20261026, sin push, merge ni publicación.


### 26/10/2026 · Auditoría de equivalencia Cloze Arena v2 cerrada

- Rama: feature/cloze-arena-mobile-20261026; sin merge, push ni publicación. Corrige la candidata anterior, cuya nota sobre offline queda superada.
- Reparación: las tarjetas correctas/incorrectas ahora tienen fondo verde/rojo íntegro y feedback coherente; el HUD muestra lectura previa, urgencia y respuesta registrada. En Grammar/Phrasal la respuesta correcta visible se usa para el feedback sintético; los motores de corrección son originales.
- Classroom: HUD del contrato de clase muestra tiempo y pregunta real sin límite falso de quince; 15 segmentos representan avance proporcional al mínimo de la sesión. Modo quiz rápido conserva sus 15 preguntas; no cambian sus reglas ni planificación.
- Pruebas de entorno aislado: 9/9 pantallas móvil de tres apps en 360×800, 390×844 y 412×915; partida de 15 respuestas en cada juego; test específico de contrato Classroom 21 preguntas y 70 minutos restantes; arranque PWA offline y cuatro respuestas activas en los tres juegos. Manifiesto SHA-256 de CSS/JS verificado.
- Intactos: bancos, contenidos, IDs, localStorage, IndexedDB, motores JS y referencias publicadas; Cloze estable no modificada.
- Pendiente externo: aprobación visual en Pixel 10 físico; no se ha probado actualización de las instalaciones del dispositivo ni autorizado publicación.

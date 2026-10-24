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

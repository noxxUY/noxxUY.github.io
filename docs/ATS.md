# Reglas ATS de este portfolio

Un ATS (Applicant Tracking System) es el software que lee tu CV antes que cualquier
persona. No lee sitios web: lee el PDF que subís al postularte, y a veces el texto de
tu LinkedIn o GitHub. Por eso el sitio y el CV salen del mismo archivo
(`src/data/profile.ts`) y siguen las mismas reglas.

## Checklist

| # | Regla | Estado |
|---|-------|--------|
| 1 | Nombre y apellido reales, en texto plano, arriba de todo. | **Pendiente a propósito.** `fullName` está vacío y se publica bajo el alias `noxx`; el email es el único identificador real. Un ATS no puede vincular el CV a una persona: para revertirlo, completá `profile.fullName`. |
| 2 | Email en texto plano en el CV. Teléfono opcional. | Cumple (`noxxzeraa@proton.me`). Sin teléfono, que es opcional. |
| 3 | Ubicación (ciudad, país) y URLs completas de GitHub, LinkedIn y portfolio. | Cumple (URLs completas). Ubicación: solo "Uruguay"; agregá la ciudad si querés. |
| 4 | Títulos de sección estándar: Summary, Skills, Projects, Open source, Links (ES: Resumen, Habilidades, Proyectos, Código abierto, Enlaces). | Cumple. |
| 5 | Título de puesto literal ("Frontend Developer" / "Desarrollador Frontend") debajo del nombre. | Cumple. |
| 6 | Tecnologías con nombre canónico: TypeScript, React, Three.js, Tailwind CSS, Astro, Vite, C++, Reverse engineering. | Cumple. |
| 7 | Fechas en formato "Sep 2026" o "2026 – present" (ES: "sep 2026", "2026 – actualidad"). | Cumple. |
| 8 | CV en una sola columna. Sin tablas, cuadros de texto, encabezados o pies de página, imágenes, íconos ni gráficos. Sin barras o porcentajes de skills. | Cumple. |
| 9 | PDF con capa de texto real (se genera desde HTML con Chromium, `npm run render`). | Cumple. |
| 10 | Sin emojis ni caracteres decorativos. | Cumple en el sitio y el CV. Tu bio de GitHub es solo "🎐": cambiala. |
| 11 | Un idioma por CV. Términos técnicos en inglés dentro del CV en español están bien. | Cumple (`noxx-CV-en.pdf`, `noxx-CV-es.pdf`). |
| 12 | Nombre de archivo: `Nombre-Apellido-CV.pdf`. | Pendiente hasta que haya nombre (hoy `noxx-CV-en.pdf`). Se deriva de `profile.alias`. |
| 13 | Web: `<h1>` = nombre, `<h2>` = secciones, texto real en HTML, `alt` en capturas, `lang` por idioma, JSON-LD `Person`, meta description. | Cumple. El visor 3D del hero es decoración: está `aria-hidden`, no hay ningún dato que exista solo adentro del canvas, y el PDF del CV no lo toca. |
| 14 | Cada skill listada tiene que poder sostenerse en una entrevista. | **Revisá la lista** en `profile.skills` antes de publicar. |

## Qué avisar cuando pidas cambios

Cualquiera de estos pedidos rompe una regla de arriba y lo voy a marcar antes de hacerlo:

- Usar solo un alias o un apodo como nombre.
- Reemplazar texto por íconos (por ejemplo, logos de tecnologías sin el nombre escrito).
- Barras, porcentajes, radares o "niveles" de skills.
- Nombres creativos para secciones ("Mis criaturas", "Laboratorio").
- Texto dentro de imágenes o canvas que no exista también como texto.
- CV a dos columnas, con tablas de layout o con encabezado/pie de página.
- Emojis en el CV.
- Mezclar idiomas en un mismo CV.
- Fechas vagas ("hace un tiempo", "2026-ish").

## Perfil de GitHub

El ATS no lo lee, pero el recruiter sí, y hoy está flojo:

- Nombre: poné el real (o al menos "noxx" + apellido).
- Bio: `Frontend Developer · TypeScript, React, three.js · browser tools for game file formats`.
- Ubicación: `Montevideo, Uruguay` (con mayúscula).
- Website: `https://noxxuy.github.io`.
- Topics en cada repo (`typescript`, `react`, `threejs`, `gta`, `minecraft`, `browser`).

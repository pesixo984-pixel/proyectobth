# Kallpa · Cursos Preuniversitarios

Plataforma web con **Node.js + SQLite**, sin dependencias externas (no necesitas `npm install`).

## Requisitos
- **Node.js 22.13 o superior** (usa el SQLite integrado de Node).
- Si tienes una versión anterior de Node: `npm install better-sqlite3` y el proyecto lo usará automáticamente.

## Ejecutar
```bash
cd preuniversitario
node server.js
```
Abre <http://localhost:3000> (otro puerto: `PORT=4000 node server.js`).

La primera vez se crea `data/preuniversitario.db` con 7 áreas académicas, 23 carreras, 104 materias y 454 módulos de ejemplo.

## Cuentas de ejemplo (cámbialas al publicar)
| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@kallpa.bo | Admin2026! |
| Profesor | profesor@kallpa.bo | Profesor2026! |
| Estudiante | estudiante@kallpa.bo | Estudiante2026! |

Quien se registra desde la web siempre queda como **estudiante** y debe elegir su **departamento** tocando el mapa de Bolivia (se resalta en dorado). Según el departamento ve solo las áreas académicas y carreras disponibles allí. Cada facultad tiene una lista de departamentos (`faculties.departments`); el admin la edita con casillas al crear/editar una facultad. Ejemplo de datos: todas están en La Paz y Cochabamba, salvo Arquitectura (solo La Paz) y Agrícolas (solo Cochabamba). El mapa (`public/js/bolivia-map.js`) es simplificado y aproximado; puedes reemplazar los trazados manteniendo los `id`. El administrador puede cambiar roles o crear usuarios desde **Panel admin → Usuarios**.

## Qué puede hacer cada rol
| | Visitante | Estudiante | Profesor | Admin |
|---|:-:|:-:|:-:|:-:|
| Ver facultades, carreras y materias | ✔ | ✔ | ✔ | ✔ |
| Ver el contenido de los módulos | — | ✔ | ✔ | ✔ |
| Estudiar cada módulo (página con lista lateral, anterior/siguiente) y guardar su progreso | — | ✔ | ✔ | ✔ |
| Perfil propio (datos, departamento, contraseña, cerrar sesión; el admin accede al panel desde aquí) | — | ✔ | ✔ | ✔ |
| Perfil de estudio: estadísticas, carrera objetivo con ruta por materia y actividad reciente | — | ✔ | — | — |
| Crear/editar/eliminar **materias y módulos** | — | — | ✔ | ✔ |
| Crear/editar/eliminar **facultades y carreras** | — | — | — | ✔ |
| Gestionar usuarios y roles, leer mensajes de contacto | — | — | — | ✔ |

## Ver la base de datos en DB Browser for SQLite
**File → Open Database** y elige `data/preuniversitario.db`. Tablas: `users`, `sessions`, `faculties`, `careers`, `subjects`, `modules`, `module_progress`, `messages` (la tabla `users` incluye `university` y `target_career_id`). Las bases creadas con versiones anteriores se actualizan solas al iniciar.
Cierra DB Browser o pulsa *Write Changes* antes de usar la web para evitar bloqueos.

## Personalizar
- Datos de contacto: constante `CONTACT` al inicio de `public/js/app.js`.
- Colores: variables CSS al inicio de `public/css/style.css`.
- Fondo de aguayo: imagen `public/img/aguayo.jpg`; la intensidad se ajusta con `--aguayo-veil` (capa blanca; más cercano a 1 = más tenue).
- Ilustración del inicio: `public/img/hero.svg`.
- Contenido inicial: `seed.js`. Para regenerarlo: `npm run reset-db` y volver a iniciar el servidor.

## Estructura
```
server.js        API REST, sesiones y permisos por rol
db.js            esquema SQLite y hash de contraseñas (scrypt)
seed.js          datos iniciales
public/          interfaz (index.html, css/style.css, js/app.js)
data/            base de datos .db
```

## Seguridad incluida
Contraseñas con scrypt y sal, sesiones con cookie HttpOnly, permisos verificados en el servidor, consultas SQL parametrizadas, escape de HTML, política CSP, límite de intentos en login/registro/contacto y validación de enlaces (solo http/https).
Para publicarla en internet usa HTTPS (por ejemplo, detrás de Nginx o Caddy) y cambia las contraseñas de ejemplo.

## Calendario
Página `#/calendario`: calendario mensual y panel de eventos. Solo el admin crea, edita y elimina eventos (tabla `events`: título, fecha, hora, lugar, departamento, detalles). Un evento sin departamento aplica a todo el país; los estudiantes ven los de su departamento y los generales.

## Universidades y contraseña
Al elegir el departamento (registro y Áreas académicas) se listan las universidades públicas con examen de ingreso allí (tabla `universities`, precargada; el admin agrega, edita o elimina desde Áreas académicas). Los campos de contraseña tienen el botón de ojo para mostrar u ocultar.

## Registro por universidad
El estudiante elige departamento (mapa) y luego su universidad. Sin iniciar sesión, la sección muestra las universidades; con sesión, un estudiante ve solo las áreas académicas de su universidad (`faculties.university_ids`). El admin asigna las universidades de cada facultad con casillas.

## Imágenes y filtro del calendario
El admin sube una imagen por universidad (Editar universidad; se reduce a 640 px y se guarda en `data/uploads/`). El calendario tiene filtro por tipo (examen, inscripción, anuncio, otro) y por departamento.

## Rediseño: registro e información de ingreso
El registro pregunta solo el departamento y la universidad a la que se desea postular (sin mapa). Todos ven todas las áreas académicas. En cada facultad se muestra en qué universidades está disponible, y en cada carrera la información de ingreso por universidad (requisitos, formas de ingreso, costos, documentos y fechas; tabla `admissions`). El admin la edita desde la página de la carrera y gestiona las universidades en Panel → Universidades. Los textos de ingreso incluidos son genéricos y sin cifras: reemplázalos con los datos oficiales de cada universidad.

## Requisitos por universidad, imágenes de carrera y pruebas
- Los requisitos de ingreso solo se muestran a quien inició sesión: el estudiante ve únicamente los de su universidad; profesores y admin ven todos. Sin sesión se invita a registrarse.
- El admin sube una imagen por carrera (Editar carrera).
- Cada módulo puede tener una prueba de opción múltiple: admin y profesores agregan preguntas (opciones una por línea, número de la correcta, explicación); el estudiante la responde y recibe su calificación al instante (tablas `questions` y `quiz_attempts`).

## Carreras por universidad
Al crear o editar una carrera el admin marca en qué universidades está disponible (se crean o se borran sus registros de ingreso). Un estudiante solo ve las carreras ofrecidas en universidades de su departamento o en la universidad que eligió; las áreas académicas sin carreras visibles para él se ocultan. Visitantes, profesores y admin ven todo.

## Áreas académicas y materias por carrera
Lo que antes se llamaba «facultades» ahora se muestra como **áreas académicas** (las rutas internas y las tablas siguen con el nombre anterior para no romper nada). Al iniciar, el proyecto agrega **una sola vez** a cada carrera las materias que le correspondan (Matemáticas, Física, Informática, Inglés, Economía y Contabilidad, Educación Cívica, Filosofía, etc., cada una con sus módulos); la correspondencia se hace por nombre de carrera (`BY_CAREER` en `seed.js`). No duplica materias y se puede editar o eliminar después desde la web.

## Requisitos de ingreso
Ya no hay enlace «Requisitos» en el menú: se entra desde la página de cada carrera con «Ver requisitos de ingreso» (`#/requisitos/ID`).
- **Estudiante:** ve solo los requisitos de esa carrera en la universidad que eligió en su perfil (el servidor no envía los de otras universidades).
- **Profesor / administrador:** ven todas las universidades de la carrera, con buscador y filtros; el administrador agrega, edita y quita desde esa misma página.

## Base de datos: tablas en español
Las tablas ahora tienen nombre en español: `usuarios`, `sesiones`, `areas_academicas` (antes `faculties`), `carreras`, `materias`, `modulos`, `preguntas`, `intentos_prueba`, `progreso_modulos`, `mensajes`, `eventos`, `universidades` y `requisitos_ingreso` (antes `admissions`). Las bases ya existentes se renombran solas la primera vez que se inicia `node server.js`, conservando todos los datos; después, DB Browser mostrará los nombres nuevos. Los nombres de las columnas y las direcciones de la API no cambiaron.

## Materias
En la página de cada carrera, «Materias que debes rendir» se muestra con un menú lateral de materias y, a la derecha, el panel de la materia elegida: «Acerca de esta materia» y «Empieza aquí» con la lista de módulos («Aprende»). La dirección `#/materia/ID` abre la carrera con esa materia seleccionada.

## Menú y retomar el estudio
- «Áreas académicas» es un menú desplegable con todas las áreas (al pasar el cursor o al tocarlo) y «Ver todas las áreas».
- Con sesión iniciada aparece el botón **Continuar estudiando**, que lleva al último módulo que marcaste como completado (`GET /api/me/last-completed`); su ayuda al pasar el cursor indica el módulo y la materia.

## Detalles de interfaz
- Las tarjetas de carrera son clicables en toda su superficie (el botón «Ver →» se resalta al pasar el cursor); los botones de editar/eliminar siguen funcionando.
- Animaciones suaves de entrada y de menús; se desactivan automáticamente si el sistema pide «reducir movimiento».
- Corregido el desbordamiento horizontal en celular causado por la fila «Disponible en» (no podía encogerse y ensanchaba la página).

## Plan de materias y módulos (plan_materias.txt)
Las materias y los temas de cada carrera se cargan desde `plan_materias.txt` (formato: `Carrera | Materia 1; Materia 2 | tema 1, tema 2, …`, agrupado por área académica). Al iniciar por primera vez con esta versión, `plan.js` lo aplica a la base de datos, una sola vez:
- Cada tema pasa a ser un módulo de la materia que le corresponde. Si ya existía un módulo equivalente (con su contenido), se conserva y no se duplica; los temas nuevos quedan con un texto base para que el profesor agregue el material desde la web.
- Las materias que ya existían y están en el plan se conservan; las que no están en el plan se retiran, salvo que algún estudiante tenga avance en ellas.
- Las carreras que no aparecen en el plan no se tocan. Carreras del plan sin coincidencia en la base (por ejemplo Microbiología o Zootecnia) se avisan en la consola al iniciar.
- Los temas del plan son una propuesta de desglose didáctico; el reparto de cada tema entre materias es automático y se puede ajustar editando materias y módulos desde la web.

## Imagen de las áreas y foto de perfil
- **Áreas académicas:** el administrador puede subir una imagen al crear o editar un área (JPG, PNG o WebP; se reduce sola). Se ve en la tarjeta de la lista y como banner en la página del área. Ruta: `POST/DELETE /api/faculties/:id/image` (columna `image` en `areas_academicas`).
- **Perfil:** cada persona puede subir, cambiar o quitar su foto desde «Mi perfil» (se reduce a 320 px). Ruta: `POST/DELETE /api/me/avatar` (columna `avatar` en `usuarios`). La foto aparece también en el menú superior.
- Las dos columnas se agregan solas a las bases ya existentes al iniciar el servidor.

## Perfil ampliado
Además de la foto, el perfil incluye: «Sobre mí» (200 caracteres), fecha del examen de admisión con cuenta regresiva, meta semanal de módulos, racha y días de estudio (hora de Bolivia), promedio en pruebas y últimas pruebas, 10 logros calculados con tu avance, «Cerrar sesión en todos los dispositivos» y «Eliminar mi cuenta» (pide la contraseña; las cuentas de administrador no se pueden eliminar desde ahí). Rutas nuevas: `POST /api/me/logout-all`, `POST /api/me/delete`; `GET /api/me/progress` suma `streak`, `week_done`, `studied_days` y `quiz`. Columnas nuevas en `usuarios`: `bio`, `exam_date`, `weekly_goal` (se agregan solas).
Dentro de una carrera o de un área ya no se muestra la imagen grande; las imágenes se ven solo en las listas.

## Velocidad de carga (celular)
- El servidor comprime con gzip los archivos de la página y las respuestas grandes de la API, y envía `ETag` para que el navegador no vuelva a descargar lo que no cambió (respuesta 304). La carga inicial pasó de ~300 KB a ~117 KB (la imagen de fondo `aguayo.jpg` pesa 77 KB en vez de 138 KB).
- Las tipografías de Google ya no bloquean la primera pantalla: se cargan aparte y, mientras llegan, se ve una letra del sistema.
- La página de cada carrera pide sus materias y módulos en una sola petición (`GET /api/careers/:id/study`, sin el texto de los módulos) y en paralelo con el resto; antes eran varias en cadena.
- El menú ya no espera datos para dibujarse; las consultas se guardan 30 segundos (volver atrás es instantáneo) y se limpian con cualquier cambio.
- Se quitó el desenfoque (`backdrop-filter`) de la barra superior, que es lento en celulares de gama baja.

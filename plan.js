// Aplica plan_materias.txt (materias y temas por carrera) a la base de datos.
// - Las carreras se buscan por nombre dentro de su área académica (los nombres con «/» se tratan como alias).
// - Una materia que ya existe se conserva (con sus módulos y avances); se agregan solo los temas que falten.
// - Las materias que ya no están en el plan se eliminan, salvo que algún estudiante tenga avance en ellas.
const fs = require('fs');
const path = require('path');

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
const alias = n => norm(n).split('/').map(x => x.trim()).filter(Boolean);
const quitaIng = s => s.replace(/^ingenieria (en|de) /, '').replace(/^ingenieria /, '');
const capital = s => s.charAt(0).toUpperCase() + s.slice(1);

// Palabras clave para repartir los temas entre las materias de una carrera (más específicas primero)
const CLAVES = [
  [['razonamiento espacial'], 'espacial|volumen|perspectiva|percepcion visual|geometria'],
  [['razonamiento'], 'logica|razonamiento|conjunto|proposicional|argument'],
  [['algebra'], 'aritmet|algebra|ecuacion|funcion|expresion|producto|factoriz|desigualdad|logaritm|numeros|proporcion|porcentaje|operaciones|conjunto|razones|interes|matematic'],
  [['matematica'], 'aritmet|algebra|ecuacion|funcion|geometr|trigonometr|numeros|expresion|producto|factoriz|desigualdad|logaritm|proporcion|porcentaje|razones|interes|estadist|probabilidad|matematic|unidades de medida|conjunto|calculo|operaciones|tablas|graficos|tendencia|analisis de datos'],
  [['geometria'], 'geometr|area|volumen|escala|perspectiva|proporcion|espacial'],
  [['trigonometria'], 'trigonometr'],
  [['fisica'], 'vector|cinematic|dinamic|magnitud|fisic|movimiento|newton|estatic|trabajo|energia|electric|magnetis|optica|calor|temperatura|termodinamic|presion|fluido|onda|frecuencia|amplitud|fuerza|mecanic|semiconductor|circuito|corriente|voltaje|resistencia|ohm|carga|biomecanic|equilibrio|postura'],
  [['quimica'], 'atomic|tabla periodica|enlace|nomenclatura|estequiometr|reaccion|solucion|acido|bases|gases|organica|quimic|concentracion|hidrocarburo'],
  [['biologia'], 'celula|celular|genetic|ecolog|ecosistema|biodiversidad|adn|arn|microorganismo|bacteria|virus|hongo|metabolismo|botanic|fotosintesis|evolucion|tejido|animal|reproduccion|nutricion|plantas|fisiologia|procariota|plagas'],
  [['morfofuncion', 'anatomia'], 'anatomia|planos|tejido|sistema|organos|oseo|muscular|nervioso|cardiovascular|respiratorio|digestivo|craneo|mandibula|maxilar|bucal|dient|dental|articulacion|musculo|cuerpo|reproductor|embri|embarazo|parto|ciclo menstrual|fecundacion|puerperio'],
  [['educacion en salud', 'educacion para la salud'], 'salud|prevencion|promocion|higiene|bioseguridad|primeros auxilios|epidemiolog|sanitari|enfermedad|metodo cientifico|investigacion|materna|reproductiva'],
  [['ciencias naturales'], 'minerales|rocas|ciclo|tierra|placas|volcanismo|sismos|sedimentarias|hidrocarburos'],
  [['historia del arte'], 'arte'],
  [['historia de las revoluciones'], 'historia|prensa|radio|television|digital'],
  [['historia'], 'historia|bolivia|universal|nacional'],
  [['psicologia'], 'conducta|psicolog|escuelas|cognitiv|memoria|atencion|percepcion|emociones|personalidad|desarrollo humano|aprendizaje|nervioso'],
  [['ciencias sociales', 'cultura'], 'sociedad|social|cultura|desigualdad|pobreza|familia|comunidad|desarrollo|poblacion|demografia|derechos humanos|organizacion|recursos naturales|patrimonio|sostenib'],
  [['educacion ciudadana'], 'constitucion|derecho|deber|democracia|poderes|estado|ciudadan|normas|politic|gobierno|poder'],
  [['filosofia'], 'pensamiento|ideolog|filosof|politic'],
  [['geografia'], 'geograf|regiones|departamentos'],
  [['fundamentos de ciencias economicas', 'economia'], 'econom|necesidades|escasez|recursos|principios|modelos|oferta|demanda|mercado|costos|ingresos|comercializacion|marketing|valor del dinero|financier|metodologia|leyes|definiciones|objetivos|importancia|usuarios|comercio|importaciones|exportaciones|balanza|globalizacion|cambio|aranceles|logistica|crecimiento|indicadores|presupuesto|contab|patrimonio|activo|pasivo|capital|administr|planificacion|organizacion|direccion|control'],
  [['contabilidad'], 'contab|patrimonio|activo|pasivo|capital|registros|libros|estados financieros|auditoria|control interno'],
  [['administracion'], 'administr|planificacion|organizacion|direccion|control|gestion|marketing'],
  [['dibujo'], 'dibujo|representacion|grafica|perspectiva|escala|proporcion|tecnico|artistico'],
  [['diseno', 'educacion artistica'], 'diseno|creatividad|composicion|percepcion visual|elementos visuales|punto|linea|forma|color'],
  [['introduccion a las ciencias de la educacion'], 'educacion|teorias|pedagogia|didactica|ensenanza'],
  [['estrategias de aprendizaje'], 'metodos de estudio|aprendizaje|estudio'],
  [['gramatica'], 'fonetica|fonologia|morfologia|sintaxis|semantica|gramatica|ortografia'],
  [['comprension lectora'], 'comprension|lectora|textos'],
  [['idiomas'], 'lengua extranjera|idioma|extranjera'],
  [['redaccion', 'principios de redaccion', 'lenguaje', 'literatura'], 'ortograf|gramatic|redaccion|lectora|literatura|texto|oral|produccion|argument'],
  [['fundamentos de la comunicacion', 'comunicacion'], 'comunicacion|visual|medios|modelos'],
].map(([pre, kw]) => [pre, kw.split('|')]);
const clavesDe = materia => { const n = norm(materia); const e = CLAVES.find(([pre]) => pre.some(p => n.startsWith(p))); return e ? e[1] : null; };

function leer() {
  const areas = []; let area = null;
  for (const linea of fs.readFileSync(path.join(__dirname, 'plan_materias.txt'), 'utf8').split(/\r?\n/)) {
    if (!linea.trim()) continue;
    if (linea.startsWith('# ')) { area = { nombre: linea.slice(2).trim(), carreras: [] }; areas.push(area); continue; }
    const [c, m, t] = linea.split(' | ');
    area.carreras.push({ nombre: c.trim(), materias: m.split(';').map(x => x.trim()).filter(Boolean), temas: t.split(',').map(x => x.trim()).filter(Boolean) });
  }
  return areas;
}

// Reparte los temas (en orden) entre las materias de la carrera
function repartir(materias, temas) {
  const claves = materias.map(clavesDe);
  const asign = temas.map(t => {
    const n = norm(t); let mejor = -1, max = 0;
    claves.forEach((kw, i) => { if (!kw) return; const s = kw.filter(k => n.includes(k)).length; if (s > max) { max = s; mejor = i; } });
    return mejor;
  });
  // Un tema sin palabras clave que queda entre dos temas de la misma materia se queda en esa materia
  asign.forEach((a, i) => {
    if (a >= 0) return;
    let p = i - 1; while (p >= 0 && asign[p] < 0) p--;
    let n = i + 1; while (n < asign.length && asign[n] < 0) n++;
    if (p >= 0 && n < asign.length && asign[p] === asign[n]) asign[i] = asign[p];
  });
    const destinos = materias.map((_, i) => i).filter(i => !claves[i]);
  const libres = asign.map((a, i) => (a < 0 ? i : -1)).filter(i => i >= 0);
  if (destinos.length && libres.length) {
    const lote = Math.ceil(libres.length / destinos.length);
    libres.forEach((ti, k) => { asign[ti] = destinos[Math.min(Math.floor(k / lote), destinos.length - 1)]; });
  } else libres.forEach(ti => { asign[ti] = ti > 0 ? asign[ti - 1] : 0; });
  return materias.map((m, i) => ({ nombre: m, temas: temas.filter((_, ti) => asign[ti] === i) }));
}

const mismoNombre = (a, b) => { const x = norm(a), y = norm(b); return x === y || (x.length >= 5 && y.startsWith(x)) || (y.length >= 5 && x.startsWith(y)); };
const PARASITAS = new Set(['estructura', 'sistema', 'sistemas', 'general', 'basica', 'basicos', 'conceptos', 'introduccion', 'fundamentos', 'principios']);
const raices = s => new Set(norm(s).split(/[^a-z0-9]+/).filter(w => w.length >= 5 && !PARASITAS.has(w)).map(w => w.slice(0, 6)));
const coincide = (tema, titulo) => { const a = raices(tema), b = raices(titulo); for (const x of a) if (b.has(x)) return true; return false; };

function aplicarPlan(db) {
  const plan = leer();
  const areasBD = db.prepare('SELECT id, name FROM areas_academicas').all();
  const carrerasBD = db.prepare('SELECT id, name, faculty_id FROM carreras').all();
  const destino = new Map(); const sinCoincidencia = [];
  for (const area of plan) {
    const aBD = areasBD.find(a => norm(a.name) === norm(area.nombre));
    const cand = carrerasBD.filter(c => !aBD || c.faculty_id === aBD.id);
    for (const fila of area.carreras) {
      const al = alias(fila.nombre);
      let hit = cand.filter(c => alias(c.name).some(x => al.includes(x)));
      if (!hit.length) hit = cand.filter(c => alias(c.name).some(x => al.some(y => quitaIng(x) === quitaIng(y))));
      if (!hit.length) { sinCoincidencia.push(`${fila.nombre} (${area.nombre})`); continue; }
      for (const c of hit) {
        const d = destino.get(c.id) || { materias: [], temas: [] }; destino.set(c.id, d);
        fila.materias.forEach(m => { if (!d.materias.some(x => norm(x) === norm(m))) d.materias.push(m); });
        fila.temas.forEach(t => { if (!d.temas.some(x => norm(x) === norm(t))) d.temas.push(t); });
      }
    }
  }
  const getS = db.prepare('SELECT id, name, description FROM materias WHERE career_id = ? ORDER BY position, id');
  const getM = db.prepare('SELECT id, title, summary, content, position FROM modulos WHERE subject_id = ? ORDER BY position, id');
  const insS = db.prepare('INSERT INTO materias (career_id, name, description, position) VALUES (?,?,?,?)');
  const insM = db.prepare('INSERT INTO modulos (subject_id, title, summary, content, position) VALUES (?,?,?,?,?)');
  const tienePro = db.prepare('SELECT 1 AS x FROM progreso_modulos p JOIN modulos m ON m.id = p.module_id WHERE m.subject_id = ? LIMIT 1');
  const nombre = id => carrerasBD.find(c => c.id === id).name;
  let materiasNuevas = 0, modulosNuevos = 0, materiasQuitadas = 0, conservadas = 0;
  db.exec('BEGIN');
  try {
    for (const [cid, d] of destino) {
      const existentes = getS.all(cid);
      const pool = existentes.flatMap(s => getM.all(s.id));
      const usadas = new Set();
      repartir(d.materias, d.temas).forEach((m, i) => {
        const ex = existentes.find(s => !usadas.has(s.id) && mismoNombre(s.name, m.nombre));
        let sid, mods;
        if (ex) { usadas.add(ex.id); sid = ex.id; mods = getM.all(sid); db.prepare('UPDATE materias SET position = ? WHERE id = ?').run(i + 1, sid); }
        else {
          const desc = m.temas.length ? `Temas: ${m.temas.slice(0, 4).map(t => t.toLowerCase()).join(', ')}${m.temas.length > 4 ? ' y más' : ''}.` : 'Materia de preparación para el examen de admisión.';
          sid = Number(insS.run(cid, m.nombre, desc, i + 1).lastInsertRowid); mods = []; materiasNuevas++;
        }
        let pos = mods.reduce((a, x) => Math.max(a, x.position), 0);
        const faltan = m.temas.filter(t => !mods.some(x => coincide(t, x.title)));
        faltan.forEach(t => {
          const previo = pool.find(x => coincide(t, x.title));
          const titulo = capital(t);
          insM.run(sid, titulo, previo ? previo.summary : `Tema de ${m.nombre}`, previo ? previo.content : `Este módulo cubre el tema «${t}» de la materia ${m.nombre}, que suele entrar en el examen de admisión de ${nombre(cid)}. El material de estudio detallado será agregado por el profesor.`, ++pos);
          modulosNuevos++;
        });
        if (!mods.length && !m.temas.length) { insM.run(sid, `Fundamentos de ${m.nombre}`, `Introducción a ${m.nombre}`, `Introducción a ${m.nombre} para el examen de admisión de ${nombre(cid)}. El material de estudio detallado será agregado por el profesor.`, 1); modulosNuevos++; }
      });
      for (const s of existentes) {
        if (usadas.has(s.id)) continue;
        if (tienePro.get(s.id)) { conservadas++; continue; }
        db.prepare('DELETE FROM materias WHERE id = ?').run(s.id); materiasQuitadas++;
      }
    }
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  return { carreras: destino.size, materiasNuevas, modulosNuevos, materiasQuitadas, conservadas, sinCoincidencia };
}
module.exports = { aplicarPlan, repartir, leer };

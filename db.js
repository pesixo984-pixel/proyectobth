'use strict';
// Capa de base de datos SQLite.
// Usa el SQLite integrado de Node (node:sqlite, Node >= 22.13) y, si no existe,
// cae a better-sqlite3 (npm install better-sqlite3). Ambos exponen la misma API aquí usada.
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Oculta únicamente el aviso "experimental" de SQLite
const _emit = process.emitWarning;
process.emitWarning = (w, ...a) => (String(w && w.message || w).includes('SQLite') ? undefined : _emit.call(process, w, ...a));

let Driver;
try {
  Driver = require('node:sqlite').DatabaseSync;
} catch (e) {
  try { Driver = require('better-sqlite3'); } catch (e2) {
    console.error('No se encontró SQLite. Usa Node >= 22.13 o ejecuta: npm install better-sqlite3');
    process.exit(1);
  }
}

const DB_DIR = path.join(__dirname, 'data');
fs.mkdirSync(path.join(DB_DIR, 'uploads'), { recursive: true });
const DB_FILE = process.env.DB_FILE || path.join(DB_DIR, 'preuniversitario.db');
const db = new Driver(DB_FILE);

// Los nombres de las tablas están en español: las bases ya existentes se renombran automáticamente (conservando todos los datos)
const RENOMBRAR_TABLAS = [["users", "usuarios"], ["sessions", "sesiones"], ["faculties", "areas_academicas"], ["careers", "carreras"], ["subjects", "materias"], ["modules", "modulos"], ["questions", "preguntas"], ["quiz_attempts", "intentos_prueba"], ["module_progress", "progreso_modulos"], ["messages", "mensajes"], ["events", "eventos"], ["universities", "universidades"], ["admissions", "requisitos_ingreso"]];
{
  const existentes = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(r => r.name));
  for (const [viejo, nuevo] of RENOMBRAR_TABLAS) if (existentes.has(viejo) && !existentes.has(nuevo)) db.exec(`ALTER TABLE ${viejo} RENAME TO ${nuevo}`);
}

db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher','admin')),
  phone         TEXT DEFAULT '',
  university    TEXT NOT NULL DEFAULT '',
  department    TEXT NOT NULL DEFAULT '',
  university_id INTEGER REFERENCES universidades(id) ON DELETE SET NULL,
  target_career_id INTEGER REFERENCES carreras(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sesiones (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS areas_academicas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  departments TEXT NOT NULL DEFAULT '',
  university_ids TEXT NOT NULL DEFAULT '',
  position    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS carreras (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  faculty_id  INTEGER NOT NULL REFERENCES areas_academicas(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  image       TEXT NOT NULL DEFAULT '',
  position    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS materias (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  career_id   INTEGER NOT NULL REFERENCES carreras(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  position    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS modulos (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id   INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  summary      TEXT DEFAULT '',
  content      TEXT DEFAULT '',
  resource_url TEXT DEFAULT '',
  position     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS preguntas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id   INTEGER NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  options     TEXT NOT NULL,
  answer      INTEGER NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  position    INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS intentos_prueba (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  module_id  INTEGER NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  score      INTEGER NOT NULL,
  total      INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_questions_module ON preguntas(module_id);
CREATE TABLE IF NOT EXISTS progreso_modulos (
  user_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  module_id    INTEGER NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS mensajes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS eventos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  date        TEXT NOT NULL,
  time        TEXT NOT NULL DEFAULT '',
  kind        TEXT NOT NULL DEFAULT 'examen',
  place       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  department  TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS universidades (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  short      TEXT NOT NULL,
  name       TEXT NOT NULL,
  department TEXT NOT NULL,
  website    TEXT NOT NULL DEFAULT '',
  image      TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS requisitos_ingreso (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  career_id     INTEGER NOT NULL REFERENCES carreras(id) ON DELETE CASCADE,
  university_id INTEGER NOT NULL REFERENCES universidades(id) ON DELETE CASCADE,
  requirements  TEXT NOT NULL DEFAULT '',
  modes         TEXT NOT NULL DEFAULT '',
  costs         TEXT NOT NULL DEFAULT '',
  documents     TEXT NOT NULL DEFAULT '',
  dates         TEXT NOT NULL DEFAULT '',
  UNIQUE (career_id, university_id)
);
CREATE INDEX IF NOT EXISTS idx_events_date ON eventos(date);
CREATE INDEX IF NOT EXISTS idx_careers_faculty ON carreras(faculty_id);
CREATE INDEX IF NOT EXISTS idx_subjects_career ON materias(career_id);
CREATE INDEX IF NOT EXISTS idx_modules_subject ON modulos(subject_id);
`);

// ---- Migración: bases creadas con versiones anteriores ----
{
  const cols = db.prepare('PRAGMA table_info(usuarios)').all().map(c => c.name);
  if (!cols.includes('university')) db.exec("ALTER TABLE usuarios ADD COLUMN university TEXT NOT NULL DEFAULT ''");
  if (!cols.includes('department')) {
    db.exec("ALTER TABLE usuarios ADD COLUMN department TEXT NOT NULL DEFAULT ''");
    // UMSS (Cochabamba) y UMSA (La Paz) de versiones anteriores
    db.exec("UPDATE usuarios SET department = 'cochabamba' WHERE university = 'UMSS'; UPDATE usuarios SET department = 'la-paz' WHERE university = 'UMSA'");
  }
  const ccols = db.prepare('PRAGMA table_info(carreras)').all().map(c => c.name);
  if (!ccols.includes('image')) db.exec("ALTER TABLE carreras ADD COLUMN image TEXT NOT NULL DEFAULT ''");
  const ucols = db.prepare('PRAGMA table_info(universidades)').all().map(c => c.name);
  if (!ucols.includes('image')) db.exec("ALTER TABLE universidades ADD COLUMN image TEXT NOT NULL DEFAULT ''");
  const ecols = db.prepare('PRAGMA table_info(eventos)').all().map(c => c.name);
  if (!ecols.includes('kind')) db.exec("ALTER TABLE eventos ADD COLUMN kind TEXT NOT NULL DEFAULT 'examen'");
  if (!cols.includes('university_id')) db.exec('ALTER TABLE usuarios ADD COLUMN university_id INTEGER REFERENCES universidades(id) ON DELETE SET NULL');
  const fcols = db.prepare('PRAGMA table_info(areas_academicas)').all().map(c => c.name);
  if (!fcols.includes('university_ids')) db.exec("ALTER TABLE areas_academicas ADD COLUMN university_ids TEXT NOT NULL DEFAULT ''");
  if (!fcols.includes('departments')) {
    db.exec("ALTER TABLE areas_academicas ADD COLUMN departments TEXT NOT NULL DEFAULT ''");
    db.exec("UPDATE areas_academicas SET departments = 'la-paz,cochabamba'");
  }
  if (!cols.includes('target_career_id')) db.exec('ALTER TABLE usuarios ADD COLUMN target_career_id INTEGER REFERENCES carreras(id) ON DELETE SET NULL');
}

// Universidades públicas con examen de ingreso (se precargan una vez; el admin puede editarlas)
if (db.prepare('SELECT COUNT(*) AS n FROM universidades').get().n === 0) {
  const ins = db.prepare('INSERT INTO universidades (short, name, department) VALUES (?,?,?)');
  [['UMSA', 'Universidad Mayor de San Andrés', 'la-paz'], ['UPEA', 'Universidad Pública de El Alto', 'la-paz'],
   ['UMSS', 'Universidad Mayor de San Simón', 'cochabamba'], ['UAGRM', 'Universidad Autónoma Gabriel René Moreno', 'santa-cruz'],
   ['UTO', 'Universidad Técnica de Oruro', 'oruro'], ['UATF', 'Universidad Autónoma Tomás Frías', 'potosi'],
   ['USFX', 'Universidad Mayor, Real y Pontificia de San Francisco Xavier de Chuquisaca', 'chuquisaca'],
   ['UAJMS', 'Universidad Autónoma Juan Misael Saracho', 'tarija'], ['UAB', 'Universidad Autónoma del Beni José Ballivián', 'beni'],
   ['UAP', 'Universidad Amazónica de Pando', 'pando']].forEach(r => ins.run(...r));
}

// Facultades y usuarios de versiones anteriores: se enlazan a las universidades de sus departamentos
db.exec(`UPDATE areas_academicas SET university_ids = COALESCE((SELECT group_concat(id) FROM universidades WHERE ',' || areas_academicas.departments || ',' LIKE '%,' || universidades.department || ',%'), '') WHERE university_ids = '' AND departments != '';
UPDATE usuarios SET university_id = (SELECT id FROM universidades WHERE short = usuarios.university) WHERE university_id IS NULL AND university != '';`);

// ---- Contraseñas (scrypt, sin dependencias) ----
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const real = Buffer.from(hash, 'hex');
  return real.length === test.length && crypto.timingSafeEqual(real, test);
}

module.exports = { db, hashPassword, verifyPassword, DB_FILE };

// Datos iniciales solo si la base está vacía
if (db.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n === 0) {
  require('./seed')(db, hashPassword);
  console.log('Base de datos inicializada con datos de ejemplo.');
}

// Información de admisión de ejemplo (editable por el admin) si todavía no hay ninguna
if (db.prepare('SELECT COUNT(*) AS n FROM requisitos_ingreso').get().n === 0) require('./seed').fillAdmissions(db);

// Materias adicionales por carrera (una sola vez por base de datos)
if (db.prepare('PRAGMA user_version').get().user_version < 1) {
  require('./seed').addMissingSubjects(db);
  db.exec('PRAGMA user_version = 1');
}

// Materias y módulos por carrera según plan_materias.txt (una sola vez por base de datos)
if (db.prepare('PRAGMA user_version').get().user_version < 2) {
  const r = require('./plan').aplicarPlan(db);
  console.log(`Plan de materias aplicado: ${r.carreras} carreras, ${r.materiasNuevas} materias y ${r.modulosNuevos} módulos nuevos, ${r.materiasQuitadas} materias retiradas.` + (r.sinCoincidencia.length ? ` Sin coincidencia: ${r.sinCoincidencia.join('; ')}.` : ''));
  db.exec('PRAGMA user_version = 2');
}

// Contenido desarrollado de los módulos (lección, bibliografía, video y preguntas) — una sola vez; no pisa módulos que el profesor ya redactó
if (db.prepare('PRAGMA user_version').get().user_version < 3) {
  const r = require('./contenido').aplicarContenido(db);
  console.log(`Contenido de módulos: ${r.desarrollados} desarrollados (${r.conLeccion} con lección completa) y ${r.preguntas} preguntas de práctica.`);
  db.exec('PRAGMA user_version = 3');
}

// Completa los módulos que quedaron solo con la guía genérica (materiales, biofísica, agricultura, petróleo, neuroanatomía)
if (db.prepare('PRAGMA user_version').get().user_version < 4) {
  const r = require('./contenido').aplicarContenido(db, { rehacer: true });
  console.log(`Contenido de módulos completado: ${r.desarrollados} módulos actualizados.`);
  db.exec('PRAGMA user_version = 4');
}

// Columnas nuevas en bases ya existentes: imagen de las áreas, foto, descripción, fecha de examen y meta semanal del usuario
for (const [tabla, col, def] of [['areas_academicas', 'image', "TEXT NOT NULL DEFAULT ''"], ['usuarios', 'avatar', "TEXT NOT NULL DEFAULT ''"], ['usuarios', 'bio', "TEXT NOT NULL DEFAULT ''"], ['usuarios', 'exam_date', "TEXT NOT NULL DEFAULT ''"], ['usuarios', 'weekly_goal', 'INTEGER NOT NULL DEFAULT 0']]) {
  if (!db.prepare(`PRAGMA table_info(${tabla})`).all().some(c => c.name === col)) db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${col} ${def}`);
}

'use strict';
// Servidor HTTP sin dependencias externas: API REST + archivos estáticos.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { db, hashPassword, verifyPassword, DB_FILE } = require('./db');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const SESSION_DAYS = 7;
const ROLES = ['student', 'teacher', 'admin'];
const DEPARTMENTS = ['pando', 'beni', 'la-paz', 'cochabamba', 'oruro', 'potosi', 'chuquisaca', 'tarija', 'santa-cruz'];
const depList = v => (Array.isArray(v) ? v : String(v || '').split(',')).map(x => String(x).trim()).filter(x => DEPARTMENTS.includes(x));
const depCsv = v => [...new Set(depList(v))].join(',');
const withDeps = f => ({ ...f, departments: depList(f.departments), university_ids: String(f.university_ids || '').split(',').filter(Boolean).map(Number) });
// Universidades elegidas -> [csv de ids, csv de departamentos]
const uniSel = v => {
  const ids = [...new Set((Array.isArray(v) ? v : String(v || '').split(',')).map(Number).filter(Number.isInteger))];
  const rows = ids.map(id => db.prepare('SELECT id, department FROM universidades WHERE id = ?').get(id)).filter(Boolean);
  return [rows.map(r => r.id).join(','), [...new Set(rows.map(r => r.department))].join(',')];
};

// ---------- utilidades ----------
const zlib = require('zlib');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json'
};

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function send(res, status, data, headers = {}) {
  const body = JSON.stringify(data);
  const base = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers };
  // Las respuestas grandes viajan comprimidas (mucho más rápido en datos móviles)
  if (body.length > 1024 && /\bgzip\b/.test((res.req && res.req.headers['accept-encoding']) || '')) {
    const gz = zlib.gzipSync(body);
    res.writeHead(status, { ...base, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding', 'Content-Length': gz.length });
    return res.end(gz);
  }
  res.writeHead(status, base);
  res.end(body);
}

function readBody(req, max = 200 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > max) { reject(new HttpError(413, 'Solicitud demasiado grande.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new HttpError(400, 'JSON inválido.')); }
    });
    req.on('error', reject);
  });
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

const text = (v, max, { required = false, label = 'Campo' } = {}) => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (required && !s) throw new HttpError(400, `${label} es obligatorio.`);
  if (s.length > max) throw new HttpError(400, `${label} no puede superar ${max} caracteres.`);
  return s;
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const email = v => {
  const s = text(v, 120, { required: true, label: 'El correo' }).toLowerCase();
  if (!EMAIL_RE.test(s)) throw new HttpError(400, 'Correo electrónico inválido.');
  return s;
};
const password = v => {
  if (typeof v !== 'string' || v.length < 8) throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres.');
  if (v.length > 100) throw new HttpError(400, 'La contraseña es demasiado larga.');
  return v;
};
const url = v => {
  const s = text(v, 500, { label: 'El enlace' });
  if (s && !/^https?:\/\/[^\s]+$/i.test(s)) throw new HttpError(400, 'El enlace debe comenzar con http:// o https://');
  return s;
};
const phone = v => {
  const s = text(v, 30, { label: 'El teléfono' });
  if (s && !/^[0-9+()\-\s]{5,30}$/.test(s)) throw new HttpError(400, 'Teléfono inválido.');
  return s;
};

// Límite simple de intentos (login, registro y contacto) por IP
const hits = new Map();
function rateLimit(req, key, max, windowMs) {
  const id = `${key}:${req.socket.remoteAddress}`;
  const now = Date.now();
  const h = hits.get(id);
  if (!h || h.reset < now) { hits.set(id, { n: 1, reset: now + windowMs }); return; }
  if (++h.n > max) throw new HttpError(429, 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.');
}
setInterval(() => { const n = Date.now(); for (const [k, v] of hits) if (v.reset < n) hits.delete(k); db.prepare('DELETE FROM sesiones WHERE expires_at < ?').run(n); }, 10 * 60 * 1000).unref();

// ---------- sesiones ----------
const publicUser = u => u && ({ id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone || '', department: u.department || '', university_id: u.university_id || null, university_short: u.university_id ? ((db.prepare('SELECT short FROM universidades WHERE id = ?').get(u.university_id) || {}).short || '') : '', target_career_id: u.target_career_id || null, avatar: u.avatar || '', bio: u.bio || '', exam_date: u.exam_date || '', weekly_goal: u.weekly_goal || 0, created_at: u.created_at });

function getUser(req) {
  const token = parseCookies(req).sid;
  if (!token) return null;
  const row = db.prepare(`SELECT u.* FROM sesiones s JOIN usuarios u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?`).get(token, Date.now());
  return row || null;
}
function startSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const ttl = SESSION_DAYS * 86400 * 1000;
  db.prepare('INSERT INTO sesiones (token, user_id, expires_at) VALUES (?,?,?)').run(token, userId, Date.now() + ttl);
  return `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}`;
}
const clearCookie = 'sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0';

// ---------- rutas ----------
const routes = [];
const route = (method, pattern, access, handler) => {
  routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), access, handler });
};
const nextPos = (table, col, id) => (db.prepare(`SELECT COALESCE(MAX(position),0)+1 AS p FROM ${table} WHERE ${col} = ?`).get(id).p);
const mustExist = (row, what = 'Recurso') => { if (!row) throw new HttpError(404, `${what} no encontrado.`); return row; };
const idOf = p => { const n = Number(p.id); if (!Number.isInteger(n) || n < 1) throw new HttpError(400, 'Identificador inválido.'); return n; };

const STAFF = ['teacher', 'admin'];
const ADMIN = ['admin'];

// --- Autenticación y perfil ---
route('POST', '/api/register', null, async ({ req, res, body }) => {
  rateLimit(req, 'register', 10, 15 * 60 * 1000);
  const name = text(body.name, 80, { required: true, label: 'El nombre' });
  if (name.length < 2) throw new HttpError(400, 'El nombre es demasiado corto.');
  const mail = email(body.email); const pass = password(body.password);
  if (db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(mail)) throw new HttpError(409, 'Ya existe una cuenta con ese correo.');
  const dep = typeof body.department === 'string' ? body.department.trim() : '';
  if (!DEPARTMENTS.includes(dep)) throw new HttpError(400, 'Selecciona tu departamento en el mapa.');
  const uni = db.prepare('SELECT id FROM universidades WHERE id = ?').get(Number(body.university_id));
  if (!uni) throw new HttpError(400, 'Selecciona la universidad a la que deseas postular.');
  const id = Number(db.prepare('INSERT INTO usuarios (name, email, password_hash, role, department, university_id) VALUES (?,?,?,?,?,?)').run(name, mail, hashPassword(pass), 'student', dep, uni.id).lastInsertRowid);
  const cookie = startSession(id);
  send(res, 201, { user: publicUser(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id)) }, { 'Set-Cookie': cookie });
});

route('POST', '/api/login', null, async ({ req, res, body }) => {
  rateLimit(req, 'login', 10, 10 * 60 * 1000);
  const mail = String(body.email || '').trim().toLowerCase();
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(mail);
  // Se verifica siempre un hash para no revelar si el correo existe
  const ok = verifyPassword(String(body.password || ''), u ? u.password_hash : 'aa:bb');
  if (!u || !ok) throw new HttpError(401, 'Correo o contraseña incorrectos.');
  send(res, 200, { user: publicUser(u) }, { 'Set-Cookie': startSession(u.id) });
});

route('POST', '/api/logout', null, async ({ req, res }) => {
  const token = parseCookies(req).sid;
  if (token) db.prepare('DELETE FROM sesiones WHERE token = ?').run(token);
  send(res, 200, { ok: true }, { 'Set-Cookie': clearCookie });
});

route('GET', '/api/me', null, async ({ res, user }) => send(res, 200, { user: publicUser(user) }));

route('GET', '/api/me/last-completed', 'user', async ({ res, user }) => {
  const last = db.prepare(`SELECT m.id AS module_id, m.title AS module_title, s.id AS subject_id, s.name AS subject_name, c.id AS career_id, c.name AS career_name
    FROM progreso_modulos p JOIN modulos m ON m.id = p.module_id JOIN materias s ON s.id = m.subject_id JOIN carreras c ON c.id = s.career_id
    WHERE p.user_id = ? ORDER BY p.completed_at DESC, p.rowid DESC LIMIT 1`).get(user.id);
  send(res, 200, { last: last || null });
});
route('PUT', '/api/me', 'user', async ({ res, user, body }) => {
  const name = text(body.name, 80, { required: true, label: 'El nombre' });
  const ph = phone(body.phone);
  let dep = user.department || '';
  if ('department' in body) {
    dep = typeof body.department === 'string' ? body.department.trim() : '';
    if (dep && !DEPARTMENTS.includes(dep)) throw new HttpError(400, 'Departamento no válido.');
    if (!dep && user.role === 'student') throw new HttpError(400, 'Selecciona tu departamento.');
  }
  let uid = user.university_id || null;
  if ('university_id' in body) uid = body.university_id ? Number(body.university_id) : null;
  if (uid && !db.prepare('SELECT 1 FROM universidades WHERE id = ?').get(uid)) throw new HttpError(400, 'Universidad no válida.');
  if (!uid && user.role === 'student' && ('department' in body || 'university_id' in body)) throw new HttpError(400, 'Selecciona tu universidad.');
  let target = user.target_career_id || null;
  if ('target_career_id' in body) {
    if (body.target_career_id === null || body.target_career_id === '') target = null;
    else {
      const cid = Number(body.target_career_id);
      if (!Number.isInteger(cid) || !db.prepare('SELECT 1 FROM carreras WHERE id = ?').get(cid)) throw new HttpError(400, 'Carrera no válida.');
      target = cid;
    }
  }
  let bio = user.bio || '';
  if ('bio' in body) bio = text(body.bio, 200, { label: 'La descripción' });
  let examDate = user.exam_date || '';
  if ('exam_date' in body) {
    examDate = String(body.exam_date || '').trim();
    if (examDate && !(/^\d{4}-\d{2}-\d{2}$/.test(examDate) && !Number.isNaN(Date.parse(examDate)))) throw new HttpError(400, 'La fecha del examen no es válida.');
  }
  let goal = user.weekly_goal || 0;
  if ('weekly_goal' in body) {
    const g = body.weekly_goal === '' || body.weekly_goal == null ? 0 : Number(body.weekly_goal);
    if (!Number.isInteger(g) || g < 0 || g > 50) throw new HttpError(400, 'La meta semanal debe estar entre 0 y 50 módulos.');
    goal = g;
  }
  if (body.new_password) {
    if (!verifyPassword(String(body.current_password || ''), user.password_hash)) throw new HttpError(400, 'La contraseña actual no es correcta.');
    db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hashPassword(password(body.new_password)), user.id);
  }
  db.prepare('UPDATE usuarios SET name = ?, phone = ?, department = ?, university_id = ?, target_career_id = ?, bio = ?, exam_date = ?, weekly_goal = ? WHERE id = ?').run(name, ph, dep, uid, target, bio, examDate, goal, user.id);
  send(res, 200, { user: publicUser(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(user.id)) });
});

// Cuenta: cerrar todas las sesiones y eliminar la cuenta (con contraseña)
route('POST', '/api/me/logout-all', 'user', async ({ res, user }) => {
  db.prepare('DELETE FROM sesiones WHERE user_id = ?').run(user.id);
  send(res, 200, { ok: true });
});
route('POST', '/api/me/delete', 'user', async ({ res, user, body }) => {
  if (user.role === 'admin') throw new HttpError(400, 'Una cuenta de administrador no se puede eliminar desde aquí.');
  if (!verifyPassword(String(body.password || ''), user.password_hash)) throw new HttpError(400, 'La contraseña no es correcta.');
  rmImage(user.avatar);
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(user.id);
  send(res, 200, { ok: true });
});

// Resumen de estudio del usuario: totales, ruta de su carrera objetivo y actividad reciente
route('GET', '/api/me/progress', 'user', async ({ res, user }) => {
  const one = (sql, ...p) => db.prepare(sql).get(...p).n;
  const completed_total = one('SELECT COUNT(*) AS n FROM progreso_modulos WHERE user_id = ?', user.id);
  const subjects_started = one('SELECT COUNT(DISTINCT m.subject_id) AS n FROM progreso_modulos p JOIN modulos m ON m.id = p.module_id WHERE p.user_id = ?', user.id);
  let target = null;
  if (user.target_career_id) {
    const c = db.prepare('SELECT c.id, c.name, f.id AS faculty_id, f.name AS faculty_name FROM carreras c JOIN areas_academicas f ON f.id = c.faculty_id WHERE c.id = ?').get(user.target_career_id);
    if (c) {
      const subjects = db.prepare(`SELECT s.id, s.name,
          (SELECT COUNT(*) FROM modulos m WHERE m.subject_id = s.id) AS total,
          (SELECT COUNT(*) FROM progreso_modulos p JOIN modulos m ON m.id = p.module_id WHERE p.user_id = ? AND m.subject_id = s.id) AS done,
          (SELECT m.id FROM modulos m WHERE m.subject_id = s.id AND m.id NOT IN (SELECT module_id FROM progreso_modulos WHERE user_id = ?) ORDER BY m.position, m.id LIMIT 1) AS next_id
        FROM materias s WHERE s.career_id = ? ORDER BY s.position, s.id`).all(user.id, user.id, c.id);
      target = { ...c, subjects, total: subjects.reduce((a, s) => a + s.total, 0), done: subjects.reduce((a, s) => a + s.done, 0) };
    }
  }
  const recent = db.prepare(`SELECT p.module_id, m.title, s.id AS subject_id, s.name AS subject_name, p.completed_at
      FROM progreso_modulos p JOIN modulos m ON m.id = p.module_id JOIN materias s ON s.id = m.subject_id
      WHERE p.user_id = ? ORDER BY p.completed_at DESC, p.rowid DESC LIMIT 5`).all(user.id);
  // Constancia: racha de días, módulos de la semana (lunes a domingo, hora de Bolivia) y pruebas
  const dias = db.prepare("SELECT date(completed_at, '-4 hours') AS d, COUNT(*) AS n FROM progreso_modulos WHERE user_id = ? GROUP BY d").all(user.id);
  const porDia = new Map(dias.map(r => [r.d, r.n]));
  const hoy = db.prepare("SELECT date('now', '-4 hours') AS d").get().d;
  const DIA = 86400000, t0 = Date.parse(hoy + 'T00:00:00Z'), iso = t => new Date(t).toISOString().slice(0, 10);
  let streak = 0, cursor = porDia.has(hoy) ? t0 : t0 - DIA;
  while (porDia.has(iso(cursor))) { streak++; cursor -= DIA; }
  const lunes = iso(t0 - ((new Date(t0).getUTCDay() + 6) % 7) * DIA);
  const week_done = dias.filter(r => r.d >= lunes).reduce((a, r) => a + r.n, 0);
  const qs = db.prepare('SELECT COUNT(*) AS attempts, AVG(100.0 * score / total) AS avg, MAX(100.0 * score / total) AS best FROM intentos_prueba WHERE user_id = ? AND total > 0').get(user.id);
  const quizRecent = db.prepare(`SELECT a.score, a.total, a.created_at, m.id AS module_id, m.title, s.name AS subject_name
      FROM intentos_prueba a JOIN modulos m ON m.id = a.module_id JOIN materias s ON s.id = m.subject_id
      WHERE a.user_id = ? ORDER BY a.created_at DESC, a.id DESC LIMIT 5`).all(user.id);
  const quiz = { attempts: qs.attempts, avg: qs.avg == null ? null : Math.round(qs.avg), best: qs.best == null ? null : Math.round(qs.best), recent: quizRecent };
  send(res, 200, { completed_total, subjects_started, target, recent, streak, week_done, studied_days: dias.length, quiz });
});

// --- Contacto ---
route('POST', '/api/contact', null, async ({ req, res, body }) => {
  rateLimit(req, 'contact', 5, 15 * 60 * 1000);
  const name = text(body.name, 80, { required: true, label: 'El nombre' });
  const mail = email(body.email);
  const message = text(body.message, 2000, { required: true, label: 'El mensaje' });
  db.prepare('INSERT INTO mensajes (name, email, message) VALUES (?,?,?)').run(name, mail, message);
  send(res, 201, { ok: true });
});

// --- Universidades con examen de ingreso ---
const uniFields = body => {
  const dep = String(body.department || '').trim();
  if (!DEPARTMENTS.includes(dep)) throw new HttpError(400, 'Selecciona un departamento.');
  const web = String(body.website || '').trim();
  if (web && !/^https?:\/\/[^\s"'<>]+$/i.test(web)) throw new HttpError(400, 'El sitio web debe empezar con http:// o https://');
  return [text(body.short, 12, { required: true, label: 'La sigla' }), text(body.name, 160, { required: true, label: 'El nombre' }), dep, web.slice(0, 200)];
};
route('GET', '/api/universities', null, async ({ res }) => send(res, 200, db.prepare('SELECT * FROM universidades ORDER BY department, short').all()));
const UPLOADS = path.join(__dirname, 'data', 'uploads');
const rmImage = name => { if (/^(uni|car|area|usr)-[\w.-]+$/.test(name || '')) fs.rm(path.join(UPLOADS, name), () => {}); };
route('POST', '/api/universities/:id/image', ADMIN, async ({ res, params, body }) => {
  const u = mustExist(db.prepare('SELECT id, image FROM universidades WHERE id = ?').get(idOf(params)), 'Universidad');
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data || ''));
  if (!m) throw new HttpError(400, 'La imagen debe ser JPG, PNG o WebP.');
  const buf = Buffer.from(m[2], 'base64');
  const okMagic = (m[1] === 'jpeg' && buf[0] === 0xFF && buf[1] === 0xD8) || (m[1] === 'png' && buf.slice(1, 4).toString() === 'PNG') || (m[1] === 'webp' && buf.slice(0, 4).toString() === 'RIFF');
  if (!okMagic || buf.length > 700 * 1024) throw new HttpError(400, 'Imagen no válida o demasiado grande.');
  const name = `uni-${u.id}-${crypto.randomBytes(4).toString('hex')}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
  fs.writeFileSync(path.join(UPLOADS, name), buf);
  db.prepare('UPDATE universidades SET image = ? WHERE id = ?').run(name, u.id); rmImage(u.image);
  send(res, 200, { image: name });
});
route('DELETE', '/api/universities/:id/image', ADMIN, async ({ res, params }) => {
  const u = mustExist(db.prepare('SELECT id, image FROM universidades WHERE id = ?').get(idOf(params)), 'Universidad');
  db.prepare("UPDATE universidades SET image = '' WHERE id = ?").run(u.id); rmImage(u.image);
  send(res, 200, { ok: true });
});
route('POST', '/api/universities', ADMIN, async ({ res, body }) => {
  send(res, 201, { id: Number(db.prepare('INSERT INTO universidades (short, name, department, website) VALUES (?,?,?,?)').run(...uniFields(body)).lastInsertRowid) });
});
route('PUT', '/api/universities/:id', ADMIN, async ({ res, params, body }) => {
  const u = mustExist(db.prepare('SELECT id FROM universidades WHERE id = ?').get(idOf(params)), 'Universidad');
  db.prepare('UPDATE universidades SET short = ?, name = ?, department = ?, website = ? WHERE id = ?').run(...uniFields(body), u.id);
  send(res, 200, { ok: true });
});
route('DELETE', '/api/universities/:id', ADMIN, async ({ res, params }) => {
  mustExist(db.prepare('SELECT id FROM universidades WHERE id = ?').get(idOf(params)), 'Universidad');
  const uid = idOf(params);
  rmImage((db.prepare('SELECT image FROM universidades WHERE id = ?').get(uid) || {}).image);
  db.prepare('DELETE FROM universidades WHERE id = ?').run(uid);
  for (const f of db.prepare('SELECT id, university_ids FROM areas_academicas').all()) {
    const keep = String(f.university_ids).split(',').filter(x => x && Number(x) !== uid).join(',');
    if (keep !== f.university_ids) db.prepare('UPDATE areas_academicas SET university_ids = ? WHERE id = ?').run(keep, f.id);
  }
  send(res, 200, { ok: true });
});

// --- Calendario de exámenes ---
const EVENT_KINDS = ['examen', 'inscripcion', 'anuncio', 'otro'];
const eventFields = body => {
  const date = String(body.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date + 'T00:00:00Z'))) throw new HttpError(400, 'La fecha no es válida.');
  const time = String(body.time || '').trim();
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new HttpError(400, 'La hora no es válida.');
  const dep = String(body.department || '').trim();
  if (dep && !DEPARTMENTS.includes(dep)) throw new HttpError(400, 'Departamento no válido.');
  const kind = EVENT_KINDS.includes(body.kind) ? body.kind : 'examen';
  return [text(body.title, 120, { required: true, label: 'El título' }), date, time, text(body.place, 120, { label: 'El lugar' }), text(body.description, 600, { label: 'La descripción' }), dep, kind];
};
route('GET', '/api/events', null, async ({ res }) => send(res, 200, db.prepare('SELECT * FROM eventos ORDER BY date, time, id').all()));
route('POST', '/api/events', ADMIN, async ({ res, body }) => {
  const id = db.prepare('INSERT INTO eventos (title, date, time, place, description, department, kind) VALUES (?,?,?,?,?,?,?)').run(...eventFields(body)).lastInsertRowid;
  send(res, 201, { id: Number(id) });
});
route('PUT', '/api/events/:id', ADMIN, async ({ res, params, body }) => {
  const e = mustExist(db.prepare('SELECT id FROM eventos WHERE id = ?').get(idOf(params)), 'Evento');
  db.prepare('UPDATE eventos SET title = ?, date = ?, time = ?, place = ?, description = ?, department = ?, kind = ? WHERE id = ?').run(...eventFields(body), e.id);
  send(res, 200, { ok: true });
});
route('DELETE', '/api/events/:id', ADMIN, async ({ res, params }) => {
  mustExist(db.prepare('SELECT id FROM eventos WHERE id = ?').get(idOf(params)), 'Evento');
  db.prepare('DELETE FROM eventos WHERE id = ?').run(idOf(params));
  send(res, 200, { ok: true });
});

// --- Catálogo (lectura) ---
route('GET', '/api/stats', null, async ({ res }) => {
  const n = t => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  send(res, 200, { faculties: n('areas_academicas'), careers: n('carreras'), subjects: n('materias'), modules: n('modulos') });
});

// Un estudiante solo ve las carreras disponibles en universidades de su departamento o en la universidad que eligió
const careerScope = user => (user && user.role === 'student' && (user.department || user.university_id))
  ? { sql: ' AND EXISTS (SELECT 1 FROM requisitos_ingreso a JOIN universidades u ON u.id = a.university_id WHERE a.career_id = c.id AND (u.department = ? OR u.id = ?))', args: [user.department || '', user.university_id || 0] }
  : { sql: '', args: [] };
const careerUnis = id => db.prepare('SELECT university_id FROM requisitos_ingreso WHERE career_id = ? ORDER BY university_id').all(id).map(r => r.university_id);
const syncCareerUnis = (careerId, ids) => {
  const want = new Set((Array.isArray(ids) ? ids : []).map(Number).filter(Number.isInteger));
  const have = new Set(careerUnis(careerId));
  const ins = db.prepare('INSERT OR IGNORE INTO requisitos_ingreso (career_id, university_id, requirements, modes, costs, documents, dates) VALUES (?,?,?,?,?,?,?)');
  for (const u of db.prepare('SELECT id, short FROM universidades').all()) if (want.has(u.id) && !have.has(u.id)) ins.run(careerId, u.id, ...require('./seed').genericAdmission(u.short));
  for (const id of have) if (!want.has(id)) db.prepare('DELETE FROM requisitos_ingreso WHERE career_id = ? AND university_id = ?').run(careerId, id);
};
route('GET', '/api/careers', null, async ({ res, user }) => {
  const sc = careerScope(user);
  send(res, 200, db.prepare(`SELECT c.id, c.name, f.id AS faculty_id, f.name AS faculty_name, f.departments, f.university_ids FROM carreras c
    JOIN areas_academicas f ON f.id = c.faculty_id WHERE 1 = 1${sc.sql} ORDER BY f.position, f.id, c.position, c.id`).all(...sc.args).map(withDeps));
});

route('GET', '/api/faculties', null, async ({ res, user }) => {
  const sc = careerScope(user);
  const rows = db.prepare(`SELECT f.*, (SELECT COUNT(*) FROM carreras c WHERE c.faculty_id = f.id${sc.sql}) AS careers_count
                           FROM areas_academicas f ORDER BY f.position, f.id`).all(...sc.args).map(withDeps);
  send(res, 200, sc.sql ? rows.filter(f => f.careers_count > 0) : rows);
});

route('GET', '/api/faculties/:id', null, async ({ res, params, user }) => {
  const sc = careerScope(user);
  const f = mustExist(db.prepare('SELECT * FROM areas_academicas WHERE id = ?').get(idOf(params)), 'Área académica');
  const careers = db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM materias s WHERE s.career_id = c.id) AS subjects_count
                              FROM carreras c WHERE c.faculty_id = ?${sc.sql} ORDER BY c.position, c.id`).all(f.id, ...sc.args).map(c => ({ ...c, university_ids: careerUnis(c.id) }));
  send(res, 200, { ...withDeps(f), careers });
});

// --- Información de admisión por carrera y universidad (solo admin edita) ---
const admFields = body => ['requirements', 'modes', 'costs', 'documents', 'dates'].map(k => text(body[k], 2000, { label: 'El campo ' + k }));
route('POST', '/api/careers/:id/admissions', ADMIN, async ({ res, params, body }) => {
  const c = mustExist(db.prepare('SELECT id FROM carreras WHERE id = ?').get(idOf(params)), 'Carrera');
  const u = db.prepare('SELECT id FROM universidades WHERE id = ?').get(Number(body.university_id));
  if (!u) throw new HttpError(400, 'Selecciona una universidad.');
  if (db.prepare('SELECT 1 FROM requisitos_ingreso WHERE career_id = ? AND university_id = ?').get(c.id, u.id)) throw new HttpError(409, 'Esa universidad ya está registrada en esta carrera.');
  const id = db.prepare('INSERT INTO requisitos_ingreso (career_id, university_id, requirements, modes, costs, documents, dates) VALUES (?,?,?,?,?,?,?)').run(c.id, u.id, ...admFields(body)).lastInsertRowid;
  send(res, 201, { id: Number(id) });
});
route('PUT', '/api/admissions/:id', ADMIN, async ({ res, params, body }) => {
  const a = mustExist(db.prepare('SELECT id FROM requisitos_ingreso WHERE id = ?').get(idOf(params)), 'Información de admisión');
  db.prepare('UPDATE requisitos_ingreso SET requirements = ?, modes = ?, costs = ?, documents = ?, dates = ? WHERE id = ?').run(...admFields(body), a.id);
  send(res, 200, { ok: true });
});
route('DELETE', '/api/admissions/:id', ADMIN, async ({ res, params }) => {
  mustExist(db.prepare('SELECT id FROM requisitos_ingreso WHERE id = ?').get(idOf(params)), 'Información de admisión');
  db.prepare('DELETE FROM requisitos_ingreso WHERE id = ?').run(idOf(params));
  send(res, 200, { ok: true });
});
route('GET', '/api/careers/:id', null, async ({ res, params, user }) => {
  const c = mustExist(db.prepare('SELECT * FROM carreras WHERE id = ?').get(idOf(params)), 'Carrera');
  const faculty = db.prepare('SELECT id, name FROM areas_academicas WHERE id = ?').get(c.faculty_id);
  const subjects = db.prepare(`SELECT s.*, (SELECT COUNT(*) FROM modulos m WHERE m.subject_id = s.id) AS modules_count
                               FROM materias s WHERE s.career_id = ? ORDER BY s.position, s.id`).all(c.id);
  // Requisitos de ingreso: sin sesión no se muestran; el estudiante solo ve los de la universidad que eligió; profesor y admin ven todos
  let admissions = [];
  if (user) {
    const own = !STAFF.includes(user.role);
    admissions = db.prepare(`SELECT a.*, u.short, u.name AS university_name, u.department, u.image, u.website FROM requisitos_ingreso a
      JOIN universidades u ON u.id = a.university_id WHERE a.career_id = ?${own ? ' AND a.university_id = ?' : ''} ORDER BY u.short`).all(...(own ? [c.id, user.university_id || 0] : [c.id]));
  }
  send(res, 200, { ...c, faculty, subjects, admissions, university_ids: careerUnis(c.id) });
});

route('GET', '/api/subjects/:id', null, async ({ res, params, user }) => {
  const s = mustExist(db.prepare('SELECT * FROM materias WHERE id = ?').get(idOf(params)), 'Materia');
  const career = db.prepare('SELECT id, name, faculty_id FROM carreras WHERE id = ?').get(s.career_id);
  const faculty = db.prepare('SELECT id, name FROM areas_academicas WHERE id = ?').get(career.faculty_id);
  let modules = db.prepare('SELECT * FROM modulos WHERE subject_id = ? ORDER BY position, id').all(s.id);
  // Los visitantes sin sesión ven los títulos, pero no el contenido
  if (!user) modules = modules.map(m => ({ id: m.id, title: m.title, summary: m.summary, position: m.position, locked: true }));
  const completed = user
    ? db.prepare('SELECT module_id FROM progreso_modulos WHERE user_id = ? AND module_id IN (SELECT id FROM modulos WHERE subject_id = ?)').all(user.id, s.id).map(r => r.module_id)
    : [];
  send(res, 200, { ...s, career, faculty, modules, completed });
});

// Materias de una carrera con sus módulos (sin el contenido), en una sola petición: lo usa el panel de materias
route('GET', '/api/careers/:id/study', null, async ({ res, params, user }) => {
  const c = mustExist(db.prepare('SELECT id FROM carreras WHERE id = ?').get(idOf(params)), 'Carrera');
  const materias = db.prepare('SELECT id, name, description FROM materias WHERE career_id = ? ORDER BY position, id').all(c.id);
  const mods = db.prepare('SELECT id, subject_id, title, summary FROM modulos WHERE subject_id IN (SELECT id FROM materias WHERE career_id = ?) ORDER BY position, id').all(c.id);
  const hechos = new Set(user ? db.prepare('SELECT module_id FROM progreso_modulos WHERE user_id = ?').all(user.id).map(r => r.module_id) : []);
  send(res, 200, materias.map(s => {
    const ms = mods.filter(m => m.subject_id === s.id);
    return { ...s, modules: ms.map(m => ({ id: m.id, title: m.title, summary: m.summary, locked: !user })), completed: ms.filter(m => hechos.has(m.id)).map(m => m.id) };
  }));
});

// --- Edición de materias y módulos (profesor y admin) ---
route('POST', '/api/careers/:id/subjects', STAFF, async ({ res, params, body }) => {
  const c = mustExist(db.prepare('SELECT id FROM carreras WHERE id = ?').get(idOf(params)), 'Carrera');
  const name = text(body.name, 120, { required: true, label: 'El nombre' });
  const id = db.prepare('INSERT INTO materias (career_id, name, description, position) VALUES (?,?,?,?)')
    .run(c.id, name, text(body.description, 500, { label: 'La descripción' }), nextPos('materias', 'career_id', c.id)).lastInsertRowid;
  send(res, 201, { id: Number(id) });
});
route('PUT', '/api/subjects/:id', STAFF, async ({ res, params, body }) => {
  const s = mustExist(db.prepare('SELECT id FROM materias WHERE id = ?').get(idOf(params)), 'Materia');
  db.prepare('UPDATE materias SET name = ?, description = ? WHERE id = ?')
    .run(text(body.name, 120, { required: true, label: 'El nombre' }), text(body.description, 500, { label: 'La descripción' }), s.id);
  send(res, 200, { ok: true });
});
route('DELETE', '/api/subjects/:id', STAFF, async ({ res, params }) => {
  mustExist(db.prepare('SELECT id FROM materias WHERE id = ?').get(idOf(params)), 'Materia');
  db.prepare('DELETE FROM materias WHERE id = ?').run(idOf(params));
  send(res, 200, { ok: true });
});

const moduleFields = body => [
  text(body.title, 150, { required: true, label: 'El título' }),
  text(body.summary, 300, { label: 'El resumen' }),
  text(body.content, 10000, { label: 'El contenido' }),
  url(body.resource_url)
];
route('POST', '/api/subjects/:id/modules', STAFF, async ({ res, params, body }) => {
  const s = mustExist(db.prepare('SELECT id FROM materias WHERE id = ?').get(idOf(params)), 'Materia');
  const id = db.prepare('INSERT INTO modulos (subject_id, title, summary, content, resource_url, position) VALUES (?,?,?,?,?,?)')
    .run(s.id, ...moduleFields(body), nextPos('modulos', 'subject_id', s.id)).lastInsertRowid;
  send(res, 201, { id: Number(id) });
});
route('PUT', '/api/modules/:id', STAFF, async ({ res, params, body }) => {
  const m = mustExist(db.prepare('SELECT id FROM modulos WHERE id = ?').get(idOf(params)), 'Módulo');
  db.prepare('UPDATE modulos SET title = ?, summary = ?, content = ?, resource_url = ? WHERE id = ?').run(...moduleFields(body), m.id);
  send(res, 200, { ok: true });
});
route('DELETE', '/api/modules/:id', STAFF, async ({ res, params }) => {
  mustExist(db.prepare('SELECT id FROM modulos WHERE id = ?').get(idOf(params)), 'Módulo');
  db.prepare('DELETE FROM modulos WHERE id = ?').run(idOf(params));
  send(res, 200, { ok: true });
});

// --- Estudio de un módulo y progreso (requiere sesión) ---
route('GET', '/api/modules/:id', 'user', async ({ res, params, user }) => {
  const m = mustExist(db.prepare('SELECT * FROM modulos WHERE id = ?').get(idOf(params)), 'Módulo');
  const subject = db.prepare('SELECT id, name, career_id FROM materias WHERE id = ?').get(m.subject_id);
  const career = db.prepare('SELECT id, name, faculty_id FROM carreras WHERE id = ?').get(subject.career_id);
  const faculty = db.prepare('SELECT id, name FROM areas_academicas WHERE id = ?').get(career.faculty_id);
  const modules = db.prepare('SELECT id, title FROM modulos WHERE subject_id = ? ORDER BY position, id').all(subject.id);
  const completed = db.prepare('SELECT module_id FROM progreso_modulos WHERE user_id = ? AND module_id IN (SELECT id FROM modulos WHERE subject_id = ?)')
    .all(user.id, subject.id).map(r => r.module_id);
  const staff = STAFF.includes(user.role);
  const questions = db.prepare('SELECT * FROM preguntas WHERE module_id = ? ORDER BY position, id').all(m.id).map(q => ({
    id: q.id, question: q.question, options: JSON.parse(q.options), ...(staff ? { answer: q.answer, explanation: q.explanation } : {}) }));
  const last_attempt = db.prepare('SELECT score, total, created_at FROM intentos_prueba WHERE user_id = ? AND module_id = ? ORDER BY id DESC LIMIT 1').get(user.id, m.id) || null;
  send(res, 200, { ...m, subject, career, faculty, modules, completed, questions, last_attempt });
});
route('POST', '/api/modules/:id/progress', 'user', async ({ res, params, body, user }) => {
  const m = mustExist(db.prepare('SELECT id FROM modulos WHERE id = ?').get(idOf(params)), 'Módulo');
  if (body.done) db.prepare('INSERT OR IGNORE INTO progreso_modulos (user_id, module_id) VALUES (?,?)').run(user.id, m.id);
  else db.prepare('DELETE FROM progreso_modulos WHERE user_id = ? AND module_id = ?').run(user.id, m.id);
  send(res, 200, { ok: true });
});

// --- Pruebas (preguntas de opción múltiple) por módulo ---
const questionFields = body => {
  const opts = (Array.isArray(body.options) ? body.options : String(body.options || '').split('\n')).map(o => String(o).trim()).filter(Boolean);
  if (opts.length < 2 || opts.length > 6) throw new HttpError(400, 'Escribe entre 2 y 6 opciones (una por línea).');
  if (opts.some(o => o.length > 200)) throw new HttpError(400, 'Cada opción puede tener hasta 200 caracteres.');
  const ans = Number(body.answer) - 1;
  if (!Number.isInteger(ans) || ans < 0 || ans >= opts.length) throw new HttpError(400, 'La respuesta correcta debe ser el número de una de las opciones.');
  return [text(body.question, 500, { required: true, label: 'La pregunta' }), JSON.stringify(opts), ans, text(body.explanation, 500, { label: 'La explicación' })];
};
route('POST', '/api/modules/:id/questions', STAFF, async ({ res, params, body }) => {
  const m = mustExist(db.prepare('SELECT id FROM modulos WHERE id = ?').get(idOf(params)), 'Módulo');
  const id = db.prepare('INSERT INTO preguntas (module_id, question, options, answer, explanation, position) VALUES (?,?,?,?,?,?)').run(m.id, ...questionFields(body), nextPos('preguntas', 'module_id', m.id)).lastInsertRowid;
  send(res, 201, { id: Number(id) });
});
route('PUT', '/api/questions/:id', STAFF, async ({ res, params, body }) => {
  const q = mustExist(db.prepare('SELECT id FROM preguntas WHERE id = ?').get(idOf(params)), 'Pregunta');
  db.prepare('UPDATE preguntas SET question = ?, options = ?, answer = ?, explanation = ? WHERE id = ?').run(...questionFields(body), q.id);
  send(res, 200, { ok: true });
});
route('DELETE', '/api/questions/:id', STAFF, async ({ res, params }) => {
  mustExist(db.prepare('SELECT id FROM preguntas WHERE id = ?').get(idOf(params)), 'Pregunta');
  db.prepare('DELETE FROM preguntas WHERE id = ?').run(idOf(params));
  send(res, 200, { ok: true });
});
route('POST', '/api/modules/:id/quiz', 'user', async ({ res, params, body, user }) => {
  const m = mustExist(db.prepare('SELECT id FROM modulos WHERE id = ?').get(idOf(params)), 'Módulo');
  const qs = db.prepare('SELECT * FROM preguntas WHERE module_id = ? ORDER BY position, id').all(m.id);
  if (!qs.length) throw new HttpError(400, 'Este módulo no tiene prueba.');
  const given = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const results = qs.map(q => ({ id: q.id, correct: Number(given[q.id]) === q.answer, answer: q.answer, explanation: q.explanation }));
  const score = results.filter(r => r.correct).length;
  db.prepare('INSERT INTO intentos_prueba (user_id, module_id, score, total) VALUES (?,?,?,?)').run(user.id, m.id, score, qs.length);
  send(res, 200, { score, total: qs.length, results });
});

// --- Imagen de carrera (solo admin) ---
// Guarda una imagen enviada como data URL (JPG/PNG/WebP, máx. 700 KB) y devuelve el nombre del archivo
const guardarImagen = (prefijo, id, data) => {
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(data || ''));
  if (!m) throw new HttpError(400, 'La imagen debe ser JPG, PNG o WebP.');
  const buf = Buffer.from(m[2], 'base64');
  const okMagic = (m[1] === 'jpeg' && buf[0] === 0xFF && buf[1] === 0xD8) || (m[1] === 'png' && buf.slice(1, 4).toString() === 'PNG') || (m[1] === 'webp' && buf.slice(0, 4).toString() === 'RIFF');
  if (!okMagic || buf.length > 700 * 1024) throw new HttpError(400, 'Imagen no válida o demasiado grande.');
  const name = `${prefijo}-${id}-${crypto.randomBytes(4).toString('hex')}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
  fs.writeFileSync(path.join(UPLOADS, name), buf);
  return name;
};
route('POST', '/api/faculties/:id/image', ADMIN, async ({ res, params, body }) => {
  const f = mustExist(db.prepare('SELECT id, image FROM areas_academicas WHERE id = ?').get(idOf(params)), 'Área académica');
  const name = guardarImagen('area', f.id, body.data);
  db.prepare('UPDATE areas_academicas SET image = ? WHERE id = ?').run(name, f.id); rmImage(f.image);
  send(res, 200, { image: name });
});
route('DELETE', '/api/faculties/:id/image', ADMIN, async ({ res, params }) => {
  const f = mustExist(db.prepare('SELECT id, image FROM areas_academicas WHERE id = ?').get(idOf(params)), 'Área académica');
  db.prepare("UPDATE areas_academicas SET image = '' WHERE id = ?").run(f.id); rmImage(f.image);
  send(res, 200, { ok: true });
});
// Foto de perfil: cada persona cambia o quita la suya
route('POST', '/api/me/avatar', 'user', async ({ res, user, body }) => {
  const name = guardarImagen('usr', user.id, body.data);
  db.prepare('UPDATE usuarios SET avatar = ? WHERE id = ?').run(name, user.id); rmImage(user.avatar);
  send(res, 200, { avatar: name });
});
route('DELETE', '/api/me/avatar', 'user', async ({ res, user }) => {
  db.prepare("UPDATE usuarios SET avatar = '' WHERE id = ?").run(user.id); rmImage(user.avatar);
  send(res, 200, { ok: true });
});
route('POST', '/api/careers/:id/image', ADMIN, async ({ res, params, body }) => {
  const c = mustExist(db.prepare('SELECT id, image FROM carreras WHERE id = ?').get(idOf(params)), 'Carrera');
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data || ''));
  if (!m) throw new HttpError(400, 'La imagen debe ser JPG, PNG o WebP.');
  const buf = Buffer.from(m[2], 'base64');
  const okMagic = (m[1] === 'jpeg' && buf[0] === 0xFF && buf[1] === 0xD8) || (m[1] === 'png' && buf.slice(1, 4).toString() === 'PNG') || (m[1] === 'webp' && buf.slice(0, 4).toString() === 'RIFF');
  if (!okMagic || buf.length > 700 * 1024) throw new HttpError(400, 'Imagen no válida o demasiado grande.');
  const name = `car-${c.id}-${crypto.randomBytes(4).toString('hex')}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
  fs.writeFileSync(path.join(UPLOADS, name), buf);
  db.prepare('UPDATE carreras SET image = ? WHERE id = ?').run(name, c.id); rmImage(c.image);
  send(res, 200, { image: name });
});
route('DELETE', '/api/careers/:id/image', ADMIN, async ({ res, params }) => {
  const c = mustExist(db.prepare('SELECT id, image FROM carreras WHERE id = ?').get(idOf(params)), 'Carrera');
  db.prepare("UPDATE carreras SET image = '' WHERE id = ?").run(c.id); rmImage(c.image);
  send(res, 200, { ok: true });
});

// --- Edición de facultades y carreras (solo admin) ---
route('POST', '/api/faculties', ADMIN, async ({ res, body }) => {
  const [uids, deps] = uniSel(body.university_ids);
  const id = db.prepare('INSERT INTO areas_academicas (name, description, departments, university_ids, position) VALUES (?,?,?,?,(SELECT COALESCE(MAX(position),0)+1 FROM areas_academicas))')
    .run(text(body.name, 120, { required: true, label: 'El nombre' }), text(body.description, 500, { label: 'La descripción' }), deps, uids).lastInsertRowid;
  send(res, 201, { id: Number(id) });
});
route('PUT', '/api/faculties/:id', ADMIN, async ({ res, params, body }) => {
  const f = mustExist(db.prepare('SELECT id FROM areas_academicas WHERE id = ?').get(idOf(params)), 'Área académica');
  const [uids, deps] = uniSel(body.university_ids);
  db.prepare('UPDATE areas_academicas SET name = ?, description = ?, departments = ?, university_ids = ? WHERE id = ?')
    .run(text(body.name, 120, { required: true, label: 'El nombre' }), text(body.description, 500, { label: 'La descripción' }), deps, uids, f.id);
  send(res, 200, { ok: true });
});
route('DELETE', '/api/faculties/:id', ADMIN, async ({ res, params }) => {
  const imgPrev = (db.prepare('SELECT image FROM areas_academicas WHERE id = ?').get(idOf(params)) || {}).image;
  mustExist(db.prepare('SELECT id FROM areas_academicas WHERE id = ?').get(idOf(params)), 'Área académica');
  db.prepare('DELETE FROM areas_academicas WHERE id = ?').run(idOf(params));
  rmImage(imgPrev);
  send(res, 200, { ok: true });
});
route('POST', '/api/faculties/:id/careers', ADMIN, async ({ res, params, body }) => {
  const f = mustExist(db.prepare('SELECT id FROM areas_academicas WHERE id = ?').get(idOf(params)), 'Área académica');
  const id = db.prepare('INSERT INTO carreras (faculty_id, name, description, position) VALUES (?,?,?,?)')
    .run(f.id, text(body.name, 120, { required: true, label: 'El nombre' }), text(body.description, 500, { label: 'La descripción' }), nextPos('carreras', 'faculty_id', f.id)).lastInsertRowid;
  syncCareerUnis(Number(id), body.university_ids);
  send(res, 201, { id: Number(id) });
});
route('PUT', '/api/careers/:id', ADMIN, async ({ res, params, body }) => {
  const c = mustExist(db.prepare('SELECT id FROM carreras WHERE id = ?').get(idOf(params)), 'Carrera');
  db.prepare('UPDATE carreras SET name = ?, description = ? WHERE id = ?')
    .run(text(body.name, 120, { required: true, label: 'El nombre' }), text(body.description, 500, { label: 'La descripción' }), c.id);
  if (Array.isArray(body.university_ids)) syncCareerUnis(c.id, body.university_ids);
  send(res, 200, { ok: true });
});
route('DELETE', '/api/careers/:id', ADMIN, async ({ res, params }) => {
  const c0 = mustExist(db.prepare('SELECT id, image FROM carreras WHERE id = ?').get(idOf(params)), 'Carrera');
  rmImage(c0.image);
  db.prepare('DELETE FROM carreras WHERE id = ?').run(c0.id);
  send(res, 200, { ok: true });
});

// --- Administración de usuarios y mensajes (solo admin) ---
route('GET', '/api/admin/users', ADMIN, async ({ res }) => {
  send(res, 200, db.prepare('SELECT id, name, email, role, phone, department, created_at FROM usuarios ORDER BY id').all());
});
route('POST', '/api/admin/users', ADMIN, async ({ res, body }) => {
  const name = text(body.name, 80, { required: true, label: 'El nombre' });
  const mail = email(body.email);
  const role = ROLES.includes(body.role) ? body.role : 'student';
  if (db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(mail)) throw new HttpError(409, 'Ya existe una cuenta con ese correo.');
  const dep = typeof body.department === 'string' ? body.department.trim() : '';
  if (dep && !DEPARTMENTS.includes(dep)) throw new HttpError(400, 'Departamento no válido.');
  const id = db.prepare('INSERT INTO usuarios (name, email, password_hash, role, department) VALUES (?,?,?,?,?)').run(name, mail, hashPassword(password(body.password)), role, dep).lastInsertRowid;
  send(res, 201, { id: Number(id) });
});
route('PUT', '/api/admin/users/:id', ADMIN, async ({ res, params, body, user }) => {
  const u = mustExist(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(idOf(params)), 'Usuario');
  if (!ROLES.includes(body.role)) throw new HttpError(400, 'Rol inválido.');
  if (u.id === user.id && body.role !== 'admin') throw new HttpError(400, 'No puedes quitarte a ti mismo el rol de administrador.');
  db.prepare('UPDATE usuarios SET role = ? WHERE id = ?').run(body.role, u.id);
  send(res, 200, { ok: true });
});
route('DELETE', '/api/admin/users/:id', ADMIN, async ({ res, params, user }) => {
  const u = mustExist(db.prepare('SELECT id FROM usuarios WHERE id = ?').get(idOf(params)), 'Usuario');
  if (u.id === user.id) throw new HttpError(400, 'No puedes eliminar tu propia cuenta.');
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(u.id);
  send(res, 200, { ok: true });
});
route('GET', '/api/admin/messages', ADMIN, async ({ res }) => {
  send(res, 200, db.prepare('SELECT * FROM mensajes ORDER BY id DESC').all());
});
route('DELETE', '/api/admin/messages/:id', ADMIN, async ({ res, params }) => {
  db.prepare('DELETE FROM mensajes WHERE id = ?').run(idOf(params));
  send(res, 200, { ok: true });
});
route('GET', '/api/admin/summary', ADMIN, async ({ res }) => {
  const n = (sql) => db.prepare(sql).get().n;
  send(res, 200, {
    students: n("SELECT COUNT(*) n FROM usuarios WHERE role='student'"),
    teachers: n("SELECT COUNT(*) n FROM usuarios WHERE role='teacher'"),
    admins: n("SELECT COUNT(*) n FROM usuarios WHERE role='admin'"),
    messages: n('SELECT COUNT(*) n FROM mensajes')
  });
});

// ---------- servidor ----------
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
};

function serveUpload(req, res, pathname) {
  const m = /^\/uploads\/((?:uni|car|area|usr)-[\w.-]+\.(?:jpg|png|webp))$/.exec(pathname);
  if (!m) { res.writeHead(404, SECURITY_HEADERS); return res.end(); }
  fs.readFile(path.join(UPLOADS, m[1]), (err, data) => {
    if (err) { res.writeHead(404, SECURITY_HEADERS); return res.end(); }
    res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': MIME['.' + m[1].split('.').pop()] || 'image/jpeg', 'Cache-Control': 'public, max-age=604800, immutable' });
    res.end(data);
  });
}

// Archivos estáticos: comprimidos (gzip) y con ETag para que el celular no los vuelva a descargar si no cambiaron
const COMPRIMIBLES = new Set(['.html', '.css', '.js', '.svg', '.json']);
const staticCache = new Map();
function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(403, SECURITY_HEADERS); return res.end('Prohibido'); }
  const noEncontrado = () => { res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' }); res.end('No encontrado'); };
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return noEncontrado();
    const ext = path.extname(file);
    const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
    const base = { ...SECURITY_HEADERS, 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': /\.(jpg|png|svg)$/.test(file) ? 'public, max-age=604800' : 'no-cache', ETag: etag, Vary: 'Accept-Encoding' };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, base); return res.end(); }
    const responder = ent => {
      const gz = ent.gz && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
      const buf = gz ? ent.gz : ent.raw;
      res.writeHead(200, { ...base, ...(gz ? { 'Content-Encoding': 'gzip' } : {}), 'Content-Length': buf.length });
      res.end(req.method === 'HEAD' ? undefined : buf);
    };
    const hit = staticCache.get(file);
    if (hit && hit.etag === etag) return responder(hit);
    fs.readFile(file, (e, raw) => {
      if (e) return noEncontrado();
      const ent = { etag, raw, gz: COMPRIMIBLES.has(ext) ? zlib.gzipSync(raw, { level: 9 }) : null };
      staticCache.set(file, ent); responder(ent);
    });
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);

  if (!pathname.startsWith('/api/')) {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    return pathname.startsWith('/uploads/') ? serveUpload(req, res, pathname) : serveStatic(req, res, pathname);
  }

  try {
    const matching = routes.filter(r => r.re.test(pathname));
    if (!matching.length) throw new HttpError(404, 'Ruta no encontrada.');
    const r = matching.find(x => x.method === req.method);
    if (!r) throw new HttpError(405, 'Método no permitido.');

    // Protección CSRF adicional: las peticiones que modifican datos deben ser JSON del mismo origen
    if (req.method !== 'GET') {
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host) throw new HttpError(403, 'Origen no permitido.');
    }

    const user = getUser(req);
    if (r.access) {
      if (!user) throw new HttpError(401, 'Debes iniciar sesión.');
      if (Array.isArray(r.access) && !r.access.includes(user.role)) throw new HttpError(403, 'No tienes permiso para realizar esta acción.');
    }
    const params = r.re.exec(pathname).groups || {};
    const body = (req.method === 'POST' || req.method === 'PUT') ? await readBody(req, /\/(image|avatar)$/.test(pathname) ? 1024 * 1024 : undefined) : {};
    await r.handler({ req, res, params, body, user });
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message });
    console.error(e);
    send(res, 500, { error: 'Error interno del servidor.' });
  }
});

server.listen(PORT, () => {
  console.log(`\n  Kallpa Preuniversitario en  http://localhost:${PORT}`);
  console.log(`  Base de datos: ${DB_FILE}\n`);
});

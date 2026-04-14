const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "data", "db.json");

const municipio = {
  nombre: "Crevillent",
  provincia: "Alicante",
  plan_nombre: "PTME Crevillent",
  plan_revision: "Rev.2025",
  centro: {
    lat: 38.2499,
    lng: -0.8091
  },
  zoom: 13
};

const documentosFuenteIniciales = [
  {
    id: 1,
    titulo: "PTM Crevillent Rev.2025",
    tipo_documento: "plan_territorial",
    archivo_nombre: "PTM Crevillent REV2025.docx",
    revision: "Rev.2025",
    descripcion: "Plan Territorial Municipal de Emergencias de Crevillent"
  },
  {
    id: 2,
    titulo: "Esquema Operativo Resumen Protocolo FMA",
    tipo_documento: "protocolo_operativo",
    archivo_nombre: "Esquema Operativo Resumen Protocolo FMA noviembre 24.pdf",
    revision: "noviembre 2024",
    descripcion: "Resumen operativo de actuación municipal frente a FMA"
  },
  {
    id: 3,
    titulo: "Puntos de Vigilancia PAM_RI Crevillent",
    tipo_documento: "cartografia_operativa",
    archivo_nombre: "PUNTOS VIGILANCIA PAM_RI CREVILLENT.pdf",
    revision: "13/12/2021",
    descripcion: "Relación de puntos críticos y de vigilancia frente al riesgo de inundaciones"
  },
  {
    id: 4,
    titulo: "Ficha postsismo distrito 2 sección 3",
    tipo_documento: "formulario_campo",
    archivo_nombre: "DISTRITO 2SEC3.pdf",
    revision: "sin indicar",
    descripcion: "Ficha de reconocimiento y primera evaluación postsismo"
  },
  {
    id: 5,
    titulo: "Recogida de datos de fuertes lluvias",
    tipo_documento: "formulario_campo",
    archivo_nombre: "DOCUMENTO RECOGIDA DE FUERTES LLUVIAS TM modelo.docx",
    revision: "2022",
    descripcion: "Ficha de daños, fotografías y toma de datos por lluvias"
  }
];

const unidadesBasicasIniciales = [
  {
    id: 1,
    nombre: "U.B. Seguridad",
    coordinador: "Intendente Jefe de la Policía Local de Crevillent",
    cargo: "Coordinador UB Seguridad e Intervención",
    descripcion: "Seguimiento de cauces, puntos de vigilancia, control de accesos y avisos a población",
    documento_fuente_id: 2
  },
  {
    id: 2,
    nombre: "U.B. Intervención",
    coordinador: "Operativos de intervención designados",
    cargo: "Intervención",
    descripcion: "Rescate, salvamento y tareas propias de intervención",
    documento_fuente_id: 2
  },
  {
    id: 3,
    nombre: "U.B. Apoyo Logístico",
    coordinador: "Brigadas de obras (José Antonio García)",
    cargo: "Coordinador UB Apoyo Logístico",
    descripcion: "Vallas, barreras, limpieza, bombas de achique, eliminación de obstáculos y apoyo logístico",
    documento_fuente_id: 2
  },
  {
    id: 4,
    nombre: "U.B. Albergue y Asistencia",
    coordinador: "CICU / responsables designados",
    cargo: "Coordinación albergue y asistencia",
    descripcion: "Recepción de evacuados, albergue y atención a grupos críticos",
    documento_fuente_id: 2
  },
  {
    id: 5,
    nombre: "U.B. Sanitaria",
    coordinador: "CICU",
    cargo: "Coordinador UB Sanitaria",
    descripcion: "Asistencia sanitaria, control epidemiológico y necesidades farmacéuticas",
    documento_fuente_id: 2
  },
  {
    id: 6,
    nombre: "Evaluación de Daños",
    coordinador: "Ingeniero Industrial y Arquitectos municipales",
    cargo: "Coordinador Evaluación de Daños",
    descripcion: "Valoración de daños y apoyo técnico a la toma de decisiones",
    documento_fuente_id: 2
  }
];

const accionesEscenarioIniciales = [
  {
    id: 1,
    riesgo: "FMA",
    nivel: "amarillo",
    situacion: "preemergencia",
    unidad_basica_id: 1,
    accion: "Seguimiento visual de cauces, puntos de vigilancia y puntos conflictivos en vías de comunicación",
    prioridad: "alta",
    mensaje_predefinido: "Realizar seguimiento de cauces y puntos críticos; comunicar evolución al CECOPAL.",
    documento_fuente_id: 2
  },
  {
    id: 2,
    riesgo: "FMA",
    nivel: "amarillo",
    situacion: "preemergencia",
    unidad_basica_id: 3,
    accion: "Preparación de vallas, barreras, material de señalización y revisión de equipos de achique",
    prioridad: "alta",
    mensaje_predefinido: "Preparar vallas, bombas de achique y material de intervención preventiva.",
    documento_fuente_id: 2
  },
  {
    id: 3,
    riesgo: "FMA",
    nivel: "naranja",
    situacion: "situacion_0",
    unidad_basica_id: 1,
    accion: "Control de accesos, avisos a la población y alejamiento preventivo en zonas de peligro inminente",
    prioridad: "muy alta",
    mensaje_predefinido: "Activar control de accesos y avisos preventivos a población en zonas potencialmente afectadas.",
    documento_fuente_id: 2
  },
  {
    id: 4,
    riesgo: "FMA",
    nivel: "naranja",
    situacion: "situacion_0",
    unidad_basica_id: 3,
    accion: "Limpieza preventiva, levantamiento de diques provisionales y eliminación de obstáculos",
    prioridad: "muy alta",
    mensaje_predefinido: "Actuar en limpieza preventiva y despeje de puntos críticos de escorrentía.",
    documento_fuente_id: 2
  },
  {
    id: 5,
    riesgo: "FMA",
    nivel: "rojo",
    situacion: "situacion_1_2",
    unidad_basica_id: 4,
    accion: "Gestión de albergue y asistencia de evacuados",
    prioridad: "muy alta",
    mensaje_predefinido: "Preparar recepción y asistencia de evacuados y grupos vulnerables.",
    documento_fuente_id: 2
  },
  {
    id: 6,
    riesgo: "FMA",
    nivel: "rojo",
    situacion: "situacion_1_2",
    unidad_basica_id: 5,
    accion: "Asistencia sanitaria, control de epidemias e intoxicaciones y necesidades farmacéuticas",
    prioridad: "muy alta",
    mensaje_predefinido: "Activar atención sanitaria y seguimiento de necesidades asistenciales.",
    documento_fuente_id: 2
  }
];

const puntosPlanIniciales = [
  {
    id: 1,
    codigo: "PCV-1",
    nombre: "Aliviadero de la Presa del Embalse de la Garganta",
    categoria: "punto_critico_vigilancia",
    subcategoria: "barranco",
    lat: 38.267938,
    lng: -0.784919,
    descripcion: "Punto de referencia",
    observaciones: "Observación del caudal del Barranco de la Garganta y parte alta del Barranco del Boch",
    actuacion_recomendada: "Seguimiento del caudal y valoración de situación real",
    documento_fuente_id: 3
  },
  {
    id: 2,
    codigo: "PCV-2",
    nombre: "Barranco del Boch",
    categoria: "punto_critico_vigilancia",
    subcategoria: "via_comunicacion",
    lat: 38.230353,
    lng: -0.789608,
    descripcion: "Cruce del barranco con acceso a la A-7. Carretera de la Estación",
    observaciones: "Puede verse seriamente dañada la intersección; afecta también a estación de ferrocarril",
    actuacion_recomendada: "Limpieza preventiva",
    documento_fuente_id: 3
  },
  {
    id: 3,
    codigo: "PCV-4",
    nombre: "Barranco Rambla Castelar",
    categoria: "punto_critico_vigilancia",
    subcategoria: "desbordamiento",
    lat: 38.2541842,
    lng: -0.8175068,
    descripcion: "Canalización del Barranco de la Rambla",
    observaciones: "La escasa luz del puente y la obstrucción del cauce pueden provocar desbordamiento",
    actuacion_recomendada: "Limpieza preventiva y mantenimiento de la canalización",
    documento_fuente_id: 3
  },
  {
    id: 4,
    codigo: "PCV-5",
    nombre: "Rambla urbanizada",
    categoria: "punto_critico_vigilancia",
    subcategoria: "zona_urbana",
    lat: 38.2442911,
    lng: -0.8109760,
    descripcion: "Zona urbanizada con afección en puente Jorge Juan y Avda. de Madrid",
    observaciones: "Se han producido calados por lluvias fuertes",
    actuacion_recomendada: "Limpieza preventiva de imbornales",
    documento_fuente_id: 3
  },
  {
    id: 5,
    codigo: "PCV-9",
    nombre: "Barranco Amorós",
    categoria: "punto_critico_vigilancia",
    subcategoria: "tramo_inundable",
    lat: 38.217527,
    lng: -0.832062,
    descripcion: "Situado en intersección N-340 dirección Albatera",
    observaciones: "Puede desbordarse sobre la N-340 e impedir la circulación",
    actuacion_recomendada: "Limpieza preventiva",
    documento_fuente_id: 3
  }
];

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function initDB() {
  const exists = await fs.pathExists(DB_FILE);

  if (!exists) {
    await fs.ensureDir(path.join(__dirname, "data"));
    await fs.writeJson(
      DB_FILE,
      {
        emergencia: {
          activa: false,
          tipo: null,
          nivel: null,
          fecha: null
        },
        tareas: [],
        puntos: puntosPlanIniciales,
        documentos_fuente: documentosFuenteIniciales,
        unidades_basicas: unidadesBasicasIniciales,
        acciones_escenario: accionesEscenarioIniciales,
        logs: []
      },
      { spaces: 2 }
    );
    return;
  }

  const db = await fs.readJson(DB_FILE);

  if (!db.emergencia) db.emergencia = { activa: false, tipo: null, nivel: null, fecha: null };
  if (!db.tareas) db.tareas = [];
  if (!db.puntos) db.puntos = puntosPlanIniciales;
  if (!db.documentos_fuente) db.documentos_fuente = documentosFuenteIniciales;
  if (!db.unidades_basicas) db.unidades_basicas = unidadesBasicasIniciales;
  if (!db.acciones_escenario) db.acciones_escenario = accionesEscenarioIniciales;
  if (!db.logs) db.logs = [];

  await fs.writeJson(DB_FILE, db, { spaces: 2 });
}

async function readDB() {
  return fs.readJson(DB_FILE);
}

async function writeDB(data) {
  return fs.writeJson(DB_FILE, data, { spaces: 2 });
}

app.get("/api/municipio", (req, res) => {
  res.json(municipio);
});

app.get("/api/documentos", async (req, res) => {
  const db = await readDB();
  res.json(db.documentos_fuente || []);
});

app.get("/api/unidades-basicas", async (req, res) => {
  const db = await readDB();
  res.json(db.unidades_basicas || []);
});

app.get("/api/acciones-escenario", async (req, res) => {
  const db = await readDB();
  res.json(db.acciones_escenario || []);
});

app.get("/api/puntos", async (req, res) => {
  const db = await readDB();
  res.json(db.puntos || []);
});

app.post("/api/puntos", async (req, res) => {
  const { nombre, tipo, descripcion, lat, lng } = req.body;

  if (!nombre || !tipo || lat === undefined || lng === undefined) {
    return res.status(400).json({
      ok: false,
      mensaje: "Faltan datos obligatorios del punto"
    });
  }

  const db = await readDB();

  const nuevoPunto = {
    id: Date.now(),
    codigo: `USR-${Date.now()}`,
    nombre: String(nombre).trim(),
    categoria: "punto_interes",
    subcategoria: String(tipo).trim(),
    descripcion: descripcion ? String(descripcion).trim() : "",
    observaciones: "",
    actuacion_recomendada: "",
    lat: Number(lat),
    lng: Number(lng),
    documento_fuente_id: null
  };

  if (Number.isNaN(nuevoPunto.lat) || Number.isNaN(nuevoPunto.lng)) {
    return res.status(400).json({
      ok: false,
      mensaje: "Latitud o longitud no válidas"
    });
  }

  db.puntos.push(nuevoPunto);

  db.logs.push({
    fecha: new Date().toISOString(),
    accion: "crear_punto",
    detalle: `Punto creado: ${nuevoPunto.nombre} (${nuevoPunto.subcategoria})`
  });

  await writeDB(db);

  res.json({ ok: true, punto: nuevoPunto });
});

app.get("/api/estado", async (req, res) => {
  const db = await readDB();
  res.json(db.emergencia);
});

app.get("/api/tareas", async (req, res) => {
  const db = await readDB();
  res.json(db.tareas);
});

app.post("/api/activar", async (req, res) => {
  const { tipo, nivel } = req.body;
  const db = await readDB();

  db.emergencia = {
    activa: true,
    tipo,
    nivel,
    fecha: new Date().toISOString()
  };

  db.tareas = [
    {
      id: 1,
      titulo: "Revisar Barranco Rambla Castelar",
      grupo: "U.B. Seguridad",
      lat: 38.2541842,
      lng: -0.8175068,
      estado: "pendiente"
    },
    {
      id: 2,
      titulo: "Preparar vallas y limpieza preventiva en zona urbana",
      grupo: "U.B. Apoyo Logístico",
      lat: 38.2442911,
      lng: -0.8109760,
      estado: "pendiente"
    }
  ];

  db.logs.push({
    fecha: new Date().toISOString(),
    accion: "activacion",
    detalle: `Activada ${tipo} nivel ${nivel}`
  });

  await writeDB(db);

  res.json({ ok: true, mensaje: "Emergencia activada" });
});

app.post("/api/tareas/:id/estado", async (req, res) => {
  const id = Number(req.params.id);
  const { estado } = req.body;

  const db = await readDB();
  const tarea = db.tareas.find(t => t.id === id);

  if (!tarea) {
    return res.status(404).json({ ok: false, mensaje: "Tarea no encontrada" });
  }

  tarea.estado = estado;

  db.logs.push({
    fecha: new Date().toISOString(),
    accion: "actualizacion_tarea",
    detalle: `Tarea ${id} actualizada a ${estado}`
  });

  await writeDB(db);

  res.json({ ok: true });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor funcionando en puerto ${PORT}`);
  });
});

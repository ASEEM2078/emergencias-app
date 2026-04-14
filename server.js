const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "data", "db.json");

const municipio = {
  nombre: "Crevillent",
  centro: {
    lat: 38.2499,
    lng: -0.8091
  },
  zoom: 13
};

const puntosPlanIniciales = [
  {
    id: 1,
    nombre: "Ayuntamiento de Crevillent",
    tipo: "ayuntamiento",
    descripcion: "Edificio principal municipal",
    lat: 38.2499,
    lng: -0.8091
  },
  {
    id: 2,
    nombre: "Centro de Salud de Crevillent",
    tipo: "sanitario",
    descripcion: "Centro sanitario principal",
    lat: 38.2468,
    lng: -0.8080
  },
  {
    id: 3,
    nombre: "Zona de posible acumulación de agua",
    tipo: "zona_inundable",
    descripcion: "Punto sensible por lluvias intensas",
    lat: 38.2520,
    lng: -0.8140
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
        logs: []
      },
      { spaces: 2 }
    );
    return;
  }

  const db = await fs.readJson(DB_FILE);

  if (!db.emergencia) {
    db.emergencia = {
      activa: false,
      tipo: null,
      nivel: null,
      fecha: null
    };
  }

  if (!db.tareas) {
    db.tareas = [];
  }

  if (!db.puntos) {
    db.puntos = puntosPlanIniciales;
  }

  if (!db.logs) {
    db.logs = [];
  }

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
    nombre: String(nombre).trim(),
    tipo: String(tipo).trim(),
    descripcion: descripcion ? String(descripcion).trim() : "",
    lat: Number(lat),
    lng: Number(lng)
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
    detalle: `Punto creado: ${nuevoPunto.nombre} (${nuevoPunto.tipo})`
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
      titulo: "Revisar punto inundable en acceso sur",
      grupo: "Brigada",
      lat: 38.2455,
      lng: -0.8120,
      estado: "pendiente"
    },
    {
      id: 2,
      titulo: "Vigilar cauce y zonas de escorrentía",
      grupo: "Protección Civil",
      lat: 38.2525,
      lng: -0.8045,
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

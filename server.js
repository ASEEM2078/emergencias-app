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

const puntosPlan = [
  {
    nombre: "Ayuntamiento de Crevillent",
    tipo: "edificio",
    lat: 38.2499,
    lng: -0.8091
  },
  {
    nombre: "Centro de Salud de Crevillent",
    tipo: "sanitario",
    lat: 38.2468,
    lng: -0.8080
  },
  {
    nombre: "Zona de posible acumulación de agua",
    tipo: "riesgo",
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
        logs: []
      },
      { spaces: 2 }
    );
  }
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

app.get("/api/puntos", (req, res) => {
  res.json(puntosPlan);
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

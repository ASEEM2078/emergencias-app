let map;
let markersTareas = [];
let markersPuntos = [];

window.onload = async () => {
  const resMunicipio = await fetch("/api/municipio");
  const datosMunicipio = await resMunicipio.json();

  document.getElementById("tituloApp").textContent = "Plan de Emergencias";
  document.getElementById("nombreMunicipio").textContent = `Municipio: ${datosMunicipio.nombre}`;

  map = L.map("map").setView(
    [datosMunicipio.centro.lat, datosMunicipio.centro.lng],
    datosMunicipio.zoom
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  document.getElementById("activarBtn").addEventListener("click", activar);
  document.getElementById("formPunto").addEventListener("submit", guardarPunto);

  await cargarEstado();
  await cargarTareas();
  await cargarPuntos();
};

async function cargarEstado() {
  const res = await fetch("/api/estado");
  const data = await res.json();

  document.getElementById("estado").textContent = JSON.stringify(data, null, 2);

  const badge = document.getElementById("estadoBadge");

  if (data.activa) {
    badge.textContent = `${data.tipo || "emergencia"} - ${data.nivel || ""}`;
    badge.style.background = "#b91c1c";
  } else {
    badge.textContent = "Sin activar";
    badge.style.background = "#334155";
  }
}

async function cargarTareas() {
  const res = await fetch("/api/tareas");
  const tareas = await res.json();

  const contenedor = document.getElementById("tareas");
  contenedor.innerHTML = "";

  markersTareas.forEach(marker => map.removeLayer(marker));
  markersTareas = [];

  if (tareas.length === 0) {
    contenedor.innerHTML = "<p>No hay tareas activas.</p>";
    return;
  }

  tareas.forEach(t => {
    const div = document.createElement("div");
    div.className = "tarea";

    div.innerHTML = `
      <p><strong>${t.titulo}</strong></p>
      <p><strong>Grupo:</strong> ${t.grupo}</p>
      <p><strong>Estado:</strong> ${t.estado}</p>
      <button onclick="completar(${t.id})">Marcar realizada</button>
    `;

    contenedor.appendChild(div);

    const color = t.estado === "realizada" ? "green" : "red";

    const marker = L.circleMarker([t.lat, t.lng], {
      color,
      radius: 8,
      weight: 3
    }).addTo(map);

    marker.bindPopup(`<b>${t.titulo}</b><br>${t.grupo}<br>${t.estado}`);
    markersTareas.push(marker);
  });
}

async function cargarPuntos() {
  const res = await fetch("/api/puntos");
  const puntos = await res.json();

  const lista = document.getElementById("listaPuntos");
  lista.innerHTML = "";

  markersPuntos.forEach(marker => map.removeLayer(marker));
  markersPuntos = [];

  if (puntos.length === 0) {
    lista.innerHTML = "<p>No hay puntos cargados.</p>";
    return;
  }

  puntos.forEach(p => {
    const marker = L.marker([p.lat, p.lng]).addTo(map);
    marker.bindPopup(
      `<b>${p.nombre}</b><br>${p.tipo}<br>${p.descripcion || ""}`
    );
    markersPuntos.push(marker);

    const item = document.createElement("div");
    item.className = "punto-item";
    item.innerHTML = `
      <p><strong>${p.nombre}</strong></p>
      <p><strong>Tipo:</strong> ${p.tipo}</p>
      <p><strong>Lat:</strong> ${p.lat}</p>
      <p><strong>Lng:</strong> ${p.lng}</p>
      <p>${p.descripcion || ""}</p>
    `;
    lista.appendChild(item);
  });
}

async function guardarPunto(event) {
  event.preventDefault();

  const nombre = document.getElementById("puntoNombre").value;
  const tipo = document.getElementById("puntoTipo").value;
  const descripcion = document.getElementById("puntoDescripcion").value;
  const lat = document.getElementById("puntoLat").value;
  const lng = document.getElementById("puntoLng").value;
  const mensaje = document.getElementById("mensajePunto");

  mensaje.textContent = "Guardando punto...";

  const res = await fetch("/api/puntos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      nombre,
      tipo,
      descripcion,
      lat,
      lng
    })
  });

  const data = await res.json();

  if (!res.ok) {
    mensaje.textContent = data.mensaje || "Error al guardar el punto";
    return;
  }

  mensaje.textContent = "Punto guardado correctamente";

  document.getElementById("formPunto").reset();

  await cargarPuntos();
}

async function activar() {
  await fetch("/api/activar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: "lluvias",
      nivel: "amarillo"
    })
  });

  await cargarEstado();
  await cargarTareas();
}

async function completar(id) {
  await fetch(`/api/tareas/${id}/estado`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      estado: "realizada"
    })
  });

  await cargarTareas();
}

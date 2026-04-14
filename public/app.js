let map;
let markers = [];
let puntosFijos = [];

window.onload = async () => {
  const resMunicipio = await fetch("/api/municipio");
  const datosMunicipio = await resMunicipio.json();

  map = L.map("map").setView(
    [datosMunicipio.centro.lat, datosMunicipio.centro.lng],
    datosMunicipio.zoom
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  document.getElementById("activarBtn").addEventListener("click", activar);

  await cargarEstado();
  await cargarTareas();
  await cargarPuntos();
};

async function cargarEstado() {
  const res = await fetch("/api/estado");
  const data = await res.json();
  document.getElementById("estado").textContent = JSON.stringify(data, null, 2);
}

async function cargarTareas() {
  const res = await fetch("/api/tareas");
  const tareas = await res.json();

  const contenedor = document.getElementById("tareas");
  contenedor.innerHTML = "";

  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  tareas.forEach(t => {
    const div = document.createElement("div");

    div.innerHTML = `
      <p><strong>${t.titulo}</strong></p>
      <p>${t.grupo}</p>
      <p>${t.estado}</p>
      <button onclick="completar(${t.id})">Completar</button>
      <hr>
    `;

    contenedor.appendChild(div);

    const color = t.estado === "realizada" ? "green" : "red";

    const marker = L.circleMarker([t.lat, t.lng], {
      color: color,
      radius: 8
    }).addTo(map);

    marker.bindPopup(`<b>${t.titulo}</b><br>${t.grupo}<br>${t.estado}`);
    markers.push(marker);
  });
}

async function cargarPuntos() {
  puntosFijos.forEach(marker => map.removeLayer(marker));
  puntosFijos = [];

  const res = await fetch("/api/puntos");
  const puntos = await res.json();

  puntos.forEach(p => {
    const marker = L.marker([p.lat, p.lng]).addTo(map);
    marker.bindPopup(`<b>${p.nombre}</b><br>${p.tipo}`);
    puntosFijos.push(marker);
  });
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
  await fetch("/api/tareas/" + id + "/estado", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      estado: "realizada"
    })
  });

  await cargarTareas();
}

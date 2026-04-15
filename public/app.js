let map;
let markersTareas = [];
let markersPuntos = [];

window.onload = async () => {
  const resMunicipio = await fetch("/api/municipio");
  const datosMunicipio = await resMunicipio.json();

  document.getElementById("tituloApp").textContent = "Plan de Emergencias";
  document.getElementById("nombreMunicipio").textContent =
    `${datosMunicipio.nombre} · ${datosMunicipio.plan_nombre} · ${datosMunicipio.plan_revision}`;

  map = L.map("map").setView(
    [datosMunicipio.centro.lat, datosMunicipio.centro.lng],
    datosMunicipio.zoom
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  document.getElementById("activarBtn").addEventListener("click", activar);
  document.getElementById("formPunto").addEventListener("submit", guardarPunto);
  document.getElementById("selectorRiesgo").addEventListener("change", cargarAcciones);
  document.getElementById("selectorNivel").addEventListener("change", cargarAcciones);

  await cargarEstado();
  await cargarTareas();
  await cargarPuntos();
  await cargarDocumentos();
  await cargarUnidades();
  await cargarAcciones();
};

async function cargarEstado() {
  const res = await fetch("/api/estado");
  const data = await res.json();

  const contenedor = document.getElementById("estadoVisual");

  const fecha = data.fecha
    ? new Date(data.fecha).toLocaleString("es-ES")
    : "Sin fecha";

  contenedor.innerHTML = `
    <div class="estado-linea"><strong>Estado</strong><span>${data.activa ? "Activa" : "No activa"}</span></div>
    <div class="estado-linea"><strong>Tipo</strong><span>${data.tipo || "-"}</span></div>
    <div class="estado-linea"><strong>Nivel</strong><span>${data.nivel || "-"}</span></div>
    <div class="estado-linea"><strong>Fecha</strong><span>${fecha}</span></div>
  `;

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
      <p><strong>Prioridad:</strong> ${t.prioridad || "-"}</p>
      <p><strong>Estado:</strong> ${t.estado}</p>
      <p><strong>Mensaje:</strong> ${t.mensaje_predefinido || "-"}</p>
      <button onclick="completar(${t.id})">Marcar realizada</button>
    `;

    contenedor.appendChild(div);

    const color = t.estado === "realizada" ? "green" : "red";

    const marker = L.circleMarker([t.lat, t.lng], {
      color,
      radius: 8,
      weight: 3
    }).addTo(map);

    marker.bindPopup(
      `<b>${t.titulo}</b><br>${t.grupo}<br>${t.estado}<br>${t.mensaje_predefinido || ""}`
    );

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
      `<b>${p.nombre}</b><br>${p.categoria}<br>${p.subcategoria}<br>${p.observaciones || ""}`
    );
    markersPuntos.push(marker);

    const item = document.createElement("div");
    item.className = "item-bloque";
    item.innerHTML = `
      <div class="codigo">${p.codigo || "SIN-COD"}</div>
      <p><strong>${p.nombre}</strong></p>
      <p><strong>Categoría:</strong> ${p.categoria}</p>
      <p><strong>Subcategoría:</strong> ${p.subcategoria}</p>
      <p>${p.descripcion || ""}</p>
      <p><strong>Actuación:</strong> ${p.actuacion_recomendada || "-"}</p>
    `;
    lista.appendChild(item);
  });
}

async function cargarDocumentos() {
  const res = await fetch("/api/documentos");
  const documentos = await res.json();

  const lista = document.getElementById("listaDocumentos");
  lista.innerHTML = "";

  documentos.forEach(doc => {
    const item = document.createElement("div");
    item.className = "item-bloque";
    item.innerHTML = `
      <p><strong>${doc.titulo}</strong></p>
      <p><strong>Tipo:</strong> ${doc.tipo_documento}</p>
      <p><strong>Archivo:</strong> ${doc.archivo_nombre}</p>
      <p><strong>Revisión:</strong> ${doc.revision}</p>
      <p>${doc.descripcion || ""}</p>
    `;
    lista.appendChild(item);
  });
}

async function cargarUnidades() {
  const res = await fetch("/api/unidades-basicas");
  const unidades = await res.json();

  const lista = document.getElementById("listaUnidades");
  lista.innerHTML = "";

  unidades.forEach(ub => {
    const item = document.createElement("div");
    item.className = "item-bloque";
    item.innerHTML = `
      <p><strong>${ub.nombre}</strong></p>
      <p><strong>Coordinador:</strong> ${ub.coordinador}</p>
      <p><strong>Cargo:</strong> ${ub.cargo}</p>
      <p>${ub.descripcion}</p>
    `;
    lista.appendChild(item);
  });
}

async function cargarAcciones() {
  const riesgo = document.getElementById("selectorRiesgo").value;
  const nivel = document.getElementById("selectorNivel").value;

  const res = await fetch(`/api/acciones-escenario?riesgo=${encodeURIComponent(riesgo)}&nivel=${encodeURIComponent(nivel)}`);
  const acciones = await res.json();

  const lista = document.getElementById("listaAcciones");
  lista.innerHTML = "";

  if (acciones.length === 0) {
    lista.innerHTML = "<p>No hay acciones definidas para este escenario.</p>";
    return;
  }

  acciones.forEach(acc => {
    const item = document.createElement("div");
    item.className = "item-bloque";
    item.innerHTML = `
      <div class="codigo">${acc.riesgo} · ${acc.nivel}</div>
      <p><strong>Situación:</strong> ${acc.situacion}</p>
      <p><strong>Unidad ID:</strong> ${acc.unidad_basica_id}</p>
      <p><strong>Punto:</strong> ${acc.punto_plan_codigo || "-"}</p>
      <p><strong>Acción:</strong> ${acc.accion}</p>
      <p><strong>Prioridad:</strong> ${acc.prioridad}</p>
      <p><strong>Mensaje:</strong> ${acc.mensaje_predefinido}</p>
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
  const riesgo = document.getElementById("selectorRiesgo").value;
  const nivel = document.getElementById("selectorNivel").value;
  const mensaje = document.getElementById("mensajeActivacion");

  mensaje.textContent = "Activando escenario...";

  const res = await fetch("/api/activar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: riesgo,
      nivel
    })
  });

  const data = await res.json();

  if (!res.ok) {
    mensaje.textContent = data.mensaje || "Error en la activación";
    return;
  }

  mensaje.textContent = `Escenario activado. Tareas generadas: ${data.tareas_generadas}`;

  await cargarEstado();
  await cargarTareas();
  await cargarAcciones();
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

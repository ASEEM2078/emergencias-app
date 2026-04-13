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

  cargarEstado();
  cargarTareas();
}

async function completar(id) {
  await fetch("/api/tareas/" + id + "/estado", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      estado: "realizada"
    })
  });

  cargarTareas();
}

document.getElementById("activarBtn").addEventListener("click", activar);

cargarEstado();
cargarTareas();

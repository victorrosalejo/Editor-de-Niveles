let canvas = document.getElementById('editorCanvas');
let ctx = canvas.getContext('2d');

let nivel = [];
const precargados = [
  { type: "ground", name: "dirt", x: 500, y: 440, width: 1000, height: 20, isStatic: true },
  { type: "ground", name: "wood", x: 185, y: 390, width: 30, height: 80, isStatic: true }
];

let modo = 'block';
let orientacion = 'horizontal';  // Variable para definir orientación
let seleccion = null;
let moviendo = false;

function setMode(nuevoModo) {
  modo = nuevoModo;
  seleccion = null;
  ocultarPanel();
}

function setOrientacion(nuevaOrientacion) {
  orientacion = nuevaOrientacion;
}

function dibujarNivel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  precargados.concat(nivel).forEach(dibujarEntidad);
}

function dibujarEntidad(entidad) {
  ctx.save();
  ctx.translate(entidad.x, entidad.y);
  ctx.fillStyle = obtenerColorEntidad(entidad);

  if (entidad.shape === 'rectangle') {
    ctx.fillRect(-entidad.width / 2, -entidad.height / 2, entidad.width, entidad.height);
  } else if (entidad.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(0, 0, entidad.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  if (precargados.includes(entidad)) {
    ctx.strokeStyle = 'purple';
    ctx.lineWidth = 2;
    ctx.strokeRect(-entidad.width / 2, -entidad.height / 2, entidad.width, entidad.height);
  }

  // Dibuja el círculo de selección sobre el elemento seleccionado
  if (seleccion === entidad) {
    ctx.beginPath();
    let selectionRadius = (entidad.shape === 'circle' 
      ? entidad.radius + 10 
      : Math.max(entidad.width, entidad.height) / 2 + 10);
    ctx.arc(0, 0, selectionRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'black';  // Cambia el color aquí si lo deseas
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.fillStyle = 'black';
  ctx.font = '12px Arial';
  ctx.fillText(entidad.name || entidad.type, -15, -15);
  ctx.restore();
}

function obtenerColorEntidad(entidad) {
  if (precargados.includes(entidad)) return '#FFD700';
  if (entidad.type === 'hero') return 'green';
  if (entidad.type === 'villain') return 'red';
  return '#8B4513';
}

canvas.addEventListener('mousedown', (e) => {
  const { x, y } = getMousePos(e);
  seleccion = nivel.find(ent => dentroDeEntidad(x, y, ent));

  if (!seleccion) {
    agregarEntidad(x, y);
    seleccion = nivel[nivel.length - 1];
  }

  moviendo = true;
  mostrarPanelPropiedades();
  dibujarNivel();
});

canvas.addEventListener('mousemove', (e) => {
  if (moviendo && seleccion) {
    const { x, y } = getMousePos(e);
    seleccion.x = x;
    seleccion.y = y;
    dibujarNivel();
    actualizarPanel();
  }
});

canvas.addEventListener('mouseup', () => {
  moviendo = false;
});

function getMousePos(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function dentroDeEntidad(x, y, entidad) {
  if (entidad.shape === 'rectangle') {
    return x >= entidad.x - entidad.width / 2 &&
           x <= entidad.x + entidad.width / 2 &&
           y >= entidad.y - entidad.height / 2 &&
           y <= entidad.y + entidad.height / 2;
  } else if (entidad.shape === 'circle') {
    return Math.hypot(x - entidad.x, y - entidad.y) <= entidad.radius;
  }
  return false;
}

function agregarEntidad(x, y) {
  let entidad;
  if (modo === 'block') {
    entidad = {
      type: 'block',
      shape: 'rectangle',
      x, y,
      width: orientacion === 'horizontal' ? 100 : 25,  // Usa la orientación
      height: orientacion === 'horizontal' ? 25 : 100,
      name: 'block',
      angle: 0,
      isStatic: false
    };
  } else if (modo === 'hero') {
    entidad = {
      type: 'hero',
      shape: 'circle',
      x, y,
      radius: 25,
      name: 'hero',
      power: 'superjump'
    };
  } else if (modo === 'villain') {
    entidad = {
      type: 'villain',
      shape: 'circle',
      x, y,
      radius: 25,
      name: 'villain',
      calories: 500
    };
  }
  nivel.push(entidad);
  dibujarNivel();
}

function eliminarEntidad() {
  if (seleccion) {
    nivel = nivel.filter(e => e !== seleccion);
    seleccion = null;
    ocultarPanel();
    dibujarNivel();
  }
}

function limpiarNivel() {
  nivel = [];
  seleccion = null;
  ocultarPanel();
  dibujarNivel();
}

function descargarNivel() {
  const exportado = {
    foreground: 'spacex-foreground',
    background: 'starship-background',
    entities: precargados.concat(nivel).map(e => ({
      type: e.type,
      name: e.name,
      x: e.x, y: e.y,
      width: e.width, height: e.height,
      radius: e.radius, angle: e.angle,
      isStatic: e.isStatic,
      power: e.power,
      calories: e.calories
    }))
  };

  const blob = new Blob([JSON.stringify(exportado, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'nivel.json';
  link.click();
}

function mostrarPanelPropiedades() {
  if (!seleccion) {
    ocultarPanel();
    return;
  }
  const panel = document.getElementById('propiedades');
  let html = `<h3>Propiedades</h3>
                <label>Nombre: <input id="prop-name"></label><br>`;
  if (seleccion.shape === 'rectangle') {
    html += `<label>Ancho: <input type="number" id="prop-width"></label><br>
             <label>Alto: <input type="number" id="prop-height"></label><br>`;
  }
  html += `<label>Ángulo: <input type="number" id="prop-angle"></label><br>
           <label>Estático: <input type="checkbox" id="prop-static"></label><br>`;
  if (seleccion.type === 'hero') {
    html += `<label>Poder: <input id="prop-power"></label><br>`;
  } else if (seleccion.type === 'villain') {
    html += `<label>Calorías: <input type="number" id="prop-calories"></label><br>`;
  }
  html += `<button onclick="guardarPropiedades()">Guardar</button>`;
  panel.innerHTML = html;
  panel.style.display = 'block';
  actualizarPanel();
}

function actualizarPanel() {
  const propName = document.getElementById('prop-name');
  if (propName) propName.value = seleccion.name || '';
  const propWidth = document.getElementById('prop-width');
  if (propWidth) propWidth.value = seleccion.width || 0;
  const propHeight = document.getElementById('prop-height');
  if (propHeight) propHeight.value = seleccion.height || 0;
  const propAngle = document.getElementById('prop-angle');
  if (propAngle) propAngle.value = seleccion.angle || 0;
  const propStatic = document.getElementById('prop-static');
  if (propStatic) propStatic.checked = seleccion.isStatic || false;
  if (seleccion.type === 'hero') {
    const propPower = document.getElementById('prop-power');
    if (propPower) propPower.value = seleccion.power || '';
  } else if (seleccion.type === 'villain') {
    const propCalories = document.getElementById('prop-calories');
    if (propCalories) propCalories.value = seleccion.calories || 0;
  }
}

function ocultarPanel() {
  document.getElementById('propiedades').style.display = 'none';
}
function setMaterial(nuevoMaterial) {
    material = nuevoMaterial;
}

function guardarPropiedades() {
  seleccion.name = document.getElementById('prop-name').value;
  const propWidth = document.getElementById('prop-width');
  if (propWidth) {
    seleccion.width = parseFloat(propWidth.value) || seleccion.width;
  }
  const propHeight = document.getElementById('prop-height');
  if (propHeight) {
    seleccion.height = parseFloat(propHeight.value) || seleccion.height;
  }
  seleccion.angle = parseFloat(document.getElementById('prop-angle').value) || seleccion.angle;
  seleccion.isStatic = document.getElementById('prop-static').checked;
  if (seleccion.type === 'hero') {
    seleccion.power = document.getElementById('prop-power').value;
  } else if (seleccion.type === 'villain') {
    seleccion.calories = parseInt(document.getElementById('prop-calories').value) || seleccion.calories;
  }
  dibujarNivel();
}

dibujarNivel();

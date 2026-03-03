/***********************
  VARIABLES GLOBALES
***********************/
let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let pedidosPendientes = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];

let indiceViandas = 0;
let indiceRapida = 0;

const totalSpan = document.getElementById("total-precio");
const contador = document.querySelector(".carrito-contador");
const productosDiv = document.querySelector(".carrito-productos");
const zonaEnvio = document.getElementById("zonaEnvio");
const nombreInput = document.getElementById("nombre");
const panelAdmin = document.getElementById("panel-admin");
const modoBtn = document.getElementById("modoOscuroBtn");

// Pago
const metodoPago = document.getElementById("metodoPago");
const btnPagarMP = document.getElementById("btnPagarMP");
const pagoRealizado = document.getElementById("pagoRealizado");
const confirmacionPago = document.getElementById("confirmacionPago");

// GPS
const btnGps = document.getElementById("btn-cargar-gps");
const gpsStatus = document.getElementById("gps-status");
let linkUbicacionGps = ""; 
const linkMercadoPago = "http://link.mercadopago.com.ar/milsaboresviandas";

/***********************
  1. CARGA DE DATOS
***********************/
async function cargarProductos() {
    try {
        const res = await fetch("productos.json");
        const data = await res.json();
        const stockLocal = JSON.parse(localStorage.getItem("stockProductos")) || [];

        productos = data.map(pj => {
            const guardado = stockLocal.find(s => s.id === pj.id);
            return { ...pj, stock: guardado ? guardado.stock : pj.stock };
        });

        actualizarTodo(); 
        setupFlechas(); 
    } catch (e) {
        console.error("Error cargando productos:", e);
    }
}

/***********************
  2. RENDER Y CARRUSELES (TUS BOTONES)
***********************/
function renderSeccion(categoria, idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;
    contenedor.innerHTML = "";
    const filtrados = productos.filter(p => p.categoria === categoria);

    filtrados.forEach(prod => {
        const div = document.createElement("div");
        div.classList.add("producto");
        div.innerHTML = `
            <img src="${prod.imagen}" onerror="this.src='https://via.placeholder.com/150'">
            <h3>${prod.nombre}</h3>
            <p>$${prod.precio}</p>
            <p class="stock">Stock: ${prod.stock}</p>
            <button onclick="agregarAlCarrito(${prod.id})" ${prod.stock <= 0 ? "disabled" : ""}>
                ${prod.stock <= 0 ? "Sin stock" : "Agregar"}
            </button>
        `;
        contenedor.appendChild(div);
    });
}

function moverCarrusel(idContenedor, indice) {
    const carrusel = document.getElementById(idContenedor);
    if (!carrusel) return;
    const tarjeta = carrusel.querySelector(".producto");
    if (!tarjeta) return;
    
    const estilo = window.getComputedStyle(tarjeta);
    const margenDerecho = parseFloat(estilo.marginRight) || 20;
    const anchoTotal = tarjeta.offsetWidth + margenDerecho;

    carrusel.style.transform = `translateX(-${indice * anchoTotal}px)`;
}

function setupFlechas() {
    // Restauramos tus eventos de clic exactos
    const btnNextV = document.getElementById("next-viandas");
    const btnPrevV = document.getElementById("prev-viandas");
    const btnNextR = document.getElementById("next-rapida");
    const btnPrevR = document.getElementById("prev-rapida");

    if(btnNextV) btnNextV.onclick = () => {
        const filtrados = productos.filter(p => p.categoria === "vianda");
        if (indiceViandas < filtrados.length - 1) {
            indiceViandas++;
            moverCarrusel("carrusel-viandas", indiceViandas);
        }
    };
    if(btnPrevV) btnPrevV.onclick = () => {
        if (indiceViandas > 0) {
            indiceViandas--;
            moverCarrusel("carrusel-viandas", indiceViandas);
        }
    };
    if(btnNextR) btnNextR.onclick = () => {
        const filtrados = productos.filter(p => p.categoria === "rapida");
        if (indiceRapida < filtrados.length - 1) {
            indiceRapida++;
            moverCarrusel("carrusel-rapida", indiceRapida);
        }
    };
    if(btnPrevR) btnPrevR.onclick = () => {
        if (indiceRapida > 0) {
            indiceRapida--;
            moverCarrusel("carrusel-rapida", indiceRapida);
        }
    };
}

/***********************
  3. CARRITO (TU LÓGICA DE HORARIOS RESTAURADA)
***********************/
window.agregarAlCarrito = function(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod || prod.stock <= 0) return;

    // VOLVEMOS A TUS HORARIOS ORIGINALES
    if (!horarioActivo(prod.categoria)) {
        alert("Esta sección está fuera de horario.");
        return;
    }

    prod.stock--;
    const item = carrito.find(c => c.id === id);
    if (item) item.cantidad++;
    else carrito.push({ ...prod, cantidad: 1 });

    actualizarTodo();
};

window.eliminarDelCarrito = function(id) {
    const idx = carrito.findIndex(c => c.id === id);
    if (idx !== -1) {
        const prod = productos.find(p => p.id === carrito[idx].id);
        if (prod) prod.stock += carrito[idx].cantidad;
        carrito.splice(idx, 1);
        actualizarTodo();
    }
};

function actualizarTodo() {
    localStorage.setItem("stockProductos", JSON.stringify(productos));
    localStorage.setItem("carrito", JSON.stringify(carrito));
    renderSeccion("vianda", "carrusel-viandas");
    renderSeccion("rapida", "carrusel-rapida");
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    if(!productosDiv) return;
    productosDiv.innerHTML = "";
    let subtotal = 0, cantItems = 0;

    carrito.forEach(i => {
        subtotal += Number(i.precio) * Number(i.cantidad);
        cantItems += i.cantidad;
        const p = document.createElement("p");
        p.innerHTML = `<span>${i.nombre} x${i.cantidad}</span> <button onclick="eliminarDelCarrito(${i.id})">🗑️</button>`;
        productosDiv.appendChild(p);
    });

    let precioEnvio = 0;
    if (zonaEnvio) {
        const opc = zonaEnvio.options[zonaEnvio.selectedIndex];
        precioEnvio = opc ? parseInt(opc.getAttribute("data-precio") || 0) : 0;
    }

    if(totalSpan) totalSpan.innerText = subtotal + precioEnvio;
    if(contador) {
        contador.innerText = cantItems;
        contador.style.display = cantItems > 0 ? "block" : "none";
    }
}

/***********************
  4. TU FUNCIÓN DE HORARIOS ORIGINAL
***********************/
function horarioActivo(categoria) {
    const hora = new Date().getHours();
    // Restaurado a tus límites exactos:
    if (categoria === "vianda") return hora >= 7 && hora < 23; 
    if (categoria === "rapida") return hora >= 19 && hora < 24;
    return true;
}

/***********************
  5. UI Y CIERRE (CORREGIDO)
***********************/
const btnCarritoIcono = document.querySelector(".carrito-btn");
const panelCarrito = document.querySelector(".carrito-panel");
const btnCerrar = document.getElementById("btnCerrarCarrito");

if (btnCarritoIcono) btnCarritoIcono.onclick = () => panelCarrito.classList.remove("oculto");
if (btnCerrar) btnCerrar.onclick = () => panelCarrito.classList.add("oculto");

// Reloj
setInterval(() => {
    const r = document.getElementById("reloj");
    if(r) r.innerText = `⏰ ${new Date().toLocaleTimeString()}`;
}, 1000);

// Modo Oscuro
if (localStorage.getItem("modo") === "oscuro") document.body.classList.add("oscuro");
if(modoBtn) modoBtn.onclick = () => {
    document.body.classList.toggle("oscuro");
    localStorage.setItem("modo", document.body.classList.contains("oscuro") ? "oscuro" : "claro");
};

// INICIO
cargarProductos();

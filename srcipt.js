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
const fondoColorInput = document.getElementById("fondoColor");

// Pago
const metodoPago = document.getElementById("metodoPago");
const btnPagarMP = document.getElementById("btnPagarMP");
const pagoRealizado = document.getElementById("pagoRealizado");
const confirmacionPago = document.getElementById("confirmacionPago");

// GPS Elements
const btnGps = document.getElementById("btn-cargar-gps");
const gpsStatus = document.getElementById("gps-status");
let linkUbicacionGps = ""; 

// 🔗 LINK MERCADO PAGO
const linkMercadoPago = "http://link.mercadopago.com.ar/milsaboresviandas";

// Configuración inicial
if (zonaEnvio) zonaEnvio.disabled = false;

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
        renderPanelAdmin();
        setupFlechas(); 
    } catch (e) {
        console.error("Error cargando productos:", e);
    }
}

/***********************
  2. RENDER Y CARRUSELES
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
    const tarjeta = carrusel.querySelector(".producto");
    if (!tarjeta) return;
    
    const estilo = window.getComputedStyle(tarjeta);
    const margenDerecho = parseFloat(estilo.marginRight) || 20;
    const anchoTotal = tarjeta.offsetWidth + margenDerecho;

    carrusel.style.transform = `translateX(-${indice * anchoTotal}px)`;
}

function setupFlechas() {
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
  3. CARRITO (LÓGICA Y UI)
***********************/
function agregarAlCarrito(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod || prod.stock <= 0) return;

    prod.stock--;
    const item = carrito.find(c => c.id === id);
    if (item) item.cantidad++;
    else carrito.push({ ...prod, cantidad: 1 });

    actualizarTodo();
}

function eliminarDelCarrito(id) {
    const idx = carrito.findIndex(c => c.id === id);
    if (idx === -1) return;

    const prod = productos.find(p => p.id === id);
    if (prod) prod.stock += carrito[idx].cantidad;

    carrito.splice(idx, 1);
    actualizarTodo();
}

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
    let subtotalProd = 0;
    let cantItems = 0;

    carrito.forEach(i => {
        subtotalProd += Number(i.precio) * Number(i.cantidad);
        cantItems += i.cantidad;
        const p = document.createElement("p");
        p.innerHTML = `<span>${i.nombre} x${i.cantidad}</span> <button onclick="eliminarDelCarrito(${i.id})">🗑️</button>`;
        productosDiv.appendChild(p);
    });

    // CORRECCIÓN PRECIO ENVÍO: Leer atributo exacto
    let precioEnvio = 0;
    if (zonaEnvio) {
        const opcionOk = zonaEnvio.options[zonaEnvio.selectedIndex];
        if (opcionOk && opcionOk.hasAttribute("data-precio")) {
            precioEnvio = parseInt(opcionOk.getAttribute("data-precio"), 10);
        }
    }

    const totalFinal = subtotalProd + precioEnvio;

    if(totalSpan) totalSpan.innerText = totalFinal;
    if(contador) {
        contador.innerText = cantItems;
        contador.style.display = cantItems > 0 ? "block" : "none";
    }
}

if(zonaEnvio) zonaEnvio.onchange = actualizarCarritoUI;

/***********************
  4. WHATSAPP + GPS
***********************/
if (btnGps) {
    btnGps.onclick = () => {
        gpsStatus.innerText = "Localizando... ⏳";
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                linkUbicacionGps = `https://www.google.com/maps?q=${lat},${lon}`;
                gpsStatus.innerHTML = "<b style='color:green'>✅ Ubicación lista</b>";
            },
            () => { gpsStatus.innerText = "❌ Error al obtener GPS"; }
        );
    };
}

const formPedido = document.getElementById("formPedido");
if (formPedido) {
    formPedido.onsubmit = (e) => {
        e.preventDefault();
        if (carrito.length === 0) return;

        const nombre = nombreInput.value;
        const opcion = zonaEnvio.options[zonaEnvio.selectedIndex];
        const metodo = metodoPago.value;

        if (metodo === "mercadopago" && !pagoRealizado.checked) {
            alert("Debes realizar el pago y marcar la casilla antes de enviar el pedido");
            return;
        }

        let msg = `*Pedido de ${nombre}*%0A%0A`;
        carrito.forEach(i => msg += `- ${i.nombre} x${i.cantidad}%0A`);
        msg += `%0A*Zona:* ${opcion.text}`;
        msg += `%0A*TOTAL FINAL:* $${totalSpan.innerText}`;
        msg += `%0A*Método:* ${metodo === "efectivo" ? "Efectivo" : "Mercado Pago"}`;
        
        if(linkUbicacionGps) msg += `%0A%0A📍 *Ubicación:*%0A${encodeURIComponent(linkUbicacionGps)}`;

        window.open(`https://wa.me/5493764726863?text=${msg}`, "_blank");

        pedidosPendientes.push({ id: Date.now(), nombre, items: [...carrito], total: totalSpan.innerText });
        localStorage.setItem("pedidosPendientes", JSON.stringify(pedidosPendientes));

        carrito = [];
        actualizarTodo();
        renderPanelAdmin();
    };
}

/***********************
  5. PANEL ADMIN
***********************/
function renderPanelAdmin() {
    if(!panelAdmin) return;
    panelAdmin.innerHTML = "<h3>Pedidos Pendientes</h3>";
    pedidosPendientes.forEach(p => {
        const div = document.createElement("div");
        div.innerHTML = `<p>${p.nombre} - $${p.total}</p>
            <button onclick="confirmarPedido(${p.id})">✅</button>
            <button onclick="cancelarPedido(${p.id})">❌</button>`;
        panelAdmin.appendChild(div);
    });
}

function confirmarPedido(id) {
    pedidosPendientes = pedidosPendientes.filter(p => p.id !== id);
    localStorage.setItem("pedidosPendientes", JSON.stringify(pedidosPendientes));
    renderPanelAdmin();
}

function cancelarPedido(id) {
    const pedido = pedidosPendientes.find(p => p.id === id);
    if (pedido) pedido.items.forEach(i => { 
        const pr = productos.find(x => x.id === i.id); 
        if(pr) pr.stock += i.cantidad; 
    });
    confirmarPedido(id);
    actualizarTodo();
}

/***********************
  6. UI (MODO, CARRITO, RELOJ)
***********************/
// ABRIR CARRITO
const btnCarritoIcono = document.querySelector(".carrito-btn");
const panelCarrito = document.querySelector(".carrito-panel");
if (btnCarritoIcono && panelCarrito) {
    btnCarritoIcono.onclick = () => panelCarrito.classList.toggle("oculto");
}

// MODO OSCURO
if (localStorage.getItem("modo") === "oscuro") document.body.classList.add("oscuro");
if(modoBtn) {
    modoBtn.onclick = () => {
        document.body.classList.toggle("oscuro");
        localStorage.setItem("modo", document.body.classList.contains("oscuro") ? "oscuro" : "claro");
    };
}

// RELOJ
setInterval(() => {
    const r = document.getElementById("reloj");
    if(r) r.innerText = `⏰ ${new Date().toLocaleTimeString()}`;
}, 1000);

// PANEL ADMIN OCULTO
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === "KeyA") {
        if (prompt("Clave:") === "181222") panelAdmin.classList.toggle("mostrar");
    }
});

/***********************
  7. PAGO MERCADO PAGO UI
***********************/
if(metodoPago) {
    metodoPago.onchange = () => {
        const esMP = metodoPago.value === "mercadopago";
        btnPagarMP.style.display = esMP ? "block" : "none";
        confirmacionPago.style.display = esMP ? "block" : "none";
    };
}
if(btnPagarMP) btnPagarMP.onclick = () => window.open(linkMercadoPago, "_blank");

/***********************
  8. FONDO EMOJIS
***********************/
function crearFondoEmojis() {
    const contenedor = document.getElementById("fondo-emojis");
    if (!contenedor) return;
    const emojis = ["🍎", "🥗", "🍱", "🍗", "🥑", "🥩", "🍲", "🥘", "🥦", "🍝", "🍕", "🌯"];
    for (let i = 0; i < 80; i++) {
        const span = document.createElement("span");
        span.classList.add("emoji-flotante");
        span.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        span.style.left = `${Math.random() * 100}vw`;
        span.style.top = `${Math.random() * 100}vh`;
        contenedor.appendChild(span);
    }
}
crearFondoEmojis();

/***********************
  9. CONTROL DE HORARIOS
***********************/
function horarioActivo(categoria) {
    const hora = new Date().getHours();
    if (categoria === "vianda") return hora >= 7 && hora < 11;
    if (categoria === "rapida") return hora >= 19 && hora < 22;
    return true;
}

const originalAgregar = agregarAlCarrito;
window.agregarAlCarrito = function(id) {
    const prod = productos.find(p => p.id === id);
    if (prod && !horarioActivo(prod.categoria)) {
        alert("Esta sección está fuera de horario.");
        return;
    }
    originalAgregar(id);
};

function actualizarEstadoSecciones() {
    const viandas = document.getElementById("carrusel-viandas")?.parentElement;
    const rapida = document.getElementById("carrusel-rapida")?.parentElement;
    const hora = new Date().getHours();
    if (viandas) viandas.classList.toggle("seccion-cerrada", !(hora >= 7 && hora < 11));
    if (rapida) rapida.classList.toggle("seccion-cerrada", !(hora >= 19 && hora < 22));
}

// INICIO FINAL
cargarProductos();
actualizarEstadoSecciones();
setInterval(actualizarEstadoSecciones, 60000);



document.addEventListener("DOMContentLoaded", function () {
    const carritoPanel = document.querySelector(".carrito-panel");
    const btnAbrir = document.querySelector(".carrito-btn");
    const btnCerrar = document.getElementById("btnCerrarCarrito");

    // Función para abrir
    btnAbrir.onclick = function() {
        carritoPanel.classList.remove("oculto");
        // Si usas display manual:
        carritoPanel.style.display = "block";
    };

    // Función para cerrar (LA QUE PEDISTE)
    btnCerrar.onclick = function() {
        carritoPanel.classList.add("oculto");
        // Si usas display manual:
        carritoPanel.style.display = "none";
    };
});

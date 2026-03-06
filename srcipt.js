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

const metodoPago = document.getElementById("metodoPago");
const btnPagarMP = document.getElementById("btnPagarMP");
const pagoRealizado = document.getElementById("pagoRealizado");
const confirmacionPago = document.getElementById("confirmacionPago");

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
    const tarjeta = carrusel?.querySelector(".producto");
    if (!tarjeta) return;
    const anchoTotal = tarjeta.offsetWidth + 16; 
    carrusel.style.transform = `translateX(-${indice * anchoTotal}px)`;
}

function setupFlechas() {
    const btnNextViandas = document.getElementById("next-viandas");
    const btnPrevViandas = document.getElementById("prev-viandas");
    const btnNextRapida = document.getElementById("next-rapida");
    const btnPrevRapida = document.getElementById("prev-rapida");

    if (btnNextViandas) {
        btnNextViandas.onclick = () => {
            const cant = productos.filter(p => p.categoria === "vianda").length;
            if (indiceViandas < cant - 1) { indiceViandas++; moverCarrusel("carrusel-viandas", indiceViandas); }
        };
    }
    if (btnPrevViandas) {
        btnPrevViandas.onclick = () => {
            if (indiceViandas > 0) { indiceViandas--; moverCarrusel("carrusel-viandas", indiceViandas); }
        };
    }
    if (btnNextRapida) {
        btnNextRapida.onclick = () => {
            const cant = productos.filter(p => p.categoria === "rapida").length;
            if (indiceRapida < cant - 1) { indiceRapida++; moverCarrusel("carrusel-rapida", indiceRapida); }
        };
    }
    if (btnPrevRapida) {
        btnPrevRapida.onclick = () => {
            if (indiceRapida > 0) { indiceRapida--; moverCarrusel("carrusel-rapida", indiceRapida); }
        };
    }
}

/***********************
  3. CARRITO
***********************/
window.agregarAlCarrito = function(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod || prod.stock <= 0) return;
    if (!horarioActivo(prod.categoria)) { alert("Esta sección está fuera de horario."); return; }

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
    if (!productosDiv) return;
    productosDiv.innerHTML = "";
    let subtotal = 0, cantItems = 0;
    carrito.forEach(i => {
        subtotal += i.precio * i.cantidad;
        cantItems += i.cantidad;
        const p = document.createElement("div");
        p.className = "carrito-item";
        p.style.display = "flex";
        p.style.justifyContent = "space-between";
        p.style.marginBottom = "10px";
        p.innerHTML = `<span>${i.nombre} x${i.cantidad}</span> <button onclick="eliminarDelCarrito(${i.id})">🗑️</button>`;
        productosDiv.appendChild(p);
    });
    
    const precioEnvio = zonaEnvio ? parseInt(zonaEnvio.options[zonaEnvio.selectedIndex]?.dataset.precio || 0) : 0;
    if (totalSpan) totalSpan.innerText = subtotal + precioEnvio;
    if (contador) {
        contador.innerText = cantItems;
        contador.style.display = cantItems > 0 ? "block" : "none";
    }
}

if (zonaEnvio) zonaEnvio.onchange = actualizarCarritoUI;

/***********************
  4. FUNCIONALIDADES EXTRAS
***********************/
function horarioActivo(categoria) {
    const hora = new Date().getHours();
    if (categoria === "vianda") return hora >= 7 && hora < 23; 
    if (categoria === "rapida") return hora >= 19 && hora < 24;
    return true;
}

if (btnGps) {
    btnGps.onclick = () => {
        gpsStatus.innerText = "Localizando...";
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                // CORREGIDO: Error de template string {pos.coords...} a ${pos.coords...}
                linkUbicacionGps = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
                gpsStatus.innerHTML = "<b style='color:green'>✅ Lista</b>";
            },
            () => { gpsStatus.innerText = "❌ Error GPS"; }
        );
    };
}

if (metodoPago) {
    metodoPago.onchange = () => {
        const esMP = metodoPago.value === "mercadopago";
        if (btnPagarMP) btnPagarMP.style.display = esMP ? "block" : "none";
        if (confirmacionPago) confirmacionPago.style.display = esMP ? "block" : "none";
    };
}

if (btnPagarMP) btnPagarMP.onclick = () => window.open(linkMercadoPago, "_blank");

const formPedido = document.getElementById("formPedido");
if (formPedido) {
    formPedido.onsubmit = (e) => {
        e.preventDefault();
        if (carrito.length === 0) return;
        if (metodoPago.value === "mercadopago" && !pagoRealizado.checked) {
            alert("Por favor, confirma que realizaste el pago."); return;
        }

        let mensaje = `*Nuevo Pedido - MIL SABORES*%0A%0A*Nombre:* ${nombreInput.value}%0A`;
        carrito.forEach(i => mensaje += `- ${i.nombre} x${i.cantidad}%0A`);
        mensaje += `%0A*Zona:* ${zonaEnvio.options[zonaEnvio.selectedIndex].text}`;
        mensaje += `%0A*Total:* $${totalSpan.innerText}`;
        if(linkUbicacionGps) mensaje += `%0A📍 *Ubicación:* ${linkUbicacionGps}`;

        window.open(`https://wa.me/5493764726863?text=${mensaje}`, "_blank");
        
        // Limpiar carrito tras pedido
        carrito = []; 
        actualizarTodo();
        document.querySelector(".carrito-panel").classList.add("oculto");
    };
}

/***********************
  5. UI
***********************/
const btnAbrirCarrito = document.querySelector(".carrito-btn");
const btnCerrarCarrito = document.getElementById("btnCerrarCarrito");
const panelCarrito = document.querySelector(".carrito-panel");

if (btnAbrirCarrito) btnAbrirCarrito.onclick = () => panelCarrito.classList.remove("oculto");
if (btnCerrarCarrito) btnCerrarCarrito.onclick = () => panelCarrito.classList.add("oculto");

setInterval(() => {
    const r = document.getElementById("reloj");
    if(r) r.innerText = `⏰ ${new Date().toLocaleTimeString()}`;
}, 1000);

if (localStorage.getItem("modo") === "oscuro") document.body.classList.add("oscuro");

if (modoBtn) {
    modoBtn.onclick = () => {
        document.body.classList.toggle("oscuro");
        localStorage.setItem("modo", document.body.classList.contains("oscuro") ? "oscuro" : "claro");
    };
}

function crearFondoEmojis() {
    const cont = document.getElementById("fondo-emojis");
    if (!cont) return;
    const emojis = ["🍎", "🥗", "🍱", "🍗", "🥑"];
    for (let i = 0; i < 20; i++) {
        const span = document.createElement("span");
        span.className = "emoji-flotante";
        span.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        span.style.left = Math.random() * 100 + "vw";
        span.style.top = Math.random() * 100 + "vh";
        cont.appendChild(span);
    }
}

// INICIO
cargarProductos();
crearFondoEmojis();

function aplicarBloqueoHorario() {
    const ahora = new Date();
    const hora = ahora.getHours();
    const diaSemana = ahora.getDay(); // 0: Dom, 1: Lun, 2: Mar, 3: Mié, 4: Jue, 5: Vie, 6: Sáb

    // CONFIGURACIÓN DINÁMICA
    const configuracion = [
        {
            id: "carrusel-viandas",
            // Lunes (1) a Viernes (5) + Horario 7 a 23
            abierto: (diaSemana >= 1 && diaSemana <= 5) && (hora >= 7 && hora < 13),
            mensaje: "CERRADO POR HORARIO",
            horarioTexto: "Lun. a Vie. de 07:00 a 13:00 hs",
            vuelve: (diaSemana >= 1 && diaSemana < 5) ? "mañana a las 07:00 hs" : "el Lunes a las 07:00 hs"
        },
        {
            id: "carrusel-rapida",
            // Miércoles (3) a Domingo (0) + Horario 19 a 00
            // Nota: (diaSemana >= 3 || diaSemana === 0) cubre Mié, Jue, Vie, Sáb, Dom
            abierto: (diaSemana >= 3 || diaSemana === 0) && (hora >= 19 && hora < 24),
            mensaje: "CERRADO POR HORARIO",
            horarioTexto: "Mié. a Dom. de 19:00 a 00:00 hs",
            vuelve: (diaSemana === 0 || diaSemana < 3) ? "el Miércoles a las 19:00 hs" : "mañana a las 19:00 hs"
        }
    ];

    configuracion.forEach(seccion => {
        const carrusel = document.getElementById(seccion.id);
        if (!carrusel) return;

        const contenedor = carrusel.parentElement;

        // Limpieza de estados previos
        contenedor.classList.remove("contenedor-bloqueado");
        const cartelPrevio = contenedor.querySelector(".cartel-horario");
        if (cartelPrevio) cartelPrevio.remove();

        if (!seccion.abierto) {
            contenedor.classList.add("contenedor-bloqueado");

            const cartel = document.createElement("div");
            cartel.className = "cartel-horario";
            cartel.innerHTML = `
                <h4>${seccion.mensaje}</h4>
                <p>Atendemos: <br><b>${seccion.horarioTexto}</b></p>
                <p style="margin-top:10px; font-size: 0.8rem; color: #ffcc00;">Vuelve ${seccion.vuelve}</p>
            `;
            contenedor.appendChild(cartel);
        }
    });
}

// Ejecutar
aplicarBloqueoHorario();
setInterval(aplicarBloqueoHorario, 60000);


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
const ubicacionInput = document.getElementById("ubicacion");

const panelAdmin = document.getElementById("panel-admin");
const modoBtn = document.getElementById("modoOscuroBtn");
const fondoColorInput = document.getElementById("fondoColor");

// Pago
const metodoPago = document.getElementById("metodoPago");
const btnPagarMP = document.getElementById("btnPagarMP");
const pagoRealizado = document.getElementById("pagoRealizado");
const confirmacionPago = document.getElementById("confirmacionPago");

// 🔗 TU LINK DE MERCADO PAGO
const linkMercadoPago = "http://link.mercadopago.com.ar/milsaboresviandas";

// GPS (Movido aquí para evitar duplicados abajo)
const btnGps = document.getElementById("btn-cargar-gps");
const gpsStatus = document.getElementById("gps-status");

// Configuración inicial de inputs
if (zonaEnvio) zonaEnvio.disabled = false;
if (ubicacionInput) ubicacionInput.disabled = false;

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
  3. CARRITO
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
    actualizarCarrito();
}

function actualizarCarrito() {
    if(!productosDiv) return;
    productosDiv.innerHTML = "";
    let subtotal = 0, cant = 0;

    carrito.forEach(i => {
        subtotal += Number(i.precio) * Number(i.cantidad);
        cant += i.cantidad;
        const p = document.createElement("p");
        p.innerHTML = `<span>${i.nombre} x${i.cantidad}</span> <button onclick="eliminarDelCarrito(${i.id})">🗑️</button>`;
        productosDiv.appendChild(p);
    });

    let precioEnvio = 0;
    const opcion = zonaEnvio.options[zonaEnvio.selectedIndex];
    if (opcion && opcion.dataset.precio) {
        precioEnvio = parseInt(opcion.dataset.precio);
    }

    const totalFinal = subtotal + precioEnvio;

    if(totalSpan) totalSpan.innerText = totalFinal;
    if(contador) {
        contador.innerText = cant;
        contador.style.display = cant > 0 ? "block" : "none";
    }
}

zonaEnvio.addEventListener("change", actualizarCarrito);

/***********************
  4. WHATSAPP + VALIDACIÓN
***********************/
const formPedido = document.getElementById("formPedido");
if (formPedido) {
    formPedido.onsubmit = (e) => {
        e.preventDefault();
        if (carrito.length === 0) return;

        const nombre = document.getElementById("nombre").value;
        const ubicacion = ubicacionInput.value;
        const opcionSeleccionada = zonaEnvio.options[zonaEnvio.selectedIndex];
        const zonaTexto = opcionSeleccionada.text;
        const precioEnvio = parseInt(opcionSeleccionada.dataset.precio) || 0;
        const metodo = metodoPago.value;

        if (!metodo) {
            alert("Por favor seleccioná un método de pago");
            return;
        }

        if (metodo === "mercadopago" && !pagoRealizado.checked) {
            alert("Debes realizar el pago y marcar la casilla antes de enviar el pedido");
            return;
        }

        let subtotalPedido = 0;
        carrito.forEach(i => subtotalPedido += i.precio * i.cantidad);
        const totalFinal = subtotalPedido + precioEnvio;

        let mensaje = `*Pedido de ${nombre}*%0A`;
        carrito.forEach(i => {
            mensaje += `- ${i.nombre} x${i.cantidad}%0A`;
        });

        mensaje += `%0A*Zona:* ${zonaTexto}`;
        mensaje += `%0A*Envío:* $${precioEnvio}`;
        mensaje += `%0A*TOTAL FINAL:* $${totalFinal}`;

        if (metodo === "efectivo") mensaje += `%0A%0A *Método de pago:* Efectivo`;
        if (metodo === "mercadopago") {
            mensaje += `%0A%0A *Método de pago:* Mercado Pago`;
            mensaje += `%0A *Estado:* Pago informado por el cliente`;
        }

        if (ubicacion) {
            mensaje += `%0A%0A *Ubicación:* %0A${encodeURIComponent(ubicacion)}`;
        }

        window.open(`https://wa.me/5493764726863?text=${mensaje}`, "_blank");

        pedidosPendientes.push({ 
            id: Date.now(), 
            nombre, 
            items: [...carrito], 
            total: totalFinal,
            metodoPago: metodo
        });

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
  6. UI + MODO OSCURO
***********************/
if (localStorage.getItem("modo") === "oscuro") document.body.classList.add("oscuro");
/***********************
  6. UI + MODO OSCURO + ABRIR CARRITO
***********************/
// Función para abrir/cerrar el carrito
const btnCarritoPanel = document.querySelector(".carrito-btn");
const panelCarrito = document.querySelector(".carrito-panel");

if (btnCarritoPanel && panelCarrito) {
    btnCarritoPanel.onclick = (e) => {
        e.preventDefault(); // Evita cualquier comportamiento extraño
        panelCarrito.classList.toggle("oculto");
        console.log("Carrito clickeado"); // Esto te avisará en la consola si funciona
    };
} else {
    console.error("No se encontró el botón .carrito-btn o el panel .carrito-panel");
}

// Modo Oscuro
if (localStorage.getItem("modo") === "oscuro") document.body.classList.add("oscuro");

if(modoBtn) {
    modoBtn.onclick = () => {
        document.body.classList.toggle("oscuro");
        localStorage.setItem("modo", document.body.classList.contains("oscuro") ? "oscuro" : "claro");
        if(modoBtn.tagName === "BUTTON") {
            modoBtn.textContent = document.body.classList.contains("oscuro") ? "☀️" : "🌙";
        }
    };
}
/***********************
  7. PAGO MERCADO PAGO UI
***********************/
if(metodoPago) {
    metodoPago.addEventListener("change", () => {
        if (metodoPago.value === "mercadopago") {
            btnPagarMP.style.display = "block";
            confirmacionPago.style.display = "block";
        } else {
            btnPagarMP.style.display = "none";
            confirmacionPago.style.display = "none";
            pagoRealizado.checked = false;
        }
    });
}

if(btnPagarMP) {
    btnPagarMP.onclick = () => {
        window.open(linkMercadoPago, "_blank");
    };
}

/***********************
  9. FONDO EMOJIS
***********************/
function crearFondoEmojis() {
    const contenedor = document.getElementById("fondo-emojis");
    if (!contenedor) return;

    contenedor.innerHTML = "";
    const emojis = ["🍎", "🥗", "🍱", "🍗", "🥑", "🥩", "🍲", "🥘", "🥦", "🍝", "🍕", "🌯"];

    for (let i = 0; i < 80; i++) {
        const span = document.createElement("span");
        span.classList.add("emoji-flotante");
        span.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        span.style.left = `${Math.random() * 100}vw`;
        span.style.top = `${Math.random() * 100}vh`;
        span.style.transform = `rotate(${Math.random() * 360}deg)`;
        contenedor.appendChild(span);
    }
}
crearFondoEmojis();

/***********************
  10. GEOLOCALIZACIÓN
***********************/
if (btnGps) {
    btnGps.addEventListener("click", () => {
        if (!navigator.geolocation) {
            gpsStatus.innerText = "GPS no disponible.";
            return;
        }

        gpsStatus.innerText = "Localizando... ⏳";
        btnGps.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (posicion) => {
                const lat = posicion.coords.latitude;
                const lon = posicion.coords.longitude;
                
                // CORRECCIÓN: Usar ${variable} para los links
                const mapaLink = `https://www.google.com/maps?q=${lat},${lon}`;
                
                if (ubicacionInput) {
                    ubicacionInput.value = mapaLink;
                    gpsStatus.innerHTML = "<span style='color: green; font-weight:bold;'>✅ Ubicación cargada!</span>";
                }
                btnGps.disabled = false;
            },
            (error) => {
                console.error("Error GPS:", error);
                gpsStatus.innerHTML = "<span style='color: red;'>❌ Activa el GPS.</span>";
                btnGps.disabled = false;
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });
}

/***********************
  HORARIOS Y CIERRE
***********************/
function horarioActivo(categoria) {
    const hora = new Date().getHours();
    if (categoria === "vianda") return hora >= 7 && hora < 11;
    if (categoria === "rapida") return hora >= 19 && hora < 22;
    return true;
}

// Inyectar lógica de horarios en la función global
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

// Ejecución inicial
cargarProductos();
actualizarEstadoSecciones();
setInterval(actualizarEstadoSecciones, 60000);

setInterval(() => {
    const r = document.getElementById("reloj");
    if(r) r.innerText = `⏰ ${new Date().toLocaleTimeString()}`;
}, 1000);

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === "KeyA") {
        if (prompt("Clave:") === "181222") panelAdmin.classList.toggle("mostrar");
    }
});






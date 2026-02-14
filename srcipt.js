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

const metodoPago = document.getElementById("metodoPago");
const btnPagarMP = document.getElementById("btnPagarMP");
const pagoRealizado = document.getElementById("pagoRealizado");
const confirmacionPago = document.getElementById("confirmacionPago");

const linkMercadoPago = "http://link.mercadopago.com.ar/milsaboresviandas";

/***********************
  1. CARGA DE PRODUCTOS
***********************/
async function cargarProductos() {
    try {
        const res = await fetch("productos.json");
        const data = await res.json();

        const stockLocal = JSON.parse(localStorage.getItem("stockProductos")) || [];

        productos = data.map(p => {
            const guardado = stockLocal.find(s => s.id === p.id);
            return { ...p, stock: guardado ? guardado.stock : p.stock };
        });

        actualizarTodo();
        renderPanelAdmin();
        setupFlechas();
    } catch (e) {
        console.error("Error cargando productos:", e);
    }
}

/***********************
  2. RENDER
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
            <p>Stock: ${prod.stock}</p>
            <button onclick="agregarAlCarrito(${prod.id})" ${prod.stock <= 0 ? "disabled" : ""}>
                ${prod.stock <= 0 ? "Sin stock" : "Agregar"}
            </button>
        `;

        contenedor.appendChild(div);
    });
}

function moverCarrusel(id, indice) {
    const carrusel = document.getElementById(id);
    const tarjeta = carrusel.querySelector(".producto");
    if (!tarjeta) return;

    const ancho = tarjeta.offsetWidth + 20;
    carrusel.style.transform = `translateX(-${indice * ancho}px)`;
}

function setupFlechas() {
    document.getElementById("next-viandas").onclick = () => {
        const total = productos.filter(p => p.categoria === "vianda").length;
        if (indiceViandas < total - 1) {
            indiceViandas++;
            moverCarrusel("carrusel-viandas", indiceViandas);
        }
    };

    document.getElementById("prev-viandas").onclick = () => {
        if (indiceViandas > 0) {
            indiceViandas--;
            moverCarrusel("carrusel-viandas", indiceViandas);
        }
    };

    document.getElementById("next-rapida").onclick = () => {
        const total = productos.filter(p => p.categoria === "rapida").length;
        if (indiceRapida < total - 1) {
            indiceRapida++;
            moverCarrusel("carrusel-rapida", indiceRapida);
        }
    };

    document.getElementById("prev-rapida").onclick = () => {
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
    productosDiv.innerHTML = "";

    let total = 0;
    let cantidad = 0;

    carrito.forEach(i => {
        total += i.precio * i.cantidad;
        cantidad += i.cantidad;

        const p = document.createElement("p");
        p.innerHTML = `
            ${i.nombre} x${i.cantidad}
            <button onclick="eliminarDelCarrito(${i.id})">🗑️</button>
        `;
        productosDiv.appendChild(p);
    });

    let precioEnvio = 0;
    const opcion = zonaEnvio.options[zonaEnvio.selectedIndex];
    if (opcion) precioEnvio = parseInt(opcion.dataset.precio) || 0;

    total += precioEnvio;

    totalSpan.innerText = total;
    contador.innerText = cantidad;
    contador.style.display = cantidad > 0 ? "block" : "none";
}

zonaEnvio.addEventListener("change", actualizarCarrito);

/***********************
  4. ENVÍO WHATSAPP
***********************/
document.getElementById("formPedido").onsubmit = (e) => {
    e.preventDefault();
    if (carrito.length === 0) return;

    const nombre = document.getElementById("nombre").value;
    const ubicacion = ubicacionInput.value;
    const metodo = metodoPago.value;

    if (!metodo) {
        alert("Seleccioná método de pago");
        return;
    }

    if (metodo === "mercadopago" && !pagoRealizado.checked) {
        alert("Confirmá el pago antes de enviar");
        return;
    }

    let total = 0;
    carrito.forEach(i => total += i.precio * i.cantidad);

    let mensaje = `*Pedido de ${nombre}*%0A`;
    carrito.forEach(i => {
        mensaje += `- ${i.nombre} x${i.cantidad}%0A`;
    });

    mensaje += `%0A*Total:* $${total}`;

    if (ubicacion) {
        mensaje += `%0A📍 ${encodeURIComponent(ubicacion)}`;
    }

    window.open(`https://wa.me/5493764726863?text=${mensaje}`, "_blank");

    pedidosPendientes.push({
        id: Date.now(),
        nombre,
        items: [...carrito],
        total,
        metodoPago: metodo
    });

    localStorage.setItem("pedidosPendientes", JSON.stringify(pedidosPendientes));

    carrito = [];
    actualizarTodo();
    renderPanelAdmin();
};

/***********************
  5. PANEL ADMIN
***********************/
function renderPanelAdmin() {
    panelAdmin.innerHTML = "<h3>Pedidos Pendientes</h3>";

    pedidosPendientes.forEach(p => {
        const div = document.createElement("div");
        div.innerHTML = `
            <p>${p.nombre} - $${p.total}</p>
            <button onclick="confirmarPedido(${p.id})">✅</button>
            <button onclick="cancelarPedido(${p.id})">❌</button>
        `;
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

    if (pedido) {
        pedido.items.forEach(i => {
            const prod = productos.find(p => p.id === i.id);
            if (prod) prod.stock += i.cantidad;
        });
    }

    confirmarPedido(id);
    actualizarTodo();
}

/***********************
  6. UI
***********************/
if (localStorage.getItem("modo") === "oscuro")
    document.body.classList.add("oscuro");

modoBtn.onclick = () => {
    document.body.classList.toggle("oscuro");
    localStorage.setItem("modo",
        document.body.classList.contains("oscuro") ? "oscuro" : "claro"
    );
};

fondoColorInput.oninput = (e) => {
    document.body.style.backgroundColor = e.target.value;
    localStorage.setItem("colorFondo", e.target.value);
};

document.querySelector(".carrito-btn").onclick = () => {
    document.querySelector(".carrito-panel").classList.toggle("oculto");
};

setInterval(() => {
    const reloj = document.getElementById("reloj");
    if (reloj) reloj.innerText = new Date().toLocaleTimeString();
}, 1000);

/***********************
  7. PAGO UI
***********************/
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

btnPagarMP.onclick = () => {
    window.open(linkMercadoPago, "_blank");
};

/***********************
  8. FONDO EMOJIS
***********************/
function crearFondoEmojis() {
    const contenedor = document.getElementById("fondo-emojis");
    if (!contenedor) return;

    const emojis = ["🍎","🥗","🍱","🍗","🥑","🥩","🍲","🥘","🥦","🍝","🍕","🌯"];

    for (let i = 0; i < 60; i++) {
        const span = document.createElement("span");
        span.classList.add("emoji-flotante");
        span.innerText = emojis[Math.floor(Math.random()*emojis.length)];
        span.style.left = Math.random()*100 + "vw";
        span.style.top = Math.random()*100 + "vh";
        contenedor.appendChild(span);
    }
}

/***********************
  9. INICIO
***********************/
cargarProductos();
crearFondoEmojis();

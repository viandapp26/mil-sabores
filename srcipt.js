document.addEventListener("DOMContentLoaded", () => {

let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let stockGuardado = JSON.parse(localStorage.getItem("stockProductos"));

/* ELEMENTOS */
const totalSpan = document.getElementById("total-precio");
const contador = document.querySelector(".carrito-contador");
const productosDiv = document.querySelector(".carrito-productos");
const zonaEnvio = document.getElementById("zonaEnvio");
const ubicacionInput = document.getElementById("ubicacion");
const metodoPago = document.getElementById("metodoPago");
const btnPagarMP = document.getElementById("btnPagarMP");
const pagoRealizado = document.getElementById("pagoRealizado");
const confirmacionPago = document.getElementById("confirmacionPago");
const carritoBtn = document.querySelector(".carrito-btn");
const carritoPanel = document.querySelector(".carrito-panel");
const modoOscuroBtn = document.getElementById("modoOscuroBtn");
const fondoColor = document.getElementById("fondoColor");
const reloj = document.getElementById("reloj");

const linkMercadoPago = "http://link.mercadopago.com.ar/milsaboresviandas";

/* ========================= */
/* MODO OSCURO */
/* ========================= */
modoOscuroBtn.addEventListener("click", () => {
    document.body.classList.toggle("modo-oscuro");
    localStorage.setItem("modoOscuro",
        document.body.classList.contains("modo-oscuro"));
});

if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
}

/* ========================= */
/* CAMBIO COLOR FONDO */
/* ========================= */
fondoColor.addEventListener("input", (e) => {
    document.body.style.backgroundColor = e.target.value;
    localStorage.setItem("colorFondo", e.target.value);
});

const colorGuardado = localStorage.getItem("colorFondo");
if (colorGuardado) {
    document.body.style.backgroundColor = colorGuardado;
    fondoColor.value = colorGuardado;
}

/* ========================= */
/* RELOJ */
/* ========================= */
setInterval(() => {
    const ahora = new Date();
    reloj.textContent =
        ahora.toLocaleTimeString("es-AR");
}, 1000);

/* ========================= */
/* ABRIR CARRITO */
/* ========================= */
carritoBtn.addEventListener("click", () => {
    carritoPanel.classList.toggle("oculto");
});

/* ========================= */
/* CARGAR PRODUCTOS */
/* ========================= */
async function cargarProductos() {
    const res = await fetch("productos.json");
    const data = await res.json();

    if (stockGuardado) {
        productos = stockGuardado;
    } else {
        productos = data;
        localStorage.setItem("stockProductos", JSON.stringify(productos));
    }

    actualizarTodo();
}

/* ========================= */
/* RENDER */
/* ========================= */
function renderSeccion(categoria, id) {
    const cont = document.getElementById(id);
    cont.innerHTML = "";

    productos
        .filter(p => p.categoria === categoria)
        .forEach(prod => {
            const div = document.createElement("div");
            div.classList.add("producto");

            div.innerHTML = `
                <h3>${prod.nombre}</h3>
                <p>$${prod.precio}</p>
                <p>Stock: ${prod.stock}</p>
                <button ${prod.stock <= 0 ? "disabled" : ""}>
                    Agregar
                </button>
            `;

            div.querySelector("button")
                .addEventListener("click", () => agregarAlCarrito(prod.id));

            cont.appendChild(div);
        });
}

/* ========================= */
/* AGREGAR */
/* ========================= */
function agregarAlCarrito(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod || prod.stock <= 0) return;

    prod.stock--;
    localStorage.setItem("stockProductos", JSON.stringify(productos));

    const item = carrito.find(c => c.id === id);
    if (item) item.cantidad++;
    else carrito.push({ ...prod, cantidad: 1 });

    actualizarTodo();
}

/* ========================= */
/* QUITAR PRODUCTO */
/* ========================= */
function quitarDelCarrito(id) {
    const item = carrito.find(p => p.id === id);
    if (!item) return;

    item.cantidad--;

    const prod = productos.find(p => p.id === id);
    prod.stock++;

    if (item.cantidad <= 0) {
        carrito = carrito.filter(p => p.id !== id);
    }

    localStorage.setItem("stockProductos", JSON.stringify(productos));
    actualizarTodo();
}

/* ========================= */
/* ACTUALIZAR CARRITO */
/* ========================= */
function actualizarCarrito() {
    productosDiv.innerHTML = "";
    let total = 0;
    let cantidad = 0;

    carrito.forEach(i => {
        total += i.precio * i.cantidad;
        cantidad += i.cantidad;

        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "center";
        div.style.marginBottom = "8px";

        div.innerHTML = `
            <span>${i.nombre} x${i.cantidad}</span>
            <button style="background:red;color:white;border:none;padding:4px 8px;border-radius:6px;">X</button>
        `;

        div.querySelector("button")
            .addEventListener("click", () => quitarDelCarrito(i.id));

        productosDiv.appendChild(div);
    });

    const opcion = zonaEnvio.options[zonaEnvio.selectedIndex];
    const envio = parseInt(opcion?.dataset.precio) || 0;

    total += envio;

    totalSpan.textContent = total;
    contador.textContent = cantidad;
    contador.style.display = cantidad > 0 ? "inline-block" : "none";
}

function actualizarTodo() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
    renderSeccion("vianda", "carrusel-viandas");
    renderSeccion("rapida", "carrusel-rapida");
    actualizarCarrito();
}

/* ========================= */
/* INICIAR */
/* ========================= */
cargarProductos();
actualizarTodo();

});







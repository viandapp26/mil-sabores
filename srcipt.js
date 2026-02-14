document.addEventListener("DOMContentLoaded", function () {

/* ========================= */
/* VARIABLES GLOBALES */
/* ========================= */

let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let stockGuardado = JSON.parse(localStorage.getItem("stockProductos"));

const linkMercadoPago = "http://link.mercadopago.com.ar/milsaboresviandas";

/* ========================= */
/* ELEMENTOS */
/* ========================= */

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


/* ========================= */
/* ABRIR / CERRAR CARRITO */
/* ========================= */

if (carritoBtn && carritoPanel) {
    carritoBtn.addEventListener("click", () => {
        carritoPanel.classList.toggle("oculto");
    });
}


/* ========================= */
/* MODO OSCURO */
/* ========================= */

if (modoOscuroBtn) {
    modoOscuroBtn.addEventListener("click", () => {
        document.body.classList.toggle("modo-oscuro");

        localStorage.setItem(
            "modoOscuro",
            document.body.classList.contains("modo-oscuro")
        );
    });
}

if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("modo-oscuro");
}


/* ========================= */
/* CAMBIO COLOR FONDO */
/* ========================= */

if (fondoColor) {
    fondoColor.addEventListener("input", (e) => {
        document.body.style.backgroundColor = e.target.value;
        localStorage.setItem("colorFondo", e.target.value);
    });

    const colorGuardado = localStorage.getItem("colorFondo");
    if (colorGuardado) {
        document.body.style.backgroundColor = colorGuardado;
        fondoColor.value = colorGuardado;
    }
}


/* ========================= */
/* RELOJ */
/* ========================= */

function iniciarReloj() {
    if (!reloj) return;

    setInterval(() => {
        const ahora = new Date();
        const horas = String(ahora.getHours()).padStart(2, "0");
        const minutos = String(ahora.getMinutes()).padStart(2, "0");
        const segundos = String(ahora.getSeconds()).padStart(2, "0");

        reloj.textContent = `${horas}:${minutos}:${segundos}`;
    }, 1000);
}


/* ========================= */
/* CARRUSEL */
/* ========================= */

const carruselTrack = document.querySelector(".carrusel-track");
const slides = document.querySelectorAll(".slide");

if (carruselTrack && slides.length > 0) {
    let index = 0;

    function moverCarrusel() {
        index++;
        if (index >= slides.length) {
            index = 0;
        }

        carruselTrack.style.transform =
            `translateX(-${index * 100}%)`;
    }

    setInterval(moverCarrusel, 3000);
}


/* ========================= */
/* CARGAR PRODUCTOS */
/* ========================= */

async function cargarProductos() {
    try {
        const res = await fetch("productos.json");
        const data = await res.json();

        if (stockGuardado) {
            productos = stockGuardado;
        } else {
            productos = data;
            localStorage.setItem("stockProductos", JSON.stringify(productos));
        }

        actualizarTodo();
    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}


/* ========================= */
/* RENDER SECCIÓN */
/* ========================= */

function renderSeccion(categoria, id) {
    const cont = document.getElementById(id);
    if (!cont) return;

    cont.innerHTML = "";

    productos
        .filter(p => p.categoria === categoria)
        .forEach(prod => {

            const div = document.createElement("div");
            div.classList.add("producto");

            div.innerHTML = `
                <img src="${prod.imagen}" alt="${prod.nombre}">
                <h3>${prod.nombre}</h3>
                <p>$${prod.precio}</p>
                <p>Stock: ${prod.stock}</p>
                <button ${prod.stock <= 0 ? "disabled" : ""}>
                    ${prod.stock <= 0 ? "Sin stock" : "Agregar"}
                </button>
            `;

            div.querySelector("button")
                .addEventListener("click", () => agregarAlCarrito(prod.id));

            cont.appendChild(div);
        });
}


/* ========================= */
/* AGREGAR AL CARRITO */
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
/* ACTUALIZAR TODO */
/* ========================= */

function actualizarTodo() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
    renderSeccion("vianda", "carrusel-viandas");
    renderSeccion("rapida", "carrusel-rapida");
    actualizarCarrito();
}


/* ========================= */
/* ACTUALIZAR CARRITO */
/* ========================= */

function actualizarCarrito() {

    if (!productosDiv) return;

    productosDiv.innerHTML = "";

    let total = 0;
    let cantidad = 0;

    carrito.forEach(i => {

        total += i.precio * i.cantidad;
        cantidad += i.cantidad;

        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.padding = "5px 0";

        div.innerHTML = `
            <span>${i.nombre}</span>
            <span>x${i.cantidad}</span>
        `;

        productosDiv.appendChild(div);
    });

    const opcion = zonaEnvio?.options[zonaEnvio.selectedIndex];
    const envio = parseInt(opcion?.dataset.precio) || 0;

    total += envio;

    if (totalSpan) totalSpan.innerText = total;
    if (contador) {
        contador.innerText = cantidad;
        contador.style.display = cantidad > 0 ? "inline-block" : "none";
    }
}


/* ========================= */
/* ZONA ENVÍO */
/* ========================= */

if (zonaEnvio) {
    zonaEnvio.addEventListener("change", actualizarCarrito);
}


/* ========================= */
/* FORMULARIO */
/* ========================= */

const formPedido = document.getElementById("formPedido");

if (formPedido) {

    formPedido.addEventListener("submit", (e) => {

        e.preventDefault();
        if (carrito.length === 0) return;

        const nombre = document.getElementById("nombre").value;
        const ubicacion = ubicacionInput?.value;
        const metodo = metodoPago?.value;

        if (metodo === "mercadopago" && !pagoRealizado.checked) {
            alert("Confirmá el pago antes de continuar");
            return;
        }

        let total = 0;
        let mensaje = `*Pedido de ${nombre}*%0A`;

        carrito.forEach(i => {
            total += i.precio * i.cantidad;
            mensaje += `- ${i.nombre} x${i.cantidad}%0A`;
        });

        const opcion = zonaEnvio?.options[zonaEnvio.selectedIndex];
        const envio = parseInt(opcion?.dataset.precio) || 0;

        total += envio;
        mensaje += `%0A*Total:* $${total}`;

        if (ubicacion) {
            mensaje += `%0A📍 ${encodeURIComponent(ubicacion)}`;
        }

        window.open(
            `https://wa.me/5493764726863?text=${mensaje}`,
            "_blank"
        );

        carrito = [];
        localStorage.setItem("carrito", JSON.stringify(carrito));
        carritoPanel?.classList.add("oculto");

        actualizarTodo();
    });
}


/* ========================= */
/* MERCADO PAGO */
/* ========================= */

if (metodoPago) {

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

if (btnPagarMP) {
    btnPagarMP.addEventListener("click", () => {
        window.open(linkMercadoPago, "_blank");
    });
}


/* ========================= */
/* EMOJIS */
/* ========================= */

function crearFondoEmojis() {
    const cont = document.getElementById("fondo-emojis");
    if (!cont) return;

    const emojis = ["🍎", "🥗", "🍱", "🍗", "🥑"];

    for (let i = 0; i < 40; i++) {
        const s = document.createElement("span");
        s.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        s.style.position = "absolute";
        s.style.left = Math.random() * 100 + "vw";
        s.style.top = Math.random() * 100 + "vh";
        cont.appendChild(s);
    }
}


/* ========================= */
/* INICIAR TODO */
/* ========================= */

cargarProductos();
crearFondoEmojis();
iniciarReloj();
actualizarTodo();

});











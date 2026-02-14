let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let pedidosPendientes = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];

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

const linkMercadoPago = "http://link.mercadopago.com.ar/milsaboresviandas";

/* ABRIR / CERRAR CARRITO */
carritoBtn.addEventListener("click", () => {
    carritoPanel.classList.toggle("oculto");
});

/* CARGAR PRODUCTOS */
async function cargarProductos() {
    try {
        const res = await fetch("productos.json");
        productos = await res.json();
        actualizarTodo();
    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

/* RENDER PRODUCTOS */
function renderSeccion(categoria, id) {
    const cont = document.getElementById(id);
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

            const boton = div.querySelector("button");
            boton.addEventListener("click", () => agregarAlCarrito(prod.id));

            cont.appendChild(div);
        });
}

/* AGREGAR AL CARRITO */
function agregarAlCarrito(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod || prod.stock <= 0) return;

    prod.stock--;

    const item = carrito.find(c => c.id === id);
    if (item) item.cantidad++;
    else carrito.push({ ...prod, cantidad: 1 });

    actualizarTodo();
}

/* ACTUALIZAR TODO */
function actualizarTodo() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
    renderSeccion("vianda", "carrusel-viandas");
    renderSeccion("rapida", "carrusel-rapida");
    actualizarCarrito();
}

/* ACTUALIZAR CARRITO */
function actualizarCarrito() {
    productosDiv.innerHTML = "";
    let total = 0;
    let cantidad = 0;

    carrito.forEach(i => {
        total += i.precio * i.cantidad;
        cantidad += i.cantidad;

        const p = document.createElement("p");
        p.innerHTML = `${i.nombre} x${i.cantidad}`;
        productosDiv.appendChild(p);
    });

    /* HABILITAR ENVÍO SOLO SI HAY PRODUCTOS */
    zonaEnvio.disabled = carrito.length === 0;
    ubicacionInput.disabled = carrito.length === 0;

    let envio = 0;
    if (zonaEnvio && !zonaEnvio.disabled) {
        const opcion = zonaEnvio.options[zonaEnvio.selectedIndex];
        envio = parseInt(opcion?.dataset.precio) || 0;
    }

    total += envio;

    totalSpan.innerText = total;
    contador.innerText = cantidad;
    contador.style.display = cantidad > 0 ? "inline-block" : "none";
}

/* CAMBIO ZONA */
if (zonaEnvio) {
    zonaEnvio.addEventListener("change", actualizarCarrito);
}

/* FORMULARIO */
document.getElementById("formPedido").addEventListener("submit", (e) => {
    e.preventDefault();
    if (carrito.length === 0) return;

    const nombre = document.getElementById("nombre").value;
    const ubicacion = ubicacionInput.value;
    const metodo = metodoPago.value;

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

    const opcion = zonaEnvio.options[zonaEnvio.selectedIndex];
    const envio = parseInt(opcion?.dataset.precio) || 0;
    total += envio;

    mensaje += `%0A*Total:* $${total}`;

    if (ubicacion) {
        mensaje += `%0A📍 ${encodeURIComponent(ubicacion)}`;
    }

    window.open(`https://wa.me/5493764726863?text=${mensaje}`, "_blank");

    carrito = [];
    actualizarTodo();
});

/* MERCADO PAGO UI */
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

btnPagarMP.addEventListener("click", () => {
    window.open(linkMercadoPago, "_blank");
});

/* EMOJIS */
function crearFondoEmojis() {
    const cont = document.getElementById("fondo-emojis");
    const emojis = ["🍎", "🥗", "🍱", "🍗", "🥑"];

    for (let i = 0; i < 40; i++) {
        const s = document.createElement("span");
        s.classList.add("emoji-flotante");
        s.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        s.style.left = Math.random() * 100 + "vw";
        s.style.top = Math.random() * 100 + "vh";
        cont.appendChild(s);
    }
}

/* INICIAR */
cargarProductos();
crearFondoEmojis();
actualizarTodo();

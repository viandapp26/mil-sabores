/*********************************
        VARIABLES GLOBALES
*********************************/

let productos = [
    { id: 1, nombre: "Milanesa con puré", precio: 2500, stock: 10, categoria: "vianda" },
    { id: 2, nombre: "Pollo con arroz", precio: 2300, stock: 8, categoria: "vianda" },
    { id: 3, nombre: "Hamburguesa", precio: 2000, stock: 15, categoria: "rapida" },
    { id: 4, nombre: "Papas fritas", precio: 1200, stock: 20, categoria: "rapida" }
];

let carrito = [];


/*********************************
        CONTROL DE HORARIOS
*********************************/

function estaEnHorario(inicio, fin) {
    const hora = new Date().getHours();
    return hora >= inicio && hora < fin;
}

function seccionActiva(categoria) {
    if (categoria === "vianda") {
        return estaEnHorario(7, 11);
    }

    if (categoria === "rapida") {
        return estaEnHorario(19, 22);
    }

    return true;
}

function controlarHorarios() {

    const seccionViandas = document.getElementById("carrusel-viandas")?.parentElement;
    const seccionRapida = document.getElementById("carrusel-rapida")?.parentElement;

    if (seccionViandas) {
        seccionViandas.classList.toggle("seccion-cerrada", !estaEnHorario(7, 11));
    }

    if (seccionRapida) {
        seccionRapida.classList.toggle("seccion-cerrada", !estaEnHorario(19, 22));
    }
}


/*********************************
        CARGAR PRODUCTOS
*********************************/

function cargarProductos() {
    const contViandas = document.getElementById("carrusel-viandas");
    const contRapida = document.getElementById("carrusel-rapida");

    if (contViandas) contViandas.innerHTML = "";
    if (contRapida) contRapida.innerHTML = "";

    productos.forEach(prod => {
        const card = document.createElement("div");
        card.className = "producto";

        card.innerHTML = `
            <h3>${prod.nombre}</h3>
            <p>$${prod.precio}</p>
            <p>Stock: ${prod.stock}</p>
            <button onclick="agregarAlCarrito(${prod.id})">
                Agregar
            </button>
        `;

        if (prod.categoria === "vianda" && contViandas) {
            contViandas.appendChild(card);
        }

        if (prod.categoria === "rapida" && contRapida) {
            contRapida.appendChild(card);
        }
    });
}


/*********************************
        CARRITO
*********************************/

function agregarAlCarrito(id) {

    const prod = productos.find(p => p.id === id);
    if (!prod || prod.stock <= 0) return;

    if (!seccionActiva(prod.categoria)) {
        alert(`La sección ${prod.categoria} está fuera de horario.`);
        return;
    }

    prod.stock--;

    const item = carrito.find(c => c.id === id);

    if (item) {
        item.cantidad++;
    } else {
        carrito.push({ ...prod, cantidad: 1 });
    }

    actualizarTodo();
}

function actualizarTodo() {
    cargarProductos();
    actualizarCarrito();
}

function actualizarCarrito() {

    const lista = document.getElementById("listaCarrito");
    const totalSpan = document.getElementById("total");

    if (!lista || !totalSpan) return;

    lista.innerHTML = "";

    let total = 0;

    carrito.forEach(item => {
        total += item.precio * item.cantidad;

        const li = document.createElement("li");
        li.textContent = `${item.nombre} x${item.cantidad}`;
        lista.appendChild(li);
    });

    totalSpan.textContent = total;
}


/*********************************
        ENVÍO DE PEDIDO
*********************************/

const formPedido = document.getElementById("formPedido");

if (formPedido) {

    formPedido.onsubmit = function(e) {
        e.preventDefault();

        if (carrito.length === 0) {
            alert("El carrito está vacío.");
            return;
        }

        const hayFueraHorario = carrito.some(item => !seccionActiva(item.categoria));

        if (hayFueraHorario) {
            alert("Tenés productos fuera de horario.");
            return;
        }

        alert("Pedido enviado correctamente.");
        carrito = [];
        actualizarTodo();
    };
}


/*********************************
        INICIALIZAR
*********************************/

cargarProductos();
controlarHorarios();
setInterval(controlarHorarios, 60000);

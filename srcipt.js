let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let pedidosPendientes = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];

const totalSpan = document.getElementById("total-precio");
const contador = document.querySelector(".carrito-contador");
const productosDiv = document.querySelector(".carrito-productos");

const zonaEnvio = document.getElementById("zonaEnvio");
const ubicacionInput = document.getElementById("ubicacion");

const panelAdmin = document.getElementById("panel-admin");

const metodoPago = document.getElementById("metodoPago");
const btnPagarMP = document.getElementById("btnPagarMP");
const pagoRealizado = document.getElementById("pagoRealizado");
const confirmacionPago = document.getElementById("confirmacionPago");

const linkMercadoPago = "http://link.mercadopago.com.ar/milsaboresviandas";

/* CARGA PRODUCTOS */
async function cargarProductos() {
    const res = await fetch("productos.json");
    productos = await res.json();
    actualizarTodo();
}

/* RENDER */
function renderSeccion(categoria, id) {
    const cont = document.getElementById(id);
    cont.innerHTML = "";

    productos.filter(p => p.categoria === categoria)
    .forEach(prod => {
        const div = document.createElement("div");
        div.classList.add("producto");
        div.innerHTML = `
            <img src="${prod.imagen}">
            <h3>${prod.nombre}</h3>
            <p>$${prod.precio}</p>
            <p>Stock: ${prod.stock}</p>
            <button onclick="agregarAlCarrito(${prod.id})"
            ${prod.stock <= 0 ? "disabled" : ""}>
            ${prod.stock <= 0 ? "Sin stock" : "Agregar"}
            </button>
        `;
        cont.appendChild(div);
    });
}

/* CARRITO */
function agregarAlCarrito(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod || prod.stock <= 0) return;

    prod.stock--;

    const item = carrito.find(c => c.id === id);
    if (item) item.cantidad++;
    else carrito.push({...prod, cantidad:1});

    actualizarTodo();
}

function actualizarTodo() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
    renderSeccion("vianda","carrusel-viandas");
    renderSeccion("rapida","carrusel-rapida");
    actualizarCarrito();
}

function actualizarCarrito() {
    productosDiv.innerHTML="";
    let total=0, cantidad=0;

    carrito.forEach(i=>{
        total+=i.precio*i.cantidad;
        cantidad+=i.cantidad;

        const p=document.createElement("p");
        p.innerHTML=`${i.nombre} x${i.cantidad}`;
        productosDiv.appendChild(p);
    });

    let envio=0;
    if(zonaEnvio){
        const opcion=zonaEnvio.options[zonaEnvio.selectedIndex];
        envio=parseInt(opcion?.dataset.precio)||0;
    }

    total+=envio;
    totalSpan.innerText=total;
    contador.innerText=cantidad;
    contador.style.display=cantidad>0?"block":"none";
}

if(zonaEnvio){
    zonaEnvio.addEventListener("change", actualizarCarrito);
}

/* ENVÍO WHATSAPP */
document.getElementById("formPedido").onsubmit=(e)=>{
    e.preventDefault();
    if(carrito.length===0) return;

    const nombre=document.getElementById("nombre").value;
    const ubicacion=ubicacionInput.value;
    const metodo=metodoPago.value;

    if(metodo==="mercadopago" && !pagoRealizado.checked){
        alert("Confirmá el pago");
        return;
    }

    let total=0;
    carrito.forEach(i=> total+=i.precio*i.cantidad);

    let mensaje=`*Pedido de ${nombre}*%0A`;
    carrito.forEach(i=>{
        mensaje+=`- ${i.nombre} x${i.cantidad}%0A`;
    });

    const opcion=zonaEnvio.options[zonaEnvio.selectedIndex];
    const envio=parseInt(opcion?.dataset.precio)||0;
    total+=envio;

    mensaje+=`%0A*Total:* $${total}`;

    if(ubicacion){
        const linkMaps=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacion)}`;
        mensaje+=`%0A📍 ${encodeURIComponent(ubicacion)}%0A${encodeURIComponent(linkMaps)}`;
    }

    window.open(`https://wa.me/5493764726863?text=${mensaje}`,"_blank");

    carrito=[];
    actualizarTodo();
};

/* MERCADOPAGO UI */
metodoPago.addEventListener("change",()=>{
    if(metodoPago.value==="mercadopago"){
        btnPagarMP.style.display="block";
        confirmacionPago.style.display="block";
    }else{
        btnPagarMP.style.display="none";
        confirmacionPago.style.display="none";
        pagoRealizado.checked=false;
    }
});

btnPagarMP.onclick=()=> window.open(linkMercadoPago,"_blank");

/* EMOJIS */
function crearFondoEmojis(){
    const cont=document.getElementById("fondo-emojis");
    const emojis=["🍎","🥗","🍱","🍗","🥑"];
    for(let i=0;i<40;i++){
        const s=document.createElement("span");
        s.classList.add("emoji-flotante");
        s.innerText=emojis[Math.floor(Math.random()*emojis.length)];
        s.style.left=Math.random()*100+"vw";
        s.style.top=Math.random()*100+"vh";
        cont.appendChild(s);
    }
}

cargarProductos();
crearFondoEmojis();

document.addEventListener("DOMContentLoaded", async () => {
    await actualizarDatosUsuario();
    await cargarHistorialTransacciones();

    const contDep = document.getElementById("contenedor-deposito");
    const contRet = document.getElementById("contenedor-retiro");

    document.getElementById("btn-abrir-deposito").addEventListener("click", () => {
        contRet.classList.add("oculto");
        contDep.classList.remove("oculto");
    });

    document.getElementById("btn-abrir-retiro").addEventListener("click", () => {
        contDep.classList.add("oculto");
        contRet.classList.remove("oculto");
    });

    // --- LÓGICA DE DEPÓSITO ---
    const formDep = document.getElementById("form-deposito");
    formDep.addEventListener("submit", async (e) => {
        e.preventDefault();
        const monto = Number(document.getElementById("monto-deposito").value);
        const msgErr = document.getElementById("mensaje-error");
        const msgOk = document.getElementById("mensaje-exito");
        msgErr.textContent = ""; msgOk.textContent = "";

        if(monto < 1000) { msgErr.textContent = "Mínimo $1.000"; return; }

        try {
            const res = await fetch("/api/user/deposit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: monto })
            });
            const data = await res.json();
            
            if (res.ok) {
                msgOk.textContent = "Depósito exitoso. Nuevo saldo: $" + data.balance.toLocaleString("es-CL");
                actualizarDisplaySaldo(data.balance);
                cargarHistorialTransacciones();
                formDep.reset();
            } else {
                msgErr.textContent = data.error;
            }
        } catch (err) {
            msgErr.textContent = "Error de conexión.";
        }
    });

    // --- LÓGICA DE RETIRO ---
    const formRet = document.getElementById("form-retiro");
    formRet.addEventListener("submit", async (e) => {
        e.preventDefault();
        const monto = Number(document.getElementById("retiro-monto").value);
        const msgErr = document.getElementById("mensaje-retiro-error");
        const msgOk = document.getElementById("mensaje-retiro-exito");
        msgErr.textContent = ""; msgOk.textContent = "";

        if(monto < 1000) { msgErr.textContent = "Mínimo $1.000"; return; }

        try {
            const res = await fetch("/api/user/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: monto })
            });
            const data = await res.json();

            if (res.ok) {
                msgOk.textContent = "Retiro exitoso. Nuevo saldo: $" + data.balance.toLocaleString("es-CL");
                actualizarDisplaySaldo(data.balance);
                cargarHistorialTransacciones();
                formRet.reset();
            } else {
                msgErr.textContent = data.error;
            }
        } catch (err) {
            msgErr.textContent = "Error de conexión.";
        }
    });
});

async function actualizarDatosUsuario() {
    try {
        const res = await fetch("/api/user/profile");
        if(res.ok) {
            const user = await res.json();
            actualizarDisplaySaldo(user.balance);
        }
    } catch(e) { console.error(e); }
}

function actualizarDisplaySaldo(monto) {
    const el = document.getElementById("saldo-actual");
    if(el) el.textContent = "Saldo actual: $" + monto.toLocaleString("es-CL") + " CLP";
}

async function cargarHistorialTransacciones() {
    try {
        const res = await fetch("/api/user/transactions");
        if(res.ok) {
            const list = await res.json();
            mostrarHistorialEnTabla(list);
        }
    } catch(e) { console.error(e); }
}

function mostrarHistorialEnTabla(historial) {
    const tabla = document.getElementById("tabla-historial");
    if (!tabla) return;
    tabla.innerHTML = "";
    
    historial.forEach((item) => {
        const tr = document.createElement("tr");
        const dateStr = new Date(item.date).toLocaleDateString("es-CL");
        const tipoStr = item.action === "DEPOSIT" ? "Ingreso" : "Retiro";
        const montoStr = (item.action === "DEPOSIT" ? "+ $" : "- $") + Math.abs(item.amount).toLocaleString("es-CL");
        const color = item.action === "DEPOSIT" ? "lightgreen" : "red";

        tr.innerHTML = `
            <td>${dateStr}</td>
            <td>${tipoStr}</td>
            <td class="text-right" style="color:${color}">${montoStr}</td>
        `;
        tabla.appendChild(tr);
    });
}
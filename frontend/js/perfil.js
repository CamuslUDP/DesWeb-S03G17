document.addEventListener("DOMContentLoaded", async () => {
    await cargarDatosPerfil();
    
    await cargarHistorialTransacciones();
});

async function cargarDatosPerfil() {
    try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
            const user = await res.json();
            const elUser = document.querySelector(".username");
            const elFullname = document.querySelector(".fullname");
            const elEmail = document.getElementById("email-display"); 
            const elDob = document.getElementById("dob-display");
            const elSaldo = document.getElementById("saldo-perfil");

            if(elUser) elUser.textContent = user.username;
            if(elFullname) elFullname.textContent = user.fullName;
            
            if(elEmail) elEmail.innerHTML = `<strong>Correo electrónico:</strong> ${user.email}`;
            
            if(elDob) {
                const fecha = user.birthDate ? user.birthDate.split("T")[0] : "N/A";
                elDob.innerHTML = `<strong>Fecha de nacimiento:</strong> ${fecha}`;
            }

            if(elSaldo) {
                elSaldo.textContent = "Saldo actual: $" + user.balance.toLocaleString("es-CL") + " CLP";
            }
        } else {
            console.error("No se pudo cargar el perfil");
        }
    } catch (error) {
        console.error("Error de red al cargar perfil:", error);
    }
}

async function cargarHistorialTransacciones() {
    try {
        const res = await fetch("/api/user/transactions");
        if (res.ok) {
            const list = await res.json();
            const tbody = document.getElementById("ultimos-movimientos");
            if (!tbody) return;

            tbody.innerHTML = "";

            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:15px">Sin movimientos recientes</td></tr>';
                return;
            }

            list.slice(0, 5).forEach(tx => {
                const tr = document.createElement("tr");
                const esIngreso = tx.action === "DEPOSIT";
                const clase = esIngreso ? "ingreso" : "retiro";
                const signo = esIngreso ? "+ $" : "- $";
                const fecha = new Date(tx.date).toLocaleDateString("es-CL");
                const tipoTexto = esIngreso ? "Ingreso" : "Retiro";

                tr.className = clase;
                tr.innerHTML = `
                    <td class="text-left">${fecha}</td>
                    <td class="text-center">${tipoTexto}</td>
                    <td class="text-right amount">${signo} ${Math.abs(tx.amount).toLocaleString("es-CL")}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error("Error cargando historial:", error);
    }
}
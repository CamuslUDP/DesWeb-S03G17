// ===================================
//  CONSTANTES Y CONFIGURACIÓN
// ===================================
const COLORES_RULETA = {
    0: 'green', 32: 'red', 15: 'black', 19: 'red', 4: 'black', 21: 'red', 2: 'black', 
    25: 'red', 17: 'black', 34: 'red', 6: 'black', 27: 'red', 13: 'black', 36: 'red', 
    11: 'black', 30: 'red', 8: 'black', 23: 'red', 10: 'black', 5: 'red', 24: 'black', 
    16: 'red', 33: 'black', 1: 'red', 20: 'black', 14: 'red', 31: 'black', 9: 'red', 
    22: 'black', 18: 'red', 29: 'black', 7: 'red', 28: 'black', 12: 'red', 35: 'black', 
    3: 'red', 26: 'black'
};

// =======================
//  STATE GLOBAL
// =======================
let saldoDisponible = 0; // Se llenará desde el backend
let chipSeleccionada = null; 
let chipValue = 0; 
let girando = false; 
const apuestas = {}; 

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Carga inicial de datos REALES desde el servidor
    await actualizarSaldoDesdeServer();
    await cargarHistorialJugadas();

    // Referencias DOM
    const saldoTexto = document.getElementById("saldo-apuestas-texto"); // La "pestañita" del saldo
    const spinBtn = document.getElementById("spin-btn");
    const limpiarBtn = document.getElementById("limpiar-apuestas");
    const chips = document.querySelectorAll(".chip");
    const cells = document.querySelectorAll(".board .cell, .board .num .cell");
    const rueda = document.querySelector(".wheel-inner");

    // --- FUNCIONES SALDO (Backend Connection) ---
    async function actualizarSaldoDesdeServer() {
        try {
            // Petición al endpoint de perfil para obtener el saldo real
            const res = await fetch("/api/user/profile");
            if(res.ok) {
                const data = await res.json();
                // El saldo disponible para apostar es el saldo total menos lo que ya pusiste en la mesa
                saldoDisponible = data.balance - calcularTotalMesa(); 
                actualizarDisplaySaldo();
            } else {
                console.error("Error obteniendo saldo");
            }
        } catch(e) { 
            console.error("Error de conexión al obtener saldo", e); 
        }
    }

    function calcularTotalMesa() {
        return Object.values(apuestas).reduce((a, b) => a + b, 0);
    }

    function actualizarDisplaySaldo() {
        if(saldoTexto) {
            saldoTexto.textContent = "$" + saldoDisponible.toLocaleString("es-CL");
        }
    }

    // --- INTERACCIÓN FICHAS ---
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            if(girando) return;
            chips.forEach(c => c.classList.remove('selected'));
            const val = Number(chip.dataset.valor);
            if(val > saldoDisponible) {
                alert("No tienes suficiente saldo para esta ficha");
                chipSeleccionada = null;
                return;
            }
            chip.classList.add('selected');
            chipSeleccionada = chip;
            chipValue = val;
        });
    });

    // --- INTERACCIÓN TABLERO ---
    cells.forEach(celda => {
        celda.addEventListener("click", () => {
            if(girando || !chipSeleccionada) return;
            if(chipValue > saldoDisponible) return alert("Saldo insuficiente");

            const betName = celda.dataset.bet || celda.textContent.trim();
            
            // Lógica local visual
            apuestas[betName] = (apuestas[betName] || 0) + chipValue;
            
            // Actualizamos el saldo visual restando la ficha recién puesta
            saldoDisponible -= chipValue;
            
            actualizarDisplaySaldo();
            actualizarApuestasActivasDisplay();
            celda.classList.add('active-bet-cell'); // Visual
        });
        
        // Click derecho para quitar apuesta
        celda.addEventListener("contextmenu", e => {
            e.preventDefault();
            if(girando) return;
            const betName = celda.dataset.bet || celda.textContent.trim();
            if(apuestas[betName]) {
                saldoDisponible += apuestas[betName]; // Devolver al saldo visual
                delete apuestas[betName];
                actualizarDisplaySaldo();
                actualizarApuestasActivasDisplay();
                celda.classList.remove('active-bet-cell');
            }
        });
    });

    function actualizarApuestasActivasDisplay() {
        const list = document.getElementById("apuestas-activas-list");
        if(!list) return;
        list.innerHTML = "";
        Object.keys(apuestas).forEach(k => {
            const li = document.createElement("li");
            li.innerHTML = `<span class="bet-label">${k}</span> <span class="bet-amount">$${apuestas[k]}</span>`;
            list.appendChild(li);
        });
    }

    limpiarBtn.addEventListener("click", () => {
        if(girando) return;
        // Borrar todas las apuestas locales
        for (const k in apuestas) delete apuestas[k];
        
        // Limpiar visualmente
        cells.forEach(c => c.classList.remove('active-bet-cell'));
        
        // Restaurar el saldo trayendo el dato fresco del servidor
        actualizarSaldoDesdeServer(); 
        actualizarApuestasActivasDisplay();
    });

    // --- GIRAR (CONEXIÓN API) ---
    spinBtn.addEventListener("click", async () => {
        if(girando) return;
        const totalMesa = calcularTotalMesa();
        if(totalMesa === 0) return alert("Realiza una apuesta primero.");

        girando = true;
        spinBtn.disabled = true;
        limpiarBtn.disabled = true;

        const betsArray = transformarApuestasParaBackend(apuestas);

        try {
            const res = await fetch("/api/game/spin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bets: betsArray })
            });
            const data = await res.json();

            if(!res.ok) {
                alert("Error: " + data.error);
                girando = false;
                spinBtn.disabled = false;
                limpiarBtn.disabled = false;
                return;
            }

            // Iniciar Animación
            girarRuletaAnimacion(data.result, () => {
                // Al terminar:
                // 1. El servidor ya calculó el nuevo saldo, actualizamos la variable local
                saldoDisponible = data.balance; 
                actualizarDisplaySaldo();
                
                // 2. Limpiamos la mesa
                for (const k in apuestas) delete apuestas[k];
                cells.forEach(c => c.classList.remove('active-bet-cell'));
                actualizarApuestasActivasDisplay();

                girando = false;
                spinBtn.disabled = false;
                limpiarBtn.disabled = false;
                
                cargarHistorialJugadas();
            });

        } catch(e) {
            console.error(e);
            alert("Error de red");
            girando = false;
            spinBtn.disabled = false;
            limpiarBtn.disabled = false;
        }
    });
    
    // --- HELPERS Y UTILIDADES ---

    function transformarApuestasParaBackend(apuestasLocales) {
        const resultado = [];
        for(const [key, amount] of Object.entries(apuestasLocales)) {
            if(!isNaN(Number(key))) {
                resultado.push({ type: "straight", value: Number(key), amount });
            } else if(key === "Rojo") {
                resultado.push({ type: "color", value: "red", amount });
            } else if(key === "Negro") {
                resultado.push({ type: "color", value: "black", amount });
            } else if(key === "Par") {
                resultado.push({ type: "evenodd", value: "even", amount });
            } else if(key === "Impar") {
                resultado.push({ type: "evenodd", value: "odd", amount });
            } else if(key === "1-18") {
                resultado.push({ type: "range", value: "low", amount });
            } else if(key === "19-36") {
                resultado.push({ type: "range", value: "high", amount });
            } else if(key === "1st 12") {
                resultado.push({ type: "dozen", value: 1, amount });
            } else if(key === "2nd 12") {
                resultado.push({ type: "dozen", value: 2, amount });
            } else if(key === "3rd 12") {
                resultado.push({ type: "dozen", value: 3, amount });
            } else if(key === "Columna 1") {
                resultado.push({ type: "column", value: 1, amount });
            } else if(key === "Columna 2") {
                resultado.push({ type: "column", value: 2, amount });
            } else if(key === "Columna 3") {
                resultado.push({ type: "column", value: 3, amount });
            }
        }
        return resultado;
    }

    let anguloActual = 0;
    function girarRuletaAnimacion(numeroGanador, callback) {
        const duracion = 4000;
        const vueltas = 5;
        // Animación simple
        const rotacionTotal = anguloActual + (vueltas * 360) + Math.random() * 360;

        if(rueda) {
            rueda.style.transition = `transform ${duracion}ms cubic-bezier(0.25, 1, 0.5, 1)`;
            rueda.style.transform = `translate(-50%, calc(-50% - 6px)) rotate(${rotacionTotal}deg)`;
        }

        setTimeout(() => {
            alert(`¡Salió el número ${numeroGanador}!`);
            anguloActual = rotacionTotal % 360;
            callback();
        }, duracion + 500);
    }

    async function cargarHistorialJugadas() {
        try {
            const res = await fetch("/api/game/history");
            if(res.ok) {
                const data = await res.json();
                const lista = document.getElementById("historial-jugadas");
                if(!lista) return;

                // Limpiar lista (manteniendo headers si existen en el HTML fuera del UL)
                // Asumimos que la lista son solo los items nuevos
                lista.innerHTML = ""; 
                
                data.forEach((item, idx) => {
                    const li = document.createElement("li");
                    const color = item.netResult >= 0 ? "gain" : "loss";
                    li.innerHTML = `
                        <span class="h-nro">${idx + 1}</span>
                        <span class="h-label">Juego</span>
                        <span class="h-stake">$${item.amountBet}</span>
                        <span class="h-win">${item.result}</span>
                        <span class="h-delta ${color}">$${item.netResult}</span>
                    `;
                    lista.appendChild(li);
                });
            }
        } catch(e) { console.error(e); }
    }
});
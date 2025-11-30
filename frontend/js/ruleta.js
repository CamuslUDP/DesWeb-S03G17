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

const NOMBRES_APUESTAS = {
    "red": "Rojo", "black": "Negro",
    "even": "Par", "odd": "Impar",
    "low": "1-18", "high": "19-36"
};

// =======================
//  STATE GLOBAL
// =======================
let saldoDisponible = 0;
let chipSeleccionada = null; 
let chipValue = 0;
let girando = false; 
const apuestas = {}; // { "17": 500, "Rojo": 1000 }

document.addEventListener("DOMContentLoaded", async () => {
    await actualizarSaldoDesdeServer();
    await cargarHistorialJugadas();

    // Referencias DOM
    const saldoTexto = document.getElementById("saldo-apuestas-texto");
    const spinBtn = document.getElementById("spin-btn");
    const limpiarBtn = document.getElementById("limpiar-apuestas");
    const chips = document.querySelectorAll(".chip");
    
    // Todas las celdas clicables del tablero
    const cells = document.querySelectorAll(".board .cell, .board .num, .board .zero, .board .column-cell, .board .dozens-cell, .bet-cell"); 
    const rueda = document.querySelector(".wheel-inner");

    // --- 1. SELECCIÓN DE FICHAS ---
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            if(girando) return;
            chips.forEach(c => c.classList.remove('selected'));
            
            const val = Number(chip.dataset.valor);
            if(val > saldoDisponible) {
                alert("No tienes suficiente saldo para esta ficha");
                return;
            }
            
            chip.classList.add('selected');
            chipSeleccionada = chip;
            chipValue = val;
        });
    });

    // --- 2. CLIC EN TABLERO ---
    cells.forEach(celda => {
        celda.addEventListener("click", function() {
            if(girando || !chipSeleccionada) return;
            if(chipValue > saldoDisponible) return alert("Saldo insuficiente");

            // Identificar la apuesta
            let betName = celda.dataset.bet || celda.textContent.trim();
            if(!betName) return; // Si es una celda vacía o de adorno

            // Lógica de saldo local
            apuestas[betName] = (apuestas[betName] || 0) + chipValue;
            saldoDisponible -= chipValue;
            actualizarDisplaySaldo();

            // --- VISUAL: ACTUALIZAR EL CUADRO DORADO ---
            actualizarCuadroMonto(celda, apuestas[betName]);
            actualizarApuestasActivasDisplay();
        });

        // Click derecho: Quitar apuesta
        celda.addEventListener("contextmenu", e => {
            e.preventDefault();
            if(girando) return;
            
            let betName = celda.dataset.bet || celda.textContent.trim();
            if(apuestas[betName]) {
                saldoDisponible += apuestas[betName];
                delete apuestas[betName];
                
                actualizarDisplaySaldo();
                actualizarApuestasActivasDisplay();
                
                // Quitar visualmente el cuadro
                const display = celda.querySelector(".bet-total-display");
                if(display) display.remove();
                celda.classList.remove("active-bet-cell");
            }
        });
    });

    // Función para dibujar/actualizar la barrita dorada abajo
    function actualizarCuadroMonto(celda, monto) {
        let display = celda.querySelector(".bet-total-display");
        
        if (!display) {
            display = document.createElement("div");
            display.className = "bet-total-display";
            celda.appendChild(display);
            celda.classList.add("active-bet-cell");
        }

        // Formato corto si es necesario (ej: $1.5k)
        let textoMonto = "$" + monto.toLocaleString("es-CL");
        if (monto >= 1000000) textoMonto = "$" + (monto/1000000).toFixed(1) + "M";
        else if (monto >= 1000 && monto < 1000000 && celda.offsetWidth < 60) { 
            // Solo abreviar si la celda es muy angosta
            textoMonto = "$" + (monto/1000).toFixed(0) + "k";
        }

        display.textContent = textoMonto;
    }

    // --- 3. BOTONES ---
    limpiarBtn.addEventListener("click", () => {
        if(girando) return;
        for (const k in apuestas) delete apuestas[k];
        
        // Limpiar visual
        document.querySelectorAll(".bet-total-display").forEach(el => el.remove());
        document.querySelectorAll(".active-bet-cell").forEach(el => el.classList.remove("active-bet-cell"));
        
        actualizarSaldoDesdeServer(); 
        actualizarApuestasActivasDisplay();
    });

    spinBtn.addEventListener("click", async () => {
        if(girando) return;
        const totalMesa = Object.values(apuestas).reduce((a, b) => a + b, 0);
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
                resetControles();
                return;
            }

            girarRuletaAnimacion(data.result, () => {
                saldoDisponible = data.balance; 
                actualizarDisplaySaldo();
                
                // Limpiar Mesa
                for (const k in apuestas) delete apuestas[k];
                document.querySelectorAll(".bet-total-display").forEach(el => el.remove());
                document.querySelectorAll(".active-bet-cell").forEach(el => el.classList.remove("active-bet-cell"));
                actualizarApuestasActivasDisplay();

                resetControles();
                cargarHistorialJugadas();
            });

        } catch(e) {
            console.error(e);
            alert("Error de red");
            resetControles();
        }
    });

    function resetControles() {
        girando = false;
        spinBtn.disabled = false;
        limpiarBtn.disabled = false;
    }

    // --- 4. AYUDAS ---
    async function actualizarSaldoDesdeServer() {
        try {
            const res = await fetch("/api/user/profile");
            if(res.ok) {
                const data = await res.json();
                const totalMesa = Object.values(apuestas).reduce((a, b) => a + b, 0);
                saldoDisponible = data.balance - totalMesa;
                actualizarDisplaySaldo();
            }
        } catch(e) {}
    }

    function actualizarDisplaySaldo() {
        if(saldoTexto) saldoTexto.textContent = "$" + saldoDisponible.toLocaleString("es-CL");
    }

    function actualizarApuestasActivasDisplay() {
        const list = document.getElementById("apuestas-activas-list");
        if(!list) return;
        list.innerHTML = "";
        Object.keys(apuestas).forEach(k => {
            const li = document.createElement("li");
            li.innerHTML = `<span class="bet-label">${k}</span> <span class="bet-amount">$${apuestas[k].toLocaleString("es-CL")}</span>`;
            list.appendChild(li);
        });
    }

    function transformarApuestasParaBackend(apuestasLocales) {
        const resultado = [];
        for(const [key, amount] of Object.entries(apuestasLocales)) {
            if(!isNaN(Number(key))) {
                resultado.push({ type: "straight", value: Number(key), amount });
            } else {
                const k = key.toLowerCase();
                if(k.includes("rojo") || k === "red") resultado.push({ type: "color", value: "red", amount });
                else if(k.includes("negro") || k === "black") resultado.push({ type: "color", value: "black", amount });
                else if(k.includes("par") && !k.includes("impar")) resultado.push({ type: "evenodd", value: "even", amount });
                else if(k.includes("impar")) resultado.push({ type: "evenodd", value: "odd", amount });
                else if(k === "1-18") resultado.push({ type: "range", value: "low", amount });
                else if(k === "19-36") resultado.push({ type: "range", value: "high", amount });
                else if(k.includes("1st 12") || k.includes("1ra 12") || k.includes("1st")) resultado.push({ type: "dozen", value: 1, amount });
                else if(k.includes("2nd 12") || k.includes("2da 12") || k.includes("2nd")) resultado.push({ type: "dozen", value: 2, amount });
                else if(k.includes("3rd 12") || k.includes("3ra 12") || k.includes("3rd")) resultado.push({ type: "dozen", value: 3, amount });
                else if(k.includes("columna 1") || k.includes("columna 3") || k.includes("columna 2")) {
                    // Detectar número de columna del texto
                    if(k.includes("1")) resultado.push({ type: "column", value: 1, amount });
                    if(k.includes("2")) resultado.push({ type: "column", value: 2, amount });
                    if(k.includes("3")) resultado.push({ type: "column", value: 3, amount });
                }
                // Ajuste para tus botones "2 to 1" si el texto es ese
                else if(celdaEsColumna(key)) {
                     // Lógica adicional si el nombre no es claro, 
                     // pero idealmente usa data-bet="Columna 1" en el HTML
                }
            }
        }
        return resultado;
    }
    
    function celdaEsColumna(texto) {
        return texto.includes("2 to 1"); 
    }

    // --- 5. ANIMACIÓN Y HISTORIAL DETALLADO ---
    let anguloActual = 0;
    function girarRuletaAnimacion(numeroGanador, callback) {
        const duracion = 4000;
        const vueltas = 5;
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

                // Limpiar (manteniendo headers si están fuera)
                lista.innerHTML = ""; 
                
                data.forEach((item, idx) => {
                    const li = document.createElement("li");
                    const color = item.netResult >= 0 ? "gain" : "loss";
                    
                    // Generar descripción detallada
                    let desc = "Juego";
                    if(item.bets && item.bets.length > 0) {
                        desc = item.bets.map(b => {
                            let n = b.value;
                            if(NOMBRES_APUESTAS[b.value]) n = NOMBRES_APUESTAS[b.value];
                            if(b.type === 'dozen') n = b.value + "ª Doc";
                            if(b.type === 'column') n = "Col " + b.value;
                            return n;
                        }).join(", ");
                    }

                    li.innerHTML = `
                        <span class="h-nro">${idx + 1}</span>
                        <span class="h-label" title="${desc}">${desc}</span>
                        <span class="h-stake">$${item.amountBet.toLocaleString("es-CL")}</span>
                        <span class="h-win">${item.result}</span>
                        <span class="h-delta ${color}">$${item.netResult.toLocaleString("es-CL")}</span>
                    `;
                    lista.appendChild(li);
                });
            }
        } catch(e) {}
    }
});
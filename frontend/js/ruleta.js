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

const PAGOS_RULETA = {
    'numero': 35, 'split': 17, 'street': 11, 'corner': 8, 'line': 5, 
    'dozen': 2, 'column': 2, 'color': 1, 'evenodd': 1, 'highlow': 1,
    'trio_012': 11, 'trio_023': 11, 'cuaterna_0123': 8 
};

// ===================================
//  HELPERS (Historial Local y Global)
// ===================================
function obtenerColorNumero(numero) {
    return COLORES_RULETA[numero] || 'green';
}

// --- Historial Local (Exclusivo Ruleta) ---
function obtenerHistorialJugadas() {
  const datos = localStorage.getItem("historial_jugadas");
  return datos ? JSON.parse(datos) : [];
}

function guardarHistorialJugadas(lista) {
  localStorage.setItem("historial_jugadas", JSON.stringify(lista));
}

// --- NUEVO: Historial Global (Para Transacciones) ---
function registrarEnHistorialGlobal(resumenApuesta, montoNeto) {
    const datos = localStorage.getItem("historial"); // Clave compartida con transacciones.js
    const historial = datos ? JSON.parse(datos) : [];
    
    const hoy = new Date();
    const fecha = hoy.toLocaleDateString("es-CL");
    
    // Creamos una entrada compatible con transacciones.js
    // Tipo: "Apuesta Ruleta: [Resumen]" para diferenciarlo visualmente
    const entradaTransaccion = {
        fecha: fecha,
        tipo: `Apuesta: ${resumenApuesta}`, 
        monto: montoNeto
    };
    
    historial.push(entradaTransaccion);
    localStorage.setItem("historial", JSON.stringify(historial));
}

function generarResumenApuestas(apuestas) {
    const nombres = Object.keys(apuestas).filter(key => apuestas[key] > 0);
    if (nombres.length === 0) return 'Ninguna';
    if (nombres.length === 1) return nombres[0];
    if (nombres.length > 3) {
        return `${nombres.slice(0, 2).join(', ')} (+${nombres.length - 2} más)`;
    }
    return nombres.join(', ');
}

function registrarResultadoJugada(numeroGanador, montoApostado, gananciaNeta, apuestasActivas) {
    const resumenTexto = generarResumenApuestas(apuestasActivas);

    // 1. Guardar en historial LOCAL (Ruleta) - Formato detallado
    const historial = obtenerHistorialJugadas();
    const jugada = {
        ganador: numeroGanador,
        apuestaTotal: montoApostado,
        apuestasRealizadas: apuestasActivas, 
        delta: gananciaNeta,
        color: obtenerColorNumero(numeroGanador),
        resumen: resumenTexto 
    };
    historial.unshift(jugada); 
    guardarHistorialJugadas(historial.slice(0, 10)); 
    mostrarHistorialJugadas();

    // 2. Guardar en historial GLOBAL (Transacciones) - Formato simple
    // Esto hará que aparezca en la otra página con Fecha, Tipo y Monto
    registrarEnHistorialGlobal(resumenTexto, gananciaNeta);
}

function mostrarHistorialJugadas() {
    const historial = obtenerHistorialJugadas();
    const lista = document.getElementById("historialJugadas");
    if (!lista) return;

    // Mantenemos los 5 encabezados (N°, Tipo, Monto, Ganador, Delta)
    while (lista.children.length > 5) { 
        lista.removeChild(lista.lastChild);
    }

    historial.forEach((item, index) => {
        const li = document.createElement("li");
        const claseDelta = item.delta >= 0 ? 'gain' : 'loss';
        const signoDelta = item.delta >= 0 ? '+ $ ' : '− $ ';
        const montoAbsoluto = Math.abs(item.delta);
        const nroCronologico = historial.length - index;
        
        li.innerHTML = `
            <span class="h-nro">${nroCronologico}</span>
            <span class="h-label">${item.resumen}</span>
            <span class="h-stake">$ ${item.apuestaTotal.toLocaleString("es-CL")}</span>
            <span class="h-win"><span class="win-badge ${item.color}">${item.ganador}</span></span>
            <span class="h-delta ${claseDelta}">${signoDelta} ${montoAbsoluto.toLocaleString("es-CL")}</span>
        `;
        lista.appendChild(li);
    });
}

// ===================================
//  LÓGICA DE CÁLCULO DE PAGOS
// ===================================
function obtenerApuestasGanadoras(resultado, apuestasActivas) {
    const ganadoras = [];
    const num = resultado;
    const color = obtenerColorNumero(num);
    const esPar = num !== 0 && num % 2 === 0;
    const esBajo = num >= 1 && num <= 18;
    
    if (apuestasActivas[num.toString()]) {
        ganadoras.push({ nombre: num.toString(), monto: apuestasActivas[num.toString()], pagoRatio: PAGOS_RULETA['numero'] });
    }
    if (color === 'red' && apuestasActivas['Rojo']) ganadoras.push({ nombre: 'Rojo', monto: apuestasActivas['Rojo'], pagoRatio: PAGOS_RULETA['color'] });
    if (color === 'black' && apuestasActivas['Negro']) ganadoras.push({ nombre: 'Negro', monto: apuestasActivas['Negro'], pagoRatio: PAGOS_RULETA['color'] });
    if (num !== 0 && esPar && apuestasActivas['Par']) ganadoras.push({ nombre: 'Par', monto: apuestasActivas['Par'], pagoRatio: PAGOS_RULETA['evenodd'] });
    if (num !== 0 && !esPar && apuestasActivas['Impar']) ganadoras.push({ nombre: 'Impar', monto: apuestasActivas['Impar'], pagoRatio: PAGOS_RULETA['evenodd'] });
    if (esBajo && apuestasActivas['1-18']) ganadoras.push({ nombre: '1-18', monto: apuestasActivas['1-18'], pagoRatio: PAGOS_RULETA['highlow'] });
    if (!esBajo && num !== 0 && apuestasActivas['19-36']) ganadoras.push({ nombre: '19-36', monto: apuestasActivas['19-36'], pagoRatio: PAGOS_RULETA['highlow'] });
    if (num >= 1 && num <= 12 && apuestasActivas['1st 12']) ganadoras.push({ nombre: '1st 12', monto: apuestasActivas['1st 12'], pagoRatio: PAGOS_RULETA['dozen'] });
    if (num >= 13 && num <= 24 && apuestasActivas['2nd 12']) ganadoras.push({ nombre: '2nd 12', monto: apuestasActivas['2nd 12'], pagoRatio: PAGOS_RULETA['dozen'] });
    if (num >= 25 && num <= 36 && apuestasActivas['3rd 12']) ganadoras.push({ nombre: '3rd 12', monto: apuestasActivas['3rd 12'], pagoRatio: PAGOS_RULETA['dozen'] });
    if (num !== 0 && num % 3 === 1 && apuestasActivas['Columna 1']) ganadoras.push({ nombre: 'Columna 1', monto: apuestasActivas['Columna 1'], pagoRatio: PAGOS_RULETA['column'] });
    if (num !== 0 && num % 3 === 2 && apuestasActivas['Columna 2']) ganadoras.push({ nombre: 'Columna 2', monto: apuestasActivas['Columna 2'], pagoRatio: PAGOS_RULETA['column'] });
    if (num !== 0 && num % 3 === 0 && apuestasActivas['Columna 3']) ganadoras.push({ nombre: 'Columna 3', monto: apuestasActivas['Columna 3'], pagoRatio: PAGOS_RULETA['column'] });
    
    return ganadoras;
}

function calcularGanancias(apuestasGanadoras, totalApostado) {
    let gananciaBruta = 0; 
    let montoGanadoDevuelto = 0;

    apuestasGanadoras.forEach(apuesta => {
        gananciaBruta += (apuesta.monto * apuesta.pagoRatio);
        montoGanadoDevuelto += apuesta.monto; 
    });

    const totalDevuelto = gananciaBruta + montoGanadoDevuelto; 
    const gananciaEfectiva = totalDevuelto - totalApostado;

    return { gananciaNeta: gananciaEfectiva, montoApostado: totalApostado };
}

// =======================
//  STATE GLOBAL
// =======================
document.addEventListener("dragstart", e => e.preventDefault());
document.addEventListener("contextmenu", e => {
  if (e.target.closest(".chip") || e.target.classList.contains("placed-chip")) {
    e.preventDefault();
  }
});

let saldoTotal = 0;
let saldoDisponible = 0;
let chipSeleccionada = null; 
let chipValue = 0; 
let girando = false; 

const apuestas = {}; 

// =======================
// DOM READY
// =======================
document.addEventListener("DOMContentLoaded", () => {

  const saldoTexto = document.getElementById("saldo-apuestas-texto");
  const limpiarBtn = document.getElementById("limpiar-apuestas");
  const spinBtn = document.getElementById("spin-btn");
  const board = document.querySelector(".board");
  const apuestasList = document.getElementById("apuestas-activas-list");
  const cells = document.querySelectorAll(".board .cell, .board .num .cell"); 
  const chips = document.querySelectorAll(".chip");

  localStorage.removeItem("montoEnJuego");

  function sincronizarSaldo() {
    const saldoGuardado = localStorage.getItem("saldo");
    if (!saldoGuardado || isNaN(Number(saldoGuardado))) {
      localStorage.setItem("saldo", 0);
      saldoTotal = 0;
    } else {
      saldoTotal = Number(saldoGuardado);
    }
    const totalApostadoMesa = Object.values(apuestas).reduce((a, b) => a + b, 0);
    saldoDisponible = saldoTotal - totalApostadoMesa;
    actualizarSaldoDisplay();
  }

  function actualizarSaldoDisplay() {
    saldoTexto.textContent = "$" + saldoDisponible.toLocaleString("es-CL");
  }

  function mostrarErrorSaldo() {
    const box = document.getElementById("saldo-apuestas-box");
    box.classList.add("saldo-error");
    setTimeout(() => box.classList.remove("saldo-error"), 1500);
  }

  sincronizarSaldo();
  mostrarHistorialJugadas(); 

  window.addEventListener("storage", (event) => {
    if (event.key === "saldo") {
      if (!girando) {
          sincronizarSaldo();
      }
    }
  });
  
  // --- SELECCIÓN DE FICHA ---
  function seleccionarFicha(chip) {
      if (girando) return; 

      chips.forEach(c => c.classList.remove('selected'));
      
      if (chip === chipSeleccionada) {
          chipSeleccionada = null;
          chipValue = 0;
          return;
      }

      const valorFicha = Number(chip.dataset.valor);
      if (valorFicha > saldoDisponible || saldoDisponible <= 0) {
          chipSeleccionada = null;
          chipValue = 0;
          mostrarErrorSaldo(); 
          return;
      }
      
      chip.classList.add('selected');
      chipSeleccionada = chip;
      chipValue = valorFicha;
  }

  chips.forEach(chip => {
    chip.style.cursor = 'pointer'; 
    chip.addEventListener("click", () => seleccionarFicha(chip));
  });

  // --- COLOCAR APUESTA ---
  function obtenerMontoDisplay(celdaEl) {
      let display = celdaEl.querySelector('.bet-total-display');
      if (!display) {
          display = document.createElement('span');
          display.className = 'bet-total-display';
          celdaEl.appendChild(display);
      }
      return display;
  }

  cells.forEach(celda => {
      celda.addEventListener("click", () => {
          if (girando) return; 
          if (!chipSeleccionada) return;
          
          const valor = chipValue;
          if (valor > saldoDisponible) {
              mostrarErrorSaldo();
              seleccionarFicha(chipSeleccionada); 
              return;
          }

          const nombreApuesta = celda.dataset.bet || celda.textContent.trim();

          saldoDisponible -= valor;
          apuestas[nombreApuesta] = (apuestas[nombreApuesta] || 0) + valor;

          actualizarSaldoDisplay();
          actualizarApuestasActivasDisplay();
          actualizarCeldaApuesta(nombreApuesta, celda);
      });
      
      celda.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          if (girando) return; 

          const nombreApuesta = celda.dataset.bet || celda.textContent.trim();
          const montoApostado = apuestas[nombreApuesta] || 0;
          
          if (montoApostado > 0) {
              saldoDisponible += montoApostado;
              delete apuestas[nombreApuesta];
              
              actualizarSaldoDisplay();
              actualizarApuestasActivasDisplay();
              actualizarCeldaApuesta(nombreApuesta, celda);
              
              if (chipSeleccionada && chipValue > saldoDisponible) {
                  seleccionarFicha(chipSeleccionada); 
              }
          }
      });
  });

  function actualizarCeldaApuesta(nombreApuesta, celdaEl) {
      const monto = apuestas[nombreApuesta] || 0;
      if (monto > 0) {
          const display = obtenerMontoDisplay(celdaEl);
          display.textContent = `$${monto.toLocaleString("es-CL")}`;
          celdaEl.classList.add('active-bet-cell');
      } else {
          const display = celdaEl.querySelector('.bet-total-display');
          if (display) display.remove();
          celdaEl.classList.remove('active-bet-cell');
      }
  }

  function actualizarApuestasActivasDisplay() {
      apuestasList.innerHTML = "";
      const apuestasActivas = Object.keys(apuestas).filter(key => apuestas[key] > 0);
      if (apuestasActivas.length === 0) {
          apuestasList.innerHTML = '<li id="empty-bet-message">No hay apuestas activas.</li>';
          return;
      }
      apuestasActivas.forEach(nombre => {
          const monto = apuestas[nombre];
          const li = document.createElement("li");
          li.innerHTML = `
              <span class="bet-label">${nombre}</span>
              <span class="bet-amount">$ ${monto.toLocaleString("es-CL")}</span>
          `;
          apuestasList.appendChild(li);
      });
  }

  // --- LIMPIAR ---
  function limpiarTablero() {
    cells.forEach(celda => {
        const display = celda.querySelector('.bet-total-display');
        if (display) display.remove();
        celda.classList.remove('active-bet-cell');
    });
    for (const key in apuestas) delete apuestas[key];
    
    chips.forEach(c => c.classList.remove('selected'));
    chipSeleccionada = null;
    chipValue = 0;

    sincronizarSaldo();
    actualizarApuestasActivasDisplay();
  }

  limpiarBtn.addEventListener("click", () => {
      if (girando) return;
      limpiarTablero();
  });

  // =======================
  //  GIRAR RULETA (LÓGICA DE VALIDACIÓN CRÍTICA)
  // =======================
  spinBtn.addEventListener("click", () => {
    if (girando) return; 

    if (Object.keys(apuestas).length === 0) {
      mostrarErrorSaldo();
      console.log("No hay apuestas para girar.");
      return;
    }
    
    const saldoRealEnNube = Number(localStorage.getItem("saldo") || 0);
    const totalApostadoMesa = Object.values(apuestas).reduce((a, b) => a + b, 0);

    if (saldoRealEnNube < totalApostadoMesa) {
        alert("Partida inválida: Las apuestas superan el saldo disponible (posible retiro en otra ventana). La mesa se reiniciará.");
        limpiarTablero(); 
        return;
    }

    localStorage.setItem("montoEnJuego", totalApostadoMesa);

    girando = true;
    board.style.opacity = "0.7";
    board.style.pointerEvents = "none"; 
    chips.forEach(c => c.style.pointerEvents = "none");
    spinBtn.disabled = true;
    limpiarBtn.disabled = true;
    
    chips.forEach(c => c.classList.remove('selected'));
    chipSeleccionada = null;
    chipValue = 0;
    
    const apuestasParaEvaluar = { ...apuestas }; 
    girarRuletaAnimacion(totalApostadoMesa, apuestasParaEvaluar); 
  });

  // =======================
  //  ANIMACIÓN
  // =======================
  const rueda = document.querySelector(".wheel-inner");
  let anguloActual = 0;

  function girarRuletaAnimacion(montoApostado, apuestasActivas) {
    const duracion = 3000 + Math.random() * 4000;
    const vueltas = 6 + Math.random() * 6;
    const anguloFinal = anguloActual + (vueltas * 360) + Math.random() * 360;

    rueda.style.transition = `transform ${duracion}ms cubic-bezier(0.15, 0.85, 0.25, 1)`;
    rueda.style.transform = `translate(-50%, calc(-50% - 6px)) rotate(${anguloFinal}deg)`;

    setTimeout(() => {
        anguloActual = normalizarAngulo(anguloFinal);
        rueda.style.transition = "none";
        rueda.style.transform = `translate(-50%, calc(-50% - 6px)) rotate(${anguloActual}deg)`;

        const resultado = obtenerResultadoDesdeAngulo(anguloActual);
        const apuestasGanadoras = obtenerApuestasGanadoras(resultado, apuestasActivas);
        const { gananciaNeta } = calcularGanancias(apuestasGanadoras, montoApostado);
        
        let saldoFinal = Number(localStorage.getItem("saldo"));
        saldoFinal += gananciaNeta;
        localStorage.setItem("saldo", saldoFinal);
        
        localStorage.removeItem("montoEnJuego");

        // ESTO ES LO IMPORTANTE: Registra en AMBOS historiales
        registrarResultadoJugada(resultado, montoApostado, gananciaNeta, apuestasActivas);
        
        girando = false;
        saldoTotal = saldoFinal;
        
        for (const key in apuestas) delete apuestas[key];
        cells.forEach(celda => {
            const display = celda.querySelector('.bet-total-display');
            if (display) display.remove();
            celda.classList.remove('active-bet-cell');
        });
        actualizarApuestasActivasDisplay();

        board.style.opacity = "1";
        board.style.pointerEvents = "auto";
        chips.forEach(c => c.style.pointerEvents = "auto");
        spinBtn.disabled = false;
        limpiarBtn.disabled = false;

        sincronizarSaldo();

        const saldoDisplay = document.getElementById("saldo-apuestas-texto");
        saldoDisplay.classList.add("saldo-flash");
        setTimeout(() => saldoDisplay.classList.remove("saldo-flash"), 500);

    }, duracion);
  }

  function normalizarAngulo(angulo) {
    return ((angulo % 360) + 360) % 360;
  }

  function obtenerResultadoDesdeAngulo(anguloCSS) {
    let a = normalizarAngulo(anguloCSS);
    if (a >= 355.135145 || a < 4.864865) return 0;
    if (a >= 345.405415 && a < 355.135145) return 32;
    if (a >= 335.675685 && a < 345.405415) return 15;
    if (a >= 325.945955 && a < 335.675685) return 19;
    if (a >= 316.216225 && a < 325.945955) return 4;
    if (a >= 306.486495 && a < 316.216225) return 21;
    if (a >= 296.756765 && a < 306.486495) return 2;
    if (a >= 287.027035 && a < 296.756765) return 25;
    if (a >= 277.297305 && a < 287.027035) return 17;
    if (a >= 267.567575 && a < 277.297305) return 34;
    if (a >= 257.837845 && a < 267.567575) return 6;
    if (a >= 248.108115 && a < 257.837845) return 27;
    if (a >= 238.378385 && a < 248.108115) return 13;
    if (a >= 228.648655 && a < 238.378385) return 36;
    if (a >= 218.918925 && a < 228.648655) return 11;
    if (a >= 209.189195 && a < 218.918925) return 30;
    if (a >= 199.459465 && a < 209.189195) return 8;
    if (a >= 189.729735 && a < 199.459465) return 23;
    if (a >= 180.000005 && a < 189.729735) return 10;
    if (a >= 170.270275 && a < 180.000005) return 5;
    if (a >= 160.540545 && a < 170.270275) return 24;
    if (a >= 150.810815 && a < 160.540545) return 16;
    if (a >= 141.081085 && a < 150.810815) return 33;
    if (a >= 131.351355 && a < 141.081085) return 1;
    if (a >= 121.621625 && a < 131.351355) return 20;
    if (a >= 111.891895 && a < 121.621625) return 14;
    if (a >= 102.162165 && a < 111.891895) return 31;
    if (a >= 92.432435 && a < 102.162165) return 9;
    if (a >= 82.702705 && a < 92.432435) return 22;
    if (a >= 72.972975 && a < 82.702705) return 18;
    if (a >= 63.243245 && a < 72.972975) return 29;
    if (a >= 53.513515 && a < 63.243245) return 7;
    if (a >= 43.783785 && a < 53.513515) return 28;
    if (a >= 34.054055 && a < 43.783785) return 12;
    if (a >= 24.324325 && a < 34.054055) return 35;
    if (a >= 14.594595 && a < 24.324325) return 3;
    if (a >= 4.864865 && a < 14.594595) return 26;
    return null; 
  }
});
// =====================================================
//  SISTEMA DE PAGO RULETA – COMPATIBLE CON game.js
// =====================================================

// Conversión de números rojos / negros según ruleta europea
const ROJO = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const NEGRO = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

function colorDeNumero(n) {
  if (n === 0) return "green";
  return ROJO.includes(n) ? "red" : "black";
}

// Tabla de pagos estándar europea
const PAYOUTS = {
  straight: 35,   // Pleno (número directo)
  color: 1,       // Rojo / Negro
  evenodd: 1,     // Par / Impar
  range: 1,       // 1-18 / 19-36
  dozen: 2,       // Docenas
  column: 2       // Columnas
};

// =====================================================
//  CALCULAR PAGO DE UNA APUESTA
// =====================================================

function calcularPago({ type, value, amount, result }) {
  if (!amount || amount <= 0) return 0;

  const num = result;
  const color = colorDeNumero(num);

  // ============================
  //  PLENO (straight)
  // ============================
  if (type === "straight") {
    return num === value ? amount * PAYOUTS.straight : 0;
  }

  // ============================
  //  COLOR (red / black)
  // ============================
  if (type === "color") {
    if (num !== 0 && value === color) {
      return amount * PAYOUTS.color;
    }
    return 0;
  }

  // ============================
  //  PAR / IMPAR
  // ============================
  if (type === "evenodd") {
    if (num === 0) return 0;
    const esPar = num % 2 === 0;
    if ((value === "even" && esPar) || (value === "odd" && !esPar)) {
      return amount * PAYOUTS.evenodd;
    }
    return 0;
  }

  // ============================
  //  1-18 / 19-36
  // ============================
  if (type === "range") {
    if (num === 0) return 0;
    if (value === "low" && num <= 18) return amount * PAYOUTS.range;
    if (value === "high" && num >= 19) return amount * PAYOUTS.range;
    return 0;
  }

  // ============================
  //  DOCENAS
  // ============================
  if (type === "dozen") {
    if (num >= 1 && num <= 12 && value === 1) return amount * PAYOUTS.dozen;
    if (num >= 13 && num <= 24 && value === 2) return amount * PAYOUTS.dozen;
    if (num >= 25 && num <= 36 && value === 3) return amount * PAYOUTS.dozen;
    return 0;
  }

  // ============================
  //  COLUMNAS
  // ============================
  if (type === "column") {
    if (num === 0) return 0;
    const column = (num - 1) % 3 + 1; // 1,2,3
    if (column === value) return amount * PAYOUTS.column;
    return 0;
  }

  return 0;
}

module.exports = { calcularPago };

// =====================================================
//  SISTEMA DE PAGO RULETA
// =====================================================

// Números rojos según ruleta europea
const ROJO = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

function colorDeNumero(n) {
  if (n === 0) return "green";
  return ROJO.includes(n) ? "red" : "black";
}

// Tabla de pagos
const PAYOUTS = {
  straight: 35,   // Pleno
  color: 1,       // Rojo / Negro
  evenodd: 1,     // Par / Impar
  range: 1,       // 1-18 / 19-36
  dozen: 2,       // Docenas
  column: 2       // Columnas
};

function calcularPago({ type, value, amount, result }) {
  if (!amount || amount <= 0) return 0;

  const num = result;
  const color = colorDeNumero(num);

  // Pleno (Número específico)
  if (type === "straight") {
    return num === value ? amount * PAYOUTS.straight : 0;
  }

  // Color (red / black)
  if (type === "color") {
    // Si sale 0, pierden las apuestas de color
    if (num !== 0 && value === color) {
      return amount * PAYOUTS.color;
    }
    return 0;
  }

  // Par / Impar
  if (type === "evenodd") {
    if (num === 0) return 0;
    const esPar = num % 2 === 0;
    if ((value === "even" && esPar) || (value === "odd" && !esPar)) {
      return amount * PAYOUTS.evenodd;
    }
    return 0;
  }

  // 1-18 / 19-36
  if (type === "range") {
    if (num === 0) return 0;
    if (value === "low" && num <= 18) return amount * PAYOUTS.range;
    if (value === "high" && num >= 19) return amount * PAYOUTS.range;
    return 0;
  }

  // Docenas (1, 2, 3)
  if (type === "dozen") {
    if (num >= 1 && num <= 12 && value === 1) return amount * PAYOUTS.dozen;
    if (num >= 13 && num <= 24 && value === 2) return amount * PAYOUTS.dozen;
    if (num >= 25 && num <= 36 && value === 3) return amount * PAYOUTS.dozen;
    return 0;
  }

  // Columnas (1, 2, 3)
  if (type === "column") {
    if (num === 0) return 0;
    // Columna 1: 1, 4, 7... (n%3 === 1)
    // Columna 2: 2, 5, 8... (n%3 === 2)
    // Columna 3: 3, 6, 9... (n%3 === 0)
    let colNum = num % 3;
    if (colNum === 0) colNum = 3;
    
    if (colNum === value) return amount * PAYOUTS.column;
    return 0;
  }

  return 0;
}

module.exports = { calcularPago };
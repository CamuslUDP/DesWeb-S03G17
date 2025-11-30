const ROJO = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

function colorDeNumero(n) {
  if (n === 0) return "green";
  return ROJO.includes(n) ? "red" : "black";
}

const PAYOUTS = {
  straight: 35,
  color: 1,
  evenodd: 1,
  range: 1,
  dozen: 2,
  column: 2 
};

function calcularPago({ type, value, amount, result }) {
  if (!amount || amount <= 0) return 0;

  const num = result;
  const color = colorDeNumero(num);

  if (type === "straight") {
    return num === value ? amount * PAYOUTS.straight : 0;
  }

  if (type === "color") {
    if (num !== 0 && value === color) {
      return amount * PAYOUTS.color;
    }
    return 0;
  }

  if (type === "evenodd") {
    if (num === 0) return 0;
    const esPar = num % 2 === 0;
    if ((value === "even" && esPar) || (value === "odd" && !esPar)) {
      return amount * PAYOUTS.evenodd;
    }
    return 0;
  }

  if (type === "range") {
    if (num === 0) return 0;
    if (value === "low" && num <= 18) return amount * PAYOUTS.range;
    if (value === "high" && num >= 19) return amount * PAYOUTS.range;
    return 0;
  }

  if (type === "dozen") {
    if (num >= 1 && num <= 12 && value === 1) return amount * PAYOUTS.dozen;
    if (num >= 13 && num <= 24 && value === 2) return amount * PAYOUTS.dozen;
    if (num >= 25 && num <= 36 && value === 3) return amount * PAYOUTS.dozen;
    return 0;
  }

  if (type === "column") {
    if (num === 0) return 0;
    let colNum = num % 3;
    if (colNum === 0) colNum = 3;
    
    if (colNum === value) return amount * PAYOUTS.column;
    return 0;
  }

  return 0;
}

module.exports = { calcularPago };
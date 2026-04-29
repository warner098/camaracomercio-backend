const validarCedulaEcuatoriana = (cedula) => {
  if (typeof cedula !== 'string' || cedula.length !== 10 || isNaN(cedula)) return false;
  
  const digito_region = parseInt(cedula.substring(0, 2), 10);
  if (digito_region < 1 || (digito_region > 24 && digito_region !== 30)) return false;
  
  const tercer_digito = parseInt(cedula.substring(2, 3), 10);
  if (tercer_digito > 5) return false;
  
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const digito_verificador = parseInt(cedula.substring(9, 10), 10);
  let suma = 0;
  
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.substring(i, i + 1), 10) * coeficientes[i];
    if (valor > 9) valor -= 9;
    suma += valor;
  }
  
  const decena_superior = Math.ceil(suma / 10) * 10;
  const resultado = decena_superior - suma;
  
  return (resultado === 10 ? 0 : resultado) === digito_verificador;
};

module.exports = validarCedulaEcuatoriana;
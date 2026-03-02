require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend en puerto ${PORT}`));

console.log("ENV CHECK:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "OK" : "NO DEFINIDO");
const express = require("express");
const cors = require("cors");

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/negocios", require("./routes/negocios.routes"));
app.use("/api/productos", require("./routes/productos.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/solicitudes", require("./routes/solicitudes.routes"));
app.use("/api/pagos", require("./routes/pagos.routes"));
app.use("/api/categorias", require("./routes/categorias.routes"));
app.use("/api/unidades", require("./routes/unidades.routes"));

// Ruta base de prueba
app.get("/", (req, res) => {
  res.json({ ok: true, message: "API funcionando 🚀" });
});

// Manejo de ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Ruta no encontrada"
  });
});

module.exports = app;
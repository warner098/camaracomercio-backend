require("dotenv").config();
process.env.TZ = "America/Guayaquil";
const app = require("./src/app");
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;

// 1. Creamos el servidor HTTP envuelto en nuestra app de Express
const server = http.createServer(app);

// 2. Configuramos Socket.io
const io = new Server(server, {
  cors: {
    origin: ["https://transcendent-axolotl-727785.netlify.app", "http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// 3. Guardamos la instancia de 'io' en app para poder usarla en cualquier controlador
app.set("io", io);

// 4. Lógica de conexión en tiempo real
io.on("connection", (socket) => {
  console.log("🟢 Nuevo dispositivo conectado:", socket.id);

  // Cuando un usuario hace login, lo unimos a una "sala" invisible con su ID
  // Así podemos mandarle alertas directas solo a él (como dueño o como cliente)
  socket.on("unirse_sala", (id_usuario) => {
    socket.join(id_usuario.toString());
    console.log(`👤 Usuario ${id_usuario} se unió a su canal de notificaciones`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Dispositivo desconectado:", socket.id);
  });
});

// 🔥 IMPORTANTE: Ahora usamos server.listen, NO app.listen
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend y WebSockets corriendo en puerto ${PORT}`);
});

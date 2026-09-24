const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configuración de CORS
app.use(cors());
app.use(express.json());

// Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Ruta de prueba/salud del backend
app.get('/', (req, res) => {
  res.send('Servidor DOGOS SEGURIDAD Activo');
});

// Ruta para recibir alerta de pánico desde la app móvil
app.post('/api/panico', (req, res) => {
  const { cliente, telefono, latitud, longitud } = req.body;

  const alerta = {
    id: Date.now().toString(),
    cliente: cliente || 'Cliente DOGOS',
    telefono: telefono || 'Sin datos',
    latitud,
    longitud,
    timestamp: new Date()
  };

  // Reenviar alerta en tiempo real a la central de monitoreo
  io.emit('nueva_alerta_panico', alerta);
  console.log('🚨 Alerta de pánico recibida:', alerta);

  res.status(200).json({ success: true, message: 'Pánico recibido en backend' });
});

// Eventos de conexión de WebSockets
io.on('connection', (socket) => {
  console.log('Nueva conexión registrada:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Puerto dinámico asignado por Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});

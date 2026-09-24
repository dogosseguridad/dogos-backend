const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const https = require('https');

const app = express();
const server = http.createServer(app);

// Configuración de CORS para permitir conexiones desde la app móvil y el panel web
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Ruta para recibir alertas de pánico desde la app
app.post('/api/panico', (req, res) => {
  const { cliente, telefono, latitud, longitud, direccion } = req.body;

  const alerta = {
    id: Date.now().toString(),
    cliente: cliente || 'Usuario App',
    telefono: telefono || 'Sin datos',
    latitud,
    longitud,
    direccion: direccion || 'Ubicación GPS recibida',
    timestamp: new Date()
  };

  // Emitir la alerta a la central de monitoreo
  io.emit('nueva_alerta_panico', alerta);
  console.log('🚨 ALERTA DE PÁNICO ENVIADA A LA CENTRAL:', alerta);

  res.status(200).json({ success: true, message: 'Alerta enviada correctamente' });
});

// Ruta keep-alive / ping para evitar la suspensión en Render
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Autoping cada 10 minutos
const BACKEND_URL = 'https://dogos-backend.onrender.com/ping';
setInterval(() => {
  https.get(BACKEND_URL, (res) => {
    console.log(`Keep-alive ping: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('Error en ping:', err.message);
  });
}, 10 * 60 * 1000);

// Manejo de conexiones con Socket.io
io.on('connection', (socket) => {
  console.log('Cliente/Central conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente/Central desconectado:', socket.id);
  });
});

// Puerto dinámico de Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor DOGOS escuchando en puerto ${PORT}`);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

// Ruta de comprobación de salud del servidor
app.get('/', (req, res) => {
  res.send('Servidor DOGOS SEGURIDAD Activo 🚀');
});

// Ruta HTTP API: Cambiar estado de monitoreo (Ausente / En Casa)
app.put('/api/monitoreo/estado', (req, res) => {
  const { usuarioId, nuevoModo } = req.body;
  console.log(`[ESTADO] Usuario ${usuarioId} cambió a modo: ${nuevoModo}`);
  
  // Notificar a la central web por WebSockets
  io.emit('cambio_estado', { usuarioId, nuevoModo, fecha: new Date() });
  
  return res.json({ exito: true, mensaje: 'Estado actualizado correctamente' });
});

// Ruta HTTP API: Enviar Alerta de Pánico desde la App Móvil
app.post('/api/emergencias/panico', (req, res) => {
  const { usuarioId, tipoAlerta, latitud, longitud } = req.body;
  console.log(`[🚨 PÁNICO] Recibida alerta de ${usuarioId}:`, { latitud, longitud });

  const datosAlerta = {
    usuarioId: usuarioId || 'CLIENTE_01',
    tipoAlerta: tipoAlerta || 'PANICO_VIRTUAL',
    latitud,
    longitud,
    fecha: new Date().toISOString()
  };

  // Transmitir inmediatamente la alerta a la Central Web
  io.emit('nueva_alerta', datosAlerta);
  io.emit('alerta_panico', datosAlerta);

  return res.json({ exito: true, mensaje: 'Alerta de pánico recibida en central' });
});

// Eventos de conexión WebSocket (Central Web)
io.on('connection', (socket) => {
  console.log('Cliente/Central conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente/Central desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor DOGOS SEGURIDAD activo en puerto ${PORT}`);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configuración de CORS para permitir conexiones cruzadas
app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Ruta de estado del servidor
app.get('/', (req, res) => {
  res.send('Servidor de DOGOS SEGURIDAD funcionando correctamente.');
});

// Servir la central de monitoreo si está en el mismo proyecto
app.get('/central', (req, res) => {
  res.sendFile(__dirname + '/central.html');
});

// 1. Recepción de Alertas por HTTP (Fetch desde la app)
app.post('/api/panico', (req, res) => {
  try {
    const payload = req.body;
    console.log('🚨 Alerta recibida vía HTTP POST:', payload);

    // RETRANSMISIÓN A LA CENTRAL WEB
    io.emit('alerta_central', {
      usuarioId: payload.usuarioId || 'CLIENTE_01',
      latitud: payload.latitud,
      longitud: payload.longitud,
      modo: payload.modo || 'Panico Manual',
      origen: payload.origen || 'APP_MOVIL',
      timestamp: payload.timestamp || new Date().toISOString()
    });

    res.status(200).json({ status: 'ok', mensaje: 'Alerta procesada y retransmitida a la central' });
  } catch (error) {
    console.error('Error al procesar alerta HTTP:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 2. Conexiones vía WebSockets (Socket.io)
io.on('connection', (socket) => {
  console.log('🟢 Cliente o Central conectado con ID:', socket.id);

  // Escuchar alertas enviadas por WebSocket
  socket.on('alerta_panico', (data) => {
    console.log('🚨 Alerta recibida vía WebSocket:', data);
    io.emit('alerta_central', data);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Cliente desconectado ID:', socket.id);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor de DOGOS SEGURIDAD corriendo en el puerto ${PORT}`);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configuración de CORS
app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor de DOGOS SEGURIDAD funcionando correctamente.');
});

// Servir la central de monitoreo
app.get('/central', (req, res) => {
  res.sendFile(__dirname + '/central.html');
});

// 1. Recepción de Alertas por HTTP (Fetch)
app.post('/api/panico', (req, res) => {
  try {
    const payload = req.body;
    console.log('🚨 Alerta recibida vía HTTP POST:', payload);

    io.emit('alerta_central', {
      ...payload,
      origen: payload.origen || 'ALERTA_HTTP'
    });

    res.status(200).json({ status: 'ok', mensaje: 'Alerta procesada por la central' });
  } catch (error) {
    console.error('Error al procesar alerta HTTP:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 2. Conexiones vía WebSockets (Socket.io)
io.on('connection', (socket) => {
  console.log('🟢 Cliente o Central conectado con ID:', socket.id);

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

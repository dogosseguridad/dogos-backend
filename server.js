const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configuración de Middlewares y CORS
app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Ruta raíz de verificación (Heartbeat para la app)
app.get('/', (req, res) => {
  res.send('Servidor de DOGOS SEGURIDAD funcionando correctamente.');
});

// Servir la pantalla de la central si se accede desde el navegador
app.get('/central', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// 🚨 RUTA CRÍTICA: Recepción de Alertas desde la App Móvil (Resuelve el Error 404)
app.post('/api/panico', (req, res) => {
  try {
    const payload = req.body;
    console.log('🚨 Alerta recibida vía HTTP POST:', payload);

    // Retransmisión en tiempo real vía WebSocket a la Central de Monitoreo
    io.emit('alerta_central', {
      usuarioId: payload.usuarioId || 'CLIENTE_DOGOS_01',
      latitud: payload.latitud,
      longitud: payload.longitud,
      modo: payload.modo || 'PANICO_MANUAL',
      origen: payload.origen || 'APP_MOVIL',
      timestamp: payload.timestamp || new Date().toISOString()
    });

    // Respuesta 200 exitosa para confirmar recepción a la app móvil
    res.status(200).json({ 
      status: 'ok', 
      mensaje: 'Alerta recibida y retransmitida exitosamente a la central.' 
    });
  } catch (error) {
    console.error('Error procesando la alerta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// WebSockets para monitoreo en vivo
io.on('connection', (socket) => {
  console.log('🟢 Cliente/Central conectado con ID:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔴 Cliente/Central desconectado');
  });
});

// Puerto asignado dinámicamente por Render o 3000 local
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor DOGOS corriendo en el puerto ${PORT}`);
});

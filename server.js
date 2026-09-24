const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());
app.use(express.static('public')); // Sirve el panel de la central en la raíz del servidor

// Ruta donde pega la App móvil al presionar el botón de pánico
app.post('/api/panico', (req, res) => {
  const { cliente, telefono, latitud, longitud, direccion } = req.body;

  const alerta = {
    id: Date.now().toString(),
    cliente: cliente || 'Usuario App',
    telefono: telefono || 'N/A',
    latitud,
    longitud,
    direccion,
    timestamp: new Date()
  };

  // Emitir la alerta a todos los operadores conectados a la Central de Monitoreo
  io.emit('nueva_alerta_panico', alerta);

  console.log('🚨 ALERTA DE PÁNICO RECIBIDA Y RETRANSMITIDA A LA CENTRAL:', alerta);
  res.status(200).json({ success: true, message: 'Alerta de pánico distribuida a la central' });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Central de Monitoreo DOGOS corriendo correctamente');
});

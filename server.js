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
    methods: ['GET', 'POST']
  }
});

app.get('/', (req, res) => {
  res.send('Servidor DOGOS SEGURIDAD Activo 🚀');
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('alerta_panico', (data) => {
    console.log('Alerta recibida:', data);
    io.emit('nueva_alerta', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor DOGOS SEGURIDAD activo en puerto ${PORT}`);
});

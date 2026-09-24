<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DOGOS SEGURIDAD - Central de Monitoreo</title>
  <!-- Tailwind CSS para el diseño -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Leaflet CSS para el mapa -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    #map { height: calc(100vh - 80px); }
    .pulse-red {
      animation: pulse 1s infinite alternate;
    }
    @keyframes pulse {
      0% { background-color: rgba(239, 68, 68, 0.2); }
      100% { background-color: rgba(239, 68, 68, 0.8); }
    }
  </style>
</head>
<body class="bg-gray-900 text-white font-sans overflow-hidden">

  <!-- Encabezado de la Central -->
  <header class="h-20 bg-gray-800 border-b border-gray-700 px-6 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center font-bold text-xl">D</div>
      <div>
        <h1 class="font-bold text-lg tracking-wide text-red-500">DOGOS SEGURIDAD</h1>
        <p class="text-xs text-gray-400">Panel Operativo de Respuestas Rápidas</p>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <div id="status-badge" class="px-3 py-1 text-xs rounded-full bg-green-900 text-green-300 font-medium">
        ● Sistema en Línea
      </div>
      <button id="silence-btn" onclick="silenciarAlarma()" class="hidden bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-2 rounded-lg font-bold">
        🔕 Silenciar Sirena
      </button>
    </div>
  </header>

  <!-- Cuerpo Principal -->
  <div class="flex h-[calc(100vh-80px)]">
    
    <!-- Sidebar / Lista de Alertas -->
    <aside class="w-1/3 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div class="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 class="font-bold text-sm text-gray-300 uppercase tracking-wider">Alertas Activas</h2>
        <span id="alert-count" class="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">0</span>
      </div>

      <div id="alerts-container" class="flex-1 overflow-y-auto p-4 space-y-3">
        <!-- Las alertas que lleguen en tiempo real se insertarán aquí dinámicamente -->
        <p id="no-alerts" class="text-gray-500 text-sm text-center mt-10">No hay alertas de emergencia activas.</p>
      </div>
    </aside>

    <!-- Mapa Interactivo -->
    <main class="w-2/3 relative">
      <div id="map" class="w-full h-full bg-gray-950"></div>
    </main>

  </div>

  <!-- Audio de Alarma -->
  <audio id="siren-sound" loop preload="auto">
    <source src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" type="audio/mpeg">
  </audio>

  <!-- Librerías JS: Socket.io y Leaflet -->
  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <script>
    // Configuración Inicial del Mapa (Coordenadas por defecto)
    const map = L.map('map').setView([-31.25, -61.49], 13); // Centrado estándar

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const markers = {};
    const siren = document.getElementById('siren-sound');
    let activeAlerts = 0;

    // Conexión en tiempo real con el servidor Backend de Render
    const socket = io('https://dogos-backend.onrender.com');

    socket.on('connect', () => {
      console.log('Conectado a la Central de Monitoreo DOGOS');
    });

    // Escuchar Evento de Pánico emitido por la App de los Clientes
    socket.on('nueva_alerta_panico', (data) => {
      recibirAlerta(data);
    });

    function recibirAlerta(data) {
      const { id, cliente, telefono, latitud, longitud, timestamp, direccion } = data;

      activeAlerts++;
      actualizarContador();
      reproducirSirena();

      // Ocultar mensaje vacío
      document.getElementById('no-alerts').classList.add('hidden');

      // 1. Agregar Tarjeta en la Sidebar
      const container = document.getElementById('alerts-container');
      const card = document.createElement('div');
      card.id = `alert-card-${id}`;
      card.className = "bg-gray-700 border-l-4 border-red-500 p-4 rounded shadow-md pulse-red transition-all cursor-pointer";
      card.onclick = () => enfocarMapa(latitud, longitud);

      card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-bold text-red-400 text-base">${cliente || 'Cliente No Identificado'}</h3>
          <span class="text-xs text-gray-400">${new Date(timestamp).toLocaleTimeString()}</span>
        </div>
        <p class="text-xs text-gray-300 mb-1"><strong>Teléfono:</strong> ${telefono || 'Sin registro'}</p>
        <p class="text-xs text-gray-300 mb-3"><strong>Ubicación:</strong> ${direccion || `${latitud},${longitud}`}</p>
        <div class="flex gap-2">
          <button onclick="atenderAlerta(event, '${id}')" class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded font-bold w-full">Atender</button>
          <button onclick="resolverAlerta(event, '${id}')" class="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded font-bold w-full">Finalizar</button>
        </div>
      `;
      container.prepend(card);

      // 2. Marcar en el Mapa
      const marker = L.marker([latitud, longitud]).addTo(map);
      marker.bindPopup(`<b>${cliente}</b><br>¡ALERTA DE PÁNICO!`).openPopup();
      markers[id] = marker;

      // Centrar el mapa en la emergencia
      map.setView([latitud, longitud], 16);
    }

    function enfocarMapa(lat, lng) {
      map.setView([lat, lng], 16);
    }

    function reproducirSirena() {
      siren.play().catch(e => console.log("Audio bloquedo por navegador hasta interacción del usuario."));
      document.getElementById('silence-btn').classList.remove('hidden');
    }

    function silenciarAlarma() {
      siren.pause();
      siren.currentTime = 0;
      document.getElementById('silence-btn').classList.add('hidden');
    }

    function atenderAlerta(e, id) {
      e.stopPropagation();
      const card = document.getElementById(`alert-card-${id}`);
      if(card) {
        card.classList.remove('pulse-red', 'border-red-500');
        card.classList.add('border-yellow-500', 'bg-gray-750');
      }
      silenciarAlarma();
    }

    function resolverAlerta(e, id) {
      e.stopPropagation();
      const card = document.getElementById(`alert-card-${id}`);
      if (card) card.remove();

      if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
      }

      activeAlerts = Math.max(0, activeAlerts - 1);
      actualizarContador();

      if (activeAlerts === 0) {
        document.getElementById('no-alerts').classList.remove('hidden');
        silenciarAlarma();
      }
    }

    function actualizarContador() {
      document.getElementById('alert-count').innerText = activeAlerts;
    }
  </script>
</body>
</html>

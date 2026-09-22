import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import io from 'socket.io-client';

// URL del backend en Render
const BACKEND_URL = 'https://dogos-backend.onrender.com';

// Inicialización de WebSockets
const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  autoConnect: true
});

export default function App() {
  const [cargando, setCargando] = useState(false);
  const [estadoConexion, setEstadoConexion] = useState('Conectando...');

  useEffect(() => {
    // Detectar estado de la conexión en vivo
    socket.on('connect', () => {
      console.log('✅ Conectado al backend en Render');
      setEstadoConexion('🟢 Conectado a la Central');
    });

    socket.on('disconnect', () => {
      console.log('🔴 Desconectado del backend');
      setEstadoConexion('🔴 Desconectado');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const enviarPanico = async () => {
    setCargando(true);

    try {
      // 1. Obtener ubicación GPS actual
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere acceso a la ubicación GPS para enviar la alerta de pánico.');
        setCargando(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const payload = {
        usuarioId: 'CLIENTE_01', // Puedes modificar este ID según el cliente
        latitud: location.coords.latitude,
        longitud: location.coords.longitude,
        timestamp: new Date().toISOString()
      };

      console.log('Enviando alerta de pánico:', payload);

      // 2. Canal 1: Enviar vía HTTP POST a Render (Garantiza recepción)
      const respuesta = await fetch(`${BACKEND_URL}/api/panico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // 3. Canal 2: Emitir vía Socket.io en tiempo real
      if (socket.connected) {
        socket.emit('alerta_panico', payload);
      }

      if (respuesta.ok || socket.connected) {
        Alert.alert('🚨 ALERTA ENVIADA', 'La Central de Monitoreo ha recibido su posición en vivo.');
      } else {
        throw new Error('No se pudo establecer comunicación con el servidor.');
      }

    } catch (error) {
      console.error('Error al enviar pánico:', error);
      Alert.alert(
        'Error de envío',
        'No se pudo conectar con la Central. Verifique su conexión a internet e intente nuevamente.'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Encabezado Institucional */}
      <View style={styles.header}>
        <Text style={styles.brandTitle}>DOGOS SEGURIDAD</Text>
        <Text style={styles.brandSlogan}>Misión dada es misión cumplida</Text>
      </View>

      {/* Indicador de Estado */}
      <View style={styles.statusContainer}>
        <Text style={[
          styles.statusText, 
          estadoConexion.includes('🟢') ? styles.statusOnline : styles.statusOffline
        ]}>
          {estadoConexion}
        </Text>
      </View>

      {/* Botón Principal de Pánico */}
      <TouchableOpacity 
        style={styles.btnPanico} 
        onPress={enviarPanico} 
        disabled={cargando}
        activeOpacity={0.8}
      >
        {cargando ? (
          <ActivityIndicator color="#FFFFFF" size="large" />
        ) : (
          <View style={styles.btnContent}>
            <Text style={styles.btnEmoji}>🚨</Text>
            <Text style={styles.btnTexto}>PÁNICO</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.footerNote}>Presione el botón únicamente en caso de emergencia real.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
  },
  brandTitle: {
    color: '#E53935',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  brandSlogan: {
    color: '#888888',
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  statusContainer: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusOnline: {
    color: '#4CAF50',
  },
  statusOffline: {
    color: '#E53935',
  },
  btnPanico: {
    backgroundColor: '#D32F2F',
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#FF5252',
    elevation: 12,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  btnContent: {
    alignItems: 'center',
  },
  btnEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  btnTexto: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  footerNote: {
    color: '#555555',
    fontSize: 12,
    textAlign: 'center',
  },
});

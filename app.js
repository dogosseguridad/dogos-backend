import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import io from 'socket.io-client';

// URL de tu backend en Render
const BACKEND_URL = 'https://dogos-backend.onrender.com';

// Socket con reconexión automática y mayor tiempo de espera
const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  timeout: 20000,
  autoConnect: true
});

export default function App() {
  const [cargando, setCargando] = useState(false);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Conectado al servidor');
      setConectado(true);
    });

    socket.on('disconnect', () => {
      console.log('Desconectado del servidor');
      setConectado(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const enviarPanico = async () => {
    setCargando(true);

    try {
      // 1. Obtener permisos y ubicación GPS
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se requiere permiso de ubicación para enviar la alerta.');
        setCargando(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const payload = {
        usuarioId: 'CLIENTE_01', // O el ID correspondiente del cliente
        latitud: location.coords.latitude,
        longitud: location.coords.longitude,
        timestamp: new Date().toISOString()
      };

      // 2. Intentar envío por HTTP (Despierta a Render si está dormido)
      const respuesta = await fetch(`${BACKEND_URL}/api/panico`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // 3. También emitir por Socket.io para asegurar la recepción inmediata
      if (socket.connected) {
        socket.emit('alerta_panico', payload);
      }

      if (respuesta.ok || socket.connected) {
        Alert.alert('🚨 ALERTA ENVIADA', 'La Central de Monitoreo ha recibido su señal de pánico.');
      } else {
        throw new Error('Servidor sin respuesta');
      }

    } catch (error) {
      console.error(error);
      Alert.alert(
        'Conectando con la Central...',
        'El servidor se está reactivando. Presione el botón nuevamente en unos segundos.'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DOGOS SEGURIDAD</Text>
      <Text style={styles.subtitle}>Misión dada es misión cumplida</Text>

      <Text style={[styles.estado, conectado ? styles.online : styles.offline]}>
        {conectado ? '🟢 Conectado a la Central' : '🔴 Reconectando con el servidor...'}
      </Text>

      <TouchableOpacity 
        style={styles.btnPanico} 
        onPress={enviarPanico} 
        disabled={cargando}
      >
        {cargando ? (
          <ActivityIndicator color="#FFF" size="large" />
        ) : (
          <Text style={styles.btnTexto}>🚨 PÁNICO</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#E53935',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 30,
  },
  estado: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  online: { color: '#4CAF50' },
  offline: { color: '#FF5252' },
  btnPanico: {
    backgroundColor: '#D32F2F',
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FF5252',
    elevation: 10,
  },
  btnTexto: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
});

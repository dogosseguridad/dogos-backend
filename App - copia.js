import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, SafeAreaView, StatusBar, Vibration } from 'react-native';
import * as Location from 'expo-location';

// ⚠️ REEMPLAZAR CON LA IP DE TU COMPUTADORA O SERVIDOR DE LA CENTRAL
const API_URL = 'https://TU-SERVIDOR-EN-RENDER.onrender.com';

// Identificador único asignado a este cliente/celular desde la Central
const CLIENTE_ID = 'CLIENTE_01';

export default function App() {
  const [modo, setModo] = useState('EN_CASA_PRIVACIDAD');
  const [cargando, setCargando] = useState(false);
  const [ubicacion, setUbicacion] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'La app necesita acceso al GPS para enviar la ubicación en emergencias.');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setUbicacion(location.coords);
    })();
  }, []);

  // Función para cambiar de estado (Privacidad / Vigilancia)
  const cambiarEstado = async (nuevoModo) => {
    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/api/monitoreo/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: CLIENTE_ID,
          nuevoModo: nuevoModo
        })
      });

      const data = await response.json();
      if (data.exito) {
        setModo(nuevoModo);
        Vibration.vibrate(100);
      } else {
        Alert.alert('Error', 'No se pudo actualizar el estado.');
      }
    } catch (error) {
      Alert.alert('Error de Conexión', 'No se pudo conectar con la Central de DOGOS SEGURIDAD.');
    } finally {
      setCargando(false);
    }
  };

  // Función para enviar señal de PÁNICO
  const enviarPanico = async () => {
    Vibration.vibrate([0, 500, 200, 500]);
    setCargando(true);

    let lat = 0;
    let lon = 0;

    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      lat = location.coords.latitude;
      lon = location.coords.longitude;
    } catch (e) {
      console.log('Error obteniendo GPS inmediato, usando última conocida');
      if (ubicacion) {
        lat = ubicacion.latitude;
        lon = ubicacion.longitude;
      }
    }

    try {
      const response = await fetch(`${API_URL}/api/emergencias/panico`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: CLIENTE_ID,
          tipoAlerta: 'PANICO_VIRTUAL',
          latitud: lat,
          longitud: lon
        })
      });

      const data = await response.json();
      if (data.exito) {
        Alert.alert('🚨 ALERTA ENVIADA', 'La Central de Monitoreo ha recibido su señal de emergencia.');
      } else {
        Alert.alert('Error', 'No se pudo enviar la alerta de pánico.');
      }
    } catch (error) {
      Alert.alert('Error Crítico', 'Fallo de conexión al enviar la alerta de pánico.');
    } finally {
      setCargando(false);
    }
  };

  const esModoAusente = modo === 'MODO_AUSENTE_ALERTA';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DOGOS SEGURIDAD</Text>
        <Text style={styles.headerSubtitle}>Misión dada es misión cumplida</Text>
      </View>

      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>ESTADO ACTUAL DE SU SISTEMA:</Text>
        <View style={[styles.badge, esModoAusente ? styles.badgeVigilancia : styles.badgePrivacidad]}>
          <Text style={styles.badgeText}>
            {esModoAusente ? '🔒 VIGILANCIA ACTIVA' : '🏠 MODO PRIVACIDAD'}
          </Text>
        </View>
        <Text style={styles.idText}>ID Dispositivo: {CLIENTE_ID}</Text>
      </View>

      {/* Botones de Control de Estado */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.btnEstado, !esModoAusente && styles.btnActivoPrivacidad]} 
          onPress={() => cambiarEstado('EN_CASA_PRIVACIDAD')}
          disabled={cargando}
        >
          <Text style={styles.btnEstadoText}>🏠 Estoy en Casa</Text>
          <Text style={styles.btnEstadoSub}>Modo Privacidad</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btnEstado, esModoAusente && styles.btnActivoVigilancia]} 
          onPress={() => cambiarEstado('MODO_AUSENTE_ALERTA')}
          disabled={cargando}
        >
          <Text style={styles.btnEstadoText}>🔒 Me Voy</Text>
          <Text style={styles.btnEstadoSub}>Modo Vigilancia</Text>
        </TouchableOpacity>
      </View>

      {/* Botón Principal de Pánico */}
      <View style={styles.panicoContainer}>
        <TouchableOpacity 
          style={styles.btnPanico} 
          onPress={enviarPanico}
          activeOpacity={0.7}
          disabled={cargando}
        >
          <Text style={styles.panicoText}>🚨 PÁNICO</Text>
          <Text style={styles.panicoSubText}>PRESIONAR EN EMERGENCIA</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Conectado a Central DOGOS SEGURIDAD</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 15,
  },
  headerTitle: {
    color: '#E53935',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: '#AAA',
    fontSize: 12,
    marginTop: 2,
  },
  statusBox: {
    backgroundColor: '#1A1A1A',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statusLabel: {
    color: '#888',
    fontSize: 11,
    marginBottom: 8,
    fontWeight: '600',
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 6,
  },
  badgePrivacidad: {
    backgroundColor: '#2E7D32',
  },
  badgeVigilancia: {
    backgroundColor: '#C62828',
  },
  badgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  idText: {
    color: '#555',
    fontSize: 10,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  btnEstado: {
    flex: 1,
    backgroundColor: '#222',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  btnActivoPrivacidad: {
    borderColor: '#4CAF50',
    backgroundColor: '#1B3320',
  },
  btnActivoVigilancia: {
    borderColor: '#EF5350',
    backgroundColor: '#331B1B',
  },
  btnEstadoText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnEstadoSub: {
    color: '#AAA',
    fontSize: 10,
    marginTop: 2,
  },
  panicoContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  btnPanico: {
    backgroundColor: '#D32F2F',
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#FF5252',
    elevation: 10,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  panicoText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
  },
  panicoSubText: {
    color: '#FFCDD2',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  footerText: {
    color: '#444',
    fontSize: 11,
  },
});
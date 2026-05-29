import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Cada notificacion que llega del BFF via Socket.IO
export interface Notification {
  id: string;
  document_id: string;
  filename: string;
  document_status: string;
  compliance_status: string;
  details: string;
  timestamp: string;
}

const BFF_URL = 'http://localhost:4000';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Conectar al namespace /notifications del BFF
    const socket = io(`${BFF_URL}/notifications`);

    socket.on('connect', () => {
      console.log('Socket.IO conectado');
    });

    // Cuando llega un evento processing-update, agregar al estado
    socket.on('processing-update', (data: Omit<Notification, 'id'>) => {
      const notification: Notification = {
        ...data,
        id: crypto.randomUUID(),
      };
      setNotifications(prev => [notification, ...prev]);

      // Auto-eliminar despues de 6 segundos
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 6000);
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO desconectado');
    });

    // Limpiar al desmontar el componente
    return () => { socket.disconnect(); };
  }, []);

  return { notifications };
}
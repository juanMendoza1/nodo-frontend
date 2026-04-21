// src/hooks/useWebSockets.ts
import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_URL } from '../api/axios.config'; 

export interface WsSubscription {
  topic: string;
  callback: (data: any) => void;
}

export const useWebSockets = (empresaId: number | undefined, subscriptions: WsSubscription[]) => {
  const [isLive, setIsLive] = useState(false);
  
  // Usamos una referencia para evitar que React cierre y abra 
  // el socket en cada render si las funciones callback cambian.
  const subsRef = useRef(subscriptions);

  useEffect(() => {
    subsRef.current = subscriptions;
  }, [subscriptions]);

  useEffect(() => {
    if (!empresaId || subsRef.current.length === 0) return;

    const socketUrl = `${API_URL}/ws`;

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsLive(true);
        console.log(`📡 WebSocket STOMP Conectado - Empresa: ${empresaId}`);
        
        // Iteramos dinámicamente sobre todas las suscripciones pasadas
        subsRef.current.forEach(({ topic, callback }) => {
          client.subscribe(topic, (message) => {
            if (message.body) {
              try {
                // Intenta convertir a JSON (Ej: objeto Mesa)
                const parsed = JSON.parse(message.body);
                callback(parsed);
              } catch (e) {
                // Si falla, asume texto plano (Ej: "NUEVA_VENTA")
                callback(message.body);
              }
            }
          });
        });
      },
      onDisconnect: () => setIsLive(false),
      onWebSocketError: () => setIsLive(false),
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        setIsLive(false);
      }
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [empresaId]);

  return isLive; // Retorna true si está conectado, false si está offline
};
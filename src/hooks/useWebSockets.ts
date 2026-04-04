import { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export const useWebSockets = (empresaId: number | undefined, topic: string) => {
    const [lastMessage, setLastMessage] = useState<any>(null);

    useEffect(() => {
        if (!empresaId) return;

        // Configuración del cliente STOMP moderno
        const client = new Client({
            brokerURL: 'ws://localhost:8080/ws', // URL para WebSockets puros
            connectHeaders: {},
            debug: (str) => {
                // console.log(str); // Descomenta para ver logs de conexión
            },
            reconnectDelay: 5000, // Reintento automático cada 5 seg
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        // Compatibilidad con SockJS si el servidor no soporta WS puros
        client.webSocketFactory = () => {
            return new SockJS('http://localhost:8080/ws');
        };

        client.onConnect = () => {
            const subscriptionTopic = `/topic/${topic}/${empresaId}`;
            client.subscribe(subscriptionTopic, (payload) => {
                if (payload.body) {
                    setLastMessage(JSON.parse(payload.body));
                }
            });
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        client.activate();

        return () => {
            if (client.active) {
                client.deactivate();
            }
        };
    }, [empresaId, topic]);

    return lastMessage;
};
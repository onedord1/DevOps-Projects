import { useEffect, useCallback } from 'react';
import { wsManager } from '@/lib/websocket';
import type { WebSocketEvent } from '@/types';

export function useWebSocket(
  eventType: string,
  callback: (event: WebSocketEvent) => void
) {
  const handleEvent = useCallback(callback, [callback]);

  useEffect(() => {
    wsManager.on(eventType, handleEvent);

    return () => {
      wsManager.off(eventType, handleEvent);
    };
  }, [eventType, handleEvent]);
}

export function useWebSocketConnection() {
  const getConnectionState = useCallback(() => {
    return wsManager.getConnectionState();
  }, []);

  return { getConnectionState };
}

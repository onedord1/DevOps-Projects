import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { wsManager } from '@/lib/websocket';

export function ConnectionStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(wsManager.getConnectionState());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (status === 'connected') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge
        variant={status === 'connecting' ? 'secondary' : 'destructive'}
        className="flex items-center gap-2 px-3 py-2"
      >
        {status === 'disconnected' ? (
          <WifiOff className="h-4 w-4" />
        ) : (
          <Wifi className="h-4 w-4 animate-pulse" />
        )}
        <span className="capitalize">{status}</span>
      </Badge>
    </div>
  );
}

// src/hooks/useTelegram.ts
import { useEffect, useState, useCallback } from 'react';

export type TelegramUser = {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initDataUnsafe: { user: TelegramUser };
        ready: () => void;
        sendData: (data: string) => void;
      };
    };
  }
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      console.warn('⚠️ Telegram WebApp is not available');
      return;
    }

    tg.ready();
    setUser(tg.initDataUnsafe.user);
  }, []);

  const sendData = useCallback((payload: Record<string, unknown>) => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      console.error('❌ Cannot send data – Telegram WebApp not available');
      return;
    }
    tg.sendData(JSON.stringify(payload));
  }, []);

  return { user, sendData };
}
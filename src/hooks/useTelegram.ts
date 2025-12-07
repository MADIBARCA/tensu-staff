// src/hooks/useTelegram.ts
import { useEffect, useState, useCallback } from 'react';

export type TelegramUser = {
  photo_url?: string;
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
        isVersionAtLeast(arg0: string): unknown;
        disableVerticalSwipes(): unknown;
        expand(): unknown;
        initData: string;
        initDataUnsafe: { user: TelegramUser };
        ready: () => void;
        sendData: (data: string) => void;
        showAlert: (message: string) => void;
        openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
      };
    };
  }
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initDataRaw, setInitDataRaw] = useState<string | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      console.warn('⚠️ Telegram WebApp is not available');
      return;
    }

    tg.ready();
    setUser(tg.initDataUnsafe.user);
    setInitDataRaw(tg.initData || null);
  }, []);

  const sendData = useCallback((payload: Record<string, unknown>) => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      console.error('❌ Cannot send data – Telegram WebApp not available');
      return;
    }
    tg.sendData(JSON.stringify(payload));
  }, []);

  return { user, sendData, initDataRaw };
}

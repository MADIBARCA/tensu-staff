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

export type ContactRequestResult = {
  status: string;
  response?: string;
  responseUnsafe?: {
    contact?: {
      phone_number?: string;
      first_name?: string;
      last_name?: string;
      user_id?: number;
    };
  };
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
        showConfirm?: (message: string, callback: (confirmed: boolean) => void) => void;
        openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
        requestContact?: (callback: (granted: boolean, result: ContactRequestResult) => void) => void;
        close?: () => void;
        MainButton?: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          setText: (text: string) => void;
          setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
        };
        BackButton?: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        themeParams?: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        colorScheme?: 'light' | 'dark';
        platform?: string;
        version?: string;
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

  const requestContact = useCallback((callback: (granted: boolean, result: ContactRequestResult) => void) => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.requestContact) {
      console.error('❌ requestContact is not available');
      callback(false, { status: 'error' });
      return;
    }
    tg.requestContact(callback);
  }, []);

  const showAlert = useCallback((message: string) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.showAlert) {
      tg.showAlert(message);
    } else {
      alert(message);
    }
  }, []);

  const showConfirm = useCallback((message: string, callback: (confirmed: boolean) => void) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.showConfirm) {
      tg.showConfirm(message, callback);
    } else {
      callback(confirm(message));
    }
  }, []);

  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.HapticFeedback) return;
    
    if (type === 'light' || type === 'medium' || type === 'heavy') {
      tg.HapticFeedback.impactOccurred(type);
    } else if (type === 'success' || type === 'error' || type === 'warning') {
      tg.HapticFeedback.notificationOccurred(type);
    } else if (type === 'selection') {
      tg.HapticFeedback.selectionChanged();
    }
  }, []);

  const webApp = window.Telegram?.WebApp;

  return { 
    user, 
    sendData, 
    initDataRaw, 
    requestContact,
    showAlert,
    showConfirm,
    hapticFeedback,
    webApp,
    platform: webApp?.platform,
    colorScheme: webApp?.colorScheme,
    themeParams: webApp?.themeParams,
  };
}

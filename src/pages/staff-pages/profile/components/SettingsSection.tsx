import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/Layout';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';
import { Bell, MapPin, Globe, HelpCircle, FileText, Shield, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Lang = 'ru' | 'kk' | 'en';

// Helper to get Telegram WebApp safely
const getTelegramWebApp = () => window.Telegram?.WebApp;

// Helper to show alert
const showTelegramAlert = (message: string) => {
  const tg = getTelegramWebApp();
  if (tg?.showAlert) {
    tg.showAlert(message);
  } else {
    alert(message);
  }
};

// Helper to open link
const openTelegramLink = (url: string) => {
  const tg = getTelegramWebApp();
  if (tg?.openLink) {
    tg.openLink(url);
  } else {
    window.open(url, '_blank');
  }
};

export const SettingsSection: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [locationAccess, setLocationAccess] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    // Check current notification permission status
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
    
    // Check current geolocation permission status
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationAccess(result.state === 'granted');
        
        result.onchange = () => {
          setLocationAccess(result.state === 'granted');
        };
      }).catch(() => {
        // Some browsers don't support permissions API for geolocation
        const savedLocation = localStorage.getItem('location_access');
        setLocationAccess(savedLocation === 'true');
      });
    }
  }, []);

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (!('Notification' in window)) {
      showTelegramAlert(t('settings.notificationsNotSupported'));
      return;
    }
    
    setNotificationLoading(true);
    
    try {
      if (enabled) {
        // Request notification permission
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          localStorage.setItem('notifications_enabled', 'true');
          
          // Show test notification
          new Notification('Tensu', {
            body: t('settings.notificationsEnabled'),
            icon: '/favicon.ico',
          });
        } else if (permission === 'denied') {
          setNotificationsEnabled(false);
          localStorage.setItem('notifications_enabled', 'false');
          showTelegramAlert(t('settings.notificationsDenied'));
        }
      } else {
        // User wants to disable - we can't revoke, but we can remember their preference
        setNotificationsEnabled(false);
        localStorage.setItem('notifications_enabled', 'false');
      }
    } catch (error) {
      console.error('Error handling notifications:', error);
      showTelegramAlert(t('settings.notificationsError'));
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleLocationToggle = async (enabled: boolean) => {
    if (!('geolocation' in navigator)) {
      showTelegramAlert(t('settings.locationNotSupported'));
      return;
    }
    
    setLocationLoading(true);
    
    try {
      if (enabled) {
        // Request geolocation permission by trying to get position
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationAccess(true);
            localStorage.setItem('location_access', 'true');
            localStorage.setItem('last_latitude', position.coords.latitude.toString());
            localStorage.setItem('last_longitude', position.coords.longitude.toString());
            setLocationLoading(false);
            
            // Optionally show success message
            showTelegramAlert(
              `${t('settings.locationEnabled')}\n${t('settings.locationCoords')}: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
            );
          },
          (error) => {
            setLocationAccess(false);
            localStorage.setItem('location_access', 'false');
            setLocationLoading(false);
            
            if (error.code === error.PERMISSION_DENIED) {
              showTelegramAlert(t('settings.locationDenied'));
            } else {
              showTelegramAlert(t('settings.locationError'));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        // User wants to disable location
        setLocationAccess(false);
        localStorage.setItem('location_access', 'false');
        localStorage.removeItem('last_latitude');
        localStorage.removeItem('last_longitude');
        setLocationLoading(false);
      }
    } catch (error) {
      console.error('Error handling location:', error);
      setLocationLoading(false);
      showTelegramAlert(t('settings.locationError'));
    }
  };

  const handleLanguageChange = (newLang: Lang) => {
    setLang(newLang);
    setShowLangModal(false);
  };

  const getLanguageLabel = () => {
    switch (lang) {
      case 'ru': return t('language.russian');
      case 'kk': return t('language.kazakh');
      case 'en': return t('language.english');
      default: return t('language.russian');
    }
  };

  return (
    <div className="mb-4">
      <SectionHeader title={t('profile.settings')} />
      <Card>
        <div className="space-y-0">
          {/* Notifications */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{t('settings.notifications')}</p>
                <p className="text-xs text-gray-500">
                  {notificationsEnabled 
                    ? t('settings.notificationsEnabled') 
                    : t('settings.notificationsDisabled')
                  }
                </p>
              </div>
            </div>
            {notificationLoading ? (
              <Loader2 size={20} className="animate-spin text-blue-500" />
            ) : (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => handleNotificationsToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            )}
          </div>

          {/* Geolocation */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{t('settings.geolocation')}</p>
                <p className="text-xs text-gray-500">
                  {locationAccess 
                    ? t('settings.geolocationEnabled') 
                    : t('settings.geolocationDisabled')
                  }
                </p>
              </div>
            </div>
            {locationLoading ? (
              <Loader2 size={20} className="animate-spin text-blue-500" />
            ) : (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={locationAccess}
                  onChange={(e) => handleLocationToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            )}
          </div>

          {/* Language */}
          <button
            onClick={() => setShowLangModal(true)}
            className="w-full flex items-center justify-between py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{t('settings.language')}</p>
                <p className="text-xs text-gray-500">{getLanguageLabel()}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>

          {/* Support */}
          <button
            onClick={() => openTelegramLink('https://t.me/tensuadmin')}
            className="w-full flex items-center justify-between py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <HelpCircle size={20} className="text-gray-400" />
              <p className="font-medium text-gray-900">{t('settings.support')}</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>

          {/* Privacy Policy */}
          <button
            onClick={() => navigate('/privacy')}
            className="w-full flex items-center justify-between py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-gray-400" />
              <p className="font-medium text-gray-900">{t('settings.privacy')}</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>

          {/* Terms of Service */}
          <button
            onClick={() => openTelegramLink('https://tensu.kz/terms')}
            className="w-full flex items-center justify-between py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-gray-400" />
              <p className="font-medium text-gray-900">{t('settings.terms')}</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>
      </Card>

      {/* Language Selection Modal */}
      {showLangModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end">
          <div className="bg-white w-full rounded-t-xl p-4 pb-8">
            <h3 className="text-lg font-semibold mb-4">{t('language.change')}</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleLanguageChange('ru')}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  lang === 'ru'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium">🇷🇺 {t('language.russian')}</p>
              </button>
              <button
                onClick={() => handleLanguageChange('kk')}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  lang === 'kk'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium">🇰🇿 {t('language.kazakh')}</p>
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  lang === 'en'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium">🇺🇸 {t('language.english')}</p>
              </button>
            </div>
            <button
              onClick={() => setShowLangModal(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/Layout';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';
import { Bell, MapPin, Globe, HelpCircle, FileText, Shield, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SettingsSection: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationAccess, setLocationAccess] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  useEffect(() => {
    // Load settings from API or localStorage
    const savedNotifications = localStorage.getItem('notifications_enabled');
    const savedLocation = localStorage.getItem('location_access');
    
    if (savedNotifications !== null) {
      setNotificationsEnabled(savedNotifications === 'true');
    }
    if (savedLocation !== null) {
      setLocationAccess(savedLocation === 'true');
    }
  }, []);

  const handleNotificationsToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('notifications_enabled', enabled.toString());
    // TODO: Save to API
    // await studentsApi.updatePreferences({ notifications_enabled: enabled }, token);
  };

  const handleLocationToggle = async (enabled: boolean) => {
    setLocationAccess(enabled);
    localStorage.setItem('location_access', enabled.toString());
    // TODO: Request geolocation permission and save to API
    // await studentsApi.updatePreferences({ location_access: enabled }, token);
  };

  const handleLanguageChange = (newLang: 'ru' | 'kk') => {
    setLang(newLang);
    setShowLangModal(false);
    // Language is saved automatically in i18n provider
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
                <p className="text-xs text-gray-500">{t('settings.notifications.desc')}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => handleNotificationsToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {/* Geolocation */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{t('settings.location')}</p>
                <p className="text-xs text-gray-500">{t('settings.location.desc')}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={locationAccess}
                onChange={(e) => handleLocationToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
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
                <p className="text-xs text-gray-500">
                  {lang === 'ru' ? t('language.russian') : t('language.kazakh')}
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>

          {/* Support */}
          <button
            onClick={() => {
              // TODO: Open WhatsApp or Telegram support
              const tg = window.Telegram?.WebApp;
              if (tg?.openLink) {
                tg.openLink('https://wa.me/77771234567'); // Replace with actual support number
              }
            }}
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
            onClick={() => {
              // TODO: Navigate to terms page
              const tg = window.Telegram?.WebApp;
              if (tg?.openLink) {
                tg.openLink('https://tensu.kz/terms'); // Replace with actual terms URL
              }
            }}
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
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-xl p-4">
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
                <p className="font-medium">{t('language.russian')}</p>
              </button>
              <button
                onClick={() => handleLanguageChange('kk')}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  lang === 'kk'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium">{t('language.kazakh')}</p>
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

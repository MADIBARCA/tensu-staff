import React, { useEffect, useState } from 'react';
// import { useI18n } from '@/i18n/i18n';
import { Layout, PageContainer } from '@/components/Layout';
import { notificationsApi } from '@/functions/axios/axiosFunctions';
import { Bell, Check, Clock, Info, AlertTriangle, Snowflake } from 'lucide-react';
import { toast } from 'react-toastify';
import SwipeableNotification from '@/components/SwipeableNotification';

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata_json?: {
    type: string;
    student_id?: number;
    group_id?: number;
    days?: number;
  };
}

const NotificationsPage: React.FC = () => {
  // const { t } = useI18n(); // Removed unused hook
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);

  const fetchNotifications = async () => {
    try {
      const tg = window.Telegram?.WebApp;
      if (tg?.initData) {
        setLoading(true);
        const response = await notificationsApi.getList({ limit: 50 }, tg.initData);

        const list = response.data || response;
        setNotifications(Array.isArray(list) ? list : []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      toast.error('Не удалось загрузить уведомления');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const tg = window.Telegram?.WebApp;
      if (tg?.initData) {
        setMarkingRead(true);
        await notificationsApi.markAllAsRead(tg.initData);
        // Optimistically update UI
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        toast.success('Все уведомления прочитаны');
      }
    } catch (error) {
      console.error('Failed to mark all as read', error);
    } finally {
      setMarkingRead(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const tg = window.Telegram?.WebApp;
      if (tg?.initData) {
        await notificationsApi.markAsRead(id, tg.initData);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const tg = window.Telegram?.WebApp;
      if (tg?.initData) {
        await notificationsApi.delete(id, tg.initData);
        // Optimistically remove from UI
        setNotifications(prev => prev.filter(n => n.id !== id));
        toast.success('Уведомление удалено');
      }
    } catch (error) {
      console.error('Failed to delete notification', error);
      toast.error('Не удалось удалить уведомление');
      throw error; // Re-throw to let SwipeableNotification handle it
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'membership_freeze':
        return <Snowflake size={20} className="text-blue-500" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-orange-500" />;
      default:
        return <Info size={20} className="text-gray-500" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    
    return date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
    });
  };

  return (
    <Layout title="Уведомления" showBackButton>
      <PageContainer>
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {notifications.filter(n => !n.is_read).length} новых
          </p>
          {notifications.some(n => !n.is_read) && (
            <button 
              onClick={handleMarkAllRead}
              disabled={markingRead}
              className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
            >
              <Check size={16} />
              Прочитать все
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Bell size={48} className="mx-auto mb-3 opacity-20" />
            <p>Нет уведомлений</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <SwipeableNotification
                key={notification.id}
                onDelete={() => handleDelete(notification.id)}
                notificationTitle={notification.title}
                onContentClick={() => {
                  if (!notification.is_read) {
                    handleMarkAsRead(notification.id);
                  }
                }}
              >
                <div 
                className={`
                  relative bg-white rounded-xl p-4 border transition-all
                  ${notification.is_read ? 'border-gray-100' : 'border-blue-100 shadow-sm bg-blue-50/10'}
                `}
              >
                {!notification.is_read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
                )}
                
                <div className="flex gap-4">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center shrink-0
                    ${notification.is_read ? 'bg-gray-100' : 'bg-white shadow-sm'}
                  `}>
                    {getIcon(notification.metadata_json?.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 pr-4">
                      <h3 className={`font-medium text-sm ${notification.is_read ? 'text-gray-900' : 'text-blue-900'}`}>
                        {notification.title}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={12} />
                      {formatTime(notification.created_at)}
                    </div>
                  </div>
                </div>
              </div>
              </SwipeableNotification>
            ))}
          </div>
        )}
      </PageContainer>
    </Layout>
  );
};

export default NotificationsPage;

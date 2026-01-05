// src/components/Layout.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n/i18n";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  User,
  Settings,
  type LucideIcon,
  ChevronLeft,
  Bell,
} from "lucide-react";
import { notificationsApi } from "@/functions/axios/axiosFunctions";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  actions?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  showBackButton = false,
  actions,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const tg = window.Telegram?.WebApp;
      if (tg?.initData) {
        const response = await notificationsApi.getUnreadCount(tg.initData);
        const count = typeof response === 'number' ? response : (response?.data ?? 0);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  }, []);

  useEffect(() => {
    // Fetch on mount
    fetchUnreadCount();
    
    // Refetch every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Refetch when navigating away from notifications page
  useEffect(() => {
    if (location.pathname !== '/staff/notifications') {
      fetchUnreadCount();
    }
  }, [location.pathname, fetchUnreadCount]);

  const navItems: NavItem[] = [
    { icon: Home, label: t('nav.home'), path: "/staff/main" },
    { icon: Users, label: t('nav.students'), path: "/staff/students" },
    { icon: Settings, label: t('nav.management'), path: "/staff/management" },
    { icon: User, label: t('nav.profile'), path: "/staff/profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      {title && (
        <header className="bg-white border-b border-gray-100 sticky z-20">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {showBackButton && (
                  <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              </div>
              
              <div className="flex items-center gap-2">
                {!actions && !showBackButton && (
                  <button
                    onClick={() => navigate('/staff/notifications')}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                )}
                {actions && (
                  <div className="flex items-center gap-2">{actions}</div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  flex flex-col items-center py-2 px-3 rounded-lg
                  transition-all duration-200
                  ${
                    isActive
                      ? "text-blue-600"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }
                `}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className={`text-xs mt-1 ${isActive ? "font-medium" : ""}`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

// Page Container for consistent padding
export const PageContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return <div className={`px-4 py-4 ${className}`}>{children}</div>;
};

// Section Header Component
interface SectionHeaderProps {
  title: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  action,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          {action.icon && <action.icon size={16} />}
          {action.label}
        </button>
      )}
    </div>
  );
};

// src/components/Layout.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, BarChart2, User, type LucideIcon, ChevronLeft } from 'lucide-react';

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
  actions 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems: NavItem[] = [
    { icon: Home, label: 'Главная', path: '/coach/main' },
    { icon: Users, label: 'Студенты', path: '/coach/students' },
    { icon: BarChart2, label: 'Управление', path: '/coach/management' },
    { icon: User, label: 'Профиль', path: '/coach/profile' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      {title && (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
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
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </div>
        </header>
      )}
      
      {/* Main Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>
      
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
                  ${isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>
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
export const PageContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`px-4 py-4 ${className}`}>
      {children}
    </div>
  );
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

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action }) => {
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

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const items = [
    { icon: <Home size={20} />, label: 'Главная', path: '/coach/main' },
    { icon: <Users size={20} />, label: 'Мои студенты', path: '/coach/students' },
    { icon: <BarChart2 size={20} />, label: 'Управление', path: '/coach/management', active: true },
    { icon: <User size={20} />, label: 'Профиль', path: '/coach/profile' }
  ];

  return (
    <nav className="h-16 bg-white shadow-t flex justify-around items-center fixed bottom-0 z-10 w-full">
      {items.map(item => (
        <button
          key={item.label}
          className={`flex flex-col items-center ${item.active ? 'text-blue-600' : 'text-gray-400'}`}
          onClick={() => navigate(item.path)}
        >
          {item.icon}
          <span className="text-xs">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
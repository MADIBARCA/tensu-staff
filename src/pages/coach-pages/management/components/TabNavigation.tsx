import React from 'react';
import { Users, Settings } from 'lucide-react';

type Tab = 'staff' | 'sections';

interface TabNavigationProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onChange }) => (
  <div className="flex mb-4">
    <button
      onClick={() => onChange('staff')}
      className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg transition-colors ${
        activeTab === 'staff'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <Users size={16} /> Staff
      </div>
    </button>
    <button
      onClick={() => onChange('sections')}
      className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg transition-colors ${
        activeTab === 'sections'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <Settings size={16} /> Sections
      </div>
    </button>
  </div>
);

export default TabNavigation;
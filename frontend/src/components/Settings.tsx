import { useState, useEffect } from 'react';
import { CategoryManagement } from './CategoryManagement';
import { PeriodManagement } from './PeriodManagement';
import { IncomeTypeManagement } from './IncomeTypeManagement';
import { UserManagement } from './UserManagement';
import { ChangePassword } from './ChangePassword';
import { useAuth } from '../contexts/AuthContext';

type SettingsTab = 'categories' | 'periods' | 'income-types' | 'users' | 'password';

export const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('categories');

  // Filter tabs based on admin status
  const allTabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'periods', label: 'Periods', icon: '📅' },
    { id: 'income-types', label: 'Income Types', icon: '💵' },
    { id: 'password', label: 'Change Password', icon: '🔒' },
    { id: 'users', label: 'Users', icon: '👥' },
  ];

  const tabs = allTabs.filter((tab) => {
    if (tab.id === 'users') {
      return user?.is_admin === true;
    }
    return true;
  });

  // Reset to first available tab if current tab is not available
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-hidden">
      <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Manage your categories, periods, and users
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <nav
          className="flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0 px-4 sm:px-6"
          aria-label="Tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap
                transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <span className="text-base sm:text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'categories' && <CategoryManagement />}
        {activeTab === 'periods' && <PeriodManagement />}
        {activeTab === 'income-types' && <IncomeTypeManagement />}
        {activeTab === 'password' && <ChangePassword />}
        {activeTab === 'users' && <UserManagement />}
      </div>
    </div>
  );
};

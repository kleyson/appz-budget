import { useState, useEffect } from 'react';
import { CategoryManagement } from './CategoryManagement';
import { PeriodManagement } from './PeriodManagement';
import { IncomeTypeManagement } from './IncomeTypeManagement';
import { UserManagement } from './UserManagement';
import { ChangePassword } from './ChangePassword';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, UnderlineTabs, PageTitle } from './shared';
import type { Tab } from './shared';

type SettingsTab = 'categories' | 'periods' | 'income-types' | 'users' | 'password';

export const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('categories');

  const allTabs: (Tab & { id: SettingsTab })[] = [
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'periods', label: 'Periods', icon: '📅' },
    { id: 'income-types', label: 'Income Types', icon: '💵' },
    { id: 'password', label: 'Password', icon: '🔒' },
    { id: 'users', label: 'Users', icon: '👥' },
  ];

  const tabs = allTabs.filter((tab) => {
    if (tab.id === 'users') {
      return user?.is_admin === true;
    }
    return true;
  });

  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  return (
    <Card>
      <CardHeader>
        <PageTitle subtitle="Manage your categories, periods, and users">Settings</PageTitle>
      </CardHeader>

      <UnderlineTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as SettingsTab)}
      />

      <div className="overflow-x-hidden">
        {activeTab === 'categories' && <CategoryManagement />}
        {activeTab === 'periods' && <PeriodManagement />}
        {activeTab === 'income-types' && <IncomeTypeManagement />}
        {activeTab === 'password' && <ChangePassword />}
        {activeTab === 'users' && <UserManagement />}
      </div>
    </Card>
  );
};

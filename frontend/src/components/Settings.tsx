import { useState, useEffect } from 'react';
import { CategoryManagement } from './CategoryManagement';
import { PeriodManagement } from './PeriodManagement';
import { IncomeTypeManagement } from './IncomeTypeManagement';
import { UserManagement } from './UserManagement';
import { ChangePassword } from './ChangePassword';
import { PasswordResetManagement } from './PasswordResetManagement';
import { useAuth } from '../contexts/AuthContext';
import {
  Card,
  CardHeader,
  UnderlineTabs,
  PageTitle,
  TagIcon,
  CalendarIcon,
  DollarIcon,
  LockIcon,
  UsersIcon,
  KeyIcon,
} from './shared';
import type { Tab } from './shared';

type SettingsTab =
  | 'categories'
  | 'periods'
  | 'income-types'
  | 'users'
  | 'password'
  | 'password-resets';

export const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('categories');

  const allTabs: (Tab & { id: SettingsTab })[] = [
    { id: 'categories', label: 'Categories', icon: <TagIcon /> },
    { id: 'periods', label: 'Periods', icon: <CalendarIcon /> },
    { id: 'income-types', label: 'Income Types', icon: <DollarIcon /> },
    { id: 'password', label: 'Password', icon: <LockIcon /> },
    { id: 'users', label: 'Users', icon: <UsersIcon /> },
    { id: 'password-resets', label: 'Password Resets', icon: <KeyIcon /> },
  ];

  const tabs = allTabs.filter((tab) => {
    if (tab.id === 'users' || tab.id === 'password-resets') {
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
        {activeTab === 'password-resets' && <PasswordResetManagement />}
      </div>
    </Card>
  );
};

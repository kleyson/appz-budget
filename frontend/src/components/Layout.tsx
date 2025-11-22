import { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';

type TabId = 'expenses' | 'import' | 'settings';

interface LayoutProps {
  children: ReactNode;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  filters?: ReactNode;
}

export const Layout = ({ children, activeTab, setActiveTab, filters }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Filters bar */}
        {filters && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 lg:px-6">
            <div className="flex flex-wrap gap-4">{filters}</div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

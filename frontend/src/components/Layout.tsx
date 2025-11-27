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
    <div className="flex h-screen relative">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Mobile header with hamburger menu */}
        <header className="lg:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/25">
              <span className="text-lg">💰</span>
            </div>
            <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Appz Budget
            </h1>
          </div>
          <div className="w-10" />
        </header>

        {/* Filters bar */}
        {filters && (
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50 px-4 py-4 lg:px-6">
            <div className="flex flex-wrap gap-4">{filters}</div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

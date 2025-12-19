import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { APP_VERSION } from '../utils/version';
import {
  DollarIcon,
  BarChartIcon,
  DatabaseIcon,
  UploadIcon,
  SettingsIcon,
  CloseIcon,
  SunIcon,
  MoonIcon,
  LogoutIcon,
} from './shared';

type TabId = 'expenses' | 'reports' | 'backup' | 'import' | 'settings';

interface MenuItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const menuItems: MenuItem[] = [
  {
    id: 'expenses',
    label: 'Monthly Budget',
    icon: <DollarIcon />,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <BarChartIcon />,
  },
  {
    id: 'backup',
    label: 'Backup',
    icon: <DatabaseIcon />,
  },
  {
    id: 'import',
    label: 'Import',
    icon: <UploadIcon />,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <SettingsIcon />,
  },
];

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) => {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
          border-r border-slate-200/80 dark:border-slate-800/80
          z-50 transform transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Appz Budget
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">v{APP_VERSION}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200 ease-out
                animate-slide-in-left opacity-0
                ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }
              `}
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
            >
              <span
                className={
                  activeTab === item.id ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                }
              >
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
              {activeTab === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
          {/* User info */}
          {user && (
            <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {user.full_name || user.email}
                  </p>
                  {user.full_name && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all duration-200"
          >
            {theme === 'dark' ? (
              <>
                <SunIcon className="w-5 h-5 text-amber-500" />
                <span className="font-medium">Light Mode</span>
              </>
            ) : (
              <>
                <MoonIcon className="w-5 h-5 text-primary-500" />
                <span className="font-medium">Dark Mode</span>
              </>
            )}
            <div className="ml-auto">
              <div
                className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ${theme === 'dark' ? 'bg-primary-500' : 'bg-slate-300'}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </div>
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all duration-200"
          >
            <LogoutIcon />
            <span className="font-medium">Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

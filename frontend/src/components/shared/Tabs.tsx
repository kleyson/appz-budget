import { ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs = ({ tabs, activeTab, onChange, className = '' }: TabsProps) => {
  return (
    <div className={`tabs-container ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`tab-item ${activeTab === tab.id ? 'tab-item-active' : 'tab-item-inactive'}`}
        >
          {tab.icon && (
            <span className={activeTab === tab.id ? 'text-primary-500' : ''}>{tab.icon}</span>
          )}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

interface UnderlineTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const UnderlineTabs = ({ tabs, activeTab, onChange, className = '' }: UnderlineTabsProps) => {
  return (
    <div className={`border-b border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="overflow-x-auto scrollbar-hide">
        <nav className="flex px-4 sm:px-6" style={{ minWidth: 'max-content' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap
                transition-colors flex-shrink-0
                ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                }
              `}
            >
              {tab.icon && <span className="text-base sm:text-lg">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

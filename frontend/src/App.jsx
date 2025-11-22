import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ExpenseList } from './components/ExpenseList';
import { CategorySummary } from './components/CategorySummary';
import { Charts } from './components/Charts';
import { ExcelImport } from './components/ExcelImport';
import { CategoryManagement } from './components/CategoryManagement';
import { PeriodManagement } from './components/PeriodManagement';
import { usePeriods } from './hooks/usePeriods';
import { useCategories } from './hooks/useCategories';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppContent = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState('expenses');
  const { data: periods } = usePeriods();
  const { data: categories } = useCategories();

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Budget Manager</h1>
        <nav className="tabs">
          <button
            className={activeTab === 'expenses' ? 'active' : ''}
            onClick={() => setActiveTab('expenses')}
          >
            Expenses
          </button>
          <button
            className={activeTab === 'summary' ? 'active' : ''}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={activeTab === 'charts' ? 'active' : ''}
            onClick={() => setActiveTab('charts')}
          >
            Charts
          </button>
          <button
            className={activeTab === 'import' ? 'active' : ''}
            onClick={() => setActiveTab('import')}
          >
            Import
          </button>
          <button
            className={activeTab === 'categories' ? 'active' : ''}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
          <button
            className={activeTab === 'periods' ? 'active' : ''}
            onClick={() => setActiveTab('periods')}
          >
            Periods
          </button>
        </nav>
      </header>

      {(activeTab === 'expenses' || activeTab === 'summary' || activeTab === 'charts') && (
        <div className="filters">
          <div className="filter-group">
            <label>Filter by Period:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="">All Periods</option>
              {periods?.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Filter by Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <main className="app-main">
        {activeTab === 'expenses' && (
          <ExpenseList
            periodFilter={selectedPeriod || null}
            categoryFilter={selectedCategory || null}
          />
        )}
        {activeTab === 'summary' && (
          <CategorySummary periodFilter={selectedPeriod || null} />
        )}
        {activeTab === 'charts' && (
          <Charts periodFilter={selectedPeriod || null} />
        )}
        {activeTab === 'import' && <ExcelImport />}
        {activeTab === 'categories' && <CategoryManagement />}
        {activeTab === 'periods' && <PeriodManagement />}
      </main>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;

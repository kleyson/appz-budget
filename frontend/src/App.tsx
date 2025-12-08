import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DialogProvider } from './contexts/DialogContext';
import { Layout } from './components/Layout';
import { MonthlyBudget } from './components/MonthlyBudget';
import { Reports } from './components/Reports';
import { ExcelImport } from './components/ExcelImport';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

type TabId = 'expenses' | 'reports' | 'import' | 'settings';
type AuthView = 'login' | 'forgot-password' | 'reset-password';

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('expenses');
  const [authView, setAuthView] = useState<AuthView>('login');

  // Check for reset password token in URL
  useEffect(() => {
    if (!isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const resetToken = params.get('token');
      if (resetToken) {
        setAuthView('reset-password');
      }
    }
  }, [isAuthenticated]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-xl shadow-primary-500/30 animate-pulse">
            <span className="text-3xl">💰</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    if (authView === 'login') {
      return <Login onSwitchToForgotPassword={() => setAuthView('forgot-password')} />;
    }
    if (authView === 'forgot-password') {
      return <ForgotPassword onSwitchToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'reset-password') {
      const params = new URLSearchParams(window.location.search);
      const resetToken = params.get('token') || undefined;
      return <ResetPassword token={resetToken} onSwitchToLogin={() => setAuthView('login')} />;
    }
  }

  // Show main app if authenticated
  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} filters={null}>
      {activeTab === 'expenses' && <MonthlyBudget />}
      {activeTab === 'reports' && <Reports />}
      {activeTab === 'import' && <ExcelImport />}
      {activeTab === 'settings' && <Settings />}
    </Layout>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DialogProvider>
          <AuthProvider>
            <AppContent />
            <ReactQueryDevtools initialIsOpen={false} />
          </AuthProvider>
        </DialogProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

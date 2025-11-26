import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DialogProvider } from './contexts/DialogContext';
import { Layout } from './components/Layout';
import { MonthlyBudget } from './components/MonthlyBudget';
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

type TabId = 'expenses' | 'import' | 'settings';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
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

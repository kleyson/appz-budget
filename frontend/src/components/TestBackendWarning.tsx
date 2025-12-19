import { useState } from 'react';

const GITHUB_REPO_URL = 'https://github.com/kleyson/appz-budget#quick-start-with-docker';
const TEST_BACKEND_HOST = 'budget.appz.wtf';

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const WarningIcon = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg
    className="w-4 h-4 ml-1"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

/**
 * Detects if the app is connected to the test/demo backend.
 * Checks if the current hostname is the test backend.
 */
const isTestBackend = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === TEST_BACKEND_HOST;
};

/**
 * Warning banner displayed when connected to the test/demo backend.
 * Warns users not to save personal data and provides self-hosting link.
 * Dismissible per session (reappears on page refresh).
 */
export const TestBackendWarning = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't render if not on test backend or if dismissed
  if (!isTestBackend() || isDismissed) {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700/50">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex items-start gap-3">
          {/* Warning Icon */}
          <div className="text-amber-600 dark:text-amber-400 mt-0.5">
            <WarningIcon />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Demo Server - Do Not Store Personal Data
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300/90">
              This is a public test server. Data may be deleted at any time without notice. For
              personal use,{' '}
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100 inline-flex items-center transition-colors"
              >
                self-host your own instance
                <ExternalLinkIcon />
              </a>
            </p>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="flex-shrink-0 p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/50 hover:text-amber-800 dark:hover:text-amber-200 transition-colors cursor-pointer"
            aria-label="Dismiss warning"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

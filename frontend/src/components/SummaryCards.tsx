import { useSummaryTotals } from '../hooks/useSummary';
import { formatCurrency } from '../utils/format';

interface SummaryCardsProps {
  periodFilter?: string | null;
  monthId?: number | null;
}

export const SummaryCards = ({ periodFilter = null, monthId = null }: SummaryCardsProps) => {
  const { data: totals, isLoading } = useSummaryTotals({ period: periodFilter, month_id: monthId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
          <span>Loading summary...</span>
        </div>
      </div>
    );
  }

  if (!totals) {
    return null;
  }

  const cards = [
    {
      title: 'Budgeted Expenses',
      value: totals.total_budgeted_expenses,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      colorClass: 'from-blue-500 to-blue-600',
      bgClass: 'bg-blue-500/10 dark:bg-blue-500/20',
      textClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Actual Expenses',
      value: totals.total_current_expenses,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
          />
        </svg>
      ),
      colorClass: 'from-red-500 to-red-600',
      bgClass: 'bg-red-500/10 dark:bg-red-500/20',
      textClass: 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Budgeted Income',
      value: totals.total_budgeted_income,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      colorClass: 'from-cyan-500 to-cyan-600',
      bgClass: 'bg-cyan-500/10 dark:bg-cyan-500/20',
      textClass: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      title: 'Actual Income',
      value: totals.total_current_income,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      colorClass: 'from-emerald-500 to-emerald-600',
      bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      textClass: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Budgeted Balance',
      value: totals.total_budgeted,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
          />
        </svg>
      ),
      colorClass:
        totals.total_budgeted >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600',
      bgClass:
        totals.total_budgeted >= 0
          ? 'bg-emerald-500/10 dark:bg-emerald-500/20'
          : 'bg-red-500/10 dark:bg-red-500/20',
      textClass:
        totals.total_budgeted >= 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Actual Balance',
      value: totals.total_current,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      colorClass:
        totals.total_current >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600',
      bgClass:
        totals.total_current >= 0
          ? 'bg-emerald-500/10 dark:bg-emerald-500/20'
          : 'bg-red-500/10 dark:bg-red-500/20',
      textClass:
        totals.total_current >= 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="p-5 lg:p-6">
      <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Overview
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <div
            key={card.title}
            className="group relative bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-5 card-hover animate-slide-up opacity-0"
            style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
          >
            {/* Gradient accent line */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r ${card.colorClass} opacity-80`}
            />

            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${card.bgClass}`}>
                <span className={card.textClass}>{card.icon}</span>
              </div>
              {card.value !== 0 && (
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${card.bgClass} ${card.textClass}`}
                >
                  {card.value > 0 ? '+' : ''}
                  {((card.value / (totals.total_budgeted_income || 1)) * 100).toFixed(0)}%
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              {card.title}
            </p>
            <p
              className={`font-display text-2xl font-bold ${card.value === 0 ? 'text-slate-400 dark:text-slate-500' : card.textClass}`}
            >
              {formatCurrency(Math.abs(card.value))}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

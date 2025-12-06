import { useSummaryTotals } from '../hooks/useSummary';
import { formatCurrency } from '../utils/format';
import { LoadingState, SectionTitle, ProgressBar } from './shared';

interface SummaryCardsProps {
  periodFilter?: string | null;
  monthId?: number | null;
}

export const SummaryCards = ({ periodFilter = null, monthId = null }: SummaryCardsProps) => {
  const { data: totals, isLoading } = useSummaryTotals({ period: periodFilter, month_id: monthId });

  if (isLoading) {
    return <LoadingState text="Loading summary..." />;
  }

  if (!totals) {
    return null;
  }

  const cards = [
    {
      title: 'Income',
      budgetValue: totals.total_budgeted_income,
      actualValue: totals.total_current_income,
      accentColor: 'success' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
          />
        </svg>
      ),
    },
    {
      title: 'Expenses',
      budgetValue: totals.total_budgeted_expenses,
      actualValue: totals.total_current_expenses,
      accentColor: 'danger' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181"
          />
        </svg>
      ),
    },
    {
      title: 'Balance',
      budgetValue: totals.total_budgeted,
      actualValue: totals.total_current,
      accentColor: (totals.total_current >= 0 ? 'success' : 'danger') as 'success' | 'danger',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"
          />
        </svg>
      ),
    },
  ];

  const getColorClasses = (color: 'success' | 'danger') => ({
    gradient: color === 'success' ? 'from-emerald-400 to-teal-500' : 'from-red-400 to-rose-500',
    bg:
      color === 'success'
        ? 'bg-emerald-500/10 dark:bg-emerald-500/15'
        : 'bg-red-500/10 dark:bg-red-500/15',
    text:
      color === 'success'
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-600 dark:text-red-400',
  });

  return (
    <div className="p-5 lg:p-6">
      <SectionTitle className="mb-4">Overview</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card, index) => {
          const colors = getColorClasses(card.accentColor);
          const percentage =
            card.budgetValue !== 0 ? Math.min((card.actualValue / card.budgetValue) * 100, 100) : 0;
          const displayPercentage =
            card.budgetValue !== 0 ? ((card.actualValue / card.budgetValue) * 100).toFixed(0) : '0';

          return (
            <div
              key={card.title}
              className="group relative bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:border-slate-300/80 dark:hover:border-slate-600/60 animate-slide-up opacity-0"
              style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'forwards' }}
            >
              {/* Subtle gradient background on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`}
              />

              <div className="relative p-5">
                {/* Header: Icon + Title + Percentage */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${colors.bg} ${colors.text} transition-transform duration-300 group-hover:scale-110`}
                    >
                      {card.icon}
                    </div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {card.title}
                    </span>
                  </div>
                  {card.budgetValue !== 0 && (
                    <span className={`text-sm font-semibold tabular-nums ${colors.text}`}>
                      {displayPercentage}%
                    </span>
                  )}
                </div>

                {/* Values */}
                <div className="text-right mb-4">
                  <p
                    className={`font-display text-3xl font-bold tabular-nums tracking-tight ${
                      card.actualValue === 0
                        ? 'text-slate-300 dark:text-slate-600'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {formatCurrency(Math.abs(card.actualValue))}
                  </p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    of{' '}
                    <span className="font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatCurrency(Math.abs(card.budgetValue))}
                    </span>{' '}
                    budgeted
                  </p>
                </div>

                {/* Progress bar */}
                <ProgressBar
                  progress={Math.min(Math.abs(percentage), 100)}
                  color={card.accentColor}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

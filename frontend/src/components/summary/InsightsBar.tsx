import { useInsights } from '../../hooks/useSummary';

interface InsightsBarProps {
  monthId?: number | null;
}

const typeStyles = {
  positive:
    'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300',
  warning:
    'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-300',
  neutral:
    'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300',
};

export const InsightsBar = ({ monthId = null }: InsightsBarProps) => {
  const { data, isLoading } = useInsights({ month_id: monthId });

  if (isLoading || !data || data.insights.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 overflow-x-auto -mx-5 lg:-mx-6 px-5 lg:px-6">
      <div className="flex gap-3 min-w-max pb-2">
        {data.insights.map((insight, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium ${typeStyles[insight.type]}`}
          >
            <span className="text-base flex-shrink-0">{insight.icon}</span>
            <span>{insight.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

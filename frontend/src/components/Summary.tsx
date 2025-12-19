import { useCategorySummary, useCategories } from '../hooks/useCategories';
import { useIncomeTypeSummary, usePeriodSummary } from '../hooks/useSummary';
import { useIncomeTypes } from '../hooks/useIncomeTypes';
import { formatCurrency } from '../utils/format';
import { LoadingState, SectionTitle, ColorChip, Badge } from './shared';

interface SummaryProps {
  periodFilter?: string | null;
  monthId?: number | null;
}

export const Summary = ({ periodFilter = null, monthId = null }: SummaryProps) => {
  const { data: summary, isLoading } = useCategorySummary({
    month_id: monthId,
  });
  const { data: categories } = useCategories();
  const { data: incomeTypeSummary, isLoading: isLoadingIncomeSummary } = useIncomeTypeSummary({
    period: periodFilter,
    month_id: monthId,
  });
  const { data: incomeTypes } = useIncomeTypes();
  const { data: periodSummary, isLoading: isLoadingPeriodSummary } = usePeriodSummary({
    month_id: monthId,
  });

  const getCategoryColor = (categoryName: string): string => {
    const category = categories?.find((c) => c.name === categoryName);
    return category?.color || '#8b5cf6';
  };

  const getIncomeTypeColor = (incomeTypeName: string): string => {
    const incomeType = incomeTypes?.find((it) => it.name === incomeTypeName);
    return incomeType?.color || '#10b981';
  };

  if (isLoading || isLoadingIncomeSummary || isLoadingPeriodSummary) {
    return <LoadingState text="Loading summary..." />;
  }

  return (
    <div className="p-5 lg:p-6">
      <SectionTitle className="mb-4">Summary by Period</SectionTitle>

      <div className="-mx-5 lg:-mx-6 px-5 lg:px-6 overflow-x-auto mb-8">
        {!periodSummary || periodSummary.periods.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p className="text-lg">No period summary data available.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden inline-block min-w-full">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Period</th>
                  <th className="table-header-cell text-right">Income</th>
                  <th className="table-header-cell text-right">Expenses</th>
                  <th className="table-header-cell text-right">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-700/50">
                {periodSummary.periods.map((item) => (
                  <tr key={item.period} className="table-row">
                    <td className="table-cell">
                      <ColorChip color={item.color}>{item.period}</ColorChip>
                    </td>
                    <td
                      className={`table-cell text-right ${
                        item.total_income === 0
                          ? 'text-slate-400 dark:text-slate-500'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatCurrency(item.total_income)}
                    </td>
                    <td
                      className={`table-cell text-right ${
                        item.total_expenses === 0
                          ? 'text-slate-400 dark:text-slate-500'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(item.total_expenses)}
                    </td>
                    <td
                      className={`table-cell text-right font-semibold ${
                        item.difference === 0
                          ? 'text-slate-400 dark:text-slate-500'
                          : item.difference >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(item.difference)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 dark:bg-slate-800/50 font-semibold">
                  <td className="table-cell text-slate-900 dark:text-white">Total</td>
                  <td className="table-cell text-right text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(periodSummary.grand_total_income)}
                  </td>
                  <td className="table-cell text-right text-red-600 dark:text-red-400">
                    {formatCurrency(periodSummary.grand_total_expenses)}
                  </td>
                  <td
                    className={`table-cell text-right ${
                      periodSummary.grand_total_difference >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(periodSummary.grand_total_difference)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SectionTitle className="mb-4">Expenses by Category</SectionTitle>

      <div className="-mx-5 lg:-mx-6 px-5 lg:px-6 overflow-x-auto mb-8">
        {!summary || summary.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p className="text-lg">No category summary data available.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden inline-block min-w-full">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Category</th>
                  <th className="table-header-cell text-right">Budget</th>
                  <th className="table-header-cell text-right">Total</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell text-right">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-700/50">
                {summary?.map((item) => {
                  const difference = item.budget - item.total;
                  const isWithinBudget = !item.over_budget;
                  return (
                    <tr key={item.category} className="table-row">
                      <td className="table-cell">
                        <ColorChip color={getCategoryColor(item.category)}>
                          {item.category}
                        </ColorChip>
                      </td>
                      <td
                        className={`table-cell text-right ${
                          item.budget === 0
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatCurrency(item.budget)}
                      </td>
                      <td
                        className={`table-cell text-right ${
                          item.total === 0
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatCurrency(item.total)}
                      </td>
                      <td className="table-cell">
                        <Badge variant={isWithinBudget ? 'success' : 'danger'}>
                          {isWithinBudget ? 'On Budget' : 'Over Budget'}
                        </Badge>
                      </td>
                      <td
                        className={`table-cell text-right font-semibold ${
                          difference === 0
                            ? 'text-slate-400 dark:text-slate-500'
                            : difference >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {formatCurrency(difference)}
                      </td>
                    </tr>
                  );
                })}
                {(() => {
                  const totalBudget = summary?.reduce((acc, item) => acc + item.budget, 0) || 0;
                  const totalActual = summary?.reduce((acc, item) => acc + item.total, 0) || 0;
                  const totalPaidCapped =
                    summary?.reduce((acc, item) => acc + Math.min(item.total, item.budget), 0) || 0;
                  const diffWithoutOver = totalBudget - totalPaidCapped;
                  const diffWithOver = totalBudget - totalActual;

                  return (
                    <>
                      <tr className="bg-slate-50 dark:bg-slate-800/30 font-medium">
                        <td className="table-cell text-slate-700 dark:text-slate-300">
                          Budget Control
                        </td>
                        <td className="table-cell text-right text-slate-900 dark:text-white">
                          {formatCurrency(totalBudget)}
                        </td>
                        <td className="table-cell text-right text-slate-900 dark:text-white">
                          {formatCurrency(totalPaidCapped)}
                        </td>
                        <td className="table-cell"></td>
                        <td
                          className={`table-cell text-right font-semibold ${
                            diffWithoutOver >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatCurrency(diffWithoutOver)}
                        </td>
                      </tr>
                      <tr className="bg-slate-100 dark:bg-slate-800/50 font-semibold">
                        <td className="table-cell text-slate-900 dark:text-white">
                          Total (with over)
                        </td>
                        <td className="table-cell text-right text-slate-900 dark:text-white">
                          {formatCurrency(totalBudget)}
                        </td>
                        <td className="table-cell text-right text-slate-900 dark:text-white">
                          {formatCurrency(totalActual)}
                        </td>
                        <td className="table-cell"></td>
                        <td
                          className={`table-cell text-right font-semibold ${
                            diffWithOver >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatCurrency(diffWithOver)}
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SectionTitle className="mb-4">Income Summary</SectionTitle>

      <div className="-mx-5 lg:-mx-6 px-5 lg:px-6 overflow-x-auto">
        {!incomeTypeSummary || incomeTypeSummary.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p className="text-lg">No income type summary data available.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden inline-block min-w-full">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Income Type</th>
                  <th className="table-header-cell text-right">Budget</th>
                  <th className="table-header-cell text-right">Total</th>
                  <th className="table-header-cell text-right">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-700/50">
                {incomeTypeSummary?.map((item) => {
                  const difference = item.total - item.budget;
                  return (
                    <tr key={item.income_type} className="table-row">
                      <td className="table-cell">
                        <ColorChip color={getIncomeTypeColor(item.income_type)}>
                          {item.income_type}
                        </ColorChip>
                      </td>
                      <td
                        className={`table-cell text-right ${
                          item.budget === 0
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatCurrency(item.budget)}
                      </td>
                      <td
                        className={`table-cell text-right ${
                          item.total === 0
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatCurrency(item.total)}
                      </td>
                      <td
                        className={`table-cell text-right font-semibold ${
                          difference === 0
                            ? 'text-slate-400 dark:text-slate-500'
                            : difference >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {formatCurrency(difference)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

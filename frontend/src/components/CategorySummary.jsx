import { useCategorySummary } from '../hooks/useCategories';

export const CategorySummary = ({ periodFilter = null }) => {
  const { data: summary, isLoading } = useCategorySummary(periodFilter);

  if (isLoading) {
    return <div className="loading">Loading summary...</div>;
  }

  return (
    <div className="category-summary">
      <h2>Category Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Budget</th>
            <th>Total</th>
            <th>Status</th>
            <th>Difference</th>
          </tr>
        </thead>
        <tbody>
          {summary?.map(item => {
            const difference = item.budget - item.total;
            return (
              <tr key={item.category}>
                <td>{item.category}</td>
                <td>${item.budget.toFixed(2)}</td>
                <td>${item.total.toFixed(2)}</td>
                <td>{item.over_budget ? '✅' : '🔴'}</td>
                <td className={difference >= 0 ? 'positive' : 'negative'}>
                  ${difference.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

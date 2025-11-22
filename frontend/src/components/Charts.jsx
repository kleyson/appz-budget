import { useCategorySummary } from '../hooks/useCategories';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Dracula theme colors for charts
const COLORS = ['#bd93f9', '#ff79c6', '#8be9fd', '#50fa7b', '#ffb86c', '#f1fa8c', '#ff5555'];

// Custom tooltip with Dracula theme
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#44475a',
        border: '1px solid #6272a4',
        borderRadius: '4px',
        padding: '10px',
        color: '#f8f8f2'
      }}>
        <p style={{ margin: '0 0 5px 0', color: '#bd93f9', fontWeight: 'bold' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: '2px 0', color: '#f8f8f2' }}>
            {entry.name}: <span style={{ color: entry.color }}>${entry.value.toFixed(2)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const Charts = ({ periodFilter = null }) => {
  const { data: summary } = useCategorySummary(periodFilter);

  if (!summary || summary.length === 0) {
    return <div className="no-data">No data available for charts</div>;
  }

  const chartData = summary.map(item => ({
    name: item.category,
    budget: item.budget,
    total: item.total,
  }));

  return (
    <div className="charts-container">
      <h2>Budget Analysis</h2>
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Budget vs Actual by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#6272a4" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                stroke="#f8f8f2"
              />
              <YAxis stroke="#f8f8f2" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#f8f8f2' }} />
              <Bar dataKey="budget" fill="#bd93f9" name="Budget" />
              <Bar dataKey="total" fill="#50fa7b" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Budget Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="budget"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

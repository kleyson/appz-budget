import { useMonths } from '../hooks/useMonths';
import { useImport } from '../hooks/useImport';
import { MonthSelect } from './MonthSelect';

export const ExcelImport = () => {
  const { data: months } = useMonths();
  const {
    file,
    message,
    selectedMonthId,
    setSelectedMonthId,
    handleFileChange,
    handleImport,
    isImporting,
    isError,
  } = useImport();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Import from Excel</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Upload an Excel file (.xlsx, .xls) with columns: Expense Name, Period, Category, Budget,
          Cost, Notes
        </p>
      </div>

      <div className="p-6 space-y-4">
        <MonthSelect
          months={months}
          value={selectedMonthId}
          onChange={(monthId) => setSelectedMonthId(monthId)}
          placeholder="Select Month"
          label="Month"
          required
        />

        <div className="flex gap-4 items-center">
          <label className="flex-1">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-600 file:text-white
                hover:file:bg-primary-700
                file:cursor-pointer
                cursor-pointer
                border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700"
            />
          </label>
          <button
            onClick={handleImport}
            disabled={!file || !selectedMonthId || isImporting}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isImporting ? 'Importing...' : 'Import'}
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg border ${
              isError
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

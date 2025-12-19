import type { Period, Category } from '../types';
import { ColorSelect } from './ColorSelect';

interface FilterBarProps {
  periods?: Period[];
  categories?: Category[];
  selectedPeriod: string;
  selectedCategory: string;
  onPeriodChange: (period: string) => void;
  onCategoryChange: (category: string) => void;
  showCategoryFilter?: boolean;
}

export const FilterBar = ({
  periods,
  categories,
  selectedPeriod,
  selectedCategory,
  onPeriodChange,
  onCategoryChange,
  showCategoryFilter = true,
}: FilterBarProps) => {
  const handlePeriodChange = (period: string) => {
    onPeriodChange(period);
    // Clear category when period is selected
    if (period && selectedCategory) {
      onCategoryChange('');
    }
  };

  const handleCategoryChange = (category: string) => {
    onCategoryChange(category);
    // Clear period when category is selected
    if (category && selectedPeriod) {
      onPeriodChange('');
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
          Period:
        </label>
        <ColorSelect
          options={periods?.map((p) => ({ id: p.id, name: p.name, color: p.color })) || []}
          value={selectedPeriod}
          onChange={handlePeriodChange}
          placeholder="All Periods"
          className="min-w-[150px]"
        />
      </div>
      {showCategoryFilter && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Category:
          </label>
          <ColorSelect
            options={categories?.map((c) => ({ id: c.id, name: c.name, color: c.color })) || []}
            value={selectedCategory}
            onChange={handleCategoryChange}
            placeholder="All Categories"
            className="min-w-[150px]"
          />
        </div>
      )}
    </>
  );
};

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors, colors, getShadow, isDarkColor, radius, gradientColors } from "../utils/colors";
import {
  useExpenses,
  useDeleteExpense,
  useCloneExpensesToNextMonth,
  usePayExpense,
} from "../hooks/useExpenses";
import { useIncomes, useDeleteIncome } from "../hooks/useIncomes";
import { useMonths, useCurrentMonth, useDeleteMonth, useCloseMonth, useOpenMonth } from "../hooks/useMonths";
import { usePeriods } from "../hooks/usePeriods";
import { useCategories } from "../hooks/useCategories";
import { useIncomeTypes } from "../hooks/useIncomeTypes";
import { useSummaryTotals } from "../hooks/useSummary";
import { Ionicons } from "@expo/vector-icons";
import { ExpenseFormModal } from "../components/ExpenseFormModal";
import { IncomeFormModal } from "../components/IncomeFormModal";
import { MonthSelector } from "../components/MonthSelector";
import { FilterBar, FilterToggleButton } from "../components/FilterBar";
import { SummaryCards } from "../components/SummaryCards";
import { Summary } from "../components/Summary";
import type {
  Expense,
  Income,
  Category,
  Period,
  IncomeType,
  Month,
} from "../types";

type TabId = "expenses" | "income" | "summary";

export const MonthlyBudgetScreen = () => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMonthId, setSelectedMonthId] = useState<number | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: currentMonth } = useCurrentMonth();
  const { data: periods } = usePeriods();
  const { data: categories } = useCategories();
  const { data: incomeTypes } = useIncomeTypes();
  const { data: months } = useMonths();
  const cloneMutation = useCloneExpensesToNextMonth();
  const deleteExpenseMutation = useDeleteExpense();
  const payExpenseMutation = usePayExpense();
  const deleteIncomeMutation = useDeleteIncome();
  const deleteMonthMutation = useDeleteMonth();
  const closeMonthMutation = useCloseMonth();
  const openMonthMutation = useOpenMonth();

  const { data: expenses, isLoading: expensesLoading } = useExpenses({
    period: selectedPeriod || null,
    category: selectedCategory || null,
    month_id: selectedMonthId,
  });

  const { data: incomes, isLoading: incomesLoading } = useIncomes({
    period: selectedPeriod || null,
    month_id: selectedMonthId,
  });

  const { data: summaryTotals } = useSummaryTotals({
    period: selectedPeriod || null,
    month_id: selectedMonthId,
  });

  useEffect(() => {
    if (selectedMonthId === null && months && months.length > 0) {
      let defaultMonth = currentMonth;

      if (currentMonth?.is_closed && months.length > 0) {
        const currentIdx = months.findIndex((m: Month) => m.id === currentMonth.id);

        for (let i = currentIdx - 1; i >= 0; i--) {
          if (!months[i].is_closed) {
            defaultMonth = months[i];
            break;
          }
        }
      }

      if (defaultMonth) {
        setSelectedMonthId(defaultMonth.id);
      } else if (months.length > 0) {
        setSelectedMonthId(months[0].id);
      }
    }
  }, [currentMonth, months, selectedMonthId]);

  // Get the selected month object
  const selectedMonth = months?.find((m: Month) => m.id === selectedMonthId);

  const handleToggleMonthStatus = () => {
    if (!selectedMonthId || !selectedMonth) return;

    if (selectedMonth.is_closed) {
      // Open the month
      Alert.alert(
        "Reopen Month",
        `Are you sure you want to reopen "${selectedMonth.name}"? This will allow adding new expenses and incomes.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Reopen",
            onPress: async () => {
              try {
                const result = await openMonthMutation.mutateAsync(selectedMonthId);
                Alert.alert("Success", result.message);
              } catch (error) {
                Alert.alert("Error", "Failed to reopen month. Please try again.");
              }
            },
          },
        ]
      );
    } else {
      // Close the month
      Alert.alert(
        "Close Month",
        `Are you sure you want to close "${selectedMonth.name}"? This will prevent adding new expenses and incomes.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Close",
            style: "destructive",
            onPress: async () => {
              try {
                const result = await closeMonthMutation.mutateAsync(selectedMonthId);
                Alert.alert("Success", result.message);
              } catch (error) {
                Alert.alert("Error", "Failed to close month. Please try again.");
              }
            },
          },
        ]
      );
    }
  };

  const handleCloneToNextMonth = async () => {
    if (!selectedMonthId) {
      Alert.alert("No Month Selected", "Please select a month to clone from");
      return;
    }

    Alert.alert(
      "Clone to Next Month",
      "This will clone all expenses and incomes from the selected month to the following month. Costs, purchases, and income amounts will not be carried over. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clone",
          onPress: async () => {
            try {
              const result = await cloneMutation.mutateAsync(selectedMonthId);
              Alert.alert("Success", result.message);
              if (result.next_month_id) {
                setSelectedMonthId(result.next_month_id);
              }
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to clone expenses. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteMonth = () => {
    if (!selectedMonthId) {
      Alert.alert("No Month Selected", "Please select a month to delete");
      return;
    }

    Alert.alert(
      "Delete Month",
      "This will delete the selected month and all associated expenses and incomes. This action cannot be undone. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMonthMutation.mutateAsync(selectedMonthId);
              const remainingMonths =
                months?.filter((m: Month) => m.id !== selectedMonthId) || [];
              if (remainingMonths.length > 0) {
                setSelectedMonthId(remainingMonths[0].id);
              } else {
                setSelectedMonthId(null);
              }
              Alert.alert("Success", "Month deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete month. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteExpense = (id: number) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExpenseMutation.mutateAsync(id);
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to delete expense. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handlePayExpense = (expense: Expense) => {
    Alert.alert(
      "Pay Expense",
      `Add a payment of $${expense.budget.toFixed(2)} to "${expense.expense_name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay",
          onPress: async () => {
            try {
              await payExpenseMutation.mutateAsync({ id: expense.id });
              Alert.alert(
                "Success",
                `Payment of $${expense.budget.toFixed(2)} has been added.`
              );
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to pay expense. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteIncome = (id: number) => {
    Alert.alert(
      "Delete Income",
      "Are you sure you want to delete this income?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteIncomeMutation.mutateAsync(id);
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to delete income. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const tabs: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: "summary", label: "Summary", icon: "stats-chart" },
    { id: "expenses", label: "Expenses", icon: "wallet" },
    { id: "income", label: "Income", icon: "cash" },
  ];

  const styles = getStyles(isDark, theme);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          {/* Row 1: Month Selector + Filter Button */}
          <View style={styles.headerRow}>
            <View style={styles.monthSelectorContainer}>
              <MonthSelector
                selectedMonthId={selectedMonthId}
                onMonthChange={setSelectedMonthId}
              />
            </View>
            {(activeTab === "expenses" || activeTab === "income") && (
              <TouchableOpacity
                style={[styles.filterButton, showFilters && styles.filterButtonActive]}
                onPress={() => setShowFilters(!showFilters)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showFilters ? "filter" : "filter-outline"}
                  size={20}
                  color={showFilters ? theme.primary : theme.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Row 2: Action Buttons (Add, Clone, Delete) - Full Width */}
          {selectedMonthId && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionButtonFull}
                onPress={() => activeTab === "income" ? setShowIncomeForm(true) : setShowExpenseForm(true)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={activeTab === "income" ? gradientColors.emerald : gradientColors.teal}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="add" size={18} color="#ffffff" />
                  <Text style={styles.actionButtonGradientText}>Add</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButtonFull}
                onPress={handleCloneToNextMonth}
                disabled={cloneMutation.isPending}
                activeOpacity={0.7}
              >
                <View style={[styles.actionButtonFullInner, { backgroundColor: theme.primaryBg, borderColor: isDark ? "rgba(20, 184, 166, 0.3)" : "rgba(20, 184, 166, 0.2)" }]}>
                  <Ionicons name="copy-outline" size={18} color={theme.primary} />
                  <Text style={[styles.actionButtonFullText, { color: theme.primary }]}>Clone</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButtonFull}
                onPress={handleToggleMonthStatus}
                disabled={closeMonthMutation.isPending || openMonthMutation.isPending}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.actionButtonFullInner,
                  {
                    backgroundColor: selectedMonth?.is_closed ? theme.warningBg : theme.successBg,
                    borderColor: selectedMonth?.is_closed
                      ? (isDark ? "rgba(245, 158, 11, 0.3)" : "rgba(245, 158, 11, 0.2)")
                      : (isDark ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.2)")
                  }
                ]}>
                  <Ionicons
                    name={selectedMonth?.is_closed ? "lock-open-outline" : "lock-closed-outline"}
                    size={18}
                    color={selectedMonth?.is_closed ? theme.warning : theme.success}
                  />
                  <Text style={[styles.actionButtonFullText, { color: selectedMonth?.is_closed ? theme.warning : theme.success }]}>
                    {selectedMonth?.is_closed ? "Open" : "Close"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButtonFull}
                onPress={handleDeleteMonth}
                disabled={deleteMonthMutation.isPending}
                activeOpacity={0.7}
              >
                <View style={[styles.actionButtonFullInner, { backgroundColor: theme.dangerBg, borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)" }]}>
                  <Ionicons name="trash-outline" size={18} color={theme.danger} />
                  <Text style={[styles.actionButtonFullText, { color: theme.danger }]}>Delete</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Filter Bar */}
          {showFilters && (activeTab === "expenses" || activeTab === "income") && (
            <FilterBar
              periods={periods || []}
              categories={categories || []}
              selectedPeriod={selectedPeriod}
              selectedCategory={selectedCategory}
              onPeriodChange={setSelectedPeriod}
              onCategoryChange={setSelectedCategory}
              showCategoryFilter={activeTab === "expenses"}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
            />
          )}
        </View>

        {/* Tabs - Consistent with Settings */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, isActive && styles.activeTab]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabIconWrapper, isActive && styles.activeTabIconWrapper]}>
                    <Ionicons
                      name={tab.icon}
                      size={16}
                      color={isActive ? "#ffffff" : theme.textMuted}
                    />
                  </View>
                  <Text
                    style={[styles.tabText, isActive && styles.activeTabText]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === "expenses" && (
            <ExpenseList
              expenses={expenses || []}
              isLoading={expensesLoading}
              categories={categories || []}
              periods={periods || []}
              onEdit={(expense: Expense) => {
                setEditingExpense(expense);
                setShowExpenseForm(true);
              }}
              onDelete={handleDeleteExpense}
              onPay={handlePayExpense}
              onAdd={() => setShowExpenseForm(true)}
              theme={theme}
              isDark={isDark}
            />
          )}
          {activeTab === "income" && (
            <IncomeList
              incomes={incomes || []}
              isLoading={incomesLoading}
              incomeTypes={incomeTypes || []}
              periods={periods || []}
              onEdit={(income: Income) => {
                setEditingIncome(income);
                setShowIncomeForm(true);
              }}
              onDelete={handleDeleteIncome}
              onAdd={() => setShowIncomeForm(true)}
              theme={theme}
              isDark={isDark}
            />
          )}
          {activeTab === "summary" && (
            <View style={styles.summaryContainer}>
              <SummaryCards totals={summaryTotals} />
              <Summary
                periodFilter={selectedPeriod || null}
                monthId={selectedMonthId}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {showExpenseForm && (
        <ExpenseFormModal
          visible={showExpenseForm}
          expense={editingExpense}
          monthId={selectedMonthId}
          onClose={() => {
            setShowExpenseForm(false);
            setEditingExpense(null);
          }}
        />
      )}

      {showIncomeForm && (
        <IncomeFormModal
          visible={showIncomeForm}
          income={editingIncome}
          monthId={selectedMonthId}
          onClose={() => {
            setShowIncomeForm(false);
            setEditingIncome(null);
          }}
        />
      )}
    </View>
  );
};

// Expense List Component
interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
  categories: Category[];
  periods: Period[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
  onPay: (expense: Expense) => void;
  onAdd: () => void;
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
}

const ExpenseList = ({
  expenses,
  isLoading,
  categories,
  periods,
  onEdit,
  onDelete,
  onPay,
  onAdd,
  theme,
  isDark,
}: ExpenseListProps) => {
  const styles = getListStyles(isDark, theme);

  const getCategoryColor = (categoryName: string) => {
    const category = categories?.find(
      (cat: Category) => cat.name === categoryName
    );
    return category?.color || colors.primary[500];
  };

  const getPeriodColor = (periodName: string) => {
    const period = periods?.find((p: Period) => p.name === periodName);
    return period?.color || colors.primary[500];
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={onAdd}
        activeOpacity={0.7}
      >
        <View style={[styles.addButtonIcon, { backgroundColor: theme.dangerBg }]}>
          <Ionicons name="wallet-outline" size={20} color={theme.danger} />
        </View>
        <Text style={styles.addButtonText}>Add Expense</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </TouchableOpacity>

      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="wallet-outline" size={40} color={theme.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptyText}>
            Add your first expense to start tracking
          </Text>
        </View>
      ) : (
        expenses.map((expense: Expense) => {
          const categoryColor = getCategoryColor(expense.category);
          const periodColor = getPeriodColor(expense.period);
          const isOnBudget = expense.cost <= expense.budget;
          const progress = expense.budget > 0 ? Math.min((expense.cost / expense.budget) * 100, 100) : 0;

          return (
            <View key={expense.id} style={styles.listItem}>
              <View style={[styles.listItemAccent, { backgroundColor: categoryColor }]} />
              <View style={styles.listItemContent}>
                <View style={styles.listItemHeader}>
                  <Text style={styles.listItemTitle} numberOfLines={1}>
                    {expense.expense_name}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isOnBudget ? styles.statusSuccess : styles.statusDanger,
                    ]}
                  >
                    <Ionicons
                      name={isOnBudget ? "checkmark" : "alert"}
                      size={10}
                      color={isOnBudget ? theme.success : theme.danger}
                    />
                  </View>
                </View>

                <View style={styles.chipsContainer}>
                  <View
                    style={[styles.chip, { backgroundColor: categoryColor }]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isDarkColor(categoryColor) ? "#fff" : "#0f172a" },
                      ]}
                    >
                      {expense.category}
                    </Text>
                  </View>
                  <View
                    style={[styles.chip, { backgroundColor: periodColor }]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isDarkColor(periodColor) ? "#fff" : "#0f172a" },
                      ]}
                    >
                      {expense.period}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progress}%`,
                          backgroundColor: isOnBudget ? theme.success : theme.danger,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
                </View>

                <View style={styles.amountRow}>
                  <View>
                    <Text style={styles.amountLabel}>Spent</Text>
                    <Text style={[styles.listItemAmount, { color: isOnBudget ? theme.text : theme.danger }]}>
                      {formatCurrency(expense.cost)}
                    </Text>
                  </View>
                  <View style={styles.amountDivider} />
                  <View>
                    <Text style={styles.amountLabel}>Budget</Text>
                    <Text style={styles.listItemBudget}>
                      {formatCurrency(expense.budget)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.listItemActions}>
                {!(expense.purchases && expense.purchases.length > 0) && (
                  <TouchableOpacity
                    style={[styles.actionIcon, { backgroundColor: theme.successBg }]}
                    onPress={() => onPay(expense)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="card-outline" size={16} color={theme.success} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionIcon, { backgroundColor: theme.primaryBg }]}
                  onPress={() => onEdit(expense)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={14} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionIcon, { backgroundColor: theme.dangerBg }]}
                  onPress={() => onDelete(expense.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash" size={14} color={theme.danger} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

// Income List Component
interface IncomeListProps {
  incomes: Income[];
  isLoading: boolean;
  incomeTypes: IncomeType[];
  periods: Period[];
  onEdit: (income: Income) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  theme: ReturnType<typeof getThemeColors>;
  isDark: boolean;
}

const IncomeList = ({
  incomes,
  isLoading,
  incomeTypes,
  periods,
  onEdit,
  onDelete,
  onAdd,
  theme,
  isDark,
}: IncomeListProps) => {
  const styles = getListStyles(isDark, theme);

  const getIncomeTypeName = (incomeTypeId: number) => {
    const incomeType = incomeTypes?.find(
      (it: IncomeType) => it.id === incomeTypeId
    );
    return incomeType?.name || `Type #${incomeTypeId}`;
  };

  const getIncomeTypeColor = (incomeTypeId: number) => {
    const incomeType = incomeTypes?.find(
      (it: IncomeType) => it.id === incomeTypeId
    );
    return incomeType?.color || colors.success.light;
  };

  const getPeriodColor = (periodName: string) => {
    const period = periods?.find((p: Period) => p.name === periodName);
    return period?.color || colors.primary[500];
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading income...</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={onAdd}
        activeOpacity={0.7}
      >
        <View style={[styles.addButtonIcon, { backgroundColor: theme.successBg }]}>
          <Ionicons name="trending-up-outline" size={20} color={theme.success} />
        </View>
        <Text style={styles.addButtonText}>Add Income</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </TouchableOpacity>

      {incomes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cash-outline" size={40} color={theme.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No income yet</Text>
          <Text style={styles.emptyText}>
            Add your income to track your earnings
          </Text>
        </View>
      ) : (
        incomes.map((income: Income) => {
          const incomeTypeColor = getIncomeTypeColor(income.income_type_id);
          const periodColor = getPeriodColor(income.period);
          const progress = income.budget > 0 ? Math.min((income.amount / income.budget) * 100, 100) : 0;

          return (
            <View key={income.id} style={styles.listItem}>
              <View style={[styles.listItemAccent, { backgroundColor: theme.success }]} />
              <View style={styles.listItemContent}>
                <View style={styles.listItemHeader}>
                  <Text style={styles.listItemTitle} numberOfLines={1}>
                    {getIncomeTypeName(income.income_type_id)}
                  </Text>
                </View>

                <View style={styles.chipsContainer}>
                  <View
                    style={[styles.chip, { backgroundColor: incomeTypeColor }]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isDarkColor(incomeTypeColor) ? "#fff" : "#0f172a" },
                      ]}
                    >
                      {getIncomeTypeName(income.income_type_id)}
                    </Text>
                  </View>
                  <View
                    style={[styles.chip, { backgroundColor: periodColor }]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isDarkColor(periodColor) ? "#fff" : "#0f172a" },
                      ]}
                    >
                      {income.period}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progress}%`,
                          backgroundColor: theme.success,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
                </View>

                <View style={styles.amountRow}>
                  <View>
                    <Text style={styles.amountLabel}>Received</Text>
                    <Text style={[styles.listItemAmount, { color: theme.success }]}>
                      {formatCurrency(income.amount)}
                    </Text>
                  </View>
                  <View style={styles.amountDivider} />
                  <View>
                    <Text style={styles.amountLabel}>Expected</Text>
                    <Text style={styles.listItemBudget}>
                      {formatCurrency(income.budget)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.listItemActions}>
                <TouchableOpacity
                  style={[styles.actionIcon, { backgroundColor: theme.primaryBg }]}
                  onPress={() => onEdit(income)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={14} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionIcon, { backgroundColor: theme.dangerBg }]}
                  onPress={() => onDelete(income.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash" size={14} color={theme.danger} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    headerSection: {
      padding: 16,
      paddingTop: 8,
      backgroundColor: theme.cardSolid,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      gap: 12,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    monthSelectorContainer: {
      flex: 1,
    },
    filterButton: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: isDark ? "rgba(51, 65, 85, 0.4)" : colors.slate[100],
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.borderGlass,
    },
    filterButtonActive: {
      backgroundColor: theme.primaryBg,
      borderColor: isDark ? "rgba(20, 184, 166, 0.3)" : "rgba(20, 184, 166, 0.2)",
    },
    actionsRow: {
      flexDirection: "row",
      gap: 8,
    },
    actionButtonFull: {
      flex: 1,
      borderRadius: radius.md,
      overflow: "hidden",
    },
    actionButtonGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      gap: 6,
    },
    actionButtonGradientText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#ffffff",
    },
    actionButtonFullInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      gap: 6,
      borderRadius: radius.md,
      borderWidth: 1,
    },
    actionButtonFullText: {
      fontSize: 14,
      fontWeight: "600",
    },
    tabsWrapper: {
      backgroundColor: theme.cardSolid,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tabsContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 12,
      gap: 8,
      borderRadius: radius.md,
      backgroundColor: isDark ? "rgba(51, 65, 85, 0.3)" : colors.slate[100],
    },
    activeTab: {
      backgroundColor: theme.primaryBg,
    },
    tabIconWrapper: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(51, 65, 85, 0.5)" : colors.slate[200],
    },
    activeTabIconWrapper: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.textSecondary,
    },
    activeTabText: {
      color: theme.primary,
      fontWeight: "600",
    },
    content: {
      padding: 16,
    },
    summaryContainer: {
      gap: 24,
    },
  });

const getListStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    listContainer: {
      gap: 12,
    },
    loadingContainer: {
      padding: 48,
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      color: theme.textSecondary,
      fontSize: 14,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      backgroundColor: theme.cardSolid,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: "dashed",
    },
    addButtonIcon: {
      width: 38,
      height: 38,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    addButtonText: {
      flex: 1,
      fontWeight: "600",
      fontSize: 15,
      color: theme.text,
    },
    emptyContainer: {
      padding: 48,
      alignItems: "center",
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: radius.xl,
      backgroundColor: theme.backgroundTertiary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 6,
    },
    emptyText: {
      textAlign: "center",
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "stretch",
      backgroundColor: theme.cardSolid,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
      ...getShadow(isDark, "sm"),
    },
    listItemAccent: {
      width: 4,
    },
    listItemContent: {
      flex: 1,
      padding: 14,
      gap: 10,
    },
    listItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    listItemTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      flex: 1,
    },
    statusBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
    statusSuccess: {
      backgroundColor: theme.successBg,
    },
    statusDanger: {
      backgroundColor: theme.dangerBg,
    },
    chipsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    chip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    chipText: {
      fontSize: 11,
      fontWeight: "600",
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    progressBar: {
      flex: 1,
      height: 5,
      backgroundColor: isDark ? colors.slate[800] : colors.slate[200],
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.textSecondary,
      width: 32,
      textAlign: 'right',
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    amountLabel: {
      fontSize: 10,
      color: theme.textMuted,
      textTransform: 'uppercase',
      fontWeight: '600',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    amountDivider: {
      width: 1,
      height: 24,
      backgroundColor: theme.border,
      marginHorizontal: 12,
    },
    listItemAmount: {
      fontSize: 16,
      fontWeight: "700",
    },
    listItemBudget: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    listItemActions: {
      flexDirection: "column",
      gap: 6,
      padding: 10,
      justifyContent: 'center',
    },
    actionIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
  });

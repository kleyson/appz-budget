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
import { getThemeColors, colors, getShadow, isDarkColor } from "../utils/colors";
import {
  useExpenses,
  useDeleteExpense,
  useCloneExpensesToNextMonth,
} from "../hooks/useExpenses";
import { useIncomes, useDeleteIncome } from "../hooks/useIncomes";
import { useMonths, useCurrentMonth, useDeleteMonth } from "../hooks/useMonths";
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
  const deleteIncomeMutation = useDeleteIncome();
  const deleteMonthMutation = useDeleteMonth();

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
    if (currentMonth && selectedMonthId === null) {
      setSelectedMonthId(currentMonth.id);
    }
  }, [currentMonth, selectedMonthId]);

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
    { id: "summary", label: "Summary", icon: "stats-chart-outline" },
    { id: "expenses", label: "Expenses", icon: "wallet-outline" },
    { id: "income", label: "Income", icon: "cash-outline" },
  ];

  const styles = getStyles(isDark, theme);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Monthly Budget</Text>
              <Text style={styles.subtitle}>Track your expenses and income</Text>
            </View>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowExpenseForm(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.success.light, "#059669"]}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="add" size={18} color="#ffffff" />
                <Text style={styles.actionButtonText}>New</Text>
              </LinearGradient>
            </TouchableOpacity>
            {selectedMonthId && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleDeleteMonth}
                  disabled={deleteMonthMutation.isPending}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.danger.light, "#dc2626"]}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleCloneToNextMonth}
                  disabled={cloneMutation.isPending}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary[500], colors.primary[600]]}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="copy-outline" size={18} color="#ffffff" />
                    <Text style={styles.actionButtonText}>Clone</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <View style={styles.filterRow}>
            <View style={styles.monthSelectorContainer}>
              <MonthSelector
                selectedMonthId={selectedMonthId}
                onMonthChange={setSelectedMonthId}
              />
            </View>
            {(activeTab === "expenses" || activeTab === "income") && (
              <FilterToggleButton
                showFilters={showFilters}
                onToggle={() => setShowFilters(!showFilters)}
              />
            )}
          </View>
          {showFilters &&
            (activeTab === "expenses" || activeTab === "income") && (
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

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={activeTab === tab.id ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.id && styles.activeTabText,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
        <View style={styles.addButtonIcon}>
          <Ionicons name="add" size={24} color={theme.primary} />
        </View>
        <Text style={styles.addButtonText}>Add Expense</Text>
      </TouchableOpacity>

      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="wallet-outline" size={48} color={theme.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptyText}>
            Add your first expense to start tracking your budget
          </Text>
        </View>
      ) : (
        expenses.map((expense: Expense) => (
          <View key={expense.id} style={styles.listItem}>
            <View style={styles.listItemAccent} />
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{expense.expense_name}</Text>
              <View style={styles.chipsContainer}>
                <View
                  style={[
                    styles.chip,
                    { backgroundColor: getCategoryColor(expense.category) },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isDarkColor(getCategoryColor(expense.category)) ? "#fff" : "#000" },
                    ]}
                  >
                    {expense.category}
                  </Text>
                </View>
                <View
                  style={[
                    styles.chip,
                    { backgroundColor: getPeriodColor(expense.period) },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isDarkColor(getPeriodColor(expense.period)) ? "#fff" : "#000" },
                    ]}
                  >
                    {expense.period}
                  </Text>
                </View>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.listItemAmount}>
                  ${expense.cost.toFixed(2)}
                </Text>
                <Text style={styles.listItemBudget}>
                  / ${expense.budget.toFixed(2)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    expense.cost <= expense.budget
                      ? styles.statusSuccess
                      : styles.statusDanger,
                  ]}
                >
                  <Ionicons
                    name={expense.cost <= expense.budget ? "checkmark" : "alert"}
                    size={12}
                    color={expense.cost <= expense.budget ? theme.success : theme.danger}
                  />
                </View>
              </View>
            </View>
            <View style={styles.listItemActions}>
              <TouchableOpacity
                style={styles.actionIcon}
                onPress={() => onEdit(expense)}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={20} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionIcon}
                onPress={() => onDelete(expense.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color={theme.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))
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
        <View style={styles.addButtonIcon}>
          <Ionicons name="add" size={24} color={theme.success} />
        </View>
        <Text style={[styles.addButtonText, { color: theme.success }]}>
          Add Income
        </Text>
      </TouchableOpacity>

      {incomes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cash-outline" size={48} color={theme.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No income yet</Text>
          <Text style={styles.emptyText}>
            Add your income sources to track your earnings
          </Text>
        </View>
      ) : (
        incomes.map((income: Income) => (
          <View key={income.id} style={styles.listItem}>
            <View style={[styles.listItemAccent, { backgroundColor: theme.success }]} />
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>
                {getIncomeTypeName(income.income_type_id)}
              </Text>
              <View style={styles.chipsContainer}>
                <View
                  style={[
                    styles.chip,
                    { backgroundColor: getIncomeTypeColor(income.income_type_id) },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isDarkColor(getIncomeTypeColor(income.income_type_id)) ? "#fff" : "#000" },
                    ]}
                  >
                    {getIncomeTypeName(income.income_type_id)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.chip,
                    { backgroundColor: getPeriodColor(income.period) },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isDarkColor(getPeriodColor(income.period)) ? "#fff" : "#000" },
                    ]}
                  >
                    {income.period}
                  </Text>
                </View>
              </View>
              <View style={styles.amountRow}>
                <Text style={[styles.listItemAmount, { color: theme.success }]}>
                  ${income.amount.toFixed(2)}
                </Text>
                <Text style={styles.listItemBudget}>
                  / ${income.budget.toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.listItemActions}>
              <TouchableOpacity
                style={styles.actionIcon}
                onPress={() => onEdit(income)}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={20} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionIcon}
                onPress={() => onDelete(income.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color={theme.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))
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
    header: {
      padding: 16,
      paddingTop: 8,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTop: {
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.text,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    headerButtons: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
    actionButton: {
      borderRadius: 12,
      overflow: "hidden",
      ...getShadow(isDark, "sm"),
    },
    actionButtonGradient: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 6,
    },
    actionButtonText: {
      color: "#ffffff",
      fontWeight: "600",
      fontSize: 14,
    },
    filters: {
      padding: 16,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      gap: 12,
    },
    filterRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    monthSelectorContainer: {
      flex: 1,
    },
    tabsContainer: {
      backgroundColor: theme.card,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tabs: {
      flexDirection: "row",
      backgroundColor: theme.tabBg,
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      gap: 6,
    },
    activeTab: {
      backgroundColor: theme.tabActiveBg,
      ...getShadow(isDark, "sm"),
    },
    tabText: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.tabInactive,
    },
    activeTabText: {
      color: theme.text,
      fontWeight: "600",
    },
    content: {
      padding: 16,
    },
    summaryContainer: {
      gap: 16,
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
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      backgroundColor: theme.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: "dashed",
    },
    addButtonIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.primaryBg,
      alignItems: "center",
      justifyContent: "center",
    },
    addButtonText: {
      color: theme.primary,
      fontWeight: "600",
      fontSize: 16,
    },
    emptyContainer: {
      padding: 48,
      alignItems: "center",
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: theme.backgroundTertiary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
    },
    emptyText: {
      textAlign: "center",
      color: theme.textSecondary,
      lineHeight: 20,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
      ...getShadow(isDark, "sm"),
    },
    listItemAccent: {
      width: 4,
      alignSelf: "stretch",
      backgroundColor: theme.primary,
    },
    listItemContent: {
      flex: 1,
      padding: 14,
    },
    listItemTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
    },
    chipsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 10,
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    chipText: {
      fontSize: 12,
      fontWeight: "600",
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    listItemAmount: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.primary,
    },
    listItemBudget: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    statusBadge: {
      marginLeft: 8,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    statusSuccess: {
      backgroundColor: theme.successBg,
    },
    statusDanger: {
      backgroundColor: theme.dangerBg,
    },
    listItemActions: {
      flexDirection: "row",
      gap: 8,
      paddingRight: 14,
    },
    actionIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.backgroundTertiary,
      alignItems: "center",
      justifyContent: "center",
    },
  });

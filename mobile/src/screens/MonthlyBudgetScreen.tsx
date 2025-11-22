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
import { useTheme } from "../contexts/ThemeContext";
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
              // Switch to another month if available
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

  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Monthly Budget</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowExpenseForm(true)}
            >
              <Ionicons name="add" size={18} color="#ffffff" />
              <Text style={styles.createButtonText}>New</Text>
            </TouchableOpacity>
            {selectedMonthId && (
              <>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteMonth}
                  disabled={deleteMonthMutation.isPending}
                >
                  <Ionicons name="trash" size={18} color="#ffffff" />
                  <Text style={styles.deleteButtonText}>
                    {deleteMonthMutation.isPending ? "Deleting..." : "Delete"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cloneButton}
                  onPress={handleCloneToNextMonth}
                  disabled={cloneMutation.isPending}
                >
                  <Ionicons name="copy" size={18} color="#ffffff" />
                  <Text style={styles.cloneButtonText}>
                    {cloneMutation.isPending ? "Cloning..." : "Clone"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

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

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "summary" && styles.activeTab]}
            onPress={() => setActiveTab("summary")}
          >
            <Ionicons
              name="stats-chart"
              size={20}
              color={
                activeTab === "summary"
                  ? "#3b82f6"
                  : isDark
                  ? "#9ca3af"
                  : "#6b7280"
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "summary" && styles.activeTabText,
              ]}
            >
              Summary
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "expenses" && styles.activeTab]}
            onPress={() => setActiveTab("expenses")}
          >
            <Ionicons
              name="wallet"
              size={20}
              color={
                activeTab === "expenses"
                  ? "#3b82f6"
                  : isDark
                  ? "#9ca3af"
                  : "#6b7280"
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "expenses" && styles.activeTabText,
              ]}
            >
              Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "income" && styles.activeTab]}
            onPress={() => setActiveTab("income")}
          >
            <Ionicons
              name="cash"
              size={20}
              color={
                activeTab === "income"
                  ? "#3b82f6"
                  : isDark
                  ? "#9ca3af"
                  : "#6b7280"
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "income" && styles.activeTabText,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>

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

// Simplified list components
interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
  categories: Category[];
  periods: Period[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

const ExpenseList = ({
  expenses,
  isLoading,
  categories,
  periods,
  onEdit,
  onDelete,
  onAdd,
}: ExpenseListProps) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  const getCategoryColor = (categoryName: string) => {
    const category = categories?.find(
      (cat: Category) => cat.name === categoryName
    );
    return category?.color || "#6b7280";
  };

  const getPeriodColor = (periodName: string) => {
    const period = periods?.find((p: Period) => p.name === periodName);
    return period?.color || "#6b7280";
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <TouchableOpacity style={styles.addButton} onPress={onAdd}>
        <Ionicons name="add-circle" size={24} color="#3b82f6" />
        <Text style={styles.addButtonText}>Add Expense</Text>
      </TouchableOpacity>
      {expenses.length === 0 ? (
        <Text style={styles.emptyText}>No expenses found</Text>
      ) : (
        expenses.map((expense: Expense) => (
          <View key={expense.id} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{expense.expense_name}</Text>
              <View style={styles.chipsContainer}>
                <View
                  style={[
                    styles.chip,
                    { backgroundColor: getCategoryColor(expense.category) },
                  ]}
                >
                  <Text style={styles.chipText}>{expense.category}</Text>
                </View>
                <View
                  style={[
                    styles.chip,
                    { backgroundColor: getPeriodColor(expense.period) },
                  ]}
                >
                  <Text style={styles.chipText}>{expense.period}</Text>
                </View>
              </View>
              <Text style={styles.listItemAmount}>
                ${expense.cost.toFixed(2)} / ${expense.budget.toFixed(2)}
              </Text>
            </View>
            <View style={styles.listItemActions}>
              <TouchableOpacity onPress={() => onEdit(expense)}>
                <Ionicons name="pencil" size={20} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(expense.id)}>
                <Ionicons name="trash" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

interface IncomeListProps {
  incomes: Income[];
  isLoading: boolean;
  incomeTypes: IncomeType[];
  periods: Period[];
  onEdit: (income: Income) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

const IncomeList = ({
  incomes,
  isLoading,
  incomeTypes,
  periods,
  onEdit,
  onDelete,
  onAdd,
}: IncomeListProps) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  const getIncomeTypeName = (incomeTypeId: number) => {
    const incomeType = incomeTypes?.find(
      (it: IncomeType) => it.id === incomeTypeId
    );
    return incomeType?.name || `Type #${incomeTypeId}`;
  };

  const getPeriodColor = (periodName: string) => {
    const period = periods?.find((p: Period) => p.name === periodName);
    return period?.color || "#6b7280";
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading incomes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <TouchableOpacity style={styles.addButton} onPress={onAdd}>
        <Ionicons name="add-circle" size={24} color="#3b82f6" />
        <Text style={styles.addButtonText}>Add Income</Text>
      </TouchableOpacity>
      {incomes.length === 0 ? (
        <Text style={styles.emptyText}>No incomes found</Text>
      ) : (
        incomes.map((income: Income) => (
          <View key={income.id} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>
                {getIncomeTypeName(income.income_type_id)}
              </Text>
              <View style={styles.chipsContainer}>
                <View
                  style={[
                    styles.chip,
                    { backgroundColor: getPeriodColor(income.period) },
                  ]}
                >
                  <Text style={styles.chipText}>{income.period}</Text>
                </View>
              </View>
              <Text style={styles.listItemAmount}>
                ${income.amount.toFixed(2)} / ${income.budget.toFixed(2)}
              </Text>
            </View>
            <View style={styles.listItemActions}>
              <TouchableOpacity onPress={() => onEdit(income)}>
                <Ionicons name="pencil" size={20} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(income.id)}>
                <Ionicons name="trash" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#111827" : "#f9fafb",
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#374151" : "#e5e7eb",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDark ? "#ffffff" : "#111827",
      flex: 1,
    },
    headerButtons: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
    createButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#10b981",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 4,
    },
    createButtonText: {
      color: "#ffffff",
      fontWeight: "600",
      fontSize: 14,
    },
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#ef4444",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 4,
    },
    deleteButtonText: {
      color: "#ffffff",
      fontWeight: "600",
      fontSize: 14,
    },
    cloneButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#3b82f6",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 4,
    },
    cloneButtonText: {
      color: "#ffffff",
      fontWeight: "600",
      fontSize: 14,
    },
    filters: {
      padding: 16,
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#374151" : "#e5e7eb",
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
    tabs: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#374151" : "#e5e7eb",
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      gap: 6,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: "#3b82f6",
    },
    tabText: {
      fontSize: 14,
      color: isDark ? "#9ca3af" : "#6b7280",
    },
    activeTabText: {
      color: "#3b82f6",
      fontWeight: "600",
    },
    content: {
      padding: 16,
    },
    summaryContainer: {
      gap: 16,
    },
    loadingContainer: {
      padding: 32,
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      color: isDark ? "#9ca3af" : "#6b7280",
    },
    listContainer: {
      gap: 12,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#e5e7eb",
    },
    addButtonText: {
      color: "#3b82f6",
      fontWeight: "600",
    },
    listItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#e5e7eb",
    },
    listItemContent: {
      flex: 1,
    },
    listItemTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#ffffff" : "#111827",
      marginBottom: 4,
    },
    chipsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 8,
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    chipText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#ffffff",
    },
    listItemAmount: {
      fontSize: 16,
      fontWeight: "600",
      color: "#3b82f6",
    },
    listItemActions: {
      flexDirection: "row",
      gap: 16,
    },
    emptyText: {
      textAlign: "center",
      padding: 32,
      color: isDark ? "#9ca3af" : "#6b7280",
    },
    summaryText: {
      marginTop: 16,
      color: isDark ? "#9ca3af" : "#6b7280",
      textAlign: "center",
    },
  });

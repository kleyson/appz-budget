import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getThemeColors,
  radius,
  gradientColors,
} from "../../utils/colors";
import {
  useExpenses,
  useDeleteExpense,
  useCloneExpensesToNextMonth,
  usePayExpense,
  useRefreshBudgetData,
} from "../../hooks/useExpenses";
import { useIncomes, useDeleteIncome } from "../../hooks/useIncomes";
import {
  useMonths,
  useCurrentMonth,
  useDeleteMonth,
  useCloseMonth,
  useOpenMonth,
} from "../../hooks/useMonths";
import { usePeriods } from "../../hooks/usePeriods";
import { useCategories } from "../../hooks/useCategories";
import { useIncomeTypes } from "../../hooks/useIncomeTypes";
import { useSummaryTotals } from "../../hooks/useSummary";
import { Ionicons } from "@expo/vector-icons";
import { ExpenseFormModal } from "./ExpenseFormModal";
import { IncomeFormModal } from "./IncomeFormModal";
import { PayExpenseModal } from "./PayExpenseModal";
import { MonthSelector } from "./MonthSelector";
import { FilterBar } from "./FilterBar";
import { SummaryCards } from "./SummaryCards";
import { Summary } from "./Summary";
import { ExpenseList } from "./ExpenseList";
import { IncomeList } from "./IncomeList";
import { Tabs, Tab, CustomRefreshControl } from "../../components/shared";
import type { Expense, Income, Month } from "../../types";

type TabId = "expenses" | "income" | "summary";

export const MonthlyBudgetScreen = () => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { refresh: refreshBudgetData, isRefreshing } = useRefreshBudgetData();
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMonthId, setSelectedMonthId] = useState<number | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [payingExpense, setPayingExpense] = useState<Expense | null>(null);
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
        const currentIdx = months.findIndex(
          (m: Month) => m.id === currentMonth.id
        );

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

  const selectedMonth = months?.find((m: Month) => m.id === selectedMonthId);

  const handleToggleMonthStatus = () => {
    if (!selectedMonthId || !selectedMonth) return;

    if (selectedMonth.is_closed) {
      Alert.alert(
        "Reopen Month",
        `Are you sure you want to reopen "${selectedMonth.name}"? This will allow adding new expenses and incomes.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Reopen",
            onPress: async () => {
              try {
                const result = await openMonthMutation.mutateAsync(
                  selectedMonthId
                );
                Alert.alert("Success", result.message);
              } catch (_error) {
                Alert.alert(
                  "Error",
                  "Failed to reopen month. Please try again."
                );
              }
            },
          },
        ]
      );
    } else {
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
                const result = await closeMonthMutation.mutateAsync(
                  selectedMonthId
                );
                Alert.alert("Success", result.message);
              } catch (_error) {
                Alert.alert(
                  "Error",
                  "Failed to close month. Please try again."
                );
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
            } catch (_error) {
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
            } catch (_error) {
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
            } catch (_error) {
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
    setPayingExpense(expense);
  };

  const handlePayConfirm = async (amount: number, purchaseName: string) => {
    if (!payingExpense) return;

    const hasPurchases =
      payingExpense.purchases && payingExpense.purchases.length > 0;

    try {
      await payExpenseMutation.mutateAsync({
        id: payingExpense.id,
        data: { amount, name: purchaseName },
      });
      setPayingExpense(null);
      Alert.alert(
        hasPurchases ? "Purchase Added" : "Payment Added",
        hasPurchases
          ? `Purchase "${purchaseName}" of $${amount.toFixed(
              2
            )} has been added.`
          : `Payment of $${amount.toFixed(2)} has been added.`
      );
    } catch (_error) {
      Alert.alert(
        "Error",
        hasPurchases
          ? "Failed to add purchase. Please try again."
          : "Failed to pay expense. Please try again."
      );
    }
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
            } catch (_error) {
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

  const tabs: Tab<TabId>[] = [
    { id: "summary", label: "Summary", icon: "stats-chart" },
    { id: "expenses", label: "Expenses", icon: "wallet" },
    { id: "income", label: "Income", icon: "cash" },
  ];

  const handleRefresh = useCallback(() => {
    refreshBudgetData();
  }, [refreshBudgetData]);

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        refreshControl={
          <CustomRefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            color={theme.primary}
          />
        }
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
                style={[
                  styles.filterButton,
                  showFilters && styles.filterButtonActive,
                ]}
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
                onPress={() =>
                  activeTab === "income"
                    ? setShowIncomeForm(true)
                    : setShowExpenseForm(true)
                }
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    activeTab === "income"
                      ? gradientColors.emerald
                      : gradientColors.teal
                  }
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
                <View
                  style={[
                    styles.actionButtonFullInner,
                    {
                      backgroundColor: theme.primaryBg,
                      borderColor: theme.primaryBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name="copy-outline"
                    size={18}
                    color={theme.primary}
                  />
                  <Text
                    style={[
                      styles.actionButtonFullText,
                      { color: theme.primary },
                    ]}
                  >
                    Clone
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButtonFull}
                onPress={handleToggleMonthStatus}
                disabled={
                  closeMonthMutation.isPending || openMonthMutation.isPending
                }
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.actionButtonFullInner,
                    {
                      backgroundColor: selectedMonth?.is_closed
                        ? theme.warningBg
                        : theme.successBg,
                      borderColor: selectedMonth?.is_closed
                        ? theme.warningBorder
                        : theme.successBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      selectedMonth?.is_closed
                        ? "lock-open-outline"
                        : "lock-closed-outline"
                    }
                    size={18}
                    color={
                      selectedMonth?.is_closed ? theme.warning : theme.success
                    }
                  />
                  <Text
                    style={[
                      styles.actionButtonFullText,
                      {
                        color: selectedMonth?.is_closed
                          ? theme.warning
                          : theme.success,
                      },
                    ]}
                  >
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
                <View
                  style={[
                    styles.actionButtonFullInner,
                    {
                      backgroundColor: theme.dangerBg,
                      borderColor: theme.dangerBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={theme.danger}
                  />
                  <Text
                    style={[
                      styles.actionButtonFullText,
                      { color: theme.danger },
                    ]}
                  >
                    Delete
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Filter Bar */}
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
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showScrollIndicators={false}
        />

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

      <PayExpenseModal
        visible={!!payingExpense}
        expense={payingExpense}
        onClose={() => setPayingExpense(null)}
        onConfirm={handlePayConfirm}
        isLoading={payExpenseMutation.isPending}
      />
    </View>
  );
};

const getStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 200,
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
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    monthSelectorContainer: {
      flex: 1,
    },
    filterButton: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: theme.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.borderGlass,
    },
    filterButtonActive: {
      backgroundColor: theme.primaryBg,
      borderColor: theme.primaryBorder,
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
    content: {
      padding: 16,
    },
    summaryContainer: {
      gap: 24,
    },
  });

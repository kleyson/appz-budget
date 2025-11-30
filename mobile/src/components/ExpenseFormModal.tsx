import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useCreateExpense, useUpdateExpense } from '../hooks/useExpenses';
import { useCategories } from '../hooks/useCategories';
import { usePeriods } from '../hooks/usePeriods';
import { Ionicons } from '@expo/vector-icons';
import type { Expense, ExpenseCreate, Purchase } from '../types';
import { getErrorMessage } from '../utils/errorHandler';

interface ExpenseFormModalProps {
  visible: boolean;
  expense?: Expense | null;
  monthId?: number | null;
  onClose: () => void;
}

export const ExpenseFormModal = ({
  visible,
  expense,
  monthId,
  onClose,
}: ExpenseFormModalProps) => {
  const { isDark } = useTheme();
  const { data: categories } = useCategories();
  const { data: periods } = usePeriods();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  const [expenseName, setExpenseName] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    if (expense) {
      setExpenseName(expense.expense_name);
      setSelectedPeriod(expense.period);
      setSelectedCategory(expense.category);
      setBudget(expense.budget.toString());
      setCost(expense.cost.toString());
      setNotes(expense.notes || '');
      setPurchases(expense.purchases || []);
    } else {
      setExpenseName('');
      setSelectedPeriod('');
      setSelectedCategory('');
      setBudget('');
      setCost('');
      setNotes('');
      setPurchases([]);
    }
  }, [expense, visible]);

  // Calculate cost from purchases (always calculated, never manually editable)
  const hasPurchases = purchases.length > 0;
  const calculatedCost = purchases.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Update cost when purchases change
  useEffect(() => {
    const total = purchases.reduce((sum, item) => sum + (item.amount || 0), 0);
    setCost(total.toString());
  }, [purchases]);

  const handleAddPurchase = () => {
    setPurchases([...purchases, { name: '', amount: 0 }]);
  };

  const handleRemovePurchase = (index: number) => {
    setPurchases(purchases.filter((_, i) => i !== index));
  };

  const handlePurchaseChange = (
    index: number,
    field: 'name' | 'amount',
    value: string | number
  ) => {
    setPurchases(
      purchases.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === 'amount' ? (typeof value === 'string' ? parseFloat(value) || 0 : value) : value,
            }
          : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!expenseName || !selectedPeriod || !selectedCategory || !budget || !monthId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!calculatedCost) {
      Alert.alert('Error', 'Please add purchases with amounts');
      return;
    }

    const data: ExpenseCreate = {
      expense_name: expenseName,
      period: selectedPeriod,
      category: selectedCategory,
      budget: parseFloat(budget),
      cost: calculatedCost,
      notes: notes || null,
      month_id: monthId,
      purchases: purchases.filter((item) => item.name.trim() !== '' || item.amount > 0),
    };

    try {
      if (expense) {
        await updateMutation.mutateAsync({ id: expense.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to save expense'));
    }
  };

  const styles = getStyles(isDark);
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{expense ? 'Edit Expense' : 'Add Expense'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <TextInput
              style={styles.input}
              placeholder="Expense Name"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={expenseName}
              onChangeText={setExpenseName}
            />

            <Text style={styles.label}>Period</Text>
            <View style={styles.chips}>
              {periods?.map((period) => (
                <TouchableOpacity
                  key={period.id}
                  style={[
                    styles.chip,
                    selectedPeriod === period.name && styles.chipActive,
                    { backgroundColor: selectedPeriod === period.name ? period.color : undefined },
                  ]}
                  onPress={() => setSelectedPeriod(period.name)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedPeriod === period.name && styles.chipTextActive,
                    ]}
                  >
                    {period.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Category</Text>
            <View style={styles.chips}>
              {categories?.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.chip,
                    selectedCategory === category.name && styles.chipActive,
                    {
                      backgroundColor:
                        selectedCategory === category.name ? category.color : undefined,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category.name)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === category.name && styles.chipTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Budget"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={budget}
              onChangeText={setBudget}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={[styles.input, styles.inputDisabled]}
              placeholder="Calculated Cost"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={calculatedCost.toFixed(2)}
              keyboardType="decimal-pad"
              editable={false}
            />

            {/* Purchases Section */}
            <Text style={styles.label}>Purchases</Text>
            <View style={styles.purchasesHeader}>
              <TouchableOpacity
                style={styles.addPurchaseButton}
                onPress={handleAddPurchase}
              >
                <Ionicons name="add-circle" size={20} color="#3b82f6" />
                <Text style={styles.addPurchaseText}>Add Purchase</Text>
              </TouchableOpacity>
            </View>

            {hasPurchases ? (
              <View style={styles.purchasesContainer}>
                {purchases.map((purchase, index) => (
                  <View key={index} style={styles.purchaseRow}>
                    <TextInput
                      style={[styles.input, styles.purchaseNameInput]}
                      placeholder="Purchase name"
                      placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                      value={purchase.name}
                      onChangeText={(value) => handlePurchaseChange(index, 'name', value)}
                    />
                    <TextInput
                      style={[styles.input, styles.purchaseAmountInput]}
                      placeholder="Amount"
                      placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                      value={purchase.amount.toString()}
                      onChangeText={(value) => handlePurchaseChange(index, 'amount', value)}
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity
                      style={styles.removePurchaseButton}
                      onPress={() => handleRemovePurchase(index)}
                    >
                      <Ionicons name="trash" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={styles.totalContainer}>
                  <Text
                    style={[
                      styles.totalText,
                      calculatedCost === 0 && styles.totalTextZero,
                    ]}
                  >
                    Total: ${calculatedCost.toFixed(2)}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.purchasesHint}>
                No purchases. Add purchases to calculate cost.
              </Text>
            )}

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes (optional)"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modal: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#111827',
    },
    content: {
      padding: 16,
    },
    input: {
      backgroundColor: isDark ? '#111827' : '#f3f4f6',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#d1d5db',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? '#ffffff' : '#111827',
      marginBottom: 16,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    inputDisabled: {
      backgroundColor: isDark ? '#111827' : '#f3f4f6',
      opacity: 0.7,
    },
    costHint: {
      fontSize: 12,
      color: isDark ? '#6b7280' : '#9ca3af',
      marginTop: -12,
      marginBottom: 16,
      marginLeft: 4,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#111827',
      marginBottom: 8,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#d1d5db',
      backgroundColor: isDark ? '#111827' : '#f3f4f6',
    },
    chipActive: {
      borderColor: '#3b82f6',
    },
    chipText: {
      fontSize: 14,
      color: isDark ? '#ffffff' : '#111827',
    },
    chipTextActive: {
      fontWeight: '600',
      color: '#3b82f6',
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#e5e7eb',
    },
    button: {
      flex: 1,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: isDark ? '#374151' : '#e5e7eb',
    },
    cancelButtonText: {
      color: isDark ? '#ffffff' : '#111827',
      fontWeight: '600',
    },
    submitButton: {
      backgroundColor: '#3b82f6',
    },
    submitButtonText: {
      color: '#ffffff',
      fontWeight: '600',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    purchasesHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 8,
    },
    addPurchaseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    addPurchaseText: {
      color: '#3b82f6',
      fontSize: 14,
      fontWeight: '600',
    },
    purchasesContainer: {
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#d1d5db',
      borderRadius: 8,
      padding: 12,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
      marginBottom: 16,
    },
    purchaseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    purchaseNameInput: {
      flex: 1,
      marginBottom: 0,
    },
    purchaseAmountInput: {
      width: 100,
      marginBottom: 0,
    },
    removePurchaseButton: {
      padding: 8,
    },
    totalContainer: {
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#d1d5db',
      paddingTop: 8,
      marginTop: 8,
    },
    totalText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#111827',
      textAlign: 'right',
    },
    totalTextZero: {
      color: isDark ? '#6b7280' : '#9ca3af',
    },
    purchasesHint: {
      fontSize: 12,
      color: isDark ? '#6b7280' : '#9ca3af',
      fontStyle: 'italic',
      marginBottom: 16,
    },
  });


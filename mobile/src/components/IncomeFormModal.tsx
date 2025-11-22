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
import { useCreateIncome, useUpdateIncome } from '../hooks/useIncomes';
import { useIncomeTypes } from '../hooks/useIncomeTypes';
import { usePeriods } from '../hooks/usePeriods';
import { Ionicons } from '@expo/vector-icons';
import type { Income, IncomeCreate } from '../types';
import { getErrorMessage } from '../utils/errorHandler';

interface IncomeFormModalProps {
  visible: boolean;
  income?: Income | null;
  monthId?: number | null;
  onClose: () => void;
}

export const IncomeFormModal = ({
  visible,
  income,
  monthId,
  onClose,
}: IncomeFormModalProps) => {
  const { isDark } = useTheme();
  const { data: incomeTypes } = useIncomeTypes();
  const { data: periods } = usePeriods();
  const createMutation = useCreateIncome();
  const updateMutation = useUpdateIncome();

  const [selectedIncomeTypeId, setSelectedIncomeTypeId] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [budget, setBudget] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (income) {
      setSelectedIncomeTypeId(income.income_type_id);
      setSelectedPeriod(income.period);
      setBudget(income.budget.toString());
      setAmount(income.amount.toString());
    } else {
      setSelectedIncomeTypeId(null);
      setSelectedPeriod('');
      setBudget('');
      setAmount('');
    }
  }, [income, visible]);

  const handleSubmit = async () => {
    if (!selectedIncomeTypeId || !selectedPeriod || !budget || !amount || !monthId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const data: IncomeCreate = {
      income_type_id: selectedIncomeTypeId,
      period: selectedPeriod,
      budget: parseFloat(budget),
      amount: parseFloat(amount),
      month_id: monthId,
    };

    try {
      if (income) {
        await updateMutation.mutateAsync({ id: income.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to save income'));
    }
  };

  const styles = getStyles(isDark);
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{income ? 'Edit Income' : 'Add Income'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.label}>Income Type</Text>
            <View style={styles.chips}>
              {incomeTypes?.map((incomeType) => (
                <TouchableOpacity
                  key={incomeType.id}
                  style={[
                    styles.chip,
                    selectedIncomeTypeId === incomeType.id && styles.chipActive,
                    {
                      backgroundColor:
                        selectedIncomeTypeId === incomeType.id ? incomeType.color : undefined,
                    },
                  ]}
                  onPress={() => setSelectedIncomeTypeId(incomeType.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedIncomeTypeId === incomeType.id && styles.chipTextActive,
                    ]}
                  >
                    {incomeType.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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

            <TextInput
              style={styles.input}
              placeholder="Budget"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={budget}
              onChangeText={setBudget}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
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
  });


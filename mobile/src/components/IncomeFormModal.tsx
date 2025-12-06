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
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useCreateIncome, useUpdateIncome } from '../hooks/useIncomes';
import { useIncomeTypes } from '../hooks/useIncomeTypes';
import { usePeriods } from '../hooks/usePeriods';
import { Ionicons } from '@expo/vector-icons';
import type { Income, IncomeCreate } from '../types';
import { getErrorMessage } from '../utils/errorHandler';
import { getThemeColors, colors, getShadow, gradientColors, radius, isDarkColor } from '../utils/colors';

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
  const theme = getThemeColors(isDark);
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

  const styles = getStyles(isDark, theme);
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIcon}>
                <Ionicons name="trending-up" size={20} color={theme.success} />
              </View>
              <Text style={styles.title}>{income ? 'Edit Income' : 'Add Income'}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Income Type Selection */}
            <View style={styles.filterGroup}>
              <View style={styles.filterHeader}>
                <View style={[styles.filterIcon, { backgroundColor: theme.successBg }]}>
                  <Ionicons name="cash-outline" size={14} color={theme.success} />
                </View>
                <Text style={styles.label}>Income Type</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {incomeTypes?.map((incomeType) => {
                  const isSelected = selectedIncomeTypeId === incomeType.id;
                  return (
                    <TouchableOpacity
                      key={incomeType.id}
                      style={[
                        styles.chip,
                        isSelected && styles.chipActive,
                        isSelected && { backgroundColor: incomeType.color, borderColor: incomeType.color },
                      ]}
                      onPress={() => setSelectedIncomeTypeId(incomeType.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                          isSelected && { color: isDarkColor(incomeType.color) ? '#ffffff' : '#0f172a' },
                        ]}
                      >
                        {incomeType.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Period Selection */}
            <View style={styles.filterGroup}>
              <View style={styles.filterHeader}>
                <View style={[styles.filterIcon, { backgroundColor: theme.primaryBg }]}>
                  <Ionicons name="calendar-outline" size={14} color={theme.primary} />
                </View>
                <Text style={styles.label}>Period</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {periods?.map((period) => {
                  const isSelected = selectedPeriod === period.name;
                  return (
                    <TouchableOpacity
                      key={period.id}
                      style={[
                        styles.chip,
                        isSelected && styles.chipActive,
                        isSelected && { backgroundColor: period.color, borderColor: period.color },
                      ]}
                      onPress={() => setSelectedPeriod(period.name)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                          isSelected && { color: isDarkColor(period.color) ? '#ffffff' : '#0f172a' },
                        ]}
                      >
                        {period.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Budget Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Budget</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="wallet-outline" size={18} color={theme.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={theme.placeholder}
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount Received</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="cash-outline" size={18} color={theme.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={theme.placeholder}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={gradientColors.emerald}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    <Text style={styles.submitButtonText}>Save Income</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modal: {
      backgroundColor: theme.cardSolid,
      borderTopLeftRadius: radius['2xl'],
      borderTopRightRadius: radius['2xl'],
      maxHeight: '90%',
      ...getShadow(isDark, 'xl'),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: theme.successBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      letterSpacing: -0.3,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : colors.slate[100],
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      padding: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: radius.md,
    },
    inputIconWrapper: {
      paddingLeft: 12,
    },
    input: {
      flex: 1,
      padding: 12,
      paddingLeft: 8,
      fontSize: 15,
      color: theme.text,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    filterGroup: {
      marginBottom: 16,
    },
    filterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    filterIcon: {
      width: 24,
      height: 24,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chips: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 16,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: isDark ? 'rgba(51, 65, 85, 0.3)' : colors.slate[50],
    },
    chipActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryBg,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    chipTextActive: {
      fontWeight: '600',
      color: theme.primary,
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    cancelButton: {
      flex: 1,
      padding: 14,
      borderRadius: radius.md,
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : colors.slate[100],
    },
    cancelButtonText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '600',
    },
    submitButton: {
      flex: 1.5,
      borderRadius: radius.md,
      overflow: 'hidden',
      ...getShadow(isDark, 'sm'),
    },
    submitGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      gap: 8,
    },
    submitButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '600',
    },
    buttonDisabled: {
      opacity: 0.7,
    },
  });


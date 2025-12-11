import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../contexts/ThemeContext";
import { useCreateIncome, useUpdateIncome } from "../../hooks/useIncomes";
import { useIncomeTypes } from "../../hooks/useIncomeTypes";
import { usePeriods } from "../../hooks/usePeriods";
import { Ionicons } from "@expo/vector-icons";
import type { Income, IncomeCreate, IncomeType } from "../../types";
import { getErrorMessage } from "../../utils/errorHandler";
import { getThemeColors, getShadow, gradientColors, radius, spacing, rgba } from "../../utils/colors";
import { FormInput, ChipGroup, Chip } from "../../components/shared";
import { useResponsive, responsive } from "../../hooks/useResponsive";

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
  const { isTablet } = useResponsive();
  const { data: incomeTypes } = useIncomeTypes();
  const { data: periods } = usePeriods();
  const createMutation = useCreateIncome();
  const updateMutation = useUpdateIncome();

  const [selectedIncomeTypeId, setSelectedIncomeTypeId] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [budget, setBudget] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (income) {
      setSelectedIncomeTypeId(income.income_type_id);
      setSelectedPeriod(income.period);
      setBudget(income.budget.toString());
      setAmount(income.amount.toString());
    } else {
      setSelectedIncomeTypeId(null);
      setSelectedPeriod("");
      setBudget("");
      setAmount("");
    }
  }, [income, visible]);

  const handleSubmit = async () => {
    if (!selectedIncomeTypeId || !selectedPeriod || !budget || !amount || !monthId) {
      Alert.alert("Error", "Please fill in all required fields");
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
      Alert.alert("Error", getErrorMessage(error, "Failed to save income"));
    }
  };

  const styles = getStyles(isDark, theme, isTablet);
  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Find selected income type for chip display
  const _selectedIncomeType = incomeTypes?.find((t: IncomeType) => t.id === selectedIncomeTypeId);

  return (
    <Modal visible={visible} transparent animationType={isTablet ? "fade" : "slide"} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalWrapper}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIcon}>
                <Ionicons name="trending-up" size={20} color={theme.success} />
              </View>
              <Text style={styles.title}>{income ? "Edit Income" : "Add Income"}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Income Type Selection */}
            <View style={styles.chipGroupContainer}>
              <View style={styles.filterHeader}>
                <View style={[styles.filterIcon, { backgroundColor: theme.successBg }]}>
                  <Ionicons name="cash-outline" size={14} color={theme.success} />
                </View>
                <Text style={styles.label}>Income Type</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
              >
                {incomeTypes?.map((incomeType: IncomeType) => (
                  <Chip
                    key={incomeType.id}
                    label={incomeType.name}
                    selected={selectedIncomeTypeId === incomeType.id}
                    color={incomeType.color}
                    onPress={() => setSelectedIncomeTypeId(incomeType.id)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Period Selection */}
            <ChipGroup
              label="Period"
              icon="calendar-outline"
              iconBgColor={theme.primaryBg}
              iconColor={theme.primary}
              options={periods || []}
              selectedValue={selectedPeriod}
              onSelect={setSelectedPeriod}
              showAllOption={false}
            />

            {/* Budget Input */}
            <View style={styles.inputSpacing}>
              <FormInput
                label="Budget"
                placeholder="0.00"
                value={budget}
                onChangeText={setBudget}
                keyboardType="decimal-pad"
                icon="wallet-outline"
              />
            </View>

            {/* Amount Input */}
            <FormInput
              label="Amount Received"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              icon="cash-outline"
            />
          </ScrollView>

          {/* Footer */}
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
      </View>
    </Modal>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>, isTablet: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: rgba.overlay,
      justifyContent: isTablet ? "center" : "flex-end",
    },
    modalWrapper: {
      maxWidth: isTablet ? responsive.maxWidths.modal : undefined,
      width: isTablet ? "100%" : undefined,
      alignSelf: isTablet ? "center" : undefined,
      paddingHorizontal: isTablet ? spacing.xl : 0,
    },
    modal: {
      backgroundColor: theme.cardSolid,
      borderTopLeftRadius: radius["2xl"],
      borderTopRightRadius: radius["2xl"],
      borderBottomLeftRadius: isTablet ? radius["2xl"] : 0,
      borderBottomRightRadius: isTablet ? radius["2xl"] : 0,
      maxHeight: isTablet ? "80%" : "90%",
      ...getShadow(isDark, "xl"),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: theme.successBg,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      letterSpacing: -0.3,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: theme.surfaceDefault,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      padding: spacing.lg,
    },
    chipGroupContainer: {
      marginBottom: spacing.lg,
    },
    filterHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    filterIcon: {
      width: 24,
      height: 24,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    chipsContainer: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    inputSpacing: {
      marginTop: spacing.lg,
    },
    footer: {
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    cancelButton: {
      flex: 1,
      padding: 14,
      borderRadius: radius.md,
      alignItems: "center",
      backgroundColor: theme.surfaceDefault,
    },
    cancelButtonText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "600",
    },
    submitButton: {
      flex: 1.5,
      borderRadius: radius.md,
      overflow: "hidden",
      ...getShadow(isDark, "sm"),
    },
    submitGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      gap: spacing.sm,
    },
    submitButtonText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "600",
    },
    buttonDisabled: {
      opacity: 0.7,
    },
  });

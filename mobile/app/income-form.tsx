import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../src/contexts/ThemeContext";
import {
  useIncome,
  useCreateIncome,
  useUpdateIncome,
} from "../src/hooks/useIncomes";
import { useIncomeTypes } from "../src/hooks/useIncomeTypes";
import { usePeriods } from "../src/hooks/usePeriods";
import type { IncomeCreate, IncomeType } from "../src/types";
import { getErrorMessage } from "../src/utils/errorHandler";
import {
  getThemeColors,
  gradientColors,
  radius,
  spacing,
} from "../src/utils/colors";
import { FormInput, ChipGroup, Chip, Icon } from "../src/components/shared";

export default function IncomeFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; monthId?: string }>();
  const incomeId = params.id ? parseInt(params.id) : 0;
  const monthId = params.monthId ? parseInt(params.monthId) : null;

  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { data: existingIncome } = useIncome(incomeId);
  const { data: incomeTypes } = useIncomeTypes();
  const { data: periods } = usePeriods();
  const createMutation = useCreateIncome();
  const updateMutation = useUpdateIncome();

  const [selectedIncomeTypeId, setSelectedIncomeTypeId] = useState<
    number | null
  >(null);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [budget, setBudget] = useState("");
  const [amount, setAmount] = useState("");

  const isEditing = incomeId > 0;

  useEffect(() => {
    if (existingIncome) {
      setSelectedIncomeTypeId(existingIncome.income_type_id);
      setSelectedPeriod(existingIncome.period);
      setBudget(existingIncome.budget.toString());
      setAmount(existingIncome.amount.toString());
    }
  }, [existingIncome]);

  const handleSubmit = async () => {
    if (
      !selectedIncomeTypeId ||
      !selectedPeriod ||
      !budget ||
      !amount ||
      !monthId
    ) {
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
      if (isEditing && incomeId) {
        await updateMutation.mutateAsync({ id: incomeId, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      router.back();
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error, "Failed to save income"));
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const styles = getStyles(theme);
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? "Edit Income" : "Add Income",
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
      >
        {/* Income Type Selection */}
        <View style={styles.chipGroupContainer}>
          <View style={styles.filterHeader}>
            <View
              style={[styles.filterIcon, { backgroundColor: theme.successBg }]}
            >
              <Icon name="cash-outline" size={14} color={theme.success} />
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

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
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
                  <Icon
                    name="checkmark-circle"
                    size={18}
                    color="#ffffff"
                  />
                  <Text style={styles.submitButtonText}>Save Income</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const getStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.cardSolid,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing["4xl"],
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
      borderCurve: "continuous",
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
      marginTop: spacing.xl,
    },
    cancelButton: {
      flex: 1,
      padding: 14,
      borderRadius: radius.md,
      alignItems: "center",
      backgroundColor: theme.surfaceDefault,
      borderCurve: "continuous",
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
      borderCurve: "continuous",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
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

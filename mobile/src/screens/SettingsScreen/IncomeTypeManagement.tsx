import React, { useState, useCallback } from "react";
import { View, FlatList, Alert, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";
import {
  useIncomeTypes,
  useCreateIncomeType,
  useUpdateIncomeType,
  useDeleteIncomeType,
  useRefreshIncomeTypes,
} from "../../hooks/useIncomeTypes";
import type { IncomeType } from "../../types";
import { getErrorMessage } from "../../utils/errorHandler";
import { getThemeColors, gradientColors } from "../../utils/colors";
import {
  BottomSheetModal,
  FormInput,
  ColorPicker,
  ListItem,
  AddButton,
  LoadingState,
  CustomRefreshControl,
} from "../../components/shared";

export const IncomeTypeManagement = () => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { refresh: refreshIncomeTypes, isRefreshing } = useRefreshIncomeTypes();
  const { data: incomeTypes, isLoading } = useIncomeTypes();
  const createMutation = useCreateIncomeType();
  const updateMutation = useUpdateIncomeType();
  const deleteMutation = useDeleteIncomeType();

  const [showForm, setShowForm] = useState(false);
  const [editingIncomeType, setEditingIncomeType] = useState<IncomeType | null>(
    null
  );
  const [name, setName] = useState("");
  const [color, setColor] = useState("#10b981");

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter an income type name");
      return;
    }

    try {
      if (editingIncomeType) {
        await updateMutation.mutateAsync({
          id: editingIncomeType.id,
          data: { name, color },
        });
      } else {
        await createMutation.mutateAsync({ name, color });
      }
      closeForm();
    } catch (error: unknown) {
      Alert.alert(
        "Error",
        getErrorMessage(error, "Failed to save income type")
      );
    }
  };

  const handleDelete = (incomeType: IncomeType) => {
    Alert.alert(
      "Delete Income Type",
      `Are you sure you want to delete "${incomeType.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(incomeType.id);
            } catch (_error) {
              Alert.alert("Error", "Failed to delete income type");
            }
          },
        },
      ]
    );
  };

  const openForm = (incomeType?: IncomeType) => {
    if (incomeType) {
      setEditingIncomeType(incomeType);
      setName(incomeType.name);
      setColor(incomeType.color);
    } else {
      setEditingIncomeType(null);
      setName("");
      setColor("#10b981");
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setName("");
    setColor("#10b981");
    setEditingIncomeType(null);
  };

  const handleRefresh = useCallback(() => {
    refreshIncomeTypes();
  }, [refreshIncomeTypes]);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        data={incomeTypes || []}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Animated.View entering={FadeIn.duration(300)}>
            <AddButton
              label="Add Income Type"
              onPress={() => openForm()}
              variant="success"
              style={styles.addButton}
            />
          </Animated.View>
        }
        refreshControl={
          <CustomRefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            color={theme.primary}
          />
        }
        renderItem={({ item, index }) => (
          <ListItem
            name={item.name}
            color={item.color}
            onEdit={() => openForm(item)}
            onDelete={() => handleDelete(item)}
            animated
            animationIndex={index}
          />
        )}
      />

      <BottomSheetModal
        visible={showForm}
        onClose={closeForm}
        title={editingIncomeType ? "Edit Income Type" : "Add Income Type"}
        icon="cash"
        iconBgColor={theme.successBg}
        iconColor={theme.success}
        onSave={handleSave}
        saveGradient={gradientColors.emerald}
      >
        <FormInput
          label="Income Type Name"
          placeholder="Enter income type name"
          value={name}
          onChangeText={setName}
          icon="text-outline"
        />
        <ColorPicker value={color} onChange={setColor} />
      </BottomSheetModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  addButton: {
    marginBottom: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 200,
    gap: 10,
  },
});

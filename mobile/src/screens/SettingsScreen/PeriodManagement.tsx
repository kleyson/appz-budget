import React, { useState, useCallback } from "react";
import { View, FlatList, Alert, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import {
  usePeriods,
  useCreatePeriod,
  useUpdatePeriod,
  useDeletePeriod,
  useRefreshPeriods,
} from "../../hooks/usePeriods";
import type { Period } from "../../types";
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

export const PeriodManagement = () => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { refresh: refreshPeriods, isRefreshing } = useRefreshPeriods();
  const { data: periods, isLoading } = usePeriods();
  const createMutation = useCreatePeriod();
  const updateMutation = useUpdatePeriod();
  const deleteMutation = useDeletePeriod();

  const [showForm, setShowForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#14b8a6");

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a period name");
      return;
    }

    try {
      if (editingPeriod) {
        await updateMutation.mutateAsync({
          id: editingPeriod.id,
          data: { name, color },
        });
      } else {
        await createMutation.mutateAsync({ name, color });
      }
      closeForm();
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error, "Failed to save period"));
    }
  };

  const handleDelete = (period: Period) => {
    Alert.alert(
      "Delete Period",
      `Are you sure you want to delete "${period.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(period.id);
            } catch (_error) {
              Alert.alert("Error", "Failed to delete period");
            }
          },
        },
      ]
    );
  };

  const openForm = (period?: Period) => {
    if (period) {
      setEditingPeriod(period);
      setName(period.name);
      setColor(period.color);
    } else {
      setEditingPeriod(null);
      setName("");
      setColor("#14b8a6");
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setName("");
    setColor("#14b8a6");
    setEditingPeriod(null);
  };

  const handleRefresh = useCallback(() => {
    refreshPeriods();
  }, [refreshPeriods]);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        data={periods || []}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <AddButton
            label="Add Period"
            onPress={() => openForm()}
            style={styles.addButton}
          />
        }
        refreshControl={
          <CustomRefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            color={theme.primary}
          />
        }
        renderItem={({ item }) => (
          <ListItem
            name={item.name}
            color={item.color}
            onEdit={() => openForm(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
      />

      <BottomSheetModal
        visible={showForm}
        onClose={closeForm}
        title={editingPeriod ? "Edit Period" : "Add Period"}
        icon="calendar"
        iconBgColor={theme.primaryBg}
        iconColor={theme.primary}
        onSave={handleSave}
        saveGradient={gradientColors.teal}
      >
        <FormInput
          label="Period Name"
          placeholder="Enter period name"
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

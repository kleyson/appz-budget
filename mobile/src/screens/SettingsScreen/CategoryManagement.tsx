import React, { useState, useCallback } from "react";
import { View, FlatList, Alert, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useRefreshCategories,
} from "../../hooks/useCategories";
import type { Category } from "../../types";
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

export const CategoryManagement = () => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { refresh: refreshCategories, isRefreshing } = useRefreshCategories();
  const { data: categories, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#14b8a6");

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          data: { name, color },
        });
      } else {
        await createMutation.mutateAsync({ name, color });
      }
      closeForm();
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error, "Failed to save category"));
    }
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(category.id);
            } catch (_error) {
              Alert.alert("Error", "Failed to delete category");
            }
          },
        },
      ]
    );
  };

  const openForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setColor(category.color);
    } else {
      setEditingCategory(null);
      setName("");
      setColor("#14b8a6");
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setName("");
    setColor("#14b8a6");
    setEditingCategory(null);
  };

  const handleRefresh = useCallback(() => {
    refreshCategories();
  }, [refreshCategories]);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        data={categories || []}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Animated.View entering={FadeIn.duration(300)}>
            <AddButton
              label="Add Category"
              onPress={() => openForm()}
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
        title={editingCategory ? "Edit Category" : "Add Category"}
        icon="pricetag"
        iconBgColor={theme.primaryBg}
        iconColor={theme.primary}
        onSave={handleSave}
        saveGradient={gradientColors.teal}
      >
        <FormInput
          label="Category Name"
          placeholder="Enter category name"
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

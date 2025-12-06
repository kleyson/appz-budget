import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../hooks/useCategories';
import { Ionicons } from '@expo/vector-icons';
import type { Category } from '../../types';
import { getErrorMessage } from '../../utils/errorHandler';
import { getThemeColors, colors, getShadow, gradientColors, radius } from '../../utils/colors';

export const CategoryManagement = () => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { data: categories, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#14b8a6');

  const colorOptions = ['#14b8a6', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory.id, data: { name, color } });
      } else {
        await createMutation.mutateAsync({ name, color });
      }
      setShowForm(false);
      setName('');
      setColor('#14b8a6');
      setEditingCategory(null);
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to save category'));
    }
  };

  const handleDelete = (category: Category) => {
    Alert.alert('Delete Category', `Are you sure you want to delete "${category.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(category.id);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete category');
          }
        },
      },
    ]);
  };

  const openForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setColor(category.color);
    } else {
      setEditingCategory(null);
      setName('');
      setColor('#14b8a6');
    }
    setShowForm(true);
  };

  const styles = getStyles(isDark, theme);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => openForm()} activeOpacity={0.7}>
        <View style={styles.addButtonIcon}>
          <Ionicons name="add" size={18} color={theme.primary} />
        </View>
        <Text style={styles.addButtonText}>Add Category</Text>
      </TouchableOpacity>

      <FlatList
        data={categories || []}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
            <View style={styles.itemContent}>
              <Text style={styles.itemName}>{item.name}</Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openForm(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={18} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteActionButton]}
                onPress={() => handleDelete(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color={theme.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIcon}>
                  <Ionicons name="pricetag" size={20} color={theme.primary} />
                </View>
                <Text style={styles.modalTitle}>
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowForm(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category Name</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="text-outline" size={18} color={theme.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter category name"
                  placeholderTextColor={theme.placeholder}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorPicker}>
                {colorOptions.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorOption,
                      { backgroundColor: c },
                      color === c && styles.colorOptionSelected,
                    ]}
                    onPress={() => setColor(c)}
                    activeOpacity={0.7}
                  >
                    {color === c && <Ionicons name="checkmark" size={18} color="#ffffff" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowForm(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={gradientColors.teal}
                  style={styles.saveGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 14,
      backgroundColor: theme.primaryBg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(20, 184, 166, 0.2)' : 'rgba(20, 184, 166, 0.15)',
      marginBottom: 16,
    },
    addButtonIcon: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      backgroundColor: isDark ? 'rgba(20, 184, 166, 0.2)' : 'rgba(20, 184, 166, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
      color: theme.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    listContent: {
      gap: 10,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      backgroundColor: theme.cardSolid,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
      ...getShadow(isDark, 'sm'),
    },
    colorIndicator: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
    },
    itemContent: {
      flex: 1,
    },
    itemName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
    itemActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: theme.primaryBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteActionButton: {
      backgroundColor: theme.dangerBg,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.cardSolid,
      borderTopLeftRadius: radius['2xl'],
      borderTopRightRadius: radius['2xl'],
      padding: 20,
      ...getShadow(isDark, 'xl'),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    modalIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: theme.primaryBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalTitle: {
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
    colorPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorOption: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: 'transparent',
    },
    colorOptionSelected: {
      borderColor: theme.text,
    },
    modalFooter: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
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
    saveButton: {
      flex: 1.5,
      borderRadius: radius.md,
      overflow: 'hidden',
      ...getShadow(isDark, 'sm'),
    },
    saveGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      gap: 8,
    },
    saveButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '600',
    },
  });

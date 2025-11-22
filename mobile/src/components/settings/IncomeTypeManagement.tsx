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
import { useTheme } from '../../contexts/ThemeContext';
import { useIncomeTypes, useCreateIncomeType, useUpdateIncomeType, useDeleteIncomeType } from '../../hooks/useIncomeTypes';
import { Ionicons } from '@expo/vector-icons';
import type { IncomeType } from '../../types';
import { getErrorMessage } from '../../utils/errorHandler';

export const IncomeTypeManagement = () => {
  const { isDark } = useTheme();
  const { data: incomeTypes, isLoading } = useIncomeTypes();
  const createMutation = useCreateIncomeType();
  const updateMutation = useUpdateIncomeType();
  const deleteMutation = useDeleteIncomeType();

  const [showForm, setShowForm] = useState(false);
  const [editingIncomeType, setEditingIncomeType] = useState<IncomeType | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');

  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an income type name');
      return;
    }

    try {
      if (editingIncomeType) {
        await updateMutation.mutateAsync({ id: editingIncomeType.id, data: { name, color } });
      } else {
        await createMutation.mutateAsync({ name, color });
      }
      setShowForm(false);
      setName('');
      setColor('#10b981');
      setEditingIncomeType(null);
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to save income type'));
    }
  };

  const handleDelete = (incomeType: IncomeType) => {
    Alert.alert('Delete Income Type', `Are you sure you want to delete "${incomeType.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(incomeType.id);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete income type');
          }
        },
      },
    ]);
  };

  const openForm = (incomeType?: IncomeType) => {
    if (incomeType) {
      setEditingIncomeType(incomeType);
      setName(incomeType.name);
      setColor(incomeType.color);
    } else {
      setEditingIncomeType(null);
      setName('');
      setColor('#10b981');
    }
    setShowForm(true);
  };

  const styles = getStyles(isDark);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => openForm()}>
        <Ionicons name="add-circle" size={24} color="#3b82f6" />
        <Text style={styles.addButtonText}>Add Income Type</Text>
      </TouchableOpacity>

      <FlatList
        data={incomeTypes || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
            <View style={styles.itemContent}>
              <Text style={styles.itemName}>{item.name}</Text>
            </View>
            <TouchableOpacity onPress={() => openForm(item)}>
              <Ionicons name="pencil" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)}>
              <Ionicons name="trash" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingIncomeType ? 'Edit Income Type' : 'Add Income Type'}
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#111827'} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Income Type Name"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorPicker}>
              {colors.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.colorOptionSelected,
                  ]}
                  onPress={() => setColor(c)}
                >
                  {color === c && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (isDark: boolean) =>
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
      gap: 8,
      padding: 12,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      marginBottom: 16,
    },
    addButtonText: {
      color: '#3b82f6',
      fontWeight: '600',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      marginBottom: 12,
    },
    colorIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 12,
    },
    itemContent: {
      flex: 1,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#111827',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#111827',
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
    colorPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorOptionSelected: {
      borderColor: '#3b82f6',
    },
    modalFooter: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    modalButton: {
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
    saveButton: {
      backgroundColor: '#3b82f6',
    },
    saveButtonText: {
      color: '#ffffff',
      fontWeight: '600',
    },
  });


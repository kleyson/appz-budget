import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useMonths } from '../hooks/useMonths';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { Month } from '../types';

interface MonthSelectorProps {
  selectedMonthId: number | null;
  onMonthChange: (monthId: number | null) => void;
}

export const MonthSelector = ({ selectedMonthId, onMonthChange }: MonthSelectorProps) => {
  const { isDark } = useTheme();
  const { data: months, isLoading } = useMonths();
  const [modalVisible, setModalVisible] = React.useState(false);

  const selectedMonth = months?.find((m) => m.id === selectedMonthId);

  const styles = getStyles(isDark);

  return (
    <View>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectorText}>
          {selectedMonth ? selectedMonth.name : 'Select Month'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#111827'} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={months || []}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.monthItem,
                    selectedMonthId === item.id && styles.monthItemSelected,
                  ]}
                  onPress={() => {
                    onMonthChange(item.id);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.monthItemText,
                      selectedMonthId === item.id && styles.monthItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedMonthId === item.id && (
                    <Ionicons name="checkmark" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    selector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      backgroundColor: isDark ? '#111827' : '#f3f4f6',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#d1d5db',
    },
    selectorText: {
      fontSize: 16,
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
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#111827',
    },
    monthItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    monthItemSelected: {
      backgroundColor: isDark ? '#1e3a8a' : '#dbeafe',
    },
    monthItemText: {
      fontSize: 16,
      color: isDark ? '#ffffff' : '#111827',
    },
    monthItemTextSelected: {
      fontWeight: '600',
      color: '#3b82f6',
    },
  });


import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useUsers } from '../../hooks/useUsers';
import { Ionicons } from '@expo/vector-icons';

export const UserManagement = () => {
  const { isDark } = useTheme();
  const { data: users, isLoading } = useUsers();

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
      <FlatList
        data={users || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemContent}>
              <Text style={styles.itemName}>{item.email}</Text>
              <Text style={styles.itemSubtext}>
                {item.full_name || 'No name'} • {item.is_admin ? 'Admin' : 'User'}
              </Text>
            </View>
            {item.is_admin && (
              <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
            )}
          </View>
        )}
      />
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
    itemContent: {
      flex: 1,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#111827',
      marginBottom: 4,
    },
    itemSubtext: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
  });


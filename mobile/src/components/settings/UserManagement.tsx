import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "../../hooks/useUsers";
import { Ionicons } from "@expo/vector-icons";
import type { User } from "../../types";
import { getErrorMessage } from "../../utils/errorHandler";

export const UserManagement = () => {
  const { isDark } = useTheme();
  const { data: users, isLoading } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const handleSave = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    if (!editingUser && !password.trim()) {
      Alert.alert("Error", "Please enter a password");
      return;
    }

    try {
      if (editingUser) {
        const updateData: Partial<User> & {
          is_active?: boolean;
          password?: string;
        } = {
          email,
          full_name: fullName.trim() || null,
          is_admin: isAdmin,
          is_active: isActive,
        };
        if (password.trim()) {
          updateData.password = password;
        }
        await updateMutation.mutateAsync({
          id: editingUser.id,
          data: updateData,
        });
      } else {
        await createMutation.mutateAsync({
          email,
          password,
          full_name: fullName.trim() || null,
          is_active: isActive,
          // @ts-ignore - is_admin is accepted by the API but not in the type
          is_admin: isAdmin,
        });
      }
      setShowForm(false);
      setEmail("");
      setPassword("");
      setFullName("");
      setIsAdmin(false);
      setIsActive(true);
      setEditingUser(null);
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error, "Failed to save user"));
    }
  };

  const handleDelete = (user: User) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete "${user.email}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(user.id);
            } catch (error) {
              Alert.alert(
                "Error",
                getErrorMessage(error, "Failed to delete user")
              );
            }
          },
        },
      ]
    );
  };

  const openForm = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setEmail(user.email);
      setPassword("");
      setFullName(user.full_name || "");
      setIsAdmin(user.is_admin);
      setIsActive(user.is_active);
    } else {
      setEditingUser(null);
      setEmail("");
      setPassword("");
      setFullName("");
      setIsAdmin(false);
      setIsActive(true);
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
        <Text style={styles.addButtonText}>Add User</Text>
      </TouchableOpacity>

      <FlatList
        data={users || []}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: item.is_admin ? "#3b82f6" : "#10b981",
                  },
                ]}
              >
                <Text
                  style={styles.badgeText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.email}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openForm(item)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingUser ? "Edit User" : "Add User"}
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={isDark ? "#ffffff" : "#111827"}
                />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder={
                editingUser
                  ? "Password (leave blank to keep current)"
                  : "Password"
              }
              placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Full Name (optional)"
              placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
              value={fullName}
              onChangeText={setFullName}
            />

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Admin</Text>
              <Switch
                value={isAdmin}
                onValueChange={setIsAdmin}
                trackColor={{
                  false: isDark ? "#374151" : "#d1d5db",
                  true: "#3b82f6",
                }}
                thumbColor={
                  isAdmin ? "#ffffff" : isDark ? "#9ca3af" : "#f3f4f6"
                }
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Active</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{
                  false: isDark ? "#374151" : "#d1d5db",
                  true: "#3b82f6",
                }}
                thumbColor={
                  isActive ? "#ffffff" : isDark ? "#9ca3af" : "#f3f4f6"
                }
              />
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
      justifyContent: "center",
      alignItems: "center",
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#e5e7eb",
      marginBottom: 16,
    },
    addButtonText: {
      color: "#3b82f6",
      fontWeight: "600",
    },
    row: {
      justifyContent: "space-between",
      gap: 12,
    },
    card: {
      flex: 1,
      minWidth: 0,
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#e5e7eb",
      marginBottom: 12,
      padding: 12,
    },
    cardContent: {
      alignItems: "center",
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginBottom: 12,
      width: "100%",
    },
    badgeText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
    cardActions: {
      flexDirection: "row",
      gap: 8,
      width: "100%",
    },
    editButton: {
      flex: 1,
      backgroundColor: "#3b82f6",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: "center",
    },
    editButtonText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "600",
    },
    deleteButton: {
      flex: 1,
      backgroundColor: "#ef4444",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: "center",
    },
    deleteButtonText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "600",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#ffffff" : "#111827",
    },
    input: {
      backgroundColor: isDark ? "#111827" : "#f3f4f6",
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#d1d5db",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? "#ffffff" : "#111827",
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#ffffff" : "#111827",
    },
    switchContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalFooter: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },
    modalButton: {
      flex: 1,
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
    },
    cancelButton: {
      backgroundColor: isDark ? "#374151" : "#e5e7eb",
    },
    cancelButtonText: {
      color: isDark ? "#ffffff" : "#111827",
      fontWeight: "600",
    },
    saveButton: {
      backgroundColor: "#3b82f6",
    },
    saveButtonText: {
      color: "#ffffff",
      fontWeight: "600",
    },
  });

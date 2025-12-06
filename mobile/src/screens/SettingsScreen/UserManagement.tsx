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
import { getThemeColors, getShadow, radius } from "../../utils/colors";
import { Button } from "../../components/shared";

export const UserManagement = () => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
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
              Alert.alert("Error", getErrorMessage(error, "Failed to delete user"));
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
        <Text style={styles.addButtonText}>Add User</Text>
      </TouchableOpacity>

      <FlatList
        data={users || []}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.colorBar, { backgroundColor: item.is_admin ? theme.primary : theme.success }]} />
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.userIcon}>
                  <Ionicons
                    name={item.is_admin ? "shield" : "person"}
                    size={16}
                    color={item.is_admin ? theme.primary : theme.success}
                  />
                </View>
                <View style={[styles.statusBadge, !item.is_active && styles.statusBadgeInactive]}>
                  <Text style={[styles.statusText, !item.is_active && styles.statusTextInactive]}>
                    {item.is_active ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardEmail} numberOfLines={1} ellipsizeMode="tail">
                {item.email}
              </Text>
              {item.full_name && (
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.full_name}
                </Text>
              )}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openForm(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil-outline" size={14} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={14} color={theme.danger} />
                </TouchableOpacity>
              </View>
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
                  <Ionicons name="person" size={20} color={theme.primary} />
                </View>
                <Text style={styles.modalTitle}>
                  {editingUser ? "Edit User" : "Add User"}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowForm(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="mail-outline" size={18} color={theme.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="user@example.com"
                  placeholderTextColor={theme.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
                  placeholderTextColor={theme.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name (Optional)</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="person-outline" size={18} color={theme.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={theme.placeholder}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <View style={[styles.switchIcon, { backgroundColor: theme.primaryBg }]}>
                  <Ionicons name="shield-outline" size={16} color={theme.primary} />
                </View>
                <Text style={styles.switchText}>Admin</Text>
              </View>
              <Switch
                value={isAdmin}
                onValueChange={setIsAdmin}
                trackColor={{
                  false: theme.switchTrackOff,
                  true: theme.primary,
                }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <View style={[styles.switchIcon, { backgroundColor: theme.successBg }]}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={theme.success} />
                </View>
                <Text style={styles.switchText}>Active</Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{
                  false: theme.switchTrackOff,
                  true: theme.success,
                }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.modalFooter}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setShowForm(false)}
                fullWidth
              />
              <Button
                label="Save"
                icon="checkmark-circle"
                onPress={handleSave}
                fullWidth
                style={{ flex: 1.5 }}
              />
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
      justifyContent: "center",
      alignItems: "center",
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 14,
      backgroundColor: theme.primaryBg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.primaryBorderSubtle,
      marginBottom: 16,
    },
    addButtonIcon: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      backgroundColor: theme.primarySurface,
      alignItems: "center",
      justifyContent: "center",
    },
    addButtonText: {
      color: theme.primary,
      fontSize: 15,
      fontWeight: "600",
    },
    row: {
      justifyContent: "space-between",
      gap: 12,
    },
    card: {
      flex: 1,
      minWidth: 0,
      backgroundColor: theme.cardSolid,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 12,
      overflow: "hidden",
      ...getShadow(isDark, "sm"),
    },
    colorBar: {
      height: 4,
    },
    cardContent: {
      padding: 12,
      gap: 8,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    userIcon: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      backgroundColor: theme.surfaceDefault,
      alignItems: "center",
      justifyContent: "center",
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.sm,
      backgroundColor: theme.successBg,
    },
    statusBadgeInactive: {
      backgroundColor: theme.surfaceDefault,
    },
    statusText: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.success,
      textTransform: "uppercase",
    },
    statusTextInactive: {
      color: theme.textMuted,
    },
    cardEmail: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.text,
    },
    cardName: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    cardActions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 4,
    },
    editButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      backgroundColor: theme.primaryBg,
      borderRadius: radius.sm,
      gap: 4,
    },
    deleteButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      backgroundColor: theme.dangerBg,
      borderRadius: radius.sm,
      gap: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.cardSolid,
      borderTopLeftRadius: radius["2xl"],
      borderTopRightRadius: radius["2xl"],
      padding: 20,
      ...getShadow(isDark, "xl"),
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    modalIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: theme.primaryBg,
      alignItems: "center",
      justifyContent: "center",
    },
    modalTitle: {
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
    inputGroup: {
      marginBottom: 16,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
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
      fontWeight: "600",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    switchRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    switchLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    switchIcon: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    switchText: {
      fontSize: 15,
      fontWeight: "500",
      color: theme.text,
    },
    modalFooter: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },
  });

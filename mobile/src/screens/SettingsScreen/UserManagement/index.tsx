import React, { useState, useCallback } from "react";
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
  ScrollView,
  RefreshControl,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useRefreshUsers,
} from "../../../hooks/useUsers";
import { Ionicons } from "@expo/vector-icons";
import type { User } from "../../../types";
import { getErrorMessage } from "../../../utils/errorHandler";
import { getThemeColors, getShadow, radius } from "../../../utils/colors";
import { Button, ResponsiveModalContainer } from "../../../components/shared";
import { useResponsive, responsive } from "../../../hooks/useResponsive";
import { AnimatedUserCard } from "./AnimatedUserCard";

export const UserManagement = () => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { columns, isTablet } = useResponsive();
  const { refresh: refreshUsers, isRefreshing } = useRefreshUsers();
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

  const handleRefresh = useCallback(() => {
    refreshUsers();
  }, [refreshUsers]);

  // Use at least 2 columns for users, more on larger tablets
  const userColumns = Math.max(2, columns);
  const styles = getStyles(isDark, theme, isTablet);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        data={users || []}
        key={userColumns} // Force re-render when columns change
        numColumns={userColumns}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Animated.View entering={FadeIn.duration(300)}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openForm()}
              activeOpacity={0.7}
            >
              <View style={styles.addButtonIcon}>
                <Ionicons name="add" size={18} color={theme.primary} />
              </View>
              <Text style={styles.addButtonText}>Add User</Text>
            </TouchableOpacity>
          </Animated.View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.refreshControlTint}
            colors={[theme.refreshControlTint]}
          />
        }
        renderItem={({ item, index }) => (
          <AnimatedUserCard
            user={item}
            index={index}
            onEdit={() => openForm(item)}
            onDelete={() => handleDelete(item)}
            theme={theme}
            isDark={isDark}
          />
        )}
      />

      <Modal
        visible={showForm}
        transparent
        animationType={isTablet ? "fade" : "slide"}
        onRequestClose={() => setShowForm(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <ResponsiveModalContainer style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIcon}>
                  <Ionicons name="person" size={20} color={theme.primary} />
                </View>
                <Text style={styles.modalTitle}>
                  {editingUser ? "Edit User" : "Add User"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowForm(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={theme.textMuted}
                  />
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
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={theme.textMuted}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={
                    editingUser
                      ? "Leave blank to keep current"
                      : "Enter password"
                  }
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
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={theme.textMuted}
                  />
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
                <View
                  style={[
                    styles.switchIcon,
                    { backgroundColor: theme.primaryBg },
                  ]}
                >
                  <Ionicons
                    name="shield-outline"
                    size={16}
                    color={theme.primary}
                  />
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
                <View
                  style={[
                    styles.switchIcon,
                    { backgroundColor: theme.successBg },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={16}
                    color={theme.success}
                  />
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
          </ResponsiveModalContainer>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>, isTablet: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: isTablet ? 24 : 16,
      paddingBottom: 200,
      maxWidth: responsive.maxWidths.content,
      alignSelf: "center",
      width: "100%",
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
      marginBottom: 12,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: isTablet ? "center" : "flex-end",
    },
    modalScrollContent: {
      flexGrow: 1,
      justifyContent: isTablet ? "center" : "flex-end",
    },
    modalContent: {
      backgroundColor: theme.cardSolid,
      borderTopLeftRadius: radius["2xl"],
      borderTopRightRadius: radius["2xl"],
      borderBottomLeftRadius: isTablet ? radius["2xl"] : 0,
      borderBottomRightRadius: isTablet ? radius["2xl"] : 0,
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

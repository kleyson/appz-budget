import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { useMonths } from "../../hooks/useMonths";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors, getShadow, radius, rgba } from "../../utils/colors";
import type { Month } from "../../types";

interface MonthSelectorProps {
  selectedMonthId: number | null;
  onMonthChange: (monthId: number | null) => void;
}

export const MonthSelector = ({
  selectedMonthId,
  onMonthChange,
}: MonthSelectorProps) => {
  const { isDark } = useTheme();
  const theme = getThemeColors(isDark);
  const { data: months, isLoading } = useMonths();
  const [modalVisible, setModalVisible] = React.useState(false);

  const selectedMonth = months?.find((m) => m.id === selectedMonthId);

  const styles = getStyles(isDark, theme);

  return (
    <View>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.selectorContent}>
          <View style={[styles.calendarIcon, selectedMonth?.is_closed && styles.calendarIconClosed]}>
            <Ionicons
              name={selectedMonth?.is_closed ? "lock-closed" : "calendar"}
              size={16}
              color={selectedMonth?.is_closed ? theme.warning : theme.primary}
            />
          </View>
          <View style={styles.selectorTextContainer}>
            <Text style={styles.selectorLabel}>Month</Text>
            <View style={styles.selectorValueRow}>
              <Text style={styles.selectorValue}>
                {selectedMonth ? selectedMonth.name : "Select Month"}
              </Text>
              {selectedMonth?.is_closed && (
                <View style={styles.closedBadge}>
                  <Text style={styles.closedBadgeText}>Closed</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <Ionicons name="chevron-down" size={18} color={theme.textMuted} />
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
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIconWrapper}>
                  <Ionicons name="calendar" size={20} color={theme.primary} />
                </View>
                <Text style={styles.modalTitle}>Select Month</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={months || []}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = selectedMonthId === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.monthItem, isSelected && styles.monthItemSelected]}
                    onPress={() => {
                      onMonthChange(item.id);
                      setModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.monthItemContent}>
                      <View
                        style={[
                          styles.monthIcon,
                          isSelected && styles.monthIconSelected,
                          item.is_closed && !isSelected && styles.monthIconClosed,
                        ]}
                      >
                        <Ionicons
                          name={item.is_closed ? "lock-closed-outline" : "calendar-outline"}
                          size={16}
                          color={isSelected ? "#ffffff" : item.is_closed ? theme.warning : theme.textMuted}
                        />
                      </View>
                      <Text
                        style={[
                          styles.monthItemText,
                          isSelected && styles.monthItemTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.is_closed && (
                        <View style={styles.monthClosedBadge}>
                          <Text style={styles.monthClosedBadgeText}>Closed</Text>
                        </View>
                      )}
                    </View>
                    {isSelected && (
                      <View style={styles.checkIcon}>
                        <Ionicons name="checkmark" size={16} color={theme.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (isDark: boolean, theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    selector: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
      backgroundColor: theme.surfaceMuted,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.borderGlass,
    },
    selectorContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    calendarIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: theme.primaryBg,
      alignItems: "center",
      justifyContent: "center",
    },
    calendarIconClosed: {
      backgroundColor: theme.warningBg,
    },
    selectorTextContainer: {
      gap: 2,
    },
    selectorValueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    closedBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
      backgroundColor: theme.warningBg,
    },
    closedBadgeText: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.warning,
      textTransform: "uppercase",
    },
    selectorLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    selectorValue: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: rgba.overlay,
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.cardSolid,
      borderTopLeftRadius: radius["2xl"],
      borderTopRightRadius: radius["2xl"],
      maxHeight: "70%",
      ...getShadow(isDark, "xl"),
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    modalIconWrapper: {
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
    listContent: {
      padding: 12,
      gap: 6,
    },
    monthItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 14,
      borderRadius: radius.md,
      backgroundColor: theme.surfaceSubtle,
    },
    monthItemSelected: {
      backgroundColor: theme.primaryBg,
      borderWidth: 1,
      borderColor: theme.primaryBorder,
    },
    monthItemContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    monthIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: theme.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    monthIconSelected: {
      backgroundColor: theme.primary,
    },
    monthIconClosed: {
      backgroundColor: theme.warningBg,
    },
    monthItemText: {
      fontSize: 15,
      fontWeight: "500",
      color: theme.text,
    },
    monthClosedBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
      backgroundColor: theme.warningBg,
    },
    monthClosedBadgeText: {
      fontSize: 9,
      fontWeight: "600",
      color: theme.warning,
      textTransform: "uppercase",
    },
    monthItemTextSelected: {
      fontWeight: "600",
      color: theme.primary,
    },
    checkIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.primaryBg,
      alignItems: "center",
      justifyContent: "center",
    },
  });

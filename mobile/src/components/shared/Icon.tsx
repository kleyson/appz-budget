import React from "react";
import { Platform } from "react-native";
import { SymbolView, SymbolViewProps } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import { getSFSymbolName } from "../../utils/icons";

type SymbolWeight = SymbolViewProps["weight"];
type SFSymbolName = SymbolViewProps["name"];

interface IconProps {
  /**
   * Icon name - can be either Ionicons name or SF Symbol name
   * Ionicons names are automatically mapped to SF Symbols on iOS
   */
  name: string;
  /**
   * Icon size in points
   */
  size?: number;
  /**
   * Icon color
   */
  color?: string;
  /**
   * Symbol weight (iOS only)
   */
  weight?: SymbolWeight;
}

/**
 * Cross-platform Icon component
 * Uses SF Symbols on iOS and Ionicons on Android/Web
 */
export function Icon({
  name,
  size = 24,
  color,
  weight = "regular",
}: IconProps) {
  // On iOS, use native SF Symbols for better performance and appearance
  if (Platform.OS === "ios") {
    const sfSymbolName = getSFSymbolName(name) as SFSymbolName;
    return (
      <SymbolView
        name={sfSymbolName}
        size={size}
        tintColor={color}
        weight={weight}
      />
    );
  }

  // On Android/Web, fall back to Ionicons
  return (
    <Ionicons
      name={name as keyof typeof Ionicons.glyphMap}
      size={size}
      color={color}
    />
  );
}

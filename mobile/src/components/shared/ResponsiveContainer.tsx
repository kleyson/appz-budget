import React from "react";
import { View, ViewStyle, DimensionValue } from "react-native";
import { useResponsive, responsive } from "../../hooks/useResponsive";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  /** Custom max width (defaults to responsive.maxWidths.content) */
  maxWidth?: number;
  /** Whether to center the container */
  centered?: boolean;
  /** Whether to add horizontal padding */
  padded?: boolean;
  /** Additional styles */
  style?: ViewStyle;
}

/**
 * Container that constrains content width on tablets
 * while allowing full width on phones
 */
export const ResponsiveContainer = ({
  children,
  maxWidth = responsive.maxWidths.content,
  centered = true,
  padded = false,
  style,
}: ResponsiveContainerProps) => {
  const { isTablet, width } = useResponsive();

  const containerStyle: ViewStyle = {
    flex: 1,
    width: "100%",
    ...(isTablet && {
      maxWidth: Math.min(maxWidth, width),
      alignSelf: centered ? "center" : undefined,
    }),
    ...(padded && {
      paddingHorizontal: isTablet ? 24 : 16,
    }),
  };

  return <View style={[containerStyle, style]}>{children}</View>;
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  /** Number of columns (uses responsive default if not provided) */
  columns?: number;
  /** Gap between items */
  gap?: number;
  /** Additional styles */
  style?: ViewStyle;
}

/**
 * Responsive grid layout that adapts columns based on screen size
 */
export const ResponsiveGrid = ({
  children,
  columns: customColumns,
  gap = 12,
  style,
}: ResponsiveGridProps) => {
  const { columns: defaultColumns } = useResponsive();
  const columns = customColumns ?? defaultColumns;

  const gridStyle: ViewStyle = {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -(gap / 2),
  };

  // Clone children and add responsive width
  const responsiveChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    const itemWidth: DimensionValue = `${100 / columns}%`;

    return (
      <View
        style={{
          width: itemWidth,
          paddingHorizontal: gap / 2,
          marginBottom: gap,
        }}
      >
        {child}
      </View>
    );
  });

  return <View style={[gridStyle, style]}>{responsiveChildren}</View>;
};

interface ResponsiveModalContainerProps {
  children: React.ReactNode;
  /** Custom max width (defaults to responsive.maxWidths.modal) */
  maxWidth?: number;
  /** Additional styles */
  style?: ViewStyle;
}

/**
 * Container for modal content that constrains width on tablets
 */
export const ResponsiveModalContainer = ({
  children,
  maxWidth = responsive.maxWidths.modal,
  style,
}: ResponsiveModalContainerProps) => {
  const { isTablet, width } = useResponsive();

  const containerStyle: ViewStyle = {
    width: "100%",
    ...(isTablet && {
      maxWidth: Math.min(maxWidth, width - 48),
      alignSelf: "center",
      borderRadius: 24,
      marginVertical: 24,
    }),
  };

  return <View style={[containerStyle, style]}>{children}</View>;
};

import { useWindowDimensions } from "react-native";

export type DeviceType = "phone" | "tablet";
export type Orientation = "portrait" | "landscape";

interface ResponsiveConfig {
  width: number;
  height: number;
  isTablet: boolean;
  isPhone: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  deviceType: DeviceType;
  orientation: Orientation;
  /** Number of columns for list layouts */
  columns: number;
  /** Number of columns for card grids */
  cardColumns: number;
  /** Max content width for tablets */
  maxContentWidth: number;
  /** Whether to use master-detail layout */
  useMasterDetail: boolean;
  /** Spacing multiplier based on screen size */
  spacingMultiplier: number;
  /** Whether screen is wide enough for horizontal layouts (Mac, wide tablets) */
  isWideScreen: boolean;
  /** Whether screen is ultra-wide (large Mac displays) - may need stacked layout */
  isUltraWide: boolean;
}

const TABLET_BREAKPOINT = 768;
const LARGE_TABLET_BREAKPOINT = 1024;
const WIDE_SCREEN_BREAKPOINT = 900; // Wide enough for horizontal layouts (Mac, wide tablets)
const ULTRA_WIDE_BREAKPOINT = 1600; // Very large screens (large Mac displays)
const MAX_CONTENT_WIDTH = 1200;
const MAX_MODAL_WIDTH = 600;

export const useResponsive = (): ResponsiveConfig => {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= TABLET_BREAKPOINT;
  const isLargeTablet = width >= LARGE_TABLET_BREAKPOINT;
  const isWideScreen = width >= WIDE_SCREEN_BREAKPOINT;
  const isUltraWide = width >= ULTRA_WIDE_BREAKPOINT;
  const isLandscape = width > height;
  const isPortrait = !isLandscape;
  const deviceType: DeviceType = isTablet ? "tablet" : "phone";
  const orientation: Orientation = isLandscape ? "landscape" : "portrait";

  // Calculate columns based on device and orientation
  let columns = 1;
  if (isTablet) {
    columns = isLandscape ? 3 : 2;
  }

  // Card columns (for summary cards, etc.)
  let cardColumns = 2;
  if (isTablet) {
    cardColumns = isLandscape ? 4 : 4;
  }

  // Max content width to prevent overly wide layouts
  const maxContentWidth = isTablet ? MAX_CONTENT_WIDTH : width;

  // Master-detail pattern for larger tablets in landscape
  const useMasterDetail = isLargeTablet && isLandscape;

  // Spacing multiplier for larger screens
  const spacingMultiplier = isTablet ? 1.25 : 1;

  return {
    width,
    height,
    isTablet,
    isPhone: !isTablet,
    isLandscape,
    isPortrait,
    deviceType,
    orientation,
    columns,
    cardColumns,
    maxContentWidth,
    useMasterDetail,
    spacingMultiplier,
    isWideScreen,
    isUltraWide,
  };
};

/** Get responsive value based on device type */
export const getResponsiveValue = <T>(
  isTablet: boolean,
  phoneValue: T,
  tabletValue: T
): T => {
  return isTablet ? tabletValue : phoneValue;
};

/** Constants for responsive design */
export const responsive = {
  breakpoints: {
    tablet: TABLET_BREAKPOINT,
    largeTablet: LARGE_TABLET_BREAKPOINT,
    wideScreen: WIDE_SCREEN_BREAKPOINT,
    ultraWide: ULTRA_WIDE_BREAKPOINT,
  },
  maxWidths: {
    content: MAX_CONTENT_WIDTH,
    modal: MAX_MODAL_WIDTH,
  },
};

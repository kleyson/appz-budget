/**
 * Mock for react-native module in tests
 * This provides stub implementations for React Native APIs used in the app
 */

// Default dimensions that can be overridden in tests
let mockDimensions = { width: 375, height: 667 };

/**
 * Set mock window dimensions for testing
 * Call this in your test before rendering hooks that use useWindowDimensions
 */
export const setMockDimensions = (dimensions: { width: number; height: number }) => {
  mockDimensions = dimensions;
};

/**
 * Reset dimensions to default (iPhone SE size)
 */
export const resetMockDimensions = () => {
  mockDimensions = { width: 375, height: 667 };
};

/**
 * Mock useWindowDimensions hook
 */
export const useWindowDimensions = () => mockDimensions;

// Mock common React Native components as simple div elements
export const View = 'div';
export const Text = 'span';
export const TouchableOpacity = 'button';
export const Pressable = 'button';
export const ScrollView = 'div';
export const FlatList = 'div';
export const Image = 'img';
export const TextInput = 'input';
export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  flatten: (style: unknown) => style,
};
export const Platform = {
  OS: 'ios',
  select: <T>(obj: { ios?: T; android?: T; default?: T }) => obj.ios ?? obj.default,
};
export const Dimensions = {
  get: () => mockDimensions,
  addEventListener: () => ({ remove: () => {} }),
};

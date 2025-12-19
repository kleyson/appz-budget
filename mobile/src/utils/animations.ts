/**
 * Animation utilities using react-native-reanimated
 * Provides smooth, native-performance animations for the mobile app
 */

import {
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

// Spring configurations for different use cases
export const springConfigs = {
  // Gentle spring for subtle animations
  gentle: {
    damping: 20,
    stiffness: 90,
    mass: 1,
  },
  // Snappy spring for quick feedback
  snappy: {
    damping: 15,
    stiffness: 150,
    mass: 0.8,
  },
  // Bouncy spring for playful animations
  bouncy: {
    damping: 10,
    stiffness: 100,
    mass: 0.5,
  },
  // Smooth spring for modal transitions
  smooth: {
    damping: 25,
    stiffness: 120,
    mass: 1,
  },
} as const;

// Timing configurations
export const timingConfigs = {
  fast: {
    duration: 150,
    easing: Easing.out(Easing.cubic),
  },
  normal: {
    duration: 250,
    easing: Easing.out(Easing.cubic),
  },
  slow: {
    duration: 400,
    easing: Easing.inOut(Easing.cubic),
  },
} as const;

// Animation presets for common use cases
export const animationPresets = {
  // Scale press animation (for buttons)
  pressIn: (scale: SharedValue<number>) => {
    "worklet";
    scale.value = withSpring(0.96, springConfigs.snappy);
  },
  pressOut: (scale: SharedValue<number>) => {
    "worklet";
    scale.value = withSpring(1, springConfigs.snappy);
  },

  // Fade in animation
  fadeIn: (opacity: SharedValue<number>, delay = 0) => {
    "worklet";
    opacity.value = withDelay(delay, withTiming(1, timingConfigs.normal));
  },

  // Slide up animation
  slideUp: (translateY: SharedValue<number>, delay = 0) => {
    "worklet";
    translateY.value = withDelay(delay, withSpring(0, springConfigs.smooth));
  },

  // Scale in animation (for list items)
  scaleIn: (scale: SharedValue<number>, delay = 0) => {
    "worklet";
    scale.value = withDelay(delay, withSpring(1, springConfigs.gentle));
  },
};

// Staggered animation delay calculator
export const getStaggerDelay = (index: number, baseDelay = 50) => {
  return Math.min(index * baseDelay, 300); // Cap at 300ms
};

// Hook for entrance animations with stagger
export const useEntranceAnimation = (index: number, enabled = true) => {
  const opacity = useSharedValue(enabled ? 0 : 1);
  const translateY = useSharedValue(enabled ? 20 : 0);
  const scale = useSharedValue(enabled ? 0.95 : 1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const startAnimation = () => {
    const delay = getStaggerDelay(index);
    opacity.value = withDelay(delay, withTiming(1, timingConfigs.normal));
    translateY.value = withDelay(delay, withSpring(0, springConfigs.gentle));
    scale.value = withDelay(delay, withSpring(1, springConfigs.gentle));
  };

  return { animatedStyle, startAnimation, opacity, translateY, scale };
};

// Hook for press animation
export const usePressAnimation = () => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.96, springConfigs.snappy);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, springConfigs.snappy);
  };

  return { animatedStyle, onPressIn, onPressOut };
};

// Hook for tab indicator animation
export const useTabIndicator = (activeIndex: number, _tabCount: number) => {
  const indicatorPosition = useSharedValue(activeIndex);

  const updatePosition = (index: number) => {
    indicatorPosition.value = withSpring(index, springConfigs.snappy);
  };

  return { indicatorPosition, updatePosition };
};

// Hook for progress bar animation
export const useProgressAnimation = (targetProgress: number) => {
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const animateProgress = () => {
    progress.value = withTiming(targetProgress, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  };

  return { animatedStyle, animateProgress, progress };
};

// Hook for card flip/reveal animation
export const useCardReveal = (delay = 0) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const reveal = () => {
    opacity.value = withDelay(delay, withTiming(1, timingConfigs.normal));
    translateY.value = withDelay(delay, withSpring(0, springConfigs.smooth));
  };

  return { animatedStyle, reveal };
};

// Hook for shimmer loading effect
export const useShimmer = () => {
  const shimmerPosition = useSharedValue(-1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerPosition.value * 200 }],
  }));

  const startShimmer = () => {
    shimmerPosition.value = withSequence(
      withTiming(-1, { duration: 0 }),
      withTiming(1, { duration: 1000, easing: Easing.linear })
    );
  };

  return { animatedStyle, startShimmer };
};

// Hook for number counting animation
export const useCountAnimation = (targetValue: number, duration = 800) => {
  const currentValue = useSharedValue(0);

  const animate = () => {
    currentValue.value = withTiming(targetValue, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  };

  return { currentValue, animate };
};

// Interpolation helpers
export const createInterpolation = (
  value: SharedValue<number>,
  inputRange: number[],
  outputRange: number[]
) => {
  "worklet";
  return interpolate(value.value, inputRange, outputRange, Extrapolation.CLAMP);
};

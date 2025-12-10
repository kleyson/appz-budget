import React, { useEffect, useState } from "react";
import { RefreshControl, RefreshControlProps, Platform } from "react-native";

interface CustomRefreshControlProps
  extends Omit<RefreshControlProps, "tintColor" | "colors"> {
  color: string;
}

// Animated text dots for iOS (workaround for tintColor bug)
const useAnimatedDots = (refreshing: boolean) => {
  const [dots, setDots] = useState("●");

  useEffect(() => {
    if (!refreshing) {
      setDots("●");
      return;
    }

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "●") return "● ●";
        if (prev === "● ●") return "● ● ●";
        return "●";
      });
    }, 300);

    return () => clearInterval(interval);
  }, [refreshing]);

  return dots;
};

export const CustomRefreshControl: React.FC<CustomRefreshControlProps> = ({
  color,
  refreshing,
  ...props
}) => {
  const animatedDots = useAnimatedDots(refreshing);

  if (Platform.OS === "ios") {
    // Workaround for React Native 0.81 + New Architecture bug
    // where tintColor is not respected - use animated title
    return (
      <RefreshControl
        refreshing={refreshing}
        tintColor="transparent"
        title={refreshing ? animatedDots : ""}
        titleColor={color}
        {...props}
      />
    );
  }

  return <RefreshControl refreshing={refreshing} colors={[color]} {...props} />;
};

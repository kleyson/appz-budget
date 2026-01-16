import { PlatformColor } from "react-native";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerBlurEffect: "systemMaterial",
        headerBackButtonDisplayMode: "minimal",
        headerTintColor: PlatformColor("label") as unknown as string,
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: "Sign In",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: "Forgot Password",
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          title: "Reset Password",
        }}
      />
    </Stack>
  );
}

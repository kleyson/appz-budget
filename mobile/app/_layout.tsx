import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import {
  ApiConfigProvider,
  useApiConfig,
} from "../src/contexts/ApiConfigContext";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import { updateApiBaseUrl, updateApiKey } from "../src/api/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RootLayoutNav() {
  const { apiUrl, apiKey } = useApiConfig();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isLoading: apiConfigLoading } = useApiConfig();
  const segments = useSegments();
  const router = useRouter();

  // Update API client when URL or API key changes
  useEffect(() => {
    if (apiUrl) {
      updateApiBaseUrl(apiUrl);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (apiKey !== null) {
      // Update API key (even if empty string, to ensure it's set)
      updateApiKey(apiKey || "");
    }
  }, [apiKey]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (apiConfigLoading || authLoading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inApiConfig = segments[0] === "api-config";

    if (!apiUrl && !inApiConfig) {
      router.replace("/api-config");
    } else if (apiUrl && !isAuthenticated && !inAuthGroup && !inApiConfig) {
      router.replace("/(auth)/login");
    } else if (apiUrl && isAuthenticated && inAuthGroup) {
      router.replace("/");
    }
  }, [
    isAuthenticated,
    apiUrl,
    segments,
    apiConfigLoading,
    authLoading,
    router,
  ]);

  if (apiConfigLoading || authLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="api-config" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ApiConfigProvider>
            <AuthProvider>
              <RootLayoutNav />
              <StatusBar style="auto" />
            </AuthProvider>
          </ApiConfigProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

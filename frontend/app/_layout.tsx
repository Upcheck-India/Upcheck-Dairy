import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { FarmerProvider, useFarmer } from "@/context/FarmerContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { DatabaseProvider } from "@/context/DatabaseContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, farmer } = useFarmer();
  const segments = useSegments();

  if (isLoading) return null;

  const firstSegment = segments[0] as string | undefined;
  const inAuth = firstSegment === "(auth)";

  // Only redirect authenticated users to tabs if they have completed their profile details
  const hasProfile = !!(farmer && farmer.village && farmer.district);
  const onOnboarding = firstSegment === "(auth)" && segments[1] === "onboarding";

  if (isAuthenticated) {
    if (hasProfile) {
      if (inAuth) {
        return <Redirect href="/(tabs)" />;
      }
    } else {
      if (!onOnboarding) {
        return <Redirect href="/(auth)/onboarding" />;
      }
    }
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="animal/[id]"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen
        name="profile"
        options={{ headerShown: false, presentation: "card" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Feather: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <DatabaseProvider>
            <LanguageProvider>
              <FarmerProvider>
                <AppProvider>
                  <GestureHandlerRootView>
                    <AuthGuard>
                      <RootLayoutNav />
                    </AuthGuard>
                  </GestureHandlerRootView>
                </AppProvider>
              </FarmerProvider>
            </LanguageProvider>
          </DatabaseProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

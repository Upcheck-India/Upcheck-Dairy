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
import { FarmProvider, useFarmContext } from "../src/modules/farms/context/FarmProvider";
import { AnimalProvider } from "../src/modules/animals/context/AnimalProvider";
import { MilkProvider } from "../src/modules/milk/context/MilkProvider";
import { HealthProvider } from "../src/modules/health/context/HealthProvider";
import { BreedingProvider } from "../src/modules/breeding/context/BreedingProvider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading, farmer } = useFarmer();
  const { loading: isFarmLoading, farmsLoaded, farms } = useFarmContext();
  const segments = useSegments();

  if (isAuthLoading) return null;

  const firstSegment = segments[0] as string | undefined;
  const inAuth = firstSegment === "(auth)";

  // Only redirect authenticated users to tabs if they have completed their profile details
  const hasProfile = !!(farmer && farmer.village && farmer.district);
  const onOnboarding = firstSegment === "(auth)" && segments[1] === "onboarding";

  if (isAuthenticated) {
    if (!hasProfile) {
      if (!onOnboarding) {
        return <Redirect href="/(auth)/onboarding" />;
      }
      return <>{children}</>;
    }

    // Guard on farms loading state
    if (isFarmLoading || !farmsLoaded) {
      return null;
    }

    const onFarmsScreen = firstSegment === "farms";

    // Enforce active farm if not on onboarding/farms screen
    if (farms.length === 0) {
      if (!onFarmsScreen) {
        return <Redirect href="/farms" />;
      }
    } else {
      if (inAuth) {
        return <Redirect href="/(tabs)" />;
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
      <Stack.Screen
        name="farms"
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
                <FarmProvider>
                  <AnimalProvider>
                    <MilkProvider>
                      <HealthProvider>
                        <BreedingProvider>
                          <AppProvider>
                            <GestureHandlerRootView>
                              <AuthGuard>
                                <RootLayoutNav />
                              </AuthGuard>
                            </GestureHandlerRootView>
                          </AppProvider>
                        </BreedingProvider>
                      </HealthProvider>
                    </MilkProvider>
                  </AnimalProvider>
                </FarmProvider>
              </FarmerProvider>
            </LanguageProvider>
          </DatabaseProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

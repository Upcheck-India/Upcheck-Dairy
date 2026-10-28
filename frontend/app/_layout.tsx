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
import { FarmerProvider, useFarmer } from "@/context/FarmerContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { FarmProvider, useFarmContext } from "../src/modules/farms/context/FarmProvider";
import { AnimalProvider } from "../src/modules/animals/context/AnimalProvider";
import { ShedProvider } from "../src/modules/herd/context/ShedProvider";
import { CategoryProvider } from "../src/modules/herd/context/CategoryProvider";
import { MilkProvider } from "../src/modules/milk/context/MilkProvider";
import { HealthProvider } from "../src/modules/health/context/HealthProvider";
import { BreedingProvider } from "../src/modules/breeding/context/BreedingProvider";
import { VaccinationProvider } from "../src/modules/vaccination/context/VaccinationProvider";
import { InventoryProvider } from "../src/modules/inventory/context/InventoryProvider";
import { TaskProvider } from "../src/modules/tasks/context/TaskProvider";
import { FinanceProvider } from "../src/modules/finance/context/FinanceProvider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useFarmer();
  const { loading: isFarmLoading, farmsLoaded, farms } = useFarmContext();
  const segments = useSegments();

  if (isAuthLoading) return null;

  const firstSegment = segments[0] as string | undefined;
  const inAuth = firstSegment === "(auth)";
  const isPublicUtility = firstSegment === "legal" || firstSegment === "permission";

  if (!isAuthenticated) {
    if (!inAuth && !isPublicUtility) {
      return <Redirect href="/(auth)/login" />;
    }
    return <>{children}</>;
  }

  // There is no profile gate. Signing in already establishes identity —
  // Google gives name, email and photo; OTP gives the email — and nothing in
  // the app reads the farmer's phone, village or district, so blocking entry
  // to collect them was friction for data with no consumer. They are edited
  // in Personal Details on the profile screen whenever the farmer wants.
  //
  // The only thing still gated is having a farm, below, because every other
  // screen is scoped to one.

  // Guard on farms loading state
  if (isFarmLoading || !farmsLoaded) {
    return null;
  }

  const onFarmsScreen = firstSegment === "farms";
  const isUtilityScreen =
    isPublicUtility ||
    firstSegment === "profile-screen" ||
    firstSegment === "animal" ||
    firstSegment === "inventory";

  // Every other screen is scoped to a farm, so a farmer with none is sent to
  // create one. This is the only remaining gate.
  if (farms.length === 0) {
    if (!onFarmsScreen && !isUtilityScreen) {
      return <Redirect href="/farms" />;
    }
  } else {
    if (inAuth) {
      return <Redirect href="/(tabs)" />;
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
        name="profile-screen"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen
        name="farms"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen
        name="inventory"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen
        name="legal"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen
        name="permission"
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
          <LanguageProvider>
            <FarmerProvider>
              <FarmProvider>
                <AnimalProvider>
                  <ShedProvider>
                   <CategoryProvider>
                    <MilkProvider>
                      <HealthProvider>
                        <BreedingProvider>
                          <VaccinationProvider>
                            <InventoryProvider>
                              <TaskProvider>
                                <FinanceProvider>
                                  <GestureHandlerRootView>
                                    <AuthGuard>
                                      <RootLayoutNav />
                                    </AuthGuard>
                                  </GestureHandlerRootView>
                                </FinanceProvider>
                              </TaskProvider>
                            </InventoryProvider>
                          </VaccinationProvider>
                        </BreedingProvider>
                      </HealthProvider>
                    </MilkProvider>
                   </CategoryProvider>
                  </ShedProvider>
                </AnimalProvider>
              </FarmProvider>
            </FarmerProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

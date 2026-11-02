import React, { useState } from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useAnimals } from "../../animals/hooks/useAnimals";
import { useFarm } from "../../farms/hooks/useFarm";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

import { HerdHeader } from "../components/HerdHeader";
import { HerdTabs, HerdTabType } from "../components/HerdTabs";
import { HerdDashboard } from "../components/HerdDashboard";
import { HerdReportModal } from "../components/HerdReportModal";
import { HealthOverviewModal } from "../components/HealthOverviewModal";
import { useSheds } from "../context/ShedProvider";
import { resolveAnimalShed } from "../utils/shedAssignment";
import { AnimalsWorkspace } from "../components/AnimalsWorkspace";

import MilkLogModal from "@/components/MilkLogModal";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import { Animal } from "../../animals/models/Animal";

export function HerdScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeFarm, farms, switchFarm } = useFarm();
  const { t, language } = useLanguage();

  const { animals, loading: animalsLoading, refresh: refreshAnimals } = useAnimals();
  const { sheds } = useSheds();

  // Animals currently needing care. Deliberately not a count of health records:
  // records are permanent history and can never be "resolved", so a badge built
  // on them only ever grows. This clears as animals are marked recovered.
  const alertCount = animals.filter((a) => a.healthStatus !== "healthy").length;

  const [activeTab, setActiveTab] = useState<HerdTabType>("by_shed");
  const [selectedShed, setSelectedShed] = useState<string | null>(null);
  const [selectedShedName, setSelectedShedName] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

  const [milkAnimal, setMilkAnimal] = useState<Animal | null>(null);
  const [reportVisible, setReportVisible] = useState(false);
  const [healthOverviewVisible, setHealthOverviewVisible] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const lx = (r: Record<string, string>) => r[language] ?? r.en ?? "";

  const handleMilkLogPress = (animal: Animal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMilkAnimal(animal);
  };

  const handleMilkSuccess = () => {
    setCelebration(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAnimals();
    setRefreshing(false);
  };

  // Helper to resolve an animal's category
  const getAnimalCategory = (animal: Animal): string => {
    if (animal.status) return animal.status;
    if (animal.type === "calf") return "calf";
    if (animal.isPregnant) return "pregnant";
    
    const idNum = parseInt(animal.id) || 0;
    if (idNum % 5 === 0) return "other";
    if (idNum % 3 === 0) return "dry";
    return "lactating";
  };

  // Helper to resolve an animal's shed against the sheds that currently exist
  const getAnimalShed = (animal: Animal): string => resolveAnimalShed(animal, sheds);

  // Filter animals based on drill-down state
  const isDrillDown = selectedShed !== null || selectedCategory !== null;
  const drillDownTitle = selectedShedName || selectedCategoryName || "";
  
  const drillDownAnimals = animals.filter((a) => {
    if (selectedShed !== null) {
      return getAnimalShed(a) === selectedShed;
    }
    if (selectedCategory !== null) {
      return getAnimalCategory(a) === selectedCategory;
    }
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      {!isDrillDown ? (
        <>
          <HerdHeader
            title={lx({ ta: "மந்தை", te: "మంద", hi: "मवेशी", en: "Herd" })}
            activeFarm={activeFarm}
            farms={farms}
            onSwitchFarm={switchFarm}
            notificationCount={alertCount}
            onNotificationPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: "/animals" as any, params: { tab: "health" } });
            }}
          />

          <HerdTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            byShedLabel={lx({ ta: "கொட்டகை மூலம்", te: "షెడ్ ద్వారా", en: "By Shed" })}
            byCategoryLabel={lx({ ta: "பிரிவு மூலம்", te: "ವರ್గం ద్వారా", en: "By category" })}
          />

          <View style={{ flex: 1 }}>
            <HerdDashboard
              activeTab={activeTab}
              animals={animals}
              onShedSelect={(shedId, shedName) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/animals" as any,
                  params: { shedId, shedName }
                });
              }}
              onCategorySelect={(catId, catName) => {
                setSelectedCategory(catId);
                setSelectedCategoryName(catName);
              }}
              onManageSheds={() => {
                setActiveTab("by_shed");
              }}
              onManageCategories={() => {
                setActiveTab("by_category");
              }}
              onHealthOverview={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setHealthOverviewVisible(true);
              }}
              onHerdReports={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setReportVisible(true);
              }}
            />
          </View>
        </>
      ) : (
        <>
          {/* Drill-down Sub-header */}
          <View style={[styles.subHeader, { borderBottomColor: colors.border }]}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedShed(null);
                setSelectedShedName(null);
                setSelectedCategory(null);
                setSelectedCategoryName(null);
              }}
              style={styles.backBtn}
              hitSlop={12}
            >
              <Feather name="arrow-left" size={24} color={colors.foreground} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subHeaderTitle, { color: colors.foreground }]}>{drillDownTitle}</Text>
              <Text style={[styles.subHeaderSub, { color: colors.mutedForeground }]}>
                {drillDownAnimals.length} {t.animalsCountSuffix}
              </Text>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <AnimalsWorkspace
              animals={drillDownAnimals}
              loading={animalsLoading}
              onAnimalPress={(id) => router.push(`/animal/${id}`)}
              onMilkLogPress={handleMilkLogPress}
              onRefresh={onRefresh}
              refreshing={refreshing}
            />
          </View>
        </>
      )}

      <MilkLogModal
        visible={milkAnimal !== null}
        animal={milkAnimal}
        onClose={() => setMilkAnimal(null)}
        onSuccess={handleMilkSuccess}
      />

      <HerdReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        animals={animals}
        farmName={activeFarm?.name ?? "This farm"}
      />

      <HealthOverviewModal
        visible={healthOverviewVisible}
        onClose={() => setHealthOverviewVisible(false)}
        animals={animals}
        farmName={activeFarm?.name ?? "This farm"}
        onAnimalPress={(id) => router.push(`/animal/${id}`)}
      />
      
      <CelebrationOverlay
        visible={celebration}
        message={t.milkLogSuccess || "Milk logged successfully!"}
        messageTamil="பால் பதிவு ஆனது!"
        onHide={() => setCelebration(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  subHeaderTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  subHeaderSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
});

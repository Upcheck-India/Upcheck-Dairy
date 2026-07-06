import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useAnimals } from "../../animals/hooks/useAnimals";
import { useBreeding } from "../../breeding/hooks/useBreeding";
import { useVaccination } from "../../vaccination/hooks/useVaccination";
import { useFarm } from "../../farms/hooks/useFarm";
import { useFarmer } from "@/context/FarmerContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useDashboard } from "../../dashboard/hooks/useDashboard";

// Import workspace sub-components
import { HerdHeader } from "../components/HerdHeader";
import { HerdTabs, HerdTabType } from "../components/HerdTabs";
import { AnimalsWorkspace } from "../components/AnimalsWorkspace";
import { BreedingWorkspace } from "../components/BreedingWorkspace";
import { VaccinationWorkspace } from "../components/VaccinationWorkspace";

// Modals
import AddAnimalModal from "@/components/AddAnimalModal";
import MilkLogModal from "@/components/MilkLogModal";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import { Animal } from "../../animals/models/Animal";

export function HerdScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeFarm } = useFarm();
  const { farmer } = useFarmer();
  const { t, language } = useLanguage();

  const { animals, loading: animalsLoading, refresh: refreshAnimals } = useAnimals();
  const { refresh: refreshBreeding } = useBreeding();
  const { refresh: refreshVaccinations } = useVaccination();
  const { upcomingVaxCount, breedingAlertCount } = useDashboard();

  const [activeTab, setActiveTab] = useState<HerdTabType>("herd");
  const [addVisible, setAddVisible] = useState(false);
  const [milkAnimal, setMilkAnimal] = useState<Animal | null>(null);
  const [celebration, setCelebration] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const lx = (r: Record<string, string>) => r[language] ?? r.en ?? "";

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleProfilePress = () => {
    router.push("/profile");
  };

  const handleMilkLogPress = (animal: Animal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMilkAnimal(animal);
  };

  const handleMilkSuccess = () => {
    setCelebration(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshAnimals(),
      refreshBreeding(),
      refreshVaccinations(),
    ]);
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      <HerdHeader
        title={lx({ ta: "மாடுகள் விவரம்", te: "పశువుల మంద", kn: "ಹಸುವಿನ ಹಿಂಡು", ml: "പശുക്കൂട്ടം", hi: "पशु समूह", en: "Herd Workspace" })}
        subtitle={`${animals.length} ${t.animalsCountSuffix}`}
        onBackPress={handleBackPress}
        onProfilePress={handleProfilePress}
        avatarColor={farmer?.avatarColor ?? colors.primary}
        initials={farmer?.name ? farmer.name.trim()[0]!.toUpperCase() : "?"}
      />

      <HerdTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        breedingBadge={breedingAlertCount}
        vaccinesBadge={upcomingVaxCount}
        herdLabel={t.herdTab || "Herd"}
        breedingLabel={t.breedingTab || "Breeding"}
        vaccinesLabel={t.vaccinesTab || "Vaccines"}
      />

      <View style={{ flex: 1 }}>
        {activeTab === "herd" && (
          <AnimalsWorkspace
            animals={animals}
            loading={animalsLoading}
            onAnimalPress={(id) => router.push(`/animal/${id}`)}
            onMilkLogPress={handleMilkLogPress}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        )}

        {activeTab === "breeding" && <BreedingWorkspace />}

        {activeTab === "vaccines" && <VaccinationWorkspace />}
      </View>

      {activeTab === "herd" && (
        <Pressable
          style={[styles.fabBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setAddVisible(true);
          }}
        >
          <Feather name="plus" size={26} color="#fff" />
        </Pressable>
      )}

      <AddAnimalModal visible={addVisible} onClose={() => setAddVisible(false)} />
      <MilkLogModal
        visible={milkAnimal !== null}
        animal={milkAnimal}
        onClose={() => setMilkAnimal(null)}
        onSuccess={handleMilkSuccess}
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
  fabBtn: {
    position: "absolute",
    bottom: 30,
    right: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    zIndex: 999,
  },
});

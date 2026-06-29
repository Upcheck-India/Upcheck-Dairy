import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AddAnimalModal from "@/components/AddAnimalModal";
import AnimalCard from "@/components/AnimalCard";
import MilkLogModal from "@/components/MilkLogModal";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import BreedingSection from "@/components/BreedingSection";
import VaccinationSection from "@/components/VaccinationSection";
import { Animal, useApp } from "@/context/AppContext";
import { useFarmer } from "@/context/FarmerContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useFarm } from "../../src/modules/farms/hooks/useFarm";
import { FarmSelector } from "../../src/modules/farms/components/FarmSelector";

type SubTab = "herd" | "breeding" | "vaccines";

export default function AnimalsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { animals, milkAnomalies, syncStatus, vaccinations, breedingEvents, isLoaded, reloadData } = useApp();
  const { farmer } = useFarmer();
  const { activeFarm } = useFarm();
  const { language, t } = useLanguage();
  const [subTab, setSubTab] = useState<SubTab>("herd");
  const [addVisible, setAddVisible] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [milkAnimal, setMilkAnimal] = useState<Animal | null>(null);
  const [filter, setFilter] = useState("all");
  const [celebration, setCelebration] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  const FILTER_OPTIONS = [
    { key: "all", label: t.filterAll },
    { key: "cow", label: t.filterCow },
    { key: "buffalo", label: t.filterBuffalo },
    { key: "healthy", label: t.filterHealthy },
    { key: "attention", label: t.filterAttention },
    { key: "critical", label: t.filterCritical },
  ];

  const filtered = animals.filter((a) => {
    if (filter === "all") return true;
    if (filter === "cow" || filter === "buffalo") return a.type === filter;
    if (filter === "healthy" || filter === "attention" || filter === "critical")
      return a.healthStatus === filter;
    return true;
  });

  const handleMilkSuccess = () => setCelebration(true);

  const onRefresh = async () => {
    setRefreshing(true);
    await reloadData();
    setRefreshing(false);
  };

  const syncDot =
    syncStatus === "synced" ? colors.success : syncStatus === "pending" ? colors.warning : colors.destructive;
  const syncLabel =
    syncStatus === "synced"
      ? `✓ ${t.savedLabel}`
      : syncStatus === "pending"
      ? `⏳ ${t.savingLabel}`
      : "⚠ offline";

  const upcomingVaxCount = vaccinations.filter((v) => {
    if (v.administeredDate) return false;
    const days = Math.floor((new Date(v.scheduledDate).getTime() - Date.now()) / 86400000);
    return days <= 7;
  }).length;

  const breedingAlertCount = animals.filter((a) => {
    if (a.type === "calf" || a.isPregnant) return false;
    const lastHeat = breedingEvents.filter((e) => e.animalId === a.id && e.eventType === "heat")
      .sort((x, y) => y.date.localeCompare(x.date))[0];
    if (!lastHeat) return false;
    const days = Math.floor((Date.now() - new Date(lastHeat.date).getTime()) / 86400000);
    return days >= 18 && days <= 24;
  }).length;

  const SUB_TABS: Array<{ id: SubTab; iconName: keyof typeof Feather.glyphMap; label: string; badge?: number }> = [
    { id: "herd", iconName: "grid", label: t.herdTab },
    { id: "breeding", iconName: "heart", label: t.breedingTab, badge: breedingAlertCount },
    { id: "vaccines", iconName: "shield", label: t.vaccinesTab, badge: upcomingVaxCount },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Pressable
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              onPress={() => setSelectorVisible(true)}
            >
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                🏡 {activeFarm ? activeFarm.getDisplayName() : "Select Farm"}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.foreground} style={{ marginTop: 2 }} />
            </Pressable>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {animals.length} {t.animalsCountSuffix}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.syncBadge, { backgroundColor: syncDot + "20" }]}>
              <View style={[styles.syncDot, { backgroundColor: syncDot }]} />
              <Text style={[styles.syncText, { color: syncDot }]}>{syncLabel}</Text>
            </View>
            <Pressable
              style={styles.profileBtn}
              onPress={() => router.push("/profile")}
              hitSlop={8}
            >
              <View style={[styles.profileCircle, { backgroundColor: farmer?.avatarColor ?? colors.primary }]}>
                <Text style={styles.profileInitial}>
                  {farmer?.name ? farmer.name.trim()[0]!.toUpperCase() : "?"}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.subTabRow}>
          {SUB_TABS.map((tab) => {
            const active = subTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[
                  styles.subTab,
                  { borderBottomColor: active ? colors.primary : "transparent" },
                ]}
                onPress={() => { setSubTab(tab.id); Haptics.selectionAsync(); }}
              >
                <Feather name={tab.iconName} size={18} color={active ? colors.primary : colors.mutedForeground} style={{ marginBottom: 2 }} />
                <Text style={[styles.subTabLabel, { color: active ? colors.primary : colors.mutedForeground }]}>
                  {tab.label}
                </Text>
                {tab.badge != null && tab.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {subTab === "herd" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          >
            {FILTER_OPTIONS.map((f) => (
              <Pressable
                key={f.key}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: filter === f.key ? colors.primary : colors.muted,
                    borderColor: filter === f.key ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { setFilter(f.key); Haptics.selectionAsync(); }}
              >
                <Text style={[styles.filterLabel, { color: filter === f.key ? "#fff" : colors.mutedForeground }]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {subTab === "herd" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          {milkAnomalies.length > 0 && (
            <View style={{ gap: 8, marginBottom: 12 }}>
              {milkAnomalies.map((anomaly) => (
                <Pressable
                  key={anomaly.animalId}
                  style={[
                    styles.anomalyBanner,
                    {
                      backgroundColor: anomaly.severity === "critical" ? colors.destructive + "12" : colors.warning + "12",
                      borderColor: anomaly.severity === "critical" ? colors.destructive : colors.warning,
                    },
                  ]}
                  onPress={() => router.push(`/animal/${anomaly.animalId}`)}
                >
                  <Feather
                    name="trending-down"
                    size={18}
                    color={anomaly.severity === "critical" ? colors.destructive : colors.warning}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.anomalyTitle, { color: anomaly.severity === "critical" ? colors.destructive : colors.warning }]}>
                      {anomaly.animalName} — {t.milkDropAlert}: {anomaly.dropPercent}% {t.milkDropSuffix}
                    </Text>
                    <Text style={[styles.anomalySub, { color: colors.mutedForeground }]}>
                      {t.todayPrefix} {anomaly.todayTotal.toFixed(1)}L • {t.avgPrefix} {anomaly.avgTotal.toFixed(1)}L
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </View>
          )}

          {!isLoaded ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t.loadingTasks}
              </Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="grid" size={48} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {t.noAnimals}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t.noAnimalsHint}
              </Text>
            </View>
          ) : (
            filtered.map((animal) => (
              <View key={animal.id}>
                <AnimalCard
                  animal={animal}
                  onMilkLog={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMilkAnimal(animal);
                  }}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}

      {subTab === "breeding" && <BreedingSection />}
      {subTab === "vaccines" && <VaccinationSection />}

      {subTab === "herd" && (
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
      <FarmSelector visible={selectorVisible} onClose={() => setSelectorVisible(false)} />
      <MilkLogModal
        visible={milkAnimal !== null}
        animal={milkAnimal}
        onClose={() => setMilkAnimal(null)}
        onSuccess={handleMilkSuccess}
      />
      <CelebrationOverlay
        visible={celebration}
        message={t.milkLogSuccess}
        messageTamil="பால் பதிவு ஆனது!"
        onHide={() => setCelebration(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 0, borderBottomWidth: 1 },
  headerRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: "700" },
  headerSub: { fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  syncBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  syncDot: { width: 6, height: 6, borderRadius: 3 },
  syncText: { fontSize: 11, fontWeight: "600" },
  profileBtn: { padding: 2 },
  profileCircle: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  profileInitial: { color: "#fff", fontSize: 18, fontWeight: "700" },
  fabBtn: {
    position: "absolute",
    bottom: 147,
    right: 37,
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
  subTabRow: { flexDirection: "row", borderBottomWidth: 0 },
  subTab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 10, borderBottomWidth: 2.5,
  },
  subTabEmoji: { fontSize: 14 },
  subTabLabel: { fontSize: 12, fontWeight: "700" },
  badge: {
    backgroundColor: "#ef4444", borderRadius: 8, minWidth: 16, height: 16,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  filterScroll: { marginTop: 8, marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterLabel: { fontSize: 13, fontWeight: "500" },
  list: { padding: 16 },
  anomalyBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1.5,
  },
  anomalyTitle: { fontSize: 14, fontWeight: "700" },
  anomalySub: { fontSize: 11, marginTop: 2 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "600" },
  emptyText: { fontSize: 14, textAlign: "center" },
});

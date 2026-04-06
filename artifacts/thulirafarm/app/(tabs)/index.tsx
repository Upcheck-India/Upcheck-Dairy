import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AddAnimalModal from "@/components/AddAnimalModal";
import AnimalCard from "@/components/AnimalCard";
import MilkLogModal from "@/components/MilkLogModal";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import { Animal, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const FILTER_OPTIONS = [
  { key: "all", label: "அனைத்தும்" },
  { key: "cow", label: "பசு 🐄" },
  { key: "buffalo", label: "எருமை 🐃" },
  { key: "healthy", label: "ஆரோக்கியம்" },
  { key: "attention", label: "கவனிக்கவும்" },
  { key: "critical", label: "அவசரம்" },
];

export default function AnimalsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { animals, milkAnomalies, syncStatus } = useApp();
  const [addVisible, setAddVisible] = useState(false);
  const [milkAnimal, setMilkAnimal] = useState<Animal | null>(null);
  const [filter, setFilter] = useState("all");
  const [celebration, setCelebration] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  const filtered = animals.filter((a) => {
    if (filter === "all") return true;
    if (filter === "cow" || filter === "buffalo") return a.type === filter;
    if (filter === "healthy" || filter === "attention" || filter === "critical")
      return a.healthStatus === filter;
    return true;
  });

  const handleMilkSuccess = () => {
    setCelebration(true);
  };

  const syncDot =
    syncStatus === "synced" ? "#22c55e" : syncStatus === "pending" ? "#f97316" : "#ef4444";
  const syncLabel =
    syncStatus === "synced" ? "✓ சேமிக்கப்பட்டது" : syncStatus === "pending" ? "⏳ சேமிக்கிறது" : "⚠ offline";

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
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              என் மாடுகள்
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {animals.length} மாடுகள் • My Animals
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.syncBadge, { backgroundColor: syncDot + "20" }]}>
              <View style={[styles.syncDot, { backgroundColor: syncDot }]} />
              <Text style={[styles.syncText, { color: syncDot }]}>{syncLabel}</Text>
            </View>
            <Pressable
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAddVisible(true);
              }}
            >
              <Feather name="plus" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>

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
              onPress={() => {
                setFilter(f.key);
                Haptics.selectionAsync();
              }}
            >
              <Text
                style={[
                  styles.filterLabel,
                  { color: filter === f.key ? "#fff" : colors.mutedForeground },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Anomaly Alert Banners */}
        {milkAnomalies.length > 0 && (
          <View style={{ gap: 8, marginBottom: 12 }}>
            {milkAnomalies.map((anomaly) => (
              <Pressable
                key={anomaly.animalId}
                style={[
                  styles.anomalyBanner,
                  {
                    backgroundColor: anomaly.severity === "critical"
                      ? "#fef2f2"
                      : "#fff7ed",
                    borderColor: anomaly.severity === "critical"
                      ? "#ef4444"
                      : "#f97316",
                  },
                ]}
                onPress={() => router.push(`/animal/${anomaly.animalId}`)}
              >
                <Feather
                  name="trending-down"
                  size={18}
                  color={anomaly.severity === "critical" ? "#ef4444" : "#f97316"}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.anomalyTitle,
                      { color: anomaly.severity === "critical" ? "#dc2626" : "#c2410c" },
                    ]}
                  >
                    {anomaly.animalName} — பால் {anomaly.dropPercent}% குறைந்தது
                  </Text>
                  <Text style={styles.anomalySub}>
                    இன்று: {anomaly.todayTotal.toFixed(1)}L • சராசரி: {anomaly.avgTotal.toFixed(1)}L — உடல்நிலை சரிபாருங்கள்
                  </Text>
                </View>
                <Feather name="chevron-right" size={14} color="#94a3b8" />
              </Pressable>
            ))}
          </View>
        )}

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="grid" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              மாடுகள் இல்லை
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              + பொத்தானை அழுத்தி மாடு சேர்க்கவும்
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

      <AddAnimalModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
      />
      <MilkLogModal
        visible={milkAnimal !== null}
        animal={milkAnimal}
        onClose={() => setMilkAnimal(null)}
        onSuccess={handleMilkSuccess}
      />
      <CelebrationOverlay
        visible={celebration}
        message="Milk logged!"
        messageTamil="பால் பதிவு ஆனது!"
        onHide={() => setCelebration(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncText: {
    fontSize: 11,
    fontWeight: "600",
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  filterScroll: { marginTop: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  list: { padding: 16 },
  anomalyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  anomalyTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  anomalySub: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import MilkLogModal from "@/components/MilkLogModal";
import { HealthStatus, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const HEALTH_OPTIONS: { status: HealthStatus; label: string; color: string }[] =
  [
    { status: "healthy", label: "ஆரோக்கியம்", color: "#2E7D32" },
    { status: "attention", label: "கவனிக்கவும்", color: "#F57F17" },
    { status: "critical", label: "அவசரம்", color: "#C62828" },
  ];

export default function AnimalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { animals, milkEntries, healthEvents, updateAnimal, deleteAnimal } =
    useApp();
  const [milkLogVisible, setMilkLogVisible] = useState(false);

  const isWeb = Platform.OS === "web";

  const animal = animals.find((a) => a.id === id);
  const animalMilk = milkEntries.filter((e) => e.animalId === id);
  const animalHealth = healthEvents.filter((e) => e.animalId === id);

  const last7Milk = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });
    return dates.map((date) => ({
      date,
      total: animalMilk
        .filter((e) => e.date === date)
        .reduce((s, e) => s + e.quantity, 0),
    }));
  }, [animalMilk]);

  const maxMilk = Math.max(...last7Milk.map((d) => d.total), 1);

  if (!animal) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>மாடு கிடைக்கவில்லை</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>திரும்பு</Text>
        </Pressable>
      </View>
    );
  }

  const emoji = animal.type === "buffalo" ? "🐃" : "🐄";
  const topPad = isWeb ? 67 : insets.top;

  const handleDeleteAnimal = () => {
    Alert.alert(
      "மாடு நீக்கு",
      `${animal.name} ஐ நீக்கவா?`,
      [
        { text: "இல்லை", style: "cancel" },
        {
          text: "நீக்கு",
          style: "destructive",
          onPress: () => {
            deleteAnimal(animal.id);
            router.back();
          },
        },
      ]
    );
  };

  const setHealthStatus = (status: HealthStatus) => {
    Haptics.selectionAsync();
    updateAnimal({ ...animal, healthStatus: status });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {animal.name}
        </Text>
        <Pressable onPress={handleDeleteAnimal} style={styles.deleteBtn}>
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 120 : 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Animal profile card */}
        <View
          style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={styles.profileEmoji}>{emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>
              {animal.name}
            </Text>
            <Text style={[styles.profileBreed, { color: colors.mutedForeground }]}>
              {animal.breed}
            </Text>
            <Text style={[styles.profileTag, { color: colors.mutedForeground }]}>
              குறி: #{animal.tagNumber}
            </Text>
          </View>
        </View>

        {/* Health status */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          உடல் நிலை
        </Text>
        <View style={styles.healthRow}>
          {HEALTH_OPTIONS.map((h) => (
            <Pressable
              key={h.status}
              style={[
                styles.healthBtn,
                {
                  backgroundColor:
                    animal.healthStatus === h.status
                      ? h.color
                      : h.color + "18",
                  borderColor: h.color + "40",
                },
              ]}
              onPress={() => setHealthStatus(h.status)}
            >
              <Text
                style={[
                  styles.healthBtnText,
                  {
                    color:
                      animal.healthStatus === h.status ? "#fff" : h.color,
                  },
                ]}
              >
                {h.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Milk log button */}
        <Pressable
          style={[styles.milkBtn, { backgroundColor: colors.primary }]}
          onPress={() => setMilkLogVisible(true)}
        >
          <Feather name="droplet" size={20} color="#fff" />
          <Text style={styles.milkBtnText}>பால் பதிவு செய்யவும்</Text>
        </Pressable>

        {/* 7-day milk chart */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          7 நாட்கள் பால் வரலாறு
        </Text>
        <View
          style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.chartRow}>
            {last7Milk.map((d, i) => {
              const heightPct = maxMilk > 0 ? d.total / maxMilk : 0;
              const dayName = new Date(d.date).toLocaleDateString("ta-IN", { weekday: "short" });
              return (
                <View key={i} style={styles.barWrapper}>
                  <Text style={[styles.barValue, { color: colors.mutedForeground }]}>
                    {d.total > 0 ? d.total.toFixed(1) : ""}
                  </Text>
                  <View style={[styles.barBg, { backgroundColor: colors.muted }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor:
                            heightPct > 0 ? colors.primary : colors.border,
                          height: `${Math.max(heightPct * 100, 2)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>
                    {dayName}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent milk entries */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          சமீபத்திய பால் பதிவுகள்
        </Text>
        {animalMilk.length === 0 ? (
          <Text style={[styles.noData, { color: colors.mutedForeground }]}>
            பதிவுகள் இல்லை
          </Text>
        ) : (
          animalMilk.slice(0, 10).map((e) => (
            <View
              key={e.id}
              style={[
                styles.milkEntry,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather
                name={e.session === "morning" ? "sun" : "moon"}
                size={16}
                color={e.session === "morning" ? colors.accent : colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.milkEntryDate, { color: colors.mutedForeground }]}>
                  {e.date} — {e.session === "morning" ? "காலை" : "மாலை"}
                </Text>
                {e.fat && (
                  <Text style={[styles.milkEntryFat, { color: colors.mutedForeground }]}>
                    கொழுப்பு: {e.fat}%
                  </Text>
                )}
              </View>
              <Text style={[styles.milkEntryQty, { color: colors.foreground }]}>
                {e.quantity.toFixed(1)}L
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <MilkLogModal
        visible={milkLogVisible}
        animal={animal}
        onClose={() => setMilkLogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  deleteBtn: {
    padding: 4,
  },
  scroll: {
    padding: 16,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    marginBottom: 20,
  },
  profileEmoji: {
    fontSize: 52,
  },
  profileName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  profileBreed: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  profileTag: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
    marginTop: 4,
  },
  healthRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  healthBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  healthBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  milkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 24,
  },
  milkBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  chartCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 100,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    height: "100%",
  },
  barValue: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    height: 14,
  },
  barBg: {
    flex: 1,
    width: "80%",
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
  },
  milkEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  milkEntryDate: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  milkEntryFat: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  milkEntryQty: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  noData: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 20,
  },
  notFound: {
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    marginBottom: 12,
  },
  back: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});

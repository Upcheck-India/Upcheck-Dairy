import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
  { key: "cow", label: "பசு" },
  { key: "buffalo", label: "எருமை" },
  { key: "healthy", label: "ஆரோக்கியம்" },
  { key: "attention", label: "கவனிக்கவும்" },
];

export default function AnimalsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { animals } = useApp();
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
              {animals.length} மாடுகள்
            </Text>
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
                  backgroundColor:
                    filter === f.key ? colors.primary : colors.muted,
                  borderColor:
                    filter === f.key ? colors.primary : colors.border,
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
                  {
                    color:
                      filter === f.key
                        ? "#fff"
                        : colors.mutedForeground,
                  },
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
              <AnimalCard animal={animal} />
              <Pressable
                style={[
                  styles.milkQuickBtn,
                  { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMilkAnimal(animal);
                }}
              >
                <Feather name="droplet" size={14} color={colors.primary} />
                <Text style={[styles.milkQuickText, { color: colors.primary }]}>
                  பால் பதிவு
                </Text>
              </Pressable>
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
  container: {
    flex: 1,
  },
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
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  filterScroll: {
    marginTop: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  list: {
    padding: 16,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  milkQuickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
    marginTop: -6,
  },
  milkQuickText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});

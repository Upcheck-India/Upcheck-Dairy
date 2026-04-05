import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Animal } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface AnimalCardProps {
  animal: Animal;
}

const ANIMAL_ICONS: Record<string, string> = {
  cow: "🐄",
  buffalo: "🐃",
  calf: "🐮",
};

const HEALTH_COLORS: Record<string, string> = {
  healthy: "#2E7D32",
  attention: "#F57F17",
  critical: "#C62828",
};

const HEALTH_LABELS: Record<string, string> = {
  healthy: "ஆரோக்கியம்",
  attention: "கவனிக்கவும்",
  critical: "அவசரம்",
};

export default function AnimalCard({ animal }: AnimalCardProps) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/animal/${animal.id}`);
  };

  const healthColor = HEALTH_COLORS[animal.healthStatus] ?? colors.primary;
  const lastMilk = animal.lastMilkEntry?.quantity;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
      onPress={handlePress}
    >
      <View style={styles.row}>
        <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
          <Text style={styles.emoji}>{ANIMAL_ICONS[animal.type] ?? "🐄"}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {animal.name}
          </Text>
          <Text style={[styles.breed, { color: colors.mutedForeground }]}>
            {animal.breed} • #{animal.tagNumber}
          </Text>
          {lastMilk !== undefined && (
            <Text style={[styles.milkText, { color: colors.mutedForeground }]}>
              <Feather name="droplet" size={11} color={colors.primary} />{" "}
              {lastMilk.toFixed(1)}L{" "}
              {animal.lastMilkEntry?.session === "morning"
                ? "காலை"
                : "மாலை"}
            </Text>
          )}
        </View>
        <View style={styles.statusArea}>
          <View
            style={[
              styles.healthBadge,
              { backgroundColor: healthColor + "20" },
            ]}
          >
            <View
              style={[styles.healthDot, { backgroundColor: healthColor }]}
            />
            <Text style={[styles.healthLabel, { color: healthColor }]}>
              {HEALTH_LABELS[animal.healthStatus]}
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={16}
            color={colors.mutedForeground}
            style={{ marginTop: 6 }}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  emoji: {
    fontSize: 30,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  breed: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  milkText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statusArea: {
    alignItems: "flex-end",
    gap: 4,
  },
  healthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  healthDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  healthLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});

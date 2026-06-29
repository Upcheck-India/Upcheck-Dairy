import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Animal } from "../src/modules/animals/models/Animal";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

interface AnimalCardProps {
  animal: Animal;
  onMilkLog?: () => void;
  onQuickAction?: (action: "fever" | "notEating" | "injury" | "inHeat") => void;
}

const ANIMAL_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  cow: "cow",
  buffalo: "water",
  calf: "baby-bottle",
};

const HEALTH_COLORS: Record<string, string> = {
  healthy: "#22c55e",
  attention: "#f97316",
  critical: "#ef4444",
};

export default function AnimalCard({ animal, onMilkLog, onQuickAction }: AnimalCardProps) {
  const colors = useColors();
  const { t } = useLanguage();

  const HEALTH_LABELS: Record<string, string> = {
    healthy: t.healthy,
    attention: t.attention,
    critical: t.critical,
  };

  const QUICK_ACTIONS = [
    { id: "fever" as const, label: t.quickActionFever, icon: "thermometer" },
    { id: "notEating" as const, label: t.quickActionNotEating, icon: "x-circle" },
    { id: "injury" as const, label: t.quickActionInjury, icon: "scissors" },
    { id: "inHeat" as const, label: t.quickActionInHeat, icon: "heart" },
  ];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/animal/${animal.id}`);
  };

  const healthColor = HEALTH_COLORS[animal.healthStatus] ?? colors.primary;
  const lastMilk = animal.lastMilkEntry?.quantity;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        style={({ pressed }) => [
          styles.mainRow,
          pressed && { opacity: 0.85 },
        ]}
        onPress={handlePress}
      >
        {animal.photoUri ? (
          <Image source={{ uri: animal.photoUri }} style={styles.photo} />
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
            <MaterialCommunityIcons name={ANIMAL_ICONS[animal.type] ?? "cow"} size={28} color={colors.primary} />
          </View>
        )}

        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {animal.name}
          </Text>
          <Text style={[styles.breed, { color: colors.mutedForeground }]}>
            {animal.breed}
            {animal.tagNumber ? ` • #${animal.tagNumber}` : ""}
          </Text>
          {lastMilk !== undefined && (
            <View style={styles.milkRow}>
              <Feather name="droplet" size={12} color={colors.primary} />
              <Text style={[styles.milkText, { color: colors.mutedForeground }]}>
                {lastMilk.toFixed(1)}L{" "}
                {animal.lastMilkEntry?.session === "morning" ? t.morning : t.evening}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statusArea}>
          <View style={[styles.healthBadge, { backgroundColor: healthColor + "20" }]}>
            <View style={[styles.healthDot, { backgroundColor: healthColor }]} />
            <Text style={[styles.healthLabel, { color: healthColor }]}>
              {HEALTH_LABELS[animal.healthStatus]}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={{ marginTop: 6 }} />
        </View>
      </Pressable>

      <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onMilkLog?.();
          }}
        >
          <Feather name="droplet" size={13} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>{t.milkLog}</Text>
        </Pressable>

        {QUICK_ACTIONS.map((qa) => (
          <Pressable
            key={qa.id}
            style={[styles.actionBtn, { backgroundColor: colors.destructive + "12", borderColor: colors.destructive + "30" }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (onQuickAction) {
                onQuickAction(qa.id);
              } else {
                router.push({ pathname: "/(tabs)/help", params: { symptom: qa.id, animalId: animal.id } });
              }
            }}
          >
            <Feather name={qa.icon as any} size={12} color={colors.destructive} />
            <Text style={[styles.actionBtnText, { color: colors.destructive }]}>{qa.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  breed: {
    fontSize: 12,
  },
  milkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  milkText: {
    fontSize: 12,
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
    fontSize: 11,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
});

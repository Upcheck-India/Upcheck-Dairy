import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { QuickAction, DashboardAction } from "../types/DashboardState";

interface QuickActionsCardProps {
  actions: QuickAction[];
  onActionPress: (action: DashboardAction) => void;
  titleLabel: string;
}

const ACTION_ICONS: Record<DashboardAction, keyof typeof Feather.glyphMap> = {
  [DashboardAction.AddAnimal]: "plus-circle",
  [DashboardAction.LogMilk]: "droplet",
  [DashboardAction.AddTask]: "check-square",
  [DashboardAction.AddExpense]: "credit-card",
};

export function QuickActionsCard({
  actions,
  onActionPress,
  titleLabel,
}: QuickActionsCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{titleLabel}</Text>
      <View style={styles.grid}>
        {actions.map((act) => {
          const icon = ACTION_ICONS[act.action];
          return (
            <Pressable
              key={act.id}
              style={[styles.btn, { backgroundColor: colors.muted }]}
              onPress={() => onActionPress(act.action)}
            >
              <View style={[styles.iconWrapper, { backgroundColor: colors.primary + "15" }]}>
                <Feather name={icon} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.btnLabel, { color: colors.foreground }]} numberOfLines={1}>
                {act.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  btn: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  btnLabel: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
});

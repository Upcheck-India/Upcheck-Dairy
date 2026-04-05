import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface StatCardProps {
  icon: string;
  iconColor?: string;
  label: string;
  labelTamil: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
}

export default function StatCard({
  icon,
  iconColor,
  label,
  labelTamil,
  value,
  sub,
  trend,
}: StatCardProps) {
  const colors = useColors();
  const ic = iconColor ?? colors.primary;
  const trendColor =
    trend === "up"
      ? colors.success
      : trend === "down"
      ? colors.destructive
      : colors.mutedForeground;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: ic + "18" }]}>
        <Feather name={icon as any} size={20} color={ic} />
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {labelTamil}
      </Text>
      {sub && (
        <View style={styles.subRow}>
          {trend && (
            <Feather
              name={
                trend === "up"
                  ? "trending-up"
                  : trend === "down"
                  ? "trending-down"
                  : "minus"
              }
              size={12}
              color={trendColor}
            />
          )}
          <Text style={[styles.sub, { color: trendColor }]}>{sub}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "flex-start",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  value: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    lineHeight: 28,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  sub: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});

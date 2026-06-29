import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { DashboardAlert } from "../types/DashboardState";

interface AlertsCardProps {
  alerts: DashboardAlert[];
  onAlertPress: (alert: DashboardAlert) => void;
  titleLabel: string;
}

export function AlertsCard({
  alerts,
  onAlertPress,
  titleLabel,
}: AlertsCardProps) {
  const colors = useColors();

  if (alerts.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{titleLabel}</Text>
      <View style={styles.list}>
        {alerts.map((alert) => {
          const isCritical = alert.severity === "critical";
          const isWarning = alert.severity === "warning";
          const badgeColor = isCritical
            ? colors.destructive
            : isWarning
            ? colors.warning
            : colors.primary;

          const iconName: keyof typeof Feather.glyphMap =
            alert.type === "milk_drop"
              ? "trending-down"
              : alert.type === "heat"
              ? "heart"
              : alert.type === "vaccine"
              ? "shield"
              : "alert-triangle";

          return (
            <Pressable
              key={alert.id}
              style={[
                styles.alertRow,
                {
                  backgroundColor: badgeColor + "10",
                  borderColor: badgeColor + "40",
                },
              ]}
              onPress={() => onAlertPress(alert)}
            >
              <Feather name={iconName} size={18} color={badgeColor} style={{ marginTop: 2 }} />
              <View style={styles.alertContent}>
                <Text style={[styles.alertTitle, { color: badgeColor }]}>{alert.title}</Text>
                <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>
                  {alert.description}
                </Text>
              </View>
              <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
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
  list: {
    gap: 8,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  alertDesc: {
    fontSize: 11,
    marginTop: 2,
  },
});

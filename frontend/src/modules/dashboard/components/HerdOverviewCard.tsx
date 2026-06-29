import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { HerdSummary } from "../types/DashboardState";

interface HerdOverviewCardProps {
  summary: HerdSummary;
  onPress: () => void;
  titleLabel: string;
  viewHerdLabel: string;
}

export function HerdOverviewCard({
  summary,
  onPress,
  titleLabel,
  viewHerdLabel,
}: HerdOverviewCardProps) {
  const colors = useColors();

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Feather name="grid" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{titleLabel}</Text>
        </View>
        <View style={styles.viewHerdRow}>
          <Text style={[styles.viewHerdText, { color: colors.primary }]}>{viewHerdLabel}</Text>
          <Feather name="chevron-right" size={14} color={colors.primary} />
        </View>
      </View>

      <View style={styles.totalRow}>
        <Text style={[styles.totalCount, { color: colors.foreground }]}>{summary.total}</Text>
        <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Animals Registered</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={[styles.detailValue, { color: colors.foreground }]}>{summary.cows}</Text>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Cows</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailValue, { color: colors.foreground }]}>{summary.buffaloes}</Text>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Buffaloes</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailValue, { color: colors.foreground }]}>{summary.calves}</Text>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Calves</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: colors.success + "15" }]}>
          <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.statusText, { color: colors.success }]}>{summary.healthy} Healthy</Text>
        </View>
        {summary.attention > 0 && (
          <View style={[styles.statusBadge, { backgroundColor: colors.warning + "15" }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
            <Text style={[styles.statusText, { color: colors.warning }]}>{summary.attention} Attention</Text>
          </View>
        )}
        {summary.critical > 0 && (
          <View style={[styles.statusBadge, { backgroundColor: colors.destructive + "15" }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.destructive }]} />
            <Text style={[styles.statusText, { color: colors.destructive }]}>{summary.critical} Critical</Text>
          </View>
        )}
      </View>
    </Pressable>
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  viewHerdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewHerdText: {
    fontSize: 12,
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 16,
  },
  totalCount: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 32,
  },
  totalLabel: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  detailItem: {
    alignItems: "center",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  detailLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
});

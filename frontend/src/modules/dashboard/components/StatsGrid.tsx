import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface StatsGridProps {
  milkTotal: number;
  tasksCompleted: number;
  tasksTotal: number;
  income: number;
  expenses: number;
  milkLabel: string;
  tasksLabel: string;
  financeLabel: string;
}

export function StatsGrid({
  milkTotal,
  tasksCompleted,
  tasksTotal,
  income,
  expenses,
  milkLabel,
  tasksLabel,
  financeLabel,
}: StatsGridProps) {
  const colors = useColors();
  const netProfit = income - expenses;

  return (
    <View style={styles.gridContainer}>
      {/* Today's Milk Card */}
      <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>{milkLabel}</Text>
        <Text style={[styles.cardValue, { color: colors.foreground }]}>{milkTotal.toFixed(1)}L</Text>
        <Text style={[styles.cardSubText, { color: colors.mutedForeground }]}>Daily yield</Text>
      </View>

      {/* Today's Tasks Card */}
      <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>{tasksLabel}</Text>
        <Text style={[styles.cardValue, { color: colors.foreground }]}>
          {tasksCompleted}/{tasksTotal}
        </Text>
        <Text style={[styles.cardSubText, { color: colors.mutedForeground }]}>
          {tasksTotal - tasksCompleted} pending
        </Text>
      </View>

      {/* Today's Finances Card */}
      <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>{financeLabel}</Text>
        <Text style={[styles.cardValue, { color: netProfit >= 0 ? colors.success : colors.destructive }]}>
          ₹{netProfit.toLocaleString("en-IN")}
        </Text>
        <Text style={[styles.cardSubText, { color: colors.mutedForeground }]}>
          In: ₹{income.toLocaleString("en-IN")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    justifyContent: "space-between",
    minHeight: 100,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 4,
  },
  cardSubText: {
    fontSize: 10,
  },
});

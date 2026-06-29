import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

export type HerdTabType = "herd" | "breeding" | "vaccines";

interface HerdTabsProps {
  activeTab: HerdTabType;
  onTabChange: (tab: HerdTabType) => void;
  breedingBadge?: number;
  vaccinesBadge?: number;
  herdLabel: string;
  breedingLabel: string;
  vaccinesLabel: string;
}

export function HerdTabs({
  activeTab,
  onTabChange,
  breedingBadge = 0,
  vaccinesBadge = 0,
  herdLabel,
  breedingLabel,
  vaccinesLabel,
}: HerdTabsProps) {
  const colors = useColors();

  const tabs: Array<{ id: HerdTabType; icon: keyof typeof Feather.glyphMap; label: string; badge?: number }> = [
    { id: "herd", icon: "grid", label: herdLabel },
    { id: "breeding", icon: "heart", label: breedingLabel, badge: breedingBadge },
    { id: "vaccines", icon: "shield", label: vaccinesLabel, badge: vaccinesBadge },
  ];

  return (
    <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={[
              styles.subTab,
              { borderBottomColor: active ? colors.primary : "transparent" },
            ]}
            onPress={() => {
              onTabChange(tab.id);
              Haptics.selectionAsync();
            }}
          >
            <Feather name={tab.icon} size={16} color={active ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.subTabLabel, { color: active ? colors.primary : colors.mutedForeground }]}>
              {tab.label}
            </Text>
            {tab.badge !== undefined && tab.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.badge}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginTop: 8,
  },
  subTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  subTabLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  badge: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});

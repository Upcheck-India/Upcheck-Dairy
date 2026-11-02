import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

export type HerdTabType = "by_shed" | "by_category";

interface HerdTabsProps {
  activeTab: HerdTabType;
  onTabChange: (tab: HerdTabType) => void;
  byShedLabel: string;
  byCategoryLabel: string;
}

export function HerdTabs({
  activeTab,
  onTabChange,
  byShedLabel,
  byCategoryLabel,
}: HerdTabsProps) {
  const colors = useColors();

  const tabs: Array<{ id: HerdTabType; label: string }> = [
    { id: "by_shed", label: byShedLabel },
    { id: "by_category", label: byCategoryLabel },
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
            <Text
              style={[
                styles.subTabLabel,
                {
                  color: active ? colors.primary : colors.mutedForeground,
                  fontFamily: active ? "Inter_700Bold" : "Inter_600SemiBold",
                },
              ]}
            >
              {tab.label}
            </Text>
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
    marginTop: 4,
    paddingHorizontal: 16,
  },
  subTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 3,
  },
  subTabLabel: {
    fontSize: 14,
  },
});

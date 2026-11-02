import React from "react";
import { ScrollView, Pressable, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface FilterOption {
  key: string;
  label: string;
}

interface HerdFiltersProps {
  options: FilterOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

export function HerdFilters({ options, selectedKey, onSelect }: HerdFiltersProps) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScroll}
      contentContainerStyle={styles.contentContainer}
    >
      {options.map((f) => {
        const isSelected = selectedKey === f.key;
        return (
          <Pressable
            key={f.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: isSelected ? colors.primary : colors.muted,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              onSelect(f.key);
              Haptics.selectionAsync();
            }}
          >
            <Text style={[styles.filterLabel, { color: isSelected ? "#fff" : colors.mutedForeground }]}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filterScroll: {
    marginTop: 8,
    marginBottom: 8,
    maxHeight: 46,
    flexShrink: 0,
  },
  contentContainer: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20,
    textAlignVertical: "center",
  },
});

import React, { useState } from "react";
import { View, FlatList, RefreshControl, ActivityIndicator, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { Animal } from "../../animals/models/Animal";
import { HerdSearchBar } from "./HerdSearchBar";
import { HerdFilters } from "./HerdFilters";
import AnimalCard from "@/components/AnimalCard";

interface AnimalsWorkspaceProps {
  animals: Animal[];
  loading: boolean;
  onAnimalPress: (id: string) => void;
  onMilkLogPress: (animal: Animal) => void;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
}

export function AnimalsWorkspace({
  animals,
  loading,
  onAnimalPress,
  onMilkLogPress,
  onRefresh,
  refreshing,
}: AnimalsWorkspaceProps) {
  const colors = useColors();
  const { t } = useLanguage();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filterOptions = [
    { key: "all", label: t.filterAll },
    { key: "cow", label: t.filterCow },
    { key: "buffalo", label: t.filterBuffalo },
    { key: "healthy", label: t.filterHealthy },
    { key: "attention", label: t.filterAttention },
    { key: "critical", label: t.filterCritical },
  ];

  const filtered = animals.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.tagNumber && a.tagNumber.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === "all") return true;
    if (filter === "cow" || filter === "buffalo") return a.type === filter;
    if (filter === "healthy" || filter === "attention" || filter === "critical")
      return a.healthStatus === filter;
    return true;
  });

  return (
    <View style={styles.container}>
      <HerdSearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={t.searchPlaceholder || "Search by name or tag..."}
      />

      <HerdFilters
        options={filterOptions}
        selectedKey={filter}
        onSelect={setFilter}
      />

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            {t.loadingTasks}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item: animal }) => (
            <AnimalCard
              animal={animal}
              onMilkLog={() => onMilkLogPress(animal)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="grid" size={48} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {t.noAnimals}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t.noAnimalsHint}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingTop:24,
    paddingBottom: 120,
  },
  loadingWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});

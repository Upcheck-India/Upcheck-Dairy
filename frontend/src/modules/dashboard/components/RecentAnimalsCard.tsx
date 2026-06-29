import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Animal } from "../../animals/models/Animal";

interface RecentAnimalsCardProps {
  animals: Animal[];
  onAnimalPress: (id: string) => void;
  onViewAllPress: () => void;
  titleLabel: string;
  viewAllLabel: string;
}

export function RecentAnimalsCard({
  animals,
  onAnimalPress,
  onViewAllPress,
  titleLabel,
  viewAllLabel,
}: RecentAnimalsCardProps) {
  const colors = useColors();

  if (animals.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{titleLabel}</Text>
        <Pressable style={styles.viewAllRow} onPress={onViewAllPress}>
          <Text style={[styles.viewAllText, { color: colors.primary }]}>{viewAllLabel}</Text>
          <Feather name="arrow-right" size={14} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.list}>
        {animals.map((animal) => {
          return (
            <Pressable
              key={animal.id}
              style={[styles.animalRow, { borderBottomColor: colors.border }]}
              onPress={() => onAnimalPress(animal.id)}
            >
              <View style={styles.animalLeft}>
                <View style={[styles.avatar, { backgroundColor: animal.avatarColor }]}>
                  <Text style={styles.avatarText}>{animal.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{animal.name}</Text>
                  <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                    {animal.subtitle} • {animal.tagNumber || "No Tag"}
                  </Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <View style={[styles.stageBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.stageText, { color: colors.mutedForeground }]}>
                    {animal.currentStage}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  viewAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "600",
  },
  list: {
    marginTop: 4,
  },
  animalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  animalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
  },
  sub: {
    fontSize: 11,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stageText: {
    fontSize: 10,
    fontWeight: "600",
  },
});

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface DashboardHeaderProps {
  farmName: string;
  userName: string;
  onFarmPress: () => void;
  onProfilePress: () => void;
  avatarColor?: string;
  initials?: string;
  syncStatusLabel?: string;
  syncStatusColor?: string;
}

export function DashboardHeader({
  farmName,
  userName,
  onFarmPress,
  onProfilePress,
  avatarColor = "#16a34a",
  initials = "?",
  syncStatusLabel,
  syncStatusColor,
}: DashboardHeaderProps) {
  const colors = useColors();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.farmContainer}>
          <Pressable style={styles.farmSelector} onPress={onFarmPress}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
              🏡 {farmName}
            </Text>
            <Feather name="chevron-down" size={16} color={colors.foreground} style={{ marginTop: 2 }} />
          </Pressable>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Good Morning, {userName}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {syncStatusLabel && syncStatusColor && (
            <View style={[styles.syncBadge, { backgroundColor: syncStatusColor + "20" }]}>
              <View style={[styles.syncDot, { backgroundColor: syncStatusColor }]} />
              <Text style={[styles.syncText, { color: syncStatusColor }]}>{syncStatusLabel}</Text>
            </View>
          )}
          <Pressable style={styles.profileBtn} onPress={onProfilePress} hitSlop={8}>
            <View style={[styles.profileCircle, { backgroundColor: avatarColor }]}>
              <Text style={styles.profileInitial}>{initials}</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  farmContainer: {
    flex: 1,
    marginRight: 12,
  },
  farmSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    maxWidth: "85%",
  },
  headerSub: {
    fontSize: 13,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncText: {
    fontSize: 11,
    fontWeight: "600",
  },
  profileBtn: {
    padding: 2,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface HerdHeaderProps {
  title: string;
  subtitle: string;
  onBackPress: () => void;
  onProfilePress: () => void;
  avatarColor?: string;
  initials?: string;
}

export function HerdHeader({
  title,
  subtitle,
  onBackPress,
  onProfilePress,
  avatarColor = "#16a34a",
  initials = "?",
}: HerdHeaderProps) {
  const colors = useColors();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onBackPress} hitSlop={12} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </Pressable>
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>{title}</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
          </View>
        </View>

        <Pressable style={styles.profileBtn} onPress={onProfilePress} hitSlop={8}>
          <View style={[styles.profileCircle, { backgroundColor: avatarColor }]}>
            <Text style={styles.profileInitial}>{initials}</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  backBtn: {
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  profileBtn: {
    padding: 2,
  },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});

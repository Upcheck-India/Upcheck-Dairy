import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface Farm {
  id: string;
  name: string;
}

interface HerdHeaderProps {
  title: string;
  activeFarm?: Farm | null;
  farms: Farm[];
  onSwitchFarm: (farmId: string) => void;
  onAddAnimalPress: () => void;
  onNotificationPress: () => void;
}

export function HerdHeader({
  title,
  activeFarm,
  farms,
  onSwitchFarm,
  onAddAnimalPress,
  onNotificationPress,
}: HerdHeaderProps) {
  const colors = useColors();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownAnim] = useState(new Animated.Value(0));

  const toggleDropdown = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (dropdownOpen) {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setDropdownOpen(false));
    } else {
      setDropdownOpen(true);
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSelectFarm = (farmId: string) => {
    Haptics.selectionAsync();
    onSwitchFarm(farmId);
    toggleDropdown();
  };

  return (
    <View style={[styles.header, { zIndex: 1000 }]}>
      {/* Top Row: Bell, Title, Add Button */}
      <View style={styles.topRow}>
        <Pressable onPress={onNotificationPress} style={styles.bellBtn} hitSlop={12}>
          <Feather name="bell" size={22} color={colors.foreground} />
          <View style={[styles.badge, { backgroundColor: "#ef4444" }]}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </Pressable>

        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>

        <Pressable
          style={[styles.addBtn, { backgroundColor: "#16a34a" }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAddAnimalPress();
          }}
          hitSlop={8}
        >
          <Feather name="plus" size={16} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.addBtnText}>Add Animal</Text>
        </Pressable>
      </View>

      {/* Second Row: Farm Selector Dropdown */}
      <View style={styles.dropdownContainer}>
        <Pressable
          style={[
            styles.selectorCard,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
            },
          ]}
          onPress={toggleDropdown}
        >
          <View style={styles.selectorLeft}>
            <View style={[styles.homeIconBg, { backgroundColor: "#16a34a20" }]}>
              <Feather name="home" size={16} color="#16a34a" />
            </View>
            <Text style={[styles.farmName, { color: colors.foreground }]} numberOfLines={1}>
              {activeFarm?.name || "Select Farm"}
            </Text>
          </View>
          <Feather
            name={dropdownOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.mutedForeground}
          />
        </Pressable>

        {dropdownOpen && (
          <Animated.View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: dropdownAnim,
                transform: [
                  {
                    translateY: dropdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {farms.length === 0 ? (
              <Text style={[styles.noFarmsText, { color: colors.mutedForeground }]}>
                No farms available
              </Text>
            ) : (
              farms.map((farm) => {
                const isSelected = farm.id === activeFarm?.id;
                return (
                  <Pressable
                    key={farm.id}
                    style={({ pressed }) => [
                      styles.farmItem,
                      {
                        backgroundColor: isSelected
                          ? colors.primary + "12"
                          : pressed
                          ? colors.muted
                          : "transparent",
                      },
                    ]}
                    onPress={() => handleSelectFarm(farm.id)}
                  >
                    <Feather
                      name="home"
                      size={14}
                      color={isSelected ? "#16a34a" : colors.mutedForeground}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.farmItemText,
                        {
                          color: isSelected ? colors.primary : colors.foreground,
                          fontFamily: isSelected ? "Inter_700Bold" : "Inter_400Regular",
                        },
                      ]}
                    >
                      {farm.name}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
  },
  bellBtn: {
    padding: 6,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  dropdownContainer: {
    marginTop: 10,
    position: "relative",
  },
  selectorCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  homeIconBg: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  farmName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  dropdownMenu: {
    position: "absolute",
    top: "105%",
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 9999,
  },
  farmItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  farmItemText: {
    fontSize: 14,
  },
  noFarmsText: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
});

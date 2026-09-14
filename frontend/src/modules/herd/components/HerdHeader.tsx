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

  const farmDisplayName = activeFarm?.name || "xyz farm";

  return (
    <View style={[styles.header, { zIndex: 1000 }]}>
      {/* Top Row: Bell, Title, Add Button */}
      <View style={styles.topRow}>
        <Pressable onPress={onNotificationPress} style={styles.bellBtn} hitSlop={12}>
          <Feather name="bell" size={24} color={colors.foreground} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </Pressable>

        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>

        <Pressable
          style={styles.addBtn}
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
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={toggleDropdown}
        >
          <View style={styles.selectorLeft}>
            <View style={styles.homeIconBg}>
              <Feather name="home" size={24} color="#00a651" />
            </View>
            <View style={styles.farmTextWrap}>
              <Text style={[styles.farmName, { color: colors.foreground }]} numberOfLines={1}>
                {farmDisplayName}
              </Text>
              <Text style={[styles.farmSub, { color: colors.mutedForeground }]}>
                Current farm
              </Text>
            </View>
          </View>
          <Feather
            name={dropdownOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.foreground}
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
                          ? "#00a65115"
                          : pressed
                          ? colors.muted
                          : "transparent",
                      },
                    ]}
                    onPress={() => handleSelectFarm(farm.id)}
                  >
                    <Feather
                      name="home"
                      size={16}
                      color={isSelected ? "#00a651" : colors.mutedForeground}
                      style={{ marginRight: 10 }}
                    />
                    <Text
                      style={[
                        styles.farmItemText,
                        {
                          color: isSelected ? "#00a651" : colors.foreground,
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
    paddingBottom: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
  },
  bellBtn: {
    padding: 4,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00a651",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  dropdownContainer: {
    marginTop: 14,
    position: "relative",
  },
  selectorCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  selectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  homeIconBg: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  farmTextWrap: {
    flex: 1,
    justifyContent: "center",
  },
  farmName: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  farmSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  dropdownMenu: {
    position: "absolute",
    top: "105%",
    left: 0,
    right: 0,
    borderRadius: 14,
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

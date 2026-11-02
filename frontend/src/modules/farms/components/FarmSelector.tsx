import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFarm } from "../hooks/useFarm";
import { useColors } from "@/hooks/useColors";
import { router } from "expo-router";

interface FarmSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export function FarmSelector({ visible, onClose }: FarmSelectorProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { farms, activeFarm, switchFarm } = useFarm();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const handleSelect = async (id: string) => {
    if (switchingId) return;
    if (id === activeFarm?.id) {
      onClose();
      return;
    }

    Haptics.selectionAsync();
    setSwitchingId(id);
    try {
      await switchFarm(id);
      onClose();
    } catch (err) {
      // Previously unhandled: a failed switch left the sheet open with no
      // feedback and the old farm silently still active.
      console.error("[FarmSelector] Failed to switch farm:", err);
      Alert.alert("Error", "Could not switch to that farm. Please try again.");
    } finally {
      setSwitchingId(null);
    }
  };

  const handleManage = () => {
    onClose();
    router.push("/farms");
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Stops taps on the sheet's own padding from reaching the backdrop
            and dismissing it. */}
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              // Clears the OS navigation bar; a flat 24 on Android left the
              // Manage Farms button underneath the nav buttons.
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Select Farm</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {farms.length === 0 && (
              <View style={styles.empty}>
                <Feather name="home" size={40} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No farms yet. Create one to start recording your herd.
                </Text>
              </View>
            )}

            {farms.map((farm) => {
              const isActive = activeFarm?.id === farm.id;
              const isSwitching = switchingId === farm.id;
              return (
                <Pressable
                  key={farm.id}
                  style={({ pressed }) => [
                    styles.item,
                    {
                      backgroundColor: isActive ? colors.primary + "10" : "transparent",
                      borderColor: isActive ? colors.primary : colors.border,
                      opacity: pressed || (switchingId && !isSwitching) ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => handleSelect(farm.id)}
                  disabled={switchingId !== null}
                >
                  <View style={styles.itemInfo}>
                    <View
                      style={[
                        styles.itemIcon,
                        { backgroundColor: isActive ? colors.primary + "18" : colors.muted },
                      ]}
                    >
                      <Feather
                        name="home"
                        size={17}
                        color={isActive ? colors.primary : colors.mutedForeground}
                      />
                    </View>
                    <View style={styles.itemTextWrap}>
                      <Text
                        style={[
                          styles.itemName,
                          {
                            color: isActive ? colors.primary : colors.foreground,
                            fontWeight: isActive ? "700" : "500",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {farm.getDisplayName()}
                      </Text>
                      {farm.location ? (
                        <Text
                          style={[styles.itemSub, { color: colors.mutedForeground }]}
                          numberOfLines={1}
                        >
                          {farm.getDisplayLocation()}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  {isSwitching ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : isActive ? (
                    <Feather name="check-circle" size={18} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              style={[styles.manageBtn, { borderColor: colors.primary }]}
              onPress={handleManage}
            >
              <Feather name="settings" size={16} color={colors.primary} />
              <Text style={[styles.manageBtnText, { color: colors.primary }]}>
                {farms.length === 0 ? "Create a farm" : "Manage farms"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingTop: 10,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  list: {
    paddingHorizontal: 20,
  },
  listContent: {
    gap: 10,
    paddingBottom: 20,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 15,
    paddingHorizontal: 20,
  },
  manageBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  manageBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

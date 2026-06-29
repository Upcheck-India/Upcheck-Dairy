import React from "react";
import { Modal, StyleSheet, Text, View, Pressable, ScrollView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFarm } from "../hooks/useFarm";
import { useColors } from "@/hooks/useColors";
import { router } from "expo-router";

interface FarmSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export function FarmSelector({ visible, onClose }: FarmSelectorProps) {
  const colors = useColors();
  const { farms, activeFarm, switchFarm } = useFarm();

  const handleSelect = async (id: string) => {
    await switchFarm(id);
    onClose();
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
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Select Farm</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {farms.map((farm) => {
              const isActive = activeFarm?.id === farm.id;
              return (
                <Pressable
                  key={farm.id}
                  style={[
                    styles.item,
                    {
                      backgroundColor: isActive ? colors.primary + "10" : "transparent",
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleSelect(farm.id)}
                >
                  <View style={styles.itemInfo}>
                    <Feather
                      name="home"
                      size={18}
                      color={isActive ? colors.primary : colors.mutedForeground}
                    />
                    <View style={styles.itemTextWrap}>
                      <Text
                        style={[
                          styles.itemName,
                          {
                            color: isActive ? colors.primary : colors.foreground,
                            fontWeight: isActive ? "700" : "500",
                          },
                        ]}
                      >
                        {farm.getDisplayName()}
                      </Text>
                      {farm.location ? (
                        <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>
                          {farm.getDisplayLocation()}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  {isActive && (
                    <Feather name="check-circle" size={18} color={colors.primary} />
                  )}
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
                Manage Farms
              </Text>
            </Pressable>
          </View>
        </View>
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
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
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

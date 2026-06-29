import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFarm } from "../src/modules/farms/hooks/useFarm";
import { farmRepository } from "../src/modules/farms/api/FarmRepository";
import { useColors } from "@/hooks/useColors";
import { router } from "expo-router";

export default function FarmsScreen() {
  const colors = useColors();
  const { farms, activeFarm, switchFarm, refreshFarms, loading } = useFarm();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFarmId, setEditingFarmId] = useState<string | null>(null);
  const [farmName, setFarmName] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const handleOpenAdd = () => {
    setEditingFarmId(null);
    setFarmName("");
    setFarmLocation("");
    setModalVisible(true);
  };

  const handleOpenEdit = (id: string, name: string, location: string | null) => {
    setEditingFarmId(id);
    setFarmName(name);
    setFarmLocation(location || "");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!farmName.trim()) {
      Alert.alert("Error", "Farm name is required");
      return;
    }

    setActionLoading(true);
    try {
      if (editingFarmId) {
        await farmRepository.update(editingFarmId, {
          name: farmName.trim(),
          location: farmLocation.trim() || undefined,
        });
      } else {
        await farmRepository.create({
          name: farmName.trim(),
          location: farmLocation.trim() || undefined,
        });
      }
      await refreshFarms();
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save farm");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Farm",
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await farmRepository.delete(id);
              await refreshFarms();
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to delete farm");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSwitch = async (id: string) => {
    await switchFarm(id);
    if (farms.length > 0) {
      router.replace("/(tabs)");
    }
  };

  const hasFarms = farms.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {hasFarms ? (
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Farms Management</Text>
        <Pressable style={styles.addBtn} onPress={handleOpenAdd}>
          <Feather name="plus" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {loading && farms.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !hasFarms ? (
        <View style={styles.emptyContainer}>
          <Feather name="home" size={60} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Welcome to UpCheck</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Let's start by creating your first dairy farm.
          </Text>
          <Pressable style={[styles.createBtn, { backgroundColor: colors.primary }]} onPress={handleOpenAdd}>
            <Text style={styles.createBtnText}>Create My First Farm</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {farms.map((farm) => {
            const isActive = activeFarm?.id === farm.id;
            return (
              <View
                key={farm.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardName, { color: colors.foreground }]}>
                      {farm.getDisplayName()}
                    </Text>
                    {farm.location ? (
                      <Text style={[styles.cardLoc, { color: colors.mutedForeground }]}>
                        <Feather name="map-pin" size={12} /> {farm.getDisplayLocation()}
                      </Text>
                    ) : null}
                  </View>
                  {isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: colors.primary + "15" }]}>
                      <Text style={[styles.activeText, { color: colors.primary }]}>Active</Text>
                    </View>
                  )}
                </View>

                <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
                  {!isActive ? (
                    <Pressable style={styles.actionBtn} onPress={() => handleSwitch(farm.id)}>
                      <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Switch</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.actionBtn}>
                      <Feather name="check" size={14} color={colors.primary} />
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>Selected</Text>
                    </View>
                  )}

                  <View style={styles.rightActions}>
                    <Pressable
                      style={styles.actionIconBtn}
                      onPress={() => handleOpenEdit(farm.id, farm.name, farm.location)}
                    >
                      <Feather name="edit-2" size={14} color={colors.mutedForeground} />
                    </Pressable>
                    <Pressable
                      style={styles.actionIconBtn}
                      onPress={() => handleDelete(farm.id, farm.name)}
                    >
                      <Feather name="trash-2" size={14} color="#ef4444" />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editingFarmId ? "Edit Farm" : "New Farm"}
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Farm Name</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                value={farmName}
                onChangeText={setFarmName}
                placeholder="e.g. Green Valley Farm"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Location</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                value={farmLocation}
                onChangeText={setFarmLocation}
                placeholder="e.g. Madurai, Tamil Nadu"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: {
    padding: 4,
  },
  backBtnPlaceholder: {
    width: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  addBtn: {
    padding: 4,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 10,
  },
  emptySub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  createBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  list: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardLoc: {
    fontSize: 13,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionIconBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtn: {
    borderWidth: 1,
  },
  cancelBtnText: {
    fontWeight: "600",
  },
  saveBtn: {},
  saveBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});

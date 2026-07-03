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
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFarm } from "../src/modules/farms/hooks/useFarm";
import { farmRepository } from "../src/modules/farms/api/FarmRepository";
import { useColors } from "@/hooks/useColors";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FarmsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Row */}
      <View style={styles.header}>
        {hasFarms ? (
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#16a34a" />
          </Pressable>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}
        <Text style={styles.headerTitle}>Farms Management</Text>
        <Pressable style={styles.headerAddBtn} onPress={handleOpenAdd}>
          <Feather name="plus" size={16} color="#ffffff" />
        </Pressable>
      </View>

      {/* Description Subtitle */}
      <Text style={styles.subtitle}>
        Manage all your farms. You can edit or delete farms anytime.
      </Text>

      {loading && farms.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : !hasFarms ? (
        <View style={styles.emptyContainer}>
          <Feather name="home" size={60} color="#9ca3af" />
          <Text style={styles.emptyTitle}>Welcome to UpCheck</Text>
          <Text style={styles.emptySub}>
            Let's start by creating your first dairy farm.
          </Text>
          <Pressable style={styles.createBtn} onPress={handleOpenAdd}>
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
                    borderColor: isActive ? "#16a34a" : "#edf2f7",
                    borderWidth: isActive ? 1.5 : 1,
                  },
                ]}
              >
                {/* Card Info */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>
                      {farm.getDisplayName()}
                    </Text>
                    {farm.location ? (
                      <Text style={styles.cardLoc}>
                        <Feather name="map-pin" size={12} color="#718096" /> {farm.getDisplayLocation()}
                      </Text>
                    ) : null}
                  </View>
                  {isActive && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeText}>Active</Text>
                    </View>
                  )}
                </View>

                {/* Divider & Actions bottom row */}
                <View style={styles.cardActions}>
                  {!isActive ? (
                    <Pressable style={styles.actionBtn} onPress={() => handleSwitch(farm.id)}>
                      <Feather name="circle" size={16} color="#718096" />
                      <Text style={[styles.actionBtnText, styles.actionBtnTextMuted]}>Switch</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.actionBtn}>
                      <Feather name="check-circle" size={16} color="#16a34a" />
                      <Text style={[styles.actionBtnText, { color: "#16a34a" }]}>Selected</Text>
                    </View>
                  )}

                  <View style={styles.rightActions}>
                    <Pressable
                      style={styles.actionIconBtn}
                      onPress={() => handleOpenEdit(farm.id, farm.name, farm.location)}
                    >
                      <Feather name="edit-2" size={14} color="#718096" />
                    </Pressable>
                    <View style={styles.verticalDivider} />
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingFarmId ? "Edit Farm" : "New Farm"}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Farm Name</Text>
              <TextInput
                style={styles.input}
                value={farmName}
                onChangeText={setFarmName}
                placeholder="e.g. Green Valley Farm"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={farmLocation}
                onChangeText={setFarmLocation}
                placeholder="e.g. Madurai, Tamil Nadu"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.saveBtn}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
    backgroundColor: "#ffffff",
  },
  backBtn: {
    width: 32,
    alignItems: "flex-start",
  },
  backBtnPlaceholder: {
    width: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#718096",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
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
    color: "#111827",
    marginTop: 10,
  },
  emptySub: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
    lineHeight: 20,
  },
  createBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
    backgroundColor: "#16a34a",
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
    borderRadius: 16,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  cardLoc: {
    fontSize: 13,
    color: "#718096",
    marginTop: 4,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#ecfdf5",
  },
  activeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16a34a",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#edf2f7",
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
  actionBtnTextMuted: {
    color: "#718096",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionIconBtn: {
    padding: 4,
  },
  verticalDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#edf2f7",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#718096",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#edf2f7",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#111827",
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
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#f7fafc",
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  cancelBtnText: {
    fontWeight: "600",
    color: "#718096",
  },
  saveBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#16a34a",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});

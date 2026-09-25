import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { useSheds, Shed } from "../context/ShedProvider";
import { useAnimals } from "../../animals/hooks/useAnimals";

interface ShedManagementModalProps {
  visible: boolean;
  onClose: () => void;
  initialAction?: "create" | "edit" | "list";
  targetShedId?: string | null;
}

export function ShedManagementModal({
  visible,
  onClose,
  initialAction = "list",
  targetShedId = null,
}: ShedManagementModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { sheds, addShed, updateShed, deleteShed } = useSheds();
  const { animals } = useAnimals();

  const lx = (r: Record<string, string>) => r[language] ?? r.en ?? "";

  // Mode: "list" | "create" | "edit"
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingShedId, setEditingShedId] = useState<string | null>(null);

  // True when the modal was opened straight into a form (the pencil on a shed
  // card, for example). Leaving that form must dismiss the modal rather than
  // drop the farmer on the management list they never asked to see.
  const [openedIntoForm, setOpenedIntoForm] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Initialize modal state when opened
  React.useEffect(() => {
    if (!visible) return;

    if (initialAction === "create") {
      resetToCreate();
      setOpenedIntoForm(true);
    } else if (initialAction === "edit" && targetShedId) {
      const s = sheds.find((item) => item.id === targetShedId);
      if (s) {
        resetToEdit(s);
        setOpenedIntoForm(true);
      } else {
        setMode("list");
        setOpenedIntoForm(false);
      }
    } else {
      setMode("list");
      setOpenedIntoForm(false);
    }
  }, [visible, initialAction, targetShedId]);

  const resetToCreate = () => {
    setName("");
    setDesc("");
    setEditingShedId(null);
    setMode("create");
  };

  const resetToEdit = (shed: Shed) => {
    setName(shed.name);
    setDesc(shed.desc || "");
    setEditingShedId(shed.id);
    setMode("edit");
  };

  const openCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetToCreate();
  };

  const openEdit = (shed: Shed) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetToEdit(shed);
  };

  /** Leaves the current form: back to the list, or out of the modal entirely. */
  const leaveForm = () => {
    if (openedIntoForm) onClose();
    else setMode("list");
  };

  const handleBack = () => {
    if (mode === "list") onClose();
    else leaveForm();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(lx({ en: "Required", ta: "தேவை" }), lx({ en: "Shed name is required.", ta: "கொட்டகை பெயர் தேவை." }));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        await addShed(name, desc);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(lx({ en: "Success", ta: "வெற்றி" }), lx({ en: "Shed created successfully!", ta: "கொட்டகை உருவாக்கப்பட்டது!" }));
      } else if (mode === "edit" && editingShedId) {
        await updateShed(editingShedId, name, desc);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(lx({ en: "Success", ta: "வெற்றி" }), lx({ en: "Shed updated successfully!", ta: "கொட்டகை புதுப்பிக்கப்பட்டது!" }));
      }
      leaveForm();
    } catch (err: any) {
      Alert.alert(lx({ en: "Error", ta: "பிழை" }), err.message || "Failed to save shed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (shed: Shed) => {
    if (sheds.length <= 1) {
      Alert.alert(
        lx({ en: "Cannot Delete", ta: "நீக்க முடியாது" }),
        lx({ en: "You must have at least one shed in your farm.", ta: "குறைந்தது ஒரு கொட்டகையாவது இருக்க வேண்டும்." })
      );
      return;
    }

    const animalCount = animals.filter((a) => a.shed === shed.id).length;
    const nextShed = sheds.find((s) => s.id !== shed.id);
    const targetName = nextShed ? nextShed.name : "Main Shed";

    Alert.alert(
      lx({ en: `Delete '${shed.name}'?`, ta: `'${shed.name}' ஐ நீக்கவா?` }),
      animalCount > 0
        ? lx({
            en: `${animalCount} animal(s) in this shed will be moved to '${targetName}'. Are you sure?`,
            ta: `இந்த கொட்டகையில் உள்ள ${animalCount} மாடுகள் '${targetName}' க்கு மாற்றப்படும். நிச்சயமாக நீக்கவா?`,
          })
        : lx({ en: "Are you sure you want to delete this shed?", ta: "இந்த கொட்டகையை நீக்க வேண்டுமா?" }),
      [
        { text: lx({ en: "Cancel", ta: "ரத்து" }), style: "cancel" },
        {
          text: lx({ en: "Delete", ta: "நீக்கு" }),
          style: "destructive",
          onPress: async () => {
            try {
              setSubmitting(true);
              await deleteShed(shed.id, nextShed?.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err: any) {
              Alert.alert(lx({ en: "Error", ta: "பிழை" }), err.message || "Failed to delete shed");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleBack}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={handleBack} style={styles.headerBtn} hitSlop={10}>
            {/* Backing out of a directly-opened form dismisses the modal, so show
                a close icon rather than implying there is a list behind it. */}
            <Feather
              name={mode !== "list" && !openedIntoForm ? "arrow-left" : "x"}
              size={22}
              color={colors.foreground}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {mode === "create"
              ? lx({ en: "Create New Shed", ta: "புதிய கொட்டகை உருவாக்கு" })
              : mode === "edit"
              ? lx({ en: "Rename / Edit Shed", ta: "கொட்டகையை திருத்து" })
              : lx({ en: "Manage Sheds", ta: "கொட்டகைகள் நிர்வாகம்" })}
          </Text>

          {mode === "list" ? (
            <Pressable style={[styles.addPillBtn, { backgroundColor: "#16a34a" }]} onPress={openCreate} hitSlop={8}>
              <Feather name="plus" size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.addPillText}>{lx({ en: "Add", ta: "சேர்" })}</Text>
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {mode === "list" ? (
            <View style={styles.listSection}>
              <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
                {lx({
                  en: "Create, rename, or organize housing sheds for your herd.",
                  ta: "உங்கள் மாடுகளுக்கு புதிய கொட்டகைகளை உருவாக்கவும் அல்லது திருத்தவும்.",
                })}
              </Text>

              {sheds.map((shed) => {
                const count = animals.filter((a) => a.shed === shed.id).length;
                return (
                  <View key={shed.id} style={[styles.shedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardMain}>
                      <View style={[styles.iconBg, { backgroundColor: "#16a34a15" }]}>
                        <Feather name="home" size={18} color="#16a34a" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.shedName, { color: colors.foreground }]}>{shed.name}</Text>
                        {shed.desc ? (
                          <Text style={[styles.shedDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {shed.desc}
                          </Text>
                        ) : null}
                        <Text style={[styles.animalBadge, { color: "#16a34a" }]}>
                          {count} {count === 1 ? "Animal" : "Animals"}
                        </Text>
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.actionsRow}>
                        <Pressable
                          style={[styles.actionIconBtn, { backgroundColor: colors.muted }]}
                          onPress={() => openEdit(shed)}
                          hitSlop={8}
                        >
                          <Feather name="edit-2" size={15} color={colors.foreground} />
                        </Pressable>

                        <Pressable
                          style={[styles.actionIconBtn, { backgroundColor: "#ef444415" }]}
                          onPress={() => handleDelete(shed)}
                          hitSlop={8}
                        >
                          <Feather name="trash-2" size={15} color="#ef4444" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}

              <Pressable style={[styles.createBigBtn, { borderColor: "#16a34a" }]} onPress={openCreate}>
                <Feather name="plus-circle" size={20} color="#16a34a" style={{ marginRight: 8 }} />
                <Text style={[styles.createBigText, { color: "#16a34a" }]}>
                  {lx({ en: "Create Another Shed", ta: "மற்றொரு கொட்டகை சேர்" })}
                </Text>
              </Pressable>
            </View>
          ) : (
            /* Create / Edit Form */
            <View style={styles.formSection}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                {lx({ en: "Shed Name", ta: "கொட்டகை பெயர்" })} <Text style={{ color: "#ef4444" }}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.border, color: colors.foreground }]}
                value={name}
                onChangeText={setName}
                placeholder={lx({ en: "e.g. Shed 5 - East Block", ta: "உதாரணம்: கொட்டகை 5" })}
                placeholderTextColor={colors.mutedForeground}
                autoFocus
              />

              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                {lx({ en: "Description / Purpose (Optional)", ta: "விவரிப்பு / குறிப்பு (விருப்பம்)" })}
              </Text>
              <TextInput
                style={[styles.textArea, { borderColor: colors.border, color: colors.foreground }]}
                value={desc}
                onChangeText={setDesc}
                placeholder={lx({ en: "e.g. Dedicated for high milk yield cows", ta: "உதாரணம்: பால் கறக்கும் மாடுகள்" })}
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
              />

              <View style={styles.formActions}>
                <Pressable
                  style={[styles.btnSecondary, { borderColor: colors.border }]}
                  onPress={leaveForm}
                  disabled={submitting}
                >
                  <Text style={[styles.btnTextSecondary, { color: colors.foreground }]}>
                    {lx({ en: "Cancel", ta: "ரத்து" })}
                  </Text>
                </Pressable>

                <Pressable style={[styles.btnPrimary, { backgroundColor: "#16a34a" }]} onPress={handleSave} disabled={submitting}>
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnTextPrimary}>
                      {mode === "create"
                        ? lx({ en: "Create Shed", ta: "உருவாக்கு" })
                        : lx({ en: "Save Changes", ta: "சேமி" })}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  addPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addPillText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  scrollContent: {
    padding: 16,
  },
  listSection: {
    gap: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  shedCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  shedName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  shedDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  animalBadge: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  createBigBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  createBigText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  formSection: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
    minHeight: 80,
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  btnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnTextSecondary: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  btnPrimary: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnTextPrimary: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});

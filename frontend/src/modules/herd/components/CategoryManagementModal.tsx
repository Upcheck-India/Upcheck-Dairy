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
import { useCategories, AnimalCategory, CATEGORY_COLORS } from "../context/CategoryProvider";
import { useAnimals } from "../../animals/hooks/useAnimals";

interface CategoryManagementModalProps {
  visible: boolean;
  onClose: () => void;
  initialAction?: "create" | "edit" | "list";
  targetCategoryId?: string | null;
}

export function CategoryManagementModal({
  visible,
  onClose,
  initialAction = "list",
  targetCategoryId = null,
}: CategoryManagementModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { animals } = useAnimals();

  const lx = (r: Record<string, string>) => r[language] ?? r.en ?? "";

  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      if (initialAction === "create") {
        openCreate();
      } else if (initialAction === "edit" && targetCategoryId) {
        const c = categories.find((item) => item.id === targetCategoryId);
        if (c) openEdit(c);
        else setMode("list");
      } else {
        setMode("list");
      }
    }
  }, [visible, initialAction, targetCategoryId]);

  const openCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setName("");
    setDesc("");
    setColor(CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length]);
    setEditingCategoryId(null);
    setMode("create");
  };

  const openEdit = (category: AnimalCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setName(category.name);
    setDesc(category.desc || "");
    setColor(category.color);
    setEditingCategoryId(category.id);
    setMode("edit");
  };

  const countFor = (category: AnimalCategory) =>
    animals.filter((a) => a.status === category.id).length;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(
        lx({ en: "Required", ta: "தேவை" }),
        lx({ en: "Category name is required.", ta: "வகையின் பெயர் தேவை." })
      );
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        await addCategory(name, desc, color);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (mode === "edit" && editingCategoryId) {
        await updateCategory(editingCategoryId, name, desc, color);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setMode("list");
    } catch (err: any) {
      Alert.alert(lx({ en: "Error", ta: "பிழை" }), err.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (category: AnimalCategory) => {
    if (categories.length <= 1) {
      Alert.alert(
        lx({ en: "Cannot Delete", ta: "நீக்க முடியாது" }),
        lx({
          en: "You must have at least one category.",
          ta: "குறைந்தது ஒரு வகையாவது இருக்க வேண்டும்.",
        })
      );
      return;
    }

    const fallback = categories.find((c) => c.id !== category.id)!;
    const animalCount = countFor(category);

    Alert.alert(
      lx({ en: `Delete '${category.name}'?`, ta: `'${category.name}' ஐ நீக்கவா?` }),
      animalCount > 0
        ? lx({
            en: `${animalCount} animal(s) in this category will be moved to '${fallback.name}'. Are you sure?`,
            ta: `இந்த வகையில் உள்ள ${animalCount} மாடுகள் '${fallback.name}' க்கு மாற்றப்படும். நிச்சயமாக நீக்கவா?`,
          })
        : lx({
            en: "Are you sure you want to delete this category?",
            ta: "இந்த வகையை நீக்க வேண்டுமா?",
          }),
      [
        { text: lx({ en: "Cancel", ta: "ரத்து" }), style: "cancel" },
        {
          text: lx({ en: "Delete", ta: "நீக்கு" }),
          style: "destructive",
          onPress: async () => {
            try {
              setSubmitting(true);
              await deleteCategory(category.id, fallback?.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err: any) {
              Alert.alert(lx({ en: "Error", ta: "பிழை" }), err.message || "Failed to delete category");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => {
              if (mode !== "list") setMode("list");
              else onClose();
            }}
            style={styles.headerBtn}
            hitSlop={10}
          >
            <Feather name={mode !== "list" ? "arrow-left" : "x"} size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {mode === "create"
              ? lx({ en: "Create New Category", ta: "புதிய வகை உருவாக்கு" })
              : mode === "edit"
              ? lx({ en: "Rename / Edit Category", ta: "வகையை திருத்து" })
              : lx({ en: "Manage Categories", ta: "வகைகள் நிர்வாகம்" })}
          </Text>

          {mode === "list" ? (
            <Pressable style={[styles.addPillBtn, { backgroundColor: "#7c3aed" }]} onPress={openCreate} hitSlop={8}>
              <Feather name="plus" size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.addPillText}>{lx({ en: "Add", ta: "சேர்" })}</Text>
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {mode === "list" ? (
            <View style={styles.listSection}>
              <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
                {lx({
                  en: "Create, rename, or remove the groups you sort your herd into.",
                  ta: "உங்கள் மாடுகளை பிரிக்கும் வகைகளை உருவாக்கவும் அல்லது திருத்தவும்.",
                })}
              </Text>

              {categories.map((category) => {
                const count = countFor(category);
                return (
                  <View
                    key={category.id}
                    style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.cardMain}>
                      <View style={[styles.iconBg, { backgroundColor: category.color }]}>
                        <MaterialCommunityIcons name={category.icon as any} size={18} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.categoryName, { color: colors.foreground }]}>{category.name}</Text>
                        {category.desc ? (
                          <Text style={[styles.categoryDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {category.desc}
                          </Text>
                        ) : null}
                        <Text style={[styles.animalBadge, { color: category.color }]}>
                          {count} {count === 1 ? "Animal" : "Animals"}
                        </Text>
                      </View>

                      <View style={styles.actionsRow}>
                        <Pressable
                          style={[styles.actionIconBtn, { backgroundColor: colors.muted }]}
                          onPress={() => openEdit(category)}
                          hitSlop={8}
                        >
                          <Feather name="edit-2" size={15} color={colors.foreground} />
                        </Pressable>

                        <Pressable
                          style={[styles.actionIconBtn, { backgroundColor: "#ef444415" }]}
                          onPress={() => handleDelete(category)}
                          hitSlop={8}
                        >
                          <Feather name="trash-2" size={15} color="#ef4444" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}

              <Pressable style={[styles.createBigBtn, { borderColor: "#7c3aed" }]} onPress={openCreate}>
                <Feather name="plus-circle" size={20} color="#7c3aed" style={{ marginRight: 8 }} />
                <Text style={[styles.createBigText, { color: "#7c3aed" }]}>
                  {lx({ en: "Create Another Category", ta: "மற்றொரு வகை சேர்" })}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.formSection}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                {lx({ en: "Category Name", ta: "வகையின் பெயர்" })} <Text style={{ color: "#ef4444" }}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.border, color: colors.foreground }]}
                value={name}
                onChangeText={setName}
                placeholder={lx({ en: "e.g. Heifers", ta: "உதாரணம்: கிடேரிகள்" })}
                placeholderTextColor={colors.mutedForeground}
                autoFocus
              />

              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                {lx({ en: "Description (Optional)", ta: "விவரிப்பு (விருப்பம்)" })}
              </Text>
              <TextInput
                style={[styles.textArea, { borderColor: colors.border, color: colors.foreground }]}
                value={desc}
                onChangeText={setDesc}
                placeholder={lx({ en: "e.g. Young females not yet calved", ta: "உதாரணம்: இளம் பசுக்கள்" })}
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                {lx({ en: "Colour", ta: "நிறம்" })}
              </Text>
              <View style={styles.colorRow}>
                {CATEGORY_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setColor(c);
                    }}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c, borderColor: c === color ? colors.foreground : "transparent" },
                    ]}
                  >
                    {c === color ? <Feather name="check" size={14} color="#fff" /> : null}
                  </Pressable>
                ))}
              </View>

              <View style={styles.formActions}>
                <Pressable
                  style={[styles.btnSecondary, { borderColor: colors.border }]}
                  onPress={() => setMode("list")}
                  disabled={submitting}
                >
                  <Text style={[styles.btnTextSecondary, { color: colors.foreground }]}>
                    {lx({ en: "Cancel", ta: "ரத்து" })}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.btnPrimary, { backgroundColor: "#7c3aed" }]}
                  onPress={handleSave}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnTextPrimary}>
                      {mode === "create"
                        ? lx({ en: "Create Category", ta: "உருவாக்கு" })
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
  categoryCard: {
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
  categoryName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  categoryDesc: {
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
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
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

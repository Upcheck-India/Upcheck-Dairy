import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useApp, InventoryItem, generateId, getTodayString } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  editItem?: InventoryItem;
}

const CATEGORIES: Array<{
  key: InventoryItem["category"]; label: string; labelTa: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string;
}> = [
  { key: "feed", label: "Feed", labelTa: "தீவனம்", icon: "sprout", color: "#16a34a" },
  { key: "medicine", label: "Medicine", labelTa: "மருந்து", icon: "pill", color: "#0284c7" },
  { key: "supplement", label: "Supplement", labelTa: "சத்துணவு", icon: "flask-outline", color: "#7c3aed" },
  { key: "equipment", label: "Equipment", labelTa: "உபகரணம்", icon: "tools", color: "#d97706" },
  { key: "other", label: "Other", labelTa: "மற்றவை", icon: "package-variant-closed", color: "#6b7280" },
];

const COMMON_UNITS = ["kg", "litre", "bag", "bottle", "box", "piece", "dose"];
const COMMON_ITEMS: Record<string, string[]> = {
  feed: ["Napier Grass", "Maize Silage", "Concentrate Feed", "Paddy Straw", "Groundnut Cake", "Cotton Seed Cake", "Mineral Mix"],
  medicine: ["FMD Vaccine", "HS Vaccine", "Ivermectin", "Calcium Gel", "Antibiotic", "Fly Spray"],
  supplement: ["Bypass Protein", "Yeast Culture", "Vitamin A+D", "Chelated Minerals"],
  equipment: ["Milking Machine Filter", "Teat Cup Liner", "Milk Can", "Halter Rope"],
  other: ["Disinfectant", "Bedding Sand", "Ear Tags"],
};

export default function InventoryModal({ visible, onClose, editItem }: Props) {
  const { addInventoryItem, updateInventoryItem } = useApp();
  const { language } = useLanguage();
  const colors = useColors();
  const isTa = language === "ta";

  const [category, setCategory] = useState<InventoryItem["category"]>(editItem?.category ?? "feed");
  const [name, setName] = useState(editItem?.name ?? "");
  const [quantity, setQuantity] = useState(editItem?.quantity?.toString() ?? "");
  const [unit, setUnit] = useState(editItem?.unit ?? "kg");
  const [minQty, setMinQty] = useState(editItem?.minQuantity?.toString() ?? "");
  const [pricePerUnit, setPricePerUnit] = useState(editItem?.pricePerUnit?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert("Error", isTa ? "பொருளின் பெயர் சேர்க்கவும்" : "Please enter item name"); return; }
    if (!quantity || isNaN(parseFloat(quantity))) { Alert.alert("Error", isTa ? "அளவு சேர்க்கவும்" : "Please enter quantity"); return; }

    setSaving(true);
    const item: InventoryItem = {
      id: editItem?.id ?? generateId(),
      name: name.trim(),
      category,
      quantity: parseFloat(quantity),
      unit,
      minQuantity: minQty ? parseFloat(minQty) : 0,
      pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : undefined,
      lastUpdated: getTodayString(),
    };
    if (editItem) updateInventoryItem(item); else addInventoryItem(item);
    setSaving(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setCategory("feed");
    setName("");
    setQuantity("");
    setUnit("kg");
    setMinQty("");
    setPricePerUnit("");
  };

  const suggestions = COMMON_ITEMS[category] ?? [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{editItem ? (isTa ? "பொருள் திருத்து" : "Edit Item") : (isTa ? "பொருள் சேர்" : "Add Inventory Item")}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Category */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{isTa ? "வகை" : "Category"}</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                style={[
                  styles.categoryChip,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                  category === cat.key && { backgroundColor: cat.color, borderColor: cat.color }
                ]}
                onPress={() => { setCategory(cat.key); setName(""); }}
              >
                <MaterialCommunityIcons 
                  name={cat.icon} 
                  size={16} 
                  color={category === cat.key ? "#fff" : colors.mutedForeground} 
                />
                <Text style={[styles.categoryLabel, { color: colors.mutedForeground }, category === cat.key && { color: "#fff" }]}>
                  {isTa ? cat.labelTa : cat.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{isTa ? "பொதுவான பொருட்கள்" : "Common Items"}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8, paddingBottom: 4 }}>
                  {suggestions.map((s) => (
                    <Pressable 
                      key={s} 
                      style={[styles.suggestionChip, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]} 
                      onPress={() => setName(s)}
                    >
                      <Text style={[styles.suggestionText, { color: colors.primary }]}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {/* Name */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{isTa ? "பொருளின் பெயர்" : "Item Name"}</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Feather name="package" size={18} color={colors.primary} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={name}
              onChangeText={setName}
              placeholder={isTa ? "பெயர் சேர்க்கவும்" : "Enter item name"}
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          {/* Quantity and Unit */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{isTa ? "அளவு" : "Quantity"}</Text>
          <View style={styles.qtyUnitRow}>
            <View style={[styles.inputRow, { flex: 1, borderColor: colors.border, backgroundColor: colors.muted }]}>
              <Feather name="layers" size={18} color={colors.primary} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {COMMON_UNITS.map((u) => (
                  <Pressable
                    key={u}
                    style={[
                      styles.unitChip,
                      { backgroundColor: colors.muted, borderColor: colors.border },
                      unit === u && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[styles.unitChipText, { color: colors.mutedForeground }, unit === u && { color: "#fff" }]}>{u}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Min Quantity Alert */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{isTa ? "குறைந்தபட்ச அளவு (அலர்ட்)" : "Minimum Quantity (Alert Level)"}</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Feather name="alert-triangle" size={18} color={colors.warning} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={minQty}
              onChangeText={setMinQty}
              placeholder={isTa ? "குறைந்தபட்ச அளவு" : "Alert when below this"}
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
          </View>

          {/* Price per unit */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{isTa ? "ஒரு அலகு விலை ₹ (விருப்பம்)" : "Price per Unit ₹ (optional)"}</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Text style={[styles.rupeeSign, { color: colors.primary }]}>₹</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={pricePerUnit}
              onChangeText={setPricePerUnit}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
          </View>

          <Pressable
            style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>{editItem ? (isTa ? "புதுப்பி" : "Update") : (isTa ? "சேமி" : "Save")}</Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 20, paddingTop: 24, borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: "800" },
  closeBtn: { padding: 8 },
  body: { flex: 1, padding: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 16 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1,
  },
  categoryLabel: { fontSize: 12, fontWeight: "600" },
  suggestionChip: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 12, fontWeight: "600" },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15 },
  rupeeSign: { fontSize: 17, fontWeight: "700" },
  qtyUnitRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  unitScroll: { flex: 1 },
  unitChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1,
  },
  unitChipText: { fontSize: 12, fontWeight: "600" },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 16, paddingVertical: 16, marginTop: 24,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useApp, InventoryItem, generateId, getTodayString } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  editItem?: InventoryItem;
}

const CATEGORIES: Array<{
  key: InventoryItem["category"]; label: string; labelTa: string; emoji: string; color: string;
}> = [
  { key: "feed", label: "Feed", labelTa: "தீவனம்", emoji: "🌾", color: "#16a34a" },
  { key: "medicine", label: "Medicine", labelTa: "மருந்து", emoji: "💊", color: "#0284c7" },
  { key: "supplement", label: "Supplement", labelTa: "சத்துணவு", emoji: "🧪", color: "#7c3aed" },
  { key: "equipment", label: "Equipment", labelTa: "உபகரணம்", emoji: "🔧", color: "#d97706" },
  { key: "other", label: "Other", labelTa: "மற்றவை", emoji: "📦", color: "#6b7280" },
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{editItem ? (isTa ? "பொருள் திருத்து" : "Edit Item") : (isTa ? "பொருள் சேர்" : "Add Inventory Item")}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color="#6b7280" />
          </Pressable>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Category */}
          <Text style={styles.sectionLabel}>{isTa ? "வகை" : "Category"}</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                style={[styles.categoryChip, category === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]}
                onPress={() => { setCategory(cat.key); setName(""); }}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[styles.categoryLabel, category === cat.key && { color: "#fff" }]}>
                  {isTa ? cat.labelTa : cat.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>{isTa ? "பொதுவான பொருட்கள்" : "Common Items"}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8, paddingBottom: 4 }}>
                  {suggestions.map((s) => (
                    <Pressable key={s} style={styles.suggestionChip} onPress={() => setName(s)}>
                      <Text style={styles.suggestionText}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {/* Name */}
          <Text style={styles.sectionLabel}>{isTa ? "பொருளின் பெயர்" : "Item Name"}</Text>
          <View style={styles.inputRow}>
            <Feather name="package" size={18} color="#d97706" />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={isTa ? "பெயர் சேர்க்கவும்" : "Enter item name"}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Quantity and Unit */}
          <Text style={styles.sectionLabel}>{isTa ? "அளவு" : "Quantity"}</Text>
          <View style={styles.qtyUnitRow}>
            <View style={[styles.inputRow, { flex: 1 }]}>
              <Feather name="layers" size={18} color="#d97706" />
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {COMMON_UNITS.map((u) => (
                  <Pressable
                    key={u}
                    style={[styles.unitChip, unit === u && styles.unitChipActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[styles.unitChipText, unit === u && { color: "#fff" }]}>{u}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Min Quantity Alert */}
          <Text style={styles.sectionLabel}>{isTa ? "குறைந்தபட்ச அளவு (அலர்ட்)" : "Minimum Quantity (Alert Level)"}</Text>
          <View style={styles.inputRow}>
            <Feather name="alert-triangle" size={18} color="#f97316" />
            <TextInput
              style={styles.input}
              value={minQty}
              onChangeText={setMinQty}
              placeholder={isTa ? "குறைந்தபட்ச அளவு" : "Alert when below this"}
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>

          {/* Price per unit */}
          <Text style={styles.sectionLabel}>{isTa ? "ஒரு அலகு விலை ₹ (விருப்பம்)" : "Price per Unit ₹ (optional)"}</Text>
          <View style={styles.inputRow}>
            <Text style={styles.rupeeSign}>₹</Text>
            <TextInput
              style={styles.input}
              value={pricePerUnit}
              onChangeText={setPricePerUnit}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>

          <Pressable
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
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
  container: { flex: 1, backgroundColor: "#fefce8" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 20, paddingTop: 24, backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
  },
  title: { fontSize: 18, fontWeight: "800", color: "#1a2e05" },
  closeBtn: { padding: 8 },
  body: { flex: 1, padding: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8, marginTop: 16 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "#f3f4f6", borderWidth: 1.5, borderColor: "#e5e7eb",
  },
  categoryEmoji: { fontSize: 15 },
  categoryLabel: { fontSize: 12, fontWeight: "600", color: "#374151" },
  suggestionChip: {
    backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa",
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  suggestionText: { fontSize: 12, color: "#c2410c" },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderColor: "#fed7aa", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "#fffbeb",
  },
  input: { flex: 1, fontSize: 15, color: "#1a2e05" },
  rupeeSign: { fontSize: 17, fontWeight: "700", color: "#d97706" },
  qtyUnitRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  unitScroll: { flex: 1 },
  unitChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: "#f3f4f6", borderWidth: 1.5, borderColor: "#e5e7eb",
  },
  unitChipActive: { backgroundColor: "#d97706", borderColor: "#d97706" },
  unitChipText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#d97706", borderRadius: 16, paddingVertical: 16, marginTop: 24,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

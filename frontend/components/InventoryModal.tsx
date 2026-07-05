import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  ActivityIndicator
} from "react-native";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useInventory } from "../src/modules/inventory/hooks/useInventory";
import { useFarm } from "../src/modules/farms/hooks/useFarm";
import { InventoryItem } from "../src/modules/inventory/models/InventoryItem";

interface Props {
  visible: boolean;
  onClose: () => void;
  editItem?: any;
}

const CATEGORIES: Array<{
  key: any;
  labelKey:
    | "inventoryCategoryFeed"
    | "inventoryCategoryMedicine"
    | "inventoryCategorySupplement"
    | "inventoryCategoryEquipment"
    | "inventoryCategoryOther";
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}> = [
  { key: "feed", labelKey: "inventoryCategoryFeed", icon: "sprout", color: "#16a34a" },
  { key: "medicine", labelKey: "inventoryCategoryMedicine", icon: "pill", color: "#0284c7" },
  { key: "supplement", labelKey: "inventoryCategorySupplement", icon: "flask-outline", color: "#7c3aed" },
  { key: "equipment", labelKey: "inventoryCategoryEquipment", icon: "tools", color: "#d97706" },
  { key: "other", labelKey: "inventoryCategoryOther", icon: "package-variant-closed", color: "#6b7280" },
];

const COMMON_UNITS = ["kg", "litre", "bag", "bottle", "box", "piece", "dose"];
const COMMON_ITEMS: Record<string, string[]> = {
  feed: ["Dairy Feed (Gold)", "Green Fodder (Napier)", "Dry Straw", "Cotton Seed Cake"],
  medicine: ["Dewormer Bolus", "Mastitis Cream", "Calcium Gel", "Oxytetracycline LA"],
  supplement: ["Bypass Protein", "Yeast Culture", "Vitamin A+D", "Chelated Minerals"],
  equipment: ["Milking Machine Filter", "Teat Cup Liner", "Milk Can", "Halter Rope"],
  other: ["Disinfectant", "Bedding Sand", "Ear Tags"],
};

export default function InventoryModal({ visible, onClose, editItem }: Props) {
  const { createItem, updateItem } = useInventory();
  const { activeFarm } = useFarm();
  const { t, language } = useLanguage();
  const colors = useColors();

  const [category, setCategory] = useState<any>(editItem?.category ?? "feed");
  const [name, setName] = useState(editItem?.name ?? "");
  const [quantity, setQuantity] = useState(editItem?.quantity?.toString() ?? "");
  const [unit, setUnit] = useState(editItem?.unit ?? "kg");
  const [minQty, setMinQty] = useState(editItem?.minQuantity?.toString() ?? "");
  const [pricePerUnit, setPricePerUnit] = useState(editItem?.pricePerUnit?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Error", t.inventoryErrorItemName); return; }
    if (!quantity || isNaN(parseFloat(quantity))) { Alert.alert("Error", t.inventoryErrorQty); return; }
    if (!activeFarm?.id) { Alert.alert("Error", "No active farm selected"); return; }

    setSaving(true);
    try {
      if (editItem) {
        await updateItem(Number(editItem.id), {
          name: name.trim(),
          category,
          quantity: parseFloat(quantity),
          unit,
          minQuantity: minQty ? parseFloat(minQty) : 0,
          pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : undefined,
        });
      } else {
        await createItem({
          farmId: activeFarm.id,
          name: name.trim(),
          category,
          quantity: parseFloat(quantity),
          unit,
          minQuantity: minQty ? parseFloat(minQty) : 0,
          pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : undefined,
        });
      }
      resetForm();
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save inventory item");
    } finally {
      setSaving(false);
    }
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
          <Text style={[styles.title, { color: colors.foreground }]}>{editItem ? t.inventoryEditTitle : t.inventoryAddTitle}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Category */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t.inventoryCategory}</Text>
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
                  {t[cat.labelKey]}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t.inventoryCommonItems}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8, paddingBottom: 4 }}>
                  {suggestions.map((s: string) => (
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
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t.inventoryItemName}</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Feather name="package" size={18} color={colors.primary} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={name}
              onChangeText={setName}
              placeholder={t.inventoryItemNamePlaceholder}
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          {/* Quantity and Unit */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t.inventoryQuantity}</Text>
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
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t.inventoryMinQtyLabel}</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Feather name="alert-triangle" size={18} color={colors.warning} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={minQty}
              onChangeText={setMinQty}
              placeholder={t.inventoryMinQtyPlaceholder}
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
          </View>

          {/* Price per unit */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t.inventoryPriceLabel}</Text>
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
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="check" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>{editItem ? t.inventoryUpdateBtn : t.save}</Text>
              </>
            )}
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

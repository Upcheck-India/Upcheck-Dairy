import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { VaccineType, getTodayString } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useAnimals } from "../src/modules/animals/hooks/useAnimals";
import { useVaccination } from "../src/modules/vaccination/hooks/useVaccination";
import { scheduleVaccinationReminder } from "../utils/notifications";

interface Props {
  visible: boolean;
  onClose: () => void;
  preselectedAnimalId?: string;
}

const VACCINE_TYPES: Array<{ type: VaccineType; label: string; labelTa: string; interval: string; iconName: keyof typeof Feather.glyphMap }> = [
  { type: "FMD", label: "FMD (Foot & Mouth)", labelTa: "கோமாரி (FMD)", interval: "6 months", iconName: "activity" },
  { type: "HS", label: "HS (Hemorrhagic Septicemia)", labelTa: "ரத்த நாய்ச்சல் (HS)", interval: "1 year", iconName: "droplet" },
  { type: "BQ", label: "BQ (Black Quarter)", labelTa: "கருங்கால் வியாதி (BQ)", interval: "1 year", iconName: "square" },
  { type: "Brucellosis", label: "Brucellosis", labelTa: "புரூசெல்லோசிஸ்", interval: "Once (heifers)", iconName: "shield" },
  { type: "Theileriosis", label: "Theileriosis", labelTa: "தீலேரியோசிஸ்", interval: "Once", iconName: "crosshair" },
  { type: "Anthrax", label: "Anthrax", labelTa: "ஆந்தராக்ஸ்", interval: "1 year", iconName: "alert-triangle" },
  { type: "PPR", label: "PPR", labelTa: "PPR", interval: "3 years", iconName: "thermometer" },
  { type: "Other", label: "Other", labelTa: "மற்றவை", interval: "-", iconName: "plus" },
];

export default function VaccinationModal({ visible, onClose, preselectedAnimalId }: Props) {
  const colors = useColors();
  const { animals } = useAnimals();
  const { createVaccination } = useVaccination();
  const { language } = useLanguage();

  const adultAnimals = animals.filter((a) => a.type !== "calf");
  const [selectedAnimalId, setSelectedAnimalId] = useState(preselectedAnimalId ?? adultAnimals[0]?.id ?? "");
  const [vaccineType, setVaccineType] = useState<VaccineType>("FMD");
  const [vaccineName, setVaccineName] = useState("");
  const [scheduledDate, setScheduledDate] = useState(getTodayString());
  const [batchNo, setBatchNo] = useState("");
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedTypeInfo = VACCINE_TYPES.find((v) => v.type === vaccineType);
  const isTa = language === "ta";

  const handleSave = async () => {
    if (!selectedAnimalId) { Alert.alert("Error", "Please select an animal"); return; }
    if (!scheduledDate) { Alert.alert("Error", "Please enter a date"); return; }

    setSaving(true);
    try {
      const vaxName = vaccineName.trim() || (selectedTypeInfo?.label ?? vaccineType);
      await createVaccination({
        animalId: Number(selectedAnimalId),
        vaccineName: vaxName,
        vaccineType,
        scheduledDate: new Date(scheduledDate).toISOString(),
        batchNo: batchNo.trim() || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        note: note.trim() || undefined,
      });

      // Schedule reminders in the background
      const animal = animals.find((a) => a.id === selectedAnimalId);
      const name = animal?.name || "Animal";
      scheduleVaccinationReminder(name, vaxName, new Date(scheduledDate), language).catch(e => console.warn(e));

      resetForm();
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to schedule vaccination");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setVaccineType("FMD");
    setVaccineName("");
    setScheduledDate(getTodayString());
    setBatchNo("");
    setCost("");
    setNote("");
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{isTa ? "தடுப்பூசி பதிவு" : "Schedule Vaccination"}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Animal Selector */}
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{isTa ? "மாடு தேர்வு" : "Select Animal"}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {adultAnimals.map((a) => (
                <Pressable
                  key={a.id}
                  style={[styles.animalChip, { backgroundColor: colors.muted, borderColor: colors.border }, selectedAnimalId === a.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setSelectedAnimalId(a.id)}
                >
                  <MaterialCommunityIcons name={a.type === "buffalo" ? "water" : "cow"} size={16} color={selectedAnimalId === a.id ? "#fff" : colors.foreground} />
                  <Text style={[styles.animalChipText, { color: colors.foreground }, selectedAnimalId === a.id && { color: "#fff" }]}>
                    {a.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Vaccine Type */}
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{isTa ? "தடுப்பூசி வகை" : "Vaccine Type"}</Text>
          <View style={styles.vaccineGrid}>
            {VACCINE_TYPES.map((vt) => (
              <Pressable
                key={vt.type}
                style={[styles.vaccineCard, { backgroundColor: colors.muted, borderColor: colors.border }, vaccineType === vt.type && { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
                onPress={() => setVaccineType(vt.type)}
              >
                <Feather name={vt.iconName} size={20} color={vaccineType === vt.type ? colors.primary : colors.mutedForeground} style={{ marginBottom: 4 }} />
                <Text style={[styles.vaccineLabel, { color: colors.foreground }, vaccineType === vt.type && { color: colors.primary }]}>
                  {isTa ? vt.labelTa : vt.label}
                </Text>
                <Text style={[styles.vaccineInterval, { color: colors.mutedForeground }]}>{vt.interval}</Text>
              </Pressable>
            ))}
          </View>

          {selectedTypeInfo && (
            <View style={[styles.infoBanner, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="info" size={14} color={colors.primary} />
              <Text style={[styles.infoBannerText, { color: colors.primary }]}>
                {isTa
                  ? `${selectedTypeInfo.labelTa}: ${selectedTypeInfo.interval} இடைவெளி`
                  : `${selectedTypeInfo.label}: Every ${selectedTypeInfo.interval}`}
              </Text>
            </View>
          )}

          {/* Scheduled Date */}
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{isTa ? "திட்டமிட்ட தேதி" : "Scheduled Date"}</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Feather name="calendar" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={scheduledDate}
              onChangeText={setScheduledDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
          </View>

          {/* Batch No (optional) */}
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{isTa ? "தொகுப்பு எண் (விருப்பம்)" : "Batch No. (optional)"}</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Feather name="hash" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={batchNo}
              onChangeText={setBatchNo}
              placeholder="e.g. FMDV-2025-001"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          {/* Cost */}
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{isTa ? "செலவு ₹ (விருப்பம்)" : "Cost ₹ (optional)"}</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Text style={[styles.rupeeSign, { color: colors.mutedForeground }]}>₹</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={cost}
              onChangeText={setCost}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
          </View>

          {/* Note */}
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{isTa ? "குறிப்பு (விருப்பம்)" : "Note (optional)"}</Text>
          <TextInput
            style={[styles.inputRow, styles.noteInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
            value={note}
            onChangeText={setNote}
            placeholder={isTa ? "குறிப்பு சேர்க்கவும்..." : "Add a note..."}
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
          />

          <Pressable
            style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>{isTa ? "சேமி" : "Save"}</Text>
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
  chipRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  animalChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5,
  },
  animalChipText: { fontSize: 14, fontWeight: "600" },
  vaccineGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  vaccineCard: {
    width: "48%", padding: 12, borderRadius: 12, alignItems: "center",
    borderWidth: 1.5,
  },
  vaccineLabel: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  vaccineInterval: { fontSize: 10, marginTop: 2 },
  infoBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, padding: 10, marginTop: 8,
  },
  infoBannerText: { fontSize: 13, fontWeight: "600", flex: 1 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15 },
  rupeeSign: { fontSize: 17, fontWeight: "700" },
  noteInput: { alignItems: "flex-start", paddingVertical: 10, minHeight: 80 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 16, paddingVertical: 16, marginTop: 24,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

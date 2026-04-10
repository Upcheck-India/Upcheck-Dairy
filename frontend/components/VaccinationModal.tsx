import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useApp, Vaccination, VaccineType, generateId, getTodayString } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  preselectedAnimalId?: string;
}

const VACCINE_TYPES: Array<{ type: VaccineType; label: string; labelTa: string; interval: string; emoji: string }> = [
  { type: "FMD", label: "FMD (Foot & Mouth)", labelTa: "கோமாரி (FMD)", interval: "6 months", emoji: "🦶" },
  { type: "HS", label: "HS (Hemorrhagic Septicemia)", labelTa: "ரத்த நாய்ச்சல் (HS)", interval: "1 year", emoji: "🩸" },
  { type: "BQ", label: "BQ (Black Quarter)", labelTa: "கருங்கால் வியாதி (BQ)", interval: "1 year", emoji: "⬛" },
  { type: "Brucellosis", label: "Brucellosis", labelTa: "புரூசெல்லோசிஸ்", interval: "Once (heifers)", emoji: "🧫" },
  { type: "Theileriosis", label: "Theileriosis", labelTa: "தீலேரியோசிஸ்", interval: "Once", emoji: "🦠" },
  { type: "Anthrax", label: "Anthrax", labelTa: "ஆந்தராக்ஸ்", interval: "1 year", emoji: "☣️" },
  { type: "PPR", label: "PPR", labelTa: "PPR", interval: "3 years", emoji: "💊" },
  { type: "Other", label: "Other", labelTa: "மற்றவை", interval: "-", emoji: "💉" },
];

export default function VaccinationModal({ visible, onClose, preselectedAnimalId }: Props) {
  const { animals, addVaccination } = useApp();
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

  const handleSave = () => {
    if (!selectedAnimalId) { Alert.alert("Error", "Please select an animal"); return; }
    if (!scheduledDate) { Alert.alert("Error", "Please enter a date"); return; }

    setSaving(true);
    const vax: Vaccination = {
      id: generateId(),
      animalId: selectedAnimalId,
      vaccineName: vaccineName.trim() || (selectedTypeInfo?.label ?? vaccineType),
      vaccineType,
      scheduledDate,
      batchNo: batchNo.trim() || undefined,
      cost: cost ? parseFloat(cost) : undefined,
      note: note.trim() || undefined,
    };
    addVaccination(vax);
    setSaving(false);
    resetForm();
    onClose();
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{isTa ? "தடுப்பூசி பதிவு" : "Schedule Vaccination"}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color="#6b7280" />
          </Pressable>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Animal Selector */}
          <Text style={styles.sectionLabel}>{isTa ? "மாடு தேர்வு" : "Select Animal"}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {adultAnimals.map((a) => (
                <Pressable
                  key={a.id}
                  style={[styles.animalChip, selectedAnimalId === a.id && styles.animalChipActive]}
                  onPress={() => setSelectedAnimalId(a.id)}
                >
                  <Text style={styles.animalChipEmoji}>{a.type === "buffalo" ? "🐃" : "🐄"}</Text>
                  <Text style={[styles.animalChipText, selectedAnimalId === a.id && styles.animalChipTextActive]}>
                    {a.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Vaccine Type */}
          <Text style={styles.sectionLabel}>{isTa ? "தடுப்பூசி வகை" : "Vaccine Type"}</Text>
          <View style={styles.vaccineGrid}>
            {VACCINE_TYPES.map((vt) => (
              <Pressable
                key={vt.type}
                style={[styles.vaccineCard, vaccineType === vt.type && styles.vaccineCardActive]}
                onPress={() => setVaccineType(vt.type)}
              >
                <Text style={styles.vaccineEmoji}>{vt.emoji}</Text>
                <Text style={[styles.vaccineLabel, vaccineType === vt.type && styles.vaccineLabelActive]}>
                  {isTa ? vt.labelTa : vt.label}
                </Text>
                <Text style={styles.vaccineInterval}>{vt.interval}</Text>
              </Pressable>
            ))}
          </View>

          {selectedTypeInfo && (
            <View style={styles.infoBanner}>
              <Feather name="info" size={14} color="#0284c7" />
              <Text style={styles.infoBannerText}>
                {isTa
                  ? `${selectedTypeInfo.labelTa}: ${selectedTypeInfo.interval} இடைவெளி`
                  : `${selectedTypeInfo.label}: Every ${selectedTypeInfo.interval}`}
              </Text>
            </View>
          )}

          {/* Scheduled Date */}
          <Text style={styles.sectionLabel}>{isTa ? "திட்டமிட்ட தேதி" : "Scheduled Date"}</Text>
          <View style={styles.inputRow}>
            <Feather name="calendar" size={18} color="#0284c7" />
            <TextInput
              style={styles.input}
              value={scheduledDate}
              onChangeText={setScheduledDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>

          {/* Batch No (optional) */}
          <Text style={styles.sectionLabel}>{isTa ? "தொகுப்பு எண் (விருப்பம்)" : "Batch No. (optional)"}</Text>
          <View style={styles.inputRow}>
            <Feather name="hash" size={18} color="#0284c7" />
            <TextInput
              style={styles.input}
              value={batchNo}
              onChangeText={setBatchNo}
              placeholder="e.g. FMDV-2025-001"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Cost */}
          <Text style={styles.sectionLabel}>{isTa ? "செலவு ₹ (விருப்பம்)" : "Cost ₹ (optional)"}</Text>
          <View style={styles.inputRow}>
            <Text style={styles.rupeeSign}>₹</Text>
            <TextInput
              style={styles.input}
              value={cost}
              onChangeText={setCost}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>

          {/* Note */}
          <Text style={styles.sectionLabel}>{isTa ? "குறிப்பு (விருப்பம்)" : "Note (optional)"}</Text>
          <TextInput
            style={[styles.inputRow, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder={isTa ? "குறிப்பு சேர்க்கவும்..." : "Add a note..."}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
          />

          <Pressable
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
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
  chipRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  animalChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#f3f4f6", borderWidth: 1.5, borderColor: "#e5e7eb",
  },
  animalChipActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  animalChipEmoji: { fontSize: 16 },
  animalChipText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  animalChipTextActive: { color: "#fff" },
  vaccineGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  vaccineCard: {
    width: "48%", padding: 12, borderRadius: 12, alignItems: "center",
    backgroundColor: "#f3f4f6", borderWidth: 1.5, borderColor: "#e5e7eb",
  },
  vaccineCardActive: { backgroundColor: "#dbeafe", borderColor: "#0284c7" },
  vaccineEmoji: { fontSize: 20, marginBottom: 4 },
  vaccineLabel: { fontSize: 11, fontWeight: "700", color: "#374151", textAlign: "center" },
  vaccineLabelActive: { color: "#0284c7" },
  vaccineInterval: { fontSize: 10, color: "#9ca3af", marginTop: 2 },
  infoBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#dbeafe", borderRadius: 10, padding: 10, marginTop: 8,
  },
  infoBannerText: { color: "#1d4ed8", fontSize: 13, fontWeight: "600", flex: 1 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderColor: "#bfdbfe", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "#eff6ff",
  },
  input: { flex: 1, fontSize: 15, color: "#1a2e05" },
  rupeeSign: { fontSize: 17, fontWeight: "700", color: "#0284c7" },
  noteInput: { alignItems: "flex-start", paddingVertical: 10, minHeight: 80, borderColor: "#e5e7eb", backgroundColor: "#fafafa" },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#0284c7", borderRadius: 16, paddingVertical: 16, marginTop: 24,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

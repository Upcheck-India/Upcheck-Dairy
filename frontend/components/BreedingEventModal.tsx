import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useApp, BreedingEvent, BreedingEventType, generateId, getTodayString } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  preselectedAnimalId?: string;
}

const EVENT_TYPES: Array<{ type: BreedingEventType; emoji: string; label: string; labelTa: string }> = [
  { type: "heat", emoji: "🌡️", label: "In Heat", labelTa: "ஈட்டு" },
  { type: "insemination", emoji: "💉", label: "Inseminated (AI)", labelTa: "AI கலப்பு" },
  { type: "pregnancy_confirmed", emoji: "🤰", label: "Pregnancy Confirmed", labelTa: "கர்ப்பம் உறுதி" },
  { type: "dry_off", emoji: "🛑", label: "Dry Off", labelTa: "கறவை நிறுத்து" },
  { type: "calving", emoji: "🐄", label: "Calved (Gave Birth)", labelTa: "குட்டி போட்டது" },
  { type: "abort", emoji: "⚠️", label: "Abortion / Miscarriage", labelTa: "கருச்சிதைவு" },
];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
}

export default function BreedingEventModal({ visible, onClose, preselectedAnimalId }: Props) {
  const { animals, addBreedingEvent } = useApp();
  const { language } = useLanguage();

  const adultAnimals = animals.filter((a) => a.type !== "calf");
  const [selectedAnimalId, setSelectedAnimalId] = useState(preselectedAnimalId ?? adultAnimals[0]?.id ?? "");
  const [eventType, setEventType] = useState<BreedingEventType>("heat");
  const [date, setDate] = useState(getTodayString());
  const [bullName, setBullName] = useState("");
  const [calvingGender, setCalvingGender] = useState<"male" | "female" | "">("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const animal = animals.find((a) => a.id === selectedAnimalId);

  const expectedCalvingDate = (eventType === "insemination" || eventType === "pregnancy_confirmed")
    ? addDays(date, animal?.type === "buffalo" ? 310 : 280)
    : undefined;

  const handleSave = async () => {
    if (!selectedAnimalId) { Alert.alert("Error", "Please select an animal"); return; }
    if (!date) { Alert.alert("Error", "Please enter the date"); return; }

    setSaving(true);
    const event: BreedingEvent = {
      id: generateId(),
      animalId: selectedAnimalId,
      eventType,
      date,
      note: note.trim() || undefined,
      bullName: bullName.trim() || undefined,
      expectedCalvingDate,
      calvingGender: calvingGender || undefined,
    };
    addBreedingEvent(event);
    setSaving(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setEventType("heat");
    setDate(getTodayString());
    setBullName("");
    setCalvingGender("");
    setNote("");
  };

  const isTa = language === "ta";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{isTa ? "இனப்பெருக்க பதிவு" : "Log Breeding Event"}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color="#6b7280" />
          </Pressable>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Animal Selector */}
          <Text style={styles.sectionLabel}>{isTa ? "மாடு தேர்வு" : "Select Animal"}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
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
          </ScrollView>

          {/* Event Type */}
          <Text style={styles.sectionLabel}>{isTa ? "நிகழ்வு வகை" : "Event Type"}</Text>
          <View style={styles.eventGrid}>
            {EVENT_TYPES.map((et) => (
              <Pressable
                key={et.type}
                style={[styles.eventCard, eventType === et.type && styles.eventCardActive]}
                onPress={() => setEventType(et.type)}
              >
                <Text style={styles.eventEmoji}>{et.emoji}</Text>
                <Text style={[styles.eventLabel, eventType === et.type && styles.eventLabelActive]}>
                  {isTa ? et.labelTa : et.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Date */}
          <Text style={styles.sectionLabel}>{isTa ? "தேதி" : "Date"}</Text>
          <View style={styles.inputRow}>
            <Feather name="calendar" size={18} color="#16a34a" />
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>

          {/* Expected calving date (auto-computed) */}
          {expectedCalvingDate && (
            <View style={styles.infoBanner}>
              <Feather name="calendar" size={14} color="#0284c7" />
              <Text style={styles.infoBannerText}>
                {isTa ? `எதிர்பார்க்கப்படும் குட்டி தேதி: ${expectedCalvingDate}` : `Expected calving: ${expectedCalvingDate}`}
              </Text>
            </View>
          )}

          {/* Bull name for insemination */}
          {eventType === "insemination" && (
            <>
              <Text style={styles.sectionLabel}>{isTa ? "காளை / விந்து பெயர் (விருப்பம்)" : "Bull / Semen Name (optional)"}</Text>
              <View style={styles.inputRow}>
                <Feather name="user" size={18} color="#16a34a" />
                <TextInput
                  style={styles.input}
                  value={bullName}
                  onChangeText={setBullName}
                  placeholder={isTa ? "எ.கா: Gir A2 High" : "e.g. HF-Elite Semen, Gir A2"}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </>
          )}

          {/* Calving gender */}
          {eventType === "calving" && (
            <>
              <Text style={styles.sectionLabel}>{isTa ? "குட்டி பாலினம்" : "Calf Gender"}</Text>
              <View style={styles.genderRow}>
                {(["male", "female", ""] as const).map((g) => (
                  <Pressable
                    key={g}
                    style={[styles.genderChip, calvingGender === g && styles.genderChipActive]}
                    onPress={() => setCalvingGender(g)}
                  >
                    <Text style={styles.genderChipText}>
                      {g === "" ? (isTa ? "தெரியவில்லை" : "Unknown") : g === "male" ? (isTa ? "ஆண் கன்று" : "Male Calf") : (isTa ? "பெண் கன்று" : "Female Calf")}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

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
            <Text style={styles.saveBtnText}>{isTa ? "சேமி" : "Save Event"}</Text>
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
  chipRow: { marginBottom: 4 },
  animalChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    backgroundColor: "#f3f4f6", borderWidth: 1.5, borderColor: "#e5e7eb",
  },
  animalChipActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  animalChipEmoji: { fontSize: 16 },
  animalChipText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  animalChipTextActive: { color: "#fff" },
  eventGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  eventCard: {
    width: "31%", padding: 10, borderRadius: 12, alignItems: "center",
    backgroundColor: "#f3f4f6", borderWidth: 1.5, borderColor: "#e5e7eb",
  },
  eventCardActive: { backgroundColor: "#dcfce7", borderColor: "#16a34a" },
  eventEmoji: { fontSize: 22, marginBottom: 4 },
  eventLabel: { fontSize: 11, fontWeight: "600", color: "#6b7280", textAlign: "center" },
  eventLabelActive: { color: "#16a34a" },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderColor: "#d1fae5", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "#f0fdf4",
  },
  input: { flex: 1, fontSize: 15, color: "#1a2e05" },
  noteInput: { alignItems: "flex-start", paddingVertical: 10, minHeight: 80 },
  infoBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#dbeafe", borderRadius: 10, padding: 10, marginTop: 8,
  },
  infoBannerText: { color: "#1d4ed8", fontSize: 13, fontWeight: "600" },
  genderRow: { flexDirection: "row", gap: 8 },
  genderChip: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
    backgroundColor: "#f3f4f6", borderWidth: 1.5, borderColor: "#e5e7eb",
  },
  genderChipActive: { backgroundColor: "#dcfce7", borderColor: "#16a34a" },
  genderChipText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#16a34a", borderRadius: 16, paddingVertical: 16, marginTop: 24,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

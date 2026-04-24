import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useApp, BreedingEvent, BreedingEventType, generateId, getTodayString } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  preselectedAnimalId?: string;
}

const EVENT_TYPES: Array<{ type: BreedingEventType; iconName: keyof typeof Feather.glyphMap; label: string; labelTa: string }> = [
  { type: "heat", iconName: "thermometer", label: "In Heat", labelTa: "ஈட்டு" },
  { type: "insemination", iconName: "activity", label: "Inseminated (AI)", labelTa: "AI கலப்பு" },
  { type: "pregnancy_confirmed", iconName: "heart", label: "Pregnancy Confirmed", labelTa: "கர்ப்பம் உறுதி" },
  { type: "dry_off", iconName: "slash", label: "Dry Off", labelTa: "கறவை நிறுத்து" },
  { type: "calving", iconName: "git-commit", label: "Calved (Gave Birth)", labelTa: "குட்டி போட்டது" },
  { type: "abort", iconName: "alert-triangle", label: "Abortion / Miscarriage", labelTa: "கருச்சிதைவு" },
];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
}

export default function BreedingEventModal({ visible, onClose, preselectedAnimalId }: Props) {
  const colors = useColors();
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{isTa ? "இனப்பெருக்க பதிவு" : "Log Breeding Event"}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Animal Selector */}
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{isTa ? "மாடு தேர்வு" : "Select Animal"}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
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
          </ScrollView>

          {/* Event Type */}
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{isTa ? "நிகழ்வு வகை" : "Event Type"}</Text>
          <View style={styles.eventGrid}>
            {EVENT_TYPES.map((et) => (
              <Pressable
                key={et.type}
                style={[styles.eventCard, { backgroundColor: colors.muted, borderColor: colors.border }, eventType === et.type && { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
                onPress={() => setEventType(et.type)}
              >
                <Feather name={et.iconName} size={22} color={eventType === et.type ? colors.primary : colors.mutedForeground} style={{ marginBottom: 4 }} />
                <Text style={[styles.eventLabel, { color: colors.foreground }, eventType === et.type && { color: colors.primary }]}>
                  {isTa ? et.labelTa : et.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Date */}
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{isTa ? "தேதி" : "Date"}</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Feather name="calendar" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
          </View>

          {/* Expected calving date (auto-computed) */}
          {expectedCalvingDate && (
            <View style={[styles.infoBanner, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="calendar" size={14} color={colors.primary} />
              <Text style={[styles.infoBannerText, { color: colors.primary }]}>
                {isTa ? `எதிர்பார்க்கப்படும் குட்டி தேதி: ${expectedCalvingDate}` : `Expected calving: ${expectedCalvingDate}`}
              </Text>
            </View>
          )}

          {/* Bull name for insemination */}
          {eventType === "insemination" && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{isTa ? "காளை / விந்து பெயர் (விருப்பம்)" : "Bull / Semen Name (optional)"}</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name="user" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={bullName}
                  onChangeText={setBullName}
                  placeholder={isTa ? "எ.கா: Gir A2 High" : "e.g. HF-Elite Semen, Gir A2"}
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </>
          )}

          {/* Calving gender */}
          {eventType === "calving" && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{isTa ? "குட்டி பாலினம்" : "Calf Gender"}</Text>
              <View style={styles.genderRow}>
                {(["male", "female", ""] as const).map((g) => (
                  <Pressable
                    key={g}
                    style={[styles.genderChip, { backgroundColor: colors.muted, borderColor: colors.border }, calvingGender === g && { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
                    onPress={() => setCalvingGender(g)}
                  >
                    <Text style={[styles.genderChipText, { color: colors.foreground }, calvingGender === g && { color: colors.primary }]}>
                      {g === "" ? (isTa ? "தெரியவில்லை" : "Unknown") : g === "male" ? (isTa ? "ஆண் கன்று" : "Male Calf") : (isTa ? "பெண் கன்று" : "Female Calf")}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

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
            <Text style={styles.saveBtnText}>{isTa ? "சேமி" : "Save Event"}</Text>
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
  chipRow: { marginBottom: 4 },
  animalChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    borderWidth: 1.5,
  },
  animalChipText: { fontSize: 14, fontWeight: "600" },
  eventGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  eventCard: {
    width: "31%", padding: 10, borderRadius: 12, alignItems: "center",
    borderWidth: 1.5,
  },
  eventLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15 },
  noteInput: { alignItems: "flex-start", paddingVertical: 10, minHeight: 80 },
  infoBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, padding: 10, marginTop: 8,
  },
  infoBannerText: { fontSize: 13, fontWeight: "600" },
  genderRow: { flexDirection: "row", gap: 8 },
  genderChip: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
    borderWidth: 1.5,
  },
  genderChipText: { fontSize: 13, fontWeight: "600" },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 16, paddingVertical: 16, marginTop: 24,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

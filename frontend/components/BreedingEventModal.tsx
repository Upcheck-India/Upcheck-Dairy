import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  Platform, ActivityIndicator, UIManager
} from "react-native";
import { BreedingEventType, getTodayString, getISTDateString } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useAnimals } from "../src/modules/animals/hooks/useAnimals";
import { useBreeding } from "../src/modules/breeding/hooks/useBreeding";
import { scheduleHeatReminder, scheduleCalvingReminder } from "../utils/notifications";

let DateTimePicker: any = null;
try {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
} catch (e) {
  // native module not built in custom client
}

const hasNativeDatePicker =
  DateTimePicker !== null &&
  Platform.OS !== "web" &&
  (UIManager.getViewManagerConfig("RNCDateTimePicker") !== undefined ||
    UIManager.getViewManagerConfig("RNCDatePicker") !== undefined);

interface Props {
  visible: boolean;
  onClose: () => void;
  preselectedAnimalId?: string;
}

const EVENT_TYPES: Array<{
  type: BreedingEventType;
  iconName: keyof typeof Feather.glyphMap;
  labelKey:
    | "breedingEventHeat"
    | "breedingEventInsemination"
    | "breedingEventPregnancyConfirmed"
    | "breedingEventDryOff"
    | "breedingEventCalving"
    | "breedingEventAbort";
}> = [
  { type: "heat", iconName: "thermometer", labelKey: "breedingEventHeat" },
  { type: "insemination", iconName: "activity", labelKey: "breedingEventInsemination" },
  { type: "pregnancy_confirmed", iconName: "heart", labelKey: "breedingEventPregnancyConfirmed" },
  { type: "dry_off", iconName: "slash", labelKey: "breedingEventDryOff" },
  { type: "calving", iconName: "git-commit", labelKey: "breedingEventCalving" },
  { type: "abort", iconName: "alert-triangle", labelKey: "breedingEventAbort" },
];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return getISTDateString(d);
}

export default function BreedingEventModal({ visible, onClose, preselectedAnimalId }: Props) {
  const colors = useColors();
  const { animals } = useAnimals();
  const { createBreeding } = useBreeding();
  const { t, language } = useLanguage();

  const adultAnimals = animals.filter((a) => a.type !== "calf");
  const [selectedAnimalId, setSelectedAnimalId] = useState(preselectedAnimalId ?? adultAnimals[0]?.id ?? "");
  const [eventType, setEventType] = useState<BreedingEventType>("heat");
  const [date, setDate] = useState(getTodayString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bullName, setBullName] = useState("");
  const [calvingGender, setCalvingGender] = useState<"male" | "female" | "">("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const animal = animals.find((a) => a.id === selectedAnimalId);

  const expectedCalvingDate = (eventType === "insemination" || eventType === "pregnancy_confirmed")
    ? addDays(date, animal?.type === "buffalo" ? 310 : 283)
    : undefined;

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(getISTDateString(selectedDate));
    }
  };

  const handleSave = async () => {
    if (!selectedAnimalId) { Alert.alert("Error", "Please select an animal"); return; }
    if (!date) { Alert.alert("Error", "Please enter the date"); return; }

    setSaving(true);
    try {
      await createBreeding({
        animalId: Number(selectedAnimalId),
        eventType,
        date: new Date(date).toISOString(),
        note: note.trim() || undefined,
        bullName: bullName.trim() || undefined,
        expectedCalvingDate: expectedCalvingDate ? new Date(expectedCalvingDate).toISOString() : undefined,
        calvingGender: calvingGender || undefined,
      });

      // Schedule reminders in the background
      const name = animal?.name || "Animal";
      if (eventType === "heat") {
        scheduleHeatReminder(name, new Date(date), language).catch(e => console.warn(e));
      }
      if (expectedCalvingDate) {
        scheduleCalvingReminder(name, new Date(expectedCalvingDate), language).catch(e => console.warn(e));
      }

      resetForm();
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save breeding event");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEventType("heat");
    setDate(getTodayString());
    setBullName("");
    setCalvingGender("");
    setNote("");
    setShowDatePicker(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t.breedingLogTitle}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Animal Selector */}
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{t.breedingSelectAnimal}</Text>
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
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{t.breedingSelectEvent}</Text>
          <View style={styles.eventGrid}>
            {EVENT_TYPES.map((et) => (
              <Pressable
                key={et.type}
                style={[styles.eventCard, { backgroundColor: colors.muted, borderColor: colors.border }, eventType === et.type && { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
                onPress={() => setEventType(et.type)}
              >
                <Feather name={et.iconName} size={20} color={eventType === et.type ? colors.primary : colors.mutedForeground} style={{ marginBottom: 4 }} />
                <Text style={[styles.eventLabel, { color: colors.foreground }, eventType === et.type && { color: colors.primary }]}>
                  {t[et.labelKey]}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Date */}
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{t.breedingDateLabel}</Text>
          {hasNativeDatePicker ? (
            <>
              <Pressable
                style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Feather name="calendar" size={18} color={colors.mutedForeground} />
                <Text style={{ flex: 1, fontSize: 15, color: colors.foreground }}>
                  {date}
                </Text>
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={new Date(date)}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </>
          ) : (
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
              <Feather name="calendar" size={18} color={colors.mutedForeground} />
              <TextInput
                style={{ flex: 1, fontSize: 15, color: colors.foreground, paddingVertical: 8, paddingHorizontal: 4 }}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          )}

          {/* Expected calving date (auto-computed) */}
          {expectedCalvingDate && (
            <View style={[styles.infoBanner, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="calendar" size={14} color={colors.primary} />
              <Text style={[styles.infoBannerText, { color: colors.primary }]}>
                {`${t.breedingExpectedCalvingPrefix} ${expectedCalvingDate}`}
              </Text>
            </View>
          )}

          {/* Bull name for insemination */}
          {eventType === "insemination" && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{t.breedingBullSemenLabel}</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name="user" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={bullName}
                  onChangeText={setBullName}
                  placeholder={t.breedingBullSemenPlaceholder}
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </>
          )}

          {/* Calving gender */}
          {eventType === "calving" && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{t.breedingCalfGender}</Text>
              <View style={styles.genderRow}>
                {(["male", "female", ""] as const).map((g) => (
                  <Pressable
                    key={g}
                    style={[styles.genderChip, { backgroundColor: colors.muted, borderColor: colors.border }, calvingGender === g && { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
                    onPress={() => setCalvingGender(g)}
                  >
                    <Text style={[styles.genderChipText, { color: colors.foreground }, calvingGender === g && { color: colors.primary }]}>
                      {g === "" ? t.breedingGenderUnknown : g === "male" ? t.breedingGenderMale : t.breedingGenderFemale}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* Note */}
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{t.breedingNoteLabel}</Text>
          <TextInput
            style={[styles.inputRow, styles.noteInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
            value={note}
            onChangeText={setNote}
            placeholder={t.breedingNotePlaceholder}
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
          />

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
                <Text style={styles.saveBtnText}>{t.breedingSaveBtn}</Text>
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

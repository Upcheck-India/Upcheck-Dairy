import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BreedingEventType } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import BreedingEventModal from "./BreedingEventModal";
import { useColors } from "@/hooks/useColors";
import { useAnimals } from "../src/modules/animals/hooks/useAnimals";
import { useBreeding } from "../src/modules/breeding/hooks/useBreeding";

type EventConfig = {
  iconName: keyof typeof Feather.glyphMap;
  color: string;
  label: Record<string, string>;
};

const EVENT_CONFIG: Record<any, EventConfig> = {
  heat: {
    iconName: "thermometer", color: "#f59e0b",
    label: { ta: "ஈட்டு", te: "వేడి", kn: "ಉಷ್ಣ", ml: "ചൂട്", hi: "गर्मी", en: "In Heat" },
  },
  insemination: {
    iconName: "activity", color: "#0ea5e9",
    label: { ta: "AI கலப்பு", te: "గర్భధారణ", kn: "ಗರ್ಭಧಾರಣೆ", ml: "ഗർഭധാരണം", hi: "गर्भाधान", en: "Inseminated" },
  },
  pregnancy_confirmed: {
    iconName: "check-circle", color: "#8b5cf6",
    label: { ta: "கர்ப்பம்", te: "గర్భం ధృవీకరణ", kn: "ಗರ್ಭ ದೃಢೀಕರಣ", ml: "ഗർഭം സ്ഥിരീകരണം", hi: "गर्भ पुष्टि", en: "Pregnant" },
  },
  dry_off: {
    iconName: "slash", color: "#64748b",
    label: { ta: "கறவை நிறுத்தல்", te: "పాలు ఆపడం", kn: "ಹಾಲು ನಿಲ್ಲಿಸಲು", ml: "പാൽ നിർത്തൽ", hi: "दूध बंद", en: "Dry Off" },
  },
  calving: {
    iconName: "heart", color: "#10b981",
    label: { ta: "குட்டி போட்டது", te: "లేగ దూడ పుట்ட்டிంది", kn: "ಕರು ಹಾಕಿದೆ", ml: "കിടാവ് ജനിച്ചു", hi: "बच्चा हुआ", en: "Calved" },
  },
  abort: {
    iconName: "alert-triangle", color: "#ef4444",
    label: { ta: "கருச்சிதைவு", te: "గర్భస్రావం", kn: "ಗರ್ಭಪಾತ", ml: "ഗർഭഛിദ്രം", hi: "गर्भपात", en: "Abortion" },
  },
};

const CALVING_GENDER: Record<string, Record<string, string>> = {
  male: { ta: "ஆண் கன்று", te: "మగ దూడ", kn: "ಗಂಡು ಕರು", ml: "ആൺ കിടാവ്", hi: "नर बछड़ा", en: "Male calf" },
  female: { ta: "பெண் கன்று", te: "ఆడ దూడ", kn: "ಹೆಣ್ಣು ಕರು", ml: "പെൺ കിടാവ്", hi: "मादा बछड़ा", en: "Female calf" },
};

function daysSince(dateStr: any): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(dateStr: any): number {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function BreedingSection() {
  const colors = useColors();
  const { animals } = useAnimals();
  const { breedingEvents } = useBreeding();
  const { language, t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | undefined>();

  const adultAnimals = animals.filter((a) => a.type !== "calf");

  const handleAddForAnimal = (animalId: string) => {
    setSelectedAnimalId(animalId);
    setModalVisible(true);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{t.breedingMgmt}</Text>
        <Pressable style={styles.addBtn} onPress={() => { setSelectedAnimalId(undefined); setModalVisible(true); }}>
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>{t.logEvent}</Text>
        </Pressable>
      </View>

      {adultAnimals.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="heart" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t.addAnimalsFirst}</Text>
        </View>
      ) : (
        adultAnimals.map((animal) => {
          const events = breedingEvents
            .filter((e) => e.animalId === animal.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          return (
            <View key={animal.id} style={styles.animalCard}>
              <View style={styles.animalCardHeader}>
                <View style={styles.animalInfo}>
                  <MaterialCommunityIcons 
                    name={animal.type === "buffalo" ? "water" : "cow"} 
                    size={28} 
                    color={colors.primary} 
                  />
                  <View>
                    <Text style={[styles.animalName, { color: colors.foreground }]}>{animal.name}</Text>
                    <Text style={[styles.animalBreed, { color: colors.mutedForeground }]}>{animal.breed}</Text>
                  </View>
                </View>
                <View style={styles.animalRightSection}>
                  {animal.isPregnant && (
                    <View style={styles.pregnantBadge}>
                      <Text style={styles.pregnantText}>🤰 {t.pregnantLabel}</Text>
                    </View>
                  )}
                  {animal.lactationNumber != null && (
                    <Text style={styles.lactationText}>L{animal.lactationNumber}</Text>
                  )}
                  <Pressable style={styles.addEventBtn} onPress={() => handleAddForAnimal(animal.id)}>
                    <Feather name="plus" size={14} color="#16a34a" />
                  </Pressable>
                </View>
              </View>

              {animal.expectedCalvingDate && (
                <View style={styles.calvingAlert}>
                  <Text style={styles.calvingAlertText}>
                    🐣 {t.calvingExpected} {new Date(animal.expectedCalvingDate).toLocaleDateString(language === "ta" ? "ta-IN" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {daysUntil(animal.expectedCalvingDate) >= 0
                      ? ` (${daysUntil(animal.expectedCalvingDate)} ${t.daysLabel})`
                      : ` (${t.overdueLabel})`}
                  </Text>
                </View>
              )}

              {events.length === 0 ? (
                <Text style={styles.noEventsText}>{t.noEvents}</Text>
              ) : (
                <View style={styles.timeline}>
                  {events.slice(0, 4).map((event, i) => {
                    const cfg = EVENT_CONFIG[event.eventType];
                    return (
                      <View key={event.id} style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: cfg.color }]}>
                          <Feather name={cfg.iconName} size={14} color="#fff" />
                        </View>
                        {i < events.slice(0, 4).length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                        <View style={styles.timelineContent}>
                          <Text style={[styles.timelineEventName, { color: colors.foreground }]}>{cfg.label[language] ?? cfg.label.en}</Text>
                          <Text style={[styles.timelineDate, { color: colors.mutedForeground }]}>{new Date(event.date).toLocaleDateString(language === "ta" ? "ta-IN" : "en-US", { month: "short", day: "numeric" })} · {daysSince(event.date)}{t.daysAgoSuffix}</Text>
                          {event.bullName && <Text style={[styles.timelineNote, { color: colors.secondaryForeground }]}>Bull: {event.bullName}</Text>}
                          {event.calvingGender && (
                            <Text style={[styles.timelineNote, { color: colors.secondaryForeground }]}>
                              Gender: {CALVING_GENDER[event.calvingGender]?.[language] ?? CALVING_GENDER[event.calvingGender]?.en}
                            </Text>
                          )}
                          {event.note && <Text style={[styles.timelineNote, { color: colors.secondaryForeground }]}><Feather name="file-text" size={10} /> {event.note}</Text>}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })
      )}

      <BreedingEventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        preselectedAnimalId={selectedAnimalId}
      />

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#1a2e05" },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#16a34a", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, textAlign: "center" },
  animalCard: {
    backgroundColor: "transparent", borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
  },
  animalCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  animalInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  animalName: { fontSize: 16, fontWeight: "700" },
  animalBreed: { fontSize: 12 },
  animalRightSection: { flexDirection: "row", alignItems: "center", gap: 8 },
  pregnantBadge: { backgroundColor: "#ede9fe", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  pregnantText: { fontSize: 11, color: "#7c3aed", fontWeight: "600" },
  lactationText: { fontSize: 12, color: "#0284c7", fontWeight: "700" },
  addEventBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center",
  },
  calvingAlert: {
    backgroundColor: "#fef3c7", borderRadius: 10, padding: 8, marginBottom: 8,
  },
  calvingAlertText: { fontSize: 13, color: "#92400e", fontWeight: "600" },
  noEventsText: { fontSize: 13, color: "#9ca3af", fontStyle: "italic", padding: 4 },
  timeline: { gap: 2 },
  timelineItem: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  timelineDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  timelineDotEmoji: { fontSize: 13 },
  timelineLine: { position: "absolute", left: 13, top: 28, width: 2, height: 8, backgroundColor: "#e5e7eb" },
  timelineContent: { flex: 1, paddingBottom: 8 },
  timelineEventName: { fontSize: 13, fontWeight: "700", color: "#1a2e05" },
  timelineDate: { fontSize: 11, color: "#9ca3af" },
  timelineNote: { fontSize: 12, color: "#4b5563", marginTop: 2 },
});

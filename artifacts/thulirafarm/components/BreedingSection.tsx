import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp, BreedingEventType } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import BreedingEventModal from "./BreedingEventModal";

type EventConfig = {
  emoji: string;
  color: string;
  label: Record<string, string>;
};

const EVENT_CONFIG: Record<BreedingEventType, EventConfig> = {
  heat: {
    emoji: "🌡️", color: "#f97316",
    label: { ta: "ஈட்டு", te: "వేడి", kn: "ಉಷ್ಣ", ml: "ചൂട്", hi: "गर्मी", en: "In Heat" },
  },
  insemination: {
    emoji: "💉", color: "#0284c7",
    label: { ta: "AI கலப்பு", te: "గర్భధారణ", kn: "ಗರ್ಭಧಾರಣೆ", ml: "ഗർഭധാരണം", hi: "गर्भाधान", en: "Inseminated" },
  },
  pregnancy_confirmed: {
    emoji: "🤰", color: "#7c3aed",
    label: { ta: "கர்ப்பம்", te: "గర్భం ధృవీకరణ", kn: "ಗರ್ಭ ದೃಢೀಕರಣ", ml: "ഗർഭം സ്ഥിരീകരണം", hi: "गर्भ पुष्टि", en: "Pregnant" },
  },
  dry_off: {
    emoji: "🛑", color: "#9ca3af",
    label: { ta: "கறவை நிறுத்தல்", te: "పాలు ఆపడం", kn: "ಹಾಲು ನಿಲ್ಲಿಸಲು", ml: "പാൽ നിർത്തൽ", hi: "दूध बंद", en: "Dry Off" },
  },
  calving: {
    emoji: "🐄", color: "#16a34a",
    label: { ta: "குட்டி போட்டது", te: "లేగ దూడ పుట்టింది", kn: "ಕರು ಹಾಕಿದೆ", ml: "കിടാവ് ജനിച்ചു", hi: "बच्चा हुआ", en: "Calved" },
  },
  abort: {
    emoji: "⚠️", color: "#dc2626",
    label: { ta: "கருச்சிதைவு", te: "గర్భస్రావం", kn: "ಗರ್ಭಪಾತ", ml: "ഗർഭഛിദ്രം", hi: "गर्भपात", en: "Abortion" },
  },
};

const CALVING_GENDER: Record<string, Record<string, string>> = {
  male: { ta: "ஆண் கன்று", te: "మగ దూడ", kn: "ಗಂಡು ಕರು", ml: "ആൺ കിടാവ്", hi: "नर बछड़ा", en: "Male calf" },
  female: { ta: "பெண் கன்று", te: "ఆడ దూడ", kn: "ಹೆಣ್ಣು ಕರು", ml: "പെൺ കിടാവ്", hi: "मादा बछड़ा", en: "Female calf" },
};

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(dateStr: string): number {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function BreedingSection() {
  const { animals, breedingEvents } = useApp();
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
          <Text style={styles.emptyEmoji}>💕</Text>
          <Text style={styles.emptyText}>{t.addAnimalsFirst}</Text>
        </View>
      ) : (
        adultAnimals.map((animal) => {
          const events = breedingEvents
            .filter((e) => e.animalId === animal.id)
            .sort((a, b) => b.date.localeCompare(a.date));

          return (
            <View key={animal.id} style={styles.animalCard}>
              <View style={styles.animalCardHeader}>
                <View style={styles.animalInfo}>
                  <Text style={styles.animalEmoji}>{animal.type === "buffalo" ? "🐃" : "🐄"}</Text>
                  <View>
                    <Text style={styles.animalName}>{animal.name}</Text>
                    <Text style={styles.animalBreed}>{animal.breed}</Text>
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
                    🐣 {t.calvingExpected} {animal.expectedCalvingDate}
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
                          <Text style={styles.timelineDotEmoji}>{cfg.emoji}</Text>
                        </View>
                        {i < events.slice(0, 4).length - 1 && <View style={styles.timelineLine} />}
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineEventName}>{cfg.label[language] ?? cfg.label.en}</Text>
                          <Text style={styles.timelineDate}>{event.date} · {daysSince(event.date)}{t.daysAgoSuffix}</Text>
                          {event.bullName && <Text style={styles.timelineNote}>🐂 {event.bullName}</Text>}
                          {event.calvingGender && (
                            <Text style={styles.timelineNote}>
                              👶 {CALVING_GENDER[event.calvingGender]?.[language] ?? CALVING_GENDER[event.calvingGender]?.en}
                            </Text>
                          )}
                          {event.note && <Text style={styles.timelineNote}>📝 {event.note}</Text>}
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
  container: { flex: 1, backgroundColor: "#fefce8", padding: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#1a2e05" },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#16a34a", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, color: "#9ca3af", textAlign: "center" },
  animalCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  animalCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  animalInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  animalEmoji: { fontSize: 28 },
  animalName: { fontSize: 16, fontWeight: "700", color: "#1a2e05" },
  animalBreed: { fontSize: 12, color: "#6b7280" },
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

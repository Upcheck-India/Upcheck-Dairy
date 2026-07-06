import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLanguage } from "@/context/LanguageContext";
import { getTodayString } from "@/context/AppContext";
import VaccinationModal from "./VaccinationModal";
import { useColors } from "@/hooks/useColors";
import { useAnimals } from "../src/modules/animals/hooks/useAnimals";
import { useVaccination } from "../src/modules/vaccination/hooks/useVaccination";

function daysUntil(date: Date | string): number {
  return Math.floor((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function VaccinationSection() {
  const colors = useColors();
  const { animals } = useAnimals();
  const { vaccinations, markDone, removeVaccination } = useVaccination();
  const { t, language } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [preselectedId, setPreselectedId] = useState<string | undefined>();

  const upcoming = vaccinations
    .filter((v) => !v.administeredDate)
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  const recent = vaccinations
    .filter((v) => !!v.administeredDate)
    .sort((a, b) => new Date(b.administeredDate!).getTime() - new Date(a.administeredDate!).getTime())
    .slice(0, 10);

  const handleMarkDone = (id: string) => {
    Alert.alert(
      t.vaccineMarkTitle,
      t.vaccineMarkBody,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.yes,
          onPress: () => {
            const today = getTodayString();
            markDone(Number(id), today).catch(err => {
              console.error("[VaccinationSection] Failed to mark vaccine done:", err);
            });
          },
        },
      ]
    );
  };

  const handleDeleteVax = (id: string) => {
    Alert.alert(
      language === "ta" ? "தடுப்பூசி பதிவை நீக்கு" : "Delete Vaccination",
      language === "ta" ? "இந்த தடுப்பூசி பதிவை நீக்க விரும்புகிறீர்களா?" : "Are you sure you want to delete this vaccination record?",
      [
        { text: t.cancel, style: "cancel" },
        {
          text: language === "ta" ? "நீக்கு" : "Delete",
          style: "destructive",
          onPress: () => {
            removeVaccination(Number(id)).catch(err => {
              console.error("[VaccinationSection] Failed to delete vaccination:", err);
            });
          },
        },
      ]
    );
  };

  const getStatusColor = (scheduledDate: Date | string) => {
    const days = daysUntil(scheduledDate);
    if (days < 0) return "#dc2626";
    if (days <= 3) return "#f97316";
    if (days <= 7) return "#eab308";
    return "#16a34a";
  };

  const getStatusLabel = (scheduledDate: Date | string) => {
    const days = daysUntil(scheduledDate);
    if (days < 0) return `${-days} ${t.daysLabel} ${t.overdueLabel}`;
    if (days === 0) return t.today + "!";
    return `${days} ${t.daysLabel}`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{t.vaccinationSchedule}</Text>
        <Pressable style={styles.addBtn} onPress={() => { setPreselectedId(undefined); setModalVisible(true); }}>
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>{t.addAnimal}</Text>
        </Pressable>
      </View>

      <Text style={styles.subHeading}>{t.upcomingOverdue}</Text>
      {upcoming.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t.noUpcomingVaccines}</Text>
          <Pressable style={styles.scheduleBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.scheduleBtnText}>{t.scheduleVaccineBtn}</Text>
          </Pressable>
        </View>
      ) : (
        upcoming.map((vax) => {
          const animal = animals.find((a) => a.id === vax.animalId);
          if (!animal) return null;
          const color = getStatusColor(vax.scheduledDate);
          return (
            <View key={vax.id} style={[styles.vaxCard, { borderLeftColor: color }]}>
              <View style={styles.vaxRow}>
                <View style={styles.vaxLeft}>
                  <View style={[styles.statusDot, { backgroundColor: color }]} />
                  <View>
                    <Text style={styles.vaxAnimalName}>{animal.name}</Text>
                    <Text style={styles.vaxName}>{vax.vaccineName}</Text>
                    <Text style={styles.vaxDate}>{t.scheduledDateLabel} {new Date(vax.scheduledDate).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={styles.vaxRight}>
                  <Text style={[styles.statusLabel, { color }]}>{getStatusLabel(vax.scheduledDate)}</Text>
                  <View style={styles.vaxActions}>
                    <Pressable style={styles.doneBtn} onPress={() => handleMarkDone(vax.id)}>
                      <Feather name="check" size={14} color="#16a34a" />
                      <Text style={styles.doneBtnText}>{t.markDoneBtn}</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDeleteVax(vax.id)} style={styles.deleteBtn}>
                      <Feather name="trash-2" size={14} color="#dc2626" />
                    </Pressable>
                  </View>
                </View>
              </View>
              {vax.nextDueDate && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                  <Feather name="refresh-cw" size={10} color={colors.accent} />
                  <Text style={[styles.nextDue, { color: colors.accent }]}>{t.nextDueLabel} {new Date(vax.nextDueDate).toLocaleDateString()}</Text>
                </View>
              )}
            </View>
          );
        })
      )}

      {recent.length > 0 && (
        <>
          <Text style={[styles.subHeading, { marginTop: 20 }]}>{t.recentlyAdministered}</Text>
          {recent.map((vax) => {
            const animal = animals.find((a) => a.id === vax.animalId);
            if (!animal) return null;
            return (
              <View key={vax.id} style={[styles.vaxCard, styles.vaxCardDone, { borderLeftColor: "#16a34a" }]}>
                <View style={styles.vaxRow}>
                  <View style={styles.vaxLeft}>
                    <Feather name="check-circle" size={18} color="#16a34a" />
                    <View>
                      <Text style={styles.vaxAnimalName}>{animal.name}</Text>
                      <Text style={styles.vaxName}>{vax.vaccineName}</Text>
                      <Text style={styles.vaxDate}>{t.givenDateLabel} {new Date(vax.administeredDate!).toLocaleDateString()}</Text>
                      {vax.nextDueDate && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                          <Feather name="refresh-cw" size={10} color={colors.accent} />
                          <Text style={[styles.nextDue, { color: colors.accent, marginTop: 0 }]}>{t.nextDueLabel} {new Date(vax.nextDueDate).toLocaleDateString()}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {vax.cost != null && <Text style={styles.costBadge}>₹{vax.cost}</Text>}
                </View>
              </View>
            );
          })}
        </>
      )}

      <VaccinationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        preselectedAnimalId={preselectedId}
      />
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#1a2e05" },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#0284c7", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  subHeading: { fontSize: 13, fontWeight: "700", color: "#4b5563", marginBottom: 10 },
  emptyCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 20,
    alignItems: "center", gap: 12, marginBottom: 12,
  },
  emptyText: { fontSize: 14, color: "#9ca3af" },
  scheduleBtn: { backgroundColor: "#dbeafe", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  scheduleBtnText: { color: "#0284c7", fontWeight: "700", fontSize: 13 },
  vaxCard: {
    backgroundColor: "transparent", borderRadius: 14, padding: 12, marginBottom: 8,
    borderLeftWidth: 4, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
  },
  vaxCardDone: { opacity: 0.85 },
  vaxRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  vaxLeft: { flexDirection: "row", gap: 10, alignItems: "flex-start", flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  vaxAnimalName: { fontSize: 15, fontWeight: "700", color: "#1a2e05" },
  vaxName: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  vaxDate: { fontSize: 12, color: "#9ca3af" },
  vaxRight: { alignItems: "flex-end", gap: 6 },
  statusLabel: { fontSize: 12, fontWeight: "700" },
  vaxActions: { flexDirection: "row", gap: 6 },
  doneBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#dcfce7", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
  },
  doneBtnText: { fontSize: 12, color: "#16a34a", fontWeight: "600" },
  deleteBtn: { padding: 5 },
  nextDue: { fontSize: 11, marginTop: 4, fontStyle: "italic" },
  costBadge: { fontSize: 13, fontWeight: "700", color: "#16a34a" },
});

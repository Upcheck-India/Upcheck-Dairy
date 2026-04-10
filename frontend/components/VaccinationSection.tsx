import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import VaccinationModal from "./VaccinationModal";

function daysUntil(dateStr: string): number {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function VaccinationSection() {
  const { animals, vaccinations, markVaccinationDone, deleteVaccination } = useApp();
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [preselectedId, setPreselectedId] = useState<string | undefined>();

  const upcoming = vaccinations
    .filter((v) => !v.administeredDate)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const recent = vaccinations
    .filter((v) => !!v.administeredDate)
    .sort((a, b) => (b.administeredDate ?? "").localeCompare(a.administeredDate ?? ""))
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
            const today = new Date().toISOString().split("T")[0]!;
            markVaccinationDone(id, today);
          },
        },
      ]
    );
  };

  const getStatusColor = (scheduledDate: string) => {
    const days = daysUntil(scheduledDate);
    if (days < 0) return "#dc2626";
    if (days <= 3) return "#f97316";
    if (days <= 7) return "#eab308";
    return "#16a34a";
  };

  const getStatusLabel = (scheduledDate: string) => {
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
                    <Text style={styles.vaxDate}>{t.scheduledDateLabel} {vax.scheduledDate}</Text>
                  </View>
                </View>
                <View style={styles.vaxRight}>
                  <Text style={[styles.statusLabel, { color }]}>{getStatusLabel(vax.scheduledDate)}</Text>
                  <View style={styles.vaxActions}>
                    <Pressable style={styles.doneBtn} onPress={() => handleMarkDone(vax.id)}>
                      <Feather name="check" size={14} color="#16a34a" />
                      <Text style={styles.doneBtnText}>{t.markDoneBtn}</Text>
                    </Pressable>
                    <Pressable onPress={() => deleteVaccination(vax.id)} style={styles.deleteBtn}>
                      <Feather name="trash-2" size={14} color="#dc2626" />
                    </Pressable>
                  </View>
                </View>
              </View>
              {vax.nextDueDate && (
                <Text style={styles.nextDue}>🔁 {t.nextDueLabel} {vax.nextDueDate}</Text>
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
                      <Text style={styles.vaxDate}>{t.givenDateLabel} {vax.administeredDate}</Text>
                      {vax.nextDueDate && <Text style={styles.nextDue}>🔁 {t.nextDueLabel} {vax.nextDueDate}</Text>}
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
  container: { flex: 1, backgroundColor: "#fefce8", padding: 16 },
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
    backgroundColor: "#fff", borderRadius: 14, padding: 12, marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
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
  nextDue: { fontSize: 11, color: "#0284c7", marginTop: 4, fontStyle: "italic" },
  costBadge: { fontSize: 13, fontWeight: "700", color: "#16a34a" },
});

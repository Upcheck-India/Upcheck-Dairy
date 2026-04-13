import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import MilkLogModal from "@/components/MilkLogModal";
import { generateId, getTodayString, HealthStatus, useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

const LOCALE_MAP: Record<string, string> = {
  ta: "ta-IN", te: "te-IN", kn: "kn-IN", ml: "ml-IN", hi: "hi-IN", en: "en-IN",
};

export default function AnimalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { animals, milkEntries, healthEvents, updateAnimal, deleteAnimal, addHealthEvent } = useApp();
  const { t, language } = useLanguage();
  const [milkLogVisible, setMilkLogVisible] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const animal = animals.find((a) => a.id === id);
  const animalMilk = milkEntries.filter((e) => e.animalId === id);
  const animalHealth = healthEvents.filter((e) => e.animalId === id);

  const HEALTH_OPTIONS: { status: HealthStatus; label: string; color: string }[] = [
    { status: "healthy", label: t.healthy, color: "#16a34a" },
    { status: "attention", label: t.attention, color: "#f97316" },
    { status: "critical", label: t.critical, color: "#ef4444" },
  ];

  const last7Milk = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });
    return dates.map((date) => ({
      date,
      total: animalMilk
        .filter((e) => e.date === date)
        .reduce((s, e) => s + e.quantity, 0),
    }));
  }, [animalMilk]);

  const maxMilk = Math.max(...last7Milk.map((d) => d.total), 1);

  if (!animal) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>
          {t.animalDetailNotFound}
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>{t.animalDetailGoBack}</Text>
        </Pressable>
      </View>
    );
  }

  const emoji = animal.type === "buffalo" ? "🐃" : animal.type === "calf" ? "🐮" : "🐄";

  const handleDeleteAnimal = () => {
    Alert.alert(t.animalDetailDeleteTitle, t.animalDetailDeleteBody.replace("{name}", animal.name), [
      { text: t.animalDetailDeleteCancel, style: "cancel" },
      {
        text: t.animalDetailDeleteConfirm,
        style: "destructive",
        onPress: () => {
          deleteAnimal(animal.id);
          router.back();
        },
      },
    ]);
  };

  const setHealthStatus = (status: HealthStatus) => {
    Haptics.selectionAsync();
    updateAnimal({ ...animal, healthStatus: status });
  };

  const handleCamera = () => {
    Alert.alert(t.animalDetailPhotoTitle, t.animalDetailPhotoBody, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.animalDetailCamera,
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(t.animalDetailPermissionNeeded, t.animalDetailCameraPermission);
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            updateAnimal({ ...animal, photoUri: result.assets[0].uri });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
      {
        text: t.animalDetailGallery,
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(t.animalDetailPermissionNeeded, t.animalDetailGalleryPermission);
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            updateAnimal({ ...animal, photoUri: result.assets[0].uri });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
    ]);
  };

  const addHealthNote = () => {
    const options = [
      t.healthEventFever,
      t.healthEventNotEating,
      t.healthEventLimping,
      t.healthEventDiarrhea,
      t.healthEventCoughing,
      t.healthEventVetVisit,
      t.healthEventVaccination,
    ];
    Alert.alert(
      t.animalDetailAddHealthNote,
      t.animalDetailSelectSymptom,
      [
        ...options.map((opt) => ({
          text: opt,
          onPress: () => {
            addHealthEvent({
              id: generateId(),
              animalId: animal.id,
              date: getTodayString(),
              type: "observation",
              description: opt,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        })),
        { text: t.cancel, style: "cancel" },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {animal.name}
        </Text>
        <Pressable onPress={handleDeleteAnimal} style={styles.deleteBtn}>
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 120 : 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Pressable style={styles.photoContainer} onPress={handleCamera}>
            {animal.photoUri ? (
              <>
                <Image source={{ uri: animal.photoUri }} style={styles.photo} />
                <View style={[styles.cameraOverlay, { backgroundColor: "rgba(0,0,0,0.4)" }]}>
                  <Feather name="camera" size={18} color="#fff" />
                </View>
              </>
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.muted }]}>
                <Text style={styles.profileEmoji}>{emoji}</Text>
                <View style={[styles.cameraBtn, { backgroundColor: colors.primary }]}>
                  <Feather name="camera" size={14} color="#fff" />
                </View>
              </View>
            )}
          </Pressable>

          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{animal.name}</Text>
            <Text style={[styles.profileBreed, { color: colors.mutedForeground }]}>{animal.breed}</Text>
            <Text style={[styles.profileTag, { color: colors.mutedForeground }]}>
              {t.animalDetailTagPrefix}{animal.tagNumber}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
                {animal.type === "cow" ? t.typeCow : animal.type === "buffalo" ? t.typeBuffalo : t.typeCalf}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.animalDetailHealth}</Text>
        <View style={styles.healthRow}>
          {HEALTH_OPTIONS.map((h) => (
            <Pressable
              key={h.status}
              style={[
                styles.healthBtn,
                {
                  backgroundColor: animal.healthStatus === h.status ? h.color : h.color + "18",
                  borderColor: h.color + "40",
                },
              ]}
              onPress={() => setHealthStatus(h.status)}
            >
              {animal.healthStatus === h.status && (
                <Feather name="check" size={12} color="#fff" />
              )}
              <Text
                style={[
                  styles.healthBtnText,
                  { color: animal.healthStatus === h.status ? "#fff" : h.color },
                ]}
              >
                {h.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMilkLogVisible(true);
            }}
          >
            <Feather name="droplet" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>{t.animalDetailMilkLog}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.warning }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              addHealthNote();
            }}
          >
            <Feather name="heart" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>{t.animalDetailHealthNote}</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {t.animalDetailMilkHistory}
        </Text>
        <View
          style={[
            styles.chartCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.chartRow}>
            {last7Milk.map((d, i) => {
              const heightPct = maxMilk > 0 ? d.total / maxMilk : 0;
              const dayName = new Date(d.date).toLocaleDateString(LOCALE_MAP[language] ?? "en-IN", {
                weekday: "short",
              });
              return (
                <View key={i} style={styles.barWrapper}>
                  <Text style={[styles.barValue, { color: colors.mutedForeground }]}>
                    {d.total > 0 ? d.total.toFixed(1) : ""}
                  </Text>
                  <View style={[styles.barBg, { backgroundColor: colors.muted }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: heightPct > 0 ? colors.primary : colors.border,
                          height: `${Math.max(heightPct * 100, 2)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>
                    {dayName}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {t.animalDetailHealthHistory}
        </Text>
        {animalHealth.length === 0 ? (
          <Text style={[styles.noData, { color: colors.mutedForeground }]}>
            {t.animalDetailNoNotes}
          </Text>
        ) : (
          animalHealth.slice(0, 10).map((e) => {
            const typeIcon =
              e.type === "vaccination"
                ? "shield"
                : e.type === "treatment"
                ? "activity"
                : "file-text";
            return (
              <View
                key={e.id}
                style={[
                  styles.healthEntry,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.healthEntryIcon, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name={typeIcon as any} size={14} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.healthEntryDesc, { color: colors.foreground }]}>
                    {e.description}
                  </Text>
                  <Text style={[styles.healthEntryDate, { color: colors.mutedForeground }]}>
                    {e.date}
                    {e.veterinarianName ? ` • Dr. ${e.veterinarianName}` : ""}
                  </Text>
                </View>
                {e.cost && (
                  <Text style={[styles.healthEntryCost, { color: colors.accent }]}>
                    ₹{e.cost}
                  </Text>
                )}
              </View>
            );
          })
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {t.animalDetailRecentMilk}
        </Text>
        {animalMilk.length === 0 ? (
          <Text style={[styles.noData, { color: colors.mutedForeground }]}>
            {t.animalDetailNoMilk}
          </Text>
        ) : (
          animalMilk.slice(0, 10).map((e) => (
            <View
              key={e.id}
              style={[
                styles.milkEntry,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather
                name={e.session === "morning" ? "sun" : "moon"}
                size={16}
                color={e.session === "morning" ? colors.accent : colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.milkEntryDate, { color: colors.mutedForeground }]}>
                  {e.date} — {e.session === "morning" ? t.morning : t.evening}
                </Text>
                {e.fat && (
                  <Text style={[styles.milkEntryFat, { color: colors.mutedForeground }]}>
                    {t.fatPercentage}: {e.fat}%
                  </Text>
                )}
              </View>
              <Text style={[styles.milkEntryQty, { color: colors.foreground }]}>
                {e.quantity.toFixed(1)}L
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <MilkLogModal
        visible={milkLogVisible}
        animal={animal}
        onClose={() => setMilkLogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700" },
  deleteBtn: { padding: 4 },
  scroll: { padding: 16, gap: 12 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  photoContainer: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  profileEmoji: { fontSize: 36 },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: { fontSize: 20, fontWeight: "700" },
  profileBreed: { fontSize: 13 },
  profileTag: { fontSize: 12 },
  typeBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  typeBadgeText: { fontSize: 11, fontWeight: "600" },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginTop: 8 },
  healthRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  healthBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 56,
  },
  healthBtnText: { fontSize: 13, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 56,
  },
  actionBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  chartCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  chartRow: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 100 },
  barWrapper: { flex: 1, alignItems: "center", gap: 4, height: "100%" },
  barValue: { fontSize: 9, height: 14 },
  barBg: { flex: 1, width: "80%", borderRadius: 4, overflow: "hidden", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 4 },
  barLabel: { fontSize: 9 },
  healthEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  healthEntryIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  healthEntryDesc: { fontSize: 13, fontWeight: "500" },
  healthEntryDate: { fontSize: 11, marginTop: 2 },
  healthEntryCost: { fontSize: 13, fontWeight: "700" },
  milkEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  milkEntryDate: { fontSize: 13 },
  milkEntryFat: { fontSize: 11, marginTop: 2 },
  milkEntryQty: { fontSize: 16, fontWeight: "700" },
  noData: { fontSize: 14, textAlign: "center", paddingVertical: 16 },
  notFound: { fontSize: 18, marginBottom: 12 },
  back: { fontSize: 16, fontWeight: "600" },
});

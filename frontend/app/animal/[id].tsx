import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import MilkLogModal from "@/components/MilkLogModal";
import HealthNoteModal from "@/components/HealthNoteModal";
import { generateId, getTodayString, HealthStatus, getISTDateString } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useAnimals } from "../../src/modules/animals/hooks/useAnimals";
import { useHealth } from "../../src/modules/health/hooks/useHealth";
import { useMilk } from "../../src/modules/milk/hooks/useMilk";
import { useCategories, DEFAULT_CATEGORIES } from "../../src/modules/herd/context/CategoryProvider";
import { MilkEntry } from "../../src/modules/milk/models/MilkEntry";
import { useFarmer } from "@/context/FarmerContext";
import Svg, { Circle, G } from "react-native-svg";

const LOCALE_MAP: Record<string, string> = {
  ta: "ta-IN", te: "te-IN", kn: "kn-IN", ml: "ml-IN", hi: "hi-IN", en: "en-IN",
};

const GROUP_NAMES: Record<string, { en: string; ta: string }> = {
  lactating: { en: "Lactating Cows", ta: "பால் கறப்பவை" },
  pregnant: { en: "Pregnant Cows", ta: "சினை மாடுகள்" },
  dry: { en: "Dry Cows", ta: "வறண்ட மாடுகள்" },
  calf: { en: "Calves", ta: "கன்றுகள்" },
  other: { en: "Others", ta: "மற்றவை" },
};

const GROUP_STYLE_MAP: Record<string, { icon: string; color: string; bg: string }> = {
  lactating: { icon: "cow", color: "#16a34a", bg: "#eafaf1" },
  pregnant: { icon: "heart", color: "#ef4444", bg: "#fef2f2" },
  dry: { icon: "weather-sunny", color: "#f59e0b", bg: "#fff7ed" },
  calf: { icon: "baby-carriage", color: "#0ea5e9", bg: "#e0f2fe" },
  other: { icon: "cow", color: "#64748b", bg: "#f1f5f9" },
};

const LOCALIZED_STRINGS: Record<string, Record<string, string>> = {
  en: {
    overview: "Overview",
    feed: "Feed",
    health: "Health",
    breeding: "Breeding",
    history: "History",
    milkLogs: "Milk logs",
    todaysFeed: "Today's Feed",
    planVsActual: "Plan vs Actual",
    milkProductionDaily: "Milk Production (Daily)",
    avgThisWeek: "Avg this week",
    feedType: "Feed Type",
    planned: "Planned",
    given: "Given",
    balance: "Balance",
    greenFodder: "Green Fodder",
    concentrate: "Concentrate",
    herdGroup: "Herd Group",
    milkingCows: "Milking Cows",
    animalsCount: "Animals",
    change: "Change",
    recentActivity: "Recent Activity",
    viewAll: "View All",
    milkRecorded: "Milk Recorded",
    morningFeed: "Morning Feed",
    eveningFeed: "Evening Feed",
    deworming: "Deworming",
    vaccination: "Vaccination",
    age: "Age",
    breed: "Breed",
    weight: "Weight",
    lactation: "Lactation",
    daysInMilk: "Days In Milk",
    milkToday: "Milk Today",
    id: "ID",
  },
  ta: {
    overview: "மேலோட்டம்",
    feed: "தீவனம்",
    health: "ஆரோக்கியம்",
    breeding: "இனப்பெருக்கம்",
    history: "வரலாறு",
    milkLogs: "பால் பதிவுகள்",
    todaysFeed: "இன்றைய தீவனம்",
    planVsActual: "திட்டம் vs உண்மை",
    milkProductionDaily: "பால் உற்பத்தி (தினசரி)",
    avgThisWeek: "இந்த வார சராசரி",
    feedType: "தீவன வகை",
    planned: "திட்டமிடப்பட்டது",
    given: "வழங்கப்பட்டது",
    balance: "மீதி",
    greenFodder: "பசுந்தீவனம்",
    concentrate: "அடர்தீவனம்",
    herdGroup: "மந்தைக் குழு",
    milkingCows: "கறவை மாடுகள்",
    animalsCount: "மாடுகள்",
    change: "மாற்று",
    recentActivity: "சமீபத்திய செயல்பாடு",
    viewAll: "அனைத்தும் காண்",
    milkRecorded: "பதிவு செய்யப்பட்ட பால்",
    morningFeed: "காலை தீவனம்",
    eveningFeed: "மாலை தீவனம்",
    deworming: "புழுநீக்கம்",
    vaccination: "தடுப்பூசி",
    age: "வயது",
    breed: "இனம்",
    weight: "எடை",
    lactation: "ஈத்து முறை",
    daysInMilk: "கறவை நாட்கள்",
    milkToday: "இன்றைய பால்",
    id: "அடையாளம்",
  }
};

export default function AnimalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { animals, updateAnimal, removeAnimal } = useAnimals();
  const { categories } = useCategories();
  const { accessToken } = useFarmer();
  const { healthEvents, createEvent } = useHealth();
  const { milkEntries: rawMilkEntries, removeMilk } = useMilk();
  const { t, language } = useLanguage();
  const [milkLogVisible, setMilkLogVisible] = useState(false);
  const [healthNoteVisible, setHealthNoteVisible] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<MilkEntry | null>(null);

  // Tabs and segment states
  const [activeTab, setActiveTab] = useState<"Overview" | "Feed" | "Health" | "Breeding" | "History" | "Milk logs">("Overview");
  const [feedPeriod, setFeedPeriod] = useState<"Morning" | "Evening" | "Total" | "Cost">("Morning");
  const [groupModalVisible, setGroupModalVisible] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const animal = animals.find((a) => a.id === id);
  const animalMilk = rawMilkEntries.filter((e) => e.animalId === id);
  const animalHealth = healthEvents.filter((e) => e.animalId === id);

  const HEALTH_OPTIONS: { status: HealthStatus; label: string; color: string }[] = [
    { status: "healthy", label: t.healthy || "Healthy", color: "#16a34a" },
    { status: "attention", label: t.attention || "Needs Attention", color: "#f97316" },
    { status: "critical", label: t.critical || "Critical", color: "#ef4444" },
  ];

  // Strings helper
  const ls = LOCALIZED_STRINGS[language] || LOCALIZED_STRINGS["en"];

  // Fallback images
  const COW_PLACEHOLDER = "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=600&auto=format&fit=crop";
  const BUFFALO_PLACEHOLDER = "https://images.unsplash.com/photo-1596733430284-f7437764b1a9?q=80&w=600&auto=format&fit=crop";
  const defaultPhoto = animal?.type === "buffalo" ? BUFFALO_PLACEHOLDER : COW_PLACEHOLDER;

  // Calculators
  const getAge = (birthDate?: string | Date | null) => {
    if (!birthDate) return "5 Years";
    const birth = new Date(birthDate);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years === 0) {
      return `${months} Months`;
    }
    return `${years} Years`;
  };

  const getDaysInMilk = (lastCalvingDate?: string | Date | null) => {
    if (!lastCalvingDate) return "110 Days";
    const calving = new Date(lastCalvingDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - calving.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} Days`;
  };

  const getLactationStr = (lactationNumber?: number | null) => {
    if (lactationNumber === undefined || lactationNumber === null) return "2nd";
    const num = Number(lactationNumber);
    if (num === 1) return "1st";
    if (num === 2) return "2nd";
    if (num === 3) return "3rd";
    return `${num}th`;
  };

  // Last 6 days milk history
  const last6Milk = useMemo(() => {
    const dates = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (5 - i));
      return getISTDateString(d);
    });
    return dates.map((date) => ({
      date,
      total: animalMilk
        .filter((e) => getISTDateString(e.date) === date)
        .reduce((s, e) => s + e.quantity, 0),
    }));
  }, [animalMilk]);

  const maxMilk = Math.max(...last6Milk.map((d) => d.total), 1);
  const averageMilk = useMemo(() => {
    const last7DaysTotal = last6Milk.reduce((sum, d) => sum + d.total, 0);
    const activeDays = last6Milk.filter((d) => d.total > 0).length;
    return activeDays > 0 ? last7DaysTotal / activeDays : 0;
  }, [last6Milk]);

  const todayStr = getISTDateString(new Date());
  const milkTodayQty = animalMilk
    .filter((e) => getISTDateString(e.date) === todayStr)
    .reduce((sum, e) => sum + e.quantity, 0);

  // Get top 5 recent activities (milk entries and health events combined)
  const recentActivities = useMemo(() => {
    type ActivityItem = {
      id: string;
      date: Date | string;
      title: string;
      subtitle: string;
      value: string;
      iconName: string;
      iconType: "feather" | "material";
      bgColor: string;
      iconColor: any;
      isBlank?: boolean;
    };

    const milkActs: ActivityItem[] = animalMilk.map((m) => {
      const d = new Date(m.date);
      const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
      const timeStr = hasTime
        ? d.toLocaleTimeString(LOCALE_MAP[language] ?? "en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
        : "";
      const sessionStr = m.session === "morning" ? t.morning : t.evening;
      const subtitleStr = timeStr
        ? `${timeStr} • ${d.toLocaleDateString(LOCALE_MAP[language] ?? "en-IN", { day: "numeric", month: "short" })}`
        : `${sessionStr} • ${d.toLocaleDateString(LOCALE_MAP[language] ?? "en-IN", { day: "numeric", month: "short" })}`;

      return {
        id: m.id,
        date: m.date,
        title: ls.milkRecorded || "Milk Recorded",
        subtitle: subtitleStr,
        value: `${m.quantity.toFixed(1)} L`,
        iconName: "bottle-wine-outline",
        iconType: "material",
        bgColor: "#e0f2fe",
        iconColor: colors.accent,
      };
    });

    const healthActs: ActivityItem[] = animalHealth.map((h) => {
      let iconName = "edit-2";
      let iconType: "feather" | "material" = "feather";
      let bgColor = "#fff7ed";
      let iconColor = "#f97316";
      let defaultTitle = language === "ta" ? "ஆரோக்கிய பதிவு" : "Health Event";

      if (h.type === "vaccination") {
        iconName = "shield";
        iconType = "feather";
        bgColor = "#e0f2fe";
        iconColor = colors.accent;
        defaultTitle = ls.vaccination || "Vaccination";
      } else if (h.type === "treatment") {
        iconName = "activity";
        iconType = "feather";
        bgColor = "#fef2f2";
        iconColor = "#ef4444";
        defaultTitle = language === "ta" ? "சிகிச்சை" : "Treatment";
      } else if (h.type === "observation") {
        iconName = "eye";
        iconType = "feather";
        bgColor = "#fff7ed";
        iconColor = "#f97316";
        defaultTitle = language === "ta" ? "கண்காணிப்பு" : "Observation";
      } else if (h.type === "diagnosis") {
        iconName = "stethoscope";
        iconType = "material";
        bgColor = "#eafaf1";
        iconColor = "#16a34a";
        defaultTitle = language === "ta" ? "நோய் கண்டறிதல்" : "Diagnosis";
      }

      return {
        id: h.id,
        date: h.date,
        title: h.description || defaultTitle,
        subtitle: h.veterinarianName ? `Dr. ${h.veterinarianName}` : (ls[h.type] || h.typeLabel || defaultTitle),
        value: new Date(h.date).toLocaleDateString(LOCALE_MAP[language] ?? "en-IN", {
          day: "numeric",
          month: "short",
        }),
        iconName,
        iconType,
        bgColor,
        iconColor,
      };
    });

    return [...milkActs, ...healthActs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [animalMilk, animalHealth, language, colors, t, ls]);

  // Health tab dynamic values (counts and last checked values)
  const healthStats = useMemo(() => {
    const totalEvents = animalHealth.length;
    const vaccinationCount = animalHealth.filter((h) => h.type === "vaccination").length;
    const treatmentCount = animalHealth.filter((h) => h.type === "treatment").length;
    const observationCount = animalHealth.filter((h) => h.type === "observation" || h.type === "diagnosis").length;

    const sorted = animalHealth.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestCheck = sorted[0]?.date || null;

    // Find latest follow up date in the future
    const sortedFollowUp = animalHealth
      .filter((h) => h.followUpDate)
      .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime());
    const nextCheck = sortedFollowUp.find((h) => new Date(h.followUpDate!).getTime() > Date.now())?.followUpDate || null;

    // Find latest veterinarian name
    const latestVet = sorted.find((h) => h.veterinarianName)?.veterinarianName || null;

    // Filter upcoming checkups/treatments
    const upcomingActivities = animalHealth.filter(
      (h) => h.followUpDate && new Date(h.followUpDate).getTime() > Date.now()
    );

    return {
      totalEvents,
      vaccinationCount,
      treatmentCount,
      observationCount,
      latestHealthCheckDate: latestCheck,
      latestFollowUpDate: nextCheck,
      latestVetName: latestVet,
      upcomingActivities,
    };
  }, [animalHealth]);

  // Animals with no category yet fall into the farm's first one.
  const fallbackCategoryId = categories[0]?.id ?? "lactating";
  const currentStatus = animal?.status || fallbackCategoryId;

  // The farm's own categories drive the herd group UI; seeded ones keep their
  // translated copy until the farmer renames them.
  const groupOptions = useMemo(
    () =>
      categories.map((category) => {
        const seeded = DEFAULT_CATEGORIES.find((d) => d.id === category.id);
        const translated = GROUP_NAMES[category.id];
        const untouched = seeded && translated && seeded.name === category.name;
        const style = GROUP_STYLE_MAP[category.id];

        return {
          status: category.id,
          name: untouched ? translated[language === "ta" ? "ta" : "en"] : category.name,
          desc: category.desc ?? "",
          icon: style?.icon ?? category.icon ?? "cow",
          iconColor: style?.color ?? category.color,
          badgeBg: style?.bg ?? category.color + "15",
        };
      }),
    [categories, language]
  );

  const groupName =
    groupOptions.find((o) => o.status === currentStatus)?.name ?? currentStatus;
  const animalsInGroupCount = animals.filter(
    (a) => (a.status || fallbackCategoryId) === currentStatus
  ).length;

  const setHerdStatus = async (status: any) => {
    if (!animal) return;
    Haptics.selectionAsync();
    try {
      await updateAnimal(Number(animal.id), { status });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("Failed to update status:", err);
      Alert.alert("Error", "Failed to update herd group");
    }
  };

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

  const handleDeleteAnimal = () => {
    Alert.alert(t.animalDetailDeleteTitle, t.animalDetailDeleteBody.replace("{name}", animal.name), [
      { text: t.animalDetailDeleteCancel, style: "cancel" },
      {
        text: t.animalDetailDeleteConfirm,
        style: "destructive",
        onPress: () => {
          removeAnimal(Number(animal.id));
          router.back();
        },
      },
    ]);
  };

  const setHealthStatus = (status: any) => {
    Haptics.selectionAsync();
    updateAnimal(Number(animal.id), { healthStatus: status });
  };

  const uploadPhoto = async (localUri: string): Promise<string | null> => {
    console.log("[uploadPhoto] Uploading photo to NestJS api server...");
    const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";
    const formData = new FormData();
    formData.append("file", {
      uri: localUri,
      name: `animal_${id}_photo.jpg`,
      type: "image/jpeg",
    } as any);

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(`${apiBase}/animals/upload`, {
        method: "POST",
        body: formData,
        headers,
      });
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }
      const text = await response.text();
      let resData: any = {};
      try {
        resData = JSON.parse(text);
      } catch {
        throw new Error("Server returned non-JSON response for photo upload.");
      }
      console.log("[uploadPhoto] NestJS server upload success:", resData.url);
      return resData.url;
    } catch (localError) {
      console.error("[uploadPhoto] Upload failed:", localError);
      Alert.alert(t.error, "Failed to upload image to server.");
      return null;
    }
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
            const uploadedUrl = await uploadPhoto(result.assets[0].uri);
            if (uploadedUrl) {
              await updateAnimal(Number(animal.id), { photoUri: uploadedUrl });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
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
            const uploadedUrl = await uploadPhoto(result.assets[0].uri);
            if (uploadedUrl) {
              await updateAnimal(Number(animal.id), { photoUri: uploadedUrl });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        },
      },
    ]);
  };

  const addHealthNote = () => {
    setHealthNoteVisible(true);
  };

  const handleSelectHealthNote = (description: string) => {
    createEvent({
      animalId: Number(animal.id),
      date: new Date().toISOString(),
      type: "observation",
      description,
    }).catch(err => {
      console.error("[AnimalDetail] Failed to create health event:", err);
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHealthNoteVisible(false);
  };

  const isTa = language === "ta";

  const handleDeleteMilkEntry = (entry: MilkEntry) => {
    Alert.alert(
      isTa ? "பதிவை நீக்கவா?" : "Delete Entry",
      isTa ? "இந்த பால் பதிவை நீக்க விரும்புகிறீர்களா?" : "Are you sure you want to delete this milk log?",
      [
        { text: t.cancel || "Cancel", style: "cancel" },
        {
          text: isTa ? "நீக்கு" : "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMilk(Number(entry.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err) {
              console.error("[AnimalDetail] Failed to delete milk entry:", err);
              Alert.alert("Error", "Failed to delete milk entry");
            }
          },
        },
      ]
    );
  };

  // Header options popup (...)
  const handleHeaderOptions = () => {
    Alert.alert(animal.name, isTa ? "விருப்பங்கள்" : "Options", [
      { text: t.cancel || "Cancel", style: "cancel" },
      {
        text: isTa ? "பால் பதிவு செய்க" : "Log Milk",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setEntryToEdit(null);
          setMilkLogVisible(true);
        }
      },
      {
        text: isTa ? "உடல்நிலை குறிப்பு" : "Add Health Note",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          addHealthNote();
        }
      },
      {
        text: isTa ? "புகைப்படம் எடு" : "Take/Upload Photo",
        onPress: handleCamera
      },
      {
        text: isTa ? "மாட்டை நீக்கு" : "Delete Animal",
        style: "destructive",
        onPress: handleDeleteAnimal
      }
    ]);
  };

  // Active Health Option Config
  const activeHealthConfig = HEALTH_OPTIONS.find((h) => h.status === animal.healthStatus) || HEALTH_OPTIONS[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
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
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {animal.name}
        </Text>
        <Pressable onPress={handleHeaderOptions} style={styles.deleteBtn} hitSlop={12}>
          <Feather name="more-horizontal" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 120 : 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* SUMMARY CARD (TOP INFO SECTION) */}
        <View style={[styles.summaryCard, { borderColor: colors.border }]}>
          {/* Large Square Image on Left */}
          <Pressable style={styles.squarePhotoContainer} onPress={handleCamera}>
            <Image
              source={{ uri: animal.photoUri || defaultPhoto }}
              style={styles.squarePhoto}
            />
            {/* Tag indicator overlay on image */}
            <View style={styles.tagIconOverlay}>
              <MaterialCommunityIcons name="tag-outline" size={12} color="#fff" />
            </View>
          </Pressable>

          {/* Details Table on Right */}
          <View style={styles.summaryDetails}>
            {/* Health status pill badge at the top */}
            <View
              style={[
                styles.badgeStatus,
                { backgroundColor: activeHealthConfig.color + "18" },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: activeHealthConfig.color }]} />
              <Text style={[styles.badgeStatusText, { color: activeHealthConfig.color }]}>
                {activeHealthConfig.label}
              </Text>
            </View>

            {/* Grid properties */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: colors.mutedForeground }]}>{ls.id}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>{animal.tagNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: colors.mutedForeground }]}>{ls.age}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>{getAge(animal.birthDate)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: colors.mutedForeground }]}>{ls.breed}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>{animal.breed}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: colors.mutedForeground }]}>{ls.weight}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>{animal.weightKg ?? 470} kg</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: colors.mutedForeground }]}>{ls.lactation}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>{getLactationStr(animal.lactationNumber)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: colors.mutedForeground }]}>{ls.daysInMilk}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>{getDaysInMilk(animal.lastCalvingDate)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: colors.mutedForeground }]}>{ls.milkToday}</Text>
                <View style={styles.milkTodayContainer}>
                  <Text style={[styles.detailValue, { color: colors.accent, fontWeight: "700" }]}>
                    {milkTodayQty > 0 ? `${milkTodayQty.toFixed(1)} L` : "0.0 L"}
                  </Text>
                  <MaterialCommunityIcons name="bottle-wine-outline" size={14} color={colors.accent} style={{ marginLeft: 2 }} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* TAB BAR CONTAINER */}
        <View style={[styles.tabsOuter, { borderBottomColor: colors.border, marginHorizontal: -16, marginBottom: 12 }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {(["Overview", "Feed", "Health", "Breeding", "History", "Milk logs"] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab(tab);
                  }}
                  style={[styles.tabButton]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      isActive
                        ? { color: colors.primary, fontWeight: "700" }
                        : { color: colors.mutedForeground, fontWeight: "500" },
                    ]}
                  >
                    {ls[tab.toLowerCase()] || tab}
                  </Text>
                  {isActive && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* TAB RENDERING */}
        {activeTab === "Overview" && (
          <View style={{ gap: 16 }}>
            {/* TODAY'S FEED HEADER SECTION */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{ls.todaysFeed}</Text>
              <Pressable style={styles.planLink} onPress={() => Alert.alert(ls.planVsActual, "Comparing current nutrition targets vs actual distribution details.")}>
                <Text style={[styles.planLinkText, { color: colors.primary }]}>{ls.planVsActual}</Text>
              </Pressable>
            </View>

            {/* Segmented feed periods tab bar */}
            <View style={[styles.feedSegmentBar, { backgroundColor: colors.muted }]}>
              {(["Morning", "Evening", "Total", "Cost"] as const).map((period) => {
                const isPeriodActive = feedPeriod === period;
                return (
                  <Pressable
                    key={period}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFeedPeriod(period);
                    }}
                    style={[
                      styles.feedSegmentBtn,
                      isPeriodActive && [styles.feedSegmentBtnActive, { backgroundColor: colors.card }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.feedSegmentText,
                        isPeriodActive
                          ? { color: colors.primary, fontWeight: "700" }
                          : { color: colors.mutedForeground, fontWeight: "500" },
                      ]}
                    >
                      {ls[period.toLowerCase()] || period}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* MILK PRODUCTION (DAILY) CARD */}
            <View style={[styles.cardContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{ls.milkProductionDaily}</Text>
                {/* 8% vs last week badge */}
                <View style={[styles.percentageBadge, { backgroundColor: "#eafaf1" }]}>
                  <Feather name="arrow-up" size={12} color="#16a34a" />
                  <Text style={styles.percentageText}>8% vs last week</Text>
                </View>
              </View>

              {/* Weekly Average */}
              <View style={styles.avgContainer}>
                <Text style={[styles.avgValue, { color: colors.foreground }]}>
                  {averageMilk.toFixed(1)} L
                </Text>
                <Text style={[styles.avgLabel, { color: colors.mutedForeground }]}>{ls.avgThisWeek}</Text>
              </View>

              {/* CUSTOM BAR CHART */}
              <View style={styles.customChartWrapper}>
                {/* Dotted grid lines */}
                <View style={styles.chartGridLines}>
                  {[16, 10, 5, 0].map((val) => (
                    <View key={val} style={[styles.gridLineRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.gridScaleLabel, { color: colors.mutedForeground }]}>{val}L</Text>
                    </View>
                  ))}
                </View>

                {/* Bars */}
                <View style={styles.chartBarsRow}>
                  {last6Milk.map((d, i) => {
                    const chartMax = Math.max(maxMilk, 16);
                    const totalVal = d.total;
                    const heightPct = (totalVal / chartMax) * 100;
                    
                    const dayLabel = new Date(d.date).toLocaleDateString(LOCALE_MAP[language] ?? "en-IN", {
                      day: "numeric",
                      month: "short",
                    });

                    return (
                      <View key={i} style={styles.customBarCol}>
                        <View style={styles.barFillWrapper}>
                          <View
                            style={[
                              styles.customBarFill,
                              {
                                height: `${Math.max(heightPct, 4)}%`,
                                backgroundColor: colors.primary,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.customBarQtyLabel, { color: colors.mutedForeground }]}>
                          {totalVal.toFixed(0)}L
                        </Text>
                        <Text style={[styles.customBarDateLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {dayLabel}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* FEED DETAILS TABLE */}
            <View style={[styles.cardContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
              {/* Table Headers */}
              <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.colHeader, styles.colFlex2, { color: colors.mutedForeground }]}>{ls.feedType}</Text>
                <Text style={[styles.colHeader, styles.colFlex1, styles.textRight, { color: colors.mutedForeground }]}>{ls.planned}</Text>
                <Text style={[styles.colHeader, styles.colFlex1, styles.textRight, { color: colors.mutedForeground }]}>{ls.given}</Text>
                <Text style={[styles.colHeader, styles.colFlex1, styles.textRight, { color: colors.mutedForeground }]}>{ls.balance}</Text>
              </View>

              {/* Row 1: Green Fodder */}
              <View style={[styles.tableBodyRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.colBodyText, styles.colFlex2, { color: colors.foreground, fontWeight: "600" }]}>{ls.greenFodder}</Text>
                <Text style={[styles.colBodyText, styles.colFlex1, styles.textRight, { color: colors.foreground }]}>
                  {feedPeriod === "Morning" ? "18 kg" : feedPeriod === "Evening" ? "12 kg" : feedPeriod === "Total" ? "30 kg" : "₹180"}
                </Text>
                <Text style={[styles.colBodyText, styles.colFlex1, styles.textRight, { color: colors.primary, fontWeight: "700" }]}>
                  {feedPeriod === "Morning" ? "18 kg" : feedPeriod === "Evening" ? "12 kg" : feedPeriod === "Total" ? "30 kg" : "₹180"}
                </Text>
                <Text style={[styles.colBodyText, styles.colFlex1, styles.textRight, { color: colors.foreground }]}>
                  {feedPeriod === "Cost" ? "₹0" : "0 kg"}
                </Text>
              </View>

              {/* Row 2: Concentrate */}
              <View style={styles.tableBodyRow}>
                <Text style={[styles.colBodyText, styles.colFlex2, { color: colors.foreground, fontWeight: "600" }]}>{ls.concentrate}</Text>
                <Text style={[styles.colBodyText, styles.colFlex1, styles.textRight, { color: colors.foreground }]}>
                  {feedPeriod === "Morning" ? "6 kg" : feedPeriod === "Evening" ? "4 kg" : feedPeriod === "Total" ? "10 kg" : "₹150"}
                </Text>
                <Text style={[styles.colBodyText, styles.colFlex1, styles.textRight, { color: colors.primary, fontWeight: "700" }]}>
                  {feedPeriod === "Morning" ? "6 kg" : feedPeriod === "Evening" ? "4 kg" : feedPeriod === "Total" ? "10 kg" : "₹150"}
                </Text>
                <Text style={[styles.colBodyText, styles.colFlex1, styles.textRight, { color: colors.foreground }]}>
                  {feedPeriod === "Cost" ? "₹0" : "0 kg"}
                </Text>
              </View>
            </View>

            {/* HERD GROUP CARD */}
            <View style={[styles.sectionHeaderRow, { marginTop: 4 }]}>
              <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{ls.herdGroup}</Text>
            </View>
            <View style={[styles.cardContainer, styles.herdRowContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <View
                style={[
                  styles.herdIconBadge,
                  { backgroundColor: GROUP_STYLE_MAP[currentStatus]?.bg || "#eafaf1" },
                ]}
              >
                <MaterialCommunityIcons
                  name={(GROUP_STYLE_MAP[currentStatus]?.icon || "cow") as any}
                  size={20}
                  color={GROUP_STYLE_MAP[currentStatus]?.color || "#16a34a"}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.herdGroupName, { color: colors.foreground }]}>{groupName}</Text>
                <Text style={[styles.herdCount, { color: colors.mutedForeground }]}>
                  {animalsInGroupCount} {ls.animalsCount}
                </Text>
              </View>
              <Pressable
                style={[styles.outlineBtn, { borderColor: colors.border }]}
                onPress={() => setGroupModalVisible(true)}
              >
                <Text style={[styles.outlineBtnText, { color: colors.foreground }]}>{ls.change}</Text>
              </Pressable>
            </View>

            {/* RECENT ACTIVITY SECTION */}
            <View style={[styles.sectionHeaderRow, { marginTop: 4 }]}>
              <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{ls.recentActivity}</Text>
              <Pressable style={styles.planLink} onPress={() => setActiveTab("History")}>
                <Text style={[styles.planLinkText, { color: colors.primary }]}>{ls.viewAll}</Text>
              </Pressable>
            </View>

            <View style={styles.activityList}>
              {recentActivities.length === 0 ? (
                <Text style={[styles.noData, { color: colors.mutedForeground }]}>
                  {language === "ta" ? "சமீபத்திய செயல்பாடு எதுவும் இல்லை" : "No recent activity recorded yet"}
                </Text>
              ) : (
                recentActivities.map((act, index) => {
                  const isLast = index === recentActivities.length - 1;
                  return (
                    <View
                      key={act.id || index}
                      style={[
                        styles.activityRow,
                        { borderBottomColor: colors.border },
                        isLast && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={[styles.activityIconBadge, { backgroundColor: act.bgColor }]}>
                        {act.iconType === "feather" ? (
                          <Feather name={act.iconName as any} size={14} color={act.iconColor} />
                        ) : (
                          <MaterialCommunityIcons name={act.iconName as any} size={16} color={act.iconColor} />
                        )}
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.activityTitle, { color: colors.foreground }]}>{act.title}</Text>
                        <Text style={[styles.activitySubtitle, { color: colors.mutedForeground }]}>{act.subtitle}</Text>
                      </View>
                      <Text style={[styles.activityValue, { color: colors.foreground }]}>{act.value}</Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* FEED TAB CONTENT */}
        {activeTab === "Feed" && (
          <View style={{ gap: 16 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{ls.todaysFeed}</Text>
            </View>
            <View style={[styles.feedSegmentBar, { backgroundColor: colors.muted }]}>
              {(["Morning", "Evening", "Total", "Cost"] as const).map((period) => {
                const isPeriodActive = feedPeriod === period;
                return (
                  <Pressable
                    key={period}
                    onPress={() => setFeedPeriod(period)}
                    style={[
                      styles.feedSegmentBtn,
                      isPeriodActive && [styles.feedSegmentBtnActive, { backgroundColor: colors.card }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.feedSegmentText,
                        isPeriodActive
                          ? { color: colors.primary, fontWeight: "700" }
                          : { color: colors.mutedForeground, fontWeight: "500" },
                      ]}
                    >
                      {ls[period.toLowerCase()] || period}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.cardContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.colHeader, styles.colFlex2, { color: colors.mutedForeground }]}>{ls.feedType}</Text>
                <Text style={[styles.colHeader, styles.colFlex1, styles.textRight, { color: colors.mutedForeground }]}>{ls.planned}</Text>
                <Text style={[styles.colHeader, styles.colFlex1, styles.textRight, { color: colors.mutedForeground }]}>{ls.given}</Text>
                <Text style={[styles.colHeader, styles.colFlex1, styles.textRight, { color: colors.mutedForeground }]}>{ls.balance}</Text>
              </View>

              <View style={[styles.tableBodyRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.colBodyText, styles.colFlex2, { color: colors.foreground, fontWeight: "600" }]}>{ls.greenFodder}</Text>
                <Text style={[styles.colBodyText, styles.colFlex1, styles.textRight, { color: colors.foreground }]}>
                  {feedPeriod === "Morning" ? "18 kg" : feedPeriod === "Evening" ? "12 kg" : feedPeriod === "Total" ? "30 kg" : "₹180"}
                </Text>
                <Text style={[styles.colBodyText, styles.colFlex1, styles.textRight, { color: colors.primary, fontWeight: "700" }]}>
                  {feedPeriod === "Morning" ? "18 kg" : feedPeriod === "Evening" ? "12 kg" : feedPeriod === "Total" ? "30 kg" : "₹180"}
                </Text>
                <Text style={[styles.colBodyText, styles.colFlex1, styles.textRight, { color: colors.foreground }]}>
                  {feedPeriod === "Cost" ? "₹0" : "0 kg"}
                </Text>
              </View>

              <View style={styles.tableBodyRow}>
                <Text style={[styles.colBodyText, styles.colFlex2, { color: colors.foreground, fontWeight: "600" }]}>{ls.concentrate}</Text>
                <Text style={[styles.colBodyText, styles.colFlex1, styles.textRight, { color: colors.foreground }]}>
                  {feedPeriod === "Morning" ? "6 kg" : feedPeriod === "Evening" ? "4 kg" : feedPeriod === "Total" ? "10 kg" : "₹150"}
                </Text>
                <Text style={[styles.colBodyText, styles.colFlex1, styles.textRight, { color: colors.primary, fontWeight: "700" }]}>
                  {feedPeriod === "Morning" ? "6 kg" : feedPeriod === "Evening" ? "4 kg" : feedPeriod === "Total" ? "10 kg" : "₹150"}
                </Text>
                <Text style={[styles.colBodyText, styles.colFlex1, styles.textRight, { color: colors.foreground }]}>
                  {feedPeriod === "Cost" ? "₹0" : "0 kg"}
                </Text>
              </View>
            </View>

            <Pressable
              style={[styles.outlineBtn, { borderColor: colors.primary, paddingVertical: 14, borderRadius: 10, width: "100%", justifyContent: "center" }]}
              onPress={() => Alert.alert(isTa ? "தீவனம் பதிவிடவும்" : "Log Feed Distribution", isTa ? "இன்றைய தீவனம் விநியோகம் வெற்றிகரமாக பதிவு செய்யப்பட்டது." : "Feed distribution for today has been logged.")}
            >
              <Text style={{ color: colors.primary, fontWeight: "700", textAlign: "center" }}>
                {isTa ? "+ புதிய தீவனம் பதிவு செய்க" : "+ Log Distribution"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* HEALTH TAB CONTENT */}
        {activeTab === "Health" && (() => {
          const {
            totalEvents,
            vaccinationCount,
            treatmentCount,
            observationCount,
            latestHealthCheckDate,
            latestFollowUpDate,
            latestVetName,
            upcomingActivities,
          } = healthStats;

          const r = 24;
          const c = 2 * Math.PI * r;
          const vacPct = totalEvents > 0 ? (vaccinationCount / totalEvents) : 0;
          const treatPct = totalEvents > 0 ? (treatmentCount / totalEvents) : 0;
          const obsPct = totalEvents > 0 ? (observationCount / totalEvents) : 0;

          const vacStroke = vacPct * c;
          const treatStroke = treatPct * c;
          const obsStroke = obsPct * c;

          const vacOffset = 0;
          const treatOffset = c - vacStroke;
          const obsOffset = c - vacStroke - treatStroke;

          return (
            <View style={{ gap: 16 }}>
              {/* Health Overview Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{isTa ? "உடல்நல மேலோட்டம்" : "Health Overview"}</Text>
                <Pressable
                  style={[styles.outlineBtn, { borderColor: colors.primary, flexDirection: "row", alignItems: "center", gap: 4 }]}
                  onPress={() => addHealthNote()}
                >
                  <Feather name="plus" size={14} color={colors.primary} />
                  <Text style={[styles.outlineBtnText, { color: colors.primary, fontWeight: "700" }]}>{isTa ? "குறிப்பு சேர்க்க" : "Add Note"}</Text>
                </Pressable>
              </View>

              {/* Top Row Cards Scroll */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
              >
                {/* Health Status Card */}
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      isTa ? "உடல்நிலையை மாற்றவும்" : "Change Health Status",
                      isTa ? "மாட்டின் தற்போதைய உடல்நிலையை தேர்ந்தெடுக்கவும்:" : "Select the current health status of the animal:",
                      HEALTH_OPTIONS.map((opt) => ({
                        text: opt.label,
                        onPress: () => setHealthStatus(opt.status),
                      })).concat([{ text: t.cancel || "Cancel", style: "cancel" } as any])
                    );
                  }}
                  style={[
                    styles.cardContainer,
                    {
                      width: 140,
                      borderColor: animal.healthStatus === "healthy" ? "#bbf7d0" : animal.healthStatus === "attention" ? "#ffedd5" : "#fee2e2",
                      backgroundColor: animal.healthStatus === "healthy" ? "#eafaf1" : animal.healthStatus === "attention" ? "#fff7ed" : "#fef2f2",
                      padding: 12,
                      gap: 8,
                    }
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Feather
                      name={animal.healthStatus === "healthy" ? "check-circle" : "alert-circle"}
                      size={14}
                      color={animal.healthStatus === "healthy" ? "#16a34a" : animal.healthStatus === "attention" ? "#ea580c" : "#dc2626"}
                    />
                    <Text style={{ fontSize: 10, fontWeight: "600", color: colors.mutedForeground }}>{isTa ? "உடல்நிலை" : "Health Status"}</Text>
                  </View>
                  <View>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: animal.healthStatus === "healthy" ? "#16a34a" : animal.healthStatus === "attention" ? "#ea580c" : "#dc2626"
                    }}>
                      {animal.healthStatus === "healthy" ? (isTa ? "ஆரோக்கியம்" : "Healthy") : animal.healthStatus === "attention" ? (isTa ? "கவனம்" : "Attention") : (isTa ? "கவலைக்கிடம்" : "Critical")}
                    </Text>
                    <Text style={{ fontSize: 9.5, color: colors.mutedForeground, marginTop: 2 }}>{isTa ? "மாற்ற தட்டவும்" : "Tap to change"}</Text>
                  </View>
                </Pressable>

                {/* Treatments Done Card */}
                <View style={[styles.cardContainer, { width: 140, borderColor: "#ddd6fe", backgroundColor: "#f5f3ff", padding: 12, gap: 8 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Feather name="activity" size={14} color="#7c3aed" />
                    <Text style={{ fontSize: 10, fontWeight: "600", color: colors.mutedForeground }}>{isTa ? "சிகிச்சைகள்" : "Treatments"}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#7c3aed" }}>{treatmentCount}</Text>
                    <Text style={{ fontSize: 9.5, color: colors.mutedForeground, marginTop: 2 }}>{isTa ? "மொத்தம்" : "Total Logged"}</Text>
                  </View>
                </View>

                {/* Vaccinations Card */}
                <View style={[styles.cardContainer, { width: 140, borderColor: "#bfdbfe", backgroundColor: "#eff6ff", padding: 12, gap: 8 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Feather name="shield" size={14} color="#2563eb" />
                    <Text style={{ fontSize: 10, fontWeight: "600", color: colors.mutedForeground }}>{isTa ? "தடுப்பூசிகள்" : "Vaccinations"}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#2563eb" }}>{vaccinationCount}</Text>
                    <Text style={{ fontSize: 9.5, color: colors.mutedForeground, marginTop: 2 }}>{isTa ? "மொத்தம்" : "Total"}</Text>
                  </View>
                </View>

                {/* Health Alerts Card */}
                <View style={[
                  styles.cardContainer,
                  {
                    width: 140,
                    borderColor: animal.healthStatus === "healthy" ? "#e2e8f0" : "#fee2e2",
                    backgroundColor: animal.healthStatus === "healthy" ? "#f8fafc" : "#fef2f2",
                    padding: 12,
                    gap: 8
                  }
                ]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Feather name="alert-octagon" size={14} color={animal.healthStatus === "healthy" ? "#64748b" : "#dc2626"} />
                    <Text style={{ fontSize: 10, fontWeight: "600", color: colors.mutedForeground }}>{isTa ? "எச்சரிக்கைகள்" : "Health Alerts"}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: animal.healthStatus === "healthy" ? "#64748b" : "#dc2626" }}>
                      {animal.healthStatus === "healthy" ? 0 : 1}
                    </Text>
                    <Text style={{ fontSize: 9.5, color: colors.mutedForeground, marginTop: 2 }}>{isTa ? "செயலில்" : "Active"}</Text>
                  </View>
                </View>
              </ScrollView>

              {/* Health Details Card */}
              <View style={[styles.cardContainer, { borderColor: colors.border, backgroundColor: colors.card, padding: 16 }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 12 }]}>{isTa ? "ஆரோக்கிய விவரங்கள்" : "Health Details"}</Text>
                
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  {/* Legend on left */}
                  <View style={{ gap: 8, flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                        {isTa ? "தடுப்பூசிகள்" : "Vaccinations"}: {totalEvents > 0 ? ((vaccinationCount / totalEvents) * 100).toFixed(1) : "0.0"}%
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={[styles.statusDot, { backgroundColor: "#ef4444" }]} />
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                        {isTa ? "சிகிச்சைகள்" : "Treatments"}: {totalEvents > 0 ? ((treatmentCount / totalEvents) * 100).toFixed(1) : "0.0"}%
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={[styles.statusDot, { backgroundColor: "#f97316" }]} />
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                        {isTa ? "கண்காணிப்புகள்" : "Observations"}: {totalEvents > 0 ? ((observationCount / totalEvents) * 100).toFixed(1) : "0.0"}%
                      </Text>
                    </View>
                  </View>

                  {/* Donut Chart in middle */}
                  <View style={{ alignItems: "center", justifyContent: "center", width: 70, height: 70, marginHorizontal: 12 }}>
                    <Svg width="70" height="70" viewBox="0 0 70 70">
                      <G transform="rotate(-90 35 35)">
                        {totalEvents === 0 ? (
                          <Circle
                            cx="35"
                            cy="35"
                            r="24"
                            stroke="#e2e8f0"
                            strokeWidth="8"
                            fill="transparent"
                          />
                        ) : (
                          <>
                            {/* Vaccinations Circle */}
                            {vacStroke > 0 && (
                              <Circle
                                cx="35"
                                cy="35"
                                r="24"
                                stroke={colors.primary}
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={[vacStroke, c - vacStroke]}
                                strokeDashoffset={vacOffset}
                              />
                            )}
                            {/* Treatments Circle */}
                            {treatStroke > 0 && (
                              <Circle
                                cx="35"
                                cy="35"
                                r="24"
                                stroke="#ef4444"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={[treatStroke, c - treatStroke]}
                                strokeDashoffset={treatOffset}
                              />
                            )}
                            {/* Observations Circle */}
                            {obsStroke > 0 && (
                              <Circle
                                cx="35"
                                cy="35"
                                r="24"
                                stroke="#f97316"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={[obsStroke, c - obsStroke]}
                                strokeDashoffset={obsOffset}
                              />
                            )}
                          </>
                        )}
                      </G>
                    </Svg>
                  </View>

                  {/* Overall Health Box on right */}
                  <View style={{
                    backgroundColor: animal.healthStatus === "healthy" ? "#eafaf1" : animal.healthStatus === "attention" ? "#fff7ed" : "#fef2f2",
                    borderColor: animal.healthStatus === "healthy" ? "#bbf7d0" : animal.healthStatus === "attention" ? "#ffedd5" : "#fee2e2",
                    borderWidth: 1,
                    borderRadius: 10,
                    padding: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 110
                  }}>
                    <Feather
                      name={animal.healthStatus === "healthy" ? "shield" : "alert-triangle"}
                      size={16}
                      color={animal.healthStatus === "healthy" ? "#16a34a" : animal.healthStatus === "attention" ? "#ea580c" : "#dc2626"}
                    />
                    <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 4 }}>
                      {isTa ? "ஒட்டுமொத்த நிலை" : "Overall Health"}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: animal.healthStatus === "healthy" ? "#16a34a" : animal.healthStatus === "attention" ? "#ea580c" : "#dc2626",
                      marginTop: 2
                    }}>
                      {animal.healthStatus === "healthy" ? (isTa ? "நன்று" : "Good") : animal.healthStatus === "attention" ? (isTa ? "கவனம்" : "Fair") : (isTa ? "Poor" : "Poor")}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Current Treatments & Activities */}
              <View style={{ gap: 8 }}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
                    {isTa ? "சிகிச்சைகள் & செயல்பாடுகள்" : "Current Treatments & Activities"}
                  </Text>
                </View>
                
                {upcomingActivities.length === 0 ? (
                  <View style={[styles.cardContainer, { borderColor: colors.border, backgroundColor: colors.card, padding: 16, alignItems: "center" }]}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                      {isTa ? "செயலில் உள்ள சிகிச்சைகள் எதுவும் இல்லை" : "No active treatments or scheduled activities"}
                    </Text>
                  </View>
                ) : (
                  upcomingActivities.map((act) => {
                    const isVaccine = act.type === "vaccination";
                    const iconName = isVaccine ? "shield" : "activity";
                    const iconColor = isVaccine ? colors.primary : "#ef4444";
                    const bgColor = isVaccine ? "#eff6ff" : "#fef2f2";
                    
                    return (
                      <View key={act.id} style={[styles.cardContainer, { borderColor: colors.border, backgroundColor: colors.card, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }]}>
                        <View style={[styles.activityIconBadge, { backgroundColor: bgColor }]}>
                          <Feather name={iconName} size={14} color={iconColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "600", fontSize: 13.5, color: colors.foreground }}>{act.description}</Text>
                          <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>{act.typeLabel}</Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <View style={{ backgroundColor: "#f5f3ff", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ color: "#7c3aed", fontSize: 10, fontWeight: "700" }}>{isTa ? "விரைவில்" : "Due Soon"}</Text>
                          </View>
                          <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 4 }}>
                            {new Date(act.followUpDate!).toLocaleDateString(LOCALE_MAP[language] ?? "en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* Active Health Alerts */}
              {animal.healthStatus !== "healthy" && (
                <View style={{ gap: 8 }}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
                      {isTa ? "செயலில் உள்ள எச்சரிக்கைகள்" : "Active Health Alerts"}
                    </Text>
                  </View>
                  <View style={[styles.cardContainer, { borderColor: "#fee2e2", backgroundColor: "#fef2f2", padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }]}>
                    <View style={[styles.activityIconBadge, { backgroundColor: "#fee2e2" }]}>
                      <Feather name="alert-triangle" size={14} color="#dc2626" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "600", fontSize: 13.5, color: "#dc2626" }}>
                        {animal.healthStatus === "critical" 
                          ? (isTa ? "மாடு கவலைக்கிடமான நிலையில் உள்ளது" : "Critical health status: requires immediate attention")
                          : (isTa ? "மாடு உடல்நலக் கண்காணிப்பில் உள்ளது" : "Needs attention: watch condition closely")
                        }
                      </Text>
                      <Text style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>
                        {isTa ? "கடைசி உடல்நலப் பதிவு" : "Latest health observation"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Recent Health Records */}
              <View style={{ gap: 8 }}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
                    {isTa ? "சமீபத்திய ஆரோக்கிய பதிவுகள்" : "Recent Health Records"}
                  </Text>
                </View>

                {animalHealth.length === 0 ? (
                  <View style={[styles.cardContainer, { borderColor: colors.border, backgroundColor: colors.card, padding: 24, alignItems: "center" }]}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                      {isTa ? "பதிவுகள் எதுவும் இல்லை" : "No health records logged yet"}
                    </Text>
                  </View>
                ) : (
                  animalHealth
                    .slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((e) => {
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
                            <Text style={[styles.healthEntryDesc, { color: colors.foreground, fontWeight: "600" }]}>
                              {e.description}
                            </Text>
                            <Text style={[styles.healthEntryDate, { color: colors.mutedForeground }]}>
                              {new Date(e.date).toLocaleDateString(LOCALE_MAP[language] ?? "en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              {e.veterinarianName ? ` • Dr. ${e.veterinarianName}` : ""}
                            </Text>
                          </View>
                          {e.cost && (
                            <Text style={[styles.healthEntryCost, { color: colors.accent }]}>
                              ₹{e.cost}
                            </Text>
                          )}
                          <Feather name="chevron-right" size={14} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
                        </View>
                      );
                    })
                )}
              </View>

              {/* Bottom Health Info Grid */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                {/* Last Health Check */}
                <View style={[styles.cardContainer, { flex: 1, minWidth: 140, borderColor: colors.border, backgroundColor: colors.card, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }]}>
                  <Feather name="calendar" size={14} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, color: colors.mutedForeground }} numberOfLines={1}>{isTa ? "கடைசி பரிசோதனை" : "Last Health Check"}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginTop: 2 }}>
                      {latestHealthCheckDate 
                        ? new Date(latestHealthCheckDate).toLocaleDateString(LOCALE_MAP[language] ?? "en-IN", { day: "numeric", month: "short" })
                        : "None"
                      }
                    </Text>
                  </View>
                </View>

                {/* Next Checkup */}
                <View style={[styles.cardContainer, { flex: 1, minWidth: 140, borderColor: colors.border, backgroundColor: colors.card, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }]}>
                  <Feather name="calendar" size={14} color="#7c3aed" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, color: colors.mutedForeground }} numberOfLines={1}>{isTa ? "அடுத்த பரிசோதனை" : "Next Checkup"}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginTop: 2 }}>
                      {latestFollowUpDate 
                        ? new Date(latestFollowUpDate).toLocaleDateString(LOCALE_MAP[language] ?? "en-IN", { day: "numeric", month: "short" })
                        : "None"
                      }
                    </Text>
                  </View>
                </View>

                {/* Veterinarian */}
                <View style={[styles.cardContainer, { flex: 1, minWidth: 140, borderColor: colors.border, backgroundColor: colors.card, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }]}>
                  <Feather name="user" size={14} color={colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, color: colors.mutedForeground }} numberOfLines={1}>{isTa ? "மருத்துவர்" : "Veterinarian"}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginTop: 2 }} numberOfLines={1}>
                      {latestVetName ? `Dr. ${latestVetName}` : "None"}
                    </Text>
                  </View>
                </View>

                {/* Health Score */}
                <View style={[styles.cardContainer, { flex: 1, minWidth: 140, borderColor: colors.border, backgroundColor: colors.card, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }]}>
                  <Feather name="heart" size={14} color="#e11d48" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, color: colors.mutedForeground }} numberOfLines={1}>{isTa ? "மதிப்பெண்" : "Health Score"}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, marginTop: 2 }}>
                      {animal.healthStatus === "healthy" ? "98%" : animal.healthStatus === "attention" ? "70%" : "30%"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })()}

        {/* BREEDING TAB CONTENT */}
        {activeTab === "Breeding" && (
          <View style={{ gap: 16 }}>
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{ls.breeding}</Text>
            
            <View style={[styles.cardContainer, { borderColor: colors.border, backgroundColor: colors.card, padding: 16, gap: 12 }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: colors.mutedForeground }]}>{isTa ? "கர்ப்ப நிலை" : "Pregnancy Status"}</Text>
                <Text style={[styles.detailValue, { color: animal.isPregnant ? colors.primary : colors.foreground, fontWeight: "700" }]}>
                  {animal.isPregnant ? (isTa ? "கர்ப்பம் உறுதி" : "Pregnant") : (isTa ? "இல்லை" : "Not Pregnant")}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: colors.mutedForeground }]}>{isTa ? "கடைசி கன்று ஈன்ற நாள்" : "Last Calving Date"}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>
                  {animal.lastCalvingDate ? new Date(animal.lastCalvingDate).toLocaleDateString(LOCALE_MAP[language] ?? "en-IN") : "None"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: colors.mutedForeground }]}>{isTa ? "எதிர்பார்க்கும் கன்று ஈனும் நாள்" : "Expected Calving"}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>
                  {animal.expectedCalvingDate ? new Date(animal.expectedCalvingDate).toLocaleDateString(LOCALE_MAP[language] ?? "en-IN") : "None"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: colors.mutedForeground }]}>{isTa ? "உடல் நிலை மதிப்பீடு" : "Body Condition Score"}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>{animal.bodyConditionScore ?? "3.5 / 5.0"}</Text>
              </View>
            </View>

            <Pressable
              style={[styles.outlineBtn, { borderColor: colors.primary, paddingVertical: 14, borderRadius: 10, width: "100%", justifyContent: "center" }]}
              onPress={() => Alert.alert(isTa ? "ஈட்டு நிகழ்வு" : "Record Breeding Event", isTa ? "AI கலப்பு அல்லது கன்று ஈனுதலை பதிவு செய்யவும்." : "Record AI insemination, heat check or calving.")}
            >
              <Text style={{ color: colors.primary, fontWeight: "700", textAlign: "center" }}>
                {isTa ? "+ புதிய இனப்பெருக்க நிகழ்வு" : "+ Record Insemination / Calving"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* HISTORY TAB CONTENT */}
        {activeTab === "History" && (
          <View style={{ gap: 12 }}>
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{ls.history}</Text>
            {animalHealth.length === 0 && animalMilk.length === 0 ? (
              <Text style={[styles.noData, { color: colors.mutedForeground }]}>
                {isTa ? "வரலாறு எதுவும் இல்லை" : "No history recorded yet"}
              </Text>
            ) : (
              [
                ...animalMilk.map((m) => ({ ...m, historyType: "milk" as const })),
                ...animalHealth.map((h) => ({ ...h, historyType: "health" as const })),
              ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 30)
                .map((item, index) => {
                  const isMilkItem = item.historyType === "milk";
                  const iconName = isMilkItem ? "bottle-wine-outline" : "stethoscope";
                  const iconColor = isMilkItem ? colors.accent : colors.primary;
                  const itemTitle = isMilkItem ? (isTa ? "பால் கறவை" : "Milk Session") : item.description;
                  const itemSubtitle = isMilkItem
                    ? `${getISTDateString(item.date)} — ${item.session === "morning" ? t.morning : t.evening}`
                    : new Date(item.date).toLocaleDateString(LOCALE_MAP[language] ?? "en-IN");
                  const itemValue = isMilkItem ? `${(item.quantity as number).toFixed(1)}L` : "";

                  return (
                    <View
                      key={index}
                      style={[
                        styles.healthEntry,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <View style={[styles.healthEntryIcon, { backgroundColor: iconColor + "18" }]}>
                        <MaterialCommunityIcons name={iconName as any} size={16} color={iconColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.healthEntryDesc, { color: colors.foreground }]}>{itemTitle}</Text>
                        <Text style={[styles.healthEntryDate, { color: colors.mutedForeground }]}>{itemSubtitle}</Text>
                      </View>
                      {itemValue !== "" && (
                        <Text style={[styles.healthEntryCost, { color: colors.foreground }]}>{itemValue}</Text>
                      )}
                    </View>
                  );
                })
            )}
          </View>
        )}

        {/* MILK LOGS TAB CONTENT */}
        {activeTab === "Milk logs" && (
          <View style={{ gap: 16 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{ls.milkLogs}</Text>
              <Pressable
                style={[styles.outlineBtn, { borderColor: colors.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEntryToEdit(null);
                  setMilkLogVisible(true);
                }}
              >
                <Text style={[styles.outlineBtnText, { color: colors.primary, fontWeight: "700" }]}>{t.animalDetailMilkLog}</Text>
              </Pressable>
            </View>

            {animalMilk.length === 0 ? (
              <Text style={[styles.noData, { color: colors.mutedForeground }]}>
                {t.animalDetailNoMilk}
              </Text>
            ) : (
              animalMilk.slice(0, 20).map((e) => (
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
                      {getISTDateString(e.date)} — {e.session === "morning" ? t.morning : t.evening}
                    </Text>
                    {e.fat && (
                      <Text style={[styles.milkEntryFat, { color: colors.mutedForeground }]}>
                        {t.fatPercentage}: {e.fat}%
                      </Text>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Text style={[styles.milkEntryQty, { color: colors.foreground }]}>
                      {e.quantity.toFixed(1)}L
                    </Text>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setEntryToEdit(e);
                        setMilkLogVisible(true);
                      }}
                      style={styles.entryActionBtn}
                      hitSlop={8}
                    >
                      <Feather name="edit-2" size={14} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteMilkEntry(e)}
                      style={styles.entryActionBtn}
                      hitSlop={8}
                    >
                      <Feather name="trash-2" size={14} color={colors.destructive} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <MilkLogModal
        visible={milkLogVisible}
        animal={animal}
        entryToEdit={entryToEdit}
        onClose={() => {
          setMilkLogVisible(false);
          setEntryToEdit(null);
        }}
      />
      <HealthNoteModal
        visible={healthNoteVisible}
        onClose={() => setHealthNoteVisible(false)}
        onSelect={handleSelectHealthNote}
      />

      {/* Herd Group Selection Bottom Sheet Modal */}
      <Modal
        visible={groupModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setGroupModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setGroupModalVisible(false)}
        >
          <View style={styles.modalSheetContainer}>
            <Pressable
              style={[
                styles.modalSheet,
                {
                  backgroundColor: colors.card,
                  paddingBottom: Math.max(insets.bottom, 32) + 24,
                },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  {isTa ? "மந்தைக் குழுவை மாற்றவும்" : "Change Herd Group"}
                </Text>
                <Pressable onPress={() => setGroupModalVisible(false)} hitSlop={8}>
                  <Feather name="x" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <View style={styles.sheetOptions}>
                {groupOptions.map((opt) => {
                  const isSelected = currentStatus === opt.status;
                  return (
                    <Pressable
                      key={opt.status}
                      onPress={() => {
                        setHerdStatus(opt.status);
                        setGroupModalVisible(false);
                      }}
                      style={[
                        styles.sheetOptionItem,
                        { borderColor: colors.border },
                        isSelected && [styles.sheetOptionItemActive, { borderColor: colors.primary, backgroundColor: colors.primary + "0c" }]
                      ]}
                    >
                      <View style={[styles.sheetOptionIcon, { backgroundColor: opt.badgeBg }]}>
                        <MaterialCommunityIcons name={opt.icon as any} size={18} color={opt.iconColor} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.sheetOptionName, { color: colors.foreground }, isSelected && { color: colors.primary, fontWeight: "700" }]}>
                          {opt.name}
                        </Text>
                        <Text style={[styles.sheetOptionDesc, { color: colors.mutedForeground }]}>
                          {opt.desc}
                        </Text>
                      </View>
                      {isSelected && (
                        <Feather name="check" size={16} color={colors.primary} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  scroll: { padding: 16, gap: 16 },

  // Summary Card (Top Row section)
  summaryCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#ffffff",
    gap: 12,
    minHeight: 165,
  },
  squarePhotoContainer: {
    width: 140,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f1f5f9",
  },
  squarePhoto: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  tagIconOverlay: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  badgeStatus: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  detailsGrid: {
    gap: 3,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailKey: {
    fontSize: 12.5,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  milkTodayContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Tab Bar styling
  tabsOuter: {
    borderBottomWidth: 1,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    alignItems: "center",
    height: 48,
    gap: 20,
  },
  tabButton: {
    height: "100%",
    justifyContent: "center",
    position: "relative",
    paddingHorizontal: 4,
  },
  tabText: {
    fontSize: 14.5,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  // Headings
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 16.5,
    fontWeight: "700",
  },
  planLink: {
    paddingVertical: 2,
  },
  planLinkText: {
    fontSize: 13.5,
    fontWeight: "600",
  },

  // Feed period bar
  feedSegmentBar: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  feedSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  feedSegmentBtnActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  feedSegmentText: {
    fontSize: 13,
  },

  // Milk Production Card
  cardContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  percentageBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentageText: {
    color: "#16a34a",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 2,
  },
  avgContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  avgValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  avgLabel: {
    fontSize: 11.5,
    marginTop: 1,
  },

  // Custom Bar Chart
  customChartWrapper: {
    height: 125,
    position: "relative",
    justifyContent: "flex-end",
    paddingTop: 10,
  },
  chartGridLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    paddingBottom: 22,
  },
  gridLineRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderStyle: "dashed",
    height: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
  gridScaleLabel: {
    fontSize: 9,
    marginTop: -6,
    backgroundColor: "#ffffff",
    paddingHorizontal: 2,
    zIndex: 2,
  },
  chartBarsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: "100%",
    paddingHorizontal: 4,
  },
  customBarCol: {
    alignItems: "center",
    width: "14%",
  },
  barFillWrapper: {
    height: 70,
    width: 14,
    justifyContent: "flex-end",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    overflow: "hidden",
  },
  customBarFill: {
    width: "100%",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  customBarQtyLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    marginTop: 4,
  },
  customBarDateLabel: {
    fontSize: 9,
    marginTop: 2,
  },

  // Table styling
  tableHeaderRow: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  tableBodyRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  colHeader: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  colBodyText: {
    fontSize: 13.5,
  },
  colFlex2: { flex: 2 },
  colFlex1: { flex: 1 },
  textRight: { textAlign: "right" },

  // Herd Group Card
  herdRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  herdIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  herdGroupName: {
    fontSize: 14.5,
    fontWeight: "700",
  },
  herdCount: {
    fontSize: 11.5,
    marginTop: 1,
  },
  outlineBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  outlineBtnText: {
    fontSize: 12.5,
    fontWeight: "600",
  },

  // Recent Activity List
  activityList: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 14,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  activityIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  activityTitle: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  activitySubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  activityValue: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Original Health Row
  sectionTitle: { fontSize: 17, fontWeight: "700", marginTop: 8 },
  healthRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  healthBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 48,
  },
  healthBtnText: { fontSize: 13, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
  },
  actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
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
  entryActionBtn: {
    padding: 4,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  milkEntryQty: { fontSize: 16, fontWeight: "700" },
  noData: { fontSize: 14, textAlign: "center", paddingVertical: 16 },
  notFound: { fontSize: 18, marginBottom: 12 },
  back: { fontSize: 16, fontWeight: "600" },

  // Modal Backdrop & Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalSheetContainer: {
    width: "100%",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sheetOptions: {
    gap: 12,
  },
  sheetOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  sheetOptionItemActive: {
    borderWidth: 1,
  },
  sheetOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetOptionName: {
    fontSize: 14.5,
    fontWeight: "600",
  },
  sheetOptionDesc: {
    fontSize: 11.5,
    marginTop: 2,
  },
});

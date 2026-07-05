import { Feather, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  useColorScheme,
} from "react-native";

import CelebrationOverlay from "@/components/CelebrationOverlay";
import StatCard from "@/components/StatCard";
import TaskItem from "@/components/TaskItem";
import { getTodayString, SmartAlert } from "@/context/AppContext";
import { useFarmer } from "@/context/FarmerContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

const LOCALE_MAP: Record<string, string> = {
  ta: "ta-IN", te: "te-IN", kn: "kn-IN", ml: "ml-IN", hi: "hi-IN", en: "en-IN",
};

import Constants from "expo-constants";

// Guard notification handler for Expo Go
if (Constants.appOwnership !== 'expo' || Platform.OS === 'web') {
  try {
    const Notifications = require("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn("Notifications handler setup failed", e);
  }
}

const CONTEXT_HINTS: Record<string, string[]> = {
  ta: ["காலை கறவை நேரம் — பால் பதிவு செய்யவும்", "மதிய நேர கவனிப்பு — தண்ணீர் மற்றும் தீவனம்", "மாலை கறவை நேரம் — இன்றைய கணக்கு பதிவு"],
  te: ["ఉదయం పాలు పిండే సమయం — పాలు నమోదు చేయండి", "మధ్యాహ్నం తనిఖీ — నీరు మరియు మేత", "సాయంత్రం పాలు పిండే సమయం — లెక్కలు నమోదు"],
  kn: ["ಬೆಳಿಗ್ಗೆ ಹಾಲು ಕರೆಯುವ ಸಮಯ — ದಾಖಲಿಸಿ", "ಮಧ್ಯಾಹ್ನ ತಪಾಸಣೆ — ನೀರು ಮತ್ತು ಮೇವು", "ಸಂಜೆ ಹಾಲು ಕರೆಯುವ ಸಮಯ — ಲೆಕ್ಕ ದಾಖಲಿಸಿ"],
  ml: ["രാവിലെ പാൽ കറക്കൽ — രേഖ", "ഉച്ചനേരം — വെള്ളം & തീറ്റ", "വൈകുന്നേരം പാൽ കറക്കൽ — കണക്ക് നൽകൂ"],
  hi: ["सुबह दूध दोहने का समय — दूध दर्ज करें", "दोपहर की जाँच — पानी और चारा", "शाम दूध दोहने का समय — आज का हिसाब लिखें"],
  en: ["Morning milking time — log your milk", "Afternoon check — water & feed", "Evening milking time — record today's accounts"],
};

const HELLO_LABELS: Record<string, string> = {
  ta: "வணக்கம்,", te: "నమస్కారం,", kn: "ನಮಸ್ಕಾರ,", ml: "നമസ്കാരം,", hi: "नमस्ते,", en: "Hello,",
};

function getContextHint(language: string): string {
  const h = new Date().getHours();
  const hints = CONTEXT_HINTS[language] ?? CONTEXT_HINTS.en!;
  if (h < 10) return hints[0]!;
  if (h < 15) return hints[1]!;
  return hints[2]!;
}

function getWeatherMock() {
  const h = new Date().getHours();
  if (h < 8) return { icon: "cloud", text: "28°C" };
  if (h < 14) return { icon: "sun", text: "34°C" };
  return { icon: "cloud-rain", text: "30°C" };
}

const ALERT_CONFIG: Record<SmartAlert["type"], { iconName: keyof typeof Feather.glyphMap; bgColor: string; darkBgColor: string; textColor: string; darkTextColor: string }> = {
  heat: { iconName: "thermometer", bgColor: "#fff7ed", darkBgColor: "#3b1f06", textColor: "#c2410c", darkTextColor: "#fb923c" },
  calving: { iconName: "heart", bgColor: "#fffbeb", darkBgColor: "#3b2f06", textColor: "#92400e", darkTextColor: "#fbbf24" },
  vaccine: { iconName: "activity", bgColor: "#eff6ff", darkBgColor: "#0c1e3b", textColor: "#1d4ed8", darkTextColor: "#60a5fa" },
  dry_off: { iconName: "slash", bgColor: "#f9fafb", darkBgColor: "#1a1e14", textColor: "#374151", darkTextColor: "#9ca3af" },
};

async function setupDailyNotification() {
  if (Constants.appOwnership === 'expo' && Platform.OS !== 'web') {
    return;
  }

  try {
    const Notifications = require("expo-notifications");
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (Platform.OS !== "web") {
      await Notifications.scheduleNotificationAsync({
        content: { title: "காலை கறவை நேரம்!", body: "ThulirFarm: காலை 5:30 AM — பால் பதிவு செய்யவும்.", sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 5, minute: 30 },
      });
      await Notifications.scheduleNotificationAsync({
        content: { title: "மாலை கறவை நேரம்!", body: "ThulirFarm: மாலை 4:00 PM — கணக்கு தயார் செய்யவும்.", sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 16, minute: 0 },
      });
    }
  } catch { /* ignore */ }
}

import { useTasks } from "../../src/modules/tasks/hooks/useTasks";
import { useFarm } from "../../src/modules/farms/hooks/useFarm";
import { useMilk } from "../../src/modules/milk/hooks/useMilk";
import { useFinance } from "../../src/modules/finance/hooks/useFinance";
import { useAnimals } from "../../src/modules/animals/hooks/useAnimals";
import { useBreeding } from "../../src/modules/breeding/hooks/useBreeding";
import { useVaccination } from "../../src/modules/vaccination/hooks/useVaccination";
import { computeSmartAlerts } from "../../src/modules/dashboard/services/smartAlerts";
import { detectMilkAnomalies } from "../../src/modules/milk/services/anomalyDetector";
import { computeTodayIncome, computeTodayExpenses } from "../../src/modules/finance/services/financeSummary";
import { getISTDateString } from "../../utils/date";

export default function TodayTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const { animals, loading: animalsLoading } = useAnimals();
  const { milkEntries, loading: milkLoading } = useMilk();
  const { incomeEntries, expenseEntries } = useFinance();
  const { breedingEvents } = useBreeding();
  const { vaccinations } = useVaccination();
  const { tasks, generateDailyTasks, refresh: refreshTasks, toggleTaskComplete, createTask } = useTasks();
  const { activeFarm } = useFarm();
  const { farmer } = useFarmer();
  const [celebration, setCelebration] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const progressAnim = useMemo(() => new Animated.Value(0), []);

  const [showAllTasks, setShowAllTasks] = useState(false);
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("8:00 AM");
  const [newTaskSession, setNewTaskSession] = useState("morning");
  const [newTaskType, setNewTaskType] = useState<string>("other");
  const [addingTask, setAddingTask] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("milking");
  const [timeDropdownVisible, setTimeDropdownVisible] = useState(false);
  const [customTimeMode, setCustomTimeMode] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const today = getTodayString();
  const todayStr = getISTDateString();
  const todayTasks = tasks.filter((task) => task.formattedDateString === today);
  const completedCount = todayTasks.filter((task) => task.completed).length;
  const totalCount = todayTasks.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  // Compute all stats from modular sources
  const milkTotal = useMemo(
    () => milkEntries.filter((e) => getISTDateString(e.date) === todayStr).reduce((s, e) => s + e.quantity, 0),
    [milkEntries, todayStr]
  );
  const income = useMemo(() => computeTodayIncome(incomeEntries), [incomeEntries]);
  const expenses = useMemo(() => computeTodayExpenses(expenseEntries), [expenseEntries]);
  const smartAlerts = useMemo(
    () => computeSmartAlerts(animals, breedingEvents, vaccinations),
    [animals, breedingEvents, vaccinations]
  );
  const milkAnomalies = useMemo(
    () => detectMilkAnomalies(animals, milkEntries),
    [animals, milkEntries]
  );

  // Sync indicator derived from real loading state
  const isLoading = animalsLoading || milkLoading;
  const syncStatus = isLoading ? "pending" : "synced";
  const isLoaded = !isLoading;

  useEffect(() => {
    generateDailyTasks(today).catch(err => console.error(err));
  }, [today]);

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progress, duration: 500, useNativeDriver: false }).start();
    // Disable auto-celebration for now to debug stability
    /*
    if (progress === 1 && totalCount > 0) {
      setCelebration(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) { console.warn(e); }
    }
    */
  }, [progress]);

  const hint = getContextHint(language);
  const weather = getWeatherMock();

  const h = new Date().getHours();
  const greetingText = h < 5 ? t.goodNight : h < 12 ? t.goodMorning : h < 17 ? t.goodAfternoon : t.goodEvening;

  const pendingCount = todayTasks.filter(t => !t.completed).length;
  const displayedTasks = showAllTasks ? todayTasks : todayTasks.slice(0, 4);

  const handleToggleTask = async (task: any) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    try {
      await toggleTaskComplete(Number(task.id));
      await refreshTasks();
    } catch (err) {
      console.error("[TodayTab] Failed to toggle task:", err);
    }
  };

  const QUICK_TEMPLATES = [
    { id: "milking", title: "Milking", time: "6:00 AM", session: "morning", type: "milk", icon: "bucket-outline", color: "#16a34a", bgColor: "#f0fdf4", label: "Milking" },
    { id: "feed", title: "Feed Cows", time: "8:00 AM", session: "morning", type: "feed", icon: "sprout", color: "#d97706", bgColor: "#fffbeb", label: "Feed Cows" },
    { id: "vaccinate", title: "Vaccinate", time: "10:00 AM", session: "morning", type: "vaccination", icon: "syringe", color: "#9333ea", bgColor: "#faf5ff", label: "Vaccinate" },
    { id: "clean", title: "Clean Shed", time: "11:00 AM", session: "morning", type: "clean", icon: "broom", color: "#0284c7", bgColor: "#f0f9ff", label: "Clean Shed" },
    { id: "health", title: "Health Check", time: "4:00 PM", session: "evening", type: "health", icon: "heart-pulse", color: "#dc2626", bgColor: "#fef2f2", label: "Health Check" },
    { id: "purchase", title: "Purchase Feed", time: "12:00 PM", session: "anytime", type: "feed", icon: "cart-outline", color: "#475569", bgColor: "#f1f5f9", label: "Purchase Feed" },
  ];

  const handleSelectTemplate = (tmpl: any) => {
    setSelectedTemplateId(tmpl.id);
    setNewTaskTitle(tmpl.title);
    setNewTaskTime(tmpl.time);
    setNewTaskSession(tmpl.session);
    setNewTaskType(tmpl.type);
  };

  const handleSaveTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert("Error", "Please enter a task title");
      return;
    }
    setAddingTask(true);
    try {
      await createTask({
        farmId: activeFarm?.id || "default",
        title: newTaskTitle.trim(),
        time: newTaskTime.trim(),
        session: newTaskSession,
        date: today,
        type: newTaskType as any,
        priority: "normal",
      });
      setAddTaskModalVisible(false);
      setNewTaskTitle("");
      setNewTaskTime("8:00 AM");
      setNewTaskSession("morning");
      setNewTaskType("other");
      setSelectedTemplateId("milking");
      await refreshTasks();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create task");
    } finally {
      setAddingTask(false);
    }
  };

  const healthyCount = animals.filter((a) => a.healthStatus === "healthy").length;
  const needsAttention = animals.filter((a) => a.healthStatus !== "healthy").length;

  const syncDot = syncStatus === "synced" ? colors.success : syncStatus === "pending" ? colors.warning : colors.destructive;
  const syncLabel = syncStatus === "synced"
    ? `✓ ${t.savedLabel}`
    : syncStatus === "pending"
      ? `⏳ ${t.savingLabel}`
      : "⚠ offline";

  const criticalAlerts = smartAlerts.filter((a) => a.priority === "critical");
  const highAlerts = smartAlerts.filter((a) => a.priority === "high");
  const normalAlerts = smartAlerts.filter((a) => a.priority === "normal");

  const getAlertMessage = (alert: SmartAlert) =>
    language === "ta" ? alert.messageTamil : alert.message;

  const getHealthLabel = (status: string) => {
    if (status === "healthy") return t.healthy;
    if (status === "critical") return t.critical;
    return t.attention;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshTasks()]);
      await generateDailyTasks(today);
    } catch (e) {
      console.error('Refresh failed', e);
    }
    setRefreshing(false);
  };

  const isDark = useColorScheme() === "dark";

  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground, marginTop: 12 }]}>
          {t.loadingTasks}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 120 : 100 + insets.bottom, paddingTop: topPad + 12 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {/* Greeting Row */}
        <View style={styles.greetingRow}>
          <Pressable style={styles.todayProfileBtn} onPress={() => router.push("/profile")} hitSlop={8}>
            <View style={[styles.todayProfileCircle, { backgroundColor: farmer?.avatarColor ?? colors.primary }]}>
              <Text style={styles.todayProfileInitial}>
                {farmer?.name ? farmer.name.trim()[0]!.toUpperCase() : "?"}
              </Text>
            </View>
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.greeting, { color: colors.foreground }]}>
              {farmer?.name
                ? `${HELLO_LABELS[language] ?? HELLO_LABELS.en} ${farmer.name.split(" ")[0]}!`
                : greetingText}
            </Text>
            <Text style={[styles.greetingSub, { color: colors.mutedForeground }]}>{hint}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
              {new Date().toLocaleDateString(LOCALE_MAP[language] ?? "en-IN", { weekday: "short", month: "short", day: "numeric" })}
            </Text>
            <View style={[styles.weatherBadge, { backgroundColor: colors.muted }]}>
              <Feather name={weather.icon as any} size={12} color={colors.accent} />
              <Text style={[styles.weatherText, { color: colors.mutedForeground }]}>{weather.text}</Text>
            </View>
          </View>
        </View>

        {/* Sync row */}
        <View style={[styles.syncRow, { backgroundColor: syncDot + "15", borderColor: syncDot + "40" }]}>
          <View style={[styles.syncDot, { backgroundColor: syncDot }]} />
          <Text style={[styles.syncLabel, { color: syncDot }]}>{syncLabel}</Text>
          {!notifEnabled && Platform.OS !== "web" && (
            <Pressable
              style={[styles.notifBtn, { backgroundColor: colors.accent + "20" }]}
              onPress={async () => {
                await setupDailyNotification();
                setNotifEnabled(true);
                Alert.alert("✓", t.remindersSet);
              }}
            >
              <Feather name="bell" size={12} color={colors.accent} />
              <Text style={[styles.notifBtnText, { color: colors.accent }]}>{t.reminders}</Text>
            </Pressable>
          )}
        </View>

        {/* Smart Alerts */}
        {smartAlerts.length > 0 && (
          <View style={styles.alertsSection}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <Feather name="bell" size={16} color={colors.foreground} />
              <Text style={[styles.alertsSectionTitle, { color: colors.foreground, marginBottom: 0 }]}>
                {t.todayAlerts} ({smartAlerts.length})
              </Text>
            </View>

            {[...criticalAlerts, ...highAlerts, ...normalAlerts].map((alert) => {
              const cfg = ALERT_CONFIG[alert.type];
              const bg = isDark ? cfg.darkBgColor : cfg.bgColor;
              const tc = isDark ? cfg.darkTextColor : cfg.textColor;
              return (
                <Pressable
                  key={alert.id}
                  style={[styles.smartAlertCard, { backgroundColor: bg, borderColor: alert.priority === "critical" ? colors.destructive : alert.priority === "high" ? colors.warning : colors.border }]}
                  onPress={() => router.push(`/(tabs)` as any)}
                >
                  <View style={styles.smartAlertLeft}>
                    <Feather name={cfg.iconName} size={24} color={tc} />
                    {alert.priority === "critical" && <View style={[styles.criticalDot, { backgroundColor: colors.destructive }]} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.smartAlertAnimal, { color: tc }]}>{alert.animalName}</Text>
                    <Text style={[styles.smartAlertMsg, { color: tc }]}>
                      {getAlertMessage(alert)}
                    </Text>
                  </View>
                  {alert.priority === "critical" && (
                    <View style={[styles.urgentBadge, { backgroundColor: colors.destructive }]}>
                      <Text style={styles.urgentBadgeText}>{t.urgentLabel}</Text>
                    </View>
                  )}
                  {alert.priority === "high" && (
                    <View style={[styles.highBadge, { backgroundColor: colors.warning }]}>
                      <Text style={styles.highBadgeText}>{t.highLabel}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Milk anomaly alerts */}
        {milkAnomalies.length > 0 && (
          <View style={[styles.alertCard, { backgroundColor: isDark ? "#3b1111" : "#fef2f2", borderColor: colors.destructive }]}>
            <Feather name="alert-triangle" size={16} color={colors.destructive} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: colors.destructive }]}>
                {t.milkDropAlert}
              </Text>
              {milkAnomalies.map((a) => (
                <Text key={a.animalId} style={[styles.alertItem, { color: isDark ? "#fca5a5" : "#7f1d1d" }]}>
                  • {a.animalName}: {a.dropPercent}% {t.milkDropSuffix} ({a.todayTotal.toFixed(1)}L vs {t.avgPrefix} {a.avgTotal.toFixed(1)}L)
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Stats row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 8 }}>
          <StatCard icon="droplet" label={t.milkToday} value={`${milkTotal.toFixed(1)}L`} iconColor={colors.primary} trend={milkTotal > 10 ? "up" : "neutral"} sub={`${animals.length} ${t.animalsCountSuffix}`} />
          <StatCard icon="trending-up" label={t.income} value={`₹${income.toLocaleString("en-IN")}`} iconColor={colors.success} trend={income > 0 ? "up" : "neutral"} />
          <StatCard icon="package" label={t.expense} value={`₹${expenses.toLocaleString("en-IN")}`} iconColor={colors.warning} trend="neutral" />
          <StatCard icon="heart" label={t.health} value={`${healthyCount}/${animals.length}`} iconColor={needsAttention > 0 ? colors.destructive : colors.success} sub={needsAttention > 0 ? `${needsAttention} ${t.attention}` : t.healthy} />
          <StatCard icon="check-circle" label={t.tasks} value={`${completedCount}/${totalCount}`} iconColor={completedCount === totalCount && totalCount > 0 ? colors.success : colors.accent} />
        </ScrollView>

        {/* Today's Tasks Card */}
        <View style={styles.tasksCard}>
          {/* Card Header */}
          <View style={styles.tasksHeader}>
            <View style={styles.tasksHeaderLeft}>
              <View style={styles.calendarIconContainer}>
                <Feather name="calendar" size={20} color="#16a34a" />
              </View>
              <View>
                <Text style={styles.tasksTitle}>Today's Tasks</Text>
                <Text style={styles.tasksSubtitle}>
                  {pendingCount === 0 ? "All tasks completed!" : `${pendingCount} pending task${pendingCount !== 1 ? 's' : ''}`}
                </Text>
              </View>
            </View>
            <Pressable style={styles.addTaskBtn} onPress={() => setAddTaskModalVisible(true)}>
              <Feather name="plus" size={14} color="#16a34a" />
              <Text style={styles.addTaskBtnText}>Add Task</Text>
            </Pressable>
          </View>

          {/* Tasks List */}
          <View style={styles.tasksList}>
            {displayedTasks.map((task) => {
              const displayTitle = task.title;
              return (
                <View key={task.id} style={styles.taskRow}>
                  {/* Check Button */}
                  <Pressable 
                    style={[styles.checkBtn, task.completed && styles.checkBtnCompleted]} 
                    onPress={() => handleToggleTask(task)}
                  >
                    {task.completed && <Feather name="check" size={14} color="#ffffff" />}
                  </Pressable>

                  {/* Title & Time */}
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>
                      {displayTitle}
                    </Text>
                    <Text style={styles.taskTime}>{task.time}</Text>
                  </View>

                  {/* Right Status */}
                  {task.completed ? (
                    <View style={styles.doneBadge}>
                      <Text style={styles.doneBadgeText}>Done</Text>
                    </View>
                  ) : (
                    <Pressable style={styles.arrowBtn} onPress={() => handleToggleTask(task)}>
                      <Feather name="chevron-right" size={16} color="#9ca3af" />
                    </Pressable>
                  )}
                </View>
              );
            })}

            {todayTasks.length === 0 && (
              <View style={styles.emptyTasksContainer}>
                <Text style={styles.emptyTasksText}>No tasks for today.</Text>
              </View>
            )}
          </View>

          {/* Card Footer */}
          {todayTasks.length > 4 && (
            <Pressable 
              style={styles.tasksFooter} 
              onPress={() => setShowAllTasks(!showAllTasks)}
            >
              <Text style={styles.footerLinkText}>
                {showAllTasks ? "Show Less" : "View All Tasks"}
              </Text>
              <Feather name={showAllTasks ? "chevron-up" : "chevron-right"} size={14} color="#16a34a" />
            </Pressable>
          )}
        </View>

        {/* Animal health summary */}
        {animals.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>
              {t.herdStatus}
            </Text>
            {animals.map((a) => {
              const sc = a.healthStatus === "healthy" ? colors.success : a.healthStatus === "critical" ? colors.destructive : colors.warning;
              const sl = getHealthLabel(a.healthStatus);
              return (
                <View key={a.id} style={[styles.animalStatusRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name={a.type === "buffalo" ? "water" : a.type === "calf" ? "baby-bottle" : "cow"} size={28} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.animalName, { color: colors.foreground }]}>{a.name}</Text>
                    {a.isPregnant && a.expectedCalvingDate && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <Feather name="heart" size={10} color={colors.mutedForeground} />
                        <Text style={[styles.animalSubInfo, { color: colors.mutedForeground, marginTop: 0 }]}>{t.pregnantLabel} · {t.calvingExpected} {getISTDateString(a.expectedCalvingDate)}</Text>
                      </View>
                    )}
                    {a.lactationNumber != null && (
                      <Text style={[styles.animalSubInfo, { color: colors.mutedForeground }]}>L{a.lactationNumber} {t.milkToday}</Text>
                    )}
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: sc + "20" }]}>
                    <View style={[styles.statusDot, { backgroundColor: sc }]} />
                    <Text style={[styles.statusLabel, { color: sc }]}>{sl}</Text>
                  </View>
                  {a.lastMilkEntry && (
                    <Text style={[styles.milkLabel, { color: colors.mutedForeground }]}>
                      {a.lastMilkEntry.quantity.toFixed(1)}L
                    </Text>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <CelebrationOverlay
        visible={celebration}
        message={t.allTasksDone}
        messageTamil="அனைத்து பணிகளும் முடிந்தது!"
        onHide={() => setCelebration(false)}
      />

      {/* Add Task Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addTaskModalVisible}
        onRequestClose={() => setAddTaskModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add New Task</Text>
              <Pressable style={styles.closeBtn} onPress={() => setAddTaskModalVisible(false)} hitSlop={8}>
                <Feather name="x" size={18} color="#374151" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* Quick Templates Section */}
              <Text style={styles.templateSectionTitle}>Quick Templates</Text>
              <Text style={styles.templateSectionSub}>Tap a template to auto-fill details</Text>

              <View style={styles.templatesGrid}>
                {QUICK_TEMPLATES.map((tmpl) => (
                  <Pressable
                    key={tmpl.id}
                    style={[
                      styles.templateCard,
                      { backgroundColor: tmpl.bgColor },
                      tmpl.id === "custom" && styles.templateCardCustom,
                      selectedTemplateId === tmpl.id && { borderColor: tmpl.color, borderWidth: 1.5 },
                    ]}
                    onPress={() => handleSelectTemplate(tmpl)}
                  >
                    <View style={[styles.templateIconWrap, { backgroundColor: "#ffffff" }]}>
                      {tmpl.id === "vaccinate" ? (
                        <FontAwesome5 name="syringe" size={14} color={tmpl.color} />
                      ) : (
                        <MaterialCommunityIcons name={tmpl.icon as any} size={18} color={tmpl.color} />
                      )}
                    </View>
                    <View style={styles.templateTextWrap}>
                      <Text style={styles.templateCardTitle}>{tmpl.label}</Text>
                      <Text style={styles.templateCardSub}>
                        {tmpl.id === "custom" ? "Create your own" : tmpl.time}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              {/* Input Form */}
              <Text style={styles.inputLabel}>Task Title</Text>
              <TextInput
                style={styles.textInput}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="e.g., Feed Cows"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.inputLabel}>Time</Text>
              <Pressable 
                style={styles.selectBox} 
                onPress={() => setTimeDropdownVisible(!timeDropdownVisible)}
              >
                <View style={styles.selectBoxLeft}>
                  <Feather name="clock" size={14} color="#6b7280" />
                  <Text style={styles.selectBoxText}>{newTaskTime}</Text>
                </View>
                <Feather name="chevron-down" size={14} color="#6b7280" />
              </Pressable>

              {timeDropdownVisible && (
                <View style={styles.dropdownList}>
                  {["6:00 AM", "8:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "4:00 PM", "6:00 PM"].map((tOption) => (
                    <Pressable
                      key={tOption}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setNewTaskTime(tOption);
                        setTimeDropdownVisible(false);
                        setCustomTimeMode(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{tOption}</Text>
                    </Pressable>
                  ))}
                  <Pressable
                    key="custom-time-option"
                    style={styles.dropdownOption}
                    onPress={() => {
                      setTimeDropdownVisible(false);
                      setCustomTimeMode(true);
                    }}
                  >
                    <Text style={[styles.dropdownOptionText, { color: "#16a34a", fontWeight: "600" }]}>Custom...</Text>
                  </Pressable>
                </View>
              )}

              {customTimeMode && (
                <TextInput
                  style={[styles.textInput, { marginTop: 6 }]}
                  value={newTaskTime}
                  onChangeText={setNewTaskTime}
                  placeholder="Enter custom time (e.g. 2:30 PM)"
                  placeholderTextColor="#9ca3af"
                  autoFocus
                  onBlur={() => setCustomTimeMode(false)}
                />
              )}

            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                style={[styles.modalActionBtn, styles.modalCancelBtn]}
                onPress={() => setAddTaskModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalActionBtn, styles.modalSaveBtn]}
                onPress={handleSaveTask}
                disabled={addingTask}
              >
                {addingTask ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSaveText}>Add Task</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 14 },
  greetingRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  greeting: { fontSize: 20, fontWeight: "700" },
  greetingSub: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  todayProfileBtn: { padding: 2 },
  todayProfileCircle: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  todayProfileInitial: { color: "#fff", fontSize: 17, fontWeight: "700" },
  dateText: { fontSize: 12, fontWeight: "500" },
  weatherBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  weatherText: { fontSize: 11 },
  syncRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  syncLabel: { flex: 1, fontSize: 12, fontWeight: "600" },
  notifBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  notifBtnText: { fontSize: 11, fontWeight: "600" },
  alertsSection: { gap: 8 },
  alertsSectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  smartAlertCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 14, borderWidth: 1.5,
  },
  smartAlertLeft: { position: "relative" },
  criticalDot: {
    position: "absolute", top: 0, right: 0,
    width: 8, height: 8, borderRadius: 4,
  },
  smartAlertAnimal: { fontSize: 13, fontWeight: "800" },
  smartAlertMsg: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  urgentBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  urgentBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  highBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  highBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  alertCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1.5 },
  alertTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  alertItem: { fontSize: 12, marginTop: 2 },
  progressCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontSize: 15, fontWeight: "600" },
  progressPct: { fontSize: 15, fontWeight: "700" },
  progressBg: { height: 12, borderRadius: 6, overflow: "hidden" },
  progressFill: { height: 12, borderRadius: 6 },
  progressSub: { fontSize: 11 },
  sessionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  sessionLabel: { fontSize: 16, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 15 },
  animalStatusRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 10 },
  animalName: { fontSize: 14, fontWeight: "600" },
  animalSubInfo: { fontSize: 11, marginTop: 2 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontSize: 11, fontWeight: "600" },
  milkLabel: { fontSize: 13, fontWeight: "600" },

  // Today's Tasks custom card styles
  tasksCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  tasksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tasksHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  calendarIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  tasksTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  tasksSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 1,
  },
  addTaskBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#16a34a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
  },
  addTaskBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16a34a",
  },
  tasksList: {
    gap: 12,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  checkBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkBtnCompleted: {
    borderColor: "#16a34a",
    backgroundColor: "#16a34a",
  },
  taskInfo: {
    flex: 1,
  },
  taskText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  taskTextCompleted: {
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
  taskTime: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  doneBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  doneBadgeText: {
    fontSize: 11,
    color: "#16a34a",
    fontWeight: "600",
  },
  emptyTasksContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyTasksText: {
    color: "#9ca3af",
    fontSize: 13,
  },
  tasksFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 14,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  footerLinkText: {
    fontSize: 13,
    color: "#16a34a",
    fontWeight: "600",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  templateSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginTop: 4,
  },
  templateSectionSub: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 12,
  },
  templatesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
    columnGap: 8,
    marginBottom: 12,
  },
  templateCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  templateCardCustom: {
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
  },
  templateIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  templateTextWrap: {
    flex: 1,
  },
  templateCardTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1f2937",
  },
  templateCardSub: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 1,
  },
  selectBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
  },
  selectBoxLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectBoxText: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  dropdownOptionText: {
    fontSize: 13,
    color: "#374151",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#f8fafc",
  },
  sessionSelectRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  sessionSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  sessionSelectBtnActive: {
    borderColor: "#16a34a",
    backgroundColor: "#f0fdf4",
  },
  sessionSelectText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  sessionSelectTextActive: {
    color: "#16a34a",
    fontWeight: "600",
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtn: {
    backgroundColor: "#f1f5f9",
  },
  modalCancelText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 14,
  },
  modalSaveBtn: {
    backgroundColor: "#16a34a",
  },
  modalSaveText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
});

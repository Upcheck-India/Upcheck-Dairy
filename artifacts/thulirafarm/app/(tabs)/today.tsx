import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CelebrationOverlay from "@/components/CelebrationOverlay";
import StatCard from "@/components/StatCard";
import TaskItem from "@/components/TaskItem";
import { useApp, SmartAlert } from "@/context/AppContext";
import { useFarmer } from "@/context/FarmerContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

const ALERT_CONFIG: Record<SmartAlert["type"], { emoji: string; bgColor: string; textColor: string }> = {
  heat: { emoji: "🌡️", bgColor: "#fff7ed", textColor: "#c2410c" },
  calving: { emoji: "🐣", bgColor: "#fffbeb", textColor: "#92400e" },
  vaccine: { emoji: "💉", bgColor: "#eff6ff", textColor: "#1d4ed8" },
  dry_off: { emoji: "🛑", bgColor: "#f9fafb", textColor: "#374151" },
};

async function setupDailyNotification() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (Platform.OS !== "web") {
      await Notifications.scheduleNotificationAsync({
        content: { title: "🐄 காலை கறவை நேரம்!", body: "ThulirFarm: காலை 5:30 AM — பால் பதிவு செய்யவும்.", sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 5, minute: 30 },
      });
      await Notifications.scheduleNotificationAsync({
        content: { title: "🌆 மாலை கறவை நேரம்!", body: "ThulirFarm: மாலை 4:00 PM — கணக்கு தயார் செய்யவும்.", sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 16, minute: 0 },
      });
    }
  } catch { /* ignore */ }
}

export default function TodayTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const {
    tasks, generateDailyTasks, getTodayMilkTotal, getTodayIncome, getTodayExpenses,
    animals, syncStatus, milkAnomalies, smartAlerts,
  } = useApp();
  const { farmer } = useFarmer();
  const [celebration, setCelebration] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const progressAnim = useMemo(() => new Animated.Value(0), []);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const today = new Date().toISOString().split("T")[0]!;
  const todayTasks = tasks.filter((task) => task.date === today);
  const completedCount = todayTasks.filter((task) => task.completed).length;
  const totalCount = todayTasks.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  useEffect(() => { generateDailyTasks(); }, []);

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progress, duration: 500, useNativeDriver: false }).start();
    if (progress === 1 && totalCount > 0) {
      setCelebration(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [progress]);

  const milkTotal = getTodayMilkTotal();
  const income = getTodayIncome();
  const expenses = getTodayExpenses();
  const hint = getContextHint(language);
  const weather = getWeatherMock();

  // Greeting text using t keys
  const h = new Date().getHours();
  const greetingText = h < 5 ? t.goodNight : h < 12 ? t.goodMorning : h < 17 ? t.goodAfternoon : t.goodEvening;

  const morningTasks = todayTasks.filter((task) => task.session === "morning");
  const eveningTasks = todayTasks.filter((task) => task.session === "evening");

  const healthyCount = animals.filter((a) => a.healthStatus === "healthy").length;
  const needsAttention = animals.filter((a) => a.healthStatus !== "healthy").length;

  const syncDot = syncStatus === "synced" ? "#22c55e" : syncStatus === "pending" ? "#f97316" : "#ef4444";
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 120 : 100, paddingTop: topPad + 12 }]}
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
              {new Date().toLocaleDateString("ta-IN", { weekday: "short", month: "short", day: "numeric" })}
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
            <Text style={[styles.alertsSectionTitle, { color: colors.foreground }]}>
              🔔 {t.todayAlerts} ({smartAlerts.length})
            </Text>

            {[...criticalAlerts, ...highAlerts, ...normalAlerts].map((alert) => {
              const cfg = ALERT_CONFIG[alert.type];
              return (
                <Pressable
                  key={alert.id}
                  style={[styles.smartAlertCard, { backgroundColor: cfg.bgColor, borderColor: alert.priority === "critical" ? "#dc2626" : alert.priority === "high" ? "#f97316" : "#dbeafe" }]}
                  onPress={() => router.push(`/(tabs)` as any)}
                >
                  <View style={styles.smartAlertLeft}>
                    <Text style={styles.smartAlertEmoji}>{cfg.emoji}</Text>
                    {alert.priority === "critical" && <View style={styles.criticalDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.smartAlertAnimal, { color: cfg.textColor }]}>{alert.animalName}</Text>
                    <Text style={[styles.smartAlertMsg, { color: cfg.textColor }]}>
                      {getAlertMessage(alert)}
                    </Text>
                  </View>
                  {alert.priority === "critical" && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentBadgeText}>{t.urgentLabel}</Text>
                    </View>
                  )}
                  {alert.priority === "high" && (
                    <View style={styles.highBadge}>
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
          <View style={[styles.alertCard, { backgroundColor: "#fef2f2", borderColor: "#ef4444" }]}>
            <Feather name="alert-triangle" size={16} color="#ef4444" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: "#dc2626" }]}>
                ⚠ {t.milkDropAlert}
              </Text>
              {milkAnomalies.map((a) => (
                <Text key={a.animalId} style={styles.alertItem}>
                  • {a.animalName}: {a.dropPercent}% {t.milkDropSuffix} ({a.todayTotal.toFixed(1)}L vs {t.avgPrefix} {a.avgTotal.toFixed(1)}L)
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Stats row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 8 }}>
          <StatCard icon="droplet" label="Milk Today" labelTamil="இன்று பால்" value={`${milkTotal.toFixed(1)}L`} iconColor={colors.primary} trend={milkTotal > 10 ? "up" : "neutral"} sub={`${animals.length} ${t.animalsCountSuffix}`} />
          <StatCard icon="trending-up" label="Income" labelTamil="வருமானம்" value={`₹${income.toLocaleString("en-IN")}`} iconColor="#22c55e" trend={income > 0 ? "up" : "neutral"} />
          <StatCard icon="package" label="Expenses" labelTamil="செலவு" value={`₹${expenses.toLocaleString("en-IN")}`} iconColor={colors.warning} trend="neutral" />
          <StatCard icon="heart" label="Health" labelTamil="உடல்நிலை" value={`${healthyCount}/${animals.length}`} iconColor={needsAttention > 0 ? colors.destructive : "#22c55e"} sub={needsAttention > 0 ? `${needsAttention} ${t.attention}` : t.healthy} />
          <StatCard icon="check-circle" label="Tasks" labelTamil="பணிகள்" value={`${completedCount}/${totalCount}`} iconColor={completedCount === totalCount && totalCount > 0 ? "#22c55e" : colors.accent} />
        </ScrollView>

        {/* Progress bar */}
        {totalCount > 0 && (
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.foreground }]}>{t.progress}</Text>
              <Text style={[styles.progressPct, { color: colors.primary }]}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: progress === 1 ? "#22c55e" : colors.primary,
                    width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressSub, { color: colors.mutedForeground }]}>
              {completedCount} / {totalCount} {t.tasks}
            </Text>
          </View>
        )}

        {/* Morning tasks */}
        {morningTasks.length > 0 && (
          <>
            <View style={styles.sessionHeader}>
              <Feather name="sun" size={16} color={colors.accent} />
              <Text style={[styles.sessionLabel, { color: colors.foreground }]}>🌅 {t.morningTasks}</Text>
            </View>
            {morningTasks.map((task) => <TaskItem key={task.id} task={task} />)}
          </>
        )}

        {/* Evening tasks */}
        {eveningTasks.length > 0 && (
          <>
            <View style={[styles.sessionHeader, { marginTop: 12 }]}>
              <Feather name="moon" size={16} color={colors.primary} />
              <Text style={[styles.sessionLabel, { color: colors.foreground }]}>🌆 {t.eveningTasks}</Text>
            </View>
            {eveningTasks.map((task) => <TaskItem key={task.id} task={task} />)}
          </>
        )}

        {totalCount === 0 && (
          <View style={styles.empty}>
            <Feather name="calendar" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {t.loadingTasks}
            </Text>
          </View>
        )}

        {/* Animal health summary */}
        {animals.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>
              {t.herdStatus}
            </Text>
            {animals.map((a) => {
              const sc = a.healthStatus === "healthy" ? "#22c55e" : a.healthStatus === "critical" ? "#ef4444" : "#f97316";
              const sl = getHealthLabel(a.healthStatus);
              return (
                <View key={a.id} style={[styles.animalStatusRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={styles.animalEmoji}>{a.type === "buffalo" ? "🐃" : a.type === "calf" ? "🐮" : "🐄"}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.animalName, { color: colors.foreground }]}>{a.name}</Text>
                    {a.isPregnant && a.expectedCalvingDate && (
                      <Text style={styles.animalSubInfo}>🤰 {t.pregnantLabel} · {t.calvingExpected} {a.expectedCalvingDate}</Text>
                    )}
                    {a.lactationNumber != null && (
                      <Text style={styles.animalSubInfo}>L{a.lactationNumber} {t.milkToday}</Text>
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
        messageTamil="அனைத்து பணிகளும் முடிந்தது! 🎉"
        onHide={() => setCelebration(false)}
      />
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
  smartAlertEmoji: { fontSize: 24 },
  criticalDot: {
    position: "absolute", top: 0, right: 0,
    width: 8, height: 8, borderRadius: 4, backgroundColor: "#dc2626",
  },
  smartAlertAnimal: { fontSize: 13, fontWeight: "800" },
  smartAlertMsg: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  urgentBadge: { backgroundColor: "#dc2626", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  urgentBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  highBadge: { backgroundColor: "#f97316", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  highBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  alertCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1.5 },
  alertTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  alertItem: { fontSize: 12, color: "#7f1d1d", marginTop: 2 },
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
  animalEmoji: { fontSize: 22 },
  animalName: { fontSize: 14, fontWeight: "600" },
  animalSubInfo: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontSize: 11, fontWeight: "600" },
  milkLabel: { fontSize: 13, fontWeight: "600" },
});

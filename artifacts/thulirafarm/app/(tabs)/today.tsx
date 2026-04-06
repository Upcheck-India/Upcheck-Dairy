import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
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
import { useApp } from "@/context/AppContext";
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return { tamil: "🌙 இரவு வணக்கம், விவசாயி!", english: "Good Night, Farmer!" };
  if (h < 12) return { tamil: "🌅 காலை வணக்கம், விவசாயி!", english: "Good Morning, Farmer!" };
  if (h < 17) return { tamil: "☀️ மதிய வணக்கம்", english: "Good Afternoon" };
  return { tamil: "🌆 மாலை வணக்கம்", english: "Good Evening" };
}

function getContextHint() {
  const h = new Date().getHours();
  if (h < 10) return "காலை கறவை நேரம் — பால் பதிவு செய்யவும்";
  if (h < 15) return "மதிய நேர கவனிப்பு — தண்ணீர் மற்றும் தீவனம் சரிபாருங்கள்";
  return "மாலை கறவை நேரம் — இன்றைய கணக்கு பதிவு செய்யவும்";
}

function getWeatherMock() {
  const h = new Date().getHours();
  if (h < 8) return { icon: "cloud", text: "28°C, காலை மேகம்" };
  if (h < 14) return { icon: "sun", text: "34°C, வெயில்" };
  return { icon: "cloud-rain", text: "30°C, மழை வாய்ப்பு" };
}

async function setupDailyNotification() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    if (Platform.OS !== "web") {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🐄 காலை கறவை நேரம்!",
          body: "ThulirFarm: காலை 5:30 AM — பால் பதிவு செய்யவும். Morning milking time!",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 5,
          minute: 30,
        },
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🌆 மாலை கறவை நேரம்!",
          body: "ThulirFarm: மாலை 4:00 PM — பால் பதிவு மற்றும் கணக்கு தயார் செய்யவும்.",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 16,
          minute: 0,
        },
      });
    }
  } catch {
    // notifications may not be available in all environments
  }
}

export default function TodayTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, generateDailyTasks, getTodayMilkTotal, getTodayIncome, getTodayExpenses, animals, syncStatus, milkAnomalies } =
    useApp();
  const [celebration, setCelebration] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const progressAnim = useMemo(() => new Animated.Value(0), []);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((t) => t.date === today);
  const completedCount = todayTasks.filter((t) => t.completed).length;
  const totalCount = todayTasks.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  useEffect(() => {
    generateDailyTasks();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
    if (progress === 1 && totalCount > 0) {
      setCelebration(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [progress]);

  const milkTotal = getTodayMilkTotal();
  const income = getTodayIncome();
  const expenses = getTodayExpenses();

  const greeting = getGreeting();
  const hint = getContextHint();
  const weather = getWeatherMock();

  const morningTasks = todayTasks.filter((t) => t.session === "morning");
  const eveningTasks = todayTasks.filter((t) => t.session === "evening");

  const healthyCount = animals.filter((a) => a.healthStatus === "healthy").length;
  const needsAttention = animals.filter((a) => a.healthStatus !== "healthy").length;

  const syncDot =
    syncStatus === "synced" ? "#22c55e" : syncStatus === "pending" ? "#f97316" : "#ef4444";
  const syncLabel =
    syncStatus === "synced" ? "✓ சேமிக்கப்பட்டது" : syncStatus === "pending" ? "⏳ சேமிக்கிறது..." : "⚠ offline";

  const handleEnableNotifications = async () => {
    await setupDailyNotification();
    setNotifEnabled(true);
    Alert.alert("✓ அறிவிப்புகள் தயார்", "காலை 5:30 மற்றும் மாலை 4:00 மணிக்கு நினைவூட்டல் அமைக்கப்பட்டது!");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: isWeb ? 120 : 100, paddingTop: topPad + 12 },
        ]}
      >
        {/* Greeting + Date + Sync */}
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: colors.foreground }]}>
              {greeting.tamil}
            </Text>
            <Text style={[styles.greetingSub, { color: colors.mutedForeground }]}>
              {hint}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
              {new Date().toLocaleDateString("ta-IN", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
            <View style={[styles.weatherBadge, { backgroundColor: colors.muted }]}>
              <Feather name={weather.icon as any} size={12} color={colors.accent} />
              <Text style={[styles.weatherText, { color: colors.mutedForeground }]}>{weather.text}</Text>
            </View>
          </View>
        </View>

        {/* Sync status */}
        <View style={[styles.syncRow, { backgroundColor: syncDot + "15", borderColor: syncDot + "40" }]}>
          <View style={[styles.syncDot, { backgroundColor: syncDot }]} />
          <Text style={[styles.syncLabel, { color: syncDot }]}>{syncLabel}</Text>
          {!notifEnabled && Platform.OS !== "web" && (
            <Pressable style={[styles.notifBtn, { backgroundColor: colors.accent + "20" }]} onPress={handleEnableNotifications}>
              <Feather name="bell" size={12} color={colors.accent} />
              <Text style={[styles.notifBtnText, { color: colors.accent }]}>நினைவூட்டல்</Text>
            </Pressable>
          )}
        </View>

        {/* Anomaly alerts */}
        {milkAnomalies.length > 0 && (
          <View style={[styles.alertCard, { backgroundColor: "#fef2f2", borderColor: "#ef4444" }]}>
            <Feather name="alert-triangle" size={16} color="#ef4444" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: "#dc2626" }]}>⚠ பால் குறைவு எச்சரிக்கை</Text>
              {milkAnomalies.map((a) => (
                <Text key={a.animalId} style={styles.alertItem}>
                  • {a.animalName}: {a.dropPercent}% குறைந்தது ({a.todayTotal.toFixed(1)}L vs சராசரி {a.avgTotal.toFixed(1)}L)
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Stats row - horizontal scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 8 }}>
          <StatCard icon="droplet" label="Milk Today" labelTamil="இன்று பால்" value={`${milkTotal.toFixed(1)}L`} iconColor={colors.primary} trend={milkTotal > 10 ? "up" : "neutral"} sub={`${animals.length} மாடுகள்`} />
          <StatCard icon="trending-up" label="Income" labelTamil="வருமானம்" value={`₹${income.toLocaleString("en-IN")}`} iconColor="#22c55e" trend={income > 0 ? "up" : "neutral"} />
          <StatCard icon="package" label="Expenses" labelTamil="செலவு" value={`₹${expenses.toLocaleString("en-IN")}`} iconColor={colors.warning} trend="neutral" />
          <StatCard icon="heart" label="Health" labelTamil="உடல்நிலை" value={`${healthyCount}/${animals.length}`} iconColor={needsAttention > 0 ? colors.destructive : "#22c55e"} sub={needsAttention > 0 ? `${needsAttention} கவனிக்கவும்` : "அனைத்தும் நலம்"} />
          <StatCard icon="check-circle" label="Tasks" labelTamil="பணிகள்" value={`${completedCount}/${totalCount}`} iconColor={completedCount === totalCount && totalCount > 0 ? "#22c55e" : colors.accent} />
        </ScrollView>

        {/* Progress bar */}
        {totalCount > 0 && (
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.foreground }]}>இன்றைய முன்னேற்றம்</Text>
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
              {completedCount} / {totalCount} பணிகள் முடிந்தன
            </Text>
          </View>
        )}

        {/* Morning tasks */}
        {morningTasks.length > 0 && (
          <>
            <View style={styles.sessionHeader}>
              <Feather name="sun" size={16} color={colors.accent} />
              <Text style={[styles.sessionLabel, { color: colors.foreground }]}>🌅 காலை பணிகள்</Text>
            </View>
            {morningTasks.map((t) => <TaskItem key={t.id} task={t} />)}
          </>
        )}

        {/* Evening tasks */}
        {eveningTasks.length > 0 && (
          <>
            <View style={[styles.sessionHeader, { marginTop: 12 }]}>
              <Feather name="moon" size={16} color={colors.primary} />
              <Text style={[styles.sessionLabel, { color: colors.foreground }]}>🌆 மாலை பணிகள்</Text>
            </View>
            {eveningTasks.map((t) => <TaskItem key={t.id} task={t} />)}
          </>
        )}

        {totalCount === 0 && (
          <View style={styles.empty}>
            <Feather name="calendar" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>பணிகள் ஏற்றப்படுகின்றன...</Text>
          </View>
        )}

        {/* Animal health summary */}
        {animals.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>
              மாடுகள் நிலை 🐄
            </Text>
            {animals.map((a) => {
              const sc = a.healthStatus === "healthy" ? "#22c55e" : a.healthStatus === "critical" ? "#ef4444" : "#f97316";
              const sl = a.healthStatus === "healthy" ? "ஆரோக்கியம்" : a.healthStatus === "critical" ? "அவசரம்" : "கவனிக்கவும்";
              return (
                <View key={a.id} style={[styles.animalStatusRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={styles.animalEmoji}>{a.type === "buffalo" ? "🐃" : a.type === "calf" ? "🐮" : "🐄"}</Text>
                  <Text style={[styles.animalName, { color: colors.foreground }]}>{a.name}</Text>
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
        message="All tasks done!"
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
  greeting: { fontSize: 22, fontWeight: "700" },
  greetingSub: { fontSize: 12, marginTop: 4, maxWidth: 210, lineHeight: 18 },
  dateText: { fontSize: 12, fontWeight: "500" },
  weatherBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  weatherText: { fontSize: 11 },
  syncRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  syncLabel: { flex: 1, fontSize: 12, fontWeight: "600" },
  notifBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  notifBtnText: { fontSize: 11, fontWeight: "600" },
  alertCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1.5 },
  alertTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  alertItem: { fontSize: 12, color: "#7f1d1d", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 10 },
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
  animalName: { flex: 1, fontSize: 14, fontWeight: "500" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontSize: 11, fontWeight: "600" },
  milkLabel: { fontSize: 13, fontWeight: "600" },
});

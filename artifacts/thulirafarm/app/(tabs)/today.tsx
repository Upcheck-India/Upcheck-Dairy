import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useMemo, useState } from "react";
import {
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return { tamil: "இரவு வணக்கம்", english: "Good Night" };
  if (h < 12) return { tamil: "காலை வணக்கம்", english: "Good Morning" };
  if (h < 17) return { tamil: "மதிய வணக்கம்", english: "Good Afternoon" };
  return { tamil: "மாலை வணக்கம்", english: "Good Evening" };
}

function getContextHint() {
  const h = new Date().getHours();
  if (h < 10) return "காலை கறவை நேரம் — பால் பதிவு செய்யவும்";
  if (h < 15) return "மதிய நேர கவனிப்பு — தண்ணீர் மற்றும் தீவனம் சரிபாருங்கள்";
  return "மாலை கறவை நேரம் — இன்றைய கணக்கு பதிவு செய்யவும்";
}

export default function TodayTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, generateDailyTasks, getTodayMilkTotal, getTodayIncome, getTodayExpenses, animals } =
    useApp();
  const [celebration, setCelebration] = useState(false);
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

  const morningTasks = todayTasks.filter((t) => t.session === "morning");
  const eveningTasks = todayTasks.filter((t) => t.session === "evening");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: isWeb ? 120 : 100, paddingTop: topPad + 12 },
        ]}
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.foreground }]}>
              {greeting.tamil}
            </Text>
            <Text style={[styles.greetingSub, { color: colors.mutedForeground }]}>
              {hint}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("ta-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="droplet"
            label="Milk Today"
            labelTamil="இன்று பால்"
            value={`${milkTotal.toFixed(1)}L`}
            iconColor={colors.primary}
            trend={milkTotal > 10 ? "up" : "neutral"}
            sub={`${animals.length} மாடுகள்`}
          />
          <StatCard
            icon="trending-up"
            label="Income"
            labelTamil="வருமானம்"
            value={`₹${income.toLocaleString("en-IN")}`}
            iconColor={colors.success}
            trend={income > 0 ? "up" : "neutral"}
          />
        </View>
        <View style={[styles.statsRow, { marginTop: 10 }]}>
          <StatCard
            icon="package"
            label="Expenses"
            labelTamil="செலவு"
            value={`₹${expenses.toLocaleString("en-IN")}`}
            iconColor={colors.warning}
            trend={expenses > 0 ? "down" : "neutral"}
          />
          <StatCard
            icon="check-circle"
            label="Tasks"
            labelTamil="பணிகள்"
            value={`${completedCount}/${totalCount}`}
            iconColor={completedCount === totalCount && totalCount > 0 ? colors.success : colors.accent}
          />
        </View>

        {/* Progress bar */}
        {totalCount > 0 && (
          <View
            style={[
              styles.progressCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.foreground }]}>
                இன்றைய முன்னேற்றம்
              </Text>
              <Text
                style={[styles.progressPct, { color: colors.primary }]}
              >
                {Math.round(progress * 100)}%
              </Text>
            </View>
            <View
              style={[styles.progressBg, { backgroundColor: colors.muted }]}
            >
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Morning tasks */}
        {morningTasks.length > 0 && (
          <>
            <View style={styles.sessionHeader}>
              <Feather name="sun" size={16} color={colors.accent} />
              <Text style={[styles.sessionLabel, { color: colors.foreground }]}>
                காலை பணிகள்
              </Text>
            </View>
            {morningTasks.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </>
        )}

        {/* Evening tasks */}
        {eveningTasks.length > 0 && (
          <>
            <View style={[styles.sessionHeader, { marginTop: 12 }]}>
              <Feather name="moon" size={16} color={colors.primary} />
              <Text style={[styles.sessionLabel, { color: colors.foreground }]}>
                மாலை பணிகள்
              </Text>
            </View>
            {eveningTasks.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </>
        )}

        {totalCount === 0 && (
          <View style={styles.empty}>
            <Feather name="calendar" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              பணிகள் ஏற்றப்படுகின்றன...
            </Text>
          </View>
        )}

        {/* Animal health summary */}
        {animals.length > 0 && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.foreground, marginTop: 20 },
              ]}
            >
              மாடுகள் நிலை
            </Text>
            {animals.map((a) => {
              const statusColors: Record<string, string> = {
                healthy: colors.success,
                attention: colors.warning,
                critical: colors.destructive,
              };
              const statusLabels: Record<string, string> = {
                healthy: "ஆரோக்கியம்",
                attention: "கவனிக்கவும்",
                critical: "அவசரம்",
              };
              const sc = statusColors[a.healthStatus] ?? colors.primary;
              return (
                <View
                  key={a.id}
                  style={[
                    styles.animalStatusRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={styles.animalEmoji}>
                    {a.type === "buffalo" ? "🐃" : "🐄"}
                  </Text>
                  <Text
                    style={[styles.animalName, { color: colors.foreground }]}
                  >
                    {a.name}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: sc + "20" },
                    ]}
                  >
                    <View style={[styles.statusDot, { backgroundColor: sc }]} />
                    <Text style={[styles.statusLabel, { color: sc }]}>
                      {statusLabels[a.healthStatus]}
                    </Text>
                  </View>
                  {a.lastMilkEntry && (
                    <Text
                      style={[styles.milkLabel, { color: colors.mutedForeground }]}
                    >
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
        messageTamil="அனைத்து பணிகளும் முடிந்தது!"
        onHide={() => setCelebration(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: 16,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  greetingSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    maxWidth: 220,
    lineHeight: 18,
  },
  dateText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#5D7A5D",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  progressCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    gap: 10,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  progressPct: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  progressBg: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: 10,
    borderRadius: 5,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
  },
  sessionLabel: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
  },
  empty: {
    alignItems: "center",
    paddingTop: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  animalStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  animalEmoji: {
    fontSize: 24,
  },
  animalName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  milkLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});

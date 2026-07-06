import React, { useState } from "react";
import { ScrollView, View, StyleSheet, RefreshControl, Platform } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDashboard } from "../hooks/useDashboard";
import { useFarmer } from "@/context/FarmerContext";
import { useFarm } from "../../farms/hooks/useFarm";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

// Import presentation components
import { DashboardHeader } from "../components/DashboardHeader";
import { StatsGrid } from "../components/StatsGrid";
import { HerdOverviewCard } from "../components/HerdOverviewCard";
import { RecentAnimalsCard } from "../components/RecentAnimalsCard";
import { QuickActionsCard } from "../components/QuickActionsCard";
import { AlertsCard } from "../components/AlertsCard";

// Modals & Selector
import AddAnimalModal from "@/components/AddAnimalModal";
import { FarmSelector } from "../../farms/components/FarmSelector";
import { DashboardAction, DashboardAlert, QuickAction } from "../types/DashboardState";
import { Animal } from "../../animals/models/Animal";

export function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { farmer } = useFarmer();
  const { activeFarm } = useFarm();
  const { t, language } = useLanguage();
  const syncStatus = "synced";

  const {
    animals,
    milkAnomalies,
    todayMilkTotal,
    todayIncomeTotal,
    todayExpenseTotal,
    upcomingVaxCount,
    breedingAlertCount,
    todayTaskCounts,
    herdSummary,
    refreshAll,
  } = useDashboard();

  const [refreshing, setRefreshing] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [addAnimalVisible, setAddAnimalVisible] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : 0;

  // Multi-language helper
  const lx = (r: Record<string, string>) => r[language] ?? r.en ?? "";

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const syncDot =
    syncStatus === "synced" ? colors.success : syncStatus === "pending" ? colors.warning : colors.destructive;
  const syncLabel =
    syncStatus === "synced"
      ? `✓ ${t.savedLabel}`
      : syncStatus === "pending"
      ? `⏳ ${t.savingLabel}`
      : "offline";

  // Prepare UI States
  const herdState = {
    total: herdSummary.total,
    healthy: herdSummary.healthy,
    attention: herdSummary.attention,
    critical: herdSummary.critical,
    cows: herdSummary.cows,
    buffaloes: herdSummary.buffaloes,
    calves: herdSummary.calves,
  };

  const alerts: DashboardAlert[] = milkAnomalies.map((anomaly) => ({
    id: `anomaly-${anomaly.animalId}`,
    type: "milk_drop",
    title: `${anomaly.animalName} — ${lx({ ta: "பால் குறைவு", te: "పాలు తగ్గాయి", kn: "ಹಾಲು ಕಡಿಮೆ", ml: "പാൽ കുറവ്", hi: "दूध में गिरावट", en: "Milk Drop" })} ${anomaly.dropPercent}%`,
    description: `Today: ${anomaly.todayTotal.toFixed(1)}L • Avg: ${anomaly.avgTotal.toFixed(1)}L`,
    severity: anomaly.severity === "critical" ? "critical" : "warning",
  }));

  const quickActions: QuickAction[] = [
    { id: "add-animal", label: lx({ ta: "+ மாடு", te: "+ పశువు", kn: "+ ಹಸು", ml: "+ പശു", hi: "+ पशु", en: "+ Animal" }), action: DashboardAction.AddAnimal },
    { id: "log-milk", label: lx({ ta: "+ பால் பதிவு", te: "+ పాలు", kn: "+ ಹಾಲು", ml: "+ പാൽ അളവ്", hi: "+ दूध", en: "+ Milk Entry" }), action: DashboardAction.LogMilk },
    { id: "add-task", label: lx({ ta: "+ பணி", te: "+ పని", kn: "+ ಕೆಲಸ", ml: "+ ജോലി", hi: "+ कार्य", en: "+ Task" }), action: DashboardAction.AddTask },
    { id: "add-expense", label: lx({ ta: "+ செலவு", te: "+ ಖರ್ಚು", kn: "+ ఖర్చు", ml: "+ ചിലവ്", hi: "+ खर्च", en: "+ Expense" }), action: DashboardAction.AddExpense },
  ];

  const handleActionPress = (action: DashboardAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (action) {
      case DashboardAction.AddAnimal:
        setAddAnimalVisible(true);
        break;
      case DashboardAction.LogMilk:
        router.push("/herd");
        break;
      case DashboardAction.AddTask:
        router.push("/(tabs)/today");
        break;
      case DashboardAction.AddExpense:
        router.push("/(tabs)/money");
        break;
    }
  };

  const handleAlertPress = (alert: DashboardAlert) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (alert.type === "milk_drop") {
      const animalId = alert.id.replace("anomaly-", "");
      router.push(`/animal/${animalId}`);
    }
  };

  // Sort and pick latest 3 animals
  const recentAnimals = [...animals]
    .slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 12 }]}>
      <DashboardHeader
        farmName={activeFarm ? activeFarm.getDisplayName() : "Select Farm"}
        userName={farmer?.name || "Farmer"}
        onFarmPress={() => setSelectorVisible(true)}
        onProfilePress={() => router.push("/profile")}
        avatarColor={farmer?.avatarColor ?? colors.primary}
        initials={farmer?.name ? farmer.name.trim()[0]!.toUpperCase() : "?"}
        syncStatusLabel={syncLabel}
        syncStatusColor={syncDot}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollBody, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <StatsGrid
          milkTotal={todayMilkTotal}
          tasksCompleted={todayTaskCounts.completed}
          tasksTotal={todayTaskCounts.total}
          income={todayIncomeTotal}
          expenses={todayExpenseTotal}
          milkLabel={lx({ ta: "இன்றைய பால்", te: "నేటి పాలు", kn: "ಇಂದಿನ ಹಾಲು", ml: "ഇന്നത്തെ പാൽ", hi: "आज का दूध", en: "Today's Milk" })}
          tasksLabel={lx({ ta: "பணிகள்", te: "పనులు", kn: "ಕೆಲಸಗಳು", ml: "ജോലികൾ", hi: "कार्य", en: "Tasks" })}
          financeLabel={lx({ ta: "நிதி", te: "ఆర్థికం", kn: "ಹಣಕಾಸು", ml: "ധനകാര്യം", hi: "वित्त", en: "Net Profit" })}
        />

        <QuickActionsCard
          actions={quickActions}
          onActionPress={handleActionPress}
          titleLabel={lx({ ta: "விரைவு செயல்கள்", te: "త్వరిత చర్యలు", kn: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು", ml: "ദ്രുത പ്രവർത്തനങ്ങൾ", hi: "त्वरित कार्रवाई", en: "Quick Actions" })}
        />

        <AlertsCard
          alerts={alerts}
          onAlertPress={handleAlertPress}
          titleLabel={lx({ ta: "எச்சரிக்கைகள்", te: "హెచ్చరికలు", kn: "ಎಚ್ಚರಿಕೆಗಳು", ml: "മുന്നറിയിപ്പുകൾ", hi: "चेतावनियां", en: "Alerts" })}
        />

        <HerdOverviewCard
          summary={herdState}
          onPress={() => router.push("/herd")}
          titleLabel={lx({ ta: "மந்தை கண்ணோட்டம்", te: "పశువుల సమాచారం", kn: "ಹಸುವಿನ ಮಾಹಿತಿ", ml: "കൂട്ട വിവരങ്ങൾ", hi: "झुंड का अवलोकन", en: "Herd Overview" })}
          viewHerdLabel={lx({ ta: "மந்தையை பார்க்க", te: "పశువులను చూడండి", kn: "ಹಸುಗಳನ್ನು ನೋಡಿ", ml: "കൂട്ടത്തിൽ കാണുക", hi: "झुंड देखें", en: "View Herd" })}
        />

        <RecentAnimalsCard
          animals={recentAnimals}
          onAnimalPress={(id) => router.push(`/animal/${id}`)}
          onViewAllPress={() => router.push("/herd")}
          titleLabel={lx({ ta: "சமீபத்திய மாடுகள்", te: "ఇటీవలి పశువులు", kn: "ಇತ್ತೀಚಿನ ಹಸುಗಳು", ml: "സമീപകാല പശുക്കൾ", hi: "हाल के पशु", en: "Recent Animals" })}
          viewAllLabel={lx({ ta: "அனைத்தும்", te: "అన్నీ", kn: "ಎಲ್ಲವೂ", ml: "എല്ലാം", hi: "सभी देखें", en: "View All" })}
        />
      </ScrollView>

      <AddAnimalModal visible={addAnimalVisible} onClose={() => setAddAnimalVisible(false)} />
      <FarmSelector visible={selectorVisible} onClose={() => setSelectorVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollBody: {
    paddingVertical: 12,
  },
});

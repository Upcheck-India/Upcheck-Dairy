import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useFarm } from "../../farms/hooks/useFarm";
import { useFinance } from "../hooks/useFinance";
import { compute7DayFinancials, computeTodayExpenses, computeTodayIncome } from "../services/financeSummary";
import type { ExpenseCategory } from "../types/FinanceDto";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = Math.max(280, SCREEN_WIDTH - 48);
const CHART_HEIGHT = 130;

type FinanceSection = "overview" | "passbook" | "reports";
type QuickActionId = "recordMilk" | "addExpense" | "uploadBill" | "uploadPayslip" | "recordPayment" | "transferOther";

type ModalMode =
  | { kind: "closed" }
  | { kind: "milk-sale" }
  | { kind: "expense"; presetCategory?: ExpenseCategory }
  | { kind: "bill" }
  | { kind: "payslip" }
  | { kind: "payment" }
  | { kind: "transfer" };

function formatRupee(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatRupeeFull(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function startOfDay(value: Date) {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatShortDate(value: Date) {
  return value.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function formatLongDate(value: Date) {
  return value.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value: Date) {
  return `${value.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · ${value.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`;
}

function getDayLabel(value: Date) {
  return value.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

interface DayData {
  date: string;
  income: number;
  expense: number;
}

function FinancialChart({ data }: { data: DayData[] }) {
  const colors = useColors();
  const maxVal = Math.max(...data.map((item) => Math.max(item.income, item.expense)), 1);
  const usableWidth = CHART_WIDTH - 28;
  const gap = 10;
  const barGroupWidth = (usableWidth - gap * (data.length - 1)) / data.length;
  const innerGap = 4;
  const barWidth = Math.max(6, (barGroupWidth - innerGap) / 2);

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 28}>
      {data.map((item, index) => {
        const incomeHeight = (item.income / maxVal) * CHART_HEIGHT;
        const expenseHeight = (item.expense / maxVal) * CHART_HEIGHT;
        const x = 14 + index * (barGroupWidth + gap);
        return (
          <React.Fragment key={`${item.date}-${index}`}>
            <Rect x={x} y={CHART_HEIGHT - incomeHeight} width={barWidth} height={incomeHeight || 2} rx={3} fill="#16a34a" />
            <Rect x={x + barWidth + innerGap} y={CHART_HEIGHT - expenseHeight} width={barWidth} height={expenseHeight || 2} rx={3} fill="#ef4444" />
            <SvgText x={x + barGroupWidth / 2} y={CHART_HEIGHT + 16} fontSize={9} fill={colors.mutedForeground} textAnchor="middle">
              {item.date}
            </SvgText>
          </React.Fragment>
        );
      })}
      <Line x1={10} y1={CHART_HEIGHT} x2={CHART_WIDTH - 10} y2={CHART_HEIGHT} stroke={colors.border} strokeWidth={1} />
    </Svg>
  );
}

function SectionChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.sectionChip,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.primary : colors.card,
        },
      ]}
    >
      <Text style={[styles.sectionChipText, { color: active ? "#fff" : colors.mutedForeground }]}>{label}</Text>
    </Pressable>
  );
}

function StatCard({ label, value, accent, icon }: { label: string; value: string; accent: string; icon: keyof typeof Feather.glyphMap }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: `${accent}18` }]}>
        <Feather name={icon} size={16} color={accent} />
      </View>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  multiline?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.muted,
            minHeight: multiline ? 84 : 48,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

function SelectPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.selectPill,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? `${colors.primary}12` : colors.card,
        },
      ]}
    >
      <Text style={[styles.selectPillText, { color: active ? colors.primary : colors.mutedForeground }]}>{label}</Text>
    </Pressable>
  );
}

function ModalShell({ title, visible, onClose, children }: { title: string; visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function FinanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const { activeFarm } = useFarm();
  const { incomeEntries, expenseEntries, addIncome, addExpense, refresh: refreshFinance, loading } = useFinance();

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 28 : insets.bottom;

  const [refreshing, setRefreshing] = useState(false);
  const [section, setSection] = useState<FinanceSection>("overview");
  const [quickSheetVisible, setQuickSheetVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>({ kind: "closed" });
  const [activePassbookFilter, setActivePassbookFilter] = useState<"All" | "Milk" | "Expense" | "Payment" | "Bills" | "Payslip">("All");

  const [milkBuyer, setMilkBuyer] = useState("Lakshmi Dairy Farm");
  const [milkQuantity, setMilkQuantity] = useState("250");
  const [milkRate, setMilkRate] = useState("50");
  const [milkReceived, setMilkReceived] = useState("12500");
  const [milkFat, setMilkFat] = useState("4.2");
  const [milkSnf, setMilkSnf] = useState("8.6");
  const [milkNotes, setMilkNotes] = useState("");

  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("feed");
  const [expenseDescription, setExpenseDescription] = useState("Feed & Fodder");
  const [expenseAmount, setExpenseAmount] = useState("4800");
  const [expenseNotes, setExpenseNotes] = useState("");

  const [billVendor, setBillVendor] = useState("Sharma Animal Feed");
  const [billAmount, setBillAmount] = useState("4800");
  const [billNotes, setBillNotes] = useState("Green fodder for cows");
  const [billAttachment, setBillAttachment] = useState<string | null>(null);

  const [payslipCycle, setPayslipCycle] = useState("1 - 15 Jul 2025");
  const [payslipPaymentDate, setPayslipPaymentDate] = useState("15 Jul 2025");
  const [payslipMilk, setPayslipMilk] = useState("2430");
  const [payslipNetPayable, setPayslipNetPayable] = useState("47850");
  const [payslipNotes, setPayslipNotes] = useState("Payslip received from dairy");
  const [payslipAttachment, setPayslipAttachment] = useState<string | null>(null);

  const lx = (values: Record<string, string>) => values[language] ?? values.en ?? "";

  const todayIncome = useMemo(() => computeTodayIncome(incomeEntries), [incomeEntries]);
  const todayExpenses = useMemo(() => computeTodayExpenses(expenseEntries), [expenseEntries]);
  const totalIncome = useMemo(() => incomeEntries.reduce((sum, item) => sum + item.totalReceived, 0), [incomeEntries]);
  const totalExpenses = useMemo(() => expenseEntries.reduce((sum, item) => sum + item.amount, 0), [expenseEntries]);
  const profit = totalIncome - totalExpenses;
  const pendingPayments = useMemo(() => incomeEntries.reduce((sum, item) => sum + item.pendingAmount, 0), [incomeEntries]);
  const milkSold = useMemo(() => incomeEntries.reduce((sum, item) => sum + item.quantitySold, 0), [incomeEntries]);
  const chartData = useMemo(() => compute7DayFinancials(incomeEntries, expenseEntries), [incomeEntries, expenseEntries]);

  const expenseSummary = useMemo(() => {
    const grouped: Record<string, number> = {};
    for (const entry of expenseEntries) {
      grouped[entry.category] = (grouped[entry.category] ?? 0) + entry.amount;
    }
    return grouped;
  }, [expenseEntries]);

  const passbookEntries = useMemo(() => {
    const items = [
      ...incomeEntries.map((entry) => ({
        key: `income-${entry.id}`,
        kind: entry.notes?.toLowerCase().includes("payslip") ? ("Payslip" as const) : ("Milk" as const),
        title: entry.buyer,
        subtitle: `${entry.quantitySold.toLocaleString("en-IN")} L · ${entry.dateString}`,
        date: entry.date,
        amount: entry.totalReceived,
        tone: "income" as const,
        icon: entry.notes?.toLowerCase().includes("payslip") ? ("file-text" as const) : ("droplet" as const),
        badge: entry.pendingAmount > 0 ? `${formatRupeeFull(entry.pendingAmount)} pending` : entry.notes?.includes("attached") ? "Payslip attached" : undefined,
      })),
      ...expenseEntries.map((entry) => ({
        key: `expense-${entry.id}`,
        kind: entry.description.toLowerCase().includes("bill attached") ? ("Bills" as const) : ("Expense" as const),
        title: entry.description,
        subtitle: `${entry.category.toUpperCase()} · ${entry.dateString}`,
        date: entry.date,
        amount: entry.amount,
        tone: "expense" as const,
        icon: entry.description.toLowerCase().includes("bill attached") ? ("paperclip" as const) : ("arrow-up-right" as const),
        badge: entry.description.toLowerCase().includes("bill attached") ? "Bill attached" : undefined,
      })),
    ];

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [expenseEntries, incomeEntries]);

  const visiblePassbookEntries = useMemo(() => {
    if (activePassbookFilter === "All") return passbookEntries;
    return passbookEntries.filter((entry) => entry.kind === activePassbookFilter);
  }, [activePassbookFilter, passbookEntries]);

  const lastPayment = incomeEntries[incomeEntries.length - 1];
  const lastExpense = expenseEntries[expenseEntries.length - 1];
  const netToday = todayIncome - todayExpenses;

  const quickActions: Array<{ id: QuickActionId; title: string; description: string; icon: keyof typeof Feather.glyphMap; color: string }> = [
    { id: "recordMilk", title: "Record Milk Sale", description: "Save a milk collection payment", icon: "droplet", color: "#16a34a" },
    { id: "addExpense", title: "Add Expense", description: "Capture feed, labor or medicine", icon: "minus-circle", color: "#ef4444" },
    { id: "uploadBill", title: "Upload Bill", description: "Attach a bill image or PDF", icon: "file-plus", color: "#3b82f6" },
    { id: "uploadPayslip", title: "Upload Payslip", description: "Save payment proof with record", icon: "file-text", color: "#7c3aed" },
    { id: "recordPayment", title: "Record Payment", description: "Mark an incoming payment", icon: "credit-card", color: "#0f766e" },
    { id: "transferOther", title: "Transfer / Other", description: "Create a custom finance record", icon: "shuffle", color: "#6b7280" },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshFinance();
    setRefreshing(false);
  };

  const openQuickAction = (actionId: QuickActionId) => {
    Haptics.selectionAsync();
    setQuickSheetVisible(false);
    switch (actionId) {
      case "recordMilk":
        setModalMode({ kind: "milk-sale" });
        break;
      case "addExpense":
        setModalMode({ kind: "expense" });
        break;
      case "uploadBill":
        setModalMode({ kind: "bill" });
        break;
      case "uploadPayslip":
        setModalMode({ kind: "payslip" });
        break;
      case "recordPayment":
        setModalMode({ kind: "payment" });
        break;
      case "transferOther":
        setModalMode({ kind: "transfer" });
        break;
    }
  };

  const pickAttachment = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ["image/*", "application/pdf"],
    });

    if (result.canceled || !result.assets?.length) {
      return null;
    }

    return result.assets[0]?.name ?? null;
  };

  const saveMilkSale = async () => {
    const quantity = Number.parseFloat(milkQuantity);
    const rate = Number.parseFloat(milkRate);
    const received = Number.parseFloat(milkReceived);
    const fat = milkFat.trim() ? Number.parseFloat(milkFat) : undefined;
    const snf = milkSnf.trim() ? Number.parseFloat(milkSnf) : undefined;

    if (!activeFarm?.id) {
      Alert.alert(t.error, "No active farm selected.");
      return;
    }
    if (!milkBuyer.trim() || Number.isNaN(quantity) || Number.isNaN(rate) || Number.isNaN(received)) {
      Alert.alert(t.error, "Please fill the milk sale details.");
      return;
    }

    const totalExpected = quantity * rate;
    try {
      await addIncome({
        farmId: activeFarm.id,
        date: new Date().toISOString(),
        buyer: milkBuyer.trim(),
        quantitySold: quantity,
        ratePerLitre: rate,
        totalExpected,
        totalReceived: received,
        fatPercentage: Number.isNaN(fat ?? Number.NaN) ? undefined : fat,
        snfPercentage: Number.isNaN(snf ?? Number.NaN) ? undefined : snf,
        notes: milkNotes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalMode({ kind: "closed" });
    } catch (error) {
      Alert.alert(t.error, error instanceof Error ? error.message : "Failed to save milk sale.");
    }
  };

  const saveExpense = async () => {
    const amount = Number.parseFloat(expenseAmount);
    if (!activeFarm?.id) {
      Alert.alert(t.error, "No active farm selected.");
      return;
    }
    if (!expenseDescription.trim() || Number.isNaN(amount)) {
      Alert.alert(t.error, "Please fill the expense details.");
      return;
    }

    try {
      await addExpense({
        farmId: activeFarm.id,
        date: new Date().toISOString(),
        category: expenseCategory,
        description: expenseDescription.trim(),
        amount,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalMode({ kind: "closed" });
    } catch (error) {
      Alert.alert(t.error, error instanceof Error ? error.message : "Failed to save expense.");
    }
  };

  const saveBill = async () => {
    const amount = Number.parseFloat(billAmount);
    if (!activeFarm?.id) {
      Alert.alert(t.error, "No active farm selected.");
      return;
    }
    if (!billVendor.trim() || Number.isNaN(amount)) {
      Alert.alert(t.error, "Please fill the bill details.");
      return;
    }

    const attachmentName = billAttachment ?? (await pickAttachment());
    try {
      await addExpense({
        farmId: activeFarm.id,
        date: new Date().toISOString(),
        category: expenseCategory,
        description: `${billVendor.trim()}${attachmentName ? " · Bill attached" : ""}`,
        amount,
      });
      if (attachmentName) {
        setBillAttachment(attachmentName);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalMode({ kind: "closed" });
    } catch (error) {
      Alert.alert(t.error, error instanceof Error ? error.message : "Failed to save bill.");
    }
  };

  const savePayslip = async () => {
    const milk = Number.parseFloat(payslipMilk);
    const amount = Number.parseFloat(payslipNetPayable);
    if (!activeFarm?.id) {
      Alert.alert(t.error, "No active farm selected.");
      return;
    }
    if (Number.isNaN(milk) || Number.isNaN(amount)) {
      Alert.alert(t.error, "Please fill the payslip details.");
      return;
    }

    const attachmentName = payslipAttachment ?? (await pickAttachment());
    try {
      await addIncome({
        farmId: activeFarm.id,
        date: new Date().toISOString(),
        buyer: `Payment Received (${payslipCycle})`,
        quantitySold: milk,
        ratePerLitre: milk > 0 ? amount / milk : amount,
        totalExpected: amount,
        totalReceived: amount,
        notes: `${payslipNotes.trim() || "Payslip uploaded"}${attachmentName ? ` · ${attachmentName}` : ""}`,
      });
      if (attachmentName) {
        setPayslipAttachment(attachmentName);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalMode({ kind: "closed" });
    } catch (error) {
      Alert.alert(t.error, error instanceof Error ? error.message : "Failed to save payslip.");
    }
  };

  const savePayment = async () => {
    if (!activeFarm?.id) {
      Alert.alert(t.error, "No active farm selected.");
      return;
    }

    const paymentAmount = Number.parseFloat(milkReceived);
    if (Number.isNaN(paymentAmount) || paymentAmount <= 0) {
      Alert.alert(t.error, "Please enter a valid payment amount.");
      return;
    }

    try {
      await addIncome({
        farmId: activeFarm.id,
        date: new Date().toISOString(),
        buyer: milkBuyer.trim() || "Payment Received",
        quantitySold: 1,
        ratePerLitre: paymentAmount,
        totalExpected: paymentAmount,
        totalReceived: paymentAmount,
        notes: milkNotes.trim() || "Payment recorded from finance quick action",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalMode({ kind: "closed" });
    } catch (error) {
      Alert.alert(t.error, error instanceof Error ? error.message : "Failed to save payment.");
    }
  };

  const saveTransfer = async () => {
    const amount = Number.parseFloat(expenseAmount);
    if (!activeFarm?.id) {
      Alert.alert(t.error, "No active farm selected.");
      return;
    }
    if (Number.isNaN(amount)) {
      Alert.alert(t.error, "Please enter a transfer amount.");
      return;
    }

    try {
      await addExpense({
        farmId: activeFarm.id,
        date: new Date().toISOString(),
        category: "other",
        description: expenseDescription.trim() || "Transfer / Other",
        amount,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalMode({ kind: "closed" });
    } catch (error) {
      Alert.alert(t.error, error instanceof Error ? error.message : "Failed to save transfer.");
    }
  };

  const topInsights = [
    {
      title: "Today income",
      value: formatRupeeFull(todayIncome),
      note: lastPayment ? `Last received ${formatShortDate(lastPayment.date)}` : "No payments yet",
      icon: "trending-up" as const,
      tone: "#16a34a",
    },
    {
      title: "Today expense",
      value: formatRupeeFull(todayExpenses),
      note: lastExpense ? `Last expense ${formatShortDate(lastExpense.date)}` : "No expense yet",
      icon: "trending-down" as const,
      tone: "#ef4444",
    },
    {
      title: "Net today",
      value: formatRupeeFull(netToday),
      note: netToday >= 0 ? "Positive cashflow" : "Needs attention",
      icon: netToday >= 0 ? "activity" : "alert-triangle",
      tone: netToday >= 0 ? "#0f766e" : "#d97706",
    },
    {
      title: "Pending payments",
      value: formatRupeeFull(pendingPayments),
      note: `${incomeEntries.filter((entry) => entry.pendingAmount > 0).length} entries pending`,
      icon: "clock" as const,
      tone: "#7c3aed",
    },
  ];

  const filters: Array<typeof activePassbookFilter> = ["All", "Milk", "Expense", "Payment", "Bills", "Payslip"];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#f2fbf4", colors.background, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.hero, { paddingTop: topPad + 14, borderBottomColor: colors.border }]}
      >
        <View style={styles.heroTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>UPCHECK FINANCE</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Digital dairy passbook for milk, bills, expenses and payments.</Text>
          </View>
          <Pressable style={[styles.syncPill, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={onRefresh}>
            <Feather name={loading ? "refresh-cw" : "check-circle"} size={14} color={colors.primary} />
            <Text style={[styles.syncText, { color: colors.primary }]}>{loading ? "Refreshing" : "Synced"}</Text>
          </Pressable>
        </View>

        {!activeFarm?.id && (
          <View style={[styles.notice, { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}35` }]}>
            <Feather name="alert-triangle" size={14} color={colors.warning} />
            <Text style={[styles.noticeText, { color: colors.warning }]}>Select a farm to save finance entries.</Text>
          </View>
        )}

        <View style={styles.tabRow}>
          <SectionChip label="Overview" active={section === "overview"} onPress={() => setSection("overview")} />
          <SectionChip label="Passbook" active={section === "passbook"} onPress={() => setSection("passbook")} />
          <SectionChip label="Reports" active={section === "reports"} onPress={() => setSection("reports")} />
        </View>
      </LinearGradient>

      {!loading && incomeEntries.length === 0 && expenseEntries.length === 0 ? (
        <View style={[styles.emptyState, { flex: 1 }]}> 
          <Feather name="book-open" size={42} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No finance records yet</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Use the green + button to record milk sales, expenses, bills or payslips.</Text>
          <Pressable style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => setQuickSheetVisible(true)}>
            <Text style={styles.primaryBtnText}>Open quick actions</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={[styles.loadingWrap, { flex: 1 }]}> 
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Loading finance records...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 120 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          showsVerticalScrollIndicator={false}
        >
          {section === "overview" && (
            <>
              <View style={styles.statsGrid}>
                <StatCard label={t.totalIncome} value={formatRupee(totalIncome)} accent="#16a34a" icon="trending-up" />
                <StatCard label={t.totalExpense} value={formatRupee(totalExpenses)} accent="#ef4444" icon="trending-down" />
                <StatCard label={t.profit} value={formatRupee(profit)} accent={profit >= 0 ? "#0f766e" : "#7c3aed"} icon={profit >= 0 ? "arrow-up-right" : "alert-triangle"} />
                <StatCard label="Milk sold" value={`${milkSold.toLocaleString("en-IN")} L`} accent="#0284c7" icon="droplet" />
              </View>

              <View style={[styles.summaryStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatRupeeFull(todayIncome)}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Today income</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatRupeeFull(todayExpenses)}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Today expense</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatRupeeFull(pendingPayments)}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Pending</Text>
                </View>
              </View>

              <InfoCard title="Quick Snapshot">
                <View style={styles.snapshotList}>
                  {topInsights.map((item) => (
                    <View key={item.title} style={styles.snapshotRow}>
                      <View style={[styles.snapshotIcon, { backgroundColor: `${item.tone}18` }]}>
                        <Feather name={item.icon as keyof typeof Feather.glyphMap} size={15} color={item.tone} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.snapshotTitle, { color: colors.foreground }]}>{item.title}</Text>
                        <Text style={[styles.snapshotNote, { color: colors.mutedForeground }]}>{item.note}</Text>
                      </View>
                      <Text style={[styles.snapshotValue, { color: item.tone }]}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              </InfoCard>

              <InfoCard title="7-Day Financials">
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#16a34a" }]} />
                    <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{t.income}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
                    <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{t.expense}</Text>
                  </View>
                </View>
                <FinancialChart data={chartData} />
              </InfoCard>

              <InfoCard title="Smart Insights">
                <View style={styles.insightList}>
                  <InsightRow
                    icon="trending-up"
                    color="#16a34a"
                    title="Milk income is moving well"
                    detail={`${formatRupeeFull(totalIncome)} recorded across ${incomeEntries.length} entries.`}
                  />
                  <InsightRow
                    icon="alert-triangle"
                    color="#d97706"
                    title="Expense pressure visible"
                    detail={`${Object.keys(expenseSummary).length} expense categories active this week.`}
                  />
                  <InsightRow
                    icon="clock"
                    color="#7c3aed"
                    title="Payments still pending"
                    detail={`${incomeEntries.filter((entry) => entry.pendingAmount > 0).length} income rows need follow-up.`}
                  />
                </View>
              </InfoCard>
            </>
          )}

          {section === "passbook" && (
            <>
              <View style={[styles.filterRow, { borderColor: colors.border }]}>
                {filters.map((filter) => (
                  <SelectPill key={filter} label={filter} active={activePassbookFilter === filter} onPress={() => setActivePassbookFilter(filter)} />
                ))}
              </View>

              <InfoCard title="Passbook Timeline">
                <View style={styles.timelineList}>
                  {visiblePassbookEntries.length === 0 ? (
                    <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>No entries in this filter.</Text>
                  ) : (
                    visiblePassbookEntries.map((entry) => (
                      <PassbookRow key={entry.key} entry={entry} />
                    ))
                  )}
                </View>
              </InfoCard>
            </>
          )}

          {section === "reports" && (
            <>
              <View style={styles.statsGrid}>
                <StatCard label="Cash in" value={formatRupee(totalIncome)} accent="#16a34a" icon="download" />
                <StatCard label="Cash out" value={formatRupee(totalExpenses)} accent="#ef4444" icon="upload" />
                <StatCard label="Net payable" value={formatRupee(profit)} accent="#0f766e" icon="layers" />
                <StatCard label="Bills attached" value={expenseEntries.filter((entry) => entry.description.toLowerCase().includes("bill attached")).length.toString()} accent="#3b82f6" icon="paperclip" />
              </View>

              <InfoCard title="Expense Breakdown">
                <View style={styles.breakdownList}>
                  {Object.keys(expenseSummary).length === 0 ? (
                    <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>No expense data yet.</Text>
                  ) : (
                    Object.entries(expenseSummary).map(([category, amount]) => {
                      const percent = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                      return (
                        <View key={category} style={styles.breakdownRow}>
                          <Text style={[styles.breakdownLabel, { color: colors.foreground }]}>{category}</Text>
                          <View style={[styles.breakdownTrack, { backgroundColor: colors.muted }]}>
                            <View style={[styles.breakdownFill, { width: `${percent}%`, backgroundColor: colors.primary }]} />
                          </View>
                          <Text style={[styles.breakdownValue, { color: colors.primary }]}>{formatRupee(amount)}</Text>
                        </View>
                      );
                    })
                  )}
                </View>
              </InfoCard>

              <InfoCard title="Report Notes">
                <View style={styles.insightList}>
                  <InsightRow icon="file-text" color="#3b82f6" title="Upload-ready reports" detail="Bills and payslips are captured as finance entries so the passbook stays in one timeline." />
                  <InsightRow icon="activity" color="#16a34a" title="Daily cashflow" detail={`Today net is ${formatRupeeFull(netToday)} across ${formatShortDate(new Date())}.`} />
                </View>
              </InfoCard>
            </>
          )}
        </ScrollView>
      )}

      <Pressable style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setQuickSheetVisible(true)}>
        <Feather name="plus" size={24} color="#fff" />
      </Pressable>

      <Modal visible={quickSheetVisible} transparent animationType="fade" onRequestClose={() => setQuickSheetVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setQuickSheetVisible(false)}>
          <Pressable style={[styles.sheetCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => null}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Quick Actions</Text>
              <Pressable onPress={() => setQuickSheetVisible(false)}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            {quickActions.map((action) => (
              <Pressable key={action.id} style={[styles.actionRow, { borderColor: colors.border }]} onPress={() => openQuickAction(action.id)}>
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Feather name={action.icon} size={18} color={action.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, { color: colors.foreground }]}>{action.title}</Text>
                  <Text style={[styles.actionDesc, { color: colors.mutedForeground }]}>{action.description}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <ModalShell title="Record Milk Sale" visible={modalMode.kind === "milk-sale"} onClose={() => setModalMode({ kind: "closed" })}>
        <InputField label="Buyer / Society" value={milkBuyer} onChangeText={setMilkBuyer} placeholder="Lakshmi Dairy Farm" />
        <View style={styles.inlineFields}>
          <View style={{ flex: 1 }}>
            <InputField label="Milk (L)" value={milkQuantity} onChangeText={setMilkQuantity} placeholder="250" keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <InputField label="Rate / L" value={milkRate} onChangeText={setMilkRate} placeholder="50" keyboardType="decimal-pad" />
          </View>
        </View>
        <View style={styles.inlineFields}>
          <View style={{ flex: 1 }}>
            <InputField label="Received" value={milkReceived} onChangeText={setMilkReceived} placeholder="12500" keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <InputField label="FAT %" value={milkFat} onChangeText={setMilkFat} placeholder="4.2" keyboardType="decimal-pad" />
          </View>
        </View>
        <InputField label="SNF %" value={milkSnf} onChangeText={setMilkSnf} placeholder="8.6" keyboardType="decimal-pad" />
        <InputField label="Notes" value={milkNotes} onChangeText={setMilkNotes} placeholder="Morning collection" multiline />
        <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={saveMilkSale}>
          <Text style={styles.saveBtnText}>Save Milk Sale</Text>
        </Pressable>
      </ModalShell>

      <ModalShell title="Add Expense" visible={modalMode.kind === "expense"} onClose={() => setModalMode({ kind: "closed" })}>
        <View style={styles.pillGrid}>
          {(["feed", "medicine", "labor", "equipment", "other"] as ExpenseCategory[]).map((category) => (
            <SelectPill key={category} label={category} active={expenseCategory === category} onPress={() => setExpenseCategory(category)} />
          ))}
        </View>
        <InputField label="Description" value={expenseDescription} onChangeText={setExpenseDescription} placeholder="Feed & Fodder" />
        <InputField label="Amount" value={expenseAmount} onChangeText={setExpenseAmount} placeholder="4800" keyboardType="decimal-pad" />
        <InputField label="Notes" value={expenseNotes} onChangeText={setExpenseNotes} placeholder="Green fodder for cows" multiline />
        <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={saveExpense}>
          <Text style={styles.saveBtnText}>Save Expense</Text>
        </Pressable>
      </ModalShell>

      <ModalShell title="Upload Bill" visible={modalMode.kind === "bill"} onClose={() => setModalMode({ kind: "closed" })}>
        <InputField label="Vendor" value={billVendor} onChangeText={setBillVendor} placeholder="Sharma Animal Feed" />
        <InputField label="Amount" value={billAmount} onChangeText={setBillAmount} placeholder="4800" keyboardType="decimal-pad" />
        <InputField label="Notes" value={billNotes} onChangeText={setBillNotes} placeholder="Bill attached" multiline />
        <Pressable style={[styles.attachBtn, { borderColor: colors.border, backgroundColor: colors.muted }]} onPress={async () => setBillAttachment(await pickAttachment() ?? billAttachment)}>
          <Feather name="paperclip" size={16} color={colors.primary} />
          <Text style={[styles.attachBtnText, { color: colors.foreground }]}>{billAttachment ?? "Tap to attach image / PDF"}</Text>
        </Pressable>
        <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={saveBill}>
          <Text style={styles.saveBtnText}>Save Bill</Text>
        </Pressable>
      </ModalShell>

      <ModalShell title="Upload Payslip" visible={modalMode.kind === "payslip"} onClose={() => setModalMode({ kind: "closed" })}>
        <InputField label="Payment cycle" value={payslipCycle} onChangeText={setPayslipCycle} placeholder="1 - 15 Jul 2025" />
        <InputField label="Payment date" value={payslipPaymentDate} onChangeText={setPayslipPaymentDate} placeholder="15 Jul 2025" />
        <View style={styles.inlineFields}>
          <View style={{ flex: 1 }}>
            <InputField label="Total milk (L)" value={payslipMilk} onChangeText={setPayslipMilk} placeholder="2430" keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <InputField label="Net payable" value={payslipNetPayable} onChangeText={setPayslipNetPayable} placeholder="47850" keyboardType="decimal-pad" />
          </View>
        </View>
        <InputField label="Notes" value={payslipNotes} onChangeText={setPayslipNotes} placeholder="Payslip received from dairy" multiline />
        <Pressable style={[styles.attachBtn, { borderColor: colors.border, backgroundColor: colors.muted }]} onPress={async () => setPayslipAttachment(await pickAttachment() ?? payslipAttachment)}>
          <Feather name="paperclip" size={16} color={colors.primary} />
          <Text style={[styles.attachBtnText, { color: colors.foreground }]}>{payslipAttachment ?? "Tap to attach image / PDF"}</Text>
        </Pressable>
        <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={savePayslip}>
          <Text style={styles.saveBtnText}>Save Payslip</Text>
        </Pressable>
      </ModalShell>

      <ModalShell title="Record Payment" visible={modalMode.kind === "payment"} onClose={() => setModalMode({ kind: "closed" })}>
        <InputField label="Payer" value={milkBuyer} onChangeText={setMilkBuyer} placeholder="Milk society" />
        <InputField label="Amount" value={milkReceived} onChangeText={setMilkReceived} placeholder="12500" keyboardType="decimal-pad" />
        <InputField label="Notes" value={milkNotes} onChangeText={setMilkNotes} placeholder="Payment received today" multiline />
        <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={savePayment}>
          <Text style={styles.saveBtnText}>Save Payment</Text>
        </Pressable>
      </ModalShell>

      <ModalShell title="Transfer / Other" visible={modalMode.kind === "transfer"} onClose={() => setModalMode({ kind: "closed" })}>
        <InputField label="Title" value={expenseDescription} onChangeText={setExpenseDescription} placeholder="Bank transfer" />
        <InputField label="Amount" value={expenseAmount} onChangeText={setExpenseAmount} placeholder="2500" keyboardType="decimal-pad" />
        <InputField label="Notes" value={expenseNotes} onChangeText={setExpenseNotes} placeholder="Reference or memo" multiline />
        <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={saveTransfer}>
          <Text style={styles.saveBtnText}>Save Record</Text>
        </Pressable>
      </ModalShell>
    </View>
  );
}

function InsightRow({ icon, color, title, detail }: { icon: keyof typeof Feather.glyphMap; color: string; title: string; detail: string }) {
  const colors = useColors();
  return (
    <View style={styles.insightRow}>
      <View style={[styles.insightIcon, { backgroundColor: `${color}18` }]}>
        <Feather name={icon} size={15} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.insightTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.insightDetail, { color: colors.mutedForeground }]}>{detail}</Text>
      </View>
    </View>
  );
}

function PassbookRow({ entry }: { entry: {
  key: string;
  kind: "Milk" | "Expense" | "Payment" | "Bills" | "Payslip";
  title: string;
  subtitle: string;
  date: Date;
  amount: number;
  tone: "income" | "expense";
  icon: keyof typeof Feather.glyphMap;
  badge?: string;
} }) {
  const colors = useColors();
  const positive = entry.tone === "income";
  return (
    <View style={[styles.timelineItem, { borderColor: colors.border, backgroundColor: positive ? `${colors.primary}08` : `${colors.destructive}08` }]}>
      <View style={[styles.timelineIcon, { backgroundColor: positive ? `${colors.primary}14` : `${colors.destructive}14` }]}>
        <Feather name={entry.icon as keyof typeof Feather.glyphMap} size={16} color={positive ? colors.primary : colors.destructive} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.timelineTopLine}>
          <Text style={[styles.timelineTitle, { color: colors.foreground }]}>{entry.title}</Text>
          <Text style={[styles.timelineAmount, { color: positive ? colors.primary : colors.destructive }]}>
            {positive ? "+" : "-"} {formatRupeeFull(entry.amount)}
          </Text>
        </View>
        <Text style={[styles.timelineSub, { color: colors.mutedForeground }]}>{entry.subtitle}</Text>
        {entry.badge ? <Text style={[styles.timelineBadge, { color: positive ? colors.primary : colors.destructive }]}>{entry.badge}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  syncPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  syncText: {
    fontSize: 12,
    fontWeight: "700",
  },
  notice: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noticeText: { fontSize: 12, fontWeight: "600" },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  sectionChip: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryBtn: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flexBasis: "48%",
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    minHeight: 110,
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  summaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  summaryLabel: { fontSize: 12, marginTop: 4 },
  summaryDivider: { width: 1, height: 34, backgroundColor: "rgba(148,163,184,0.35)" },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  legendRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  snapshotList: { gap: 12 },
  snapshotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  snapshotIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  snapshotTitle: { fontSize: 13, fontWeight: "800" },
  snapshotNote: { fontSize: 11, marginTop: 2 },
  snapshotValue: { fontSize: 13, fontWeight: "800" },
  insightList: { gap: 12 },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  insightIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  insightTitle: { fontSize: 13, fontWeight: "800" },
  insightDetail: { fontSize: 11.5, marginTop: 3, lineHeight: 17 },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 2,
  },
  selectPill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  selectPillText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  timelineList: { gap: 12 },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  timelineIcon: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  timelineTopLine: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  timelineTitle: { fontSize: 13.5, fontWeight: "800", flex: 1 },
  timelineAmount: { fontSize: 13.5, fontWeight: "800" },
  timelineSub: { fontSize: 11.5, marginTop: 3 },
  timelineBadge: { fontSize: 11, fontWeight: "700", marginTop: 5 },
  breakdownList: { gap: 12 },
  breakdownRow: { gap: 6 },
  breakdownLabel: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  breakdownTrack: { height: 10, borderRadius: 999, overflow: "hidden" },
  breakdownFill: { height: "100%", borderRadius: 999 },
  breakdownValue: { fontSize: 12, fontWeight: "800" },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    justifyContent: "flex-end",
    padding: 14,
  },
  sheetCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 16, fontWeight: "800" },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 2,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 13.5, fontWeight: "800" },
  actionDesc: { fontSize: 11.5, marginTop: 2 },
  modalRoot: { flex: 1 },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalBody: { padding: 16, gap: 12, paddingBottom: 32 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  inlineFields: { flexDirection: "row", gap: 10 },
  pillGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  attachBtnText: { fontSize: 12.5, fontWeight: "700", flex: 1 },
  saveBtn: {
    marginTop: 4,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";

import {
  ExpenseEntry,
  IncomeEntry,
  generateId,
  getTodayString,
  useApp,
} from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function formatRupee(amount: number) {
  if (amount >= 100000) return "₹" + (amount / 100000).toFixed(1) + "L";
  if (amount >= 1000) return "₹" + (amount / 1000).toFixed(1) + "K";
  return "₹" + amount.toLocaleString("en-IN");
}

function formatRupeeFull(amount: number) {
  return "₹" + amount.toLocaleString("en-IN");
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 48;
const CHART_HEIGHT = 120;

interface DayData {
  date: string;
  income: number;
  expense: number;
}

function FinancialChart({ data }: { data: DayData[] }) {
  const colors = useColors();
  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);
  const barWidth = (CHART_WIDTH - 40) / (data.length * 2 + data.length - 1);
  const groupWidth = barWidth * 2 + barWidth * 0.5;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
      {data.map((d, i) => {
        const incomeH = (d.income / maxVal) * CHART_HEIGHT;
        const expenseH = (d.expense / maxVal) * CHART_HEIGHT;
        const x = 20 + i * (groupWidth + 4);

        return (
          <React.Fragment key={i}>
            <Rect
              x={x}
              y={CHART_HEIGHT - incomeH}
              width={barWidth}
              height={incomeH || 2}
              fill={d.income > 0 ? "#22c55e" : "#e5e7eb"}
              rx={3}
            />
            <Rect
              x={x + barWidth + 2}
              y={CHART_HEIGHT - expenseH}
              width={barWidth}
              height={expenseH || 2}
              fill={d.expense > 0 ? "#ef4444" : "#e5e7eb"}
              rx={3}
            />
            <SvgText
              x={x + barWidth}
              y={CHART_HEIGHT + 16}
              fontSize={9}
              fill={colors.mutedForeground}
              textAnchor="middle"
            >
              {d.date}
            </SvgText>
          </React.Fragment>
        );
      })}
      <Line
        x1={16}
        y1={CHART_HEIGHT}
        x2={CHART_WIDTH - 4}
        y2={CHART_HEIGHT}
        stroke={colors.border}
        strokeWidth={1}
      />
    </Svg>
  );
}

const EXPENSE_CATEGORIES = [
  { key: "feed", label: "🌾 தீவனம்", icon: "package" },
  { key: "medicine", label: "💊 மருந்து", icon: "activity" },
  { key: "labor", label: "👷 தொழிலாளர்", icon: "users" },
  { key: "equipment", label: "🔧 உபகரணம்", icon: "tool" },
  { key: "other", label: "📦 மற்றவை", icon: "more-horizontal" },
];

export default function MoneyTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { incomeEntries, expenseEntries, addIncomeEntry, addExpenseEntry, get7DayFinancials } =
    useApp();
  const [activeTab, setActiveTab] = useState<"income" | "expense">("income");
  const [incomeModal, setIncomeModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);

  const [buyer, setBuyer] = useState("");
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("42");
  const [received, setReceived] = useState("");
  const [fatPct, setFatPct] = useState("");

  const [expCategory, setExpCategory] = useState<ExpenseEntry["category"]>("feed");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const totalIncome = useMemo(
    () => incomeEntries.reduce((s, e) => s + e.totalReceived, 0),
    [incomeEntries]
  );
  const totalExpenses = useMemo(
    () => expenseEntries.reduce((s, e) => s + e.amount, 0),
    [expenseEntries]
  );
  const profit = totalIncome - totalExpenses;

  const chartData = get7DayFinancials();

  const expenseSummary = useMemo(() => {
    const byCategory: Record<string, number> = {};
    for (const e of expenseEntries) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    }
    return byCategory;
  }, [expenseEntries]);

  const handleAddIncome = () => {
    const q = parseFloat(qty);
    const r = parseFloat(rate);
    const rec = parseFloat(received);
    if (!buyer.trim() || isNaN(q) || isNaN(r) || isNaN(rec)) {
      Alert.alert("தவறு", "அனைத்து தகவல்களையும் உள்ளிடவும்");
      return;
    }
    const expected = q * r;
    const entry: IncomeEntry = {
      id: generateId(),
      date: getTodayString(),
      buyer: buyer.trim(),
      quantitySold: q,
      ratePerLitre: r,
      totalExpected: expected,
      totalReceived: rec,
      fatPercentage: fatPct ? parseFloat(fatPct) : undefined,
    };
    addIncomeEntry(entry);

    const diff = expected - rec;
    if (Math.abs(diff) > 5) {
      Alert.alert(
        diff > 0 ? "⚠ குறைவாக கிடைத்தது!" : "✓ அதிகமாக கிடைத்தது",
        `எதிர்பார்த்தது: ${formatRupeeFull(expected)}\nகிடைத்தது: ${formatRupeeFull(rec)}\n${diff > 0 ? `இழப்பு: ${formatRupeeFull(diff)} — கூட்டுறவு சங்கம் சரியாக கொடுக்கவில்லை?` : `கூடுதல்: ${formatRupeeFull(-diff)}`}`,
        [{ text: "சரி" }]
      );
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBuyer(""); setQty(""); setRate("42"); setReceived(""); setFatPct("");
    setIncomeModal(false);
  };

  const handleAddExpense = () => {
    const amt = parseFloat(expAmount);
    if (!expDesc.trim() || isNaN(amt)) {
      Alert.alert("தவறு", "அனைத்து தகவல்களையும் உள்ளிடவும்");
      return;
    }
    const entry: ExpenseEntry = {
      id: generateId(),
      date: getTodayString(),
      category: expCategory,
      description: expDesc.trim(),
      amount: amt,
    };
    addExpenseEntry(entry);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setExpDesc(""); setExpAmount("");
    setExpenseModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>பணம் 💰</Text>

        {/* Three summary cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#16a34a" }]}>
            <Text style={styles.statCardLabel}>மொத்த வருமானம்</Text>
            <Text style={styles.statCardValue}>{formatRupee(totalIncome)}</Text>
            <Text style={styles.statCardSub}>Total Income</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#ef4444" }]}>
            <Text style={styles.statCardLabel}>மொத்த செலவு</Text>
            <Text style={styles.statCardValue}>{formatRupee(totalExpenses)}</Text>
            <Text style={styles.statCardSub}>Total Expense</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: profit >= 0 ? "#0284c7" : "#7c3aed" }]}>
            <Text style={styles.statCardLabel}>லாபம்</Text>
            <Text style={styles.statCardValue}>{formatRupee(profit)}</Text>
            <Text style={styles.statCardSub}>{profit >= 0 ? "Profit" : "Loss"}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.list, { paddingBottom: isWeb ? 120 : 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 7-day bar chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>7 நாட்கள் நிதி</Text>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>வருமானம்</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>செலவு</Text>
              </View>
            </View>
          </View>
          <FinancialChart data={chartData} />
        </View>

        {/* Expense breakdown */}
        {Object.keys(expenseSummary).length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>செலவு வகைகள்</Text>
            {EXPENSE_CATEGORIES.filter((c) => expenseSummary[c.key] > 0).map((c) => {
              const pct = Math.round((expenseSummary[c.key] / totalExpenses) * 100);
              return (
                <View key={c.key} style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.foreground }]}>{c.label}</Text>
                  <View style={[styles.breakdownBarBg, { backgroundColor: colors.muted }]}>
                    <View style={[styles.breakdownBarFill, { width: `${pct}%`, backgroundColor: colors.accent }]} />
                  </View>
                  <Text style={[styles.breakdownValue, { color: colors.accent }]}>{formatRupee(expenseSummary[c.key])}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Tab selector */}
        <View style={[styles.tabRow, { borderColor: colors.border }]}>
          {(["income", "expense"] as const).map((t) => (
            <Pressable
              key={t}
              style={[
                styles.tabBtn,
                { borderBottomColor: activeTab === t ? colors.primary : "transparent", borderBottomWidth: 2 },
              ]}
              onPress={() => { setActiveTab(t); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.tabLabel, { color: activeTab === t ? colors.primary : colors.mutedForeground }]}>
                {t === "income" ? "வருமானம் 📈" : "செலவுகள் 📉"}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === "income" ? (
          incomeEntries.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="dollar-sign" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>வருமானம் இல்லை</Text>
            </View>
          ) : (
            incomeEntries.map((e) => {
              const diff = e.totalReceived - e.totalExpected;
              const hasDiscrepancy = Math.abs(diff) > 5;
              return (
                <View
                  key={e.id}
                  style={[
                    styles.entryRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: hasDiscrepancy ? colors.warning + "80" : colors.border,
                      borderLeftWidth: hasDiscrepancy ? 4 : 1,
                      borderLeftColor: hasDiscrepancy ? colors.warning : colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.entryTitle, { color: colors.foreground }]}>{e.buyer}</Text>
                    <Text style={[styles.entrySub, { color: colors.mutedForeground }]}>
                      {e.quantitySold}L × ₹{e.ratePerLitre}/L • {e.date}
                    </Text>
                    {hasDiscrepancy && (
                      <Text style={[styles.discrepancy, { color: diff < 0 ? colors.destructive : colors.success }]}>
                        {diff < 0 ? `⚠ இழப்பு: ${formatRupeeFull(-diff)}` : `✓ கூடுதல்: ${formatRupeeFull(diff)}`}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.entryAmount, { color: colors.foreground }]}>{formatRupeeFull(e.totalReceived)}</Text>
                    <Text style={[styles.expectedAmount, { color: colors.mutedForeground }]}>
                      எதிர்: {formatRupeeFull(e.totalExpected)}
                    </Text>
                  </View>
                </View>
              );
            })
          )
        ) : expenseEntries.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="credit-card" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>செலவுகள் இல்லை</Text>
          </View>
        ) : (
          expenseEntries.map((e) => {
            const cat = EXPENSE_CATEGORIES.find((c) => c.key === e.category);
            return (
              <View
                key={e.id}
                style={[styles.entryRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.expIcon, { backgroundColor: colors.warning + "18" }]}>
                  <Feather name={(cat?.icon ?? "more-horizontal") as any} size={16} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.entryTitle, { color: colors.foreground }]}>{e.description}</Text>
                  <Text style={[styles.entrySub, { color: colors.mutedForeground }]}>{cat?.label} • {e.date}</Text>
                </View>
                <Text style={[styles.expAmount, { color: colors.destructive }]}>-{formatRupeeFull(e.amount)}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <Pressable
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          activeTab === "income" ? setIncomeModal(true) : setExpenseModal(true);
        }}
      >
        <Feather name="plus" size={24} color="#fff" />
      </Pressable>

      {/* Income Modal */}
      <Modal visible={incomeModal} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setIncomeModal(false)}>
          <Pressable style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>வருமானம் சேர் 📈</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={buyer} onChangeText={setBuyer} placeholder="கொள்முதல்காரர் / கூட்டுறவு பெயர்" placeholderTextColor={colors.mutedForeground} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={qty} onChangeText={setQty} placeholder="அளவு (L)" keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
              <TextInput style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={rate} onChangeText={setRate} placeholder="₹/L (default 42)" keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
            </View>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={received} onChangeText={setReceived} placeholder="கிடைத்த தொகை ₹ (received)" keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={fatPct} onChangeText={setFatPct} placeholder="கொழுப்பு % (fat, optional)" keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
            <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAddIncome}>
              <Text style={styles.saveBtnText}>சேமி</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Expense Modal */}
      <Modal visible={expenseModal} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setExpenseModal(false)}>
          <Pressable style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>செலவு சேர் 📉</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
              {EXPENSE_CATEGORIES.map((c) => (
                <Pressable
                  key={c.key}
                  style={[styles.catChip, { backgroundColor: expCategory === c.key ? colors.primary : colors.muted, borderColor: expCategory === c.key ? colors.primary : colors.border }]}
                  onPress={() => setExpCategory(c.key as ExpenseEntry["category"])}
                >
                  <Text style={[styles.catLabel, { color: expCategory === c.key ? "#fff" : colors.mutedForeground }]}>{c.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={expDesc} onChangeText={setExpDesc} placeholder="விவரம் / Description" placeholderTextColor={colors.mutedForeground} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={expAmount} onChangeText={setExpAmount} placeholder="தொகை ₹ / Amount" keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
            <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAddExpense}>
              <Text style={styles.saveBtnText}>சேமி</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, gap: 12 },
  headerTitle: { fontSize: 26, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, gap: 2 },
  statCardLabel: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "600" },
  statCardValue: { color: "#fff", fontSize: 18, fontWeight: "700" },
  statCardSub: { color: "rgba(255,255,255,0.7)", fontSize: 10 },
  list: { padding: 16, gap: 12 },
  chartCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  chartTitle: { fontSize: 15, fontWeight: "700" },
  chartLegend: { flexDirection: "row", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  breakdownLabel: { fontSize: 12, width: 90 },
  breakdownBarBg: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  breakdownBarFill: { height: 8, borderRadius: 4 },
  breakdownValue: { fontSize: 12, fontWeight: "700", width: 48, textAlign: "right" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, marginTop: 4 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabLabel: { fontSize: 14, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 15 },
  entryRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, gap: 10 },
  entryTitle: { fontSize: 14, fontWeight: "600" },
  entrySub: { fontSize: 11, marginTop: 2 },
  discrepancy: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  entryAmount: { fontSize: 15, fontWeight: "700" },
  expectedAmount: { fontSize: 11, marginTop: 2 },
  expIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  expAmount: { fontSize: 15, fontWeight: "700" },
  fab: { position: "absolute", right: 20, bottom: Platform.OS === "web" ? 100 : 84, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  saveBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 4 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  catChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catLabel: { fontSize: 12, fontWeight: "600" },
});

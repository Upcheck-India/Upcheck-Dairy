import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  ExpenseEntry,
  IncomeEntry,
  generateId,
  getTodayString,
  useApp,
} from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function formatRupee(amount: number) {
  return "₹" + amount.toLocaleString("en-IN");
}

const EXPENSE_CATEGORIES = [
  { key: "feed", label: "தீவனம்", icon: "package" },
  { key: "medicine", label: "மருந்து", icon: "activity" },
  { key: "labor", label: "தொழிலாளர்", icon: "users" },
  { key: "equipment", label: "உபகரணம்", icon: "tool" },
  { key: "other", label: "மற்றவை", icon: "more-horizontal" },
];

export default function MoneyTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { incomeEntries, expenseEntries, addIncomeEntry, addExpenseEntry } =
    useApp();
  const [activeTab, setActiveTab] = useState<"income" | "expense">("income");
  const [incomeModal, setIncomeModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);

  // Income form
  const [buyer, setBuyer] = useState("");
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("");
  const [received, setReceived] = useState("");
  const [fatPct, setFatPct] = useState("");

  // Expense form
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

  const last30Income = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return incomeEntries
      .filter((e) => new Date(e.date) >= cutoff)
      .reduce((s, e) => s + e.totalReceived, 0);
  }, [incomeEntries]);

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
    if (Math.abs(expected - rec) > 5) {
      Alert.alert(
        "கவனம்!",
        `எதிர்பார்த்தது: ${formatRupee(expected)}\nகிடைத்தது: ${formatRupee(rec)}\nவித்தியாசம்: ${formatRupee(Math.abs(expected - rec))}`,
        [{ text: "சரி" }]
      );
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBuyer("");
    setQty("");
    setRate("");
    setReceived("");
    setFatPct("");
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
    setExpDesc("");
    setExpAmount("");
    setExpenseModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          பணம்
        </Text>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.bigStat,
              { backgroundColor: colors.primary, flex: 1 },
            ]}
          >
            <Text style={styles.bigStatLabel}>மொத்த வருமானம்</Text>
            <Text style={styles.bigStatValue}>{formatRupee(totalIncome)}</Text>
            <Text style={styles.bigStatSub}>30 நாட்கள்: {formatRupee(last30Income)}</Text>
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <View
              style={[
                styles.smallStat,
                {
                  backgroundColor:
                    profit >= 0 ? colors.secondary : colors.destructive + "20",
                  borderColor:
                    profit >= 0 ? colors.primary + "30" : colors.destructive + "40",
                },
              ]}
            >
              <Text
                style={[
                  styles.smallStatLabel,
                  { color: colors.mutedForeground },
                ]}
              >
                லாபம்
              </Text>
              <Text
                style={[
                  styles.smallStatValue,
                  {
                    color: profit >= 0 ? colors.primary : colors.destructive,
                  },
                ]}
              >
                {formatRupee(profit)}
              </Text>
            </View>
            <View
              style={[
                styles.smallStat,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.smallStatLabel,
                  { color: colors.mutedForeground },
                ]}
              >
                செலவு
              </Text>
              <Text
                style={[styles.smallStatValue, { color: colors.warning }]}
              >
                {formatRupee(totalExpenses)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.tabRow}>
        {(["income", "expense"] as const).map((t) => (
          <Pressable
            key={t}
            style={[
              styles.tabBtn,
              {
                borderBottomColor:
                  activeTab === t ? colors.primary : "transparent",
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => {
              setActiveTab(t);
              Haptics.selectionAsync();
            }}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === t ? colors.primary : colors.mutedForeground,
                },
              ]}
            >
              {t === "income" ? "வருமானம்" : "செலவுகள்"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: isWeb ? 120 : 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "income" ? (
          incomeEntries.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="dollar-sign" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                வருமானம் இல்லை
              </Text>
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
                      borderColor: hasDiscrepancy
                        ? colors.warning + "60"
                        : colors.border,
                      borderLeftWidth: hasDiscrepancy ? 3 : 1,
                      borderLeftColor: hasDiscrepancy
                        ? colors.warning
                        : colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.entryTitle, { color: colors.foreground }]}>
                      {e.buyer}
                    </Text>
                    <Text
                      style={[styles.entrySub, { color: colors.mutedForeground }]}
                    >
                      {e.quantitySold}L × ₹{e.ratePerLitre}/L • {e.date}
                    </Text>
                    {hasDiscrepancy && (
                      <Text style={[styles.discrepancy, { color: colors.warning }]}>
                        ⚠ வித்தியாசம்: {formatRupee(Math.abs(diff))}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={[styles.entryAmount, { color: colors.foreground }]}
                    >
                      {formatRupee(e.totalReceived)}
                    </Text>
                    <Text
                      style={[
                        styles.expectedAmount,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      எதிர்பார்: {formatRupee(e.totalExpected)}
                    </Text>
                  </View>
                </View>
              );
            })
          )
        ) : expenseEntries.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="credit-card" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              செலவுகள் இல்லை
            </Text>
          </View>
        ) : (
          expenseEntries.map((e) => {
            const cat = EXPENSE_CATEGORIES.find((c) => c.key === e.category);
            return (
              <View
                key={e.id}
                style={[
                  styles.entryRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.expIcon,
                    { backgroundColor: colors.warning + "18" },
                  ]}
                >
                  <Feather
                    name={(cat?.icon ?? "more-horizontal") as any}
                    size={16}
                    color={colors.warning}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.entryTitle, { color: colors.foreground }]}
                  >
                    {e.description}
                  </Text>
                  <Text
                    style={[styles.entrySub, { color: colors.mutedForeground }]}
                  >
                    {cat?.label} • {e.date}
                  </Text>
                </View>
                <Text style={[styles.expAmount, { color: colors.warning }]}>
                  -{formatRupee(e.amount)}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <Pressable
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          activeTab === "income"
            ? setIncomeModal(true)
            : setExpenseModal(true);
        }}
      >
        <Feather name="plus" size={24} color="#fff" />
      </Pressable>

      {/* Income Modal */}
      <Modal visible={incomeModal} transparent animationType="slide">
        <Pressable
          style={styles.overlay}
          onPress={() => setIncomeModal(false)}
        >
          <Pressable
            style={[styles.modalBox, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              வருமானம் சேர்
            </Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
              value={buyer}
              onChangeText={setBuyer}
              placeholder="கொள்முதல்காரர் பெயர்"
              placeholderTextColor={colors.mutedForeground}
            />
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1, borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
                value={qty}
                onChangeText={setQty}
                placeholder="அளவு (L)"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.mutedForeground}
              />
              <TextInput
                style={[styles.modalInput, { flex: 1, borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
                value={rate}
                onChangeText={setRate}
                placeholder="விலை ₹/L"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
              value={received}
              onChangeText={setReceived}
              placeholder="கிடைத்த தொகை ₹"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.mutedForeground}
            />
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
              value={fatPct}
              onChangeText={setFatPct}
              placeholder="கொழுப்பு % (விருப்பம்)"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.mutedForeground}
            />
            <Pressable
              style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddIncome}
            >
              <Text style={styles.modalSaveBtnText}>சேமி</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Expense Modal */}
      <Modal visible={expenseModal} transparent animationType="slide">
        <Pressable
          style={styles.overlay}
          onPress={() => setExpenseModal(false)}
        >
          <Pressable
            style={[styles.modalBox, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              செலவு சேர்
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 14 }}
              contentContainerStyle={{ gap: 8 }}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <Pressable
                  key={c.key}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor:
                        expCategory === c.key ? colors.primary : colors.muted,
                      borderColor:
                        expCategory === c.key ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setExpCategory(c.key as ExpenseEntry["category"])}
                >
                  <Text
                    style={[
                      styles.catLabel,
                      {
                        color:
                          expCategory === c.key ? "#fff" : colors.mutedForeground,
                      },
                    ]}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
              value={expDesc}
              onChangeText={setExpDesc}
              placeholder="விவரம்"
              placeholderTextColor={colors.mutedForeground}
            />
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
              value={expAmount}
              onChangeText={setExpAmount}
              placeholder="தொகை ₹"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.mutedForeground}
            />
            <Pressable
              style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddExpense}
            >
              <Text style={styles.modalSaveBtnText}>சேமி</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch",
  },
  bigStat: {
    borderRadius: 14,
    padding: 16,
    gap: 4,
    justifyContent: "center",
  },
  bigStatLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  bigStatValue: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  bigStatSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  smallStat: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 2,
  },
  smallStatLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  smallStatValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
  },
  tabLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    padding: 16,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  entryTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  entrySub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  discrepancy: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
  entryAmount: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  expectedAmount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  expIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  expAmount: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: Platform.OS === "web" ? 100 : 84,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  modalSaveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  modalSaveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  catLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});

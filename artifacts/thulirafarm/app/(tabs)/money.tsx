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
  InventoryItem,
  generateId,
  getTodayString,
  useApp,
} from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import InventoryModal from "@/components/InventoryModal";

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

interface DayData { date: string; income: number; expense: number; }

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
            <Rect x={x} y={CHART_HEIGHT - incomeH} width={barWidth} height={incomeH || 2} fill={d.income > 0 ? "#22c55e" : "#e5e7eb"} rx={3} />
            <Rect x={x + barWidth + 2} y={CHART_HEIGHT - expenseH} width={barWidth} height={expenseH || 2} fill={d.expense > 0 ? "#ef4444" : "#e5e7eb"} rx={3} />
            <SvgText x={x + barWidth} y={CHART_HEIGHT + 16} fontSize={9} fill={colors.mutedForeground} textAnchor="middle">{d.date}</SvgText>
          </React.Fragment>
        );
      })}
      <Line x1={16} y1={CHART_HEIGHT} x2={CHART_WIDTH - 4} y2={CHART_HEIGHT} stroke={colors.border} strokeWidth={1} />
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

const CATEGORY_COLORS: Record<InventoryItem["category"], string> = {
  feed: "#16a34a", medicine: "#0284c7", supplement: "#7c3aed",
  equipment: "#d97706", other: "#6b7280",
};

const CATEGORY_EMOJIS: Record<InventoryItem["category"], string> = {
  feed: "🌾", medicine: "💊", supplement: "🧪", equipment: "🔧", other: "📦",
};

type MoneyTab = "income" | "expense" | "inventory";

export default function MoneyTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const {
    incomeEntries, expenseEntries, addIncomeEntry, addExpenseEntry, get7DayFinancials,
    inventoryItems, deleteInventoryItem, adjustInventoryQuantity,
  } = useApp();
  const [activeTab, setActiveTab] = useState<MoneyTab>("income");
  const [incomeModal, setIncomeModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [inventoryModal, setInventoryModal] = useState(false);
  const [editInventoryItem, setEditInventoryItem] = useState<InventoryItem | undefined>();

  const [buyer, setBuyer] = useState("");
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("42");
  const [received, setReceived] = useState("");
  const [fatPct, setFatPct] = useState("");

  const [expCategory, setExpCategory] = useState<ExpenseEntry["category"]>("feed");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");

  const isTa = language === "ta";
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const totalIncome = useMemo(() => incomeEntries.reduce((s, e) => s + e.totalReceived, 0), [incomeEntries]);
  const totalExpenses = useMemo(() => expenseEntries.reduce((s, e) => s + e.amount, 0), [expenseEntries]);
  const profit = totalIncome - totalExpenses;
  const chartData = get7DayFinancials();

  const expenseSummary = useMemo(() => {
    const byCategory: Record<string, number> = {};
    for (const e of expenseEntries) byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    return byCategory;
  }, [expenseEntries]);

  const lowStockItems = inventoryItems.filter((item) => item.quantity <= item.minQuantity && item.minQuantity > 0);
  const inventoryValue = inventoryItems.reduce((s, i) => s + (i.quantity * (i.pricePerUnit ?? 0)), 0);

  const handleAddIncome = () => {
    const q = parseFloat(qty);
    const r = parseFloat(rate);
    const rec = parseFloat(received);
    if (!buyer.trim() || isNaN(q) || isNaN(r) || isNaN(rec)) {
      Alert.alert(isTa ? "தவறு" : "Error", isTa ? "அனைத்து தகவல்களையும் உள்ளிடவும்" : "Please fill all fields");
      return;
    }
    const expected = q * r;
    addIncomeEntry({ id: generateId(), date: getTodayString(), buyer: buyer.trim(), quantitySold: q, ratePerLitre: r, totalExpected: expected, totalReceived: rec, fatPercentage: fatPct ? parseFloat(fatPct) : undefined });
    const diff = expected - rec;
    if (Math.abs(diff) > 5) {
      Alert.alert(diff > 0 ? (isTa ? "⚠ குறைவாக கிடைத்தது!" : "⚠ Underpaid!") : (isTa ? "✓ அதிகமாக கிடைத்தது" : "✓ Overpaid"),
        `${isTa ? "எதிர்பார்த்தது" : "Expected"}: ${formatRupeeFull(expected)}\n${isTa ? "கிடைத்தது" : "Received"}: ${formatRupeeFull(rec)}`);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBuyer(""); setQty(""); setRate("42"); setReceived(""); setFatPct("");
    setIncomeModal(false);
  };

  const handleAddExpense = () => {
    const amt = parseFloat(expAmount);
    if (!expDesc.trim() || isNaN(amt)) { Alert.alert(isTa ? "தவறு" : "Error", isTa ? "தகவல்கள் உள்ளிடவும்" : "Please fill all fields"); return; }
    addExpenseEntry({ id: generateId(), date: getTodayString(), category: expCategory, description: expDesc.trim(), amount: amt });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setExpDesc(""); setExpAmount("");
    setExpenseModal(false);
  };

  const handleDeleteInventory = (item: InventoryItem) => {
    Alert.alert(
      isTa ? "நீக்கு?" : "Delete?",
      isTa ? `${item.name} நீக்கவும்?` : `Delete ${item.name}?`,
      [{ text: isTa ? "ரத்து" : "Cancel", style: "cancel" }, { text: isTa ? "நீக்கு" : "Delete", style: "destructive", onPress: () => deleteInventoryItem(item.id) }]
    );
  };

  const MONEY_TABS: Array<{ id: MoneyTab; label: string; labelEn: string; emoji: string }> = [
    { id: "income", label: "வருமானம்", labelEn: "Income", emoji: "📈" },
    { id: "expense", label: "செலவுகள்", labelEn: "Expenses", emoji: "📉" },
    { id: "inventory", label: "இருப்பு", labelEn: "Inventory", emoji: "📦" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{isTa ? "பணம் 💰" : "Finances 💰"}</Text>

        {/* Summary cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#16a34a" }]}>
            <Text style={styles.statCardLabel}>{isTa ? "மொத்த வருமானம்" : "Income"}</Text>
            <Text style={styles.statCardValue}>{formatRupee(totalIncome)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#ef4444" }]}>
            <Text style={styles.statCardLabel}>{isTa ? "மொத்த செலவு" : "Expenses"}</Text>
            <Text style={styles.statCardValue}>{formatRupee(totalExpenses)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: profit >= 0 ? "#0284c7" : "#7c3aed" }]}>
            <Text style={styles.statCardLabel}>{isTa ? "லாபம்" : "Profit"}</Text>
            <Text style={styles.statCardValue}>{formatRupee(profit)}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.list, { paddingBottom: isWeb ? 120 : 100 }]} showsVerticalScrollIndicator={false}>
        {/* 7-day chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>{isTa ? "7 நாட்கள் நிதி" : "7-Day Financials"}</Text>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} /><Text style={[styles.legendText, { color: colors.mutedForeground }]}>{isTa ? "வரும்" : "Income"}</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} /><Text style={[styles.legendText, { color: colors.mutedForeground }]}>{isTa ? "செலவு" : "Expense"}</Text></View>
            </View>
          </View>
          <FinancialChart data={chartData} />
        </View>

        {/* Low stock banner */}
        {lowStockItems.length > 0 && (
          <Pressable style={styles.lowStockBanner} onPress={() => setActiveTab("inventory")}>
            <Feather name="alert-triangle" size={16} color="#c2410c" />
            <Text style={styles.lowStockText}>
              {lowStockItems.length} {isTa ? "பொருட்கள் குறைந்தவை" : "items low on stock"}: {lowStockItems.map((i) => i.name).join(", ")}
            </Text>
            <Feather name="chevron-right" size={14} color="#c2410c" />
          </Pressable>
        )}

        {/* Tab row */}
        <View style={[styles.tabRow, { borderColor: colors.border }]}>
          {MONEY_TABS.map((t) => (
            <Pressable
              key={t.id}
              style={[styles.tabBtn, { borderBottomColor: activeTab === t.id ? colors.primary : "transparent", borderBottomWidth: 2 }]}
              onPress={() => { setActiveTab(t.id); Haptics.selectionAsync(); }}
            >
              <Text style={styles.tabEmoji}>{t.emoji}</Text>
              <Text style={[styles.tabLabel, { color: activeTab === t.id ? colors.primary : colors.mutedForeground }]}>
                {isTa ? t.label : t.labelEn}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── INCOME TAB ── */}
        {activeTab === "income" && (
          incomeEntries.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="dollar-sign" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{isTa ? "வருமானம் இல்லை" : "No income yet"}</Text>
            </View>
          ) : (
            incomeEntries.map((e) => {
              const diff = e.totalReceived - e.totalExpected;
              const hasDiscrepancy = Math.abs(diff) > 5;
              return (
                <View key={e.id} style={[styles.entryRow, { backgroundColor: colors.card, borderColor: hasDiscrepancy ? colors.warning + "80" : colors.border, borderLeftWidth: hasDiscrepancy ? 4 : 1, borderLeftColor: hasDiscrepancy ? colors.warning : colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.entryTitle, { color: colors.foreground }]}>{e.buyer}</Text>
                    <Text style={[styles.entrySub, { color: colors.mutedForeground }]}>{e.quantitySold}L × ₹{e.ratePerLitre}/L • {e.date}</Text>
                    {e.fatPercentage && <Text style={[styles.entrySub, { color: colors.mutedForeground }]}>FAT: {e.fatPercentage}%</Text>}
                    {hasDiscrepancy && <Text style={[styles.discrepancy, { color: diff < 0 ? colors.destructive : colors.success }]}>{diff < 0 ? `⚠ ${isTa ? "இழப்பு" : "Under"}: ${formatRupeeFull(-diff)}` : `✓ ${isTa ? "கூடுதல்" : "Over"}: ${formatRupeeFull(diff)}`}</Text>}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.entryAmount, { color: colors.foreground }]}>{formatRupeeFull(e.totalReceived)}</Text>
                    <Text style={[styles.expectedAmount, { color: colors.mutedForeground }]}>{isTa ? "எதிர்" : "Exp"}: {formatRupeeFull(e.totalExpected)}</Text>
                  </View>
                </View>
              );
            })
          )
        )}

        {/* ── EXPENSE TAB ── */}
        {activeTab === "expense" && (
          <>
            {Object.keys(expenseSummary).length > 0 && (
              <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.chartTitle, { color: colors.foreground }]}>{isTa ? "செலவு வகைகள்" : "Expense Breakdown"}</Text>
                {EXPENSE_CATEGORIES.filter((c) => expenseSummary[c.key] != null && expenseSummary[c.key]! > 0).map((c) => {
                  const pct = Math.round((expenseSummary[c.key]! / totalExpenses) * 100);
                  return (
                    <View key={c.key} style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: colors.foreground }]}>{c.label}</Text>
                      <View style={[styles.breakdownBarBg, { backgroundColor: colors.muted }]}>
                        <View style={[styles.breakdownBarFill, { width: `${pct}%`, backgroundColor: colors.accent }]} />
                      </View>
                      <Text style={[styles.breakdownValue, { color: colors.accent }]}>{formatRupee(expenseSummary[c.key]!)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
            {expenseEntries.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="credit-card" size={48} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{isTa ? "செலவுகள் இல்லை" : "No expenses yet"}</Text>
              </View>
            ) : (
              expenseEntries.map((e) => {
                const cat = EXPENSE_CATEGORIES.find((c) => c.key === e.category);
                return (
                  <View key={e.id} style={[styles.entryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
          </>
        )}

        {/* ── INVENTORY TAB ── */}
        {activeTab === "inventory" && (
          <>
            {inventoryValue > 0 && (
              <View style={styles.inventoryValueCard}>
                <Text style={styles.inventoryValueLabel}>{isTa ? "மொத்த இருப்பு மதிப்பு" : "Total Inventory Value"}</Text>
                <Text style={styles.inventoryValueAmount}>{formatRupeeFull(inventoryValue)}</Text>
              </View>
            )}

            {inventoryItems.length === 0 ? (
              <View style={styles.empty}>
                <Text style={{ fontSize: 48 }}>📦</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {isTa ? "இருப்பு பதிவு இல்லை" : "No inventory items yet"}
                </Text>
                <Pressable style={styles.addFirstBtn} onPress={() => { setEditInventoryItem(undefined); setInventoryModal(true); }}>
                  <Text style={styles.addFirstBtnText}>{isTa ? "+ பொருள் சேர்க்கவும்" : "+ Add First Item"}</Text>
                </Pressable>
              </View>
            ) : (
              inventoryItems.map((item) => {
                const isLow = item.quantity <= item.minQuantity && item.minQuantity > 0;
                const catColor = CATEGORY_COLORS[item.category];
                const catEmoji = CATEGORY_EMOJIS[item.category];
                const stockPct = item.minQuantity > 0 ? Math.min(item.quantity / (item.minQuantity * 2), 1) : 0.5;

                return (
                  <View
                    key={item.id}
                    style={[styles.inventoryCard, { borderColor: isLow ? "#ef4444" : colors.border, borderLeftColor: catColor, borderLeftWidth: 4 }]}
                  >
                    <View style={styles.inventoryCardTop}>
                      <View style={styles.inventoryCardLeft}>
                        <Text style={styles.inventoryCatEmoji}>{catEmoji}</Text>
                        <View>
                          <Text style={styles.inventoryItemName}>{item.name}</Text>
                          <Text style={styles.inventoryItemCat}>{item.category}</Text>
                        </View>
                      </View>
                      <View style={styles.inventoryActions}>
                        <Pressable
                          style={styles.inventoryEditBtn}
                          onPress={() => { setEditInventoryItem(item); setInventoryModal(true); }}
                        >
                          <Feather name="edit-2" size={14} color="#0284c7" />
                        </Pressable>
                        <Pressable style={styles.inventoryDeleteBtn} onPress={() => handleDeleteInventory(item)}>
                          <Feather name="trash-2" size={14} color="#dc2626" />
                        </Pressable>
                      </View>
                    </View>

                    {/* Stock level */}
                    <View style={styles.stockRow}>
                      <View style={styles.stockQtyRow}>
                        <Pressable style={styles.qtyBtn} onPress={() => adjustInventoryQuantity(item.id, -1)}>
                          <Feather name="minus" size={14} color="#374151" />
                        </Pressable>
                        <Text style={[styles.stockQty, { color: isLow ? "#dc2626" : "#1a2e05" }]}>
                          {item.quantity} {item.unit}
                        </Text>
                        <Pressable style={styles.qtyBtn} onPress={() => adjustInventoryQuantity(item.id, 1)}>
                          <Feather name="plus" size={14} color="#374151" />
                        </Pressable>
                      </View>
                      {item.pricePerUnit != null && (
                        <Text style={styles.priceTag}>₹{item.pricePerUnit}/{item.unit}</Text>
                      )}
                    </View>

                    {item.minQuantity > 0 && (
                      <View style={styles.stockBarBg}>
                        <View style={[styles.stockBarFill, { width: `${Math.round(stockPct * 100)}%`, backgroundColor: isLow ? "#ef4444" : "#16a34a" }]} />
                      </View>
                    )}

                    {isLow && (
                      <View style={styles.lowStockTag}>
                        <Feather name="alert-triangle" size={12} color="#dc2626" />
                        <Text style={styles.lowStockTagText}>
                          {isTa ? `குறைவு! குறைந்தபட்சம்: ${item.minQuantity} ${item.unit}` : `Low stock! Min: ${item.minQuantity} ${item.unit}`}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={[styles.fab, { backgroundColor: activeTab === "inventory" ? "#d97706" : colors.primary }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (activeTab === "income") setIncomeModal(true);
          else if (activeTab === "expense") setExpenseModal(true);
          else { setEditInventoryItem(undefined); setInventoryModal(true); }
        }}
      >
        <Feather name="plus" size={24} color="#fff" />
      </Pressable>

      {/* Income Modal */}
      <Modal visible={incomeModal} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setIncomeModal(false)}>
          <Pressable style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{isTa ? "வருமானம் சேர் 📈" : "Add Income 📈"}</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={buyer} onChangeText={setBuyer} placeholder={isTa ? "கொள்முதல்காரர் பெயர்" : "Buyer / Cooperative name"} placeholderTextColor={colors.mutedForeground} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={qty} onChangeText={setQty} placeholder={isTa ? "அளவு (L)" : "Qty (L)"} keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
              <TextInput style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={rate} onChangeText={setRate} placeholder="₹/L (42)" keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
            </View>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={received} onChangeText={setReceived} placeholder={isTa ? "கிடைத்த தொகை ₹" : "Amount received ₹"} keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={fatPct} onChangeText={setFatPct} placeholder={isTa ? "கொழுப்பு % (விருப்பம்)" : "FAT % (optional)"} keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
            <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAddIncome}>
              <Text style={styles.saveBtnText}>{isTa ? "சேமி" : "Save"}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Expense Modal */}
      <Modal visible={expenseModal} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setExpenseModal(false)}>
          <Pressable style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{isTa ? "செலவு சேர் 📉" : "Add Expense 📉"}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
              {EXPENSE_CATEGORIES.map((c) => (
                <Pressable key={c.key} style={[styles.catChip, { backgroundColor: expCategory === c.key ? colors.primary : colors.muted, borderColor: expCategory === c.key ? colors.primary : colors.border }]} onPress={() => setExpCategory(c.key as ExpenseEntry["category"])}>
                  <Text style={[styles.catLabel, { color: expCategory === c.key ? "#fff" : colors.mutedForeground }]}>{c.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={expDesc} onChangeText={setExpDesc} placeholder={isTa ? "விவரம்" : "Description"} placeholderTextColor={colors.mutedForeground} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={expAmount} onChangeText={setExpAmount} placeholder={isTa ? "தொகை ₹" : "Amount ₹"} keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
            <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAddExpense}>
              <Text style={styles.saveBtnText}>{isTa ? "சேமி" : "Save"}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Inventory Modal */}
      <InventoryModal
        visible={inventoryModal}
        onClose={() => { setInventoryModal(false); setEditInventoryItem(undefined); }}
        editItem={editInventoryItem}
      />
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
  lowStockBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa",
    borderRadius: 12, padding: 12,
  },
  lowStockText: { flex: 1, fontSize: 13, color: "#c2410c", fontWeight: "500" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, marginTop: 4 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 10, gap: 2 },
  tabEmoji: { fontSize: 14 },
  tabLabel: { fontSize: 12, fontWeight: "600" },
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
  inventoryValueCard: {
    backgroundColor: "#fefce8", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#fed7aa",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  inventoryValueLabel: { fontSize: 13, color: "#92400e", fontWeight: "600" },
  inventoryValueAmount: { fontSize: 20, fontWeight: "700", color: "#d97706" },
  addFirstBtn: { backgroundColor: "#fef3c7", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  addFirstBtnText: { color: "#d97706", fontWeight: "700", fontSize: 14 },
  inventoryCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1,
    gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  inventoryCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  inventoryCardLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  inventoryCatEmoji: { fontSize: 24 },
  inventoryItemName: { fontSize: 15, fontWeight: "700", color: "#1a2e05" },
  inventoryItemCat: { fontSize: 11, color: "#6b7280", textTransform: "capitalize" },
  inventoryActions: { flexDirection: "row", gap: 8 },
  inventoryEditBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" },
  inventoryDeleteBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" },
  stockRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stockQtyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  stockQty: { fontSize: 16, fontWeight: "700", minWidth: 60, textAlign: "center" },
  priceTag: { fontSize: 12, color: "#6b7280" },
  stockBarBg: { height: 6, borderRadius: 3, backgroundColor: "#f3f4f6", overflow: "hidden" },
  stockBarFill: { height: 6, borderRadius: 3 },
  lowStockTag: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fef2f2", borderRadius: 8, padding: 6 },
  lowStockTagText: { fontSize: 12, color: "#dc2626", fontWeight: "600" },
});

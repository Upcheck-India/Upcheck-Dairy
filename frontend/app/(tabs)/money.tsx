import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

const EXPENSE_CAT_LABELS: Record<string, Record<string, string>> = {
  feed: { ta: "🌾 தீவனம்", te: "🌾 మేత", kn: "🌾 ಮೇವು", ml: "🌾 തീറ്റ", hi: "🌾 चारा", en: "🌾 Feed" },
  medicine: { ta: "மருந்து", te: "మందు", kn: "ಔಷಧ", ml: "മരുന്ന്", hi: "दवाई", en: "Medicine" },
  labor: { ta: "👷 தொழிலாளர்", te: "👷 కూలీ", kn: "👷 ಕಾರ್ಮಿಕ", ml: "👷 തൊഴിലാളി", hi: "👷 मजदूरी", en: "👷 Labor" },
  equipment: { ta: "🔧 உபகரணம்", te: "🔧 పరికరాలు", kn: "🔧 ಸಾಧನ", ml: "🔧 ഉപകരണം", hi: "🔧 उपकरण", en: "🔧 Equipment" },
  other: { ta: "📦 மற்றவை", te: "📦 ఇతరాలు", kn: "📦 ಇತರ", ml: "📦 മറ്റുള്ളവ", hi: "📦 अन्य", en: "📦 Other" },
};

const CATEGORY_COLORS: Record<InventoryItem["category"], string> = {
  feed: "#16a34a", medicine: "#0284c7", supplement: "#7c3aed",
  equipment: "#d97706", other: "#6b7280",
};

const CATEGORY_ICONS: Record<InventoryItem["category"], keyof typeof Feather.glyphMap> = {
  feed: "box", medicine: "activity", supplement: "heart", equipment: "tool", other: "package",
};

type MoneyTab = "income" | "expense" | "inventory";

export default function MoneyTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const {
    incomeEntries, expenseEntries, addIncomeEntry, addExpenseEntry, get7DayFinancials,
    inventoryItems, deleteInventoryItem, adjustInventoryQuantity,
    isLoaded, reloadData,
  } = useApp();
  const [activeTab, setActiveTab] = useState<MoneyTab>("income");
  const [incomeModal, setIncomeModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [inventoryModal, setInventoryModal] = useState(false);
  const [editInventoryItem, setEditInventoryItem] = useState<InventoryItem | undefined>();
  const [refreshing, setRefreshing] = useState(false);

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

  // Helper for inline multilingual records
  const lx = (r: Record<string, string>) => r[language] ?? r.en ?? "";

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
      Alert.alert(t.error, lx({ ta: "அனைத்து தகவல்களையும் உள்ளிடவும்", te: "అన్ని వివరాలు నమోదు చేయండి", kn: "ಎಲ್ಲ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ", ml: "എല്ലാ വിവരങ്ങളും നൽകൂ", hi: "सभी जानकारी भरें", en: "Please fill all fields" }));
      return;
    }
    const expected = q * r;
    addIncomeEntry({ id: generateId(), date: getTodayString(), buyer: buyer.trim(), quantitySold: q, ratePerLitre: r, totalExpected: expected, totalReceived: rec, fatPercentage: fatPct ? parseFloat(fatPct) : undefined });
    const diff = expected - rec;
    if (Math.abs(diff) > 5) {
      Alert.alert(
        diff > 0
          ? lx({ ta: "⚠ குறைவாக கிடைத்தது!", te: "⚠ తక్కువ వచ్చింది!", kn: "⚠ ಕಡಿಮೆ ಬಂದಿದೆ!", ml: "⚠ കുറഞ്ഞ ലഭ്യം!", hi: "⚠ कम भुगतान!", en: "⚠ Underpaid!" })
          : lx({ ta: "✓ அதிகமாக கிடைத்தது", te: "✓ అదనంగా వచ్చింది", kn: "✓ ಹೆಚ್ಚು ಬಂದಿದೆ", ml: "✓ അധികം ലഭ്യം", hi: "✓ अधिक भुगतान", en: "✓ Overpaid" }),
        `${lx({ ta: "எதிர்பார்த்தது", te: "అంచనా", kn: "ನಿರೀಕ್ಷಿತ", ml: "പ്രതീക്ഷ", hi: "अनुमान", en: "Expected" })}: ${formatRupeeFull(expected)}\n${lx({ ta: "கிடைத்தது", te: "అందింది", kn: "ಸ್ವೀಕರಿಸಿದ", ml: "ലഭിച്ചത്", hi: "प्राप्त", en: "Received" })}: ${formatRupeeFull(rec)}`
      );
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBuyer(""); setQty(""); setRate("42"); setReceived(""); setFatPct("");
    setIncomeModal(false);
  };

  const handleAddExpense = () => {
    const amt = parseFloat(expAmount);
    if (!expDesc.trim() || isNaN(amt)) {
      Alert.alert(t.error, lx({ ta: "தகவல்கள் உள்ளிடவும்", te: "వివరాలు నమోదు చేయండి", kn: "ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ", ml: "വിവരങ്ങൾ നൽകൂ", hi: "जानकारी भरें", en: "Please fill all fields" }));
      return;
    }
    addExpenseEntry({ id: generateId(), date: getTodayString(), category: expCategory, description: expDesc.trim(), amount: amt });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setExpDesc(""); setExpAmount("");
    setExpenseModal(false);
  };

  const handleDeleteInventory = (item: InventoryItem) => {
    Alert.alert(
      t.deleteConfirmTitle,
      `${t.deleteItemBodyPrefix} ${item.name}?`,
      [{ text: t.cancel, style: "cancel" }, { text: t.deleteConfirmBtn, style: "destructive", onPress: () => deleteInventoryItem(item.id) }]
    );
  };

  const MONEY_TABS: Array<{ id: MoneyTab; label: string; iconName: keyof typeof Feather.glyphMap }> = [
    { id: "income", label: t.incomeTab, iconName: "trending-up" },
    { id: "expense", label: t.expenseTab, iconName: "trending-down" },
    { id: "inventory", label: t.inventoryTab, iconName: "package" },
  ];

  const getExpCatLabel = (key: string) => {
    const rec = EXPENSE_CAT_LABELS[key];
    if (!rec) return key;
    return rec[language] ?? rec.en ?? key;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t.financeTitle}</Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.success }]}>
            <Text style={styles.statCardLabel}>{t.totalIncome}</Text>
            <Text style={styles.statCardValue}>{formatRupee(totalIncome)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.destructive }]}>
            <Text style={styles.statCardLabel}>{t.totalExpense}</Text>
            <Text style={styles.statCardValue}>{formatRupee(totalExpenses)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: profit >= 0 ? "#0284c7" : "#7c3aed" }]}>
            <Text style={styles.statCardLabel}>{t.profit}</Text>
            <Text style={styles.statCardValue}>{formatRupee(profit)}</Text>
          </View>
        </View>
      </View>

      {!isLoaded ? (
        <View style={[styles.empty, { flex: 1, justifyContent: "center" }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t.loadingTasks}</Text>
        </View>
      ) : (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.list, { paddingBottom: isWeb ? 120 : 100 }]} showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reloadData(); setRefreshing(false); }} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {/* 7-day chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>{t.sevenDayFinancials}</Text>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{t.income}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.destructive }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{t.expense}</Text>
              </View>
            </View>
          </View>
          <FinancialChart data={chartData} />
        </View>

        {/* Low stock banner */}
        {lowStockItems.length > 0 && (
          <Pressable style={[styles.lowStockBanner, { backgroundColor: colors.warning + "12", borderColor: colors.warning + "40" }]} onPress={() => setActiveTab("inventory")}>
            <Feather name="alert-triangle" size={16} color={colors.warning} />
            <Text style={[styles.lowStockText, { color: colors.warning }]}>
              {lowStockItems.length} {t.lowStockItems}: {lowStockItems.map((i) => i.name).join(", ")}
            </Text>
            <Feather name="chevron-right" size={14} color={colors.warning} />
          </Pressable>
        )}

        {/* Tab row */}
        <View style={[styles.tabRow, { borderColor: colors.border }]}>
          {MONEY_TABS.map((tab) => (
            <Pressable
              key={tab.id}
              style={[styles.tabBtn, { borderBottomColor: activeTab === tab.id ? colors.primary : "transparent", borderBottomWidth: 2 }]}
              onPress={() => { setActiveTab(tab.id); Haptics.selectionAsync(); }}
            >
              <Feather name={tab.iconName} size={16} color={activeTab === tab.id ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.tabLabel, { color: activeTab === tab.id ? colors.primary : colors.mutedForeground }]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── INCOME TAB ── */}
        {activeTab === "income" && (
          incomeEntries.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="dollar-sign" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {lx({ ta: "வருமானம் இல்லை", te: "ఆదాయం లేదు", kn: "ಆದಾಯ ಇಲ್ಲ", ml: "വരുമാനം ഇല്ല", hi: "कोई आय नहीं", en: "No income yet" })}
              </Text>
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
                    {hasDiscrepancy && (
                      <Text style={[styles.discrepancy, { color: diff < 0 ? colors.destructive : colors.success }]}>
                        {diff < 0
                          ? `⚠ ${lx({ ta: "இழப்பு", te: "నష్టం", kn: "ಕಡಿಮೆ", ml: "കുറഞ്ഞ", hi: "कम", en: "Under" })}: ${formatRupeeFull(-diff)}`
                          : `✓ ${lx({ ta: "கூடுதல்", te: "అదనం", kn: "ಹೆಚ್ಚು", ml: "അധിക", hi: "अधिक", en: "Over" })}: ${formatRupeeFull(diff)}`}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.entryAmount, { color: colors.foreground }]}>{formatRupeeFull(e.totalReceived)}</Text>
                    <Text style={[styles.expectedAmount, { color: colors.mutedForeground }]}>
                      {lx({ ta: "எதிர்", te: "అంచనా", kn: "ನಿರೀಕ್ಷಿತ", ml: "പ്രതീക്ഷ", hi: "अनुमान", en: "Exp" })}: {formatRupeeFull(e.totalExpected)}
                    </Text>
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
                <Text style={[styles.chartTitle, { color: colors.foreground }]}>{t.expenseBreakdown}</Text>
                {Object.keys(EXPENSE_CAT_LABELS).filter((k) => expenseSummary[k] != null && expenseSummary[k]! > 0).map((key) => {
                  const pct = Math.round((expenseSummary[key]! / totalExpenses) * 100);
                  return (
                    <View key={key} style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: colors.foreground }]}>{getExpCatLabel(key)}</Text>
                      <View style={[styles.breakdownBarBg, { backgroundColor: colors.muted }]}>
                        <View style={[styles.breakdownBarFill, { width: `${pct}%`, backgroundColor: colors.accent }]} />
                      </View>
                      <Text style={[styles.breakdownValue, { color: colors.accent }]}>{formatRupee(expenseSummary[key]!)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
            {expenseEntries.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="credit-card" size={48} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {lx({ ta: "செலவுகள் இல்லை", te: "వ్యయాలు లేవు", kn: "ವೆಚ್ಚಗಳಿಲ್ಲ", ml: "ചെലവ് ഇല്ല", hi: "कोई खर्च नहीं", en: "No expenses yet" })}
                </Text>
              </View>
            ) : (
              expenseEntries.map((e) => (
                <View key={e.id} style={[styles.entryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.expIcon, { backgroundColor: colors.warning + "18" }]}>
                    <Feather name="tag" size={16} color={colors.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.entryTitle, { color: colors.foreground }]}>{e.description}</Text>
                    <Text style={[styles.entrySub, { color: colors.mutedForeground }]}>{getExpCatLabel(e.category)} • {e.date}</Text>
                  </View>
                  <Text style={[styles.expAmount, { color: colors.destructive }]}>-{formatRupeeFull(e.amount)}</Text>
                </View>
              ))
            )}
          </>
        )}

        {/* ── INVENTORY TAB ── */}
        {activeTab === "inventory" && (
          <>
            {inventoryValue > 0 && (
              <View style={[styles.inventoryValueCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                <Text style={[styles.inventoryValueLabel, { color: colors.primary }]}>{t.totalInventoryValue}</Text>
                <Text style={[styles.inventoryValueAmount, { color: colors.primary }]}>{formatRupeeFull(inventoryValue)}</Text>
              </View>
            )}

            {inventoryItems.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="package" size={48} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t.noInventory}</Text>
                <Pressable style={[styles.addFirstBtn, { backgroundColor: colors.primary + "15" }]} onPress={() => { setEditInventoryItem(undefined); setInventoryModal(true); }}>
                  <Text style={[styles.addFirstBtnText, { color: colors.primary }]}>{t.addFirstItem}</Text>
                </Pressable>
              </View>
            ) : (
              inventoryItems.map((item) => {
                const isLow = item.quantity <= item.minQuantity && item.minQuantity > 0;
                const catColor = CATEGORY_COLORS[item.category];
                const catIcon = CATEGORY_ICONS[item.category];
                const stockPct = item.minQuantity > 0 ? Math.min(item.quantity / (item.minQuantity * 2), 1) : 0.5;

                return (
                  <View
                    key={item.id}
                    style={[styles.inventoryCard, { backgroundColor: colors.card, borderColor: isLow ? colors.destructive : colors.border, borderLeftColor: catColor, borderLeftWidth: 4 }]}
                  >
                    <View style={styles.inventoryCardTop}>
                      <View style={styles.inventoryCardLeft}>
                        <Feather name={catIcon} size={20} color={catColor} style={{ marginRight: 8 }} />
                        <View>
                          <Text style={[styles.inventoryItemName, { color: colors.foreground }]}>{item.name}</Text>
                          <Text style={[styles.inventoryItemCat, { color: colors.mutedForeground }]}>{item.category}</Text>
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

                    <View style={styles.stockRow}>
                      <View style={styles.stockQtyRow}>
                        <Pressable style={[styles.qtyBtn, { backgroundColor: colors.muted }]} onPress={() => adjustInventoryQuantity(item.id, -1)}>
                          <Feather name="minus" size={14} color={colors.foreground} />
                        </Pressable>
                        <Text style={[styles.stockQty, { color: isLow ? colors.destructive : colors.foreground }]}>
                          {item.quantity} {item.unit}
                        </Text>
                        <Pressable style={[styles.qtyBtn, { backgroundColor: colors.muted }]} onPress={() => adjustInventoryQuantity(item.id, 1)}>
                          <Feather name="plus" size={14} color={colors.foreground} />
                        </Pressable>
                      </View>
                      {item.pricePerUnit != null && (
                        <Text style={[styles.priceTag, { color: colors.mutedForeground }]}>₹{item.pricePerUnit}/{item.unit}</Text>
                      )}
                    </View>

                    {item.minQuantity > 0 && (
                      <View style={[styles.stockBarBg, { backgroundColor: colors.muted }]}>
                        <View style={[styles.stockBarFill, { width: `${Math.round(stockPct * 100)}%`, backgroundColor: isLow ? colors.destructive : colors.primary }]} />
                      </View>
                    )}

                    {isLow && (
                      <View style={[styles.lowStockTag, { backgroundColor: colors.destructive + "15" }]}>
                        <Feather name="alert-triangle" size={12} color={colors.destructive} />
                        <Text style={[styles.lowStockTagText, { color: colors.destructive }]}>
                          {lx({ ta: "குறைவு!", te: "తక్కువ!", kn: "ಕಡಿಮೆ!", ml: "കുറവ്!", hi: "कम!", en: "Low stock!" })} {lx({ ta: "குறைந்தபட்சம்", te: "కనిష్ట", kn: "ಕನಿಷ್ಠ", ml: "ഏറ്റവും കുറഞ്ഞ", hi: "न्यूनतम", en: "Min" })}: {item.minQuantity} {item.unit}
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
      )}

      {/* FAB */}
      <Pressable
        style={[styles.fab, { backgroundColor: activeTab === "inventory" ? colors.accent : colors.primary, bottom: Platform.OS === "web" ? 100 : 84 + insets.bottom }]}
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
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t.addIncome}</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={buyer} onChangeText={setBuyer}
              placeholder={lx({ ta: "கொள்முதல்காரர் பெயர்", te: "కొనుగోలుదారు పేరు", kn: "ಖರೀದಿದಾರ ಹೆಸರು", ml: "വാങ്ങുന്നയാൾ", hi: "खरीदार का नाम", en: "Buyer / Cooperative name" })}
              placeholderTextColor={colors.mutedForeground} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={qty} onChangeText={setQty}
                placeholder={lx({ ta: "அளவு (L)", te: "పరిమాణం (L)", kn: "ಪ್ರಮಾಣ (L)", ml: "അളവ് (L)", hi: "मात्रा (L)", en: "Qty (L)" })}
                keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
              <TextInput style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={rate} onChangeText={setRate} placeholder="₹/L (42)" keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
            </View>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={received} onChangeText={setReceived}
              placeholder={lx({ ta: "கிடைத்த தொகை ₹", te: "అందిన మొత్తం ₹", kn: "ಸ್ವೀಕರಿಸಿದ ₹", ml: "ലഭിച്ച തുക ₹", hi: "प्राप्त राशि ₹", en: "Amount received ₹" })}
              keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={fatPct} onChangeText={setFatPct}
              placeholder={lx({ ta: "கொழுப்பு % (விருப்பம்)", te: "కొవ్వు % (ఐచ్ఛికం)", kn: "ಕೊಬ್ಬು % (ಐಚ್ಛಿಕ)", ml: "കൊഴുപ്പ് % (ഐഛിക)", hi: "FAT % (वैकल्पिक)", en: "FAT % (optional)" })}
              keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
            <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAddIncome}>
              <Text style={styles.saveBtnText}>{t.save}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Expense Modal */}
      <Modal visible={expenseModal} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setExpenseModal(false)}>
          <Pressable style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t.addExpense}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
              {Object.keys(EXPENSE_CAT_LABELS).map((key) => (
                <Pressable key={key} style={[styles.catChip, { backgroundColor: expCategory === key ? colors.primary : colors.muted, borderColor: expCategory === key ? colors.primary : colors.border }]} onPress={() => setExpCategory(key as ExpenseEntry["category"])}>
                  <Text style={[styles.catLabel, { color: expCategory === key ? "#fff" : colors.mutedForeground }]}>{getExpCatLabel(key)}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={expDesc} onChangeText={setExpDesc}
              placeholder={lx({ ta: "விவரம்", te: "వివరణ", kn: "ವಿವರಣೆ", ml: "വിവരണം", hi: "विवरण", en: "Description" })}
              placeholderTextColor={colors.mutedForeground} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]} value={expAmount} onChangeText={setExpAmount}
              placeholder={lx({ ta: "தொகை ₹", te: "మొత్తం ₹", kn: "ಮೊತ್ತ ₹", ml: "തുക ₹", hi: "राशि ₹", en: "Amount ₹" })}
              keyboardType="decimal-pad" placeholderTextColor={colors.mutedForeground} />
            <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAddExpense}>
              <Text style={styles.saveBtnText}>{t.save}</Text>
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
    borderWidth: 1,
    borderRadius: 12, padding: 12,
  },
  lowStockText: { flex: 1, fontSize: 13, fontWeight: "500" },
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
    borderRadius: 14, padding: 14, borderWidth: 1,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  inventoryValueLabel: { fontSize: 13, fontWeight: "600" },
  inventoryValueAmount: { fontSize: 20, fontWeight: "700" },
  addFirstBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  addFirstBtnText: { fontWeight: "700", fontSize: 14 },
  inventoryCard: {
    backgroundColor: undefined, borderRadius: 14, padding: 12, borderWidth: 1,
    gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  inventoryCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  inventoryCardLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  inventoryCatEmoji: { fontSize: 24 },
  inventoryItemName: { fontSize: 15, fontWeight: "700" },
  inventoryItemCat: { fontSize: 11, textTransform: "capitalize" },
  inventoryActions: { flexDirection: "row", gap: 8 },
  inventoryEditBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" },
  inventoryDeleteBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" },
  stockRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stockQtyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stockQty: { fontSize: 16, fontWeight: "700", minWidth: 60, textAlign: "center" },
  priceTag: { fontSize: 12 },
  stockBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  stockBarFill: { height: 6, borderRadius: 3 },
  lowStockTag: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, padding: 6 },
  lowStockTagText: { fontSize: 12, fontWeight: "600" },
});

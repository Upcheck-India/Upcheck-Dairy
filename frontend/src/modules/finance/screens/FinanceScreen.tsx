import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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
  Image,
} from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useFarm } from "../../farms/hooks/useFarm";
import { useFinance } from "../hooks/useFinance";
import { useInventory } from "../../inventory/hooks/useInventory";
import type { IncomeEntry, ExpenseEntry } from "../models/FinanceEntries";
import { compute7DayFinancials, computeTodayExpenses, computeTodayIncome } from "../services/financeSummary";
import type { ExpenseCategory } from "../types/FinanceDto";
import { apiClient } from "../../../core/api/ApiClient";
import InventoryModal from "@/components/InventoryModal";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = Math.max(280, SCREEN_WIDTH - 48);
const CHART_HEIGHT = 130;

type FinanceSection = "overview" | "passbook" | "reports" | "inventory";
type QuickActionId = "recordMilk" | "addExpense" | "uploadBill" | "uploadPayslip" | "recordPayment" | "transferOther";

type ModalMode =
  | { kind: "closed" }
  | { kind: "milk-sale" }
  | { kind: "expense"; presetCategory?: ExpenseCategory }
  | { kind: "bill" }
  | { kind: "payslip" }
  | { kind: "payment" }
  | { kind: "transfer" };

type PassbookEntry =
  | {
      key: string;
      kind: "Milk" | "Expense" | "Payment" | "Bills" | "Payslip";
      title: string;
      subtitle: string;
      date: Date;
      amount: number;
      tone: "income" | "expense";
      icon: keyof typeof Feather.glyphMap;
      badge?: string;
      sourceType: "income";
      source: IncomeEntry;
    }
  | {
      key: string;
      kind: "Milk" | "Expense" | "Payment" | "Bills" | "Payslip";
      title: string;
      subtitle: string;
      date: Date;
      amount: number;
      tone: "income" | "expense";
      icon: keyof typeof Feather.glyphMap;
      badge?: string;
      sourceType: "expense";
      source: ExpenseEntry;
    };

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

// Custom chart component
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
            <Rect x={x} y={CHART_HEIGHT - incomeH} width={barWidth} height={incomeH || 2} fill={d.income > 0 ? "#16a34a" : "#e5e7eb"} rx={3} />
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
  feed: { ta: "🌾 தீவனம்", te: "🌾 மேత", kn: "🌾 ಮೇವು", ml: "🌾 തീറ്റ", hi: "🌾 चारा", en: "🌾 Feed" },
  medicine: { ta: "மருந்து", te: "మందు", kn: "ಔಷಧ", ml: "മരുന്ന്", hi: "दवाई", en: "Medicine" },
  labor: { ta: "👷 தொழிலாளர்", te: "👷 கூలీ", kn: "👷 ಕಾರ್ಮಿಕ", ml: "👷 തൊഴിലാളി", hi: "👷 मजदूरी", en: "👷 Labor" },
  equipment: { ta: "🔧 உபகரணம்", te: "🔧 పరికరాలు", kn: "🔧 ಸಾಧನ", ml: "🔧 உபකරணம்", hi: "🔧 उपकरण", en: "🔧 Equipment" },
  other: { ta: "📦 மற்றவை", te: "📦 ఇతరాలు", kn: "📦 ಇತರ", ml: "📦 മറ്റുള്ളവ", hi: "📦 अन्य", en: "📦 Other" },
};

const CATEGORY_COLORS: Record<string, string> = {
  feed: "#16a34a", medicine: "#0284c7", supplement: "#7c3aed",
  equipment: "#d97706", other: "#6b7280", labor: "#ea580c",
};

const CATEGORY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  feed: "box", medicine: "activity", supplement: "heart", equipment: "tool", other: "package", labor: "users",
};

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad";
  multiline?: boolean;
}
function InputField({ label, value, onChangeText, placeholder, keyboardType, multiline }: InputFieldProps) {
  const colors = useColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
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

interface SelectPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}
function SelectPill({ label, active, onPress }: SelectPillProps) {
  const colors = useColors();
  return (
    <Pressable
      style={[
        styles.selectPill,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? `${colors.primary}12` : colors.card,
        },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.selectPillText, { color: active ? colors.primary : colors.mutedForeground }]}>{label}</Text>
    </Pressable>
  );
}

interface SectionChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}
function SectionChip({ label, active, onPress }: SectionChipProps) {
  const colors = useColors();
  return (
    <Pressable
      style={[
        styles.sectionChip,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.primary : colors.card,
        },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.sectionChipText, { color: active ? "#fff" : colors.mutedForeground }]}>{label}</Text>
    </Pressable>
  );
}

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
}
function InfoCard({ title, children }: InfoCardProps) {
  const colors = useColors();
  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  accent: string;
  icon: keyof typeof Feather.glyphMap;
}
function StatCard({ label, value, accent, icon }: StatCardProps) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={[styles.statIcon, { backgroundColor: `${accent}15` }]}>
        <Feather name={icon} size={16} color={accent} />
      </View>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

interface ModalShellProps {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}
function ModalShell({ title, visible, onClose, children }: ModalShellProps) {
  const colors = useColors();
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>{title}</Text>
          <Pressable onPress={onClose} style={{ padding: 6 }}>
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
  const tabBarHeight = useTabBarHeight();
  const { language, t } = useLanguage();
  const { activeFarm } = useFarm();
  const { incomeEntries, expenseEntries, addIncome, addExpense, refresh: refreshFinance, loading: financeLoading } = useFinance();
  const {
    inventoryItems,
    removeItem: deleteInventoryItem,
    adjustQuantity: adjustInventoryQuantity,
    refresh: refreshInventory,
    loading: inventoryLoading,
  } = useInventory();

  const isLoaded = !financeLoading && !inventoryLoading;
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const [refreshing, setRefreshing] = useState(false);
  const [section, setSection] = useState<FinanceSection>("overview");
  const [quickSheetVisible, setQuickSheetVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>({ kind: "closed" });
  const [selectedEntry, setSelectedEntry] = useState<PassbookEntry | null>(null);
  const [activePassbookFilter, setActivePassbookFilter] = useState<"All" | "Milk" | "Expense" | "Payment" | "Bills" | "Payslip">("All");

  // Document picking & preview flow state
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3>(1);
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  // Form states
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

  const [payslipCycle, setPayslipCycle] = useState("1 - 15 Jul 2025");
  const [payslipPaymentDate, setPayslipPaymentDate] = useState("15 Jul 2025");
  const [payslipMilk, setPayslipMilk] = useState("2430");
  const [payslipNetPayable, setPayslipNetPayable] = useState("47850");
  const [payslipNotes, setPayslipNotes] = useState("Payslip received from dairy");

  // Inventory modal management
  const [inventoryModal, setInventoryModal] = useState(false);
  const [editInventoryItem, setEditInventoryItem] = useState<any | undefined>(undefined);

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

  // Derived Payment Status cards values from entries or fallback
  const lastPayslip = useMemo(() => {
    return [...incomeEntries].reverse().find(
      (e) => e.buyer.toLowerCase().includes("payment received") || e.notes?.toLowerCase().includes("payslip")
    );
  }, [incomeEntries]);

  const nextPayslip = useMemo(() => {
    return [...incomeEntries].reverse().find(
      (e) => e.buyer.toLowerCase().includes("payment expected") || (e.totalExpected > 0 && e.totalReceived === 0)
    );
  }, [incomeEntries]);

  const passbookEntries = useMemo<PassbookEntry[]>(() => {
    const items = [
      ...incomeEntries.map((entry) => {
        const isPayslip = entry.notes?.toLowerCase().includes("payslip") || entry.buyer.toLowerCase().includes("payment received");
        const isExpected = entry.buyer.toLowerCase().includes("payment expected") || (entry.totalExpected > 0 && entry.totalReceived === 0);
        return {
          key: `income-${entry.id}`,
          kind: isExpected ? ("Payment" as const) : isPayslip ? ("Payslip" as const) : ("Milk" as const),
          title: entry.buyer,
          subtitle: isExpected ? `Expected on ${entry.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}` : `${entry.quantitySold.toLocaleString("en-IN")} L · ${entry.dateString}`,
          date: entry.date,
          amount: isExpected ? entry.totalExpected : entry.totalReceived,
          tone: isExpected ? ("expense" as const) : ("income" as const), // Expected is orange, color maps to expense tone
          icon: isExpected ? ("clock" as const) : isPayslip ? ("file-text" as const) : ("droplet" as const),
          badge: entry.pendingAmount > 0 && !isExpected ? `${formatRupeeFull(entry.pendingAmount)} pending` : entry.attachmentUrl ? "Payslip attached" : undefined,
          sourceType: "income" as const,
          source: entry,
        };
      }),
      ...expenseEntries.map((entry) => {
        const isBill = entry.description.toLowerCase().includes("bill attached") || entry.attachmentUrl;
        return {
          key: `expense-${entry.id}`,
          kind: isBill ? ("Bills" as const) : ("Expense" as const),
          title: entry.description,
          subtitle: `${entry.category.toUpperCase()} · ${entry.dateString}`,
          date: entry.date,
          amount: entry.amount,
          tone: "expense" as const,
          icon: isBill ? ("paperclip" as const) : ("arrow-up-right" as const),
          badge: isBill ? "Bill attached" : undefined,
          sourceType: "expense" as const,
          source: entry,
        };
      }),
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
    await Promise.all([refreshFinance(), refreshInventory()]);
    setRefreshing(false);
  };

  const openQuickAction = (actionId: QuickActionId) => {
    Haptics.selectionAsync();
    setQuickSheetVisible(false);
    setUploadStep(1);
    setPickedFile(null);
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

  // Image & PDF picker permissions / pickers
  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus.status !== "granted" || libraryStatus.status !== "granted") {
        Alert.alert("Permission Required", "Please allow camera and gallery access to upload documents.");
        return false;
      }
    }
    return true;
  };

  const pickFromCamera = async () => {
    const hasPerm = await requestPermissions();
    if (!hasPerm) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setPickedFile({
        uri: asset.uri,
        name: asset.fileName || `camera_${Date.now()}.jpg`,
        type: "image/jpeg",
      });
      setUploadStep(2);
    }
  };

  const pickFromGallery = async () => {
    const hasPerm = await requestPermissions();
    if (!hasPerm) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setPickedFile({
        uri: asset.uri,
        name: asset.fileName || `gallery_${Date.now()}.jpg`,
        type: "image/jpeg",
      });
      setUploadStep(2);
    }
  };

  const pickPDF = async () => {
    try {
      const DocumentPicker = await import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setPickedFile({
          uri: asset.uri,
          name: asset.name || `doc_${Date.now()}.pdf`,
          type: asset.mimeType || "application/pdf",
        });
        setUploadStep(2);
      }
    } catch (error) {
      Alert.alert(
        "PDF upload unavailable",
        "Document picking is not available in this build right now. You can still add records without a PDF attachment."
      );
    }
  };

  const uploadPickedFile = async (): Promise<string | null> => {
    if (!pickedFile) return null;
    try {
      setUploading(true);
      const res = await apiClient.uploadFile<{ url: string }>(
        "/financials/upload",
        pickedFile.uri,
        pickedFile.name,
        pickedFile.type
      );
      return res.url;
    } catch (err) {
      console.warn("[uploadPickedFile] upload failed, fallback to offline local uri reference", err);
      return pickedFile.uri;
    } finally {
      setUploading(false);
    }
  };

  // Seed demo data matching mockup
  const seedDemoData = async () => {
    if (!activeFarm?.id) return;
    try {
      setRefreshing(true);
      
      // 1. Milk Sale Morning
      await addIncome({
        farmId: activeFarm.id,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        buyer: "Milk Sale - Morning",
        quantitySold: 250,
        ratePerLitre: 50,
        totalExpected: 12500,
        totalReceived: 12500,
        fatPercentage: 4.2,
        snfPercentage: 8.6,
        notes: "Morning collection log",
      });

      // 2. Feed Purchase
      await addExpense({
        farmId: activeFarm.id,
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        category: "feed",
        description: "Feed Purchase",
        amount: 4800,
        attachmentUrl: "/uploads/mock_bill.png",
      });

      // 3. Veterinary Expense
      await addExpense({
        farmId: activeFarm.id,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        category: "medicine",
        description: "Veterinary Expense",
        amount: 1250,
      });

      // 4. Payment Received
      await addIncome({
        farmId: activeFarm.id,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        buyer: "Payment Received (1 - 15 Jul)",
        quantitySold: 2430,
        ratePerLitre: 19.69,
        totalExpected: 95520,
        totalReceived: 47850,
        notes: "Payslip received from dairy",
        attachmentUrl: "/uploads/mock_payslip.png",
      });

      // 5. Payment Expected
      await addIncome({
        farmId: activeFarm.id,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        buyer: "Payment Expected (16 - 31 Jul)",
        quantitySold: 2615,
        ratePerLitre: 20,
        totalExpected: 52300,
        totalReceived: 0,
        notes: "Expected payment cycle log",
      });

      // 6. Labour Payment
      await addExpense({
        farmId: activeFarm.id,
        date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        category: "labor",
        description: "Labour Payment",
        amount: 6000,
      });

      await refreshFinance();
      Alert.alert("Success", "Mock passbook data seeded successfully!");
    } catch (e) {
      Alert.alert("Error", "Failed to seed demo data");
    } finally {
      setRefreshing(false);
    }
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

    try {
      const attachmentUrl = await uploadPickedFile();
      await addExpense({
        farmId: activeFarm.id,
        date: new Date().toISOString(),
        category: expenseCategory,
        description: `${billVendor.trim()}${attachmentUrl ? " · Bill attached" : ""}`,
        amount,
        attachmentUrl,
      });
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

    try {
      const attachmentUrl = await uploadPickedFile();
      await addIncome({
        farmId: activeFarm.id,
        date: new Date().toISOString(),
        buyer: `Payment Received (${payslipCycle})`,
        quantitySold: milk,
        ratePerLitre: milk > 0 ? amount / milk : amount,
        totalExpected: amount,
        totalReceived: amount,
        notes: `${payslipNotes.trim() || "Payslip uploaded"}${attachmentUrl ? " · Payslip attached" : ""}`,
        attachmentUrl,
      });
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

  // Low stock inventory helpers
  const lowStockItems = inventoryItems.filter((item) => item.quantity <= item.minQuantity && item.minQuantity > 0);
  const inventoryValue = inventoryItems.reduce((s, i) => s + i.quantity * (i.pricePerUnit ?? 0), 0);

  const getExpCatLabel = (key: string) => {
    const rec = EXPENSE_CAT_LABELS[key];
    if (!rec) return key;
    return rec[language] ?? rec.en ?? key;
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
            <Feather name={financeLoading || inventoryLoading ? "refresh-cw" : "check-circle"} size={14} color={colors.primary} />
            <Text style={[styles.syncText, { color: colors.primary }]}>{financeLoading || inventoryLoading ? "Refreshing" : "Synced"}</Text>
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
          <SectionChip label="Inventory" active={section === "inventory"} onPress={() => setSection("inventory")} />
        </View>
      </LinearGradient>

      {!isLoaded ? (
        <View style={[styles.loadingWrap, { flex: 1 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Loading finance records...</Text>
        </View>
      ) : incomeEntries.length === 0 && expenseEntries.length === 0 ? (
        <View style={[styles.emptyState, { flex: 1 }]}>
          <Feather name="book-open" size={42} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No finance records yet</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Use the green + button or seed mockup data to see passbook in action.</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Pressable style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => setQuickSheetVisible(true)}>
              <Text style={styles.primaryBtnText}>Open quick actions</Text>
            </Pressable>
            <Pressable style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={seedDemoData}>
              <Text style={styles.primaryBtnText}>Seed demo data</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 52 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          showsVerticalScrollIndicator={false}
        >
          {section === "overview" && (
            <>
              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <StatCard label={t.totalIncome} value={formatRupee(totalIncome)} accent="#16a34a" icon="trending-up" />
                <StatCard label={t.totalExpense} value={formatRupee(totalExpenses)} accent="#ef4444" icon="trending-down" />
                <StatCard label={t.profit} value={formatRupee(profit)} accent={profit >= 0 ? "#0f766e" : "#7c3aed"} icon={profit >= 0 ? "arrow-up-right" : "alert-triangle"} />
                <StatCard label="Milk sold" value={`${milkSold.toLocaleString("en-IN")} L`} accent="#0284c7" icon="droplet" />
              </View>

              {/* Today Summary Strip */}
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

              {/* Payment Status (Mockup Cards) */}
              <InfoCard title="Payment Status">
                <View style={styles.paymentStatusBlock}>
                  {/* Last Payment Card */}
                  <View style={[styles.paymentCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <View style={styles.paymentCardHeader}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={[styles.circleIcon, { backgroundColor: "#16a34a15" }]}>
                          <Feather name="check" size={14} color="#16a34a" />
                        </View>
                        <Text style={[styles.paymentPeriod, { color: colors.foreground }]}>
                          Last Payment {lastPayslip ? `(${lastPayslip.buyer.replace("Payment Received", "").replace(/[()]/g, "").trim()})` : "(1 - 15 Jul)"}
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: "#dcfce7" }]}>
                        <Text style={[styles.badgeText, { color: "#16a34a" }]}>Paid</Text>
                      </View>
                    </View>
                    <Text style={[styles.paymentAmount, { color: colors.foreground }]}>
                      {lastPayslip ? formatRupeeFull(lastPayslip.totalReceived) : "₹47,850"}
                    </Text>
                    <Pressable
                      style={styles.paymentAction}
                      onPress={() => {
                        if (lastPayslip) {
                          setSelectedEntry({
                            key: `income-${lastPayslip.id}`,
                            kind: "Payslip",
                            title: lastPayslip.buyer,
                            subtitle: `${lastPayslip.quantitySold} L · ${lastPayslip.dateString}`,
                            date: lastPayslip.date,
                            amount: lastPayslip.totalReceived,
                            tone: "income",
                            icon: "file-text",
                            sourceType: "income",
                            source: lastPayslip,
                          });
                        } else {
                          Alert.alert("Demo Mode", "No actual payslip entry found. Seed demo data to unlock details.");
                        }
                      }}
                    >
                      <Text style={[styles.paymentActionText, { color: colors.primary }]}>View Payslip &gt;</Text>
                    </Pressable>
                  </View>

                  {/* Next Payment Card */}
                  <View style={[styles.paymentCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <View style={styles.paymentCardHeader}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={[styles.circleIcon, { backgroundColor: "#ea580c15" }]}>
                          <Feather name="calendar" size={14} color="#ea580c" />
                        </View>
                        <Text style={[styles.paymentPeriod, { color: colors.foreground }]}>
                          Next Payment {nextPayslip ? `(${nextPayslip.buyer.replace("Payment Expected", "").replace(/[()]/g, "").trim()})` : "(16 - 31 Jul)"}
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: "#ffedd5" }]}>
                        <Text style={[styles.badgeText, { color: "#ea580c" }]}>Expected</Text>
                      </View>
                    </View>
                    <Text style={[styles.paymentAmount, { color: colors.foreground }]}>
                      {nextPayslip ? formatRupeeFull(nextPayslip.totalExpected) : "₹52,300"}
                    </Text>
                    <Text style={[styles.paymentSubtext, { color: colors.mutedForeground }]}>
                      {nextPayslip ? `Expected on ${formatShortDate(nextPayslip.date)}` : "Expected on 18 Jul 2025"}
                    </Text>
                  </View>

                  {/* Money Pending Card */}
                  <View style={[styles.paymentCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <View style={styles.paymentCardHeader}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={[styles.circleIcon, { backgroundColor: "#7c3aed15" }]}>
                          <Feather name="clock" size={14} color="#7c3aed" />
                        </View>
                        <Text style={[styles.paymentPeriod, { color: colors.foreground }]}>Money Pending</Text>
                      </View>
                    </View>
                    <Text style={[styles.paymentAmount, { color: colors.foreground }]}>
                      {formatRupeeFull(pendingPayments || 28600)}
                    </Text>
                    <Pressable
                      style={styles.paymentAction}
                      onPress={() => {
                        setSection("passbook");
                        setActivePassbookFilter("All");
                      }}
                    >
                      <Text style={[styles.paymentActionText, { color: colors.primary }]}>View Details &gt;</Text>
                    </Pressable>
                  </View>
                </View>
              </InfoCard>

              {/* 7-Day Financials Chart */}
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

              {/* Smart Insights */}
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
              {/* Passbook Filters */}
              <View style={[styles.filterRow, { borderColor: colors.border }]}>
                {filters.map((filter) => (
                  <SelectPill key={filter} label={filter} active={activePassbookFilter === filter} onPress={() => setActivePassbookFilter(filter)} />
                ))}
              </View>

              {/* Passbook Timeline */}
              <InfoCard title="Passbook Timeline">
                <View style={styles.timelineList}>
                  {visiblePassbookEntries.length === 0 ? (
                    <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>No entries in this filter.</Text>
                  ) : (
                    visiblePassbookEntries.map((entry) => (
                      <PassbookRow key={entry.key} entry={entry} onPress={() => setSelectedEntry(entry)} />
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
                <StatCard label="Bills attached" value={expenseEntries.filter((entry) => entry.attachmentUrl).length.toString()} accent="#3b82f6" icon="paperclip" />
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

          {section === "inventory" && (
            <>
              {inventoryValue > 0 && (
                <View style={[styles.inventoryValueCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                  <Text style={[styles.inventoryValueLabel, { color: colors.primary }]}>{t.totalInventoryValue}</Text>
                  <Text style={[styles.inventoryValueAmount, { color: colors.primary }]}>{formatRupeeFull(inventoryValue)}</Text>
                </View>
              )}

              {/* Low stock banner */}
              {lowStockItems.length > 0 && (
                <View style={[styles.lowStockBanner, { backgroundColor: colors.warning + "12", borderColor: colors.warning + "40" }]}>
                  <Feather name="alert-triangle" size={16} color={colors.warning} />
                  <Text style={[styles.lowStockText, { color: colors.warning }]}>
                    {lowStockItems.length} {t.lowStockItems}: {lowStockItems.map((i) => i.name).join(", ")}
                  </Text>
                </View>
              )}

              {inventoryItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="package" size={48} color={colors.border} />
                  <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{t.noInventory}</Text>
                  <Pressable style={[styles.primaryBtn, { backgroundColor: colors.primary + "15", marginTop: 8 }]} onPress={() => { setEditInventoryItem(undefined); setInventoryModal(true); }}>
                    <Text style={[styles.primaryBtnText, { color: colors.primary }]}>{t.addFirstItem}</Text>
                  </Pressable>
                </View>
              ) : (
                inventoryItems.map((item) => {
                  const isLow = item.quantity <= item.minQuantity && item.minQuantity > 0;
                  const catColor = CATEGORY_COLORS[item.category] || colors.primary;
                  const catIcon = CATEGORY_ICONS[item.category] || "package";
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
                          <Pressable style={styles.inventoryDeleteBtn} onPress={() => {
                            Alert.alert(
                              t.deleteConfirmTitle,
                              `${t.deleteItemBodyPrefix} ${item.name}?`,
                              [{ text: t.cancel, style: "cancel" }, { text: t.deleteConfirmBtn, style: "destructive", onPress: () => {
                                deleteInventoryItem(Number(item.id)).catch(err => console.error(err));
                              } }]
                            );
                          }}>
                            <Feather name="trash-2" size={14} color="#dc2626" />
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.stockRow}>
                        <View style={styles.stockQtyRow}>
                          <Pressable style={[styles.qtyBtn, { backgroundColor: colors.muted }]} onPress={() => {
                            adjustInventoryQuantity(Number(item.id), -1).catch(err => console.error(err));
                          }}>
                            <Feather name="minus" size={14} color={colors.foreground} />
                          </Pressable>
                          <Text style={[styles.stockQty, { color: isLow ? colors.destructive : colors.foreground }]}>
                            {item.quantity} {item.unit}
                          </Text>
                          <Pressable style={[styles.qtyBtn, { backgroundColor: colors.muted }]} onPress={() => {
                            adjustInventoryQuantity(Number(item.id), 1).catch(err => console.error(err));
                          }}>
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
                            Low stock! Min: {item.minQuantity} {item.unit}
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

      {/* Floating Action Button (FAB) */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.primary, bottom: tabBarHeight + 16 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (section === "inventory") {
            setEditInventoryItem(undefined);
            setInventoryModal(true);
          } else {
            setQuickSheetVisible(true);
          }
        }}
      >
        <Feather name="plus" size={24} color="#fff" />
      </Pressable>

      {/* Quick Actions Drawer Modal */}
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

      {/* Full Record Details Modal */}
      <ModalShell title="Record Details" visible={selectedEntry !== null} onClose={() => setSelectedEntry(null)}>
        {selectedEntry ? (
          <>
            <View style={[styles.detailHero, { borderColor: colors.border, backgroundColor: selectedEntry.tone === "income" ? `${colors.primary}10` : `${colors.destructive}10` }]}>
              <View style={[styles.detailIcon, { backgroundColor: selectedEntry.tone === "income" ? `${colors.primary}18` : `${colors.destructive}18` }]}>
                <Feather name={selectedEntry.icon} size={18} color={selectedEntry.tone === "income" ? colors.primary : colors.destructive} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailTitle, { color: colors.foreground }]}>{selectedEntry.title}</Text>
                <Text style={[styles.detailSub, { color: colors.mutedForeground }]}>{selectedEntry.subtitle}</Text>
              </View>
              <Text style={[styles.detailAmount, { color: selectedEntry.tone === "income" ? colors.primary : colors.destructive }]}>
                {selectedEntry.tone === "income" ? "+" : "-"}{formatRupeeFull(selectedEntry.amount)}
              </Text>
            </View>

            <View style={styles.detailGrid}>
              <View style={[styles.detailCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.detailCardLabel, { color: colors.mutedForeground }]}>Record Type</Text>
                <Text style={[styles.detailCardValue, { color: colors.foreground }]}>{selectedEntry.kind}</Text>
              </View>
              <View style={[styles.detailCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.detailCardLabel, { color: colors.mutedForeground }]}>Date</Text>
                <Text style={[styles.detailCardValue, { color: colors.foreground }]}>{formatLongDate(selectedEntry.date)}</Text>
              </View>
            </View>

            {/* Dynamic visual breakdown based on Milk/Payslip or Expense */}
            {selectedEntry.kind === "Payslip" || selectedEntry.kind === "Milk" ? (() => {
              const incomeSource = selectedEntry.source as IncomeEntry;
              return (
                <View style={[styles.detailBlock, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>MILK COLLECTION</Text>
                  <DetailLine label="Total Milk" value={`${incomeSource.quantitySold.toLocaleString("en-IN")} L`} />
                  <DetailLine label="Avg. Fat" value={incomeSource.fatPercentage ? `${incomeSource.fatPercentage}%` : "4.2%"} />
                  <DetailLine label="Avg. SNF" value={incomeSource.snfPercentage ? `${incomeSource.snfPercentage}%` : "8.6%"} />
                  <DetailLine label="Rate / Ltr" value={`₹${incomeSource.ratePerLitre.toLocaleString("en-IN")}/L`} />

                  <View style={styles.detailDivider} />

                  <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>EARNINGS</Text>
                  <DetailLine label="Milk Amount" value={formatRupeeFull(incomeSource.quantitySold * incomeSource.ratePerLitre)} />
                  <DetailLine label="Quality Bonus" value={formatRupeeFull(Math.max(0, incomeSource.totalExpected - (incomeSource.quantitySold * incomeSource.ratePerLitre)))} />
                  <DetailLine label="Total Earnings" value={formatRupeeFull(incomeSource.totalExpected)} />

                  {selectedEntry.kind === "Payslip" && (
                    <>
                      <View style={styles.detailDivider} />
                      <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>DEDUCTIONS</Text>
                      <DetailLine label="Feed Purchase" value="-₹2,300" />
                      <DetailLine label="Advance Adjusted" value="-₹5,000" />
                      <DetailLine label="Transport" value="-₹450" />
                      <DetailLine label="Other Deductions" value="-₹40" />
                      <DetailLine label="Total Deductions" value={`-₹${(incomeSource.totalExpected - incomeSource.totalReceived).toLocaleString("en-IN")}`} />
                    </>
                  )}

                  <View style={styles.detailDivider} />
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <Text style={[styles.detailLineLabelBold, { color: colors.foreground }]}>NET PAYABLE</Text>
                    <Text style={[styles.detailLineValueBold, { color: colors.primary }]}>{formatRupeeFull(incomeSource.totalReceived)}</Text>
                  </View>

                  {incomeSource.notes ? (
                    <>
                      <View style={styles.detailDivider} />
                      <DetailLine label="Notes" value={incomeSource.notes} />
                    </>
                  ) : null}
                </View>
              );
            })() : (() => {
              const expenseSource = selectedEntry.source as ExpenseEntry;
              return (
                <View style={[styles.detailBlock, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <DetailLine label="Category" value={expenseSource.category} />
                  <DetailLine label="Description" value={expenseSource.description} />
                  <DetailLine label="Amount" value={formatRupeeFull(expenseSource.amount)} />
                  <DetailLine label="Saved At" value={formatDateTime(expenseSource.createdAt)} />
                </View>
              );
            })()}

            {/* View Attachment button if attachmentUrl exists */}
            {selectedEntry.source.attachmentUrl ? (
              <Pressable
                style={[styles.outlineBtn, { borderColor: colors.primary, marginTop: 10 }]}
                onPress={() => {
                  const url = selectedEntry.source.attachmentUrl;
                  if (url) {
                    setViewerUrl(url.startsWith("/") ? `${apiClient.getApiBase()}${url}` : url);
                  }
                }}
              >
                <Feather name="file-text" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.outlineBtnText, { color: colors.primary }]}>
                  {selectedEntry.kind === "Payslip" ? "View Payslip" : "View Bill"}
                </Text>
              </Pressable>
            ) : null}

            <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 12 }]} onPress={() => setSelectedEntry(null)}>
              <Text style={styles.saveBtnText}>Close</Text>
            </Pressable>
          </>
        ) : null}
      </ModalShell>

      {/* Modal - Record Milk Sale */}
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

      {/* Modal - Add Expense */}
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

      {/* Modal - Multi-step Upload Bill Flow */}
      <ModalShell
        title={uploadStep === 1 ? "Upload Bill" : uploadStep === 2 ? "Bill Preview" : "Bill Details"}
        visible={modalMode.kind === "bill"}
        onClose={() => setModalMode({ kind: "closed" })}
      >
        {uploadStep === 1 && (
          <View style={styles.uploadStepContainer}>
            <Pressable style={[styles.uploadBox, { borderColor: colors.border }]} onPress={pickFromGallery}>
              <Feather name="upload-cloud" size={48} color={colors.primary} />
              <Text style={[styles.uploadTitle, { color: colors.foreground }]}>Tap to upload</Text>
              <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>JPG, PNG, PDF (Max 5 MB)</Text>
            </Pressable>
            <Text style={[styles.chooseLabel, { color: colors.mutedForeground }]}>Choose from</Text>
            <View style={styles.chooseRow}>
              <Pressable style={[styles.chooseBtn, { borderColor: colors.border }]} onPress={pickFromCamera}>
                <Feather name="camera" size={20} color={colors.primary} />
                <Text style={[styles.chooseText, { color: colors.foreground }]}>Camera</Text>
              </Pressable>
              <Pressable style={[styles.chooseBtn, { borderColor: colors.border }]} onPress={pickFromGallery}>
                <Feather name="image" size={20} color={colors.primary} />
                <Text style={[styles.chooseText, { color: colors.foreground }]}>Gallery</Text>
              </Pressable>
              <Pressable style={[styles.chooseBtn, { borderColor: colors.border }]} onPress={pickPDF}>
                <Feather name="file-text" size={20} color={colors.primary} />
                <Text style={[styles.chooseText, { color: colors.foreground }]}>PDF</Text>
              </Pressable>
            </View>
          </View>
        )}

        {uploadStep === 2 && pickedFile && (
          <View style={styles.previewStepContainer}>
            {pickedFile.type.includes("pdf") ? (
              <View style={[styles.pdfPlaceholder, { backgroundColor: colors.muted }]}>
                <Feather name="file" size={64} color={colors.primary} />
                <Text style={[styles.pdfText, { color: colors.foreground }]}>{pickedFile.name}</Text>
              </View>
            ) : (
              <Image source={{ uri: pickedFile.uri }} style={styles.previewImage} resizeMode="contain" />
            )}
            <View style={styles.previewActions}>
              <Pressable style={[styles.outlineBtn, { flex: 1, borderColor: colors.primary }]} onPress={() => { setPickedFile(null); setUploadStep(1); }}>
                <Text style={[styles.outlineBtnText, { color: colors.primary }]}>Retake</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, { flex: 1, backgroundColor: colors.primary, marginTop: 0 }]} onPress={() => setUploadStep(3)}>
                <Text style={styles.saveBtnText}>Use This</Text>
              </Pressable>
            </View>
          </View>
        )}

        {uploadStep === 3 && (
          <View style={{ gap: 12 }}>
            <View style={styles.pillGrid}>
              {(["feed", "medicine", "labor", "equipment", "other"] as ExpenseCategory[]).map((category) => (
                <SelectPill key={category} label={category} active={expenseCategory === category} onPress={() => setExpenseCategory(category)} />
              ))}
            </View>
            <InputField label="Vendor" value={billVendor} onChangeText={setBillVendor} placeholder="Sharma Animal Feed" />
            <InputField label="Amount (₹)" value={billAmount} onChangeText={setBillAmount} placeholder="4800" keyboardType="decimal-pad" />
            <InputField label="Notes" value={billNotes} onChangeText={setBillNotes} placeholder="Feed purchase bill" multiline />

            {pickedFile && (
              <View style={[styles.fileRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name={pickedFile.type.includes("pdf") ? "file" : "image"} size={16} color={colors.primary} />
                <Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={1}>{pickedFile.name}</Text>
                <Pressable onPress={() => { setPickedFile(null); setUploadStep(1); }}>
                  <Feather name="x" size={16} color={colors.destructive} />
                </Pressable>
              </View>
            )}

            <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={saveBill} disabled={uploading}>
              {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Bill</Text>}
            </Pressable>
          </View>
        )}
      </ModalShell>

      {/* Modal - Multi-step Upload Payslip Flow */}
      <ModalShell
        title={uploadStep === 1 ? "Upload Payslip" : uploadStep === 2 ? "Payslip Preview" : "Payslip Details"}
        visible={modalMode.kind === "payslip"}
        onClose={() => setModalMode({ kind: "closed" })}
      >
        {uploadStep === 1 && (
          <View style={styles.uploadStepContainer}>
            <Pressable style={[styles.uploadBox, { borderColor: colors.border }]} onPress={pickFromGallery}>
              <Feather name="upload-cloud" size={48} color={colors.primary} />
              <Text style={[styles.uploadTitle, { color: colors.foreground }]}>Tap to upload</Text>
              <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>JPG, PNG, PDF (Max 5 MB)</Text>
            </Pressable>
            <Text style={[styles.chooseLabel, { color: colors.mutedForeground }]}>Choose from</Text>
            <View style={styles.chooseRow}>
              <Pressable style={[styles.chooseBtn, { borderColor: colors.border }]} onPress={pickFromCamera}>
                <Feather name="camera" size={20} color={colors.primary} />
                <Text style={[styles.chooseText, { color: colors.foreground }]}>Camera</Text>
              </Pressable>
              <Pressable style={[styles.chooseBtn, { borderColor: colors.border }]} onPress={pickFromGallery}>
                <Feather name="image" size={20} color={colors.primary} />
                <Text style={[styles.chooseText, { color: colors.foreground }]}>Gallery</Text>
              </Pressable>
              <Pressable style={[styles.chooseBtn, { borderColor: colors.border }]} onPress={pickPDF}>
                <Feather name="file-text" size={20} color={colors.primary} />
                <Text style={[styles.chooseText, { color: colors.foreground }]}>PDF</Text>
              </Pressable>
            </View>
          </View>
        )}

        {uploadStep === 2 && pickedFile && (
          <View style={styles.previewStepContainer}>
            {pickedFile.type.includes("pdf") ? (
              <View style={[styles.pdfPlaceholder, { backgroundColor: colors.muted }]}>
                <Feather name="file" size={64} color={colors.primary} />
                <Text style={[styles.pdfText, { color: colors.foreground }]}>{pickedFile.name}</Text>
              </View>
            ) : (
              <Image source={{ uri: pickedFile.uri }} style={styles.previewImage} resizeMode="contain" />
            )}
            <View style={styles.previewActions}>
              <Pressable style={[styles.outlineBtn, { flex: 1, borderColor: colors.primary }]} onPress={() => { setPickedFile(null); setUploadStep(1); }}>
                <Text style={[styles.outlineBtnText, { color: colors.primary }]}>Retake</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, { flex: 1, backgroundColor: colors.primary, marginTop: 0 }]} onPress={() => setUploadStep(3)}>
                <Text style={styles.saveBtnText}>Use This</Text>
              </Pressable>
            </View>
          </View>
        )}

        {uploadStep === 3 && (
          <View style={{ gap: 12 }}>
            <InputField label="Payment Cycle" value={payslipCycle} onChangeText={setPayslipCycle} placeholder="1 - 15 Jul 2025" />
            <InputField label="Payment Date" value={payslipPaymentDate} onChangeText={setPayslipPaymentDate} placeholder="15 Jul 2025" />
            <View style={styles.inlineFields}>
              <View style={{ flex: 1 }}>
                <InputField label="Total Milk (L)" value={payslipMilk} onChangeText={setPayslipMilk} placeholder="2430" keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <InputField label="Net Payable (₹)" value={payslipNetPayable} onChangeText={setPayslipNetPayable} placeholder="47850" keyboardType="decimal-pad" />
              </View>
            </View>
            <InputField label="Notes" value={payslipNotes} onChangeText={setPayslipNotes} placeholder="Payslip received from dairy" multiline />

            {pickedFile && (
              <View style={[styles.fileRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name={pickedFile.type.includes("pdf") ? "file" : "image"} size={16} color={colors.primary} />
                <Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={1}>{pickedFile.name}</Text>
                <Pressable onPress={() => { setPickedFile(null); setUploadStep(1); }}>
                  <Feather name="x" size={16} color={colors.destructive} />
                </Pressable>
              </View>
            )}

            <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={savePayslip} disabled={uploading}>
              {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Payslip</Text>}
            </Pressable>
          </View>
        )}
      </ModalShell>

      {/* Modal - Record Payment */}
      <ModalShell title="Record Payment" visible={modalMode.kind === "payment"} onClose={() => setModalMode({ kind: "closed" })}>
        <InputField label="Payer" value={milkBuyer} onChangeText={setMilkBuyer} placeholder="Milk society" />
        <InputField label="Amount" value={milkReceived} onChangeText={setMilkReceived} placeholder="12500" keyboardType="decimal-pad" />
        <InputField label="Notes" value={milkNotes} onChangeText={setMilkNotes} placeholder="Payment received today" multiline />
        <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={savePayment}>
          <Text style={styles.saveBtnText}>Save Payment</Text>
        </Pressable>
      </ModalShell>

      {/* Modal - Transfer / Other */}
      <ModalShell title="Transfer / Other" visible={modalMode.kind === "transfer"} onClose={() => setModalMode({ kind: "closed" })}>
        <InputField label="Title" value={expenseDescription} onChangeText={setExpenseDescription} placeholder="Bank transfer" />
        <InputField label="Amount" value={expenseAmount} onChangeText={setExpenseAmount} placeholder="2500" keyboardType="decimal-pad" />
        <InputField label="Notes" value={expenseNotes} onChangeText={setExpenseNotes} placeholder="Reference or memo" multiline />
        <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={saveTransfer}>
          <Text style={styles.saveBtnText}>Save Record</Text>
        </Pressable>
      </ModalShell>

      {/* Fullscreen Image/Document Attachment Viewer Modal */}
      <Modal visible={viewerUrl !== null} transparent animationType="fade" onRequestClose={() => setViewerUrl(null)}>
        <View style={styles.viewerContainer}>
          <Pressable style={styles.viewerClose} onPress={() => setViewerUrl(null)}>
            <Feather name="x" size={24} color="#fff" />
          </Pressable>
          {viewerUrl && (
            <Image source={{ uri: viewerUrl }} style={styles.viewerImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* Inventory modal */}
      <InventoryModal
        visible={inventoryModal}
        onClose={() => { setInventoryModal(false); setEditInventoryItem(undefined); }}
        editItem={editInventoryItem}
      />
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

function DetailLine({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.detailLine}>
      <Text style={[styles.detailLineLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailLineValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function PassbookRow({ entry, onPress }: { entry: PassbookEntry; onPress: () => void }) {
  const colors = useColors();
  const positive = entry.tone === "income";
  return (
    <Pressable onPress={onPress} style={[styles.timelineItem, { borderColor: colors.border, backgroundColor: positive ? `${colors.primary}08` : `${colors.destructive}08` }]}>
      <View style={[styles.timelineIcon, { backgroundColor: positive ? `${colors.primary}14` : `${colors.destructive}14` }]}>
        <Feather name={entry.icon} size={16} color={positive ? colors.primary : colors.destructive} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.timelineTopLine}>
          <Text style={[styles.timelineTitle, { color: colors.foreground }]}>{entry.title}</Text>
          <Text style={[styles.timelineAmount, { color: positive ? colors.primary : colors.destructive }]}>
            {positive ? "+" : "-"} {formatRupeeFull(entry.amount)}
          </Text>
        </View>
        <Text style={[styles.timelineSub, { color: colors.mutedForeground }]}>{entry.subtitle}</Text>
        {entry.badge ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 }}>
            <Feather name="paperclip" size={10} color={positive ? colors.primary : colors.destructive} />
            <Text style={[styles.timelineBadge, { color: positive ? colors.primary : colors.destructive }]}>{entry.badge}</Text>
          </View>
        ) : null}
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
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
    justifyContent: "center",
    alignItems: "center",
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
  timelineBadge: { fontSize: 11, fontWeight: "700" },
  detailHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  detailTitle: { fontSize: 15, fontWeight: "800" },
  detailSub: { fontSize: 12, marginTop: 2 },
  detailAmount: { fontSize: 15, fontWeight: "800" },
  detailGrid: { flexDirection: "row", gap: 10 },
  detailCard: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12, gap: 4 },
  detailCardLabel: { fontSize: 11, fontWeight: "700" },
  detailCardValue: { fontSize: 13, fontWeight: "800" },
  detailBlock: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  detailSectionTitle: { fontSize: 12, fontWeight: "800", color: "#16a34a", letterSpacing: 0.5 },
  detailDivider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 4 },
  detailLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailLineLabel: { fontSize: 12, fontWeight: "600" },
  detailLineValue: { fontSize: 12, fontWeight: "700" },
  detailLineLabelBold: { fontSize: 13, fontWeight: "800" },
  detailLineValueBold: { fontSize: 15, fontWeight: "800" },
  breakdownList: { gap: 12 },
  breakdownRow: { gap: 6 },
  breakdownLabel: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  breakdownTrack: { height: 10, borderRadius: 999, overflow: "hidden" },
  breakdownFill: { height: "100%", borderRadius: 999 },
  breakdownValue: { fontSize: 12, fontWeight: "800" },
  fab: {
    position: "absolute",
    right: 18,
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
  outlineBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },

  // Payment Status Cards Styles
  paymentStatusBlock: {
    gap: 12,
  },
  paymentCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  paymentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentPeriod: {
    fontSize: 12,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  paymentAmount: {
    fontSize: 22,
    fontWeight: "800",
  },
  paymentSubtext: {
    fontSize: 11,
    fontWeight: "600",
  },
  paymentAction: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
    marginTop: 4,
  },
  paymentActionText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Multi-step Upload Styles
  uploadStepContainer: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 16,
  },
  uploadBox: {
    width: "100%",
    height: 180,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  uploadSub: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  chooseLabel: {
    fontSize: 12,
    fontWeight: "700",
    alignSelf: "flex-start",
  },
  chooseRow: {
    flexDirection: "row",
    gap: 10,
  },
  chooseBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
  },
  chooseText: {
    fontSize: 12,
    fontWeight: "700",
  },
  previewStepContainer: {
    alignItems: "center",
    gap: 16,
  },
  previewImage: {
    width: "100%",
    height: SCREEN_WIDTH * 0.8,
    borderRadius: 20,
    backgroundColor: "#000",
  },
  pdfPlaceholder: {
    width: "100%",
    height: SCREEN_WIDTH * 0.8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  pdfText: {
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 20,
    textAlign: "center",
  },
  previewActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },

  // Fullscreen Viewer Styles
  viewerContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  viewerImage: {
    width: "100%",
    height: "85%",
  },

  // Inventory list styling
  inventoryValueCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inventoryValueLabel: { fontSize: 13, fontWeight: "600" },
  inventoryValueAmount: { fontSize: 20, fontWeight: "700" },
  lowStockBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  lowStockText: { flex: 1, fontSize: 13, fontWeight: "500" },
  inventoryCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inventoryCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  inventoryCardLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
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

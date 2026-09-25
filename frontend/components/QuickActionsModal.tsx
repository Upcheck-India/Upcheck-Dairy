import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

/**
 * Every action this grid can raise. The parent decides what each one does, so
 * navigation and modal ownership stay in the screen that hosts them.
 */
export type QuickAction =
  | "milk-records"
  | "feed-stock"
  | "health-records"
  | "breeding-records"
  | "add-animal"
  | "add-feed"
  | "tasks"
  | "herd-report"
  | "voice"
  | "ask-ai";

interface QuickActionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (action: QuickAction) => void;
}

interface ActionItem {
  action: QuickAction;
  title: string;
  subtext: string;
  icon: any;
  iconColor: string;
  iconBg: string;
}

interface Section {
  title: string;
  items: ActionItem[];
}

export default function QuickActionsModal({ visible, onClose, onSelect }: QuickActionsModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // Only actions with a real destination appear here. "Reminders", "Milk
  // Report" and "Feed Report" were removed rather than left as buttons that
  // do nothing — there is no screen behind them yet.
  const sections: Section[] = [
    {
      title: "Records",
      items: [
        {
          action: "milk-records",
          title: "Milk Records",
          subtext: "Daily milk collection",
          icon: "cup-water",
          iconColor: "#0284c7",
          iconBg: "#e0f2fe",
        },
        {
          action: "feed-stock",
          title: "Feed Stock",
          subtext: "What is in the store",
          icon: "barley",
          iconColor: "#b45309",
          iconBg: "#fef3c7",
        },
        {
          action: "health-records",
          title: "Health Records",
          subtext: "Treatments & checkups",
          icon: "medical-bag",
          iconColor: "#16a34a",
          iconBg: "#dcfce7",
        },
        {
          action: "breeding-records",
          title: "Breeding Records",
          subtext: "Mating & pregnancy",
          icon: "gender-male-female",
          iconColor: "#9333ea",
          iconBg: "#f3e8ff",
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          action: "add-animal",
          title: "Add Animal",
          subtext: "Register new animal",
          icon: "plus-circle-outline",
          iconColor: "#16a34a",
          iconBg: "#dcfce7",
        },
        {
          action: "add-feed",
          title: "Add Feed",
          subtext: "Add new feed item",
          icon: "plus-box-outline",
          iconColor: "#f97316",
          iconBg: "#ffedd5",
        },
        {
          action: "tasks",
          title: "Tasks",
          subtext: "Today's jobs",
          icon: "clipboard-check-outline",
          iconColor: "#16a34a",
          iconBg: "#dcfce7",
        },
        {
          action: "herd-report",
          title: "Herd Report",
          subtext: "Yield, composition, health",
          icon: "chart-line",
          iconColor: "#4b5563",
          iconBg: "#f3f4f6",
        },
      ],
    },
    {
      title: "Assist",
      items: [
        {
          action: "voice",
          title: "Voice Entry",
          subtext: "Speak to record",
          icon: "microphone-outline",
          iconColor: "#dc2626",
          iconBg: "#fee2e2",
        },
        {
          action: "ask-ai",
          title: "Ask GauGuru",
          subtext: "Farming questions",
          icon: "robot-outline",
          iconColor: "#7c3aed",
          iconBg: "#f3e8ff",
        },
      ],
    },
  ];

  const handlePress = (action: QuickAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    // Let this sheet dismiss before the destination opens; presenting a modal
    // while another is still on screen is dropped on iOS.
    setTimeout(() => onSelect(action), 260);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheetContainer, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text 
              allowFontScaling={true}
              style={[styles.headerTitle, { color: colors.foreground }]}
            >
              Quick Actions
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Feather name="x" size={24} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {sections.map((section, sIdx) => (
              <View key={sIdx} style={styles.section}>
                <Text 
                  allowFontScaling={true}
                  style={[styles.sectionTitle, { color: colors.mutedForeground }]}
                >
                  {section.title}
                </Text>
                <View style={styles.grid}>
                  {section.items.map((item, iIdx) => (
                    <Pressable
                      key={iIdx}
                      style={({ pressed }) => [
                        styles.card,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                      onPress={() => handlePress(item.action)}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                        <MaterialCommunityIcons name={item.icon} size={22} color={item.iconColor} />
                      </View>
                      <Text 
                        allowFontScaling={true}
                        numberOfLines={2}
                        style={[styles.cardTitle, { color: colors.foreground }]}
                      >
                        {item.title}
                      </Text>
                      <Text 
                        allowFontScaling={true}
                        numberOfLines={2}
                        style={[styles.cardSubtext, { color: colors.mutedForeground }]}
                      >
                        {item.subtext}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    maxHeight: "85%",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
    width: "100%",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    position: "absolute",
    right: 4,
    top: -2,
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  card: {
    width: "48.5%", // 2 columns spacing
    minHeight: 124,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 13,
    marginTop: 2,
  },
});

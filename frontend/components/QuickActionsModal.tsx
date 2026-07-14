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

import { useColors } from "@/hooks/useColors";

interface QuickActionsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ActionItem {
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

export default function QuickActionsModal({ visible, onClose }: QuickActionsModalProps) {
  const colors = useColors();

  const sections: Section[] = [
    {
      title: "Records",
      items: [
        {
          title: "Milk Records",
          subtext: "Daily milk collection",
          icon: "pitcher-fluid",
          iconColor: "#0284c7",
          iconBg: "#e0f2fe",
        },
        {
          title: "Feed Records",
          subtext: "Feed given to animals",
          icon: "barley",
          iconColor: "#b45309",
          iconBg: "#fef3c7",
        },
        {
          title: "Health Records",
          subtext: "Treatments & checkups",
          icon: "medical-bag",
          iconColor: "#16a34a",
          iconBg: "#dcfce7",
        },
        {
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
          title: "Add Animal",
          subtext: "Register new animal",
          icon: "plus-circle-outline",
          iconColor: "#16a34a",
          iconBg: "#dcfce7",
        },
        {
          title: "Add Feed",
          subtext: "Add new feed item",
          icon: "plus-box-outline",
          iconColor: "#f97316",
          iconBg: "#ffedd5",
        },
        {
          title: "Tasks",
          subtext: "Manage daily tasks",
          icon: "clipboard-check-outline",
          iconColor: "#16a34a",
          iconBg: "#dcfce7",
        },
        {
          title: "Reminders",
          subtext: "Set alerts & reminders",
          icon: "bell-outline",
          iconColor: "#eab308",
          iconBg: "#fef9c3",
        },
      ],
    },
    {
      title: "Reports",
      items: [
        {
          title: "Milk Report",
          subtext: "Production reports",
          icon: "file-chart-outline",
          iconColor: "#0284c7",
          iconBg: "#e0f2fe",
        },
        {
          title: "Feed Report",
          subtext: "Consumption reports",
          icon: "file-document-edit-outline",
          iconColor: "#f97316",
          iconBg: "#ffedd5",
        },
        {
          title: "Herd Report",
          subtext: "Animal performance",
          icon: "chart-line",
          iconColor: "#4b5563",
          iconBg: "#f3f4f6",
        },
        {
          title: "Inventory Report",
          subtext: "Stock & usage",
          icon: "package-variant-closed",
          iconColor: "#3b82f6",
          iconBg: "#dbeafe",
        },
      ],
    },
  ];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Placeholder click - perform no action
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
        <View style={[styles.sheetContainer, { backgroundColor: colors.card }]}>
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
                      onPress={handlePress}
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
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
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

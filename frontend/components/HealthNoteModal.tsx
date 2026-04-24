import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

interface HealthNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: string) => void;
}

export default function HealthNoteModal({
  visible,
  onClose,
  onSelect,
}: HealthNoteModalProps) {
  const { t } = useLanguage();
  const colors = useColors();

  const options = [
    { label: t.healthEventFever, icon: "thermometer" },
    { label: t.healthEventNotEating, icon: "food-off" },
    { label: t.healthEventLimping, icon: "walk" },
    { label: t.healthEventDiarrhea, icon: "water-off" },
    { label: t.healthEventCoughing, icon: "weather-windy" },
    { label: t.healthEventVetVisit, icon: "doctor" },
    { label: t.healthEventVaccination, icon: "needle" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t.animalDetailAddHealthNote}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t.animalDetailSelectSymptom}
          </Text>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.optionsGrid}>
              {options.map((opt, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.optionItem,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                  onPress={() => onSelect(opt.label)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary + "15" }]}>
                    <MaterialCommunityIcons
                      name={opt.icon as any}
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <Text
                    style={[styles.optionLabel, { color: colors.foreground }]}
                    numberOfLines={2}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Pressable
            style={[styles.cancelBtn, { backgroundColor: colors.muted }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>
              {t.cancel}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  scroll: {
    marginBottom: 10,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  optionItem: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  cancelBtn: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

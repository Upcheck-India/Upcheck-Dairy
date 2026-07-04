import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { generateId, getTodayString, useApp } from "@/context/AppContext";
import { Animal } from "../src/modules/animals/models/Animal";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useMilk } from "../src/modules/milk/hooks/useMilk";

interface MilkLogModalProps {
  visible: boolean;
  animal: Animal | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MilkLogModal({
  visible,
  animal,
  onClose,
  onSuccess,
}: MilkLogModalProps) {
  const colors = useColors();
  const { createMilk } = useMilk();
  const { addMilkEntry } = useApp();
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState("");
  const [session, setSession] = useState<"morning" | "evening">(
    new Date().getHours() < 12 ? "morning" : "evening"
  );
  const [fat, setFat] = useState("");
  const [snf, setSnf] = useState("");
  const [notes, setNotes] = useState("");
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      scaleAnim.setValue(0.9);
      setQuantity("");
      setFat("");
      setSnf("");
      setNotes("");
    }
  }, [visible]);

  const handleSave = () => {
    if (!animal) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert(t.error, t.milkLogInvalidQty);
      return;
    }
    createMilk({
      animalId: Number(animal.id),
      session,
      quantity: qty,
      date: new Date().toISOString(),
      fat: fat ? parseFloat(fat) : undefined,
      snf: snf ? parseFloat(snf) : undefined,
      notes: notes || undefined,
    }).then((newEntry) => {
      addMilkEntry({
        id: newEntry.id.toString(),
        animalId: newEntry.animalId.toString(),
        session: newEntry.session,
        quantity: newEntry.quantity,
        date: newEntry.date instanceof Date ? newEntry.date.toISOString().split("T")[0] : new Date(newEntry.date).toISOString().split("T")[0],
        timestamp: newEntry.date instanceof Date ? newEntry.date.getTime() : new Date(newEntry.date).getTime(),
        fat: newEntry.fat ?? undefined,
        snf: newEntry.snf ?? undefined,
        notes: newEntry.notes ?? undefined,
      });
    }).catch(err => {
      console.error("[MilkLogModal] Failed to create milk entry:", err);
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSuccess?.();
    onClose();
  };

  if (!animal) return null;

  if (!animal) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.modal,
            {
              backgroundColor: colors.card,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Pressable>
            <View style={styles.header}>
              <MaterialCommunityIcons name={animal.type === "buffalo" ? "water" : "cow"} size={36} color={colors.foreground} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  {t.milkLogTitle}
                </Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  {animal.name}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: colors.muted }]}
              >
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {t.milkLogSelectSession}
              </Text>
              <View style={styles.sessionRow}>
                {(["morning", "evening"] as const).map((s) => (
                  <Pressable
                    key={s}
                    style={[
                      styles.sessionBtn,
                      {
                        backgroundColor:
                          session === s ? colors.primary : colors.muted,
                        flex: 1,
                      },
                    ]}
                    onPress={() => {
                      setSession(s);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Feather
                      name={s === "morning" ? "sun" : "moon"}
                      size={18}
                      color={session === s ? "#fff" : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.sessionLabel,
                        {
                          color:
                            session === s ? "#fff" : colors.mutedForeground,
                        },
                      ]}
                    >
                      {s === "morning" ? t.morning : t.evening}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {t.milkLogQuantityLabel}
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: colors.border, backgroundColor: colors.muted },
                ]}
              >
                <Feather name="droplet" size={20} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  placeholder="0.0"
                  placeholderTextColor={colors.mutedForeground}
                  autoFocus
                />
                <Text style={[styles.unit, { color: colors.mutedForeground }]}>
                  L
                </Text>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {t.milkLogFatLabel}
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: colors.border, backgroundColor: colors.muted },
                ]}
              >
                <Feather name="percent" size={20} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={fat}
                  onChangeText={setFat}
                  keyboardType="decimal-pad"
                  placeholder="3.5"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {t.milkLogSnfLabel}
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: colors.border, backgroundColor: colors.muted },
                ]}
              >
                <Feather name="percent" size={20} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={snf}
                  onChangeText={setSnf}
                  keyboardType="decimal-pad"
                  placeholder="8.5"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {t.milkLogNotesLabel}
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: colors.border, backgroundColor: colors.muted },
                ]}
              >
                <Feather name="file-text" size={20} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any special remarks"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <Pressable
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Feather name="check" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{t.save}</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
    marginTop: 4,
  },
  sessionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  sessionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  sessionLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
  },
  unit: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
    marginTop: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
});

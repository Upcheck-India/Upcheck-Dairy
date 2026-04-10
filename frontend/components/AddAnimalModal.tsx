import { Feather } from "@expo/vector-icons";
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

import { Animal, AnimalType, generateId, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface AddAnimalModalProps {
  visible: boolean;
  onClose: () => void;
}

const ANIMAL_TYPES: { type: AnimalType; emoji: string; label: string; labelTamil: string }[] = [
  { type: "cow", emoji: "🐄", label: "Cow", labelTamil: "பசு" },
  { type: "buffalo", emoji: "🐃", label: "Buffalo", labelTamil: "எருமை" },
  { type: "calf", emoji: "🐮", label: "Calf", labelTamil: "கன்று" },
];

export default function AddAnimalModal({ visible, onClose }: AddAnimalModalProps) {
  const colors = useColors();
  const { addAnimal } = useApp();
  const [name, setName] = useState("");
  const [type, setType] = useState<AnimalType>("cow");
  const [breed, setBreed] = useState("");
  const [tagNumber, setTagNumber] = useState("");
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
      setName("");
      setBreed("");
      setTagNumber("");
      setType("cow");
    }
  }, [visible]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("தவறு", "மாடு பெயர் உள்ளிடவும்");
      return;
    }
    const animal: Animal = {
      id: generateId(),
      name: name.trim(),
      type,
      breed: breed.trim() || "Mixed",
      tagNumber: tagNumber.trim() || generateId().slice(0, 6).toUpperCase(),
      healthStatus: "healthy",
    };
    addAnimal(animal);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

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
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  புதிய மாடு சேர்க்கவும்
                </Text>
                <Pressable
                  onPress={onClose}
                  style={[styles.closeBtn, { backgroundColor: colors.muted }]}
                >
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                வகை தேர்வு
              </Text>
              <View style={styles.typeRow}>
                {ANIMAL_TYPES.map(({ type: t, emoji, labelTamil }) => (
                  <Pressable
                    key={t}
                    style={[
                      styles.typeBtn,
                      {
                        backgroundColor: type === t ? colors.primary : colors.muted,
                        borderColor: type === t ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setType(t);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text style={styles.typeEmoji}>{emoji}</Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: type === t ? "#fff" : colors.mutedForeground },
                      ]}
                    >
                      {labelTamil}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                பெயர் *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="உதா: லட்சுமி"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                ரகம்
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                  },
                ]}
                value={breed}
                onChangeText={setBreed}
                placeholder="உதா: ஜெர்சி, முர்ராஹ்"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                குறி எண்
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                  },
                ]}
                value={tagNumber}
                onChangeText={setTagNumber}
                placeholder="உதா: A001"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
              />

              <Pressable
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Feather name="plus" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>சேர்க்கவும்</Text>
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
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
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
  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  typeEmoji: {
    fontSize: 28,
  },
  typeLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
    marginTop: 4,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
});

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

import { Animal, AnimalType, COW_BREEDS, BUFFALO_BREEDS, generateId } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useAnimals } from "../src/modules/animals/hooks/useAnimals";

interface AddAnimalModalProps {
  visible: boolean;
  onClose: () => void;
}

function getBreedsForType(type: AnimalType): string[] {
  if (type === "cow") return COW_BREEDS;
  if (type === "buffalo") return BUFFALO_BREEDS;
  return [...COW_BREEDS, ...BUFFALO_BREEDS];
}

export default function AddAnimalModal({ visible, onClose }: AddAnimalModalProps) {
  const colors = useColors();
  const { createAnimal } = useAnimals();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [type, setType] = useState<AnimalType>("cow");
  const [breed, setBreed] = useState("");
  const [customBreed, setCustomBreed] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [tagNumber, setTagNumber] = useState("");
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const ANIMAL_TYPES: { type: AnimalType; iconName: keyof typeof MaterialCommunityIcons.glyphMap; label: string }[] = [
    { type: "cow", iconName: "cow", label: t.typeCow },
    { type: "buffalo", iconName: "water", label: t.typeBuffalo },
    { type: "calf", iconName: "baby-bottle", label: t.typeCalf },
  ];

  const breeds = getBreedsForType(type);

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
      setCustomBreed("");
      setShowCustomInput(false);
      setTagNumber("");
      setType("cow");
    }
  }, [visible]);

  useEffect(() => {
    setBreed("");
    setCustomBreed("");
    setShowCustomInput(false);
  }, [type]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t.error, t.addAnimalNameRequired);
      return;
    }
    const finalBreed = showCustomInput ? customBreed.trim() : breed;
    if (!finalBreed) {
      Alert.alert(t.error, t.addAnimalBreedRequired);
      return;
    }
    createAnimal({
      name: name.trim(),
      type,
      breed: finalBreed,
      tagNumber: tagNumber.trim() || undefined,
      healthStatus: "healthy",
    }).catch(err => {
      console.error("[AddAnimalModal] Failed to create animal:", err);
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const selectBreed = (b: string) => {
    Haptics.selectionAsync();
    setBreed(b);
    setShowCustomInput(false);
    setCustomBreed("");
  };

  const selectCustom = () => {
    Haptics.selectionAsync();
    setBreed("");
    setShowCustomInput(true);
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
                  {t.addAnimalTitle}
                </Text>
                <Pressable
                  onPress={onClose}
                  style={[styles.closeBtn, { backgroundColor: colors.muted }]}
                >
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {t.addAnimalSelectType}
              </Text>
              <View style={styles.typeRow}>
                {ANIMAL_TYPES.map(({ type: at, iconName, label }) => (
                  <Pressable
                    key={at}
                    style={[
                      styles.typeBtn,
                      {
                        backgroundColor: type === at ? colors.primary : colors.muted,
                        borderColor: type === at ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setType(at);
                      Haptics.selectionAsync();
                    }}
                  >
                    <MaterialCommunityIcons name={iconName} size={32} color={type === at ? colors.primaryForeground : colors.mutedForeground} />
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: type === at ? colors.primaryForeground : colors.mutedForeground },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {t.addAnimalName}
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
                placeholder={t.addAnimalNamePlaceholder}
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {t.addAnimalBreed}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.breedChipRow}
              >
                {breeds.map((b) => (
                  <Pressable
                    key={b}
                    style={[
                      styles.breedChip,
                      {
                        backgroundColor: breed === b && !showCustomInput ? colors.primary : colors.muted,
                        borderColor: breed === b && !showCustomInput ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => selectBreed(b)}
                  >
                    <Text
                      style={[
                        styles.breedChipText,
                        { color: breed === b && !showCustomInput ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {b}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={[
                    styles.breedChip,
                    {
                      backgroundColor: showCustomInput ? colors.primary : colors.muted,
                      borderColor: showCustomInput ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={selectCustom}
                >
                  <Feather
                    name="edit-2"
                    size={12}
                    color={showCustomInput ? colors.primaryForeground : colors.foreground}
                  />
                  <Text
                    style={[
                      styles.breedChipText,
                      { color: showCustomInput ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {t.addAnimalCustomBreed}
                  </Text>
                </Pressable>
              </ScrollView>

              {showCustomInput && (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      marginTop: 8,
                    },
                  ]}
                  value={customBreed}
                  onChangeText={setCustomBreed}
                  placeholder={t.addAnimalBreedPlaceholder}
                  placeholderTextColor={colors.mutedForeground}
                  autoFocus
                />
              )}

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>
                {t.addAnimalTag}
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
                placeholder={t.addAnimalTagPlaceholder}
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
              />

              <Pressable
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Feather name="plus" size={20} color={colors.primaryForeground} />
                <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>{t.addAnimalSave}</Text>
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
  breedChipRow: {
    gap: 8,
    paddingBottom: 8,
  },
  breedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  breedChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
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
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
});

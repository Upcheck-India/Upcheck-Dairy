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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COW_BREEDS, BUFFALO_BREEDS } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useAnimals } from "../src/modules/animals/hooks/useAnimals";
import { useSheds } from "../src/modules/herd/context/ShedProvider";
import { defaultShedIdFor } from "../src/modules/herd/utils/shedAssignment";

interface AddAnimalModalProps {
  visible: boolean;
  onClose: () => void;
}

// Custom Option Picker Component for Dropdowns
interface CustomPickerProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { label: string; value: string }[];
  selectedValue: string;
  onSelect: (val: string) => void;
}

function CustomPicker({ visible, onClose, title, options, selectedValue, onSelect }: CustomPickerProps) {
  const colors = useColors();
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.pickerOverlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.pickerSheet,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.pickerHeader}>
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>{title}</Text>
            <Pressable onPress={onClose} style={[styles.pickerCloseBtn, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
            {options.map((opt) => {
              const active = opt.value === selectedValue;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.pickerOption,
                    { borderBottomColor: colors.border },
                    active && { backgroundColor: "#16a34a10" },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onSelect(opt.value);
                    onClose();
                  }}
                >
                  <Text style={[styles.pickerOptionLabel, { color: active ? "#16a34a" : colors.foreground }]}>
                    {opt.label}
                  </Text>
                  {active && <Feather name="check" size={18} color="#16a34a" />}
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default function AddAnimalModal({ visible, onClose }: AddAnimalModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { createAnimal } = useAnimals();
  const { t, language } = useLanguage();
  const { sheds } = useSheds();

  const lx = (r: Record<string, string>) => r[language] ?? r.en ?? "";

  // Step state
  const [step, setStep] = useState(1); // 1, 2, or 3

  // Form Field States
  const [name, setName] = useState("");
  const [tagNumber, setTagNumber] = useState("");
  const [type, setType] = useState<"cow" | "buffalo" | "calf">("cow");
  const [breed, setBreed] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"female" | "male">("female");
  const [shed, setShed] = useState(() => defaultShedIdFor("cow", sheds));
  const [status, setStatus] = useState("lactating");
  const [notes, setNotes] = useState("");

  // Dropdown Picker Visibility States
  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);
  const [showBreedPicker, setShowBreedPicker] = useState(false);
  const [showShedPicker, setShowShedPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Reset form when modal visibility changes
  useEffect(() => {
    if (visible) {
      setStep(1);
      setName("");
      setTagNumber("");
      setType("cow");
      setBreed("");
      setBirthDate("");
      setGender("female");
      setShed(defaultShedIdFor("cow", sheds));
      setStatus("lactating");
      setNotes("");
    }
  }, [visible]);

  // Adjust defaults when type changes
  useEffect(() => {
    setShed(defaultShedIdFor(type, sheds));
    if (type === "calf") {
      setGender("female");
      setBreed("");
      setStatus("calf");
    } else {
      setStatus("lactating");
    }
  }, [type]);

  // Helper: Format BirthDate to DD / MM / YYYY
  const handleDateChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, "");
    let formatted = "";
    if (clean.length > 0) {
      formatted += clean.substring(0, 2);
    }
    if (clean.length > 2) {
      formatted += " / " + clean.substring(2, 4);
    }
    if (clean.length > 4) {
      formatted += " / " + clean.substring(4, 8);
    }
    setBirthDate(formatted);
  };

  const parseDate = (dateStr: string): Date | null => {
    const parts = dateStr.split("/").map((p) => p.trim());
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const d = new Date(year, month, day);
        if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
          return d;
        }
      }
    }
    return null;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!tagNumber.trim()) {
        Alert.alert(lx({ en: "Required", ta: "தேவை" }), lx({ en: "Ear Tag / ID is required", ta: "காது குறி எண் / ID தேவை" }));
        return;
      }
      if (!type) {
        Alert.alert(lx({ en: "Required", ta: "தேவை" }), lx({ en: "Species is required", ta: "இனம் தேவை" }));
        return;
      }
      if (!breed) {
        Alert.alert(lx({ en: "Required", ta: "தேவை" }), lx({ en: "Breed is required", ta: "ஜாதி / இனம் தேவை" }));
        return;
      }
      if (birthDate && !parseDate(birthDate)) {
        Alert.alert(
          lx({ en: "Invalid Date", ta: "தவறான தேதி" }),
          lx({ en: "Please enter a valid date in DD / MM / YYYY format", ta: "DD / MM / YYYY வடிவத்தில் சரியான தேதியை உள்ளிடவும்" })
        );
        return;
      }
      setStep(2);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (step === 2) {
      if (!shed) {
        Alert.alert(lx({ en: "Required", ta: "தேவை" }), lx({ en: "Shed assignment is required", ta: "கொட்டகை ஒதுக்கீடு தேவை" }));
        return;
      }
      if (!status) {
        Alert.alert(lx({ en: "Required", ta: "தேவை" }), lx({ en: "Category is required", ta: "பிரிவு / வகை தேவை" }));
        return;
      }
      setStep(3);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    const finalName = name.trim() || `${type.charAt(0).toUpperCase() + type.slice(1)} ${tagNumber.trim()}`;
    const dobObj = birthDate ? parseDate(birthDate) : null;

    try {
      await createAnimal({
        name: finalName,
        type,
        breed,
        tagNumber: tagNumber.trim(),
        healthStatus: "healthy",
        shed,
        status: status as any,
        gender,
        birthDate: dobObj ? dobObj.toISOString() : undefined,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (err: any) {
      if (err.message && err.message.includes("already exists on this farm")) {
        Alert.alert(lx({ en: "Duplicate Tag", ta: "நகல் குறி எண்" }), lx({ en: "An animal with this tag number already exists.", ta: "இந்த குறி எண்ணைக் கொண்ட மாடு ஏற்கனவே உள்ளது." }));
      } else {
        Alert.alert(lx({ en: "Error", ta: "பிழை" }), err.message || lx({ en: "Failed to create animal", ta: "மாடு சேர்ப்பதில் தோல்வி" }));
      }
    }
  };

  // Dropdown list options
  const speciesOptions = [
    { label: lx({ en: "Cow", ta: "பசு" }), value: "cow" },
    { label: lx({ en: "Buffalo", ta: "எருமை" }), value: "buffalo" },
    { label: lx({ en: "Calf", ta: "கன்று" }), value: "calf" },
  ];

  const breedOptions = (type === "cow" ? COW_BREEDS : type === "buffalo" ? BUFFALO_BREEDS : [...COW_BREEDS, ...BUFFALO_BREEDS]).map((b) => ({
    label: b,
    value: b,
  }));

  const shedOptions = sheds.map((s) => ({
    label: s.name,
    value: s.id,
  }));

  const categoryOptions = [
    { label: lx({ en: "Lactating", ta: "பால் கறக்கும்" }), value: "lactating" },
    { label: lx({ en: "Pregnant", ta: "சினை மாடு" }), value: "pregnant" },
    { label: lx({ en: "Dry", ta: "வறண்ட மாடு" }), value: "dry" },
    { label: lx({ en: "Calf", ta: "கன்றுக்குட்டி" }), value: "calf" },
    { label: lx({ en: "Other", ta: "மற்றவை" }), value: "other" },
  ];

  const getShedLabel = (key: string) => shedOptions.find((s) => s.value === key)?.label ?? key;
  const getCategoryLabel = (key: string) => categoryOptions.find((c) => c.value === key)?.label ?? key;

  return (
    <>
      <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={onClose} style={styles.headerCloseBtn}>
              <Feather name="x" size={24} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>{lx({ en: "Add Animal", ta: "மாடு சேர்க்கவும்" })}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Progress Tracker */}
          <View style={styles.trackerContainer}>
            <View style={styles.trackerStep}>
              <View style={[styles.trackerCircle, step >= 1 ? styles.trackerCircleActive : styles.trackerCircleInactive]}>
                <Text style={styles.trackerText}>1</Text>
              </View>
              <Text style={[styles.trackerLabel, { color: step >= 1 ? "#16a34a" : colors.mutedForeground }]}>
                {lx({ en: "Basic Info", ta: "அடிப்படை விவரம்" })}
              </Text>
            </View>
            <View style={[styles.trackerLine, step >= 2 && styles.trackerLineActive]} />
            <View style={styles.trackerStep}>
              <View style={[styles.trackerCircle, step >= 2 ? styles.trackerCircleActive : styles.trackerCircleInactive]}>
                <Text style={styles.trackerText}>2</Text>
              </View>
              <Text style={[styles.trackerLabel, { color: step >= 2 ? "#16a34a" : colors.mutedForeground }]}>
                {lx({ en: "Location", ta: "இருப்பிடம்" })}
              </Text>
            </View>
            <View style={[styles.trackerLine, step >= 3 && styles.trackerLineActive]} />
            <View style={styles.trackerStep}>
              <View style={[styles.trackerCircle, step >= 3 ? styles.trackerCircleActive : styles.trackerCircleInactive]}>
                <Text style={styles.trackerText}>3</Text>
              </View>
              <Text style={[styles.trackerLabel, { color: step >= 3 ? "#16a34a" : colors.mutedForeground }]}>
                {lx({ en: "Review", ta: "மதிப்பாய்வு" })}
              </Text>
            </View>
          </View>

          {/* Scrollable Form Content */}
          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {step === 1 && (
              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {lx({ en: "Basic Information", ta: "அடிப்படை தகவல்கள்" })}
                </Text>

                {/* Name */}
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                  {lx({ en: "Animal Name (Optional)", ta: "மாட்டின் பெயர் (விருப்பம்)" })}
                </Text>
                <TextInput
                  style={[styles.textInput, { borderColor: colors.border, color: colors.foreground }]}
                  value={name}
                  onChangeText={setName}
                  placeholder={lx({ en: "e.g., Gauri", ta: "உதாரணம்: கௌரி" })}
                  placeholderTextColor={colors.mutedForeground}
                />

                {/* Tag Number */}
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                  {lx({ en: "Ear Tag / ID", ta: "காது குறி எண் / ID" })} <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.textInput, { borderColor: colors.border, color: colors.foreground }]}
                  value={tagNumber}
                  onChangeText={setTagNumber}
                  placeholder={lx({ en: "Enter ear tag or ID", ta: "காது குறி எண் அல்லது ID-ஐ உள்ளிடவும்" })}
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="characters"
                />

                {/* Species Dropdown */}
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                  {lx({ en: "Species", ta: "இனம்" })} <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>
                <Pressable
                  style={[styles.dropdownTrigger, { borderColor: colors.border }]}
                  onPress={() => setShowSpeciesPicker(true)}
                >
                  <Text style={[styles.dropdownText, { color: colors.foreground }]}>
                    {type === "cow" ? lx({ en: "Cow", ta: "பசு" }) : type === "buffalo" ? lx({ en: "Buffalo", ta: "எருமை" }) : lx({ en: "Calf", ta: "கன்று" })}
                  </Text>
                  <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
                </Pressable>

                {/* Breed Dropdown */}
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                  {lx({ en: "Breed", ta: "ஜாதி / இனம்" })} <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>
                <Pressable
                  style={[styles.dropdownTrigger, { borderColor: colors.border }]}
                  onPress={() => setShowBreedPicker(true)}
                >
                  <Text style={[styles.dropdownText, breed ? { color: colors.foreground } : { color: colors.mutedForeground }]}>
                    {breed || lx({ en: "Select breed", ta: "ஜாதி / இனத்தை தேர்வு செய்" })}
                  </Text>
                  <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
                </Pressable>

                {/* DOB with calendar icon */}
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                  {lx({ en: "Date of Birth", ta: "பிறந்த தேதி" })}
                </Text>
                <View style={[styles.dateInputContainer, { borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.dateInput, { color: colors.foreground }]}
                    value={birthDate}
                    onChangeText={handleDateChange}
                    placeholder="DD / MM / YYYY"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    maxLength={14}
                  />
                  <Feather name="calendar" size={18} color={colors.mutedForeground} style={{ marginRight: 12 }} />
                </View>

                {/* Gender toggle */}
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                  {lx({ en: "Gender", ta: "பாலினம்" })} <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>
                <View style={styles.genderRow}>
                  <Pressable
                    style={[
                      styles.genderButton,
                      gender === "female" ? styles.genderButtonActive : { borderColor: colors.border },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setGender("female");
                    }}
                  >
                    <Text style={[styles.genderText, gender === "female" ? { color: "#16a34a" } : { color: colors.foreground }]}>
                      {lx({ en: "Female", ta: "பெண்" })}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.genderButton,
                      gender === "male" ? styles.genderButtonActive : { borderColor: colors.border },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setGender("male");
                    }}
                  >
                    <Text style={[styles.genderText, gender === "male" ? { color: "#16a34a" } : { color: colors.foreground }]}>
                      {lx({ en: "Male", ta: "ஆண்" })}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {lx({ en: "Assign Location", ta: "இருப்பிடத்தை ஒதுக்குங்கள்" })}
                </Text>

                {/* Shed Dropdown */}
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                  {lx({ en: "Shed", ta: "கொட்டகை" })} <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>
                <Pressable
                  style={[styles.dropdownTrigger, { borderColor: colors.border }]}
                  onPress={() => setShowShedPicker(true)}
                >
                  <Text style={[styles.dropdownText, { color: colors.foreground }]}>{getShedLabel(shed)}</Text>
                  <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
                </Pressable>

                {/* Category Dropdown */}
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                  {lx({ en: "Group / Category", ta: "குழு / வகை" })} <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>
                <Pressable
                  style={[styles.dropdownTrigger, { borderColor: colors.border }]}
                  onPress={() => setShowCategoryPicker(true)}
                >
                  <Text style={[styles.dropdownText, { color: colors.foreground }]}>{getCategoryLabel(status)}</Text>
                  <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
                </Pressable>

                {/* Category Legends Info */}
                <View style={[styles.legendBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.legendRowItem}>
                    <View style={[styles.legendBullet, { backgroundColor: "#7c3aed" }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.legendTitle, { color: colors.foreground }]}>{lx({ en: "Lactating", ta: "பால் கறக்கும்" })}</Text>
                      <Text style={[styles.legendDesc, { color: colors.mutedForeground }]}>
                        {lx({ en: "Animals that are currently giving milk", ta: "தற்போது பால் கறக்கும் மாடுகள்" })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.legendRowItem}>
                    <View style={[styles.legendBullet, { backgroundColor: "#ef4444" }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.legendTitle, { color: colors.foreground }]}>{lx({ en: "Pregnant", ta: "சினை மாடு" })}</Text>
                      <Text style={[styles.legendDesc, { color: colors.mutedForeground }]}>
                        {lx({ en: "Pregnant animals", ta: "கர்ப்பமாக உள்ள மாடுகள்" })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.legendRowItem}>
                    <View style={[styles.legendBullet, { backgroundColor: "#2563eb" }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.legendTitle, { color: colors.foreground }]}>{lx({ en: "Dry", ta: "வறண்ட மாடு" })}</Text>
                      <Text style={[styles.legendDesc, { color: colors.mutedForeground }]}>
                        {lx({ en: "Animals not giving milk", ta: "பால் கறக்காத மாடுகள்" })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.legendRowItem}>
                    <View style={[styles.legendBullet, { backgroundColor: "#ea580c" }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.legendTitle, { color: colors.foreground }]}>{lx({ en: "Calving / Calves", ta: "கன்றுகள்" })}</Text>
                      <Text style={[styles.legendDesc, { color: colors.mutedForeground }]}>
                        {lx({ en: "Young calves or animals expected to calve", ta: "இளம் கன்றுகள் அல்லது கன்றுக்குட்டிகள்" })}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {lx({ en: "Review Details", ta: "விவரங்களை மதிப்பாய்வு செய்க" })}
                </Text>

                {/* Review Card */}
                <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.reviewRow}>
                    <Text style={[styles.reviewLabel, { color: colors.mutedForeground }]}>{lx({ en: "Animal Name", ta: "மாட்டின் பெயர்" })}</Text>
                    <Text style={[styles.reviewValue, { color: colors.foreground }]}>{name || lx({ en: "(Auto-generated)", ta: "(தானாக உருவாக்கப்பட்ட பெயர்)" })}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={[styles.reviewLabel, { color: colors.mutedForeground }]}>{lx({ en: "Ear Tag / ID", ta: "காடு குறி எண்" })}</Text>
                    <Text style={[styles.reviewValue, { color: colors.foreground }]}>{tagNumber}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={[styles.reviewLabel, { color: colors.mutedForeground }]}>{lx({ en: "Species", ta: "இனம்" })}</Text>
                    <Text style={[styles.reviewValue, { color: colors.foreground, textTransform: "capitalize" }]}>{type}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={[styles.reviewLabel, { color: colors.mutedForeground }]}>{lx({ en: "Breed", ta: "ஜாதி / இனம்" })}</Text>
                    <Text style={[styles.reviewValue, { color: colors.foreground }]}>{breed}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={[styles.reviewLabel, { color: colors.mutedForeground }]}>{lx({ en: "Gender", ta: "பாலினம்" })}</Text>
                    <Text style={[styles.reviewValue, { color: colors.foreground, textTransform: "capitalize" }]}>{gender}</Text>
                  </View>
                  {birthDate ? (
                    <View style={styles.reviewRow}>
                      <Text style={[styles.reviewLabel, { color: colors.mutedForeground }]}>{lx({ en: "Date of Birth", ta: "பிறந்த தேதி" })}</Text>
                      <Text style={[styles.reviewValue, { color: colors.foreground }]}>{birthDate}</Text>
                    </View>
                  ) : null}
                  <View style={styles.reviewRow}>
                    <Text style={[styles.reviewLabel, { color: colors.mutedForeground }]}>{lx({ en: "Shed Assignment", ta: "கொட்டகை" })}</Text>
                    <Text style={[styles.reviewValue, { color: colors.foreground }]}>{getShedLabel(shed)}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={[styles.reviewLabel, { color: colors.mutedForeground }]}>{lx({ en: "Group / Category", ta: "பிரிவு / வகை" })}</Text>
                    <Text style={[styles.reviewValue, { color: colors.foreground }]}>{getCategoryLabel(status)}</Text>
                  </View>
                </View>

                {/* Notes Input */}
                <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>
                  {lx({ en: "Additional Information (Optional)", ta: "கூடுதல் தகவல்கள் (விருப்பம்)" })}
                </Text>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                  {lx({ en: "Notes", ta: "குறிப்புகள்" })}
                </Text>
                <TextInput
                  style={[styles.textArea, { borderColor: colors.border, color: colors.foreground }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={lx({ en: "Enter any notes about the animal", ta: "விலங்கு பற்றிய குறிப்புகளை உள்ளிடவும்" })}
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}
          </ScrollView>

          {/* Fixed Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable style={[styles.footerBtn, styles.footerBtnSecondary, { borderColor: colors.border }]} onPress={handleBack}>
              <Text style={[styles.footerBtnText, { color: colors.foreground }]}>
                {step > 1 ? lx({ en: "< Back", ta: "< பின்னே" }) : lx({ en: "Cancel", ta: "ரத்து செய்" })}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.footerBtn, styles.footerBtnPrimary]}
              onPress={step < 3 ? handleNext : handleSave}
            >
              <Text style={[styles.footerBtnText, { color: "#fff" }]}>
                {step < 3 ? lx({ en: "Next >", ta: "அடுத்து >" }) : lx({ en: "Save", ta: "சேமி" })}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Species Option Picker */}
      <CustomPicker
        visible={showSpeciesPicker}
        onClose={() => setShowSpeciesPicker(false)}
        title={lx({ en: "Select Species", ta: "இனத்தை தேர்வு செய்" })}
        options={speciesOptions}
        selectedValue={type}
        onSelect={(val) => setType(val as any)}
      />

      {/* Breed Option Picker */}
      <CustomPicker
        visible={showBreedPicker}
        onClose={() => setShowBreedPicker(false)}
        title={lx({ en: "Select Breed", ta: "ஜாதி / இனத்தை தேர்வு செய்" })}
        options={breedOptions}
        selectedValue={breed}
        onSelect={setBreed}
      />

      {/* Shed Option Picker */}
      <CustomPicker
        visible={showShedPicker}
        onClose={() => setShowShedPicker(false)}
        title={lx({ en: "Select Shed", ta: "கொட்டகையை தேர்வு செய்" })}
        options={shedOptions}
        selectedValue={shed}
        onSelect={setShed}
      />

      {/* Category Option Picker */}
      <CustomPicker
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        title={lx({ en: "Select Category", ta: "வகையை தேர்வு செய்" })}
        options={categoryOptions}
        selectedValue={status}
        onSelect={setStatus}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerCloseBtn: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  trackerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  trackerStep: {
    alignItems: "center",
    gap: 4,
    width: 70,
  },
  trackerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  trackerCircleActive: {
    backgroundColor: "#16a34a",
  },
  trackerCircleInactive: {
    backgroundColor: "#e5e7eb",
  },
  trackerText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  trackerLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  trackerLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#e5e7eb",
    marginTop: -16,
  },
  trackerLineActive: {
    backgroundColor: "#16a34a",
  },
  formScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  formSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  dropdownText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  dateInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  genderButtonActive: {
    borderColor: "#16a34a",
    backgroundColor: "#16a34a10",
    borderWidth: 2,
  },
  genderText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  legendBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    gap: 14,
  },
  legendRowItem: {
    flexDirection: "row",
    gap: 12,
  },
  legendBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  legendTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  legendDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  reviewValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    height: 100,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  footerBtnPrimary: {
    backgroundColor: "#16a34a",
  },
  footerBtnSecondary: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  footerBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "75%",
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  pickerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerScroll: {
    flexGrow: 0,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  pickerOptionLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});

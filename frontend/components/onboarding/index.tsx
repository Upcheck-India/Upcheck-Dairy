import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
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
import { Feather } from "@expo/vector-icons";

import { useLanguage, LANGUAGE_NAMES } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { Colors, Typography, Radius, Spacing, Shadows, Layout, Onboarding } from "@/constants/theme";

/* -------------------------------------------------------------------------- */
/*                              SCREEN CONTAINER                              */
/* -------------------------------------------------------------------------- */

export function ScreenContainer({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* -------------------------------------------------------------------------- */
/*                             LANGUAGE SELECTOR                              */
/* -------------------------------------------------------------------------- */

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { data, setField } = useOnboarding();
  const [modalVisible, setModalVisible] = useState(false);

  const activeLanguageName = LANGUAGE_NAMES[language] || "English";

  const handleSelectLanguage = (lang: string) => {
    setLanguage(lang as any);
    setField("language", lang as any);
    setModalVisible(false);
  };

  return (
    <View style={styles.langWrapper}>
      <Pressable
        style={styles.langPill}
        onPress={() => setModalVisible(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`Select Language, current: ${activeLanguageName}`}
      >
        <Feather name="globe" size={16} color="#16a34a" />
        <Text style={styles.langText}>{activeLanguageName}</Text>
        <Feather name="chevron-down" size={14} color="#64748b" />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language / மொழி தேர்வு</Text>
            <FlatList
              data={Object.entries(LANGUAGE_NAMES)}
              keyExtractor={([key]) => key}
              renderItem={({ item: [key, name] }) => (
                <Pressable
                  style={[styles.modalItem, language === key && styles.modalItemActive]}
                  onPress={() => handleSelectLanguage(key)}
                >
                  <Text style={[styles.modalItemText, language === key && styles.modalItemTextActive]}>
                    {name}
                  </Text>
                  {language === key && <Feather name="check" size={18} color="#16a34a" />}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                               SCREEN HEADER                                */
/* -------------------------------------------------------------------------- */

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    CARD                                    */
/* -------------------------------------------------------------------------- */

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/* -------------------------------------------------------------------------- */
/*                                 INPUT FIELD                                */
/* -------------------------------------------------------------------------- */

interface InputFieldProps {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: any;
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  returnKeyType?: "done" | "go" | "next" | "search" | "send";
}

export function InputField({
  label,
  required,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  maxLength,
  autoCapitalize,
  returnKeyType,
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Helper to determine Feather icon name based on label/placeholder
  const getIconName = (): any => {
    const lower = (label || "").toLowerCase();
    if (lower.includes("farm")) return "home";
    if (lower.includes("owner") || lower.includes("name")) return "user";
    if (lower.includes("phone") || lower.includes("mobile")) return "phone";
    if (lower.includes("email")) return "mail";
    if (lower.includes("village")) return "map-pin";
    if (lower.includes("district")) return "navigation";
    if (lower.includes("state")) return "globe";
    if (lower.includes("pincode")) return "hash";
    return "edit-2";
  };

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={[styles.inputRow, isFocused && styles.inputRowActive]}>
        <Feather name={getIconName()} size={18} color="#16a34a" style={styles.fieldIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 BACK BUTTON                                */
/* -------------------------------------------------------------------------- */

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={styles.backBtn}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Go back to previous screen"
    >
      <Feather name="arrow-left" size={20} color="#1F3B2F" />
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                               PRIMARY BUTTON                               */
/* -------------------------------------------------------------------------- */

interface PrimaryButtonProps {
  title: string;
  icon?: string;
  onPress: () => void;
  loading?: boolean;
}

export function PrimaryButton({ title, icon, onPress, loading }: PrimaryButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: loading }}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <View style={styles.btnRow}>
          <Text style={styles.primaryBtnText}>{title}</Text>
          {icon && <Feather name={icon as any} size={18} color="#fff" style={styles.btnIcon} />}
        </View>
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                               DOT INDICATOR                                */
/* -------------------------------------------------------------------------- */

export function DotIndicator() {
  const { currentStep, totalSteps } = useOnboarding();
  return (
    <View style={styles.dotContainer}>
      {Array.from({ length: totalSteps }).map((_, i) => {
        const isActive = i === currentStep;
        return <View key={i} style={[styles.dot, isActive && styles.dotActive]} />;
      })}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                FEATURE CARD                                */
/* -------------------------------------------------------------------------- */

export function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  let resolvedIcon: any = icon;
  const lowerTitle = (title || "").toLowerCase();
  
  if (lowerTitle.includes("health")) resolvedIcon = "shield";
  else if (lowerTitle.includes("milk")) resolvedIcon = "droplet";
  else if (lowerTitle.includes("expense") || lowerTitle.includes("earn")) resolvedIcon = "activity";
  else if (lowerTitle.includes("growth") || lowerTitle.includes("product")) resolvedIcon = "trending-up";

  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIconCircle}>
        <Feather name={resolvedIcon} size={18} color="#16a34a" />
      </View>
      <View style={styles.featureInfo}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{description}</Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                            ANIMAL COUNTER CARD                             */
/* -------------------------------------------------------------------------- */

interface AnimalCounterCardProps {
  image: any;
  title: string;
  count: number;
  increase: () => void;
  decrease: () => void;
}

export function AnimalCounterCard({ image, title, count, increase, decrease }: AnimalCounterCardProps) {
  const formattedCount = String(count).padStart(2, "0");
  return (
    <View style={styles.animalCard}>
      <View style={styles.animalLeft}>
        <Image source={image} style={styles.animalImage} resizeMode="contain" />
        <View style={styles.animalInfo}>
          <Text style={styles.animalCardTitle}>{title}</Text>
          <Text style={styles.animalCardSub}>
            {title === "Cow" || title === "பசு" ? "Dairy cows" : "Dairy animals"}
          </Text>
        </View>
      </View>
      <View style={styles.counterRow}>
        <Pressable
          style={styles.counterBtn}
          onPress={decrease}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${title} count`}
        >
          <Feather name="minus" size={14} color="#64748b" />
        </Pressable>
        <Text style={styles.counterText}>{formattedCount}</Text>
        <Pressable
          style={[styles.counterBtn, styles.counterBtnPlus]}
          onPress={increase}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${title} count`}
        >
          <Feather name="plus" size={14} color="#16a34a" />
        </Pressable>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 STYLES                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Onboarding.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    flexGrow: 1,
  },

  // Language Pill Selector
  langWrapper: {
    alignSelf: "flex-end",
    marginBottom: Spacing.sm,
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  langText: {
    fontSize: Typography.bodySmall,
    fontWeight: "600",
    color: "#334155",
  },

  // Back Button
  backBtn: {
    alignSelf: "flex-start",
    padding: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.md,
    marginTop: -Spacing.xs,
  },

  // Screen Header
  headerContainer: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Onboarding.title,
    textAlign: "center",
    marginBottom: Spacing.xs,
    lineHeight: 28,
  },
  headerSubtitle: {
    fontSize: Typography.bodySmall,
    color: Onboarding.subtitle,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },

  // Card container
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Layout.cardPadding,
    borderWidth: 1,
    borderColor: Onboarding.border,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },

  // Form Fields
  fieldWrap: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  required: {
    color: "#ef4444",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: "#E5ECE7",
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    backgroundColor: "#F9FAF9",
  },
  inputRowActive: {
    borderColor: "#16a34a",
    backgroundColor: Colors.white,
  },
  fieldIcon: {
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1F3B2F",
    padding: 0,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: "#1F3B2F",
  },
  placeholderText: {
    color: "#94A3B8",
  },

  // Primary Button
  primaryBtn: {
    backgroundColor: "#16a34a",
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnPressed: {
    opacity: 0.9,
    backgroundColor: "#15803d",
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  btnIcon: {
    marginLeft: 2,
  },

  // Dot indicator
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16a34a",
  },

  // Feature Card (Welcome Screen)
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAF9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  featureIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EAF8EF",
    alignItems: "center",
    justifyContent: "center",
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F3B2F",
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },

  // Animal Counter Card
  animalCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAF9",
    borderWidth: 1,
    borderColor: "#E5ECE7",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  animalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  animalImage: {
    width: 40,
    height: 40,
  },
  animalInfo: {
    justifyContent: "center",
  },
  animalCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F3B2F",
  },
  animalCardSub: {
    fontSize: 11,
    color: "#94a3b8",
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 8,
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  counterBtnPlus: {
    backgroundColor: "#EAF8EF",
    borderColor: "#D1FAE5",
  },
  counterText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F3B2F",
    minWidth: 20,
    textAlign: "center",
  },

  // Dropdown Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F3B2F",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalItemActive: {
    backgroundColor: "#F9FAF9",
  },
  modalItemText: {
    fontSize: 15,
    color: "#475569",
  },
  modalItemTextActive: {
    color: "#16a34a",
    fontWeight: "700",
  },
});

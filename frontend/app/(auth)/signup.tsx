import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/context/LanguageContext";
import { useFarmer } from "@/context/FarmerContext";

const STATES = [
  "Tamil Nadu", "Andhra Pradesh", "Telangana", "Karnataka",
  "Kerala", "Maharashtra", "Other",
];

export default function SignupScreen() {
  const { t } = useLanguage();
  const { createProfile, session } = useFarmer();
  const insets = useSafeAreaInsets();
  // Accept either email or phone from params for display/legacy compat
  const params = useLocalSearchParams<{ email?: string; phone?: string }>();
  const emailOrPhone = params.email ?? params.phone ?? "";

  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("Tamil Nadu");
  const [farmName, setFarmName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert(t.error, t.required);
      return;
    }
    setLoading(true);
    try {
      await createProfile({
        name,
        village,
        district,
        state,
        farmName,
        // If this is an email login, we don't pass phone; if legacy phone flow, pass it
        phone: params.phone ? params.phone : undefined,
      });
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert(t.error, err.message ?? t.networkError);
    } finally {
      setLoading(false);
    }
  };

  // Display badge: email if available, phone otherwise
  const isEmail = !!params.email;
  const badgeIcon: "mail" | "phone" = isEmail ? "mail" : "phone";
  const badgeText = isEmail
    ? emailOrPhone
    : emailOrPhone.length === 10
      ? `+91 ${emailOrPhone}`
      : emailOrPhone;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#16a34a" />
        </Pressable>

        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>👨‍🌾</Text>
          </View>
          <Text style={styles.title}>{t.signupTitle}</Text>
          <Text style={styles.sub}>{t.signupSub}</Text>
          {emailOrPhone ? (
            <View style={styles.badgePill}>
              <Feather name={badgeIcon} size={12} color="#16a34a" />
              <Text style={styles.badgeText}>{badgeText}</Text>
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={10} color="#fff" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.progressRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.progressDot, i === 2 && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.stepText}>{t.step3of3}</Text>

        <View style={styles.form}>
          {/* Name */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>
              👤 {t.farmerName} <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputRow, !name && styles.inputRowEmpty]}>
              <Feather name="user" size={18} color="#16a34a" />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t.namePlaceholder}
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                autoFocus
              />
            </View>
          </View>

          {/* Village */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>🏡 {t.village}</Text>
            <View style={styles.inputRow}>
              <Feather name="map-pin" size={18} color="#16a34a" />
              <TextInput
                style={styles.input}
                value={village}
                onChangeText={setVillage}
                placeholder={t.villagePlaceholder}
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* District */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>📍 {t.district}</Text>
            <View style={styles.inputRow}>
              <Feather name="navigation" size={18} color="#16a34a" />
              <TextInput
                style={styles.input}
                value={district}
                onChangeText={setDistrict}
                placeholder={t.districtPlaceholder}
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* State chips */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>🌐 State</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.stateRow}>
                {STATES.map((s) => (
                  <Pressable
                    key={s}
                    style={[styles.stateChip, state === s && styles.stateChipActive]}
                    onPress={() => setState(s)}
                  >
                    <Text style={[styles.stateChipText, state === s && styles.stateChipTextActive]}>
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Farm name */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>🌾 Farm Name</Text>
            <View style={styles.inputRow}>
              <Feather name="home" size={18} color="#16a34a" />
              <TextInput
                style={styles.input}
                value={farmName}
                onChangeText={setFarmName}
                placeholder={t.farmNamePlaceholder}
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.createBtn,
            (!name.trim()) && styles.createBtnDisabled,
            pressed && styles.createBtnPressed,
          ]}
          onPress={handleCreate}
          disabled={loading || !name.trim()}
        >
          {loading ? (
            <Text style={styles.createBtnText}>...</Text>
          ) : (
            <>
              <Text style={styles.createBtnText}>{t.continueBtn}</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </>
          )}
        </Pressable>

        <View style={styles.trustRow}>
          <Feather name="shield" size={13} color="#16a34a" />
          <Text style={styles.trustText}>Data stored securely. Never shared.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fefce8" },
  container: { flex: 1, backgroundColor: "#fefce8" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  backBtn: { padding: 8, alignSelf: "flex-start", marginBottom: 4 },
  header: { alignItems: "center", marginBottom: 16 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  icon: { fontSize: 32 },
  title: { fontSize: 22, fontWeight: "800", color: "#1a2e05", marginBottom: 4 },
  sub: { fontSize: 14, color: "#6b7280", marginBottom: 10, textAlign: "center" },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { fontSize: 13, fontWeight: "600", color: "#16a34a" },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#16a34a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  progressRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 4 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#16a34a" },
  progressDotActive: { backgroundColor: "#16a34a", width: 24 },
  stepText: { textAlign: "center", fontSize: 12, color: "#9ca3af", marginBottom: 16 },
  form: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  required: { color: "#ef4444" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#d1fae5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#f0fdf4",
  },
  inputRowEmpty: { borderColor: "#e5e7eb", backgroundColor: "#fafafa" },
  input: { flex: 1, fontSize: 15, color: "#1a2e05" },
  stateRow: { flexDirection: "row", gap: 8 },
  stateChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  stateChipActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  stateChipText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  stateChipTextActive: { color: "#fff" },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16a34a",
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 14,
  },
  createBtnDisabled: { backgroundColor: "#86efac" },
  createBtnPressed: { opacity: 0.88 },
  createBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  trustText: { color: "#4d7c0f", fontSize: 12 },
});

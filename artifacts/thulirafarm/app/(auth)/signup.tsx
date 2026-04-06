import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
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
import { useFarmer } from "@/context/FarmerContext";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGE_NAMES, type Language } from "@/context/LanguageContext";

const DISTRICTS = [
  "Ariyalur", "Chennai", "Chengalpattu", "Coimbatore", "Cuddalore",
  "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram",
  "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
  "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
  "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
  "Vellore", "Viluppuram", "Virudhunagar",
];

const STATES = [
  "Tamil Nadu", "Andhra Pradesh", "Karnataka", "Kerala", "Telangana",
  "Maharashtra", "Rajasthan", "Gujarat", "Uttar Pradesh", "Punjab",
  "Haryana", "Other",
];

export default function SignupScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { signUp } = useFarmer();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("Tamil Nadu");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [farmName, setFarmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !phone.trim() || !pin.trim()) {
      Alert.alert(t.error, t.required);
      return;
    }
    if (phone.length !== 10) {
      Alert.alert(t.error, t.invalidPhone);
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert(t.error, t.pinMismatch);
      return;
    }
    if (pin.length !== 4) {
      Alert.alert(t.error, "PIN must be 4 digits");
      return;
    }
    setLoading(true);
    await signUp({
      name: name.trim(),
      phone: phone.trim(),
      village: village.trim(),
      district: district.trim() || "Not set",
      state: state,
      pin: pin.trim(),
      farmName: farmName.trim() || undefined,
    });
    setLoading(false);
    router.replace("/(tabs)");
  };

  const langs: Language[] = ["ta", "en", "hi"];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.langRow}>
          {langs.map((l) => (
            <Pressable
              key={l}
              style={[styles.langBtn, language === l && styles.langActive]}
              onPress={() => setLanguage(l)}
            >
              <Text style={[styles.langText, language === l && styles.langActiveText]}>
                {LANGUAGE_NAMES[l]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#16a34a" />
          <Text style={styles.backText}>{t.login}</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>{t.signupTitle}</Text>
          <Text style={styles.sub}>{t.signupSub}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>👤 {t.farmerName} *</Text>
          <View style={styles.inputWrap}>
            <Feather name="user" size={18} color="#16a34a" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t.namePlaceholder}
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.sectionLabel}>📱 {t.phone} *</Text>
          <View style={styles.inputWrap}>
            <Feather name="phone" size={18} color="#16a34a" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={t.phonePlaceholder}
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>

          <Text style={styles.sectionLabel}>🏡 {t.village}</Text>
          <View style={styles.inputWrap}>
            <Feather name="map-pin" size={18} color="#16a34a" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={village}
              onChangeText={setVillage}
              placeholder={t.villagePlaceholder}
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.sectionLabel}>📍 {t.district}</Text>
          <View style={styles.inputWrap}>
            <Feather name="navigation" size={18} color="#16a34a" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={district}
              onChangeText={setDistrict}
              placeholder={t.districtPlaceholder}
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.sectionLabel}>🌾 Farm Name (optional)</Text>
          <View style={styles.inputWrap}>
            <Feather name="home" size={18} color="#16a34a" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={farmName}
              onChangeText={setFarmName}
              placeholder="Your farm's name (optional)"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.sectionLabel}>🔒 PIN *</Text>
          <View style={styles.inputWrap}>
            <Feather name="lock" size={18} color="#16a34a" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={pin}
              onChangeText={setPin}
              placeholder={t.pinPlaceholder}
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry={!showPin}
            />
            <Pressable onPress={() => setShowPin(!showPin)}>
              <Feather name={showPin ? "eye-off" : "eye"} size={18} color="#6b7280" />
            </Pressable>
          </View>

          <View style={styles.inputWrap}>
            <Feather name="lock" size={18} color="#16a34a" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder={t.confirmPinPlaceholder}
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry={!showPin}
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? "..." : t.signup}</Text>
          </Pressable>

          <View style={styles.altRow}>
            <Text style={styles.altText}>{t.haveAccount} </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.altLink}>{t.login}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.trustBadge}>
          <Feather name="shield" size={14} color="#16a34a" />
          <Text style={styles.trustText}>
            Your data is stored safely on your device only.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fefce8" },
  container: { flex: 1, backgroundColor: "#fefce8" },
  content: { padding: 20, paddingBottom: 40 },
  langRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginBottom: 8,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
  },
  langActive: { backgroundColor: "#16a34a" },
  langText: { fontSize: 13, color: "#374151", fontWeight: "600" },
  langActiveText: { color: "#fff" },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  backText: { color: "#16a34a", fontSize: 15, fontWeight: "600" },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#1a2e05", marginBottom: 4 },
  sub: { fontSize: 14, color: "#6b7280" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 4,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#d1fae5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 12,
    backgroundColor: "#f0fdf4",
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#1a2e05" },
  btn: {
    backgroundColor: "#16a34a",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  btnPressed: { opacity: 0.85 },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  altRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  altText: { color: "#6b7280", fontSize: 14 },
  altLink: { color: "#16a34a", fontSize: 14, fontWeight: "700" },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
  },
  trustText: { color: "#4d7c0f", fontSize: 12 },
});

import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
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

export default function LoginScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { login } = useFarmer();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !pin.trim()) {
      Alert.alert(t.error, t.required);
      return;
    }
    if (phone.length !== 10) {
      Alert.alert(t.error, t.invalidPhone);
      return;
    }
    setLoading(true);
    const ok = await login(phone.trim(), pin.trim());
    setLoading(false);
    if (ok) {
      router.replace("/(tabs)");
    } else {
      Alert.alert(t.error, "Invalid phone or PIN. Please sign up first.");
    }
  };

  const handleSkip = () => {
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

        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🌱</Text>
          </View>
          <Text style={styles.appName}>{t.appName}</Text>
          <Text style={styles.tagline}>{t.tagline}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{t.loginTitle}</Text>
          <Text style={styles.sub}>{t.loginSub}</Text>

          <View style={styles.inputWrap}>
            <Feather name="phone" size={20} color="#16a34a" style={styles.inputIcon} />
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

          <View style={styles.inputWrap}>
            <Feather name="lock" size={20} color="#16a34a" style={styles.inputIcon} />
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
              <Feather name={showPin ? "eye-off" : "eye"} size={20} color="#6b7280" />
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? "..." : t.login}</Text>
          </Pressable>

          <View style={styles.altRow}>
            <Text style={styles.altText}>{t.noAccount} </Text>
            <Pressable onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.altLink}>{t.createAccount}</Text>
            </Pressable>
          </View>

          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>{t.skip}</Text>
          </Pressable>
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
    marginBottom: 12,
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
  logoWrap: { alignItems: "center", marginBottom: 32, marginTop: 8 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: "800", color: "#1a2e05", marginBottom: 4 },
  tagline: { fontSize: 14, color: "#4d7c0f" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#1a2e05", marginBottom: 4 },
  sub: { fontSize: 14, color: "#6b7280", marginBottom: 24 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#d1fae5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    backgroundColor: "#f0fdf4",
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#1a2e05" },
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
    marginTop: 18,
  },
  altText: { color: "#6b7280", fontSize: 14 },
  altLink: { color: "#16a34a", fontSize: 14, fontWeight: "700" },
  skipBtn: { alignItems: "center", marginTop: 14 },
  skipText: { color: "#9ca3af", fontSize: 13 },
});

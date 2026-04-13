import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
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
import { useLanguage, LANGUAGE_NATIVE, type Language } from "@/context/LanguageContext";
import { sendOtp } from "@/services/api";

const LANGUAGES: Language[] = ["ta", "te", "kn", "ml", "hi", "en"];

export default function LoginScreen() {
  const { t, language, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const phoneRef = useRef<TextInput>(null);

  const handleSkip = () => router.replace("/(tabs)");

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      Alert.alert(t.error, t.invalidPhone);
      return;
    }
    if (!/^[6-9]/.test(cleaned)) {
      Alert.alert(t.error, t.invalidPhone);
      return;
    }
    setLoading(true);
    try {
      const result = await sendOtp(cleaned);
      router.push({ pathname: "/(auth)/otp", params: { phone: cleaned, demoOtp: result.demoOtp ?? "" } });
    } catch (err: any) {
      Alert.alert(t.error, err.message ?? t.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.langGrid}>
          {LANGUAGES.map((l) => {
            const info = LANGUAGE_NATIVE[l];
            const active = language === l;
            return (
              <Pressable
                key={l}
                style={[styles.langPill, active && styles.langPillActive]}
                onPress={() => setLanguage(l)}
              >
                <Text style={styles.langPillFlag}>{info.flag}</Text>
                <Text style={[styles.langPillName, active && styles.langPillNameActive]}>
                  {info.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.heroSection}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoLeaf}>🌱</Text>
          </View>
          <Text style={styles.appName}>{t.appName}</Text>
          <Text style={styles.tagline}>{t.tagline}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.loginTitle}</Text>
          <Text style={styles.cardSub}>{t.loginSub}</Text>

          <View style={styles.phoneRow}>
            <View style={styles.phonePrefixBox}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.prefix}>+91</Text>
            </View>
            <TextInput
              ref={phoneRef}
              style={styles.phoneInput}
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
              placeholder="98765 43210"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleSendOtp}
            />
          </View>

          <Text style={styles.hint}>
            {language === "ta"
              ? "OTP உங்கள் கைபேசிக்கு அனுப்பப்படும்"
              : language === "te"
              ? "OTP మీ మొబైల్‌కి పంపబడుతుంది"
              : language === "kn"
              ? "OTP ನಿಮ್ಮ ಮೊಬೈಲ್‌ಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ"
              : language === "ml"
              ? "OTP നിങ്ങളുടെ മൊബൈലിൽ ലഭിക്കും"
              : language === "hi"
              ? "OTP आपके मोबाइल पर भेजा जाएगा"
              : "OTP will be sent to your mobile number"}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              (loading || phone.length < 10) && styles.sendBtnDisabled,
              pressed && styles.sendBtnPressed,
            ]}
            onPress={handleSendOtp}
            disabled={loading || phone.length < 10}
          >
            {loading ? (
              <Text style={styles.sendBtnText}>{t.sending}</Text>
            ) : (
              <>
                <Feather name="send" size={18} color="#fff" />
                <Text style={styles.sendBtnText}>{t.sendOtp}</Text>
              </>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Feather name="user-x" size={15} color="#9ca3af" />
            <Text style={styles.skipText}>{t.skip}</Text>
          </Pressable>

        </View>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Feather name="shield" size={13} color="#16a34a" />
            <Text style={styles.footerText}>
              {language === "ta"
                ? "உங்கள் தரவு பாதுகாப்பாக சேமிக்கப்படுகிறது"
                : language === "hi"
                ? "आपका डेटा सुरक्षित रहता है"
                : "Your data is stored securely on your device"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fefce8" },
  container: { flex: 1, backgroundColor: "#fefce8" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  langGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
    justifyContent: "center",
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  langPillActive: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  langPillFlag: { fontSize: 14 },
  langPillName: { fontSize: 13, fontWeight: "600", color: "#374151" },
  langPillNameActive: { color: "#fff" },
  heroSection: { alignItems: "center", marginBottom: 28 },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  logoLeaf: { fontSize: 38 },
  appName: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1a2e05",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: { fontSize: 14, color: "#4d7c0f", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  cardTitle: { fontSize: 20, fontWeight: "800", color: "#1a2e05", marginBottom: 4 },
  cardSub: { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#d1fae5",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "#f0fdf4",
  },
  phonePrefixBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRightWidth: 1.5,
    borderRightColor: "#d1fae5",
    backgroundColor: "#dcfce7",
  },
  flag: { fontSize: 18 },
  prefix: { fontSize: 16, fontWeight: "700", color: "#16a34a" },
  phoneInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    color: "#1a2e05",
    paddingHorizontal: 14,
    paddingVertical: 16,
    letterSpacing: 2,
  },
  hint: { fontSize: 12, color: "#9ca3af", textAlign: "center", marginBottom: 16 },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16a34a",
    borderRadius: 16,
    paddingVertical: 16,
  },
  sendBtnDisabled: { backgroundColor: "#86efac" },
  sendBtnPressed: { opacity: 0.88 },
  sendBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerText: { color: "#9ca3af", fontSize: 13, fontWeight: "500" },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  skipText: { color: "#9ca3af", fontSize: 14 },
  footer: { alignItems: "center", marginTop: 20 },
  footerRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  footerText: { color: "#4d7c0f", fontSize: 12 },
});

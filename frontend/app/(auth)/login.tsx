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
import { requestEmailOtp } from "@/services/api";

const LANGUAGES: Language[] = ["ta", "te", "kn", "ml", "hi", "en"];

export default function LoginScreen() {
  const { t, language, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextInput>(null);

  const handleSkip = () => router.replace("/(tabs)");

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      Alert.alert(
        t.error,
        language === "ta"
          ? "சரியான மின்னஞ்சல் முகவரி உள்ளிடவும்"
          : language === "hi"
          ? "कृपया सही ईमेल पता दर्ज करें"
          : "Please enter a valid email address"
      );
      return;
    }
    setLoading(true);
    try {
      await requestEmailOtp(trimmed);
      router.push({ pathname: "/(auth)/otp", params: { email: trimmed } });
    } catch (err: any) {
      Alert.alert(t.error, err.message ?? t.networkError);
    } finally {
      setLoading(false);
    }
  };

  const emailLabel =
    language === "ta" ? "மின்னஞ்சல்"
    : language === "te" ? "ఇమెయిల్"
    : language === "kn" ? "ಇಮೇಲ್"
    : language === "ml" ? "ഇമെയിൽ"
    : language === "hi" ? "ईमेल"
    : "Email";

  const otpHint =
    language === "ta" ? "OTP உங்கள் மின்னஞ்சலுக்கு அனுப்பப்படும்"
    : language === "te" ? "OTP మీ ఇమెయిల్‌కి పంపబడుతుంది"
    : language === "kn" ? "OTP ನಿಮ್ಮ ಇಮೇಲ್‌ಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ"
    : language === "ml" ? "OTP നിങ്ങളുടെ ഇമെയിലിൽ ലഭിക്കും"
    : language === "hi" ? "OTP आपके ईमेल पर भेजा जाएगा"
    : "A one-time code will be sent to your email";

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
        {/* Language selector */}
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

        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoLeaf}>🌱</Text>
          </View>
          <Text style={styles.appName}>{t.appName}</Text>
          <Text style={styles.tagline}>{t.tagline}</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.loginTitle}</Text>
          <Text style={styles.cardSub}>{t.loginSub}</Text>

          {/* Email input */}
          <Text style={styles.inputLabel}>{emailLabel}</Text>
          <View style={styles.emailRow}>
            <Feather name="mail" size={18} color="#16a34a" style={styles.inputIcon} />
            <TextInput
              ref={emailRef}
              style={styles.emailInput}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSendOtp}
            />
          </View>

          <Text style={styles.hint}>{otpHint}</Text>

          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              (loading || !isValidEmail(email)) && styles.sendBtnDisabled,
              pressed && styles.sendBtnPressed,
            ]}
            onPress={handleSendOtp}
            disabled={loading || !isValidEmail(email)}
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
                : "Your data is stored securely"}
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
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#d1fae5",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  emailInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#1a2e05",
    paddingVertical: 16,
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

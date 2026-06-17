import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { forgotPassword } from "@/services/api";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleSend = async () => {
    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {/* Back */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#16a34a" />
        </Pressable>

        {/* Icon */}
        <View style={styles.iconWrap}>
          <LinearGradient colors={["#dcfce7", "#d1fae5"]} style={styles.iconCircle}>
            <Feather name="key" size={32} color="#16a34a" />
          </LinearGradient>
        </View>

        {!sent ? (
          <>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.sub}>
              Enter your registered email address. We'll send you a link to reset your password.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrap}>
                <Feather name="mail" size={16} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSend}
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              onPress={handleSend}
              disabled={loading || !isValidEmail(email)}
            >
              <LinearGradient
                colors={loading || !isValidEmail(email) ? ["#86efac", "#6ee7b7"] : ["#16a34a", "#0f766e"]}
                style={styles.primaryBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.backToLogin} onPress={() => router.back()}>
              <Feather name="arrow-left" size={14} color="#16a34a" />
              <Text style={styles.backToLoginText}>Back to Sign In</Text>
            </Pressable>
          </>
        ) : (
          /* Success state */
          <View style={styles.successBox}>
            <View style={styles.successCheckCircle}>
              <Feather name="check" size={28} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Email Sent!</Text>
            <Text style={styles.successSub}>
              We've sent a password reset link to{"\n"}
              <Text style={styles.successEmail}>{email}</Text>
            </Text>
            <Text style={styles.successHint}>
              Check your spam folder if you don't see it within a few minutes.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, { marginTop: 24, width: "100%" }, pressed && { opacity: 0.85 }]}
              onPress={() => router.replace("/(auth)/login")}
            >
              <LinearGradient colors={["#16a34a", "#0f766e"]} style={styles.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.primaryBtnText}>Back to Sign In</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.resendLink} onPress={() => { setSent(false); setLoading(false); }}>
              <Text style={styles.resendLinkText}>Didn't receive it? Try again</Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, paddingHorizontal: 24 },
  backBtn: { padding: 8, alignSelf: "flex-start", marginBottom: 24 },

  iconWrap: { alignItems: "flex-start", marginBottom: 24 },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  title: { fontSize: 26, fontWeight: "800", color: "#0f172a", marginBottom: 10 },
  sub: { fontSize: 15, color: "#64748b", lineHeight: 22, marginBottom: 28 },

  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: "#0f172a", paddingVertical: 14 },

  primaryBtn: { borderRadius: 14, overflow: "hidden" },
  primaryBtnGrad: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  backToLogin: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
    paddingVertical: 8,
  },
  backToLoginText: { fontSize: 14, color: "#16a34a", fontWeight: "600" },

  successBox: { alignItems: "center", flex: 1, justifyContent: "center", paddingBottom: 60 },
  successCheckCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  successTitle: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 12 },
  successSub: { fontSize: 15, color: "#64748b", textAlign: "center", lineHeight: 22, marginBottom: 12 },
  successEmail: { fontWeight: "700", color: "#16a34a" },
  successHint: { fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 20 },
  resendLink: { marginTop: 16 },
  resendLinkText: { fontSize: 14, color: "#16a34a", fontWeight: "600" },
});

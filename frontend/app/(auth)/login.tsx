import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFarmer } from "@/context/FarmerContext";
import { signInWithEmail, requestEmailOtp, signInWithGoogle } from "@/services/api";
import type { Session } from "@supabase/supabase-js";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { setSessionFromAuth } = useFarmer();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [tcLoading, setTcLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  // ─── Email + Password Sign In ─────────────────────────────────────
  const handleSignIn = async () => {
    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (!password) {
      Alert.alert("Missing Password", "Please enter your password.");
      return;
    }
    setLoading(true);
    try {
      const result = await signInWithEmail(email.trim().toLowerCase(), password);
      if (result.requires2FA && result.tempToken) {
        router.push({ pathname: "/(auth)/2fa", params: { tempToken: result.tempToken } });
        return;
      }
      if (result.session) {
        await setSessionFromAuth(result.session as Session);
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      Alert.alert("Sign In Failed", err.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Email OTP (passwordless) ─────────────────────────────────────
  const handleEmailOtp = async () => {
    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter your email first, then tap 'Sign in with email code'.");
      return;
    }
    setOtpLoading(true);
    try {
      await requestEmailOtp(email.trim().toLowerCase());
      router.push({ pathname: "/(auth)/otp", params: { email: email.trim().toLowerCase() } });
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to send code.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── Google OAuth ─────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.session) {
        await setSessionFromAuth(result.session as Session);
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      Alert.alert("Google Sign-In Failed", err.message ?? "Could not sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // ─── Truecaller ───────────────────────────────────────────────────
  const handleTruecaller = async () => {
    setTcLoading(true);
    try {
      // Open Truecaller SDK intent — on Android this opens the Truecaller app
      // The callback comes back via deep link handled by the backend
      Alert.alert(
        "Truecaller",
        "Truecaller authentication requires the Truecaller app installed on your device.\n\nThis will be implemented with native SDK integration.",
        [{ text: "OK" }]
      );
    } finally {
      setTcLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient colors={["#0f172a", "#134e4a"]} style={styles.bgGradient} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🌱</Text>
          </View>
          <Text style={styles.appName}>Thulir Farm</Text>
          <Text style={styles.appTagline}>Smart Dairy Management</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Sign in to your account</Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
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
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={16} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
              <Pressable onPress={() => setShowPassword((p) => !p)} style={styles.eyeBtn}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="#64748b" />
              </Pressable>
            </View>
          </View>

          {/* Sign In Button */}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <LinearGradient colors={["#16a34a", "#0f766e"]} style={styles.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google */}
          <Pressable
            style={({ pressed }) => [styles.socialBtn, pressed && styles.btnPressed]}
            onPress={handleGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#374151" size="small" />
            ) : (
              <>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.socialBtnText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {/* Truecaller */}
          <Pressable
            style={({ pressed }) => [styles.socialBtn, styles.tcBtn, pressed && styles.btnPressed]}
            onPress={handleTruecaller}
            disabled={tcLoading}
          >
            {tcLoading ? (
              <ActivityIndicator color="#0066ff" size="small" />
            ) : (
              <>
                <Text style={styles.tcIcon}>☎</Text>
                <Text style={[styles.socialBtnText, styles.tcBtnText]}>Continue with Truecaller</Text>
              </>
            )}
          </Pressable>

          {/* Footer links */}
          <View style={styles.linksRow}>
            <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </Pressable>
          </View>

          <Pressable onPress={handleEmailOtp} disabled={otpLoading} style={styles.otpLink}>
            {otpLoading ? (
              <ActivityIndicator color="#16a34a" size="small" />
            ) : (
              <Text style={styles.otpLinkText}>Sign in with email code</Text>
            )}
          </Pressable>

          {/* Create account */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.outlineBtn, pressed && styles.btnPressed]}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.outlineBtnText}>Create Account</Text>
          </Pressable>

          {/* Guest skip */}
          <Pressable style={styles.skipBtn} onPress={() => router.replace("/(tabs)")}>
            <Feather name="user-x" size={13} color="#94a3b8" />
            <Text style={styles.skipText}>Continue as guest</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bgGradient: { ...StyleSheet.absoluteFillObject },
  scroll: { paddingHorizontal: 20 },

  hero: { alignItems: "center", marginBottom: 28 },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(22,163,74,0.2)",
    borderWidth: 2,
    borderColor: "rgba(22,163,74,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: "800", color: "#f0fdf4", letterSpacing: -0.5 },
  appTagline: { fontSize: 13, color: "#86efac", marginTop: 4 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  cardTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  cardSub: { fontSize: 14, color: "#64748b", marginBottom: 22 },

  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  required: { color: "#ef4444" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: "#0f172a", paddingVertical: 14 },
  eyeBtn: { padding: 4 },

  primaryBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  primaryBtnGrad: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnPressed: { opacity: 0.85 },

  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
  dividerText: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },

  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  socialBtnText: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  googleG: { fontSize: 18, fontWeight: "900", color: "#4285f4" },
  tcBtn: { borderColor: "#0066ff22", backgroundColor: "#f0f6ff" },
  tcIcon: { fontSize: 16, color: "#0066ff" },
  tcBtnText: { color: "#0066ff" },

  linksRow: { alignItems: "center", marginTop: 4 },
  linkText: { fontSize: 14, color: "#16a34a", fontWeight: "600" },
  otpLink: { alignItems: "center", marginTop: 8, paddingVertical: 4 },
  otpLinkText: { fontSize: 14, color: "#0f766e", fontWeight: "600" },

  outlineBtn: {
    borderWidth: 1.5,
    borderColor: "#d1fae5",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    marginTop: 4,
  },
  outlineBtnText: { fontSize: 15, fontWeight: "700", color: "#16a34a" },

  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 6,
  },
  skipText: { fontSize: 13, color: "#94a3b8" },
});

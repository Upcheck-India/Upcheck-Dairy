import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFarmer } from "@/context/FarmerContext";
import { loginUser, sendOtpCode } from "@/services/api";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { loginWithJwt } = useFarmer();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
      const result = await loginUser(email.trim().toLowerCase(), password);
      await loginWithJwt(result);
      
      const isProfileIncomplete = !result.user.village || !result.user.district;
      if (isProfileIncomplete) {
        router.replace({
          pathname: "/(auth)/signup",
          params: { email: email.trim().toLowerCase() },
        });
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      if (err.message && (err.message.toLowerCase().includes("verified") || err.message.toLowerCase().includes("verification"))) {
        try {
          await sendOtpCode(email.trim().toLowerCase());
          Alert.alert(
            "Email Not Verified",
            "Your email is not verified. We have sent a verification code to your email. Please verify it to log in.",
            [
              {
                text: "Verify Now",
                onPress: () => {
                  router.push({
                    pathname: "/(auth)/otp",
                    params: { email: email.trim().toLowerCase(), flow: "register" },
                  });
                },
              },
            ]
          );
        } catch (otpErr: any) {
          Alert.alert("Sign In Failed", otpErr.message ?? "Could not send verification code.");
        }
      } else {
        Alert.alert("Sign In Failed", err.message ?? "Invalid email or password.");
      }
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
      await sendOtpCode(email.trim().toLowerCase());
      router.push({ pathname: "/(auth)/otp", params: { email: email.trim().toLowerCase(), flow: "login" } });
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to send code.");
    } finally {
      setOtpLoading(false);
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
          <Text style={styles.appName}>Upcheck</Text>
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

          {/* Forgot Password */}
          <View style={styles.linksRow}>
            <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign in with email code (OTP) */}
          <Pressable onPress={handleEmailOtp} disabled={otpLoading} style={styles.otpBtn}>
            {otpLoading ? (
              <ActivityIndicator color="#16a34a" size="small" />
            ) : (
              <>
                <Feather name="send" size={15} color="#0f766e" />
                <Text style={styles.otpBtnText}>Sign in with email code</Text>
              </>
            )}
          </Pressable>

          {/* Divider */}
          <View style={[styles.divider, { marginTop: 8 }]}>
            <View style={styles.dividerLine} />
          </View>

          {/* Create account */}
          <Pressable
            style={({ pressed }) => [styles.outlineBtn, pressed && styles.btnPressed]}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.outlineBtnText}>Create Account</Text>
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

  linksRow: { alignItems: "center", marginTop: 12 },
  linkText: { fontSize: 14, color: "#16a34a", fontWeight: "600" },

  otpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#d1fae5",
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: "#f0fdf4",
  },
  otpBtnText: { fontSize: 15, fontWeight: "600", color: "#0f766e" },

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
});

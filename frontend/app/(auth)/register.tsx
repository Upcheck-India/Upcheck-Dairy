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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFarmer } from "@/context/FarmerContext";
import { signUpWithEmail, signInWithGoogle } from "@/services/api";
import type { Session } from "@supabase/supabase-js";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { setSessionFromAuth } = useFarmer();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [tcLoading, setTcLoading] = useState(false);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleRegister = async () => {
    if (!firstName.trim()) {
      Alert.alert("Required", "First name is required.");
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUpWithEmail(
        email.trim().toLowerCase(),
        password,
        { firstName: firstName.trim(), lastName: lastName.trim() }
      );

      if (result.session) {
        // Account created & logged in — go collect farm profile
        await setSessionFromAuth(result.session as Session);
        router.replace({
          pathname: "/(auth)/signup",
          params: { email: email.trim().toLowerCase() },
        });
      } else {
        // Supabase sent a confirmation email
        Alert.alert(
          "Check your inbox ✉️",
          "We've sent a confirmation link to your email. Verify it, then sign in.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
        );
      }
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message ?? "Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.session) {
        await setSessionFromAuth(result.session as Session);
        router.replace({ pathname: "/(auth)/signup", params: { email: result.user?.email ?? "" } });
      }
    } catch (err: any) {
      Alert.alert("Google Sign-Up Failed", err.message ?? "Could not sign up with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleTruecaller = async () => {
    setTcLoading(true);
    try {
      Alert.alert(
        "Truecaller",
        "Truecaller authentication requires the Truecaller app installed on your device.\n\nThis will be implemented with native SDK integration.",
        [{ text: "OK" }]
      );
    } finally {
      setTcLoading(false);
    }
  };

  const passwordStrength = (): { label: string; color: string; width: number } => {
    const len = password.length;
    if (len === 0) return { label: "", color: "#e2e8f0", width: 0 };
    if (len < 6) return { label: "Weak", color: "#ef4444", width: 0.33 };
    if (len < 10) return { label: "Fair", color: "#f59e0b", width: 0.66 };
    return { label: "Strong", color: "#16a34a", width: 1 };
  };
  const strength = passwordStrength();

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#16a34a" />
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.sub}>Join Thulir Farm to manage your dairy</Text>
        </View>

        {/* First + Last Name */}
        <View style={styles.nameRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>First Name <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputWrap}>
              <Feather name="user" size={15} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Arjun"
                placeholderTextColor="#94a3b8"
                autoCapitalize="words"
                autoFocus
              />
            </View>
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Last Name</Text>
            <View style={styles.inputWrap}>
              <Feather name="user" size={15} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Kumar"
                placeholderTextColor="#94a3b8"
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputWrap}>
            <Feather name="mail" size={15} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputWrap}>
            <Feather name="lock" size={15} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword((p) => !p)} style={styles.eyeBtn}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={15} color="#64748b" />
            </Pressable>
          </View>
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthTrack}>
                <View style={[styles.strengthFill, { width: `${strength.width * 100}%` as any, backgroundColor: strength.color }]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}
          <Text style={styles.hint}>Min 8 characters</Text>
        </View>

        {/* Confirm Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Confirm Password <Text style={styles.required}>*</Text></Text>
          <View style={[styles.inputWrap, confirmPassword && confirmPassword !== password && { borderColor: "#fca5a5" }]}>
            <Feather name="lock" size={15} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showConfirm}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            <Pressable onPress={() => setShowConfirm((p) => !p)} style={styles.eyeBtn}>
              <Feather name={showConfirm ? "eye-off" : "eye"} size={15} color="#64748b" />
            </Pressable>
          </View>
          {confirmPassword && confirmPassword !== password && (
            <Text style={styles.errorHint}>Passwords do not match</Text>
          )}
        </View>

        {/* Create Account Button */}
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          onPress={handleRegister}
          disabled={loading}
        >
          <LinearGradient colors={["#16a34a", "#0f766e"]} style={styles.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Create Account</Text>
            )}
          </LinearGradient>
        </Pressable>

        {/* Terms */}
        <Text style={styles.terms}>
          By creating an account, you agree to our{" "}
          <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>

        {/* Social */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or sign up with</Text>
          <View style={styles.dividerLine} />
        </View>

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

        {/* Sign In Link */}
        <Pressable style={styles.signinRow} onPress={() => router.back()}>
          <Text style={styles.signinText}>
            Already have an account?{" "}
            <Text style={styles.signinLink}>Sign In</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },

  backBtn: { padding: 8, alignSelf: "flex-start", marginBottom: 8 },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: "800", color: "#0f172a" },
  sub: { fontSize: 14, color: "#64748b", marginTop: 4 },

  nameRow: { flexDirection: "row", gap: 12 },
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
  input: { flex: 1, fontSize: 15, color: "#0f172a", paddingVertical: 13 },
  eyeBtn: { padding: 4 },

  strengthRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  strengthTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  strengthFill: { height: "100%", borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "700", minWidth: 40 },
  hint: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  errorHint: { fontSize: 11, color: "#ef4444", marginTop: 4 },

  primaryBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  primaryBtnGrad: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnPressed: { opacity: 0.85 },

  terms: { fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 12, lineHeight: 18 },
  termsLink: { color: "#16a34a", fontWeight: "600" },

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
  tcIcon: { fontSize: 15, color: "#0066ff" },
  tcBtnText: { color: "#0066ff" },

  signinRow: { alignItems: "center", marginTop: 10 },
  signinText: { fontSize: 14, color: "#64748b" },
  signinLink: { color: "#16a34a", fontWeight: "700" },
});

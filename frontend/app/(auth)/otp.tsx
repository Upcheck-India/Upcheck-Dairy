import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useFarmer } from "@/context/FarmerContext";
import { verifyOtpCode, sendOtpCode } from "@/services/api";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const { loginWithJwt, farmer } = useFarmer();
  const params = useLocalSearchParams<{ email: string; flow?: string }>();
  const email = params.email ?? "";
  // flow=register → go to onboarding after verify; flow=login → go to tabs
  const flow = params.flow ?? "login";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  const maskedEmail = email.includes("@")
    ? `${email.slice(0, 2)}***@${email.split("@")[1]}`
    : email;

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newOtp.every((d) => d !== "") && cleaned) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = useCallback(async (code?: string) => {
    const enteredOtp = code ?? otp.join("");
    if (enteredOtp.length !== OTP_LENGTH) {
      Alert.alert("Incomplete Code", "Please enter all 6 digits.");
      return;
    }
    setLoading(true);
    try {
      const result = await verifyOtpCode(email, enteredOtp);

      // Store JWT and update context
      await loginWithJwt(result);

      // After register flow → go to onboarding to collect farm details
      // After login flow → go to dashboard (unless no farm profile yet)
      const isProfileIncomplete = !result.user.village || !result.user.district;
      if (flow === "register" || isProfileIncomplete) {
        router.replace({ pathname: "/(auth)/signup", params: { email } });
      }
    } catch (err: any) {
      Alert.alert("Wrong Code", err.message ?? "Invalid or expired code. Please try again.");
      setOtp(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  }, [otp, email, flow, farmer, loginWithJwt]);

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await sendOtpCode(email);
      setCountdown(RESEND_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  const filled = otp.filter((d) => d !== "").length;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {/* Back */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#16a34a" />
        </Pressable>

        {/* Icon + Header */}
        <View style={styles.header}>
          <LinearGradient colors={["#dcfce7", "#d1fae5"]} style={styles.iconCircle}>
            <Feather name="mail" size={32} color="#16a34a" />
          </LinearGradient>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.sub}>We sent a 6-digit code to</Text>
          <View style={styles.emailPill}>
            <Feather name="mail" size={13} color="#16a34a" />
            <Text style={styles.emailText}>{maskedEmail}</Text>
          </View>
        </View>

        {/* OTP Boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputRefs.current[i] = r; }}
              style={[
                styles.otpBox,
                digit !== "" && styles.otpBoxFilled,
                i === filled && styles.otpBoxActive,
              ]}
              value={digit}
              onChangeText={(text) => handleChange(text, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <Text style={styles.expiryNote}>Code expires in 5 minutes. Check your spam folder.</Text>

        {/* Verify Button */}
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          onPress={() => handleVerify()}
          disabled={loading || filled < OTP_LENGTH}
        >
          <LinearGradient
            colors={loading || filled < OTP_LENGTH ? ["#86efac", "#6ee7b7"] : ["#16a34a", "#0f766e"]}
            style={styles.primaryBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="check-circle" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Verify Code</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        {/* Resend */}
        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.resendWait}>
              Resend code in <Text style={{ fontWeight: "700", color: "#0f172a" }}>{countdown}s</Text>
            </Text>
          ) : (
            <Pressable
              onPress={handleResend}
              disabled={resending}
              style={({ pressed }) => [styles.resendBtn, pressed && { opacity: 0.7 }]}
            >
              {resending ? (
                <ActivityIndicator color="#16a34a" size="small" />
              ) : (
                <>
                  <Feather name="refresh-cw" size={14} color="#16a34a" />
                  <Text style={styles.resendBtnText}>Resend code</Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {/* Wrong email */}
        <Pressable style={styles.wrongEmailBtn} onPress={() => router.back()}>
          <Text style={styles.wrongEmailText}>Wrong email? Go back</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, paddingHorizontal: 24 },
  backBtn: { padding: 8, alignSelf: "flex-start", marginBottom: 16 },

  header: { alignItems: "center", marginBottom: 32 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  sub: { fontSize: 14, color: "#64748b", marginBottom: 10 },
  emailPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  emailText: { fontSize: 14, fontWeight: "700", color: "#16a34a" },

  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  otpBox: {
    flex: 1,
    height: 60,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    backgroundColor: "#fff",
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  otpBoxFilled: { borderColor: "#16a34a", backgroundColor: "#f0fdf4" },
  otpBoxActive: { borderColor: "#16a34a", borderWidth: 2.5 },

  expiryNote: { textAlign: "center", fontSize: 12, color: "#94a3b8", marginBottom: 24 },

  primaryBtn: { borderRadius: 14, overflow: "hidden" },
  primaryBtnGrad: {
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  resendRow: { alignItems: "center", marginTop: 20 },
  resendWait: { fontSize: 14, color: "#64748b" },
  resendBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  resendBtnText: { fontSize: 14, fontWeight: "700", color: "#16a34a" },

  wrongEmailBtn: { alignItems: "center", marginTop: 16, paddingVertical: 6 },
  wrongEmailText: { fontSize: 13, color: "#94a3b8" },
});

import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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
import { useLanguage } from "@/context/LanguageContext";
import { useFarmer } from "@/context/FarmerContext";
import { verifyOtp, sendOtp } from "@/services/api";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function OtpScreen() {
  const { t } = useLanguage();
  const { loginWithPhone } = useFarmer();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phone: string; demoOtp: string }>();
  const phone = params.phone ?? "";
  const [demoOtp, setDemoOtp] = useState(params.demoOtp ?? "");

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

  const maskedPhone = phone.length === 10
    ? `+91 ${phone.slice(0, 2)}XXXX${phone.slice(6)}`
    : phone;

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
      Alert.alert(t.error, t.enterOtp);
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(phone, enteredOtp);
      const result = await loginWithPhone(phone);
      if (result === "found") {
        router.replace("/(tabs)");
      } else {
        router.replace({ pathname: "/(auth)/signup", params: { phone } });
      }
    } catch (err: any) {
      Alert.alert(t.wrongOtp, err.message ?? t.error);
      setOtp(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  }, [otp, phone, t, loginWithPhone]);

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      const result = await sendOtp(phone);
      setDemoOtp(result.demoOtp ?? "");
      setCountdown(RESEND_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      Alert.alert(t.error, err.message ?? t.networkError);
    } finally {
      setResending(false);
    }
  };

  const filled = otp.filter((d) => d !== "").length;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#16a34a" />
        </Pressable>

        <View style={styles.header}>
          <View style={styles.otpIconWrap}>
            <Text style={styles.otpIcon}>🔐</Text>
          </View>
          <Text style={styles.title}>{t.verifyOtp}</Text>
          <Text style={styles.sub}>
            {t.otpSentTo}
          </Text>
          <View style={styles.phonePill}>
            <Feather name="phone" size={13} color="#16a34a" />
            <Text style={styles.phoneText}>{maskedPhone}</Text>
          </View>
        </View>

        {demoOtp ? (
          <View style={styles.demoBanner}>
            <Feather name="info" size={14} color="#7c3aed" />
            <Text style={styles.demoLabel}>{t.demoOtpNote}:</Text>
            <Text style={styles.demoCode}>{demoOtp}</Text>
          </View>
        ) : null}

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

        <Text style={styles.expiryNote}>{t.otpExpiry}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.verifyBtn,
            (loading || filled < OTP_LENGTH) && styles.verifyBtnDisabled,
            pressed && styles.verifyBtnPressed,
          ]}
          onPress={() => handleVerify()}
          disabled={loading || filled < OTP_LENGTH}
        >
          {loading ? (
            <Text style={styles.verifyBtnText}>{t.verifying}</Text>
          ) : (
            <>
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={styles.verifyBtnText}>{t.verifyOtp}</Text>
            </>
          )}
        </Pressable>

        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.resendWait}>
              {t.resendIn} {countdown} {t.seconds}
            </Text>
          ) : (
            <Pressable
              onPress={handleResend}
              disabled={resending}
              style={({ pressed }) => [styles.resendBtn, pressed && { opacity: 0.7 }]}
            >
              <Feather name="refresh-cw" size={14} color="#16a34a" />
              <Text style={styles.resendBtnText}>{resending ? "..." : t.resendOtp}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.progressRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.progressDot, i === 1 && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.stepText}>{t.step2of3}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fefce8" },
  container: { flex: 1, backgroundColor: "#fefce8", paddingHorizontal: 24 },
  backBtn: { padding: 8, alignSelf: "flex-start", marginBottom: 8 },
  header: { alignItems: "center", marginBottom: 20 },
  otpIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  otpIcon: { fontSize: 32 },
  title: { fontSize: 24, fontWeight: "800", color: "#1a2e05", marginBottom: 6 },
  sub: { fontSize: 14, color: "#6b7280", marginBottom: 8 },
  phonePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  phoneText: { fontSize: 15, fontWeight: "700", color: "#16a34a", letterSpacing: 0.5 },
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ede9fe",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#c4b5fd",
  },
  demoLabel: { fontSize: 13, color: "#7c3aed", fontWeight: "600" },
  demoCode: { fontSize: 18, fontWeight: "800", color: "#6d28d9", letterSpacing: 3 },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
  },
  otpBox: {
    width: 48,
    height: 58,
    borderWidth: 2,
    borderColor: "#d1fae5",
    borderRadius: 14,
    fontSize: 24,
    fontWeight: "800",
    color: "#1a2e05",
    backgroundColor: "#f0fdf4",
    textAlign: "center",
  },
  otpBoxFilled: {
    borderColor: "#16a34a",
    backgroundColor: "#dcfce7",
  },
  otpBoxActive: {
    borderColor: "#16a34a",
    borderWidth: 2.5,
  },
  expiryNote: { textAlign: "center", fontSize: 12, color: "#9ca3af", marginBottom: 20 },
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16a34a",
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  verifyBtnDisabled: { backgroundColor: "#86efac" },
  verifyBtnPressed: { opacity: 0.88 },
  verifyBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  resendRow: { alignItems: "center", marginBottom: 24 },
  resendWait: { color: "#9ca3af", fontSize: 14 },
  resendBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  resendBtnText: { color: "#16a34a", fontSize: 14, fontWeight: "700" },
  progressRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 6 },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d1fae5",
  },
  progressDotActive: { backgroundColor: "#16a34a", width: 24 },
  stepText: { textAlign: "center", fontSize: 12, color: "#9ca3af" },
});

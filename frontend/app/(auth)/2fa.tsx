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


const CODE_LENGTH = 6;

export default function TwoFactorScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tempToken: string }>();
  const tempToken = params.tempToken ?? "";

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>(Array(CODE_LENGTH).fill(null));

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = cleaned;
    setCode(newCode);
    if (cleaned && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newCode.every((d) => d !== "") && cleaned) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = useCallback(async (token?: string) => {
    const enteredCode = token ?? code.join("");
    if (enteredCode.length !== CODE_LENGTH) {
      Alert.alert("Invalid Code", "Please enter your 6-digit authenticator code.");
      return;
    }
    setLoading(true);
    try {
      // 2FA not yet implemented in custom auth
      Alert.alert("2FA", "Two-factor authentication is not yet configured. Please sign in again.");
      router.replace("/(auth)/login");
    } catch (err: any) {
      Alert.alert("Verification Failed", err.message ?? "Invalid or expired code. Please try again.");
      setCode(Array(CODE_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  }, [code, tempToken]);

  const filled = code.filter((d) => d !== "").length;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {/* Back */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#16a34a" />
        </Pressable>

        {/* Icon */}
        <View style={styles.iconSection}>
          <LinearGradient colors={["#0f172a", "#134e4a"]} style={styles.shieldCircle}>
            <Feather name="shield" size={36} color="#86efac" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Two-Factor Authentication</Text>
        <Text style={styles.sub}>
          Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.)
        </Text>

        {/* Code boxes */}
        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputRefs.current[i] = r; }}
              style={[
                styles.codeBox,
                digit !== "" && styles.codeBoxFilled,
                i === filled && styles.codeBoxActive,
              ]}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <Text style={styles.expiryNote}>Code expires in 30 seconds. Open your authenticator app.</Text>

        {/* Verify button */}
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          onPress={() => handleVerify()}
          disabled={loading || filled < CODE_LENGTH}
        >
          <LinearGradient
            colors={loading || filled < CODE_LENGTH ? ["#86efac", "#6ee7b7"] : ["#16a34a", "#0f766e"]}
            style={styles.primaryBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="check-circle" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Verify & Sign In</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Feather name="info" size={14} color="#0f766e" />
          <Text style={styles.infoText}>
            Lost access to your authenticator? Contact support to disable 2FA on your account.
          </Text>
        </View>

        {/* Back to sign in */}
        <Pressable style={styles.backLink} onPress={() => router.replace("/(auth)/login")}>
          <Feather name="log-in" size={14} color="#64748b" />
          <Text style={styles.backLinkText}>Back to Sign In</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, paddingHorizontal: 24 },
  backBtn: { padding: 8, alignSelf: "flex-start", marginBottom: 24 },

  iconSection: { alignItems: "flex-start", marginBottom: 24 },
  shieldCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },

  title: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 10 },
  sub: { fontSize: 14, color: "#64748b", lineHeight: 21, marginBottom: 32 },

  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  codeBox: {
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
  codeBoxFilled: {
    borderColor: "#16a34a",
    backgroundColor: "#f0fdf4",
  },
  codeBoxActive: {
    borderColor: "#16a34a",
    borderWidth: 2.5,
  },

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

  infoBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#f0fdfa",
    borderWidth: 1,
    borderColor: "#ccfbf1",
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },
  infoText: { flex: 1, fontSize: 13, color: "#0f766e", lineHeight: 19 },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
    paddingVertical: 8,
  },
  backLinkText: { fontSize: 14, color: "#64748b" },
});

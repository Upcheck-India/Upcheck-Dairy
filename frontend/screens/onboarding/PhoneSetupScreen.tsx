import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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

import { FarmerAvatar } from "@/components/FarmerAvatar";
import { useFarmer } from "@/context/FarmerContext";

/**
 * The whole of onboarding.
 *
 * Sign-in already establishes who the user is — Google supplies name, email
 * and photo; OTP supplies the email — so the only thing left that the app
 * cannot derive is a phone number. Farm setup is not asked for here: AuthGuard
 * already sends anyone with no farms to `/farms`, which creates one.
 */
export default function PhoneSetupScreen() {
  const insets = useSafeAreaInsets();
  const { farmer, createProfile } = useFarmer();
  const [phone, setPhone] = useState(farmer?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const name = farmer?.name ?? "";
  const digits = phone.replace(/\D/g, "");
  const isValid = digits.length === 10;

  const handleContinue = async () => {
    if (!isValid) {
      Alert.alert("Check the number", "Please enter your 10-digit mobile number.");
      return;
    }
    setSaving(true);
    try {
      await createProfile({ name, phone: digits, onboardingCompleted: true });
      // AuthGuard takes it from here: no farms yet means it redirects to /farms.
      router.replace("/(tabs)" as any);
    } catch (err: any) {
      const message: string = err?.message ?? "Could not save your number.";
      Alert.alert(
        /already registered/i.test(message) ? "Number already in use" : "Could not continue",
        message
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient colors={["#0f172a", "#134e4a"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <FarmerAvatar
            uri={farmer?.avatarUrl}
            initials={farmer?.avatarInitials ?? name.slice(0, 2).toUpperCase()}
            color={farmer?.avatarColor ?? "#16a34a"}
            size={72}
            fontSize={26}
          />
          <Text style={styles.greeting}>{name ? `Welcome, ${name.split(" ")[0]}` : "Welcome"}</Text>
          {!!farmer?.email && <Text style={styles.email}>{farmer.email}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>One last thing</Text>
          <Text style={styles.cardSub}>
            Your mobile number is how buyers and your co-op reach you.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Mobile number <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="phone" size={16} color="#64748b" />
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                autoFocus
              />
              {isValid && <Feather name="check-circle" size={16} color="#16a34a" />}
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            onPress={handleContinue}
            disabled={saving || !isValid}
          >
            <LinearGradient
              colors={isValid ? ["#16a34a", "#0f766e"] : ["#94a3b8", "#94a3b8"]}
              style={styles.primaryBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Continue</Text>
              )}
            </LinearGradient>
          </Pressable>

          <Text style={styles.hint}>
            You can add your farm details any time from your profile.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, flexGrow: 1, justifyContent: "center" },

  hero: { alignItems: "center", marginBottom: 28, gap: 10 },
  greeting: { fontSize: 22, fontWeight: "800", color: "#f0fdf4" },
  email: { fontSize: 13, color: "#86efac" },

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

  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  required: { color: "#ef4444" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
  },
  prefix: { fontSize: 15, fontWeight: "600", color: "#475569" },
  input: { flex: 1, fontSize: 16, color: "#0f172a", paddingVertical: 14, letterSpacing: 1 },

  primaryBtn: { borderRadius: 14, overflow: "hidden" },
  primaryBtnGrad: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.85 },

  hint: { fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 14 },
});

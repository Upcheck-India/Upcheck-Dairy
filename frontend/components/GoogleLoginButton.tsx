import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

interface Props {
  onPress: () => void;
  loading?: boolean;
  label?: string;
}

export function GoogleLoginButton({ onPress, loading, label = "Continue with Google" }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color="#0f172a" size="small" />
      ) : (
        <>
          <MaterialCommunityIcons name="google" size={18} color="#0f172a" />
          <Text style={styles.text}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  pressed: { opacity: 0.85 },
  text: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
});

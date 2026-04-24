import { BlurView } from "expo-blur";
import { Tabs, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";

import VoiceButton from "@/components/VoiceButton";
import VoiceModal from "@/components/VoiceModal";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { useFarmer } from "@/context/FarmerContext";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

function ProfileAvatar() {
  const { farmer } = useFarmer();
  const initials = farmer?.name
    ? farmer.name.trim().split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  return (
    <Pressable
      style={styles.avatarBtn}
      onPress={() => router.push("/profile")}
      hitSlop={8}
    >
      <View style={[styles.avatarCircle, { backgroundColor: farmer?.avatarColor ?? "#16a34a" }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { t } = useLanguage();
  const [voiceVisible, setVoiceVisible] = useState(false);
  const insets = useSafeAreaInsets();
  
  const TAB_BAR_HEIGHT = isWeb ? 84 : 68 + insets.bottom;

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            elevation: 0,
            height: TAB_BAR_HEIGHT,
            paddingTop: 4,
            paddingBottom: insets.bottom,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: "Inter_500Medium",
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : isWeb ? (
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]}
              />
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t.tabAnimals,
            tabBarIcon: ({ color, focused }) => (
              <Feather name={focused ? "grid" : "grid"} size={22} color={color} />
            ),
            headerRight: () => <ProfileAvatar />,
          }}
        />
        <Tabs.Screen
          name="help"
          options={{
            title: t.tabHelp,
            tabBarIcon: ({ color }) => (
              <Feather name="alert-circle" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="voice"
          options={{
            title: "",
            tabBarIcon: () => (
              <VoiceButton onPress={() => setVoiceVisible(true)} />
            ),
            tabBarLabel: () => null,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setVoiceVisible(true);
            },
          }}
        />
        <Tabs.Screen
          name="money"
          options={{
            title: t.tabMoney,
            tabBarIcon: ({ color }) => (
              <Feather name="dollar-sign" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="today"
          options={{
            title: t.tabToday,
            tabBarIcon: ({ color }) => (
              <Feather name="calendar" size={22} color={color} />
            ),
            headerRight: () => <ProfileAvatar />,
          }}
        />
      </Tabs>
      <VoiceModal
        visible={voiceVisible}
        onClose={() => setVoiceVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  avatarBtn: { marginRight: 16 },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});

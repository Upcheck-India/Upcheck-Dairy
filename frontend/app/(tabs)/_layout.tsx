import { BlurView } from "expo-blur";
import { Tabs, router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";

import VoiceButton from "@/components/VoiceButton";
import VoiceModal from "@/components/VoiceModal";
import QuickActionsModal from "@/components/QuickActionsModal";
import { useColors } from "@/hooks/useColors";
import { TAB_BAR_CONTENT_HEIGHT } from "@/hooks/useTabBarHeight";
import { useLanguage } from "@/context/LanguageContext";
import { useFarmer } from "@/context/FarmerContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const { language, t } = useLanguage();
  const [voiceVisible, setVoiceVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case "index":
        if (language === "ta") return "முகப்பு";
        if (language === "hi") return "होम";
        if (language === "te") return "హోమ్";
        if (language === "kn") return "ಮುಖಪುಟ";
        if (language === "ml") return "ഹോം";
        return "Home";
      case "herd":
        if (language === "ta") return "மந்தை";
        if (language === "hi") return "पशु";
        if (language === "te") return "మంద";
        if (language === "kn") return "ಹಿಂಡು";
        if (language === "ml") return "പശുക്കൂട്ടം";
        return "Herd";
      case "money":
        return t.tabMoney || "Finance";
      case "profile":
        if (language === "ta") return "சுயவிவரம்";
        if (language === "hi") return "प्रोफ़ाइल";
        if (language === "te") return "ప్రొఫైల్";
        if (language === "kn") return "ಪ್ರೊಫೈಲ್";
        if (language === "ml") return "പ്രൊഫൈൽ";
        return "Profile";
      default:
        return "";
    }
  };

  // The bar is a fixed-height strip of tab content sitting on top of the OS
  // navigation inset, so anything docked to the bar must clear that inset too.
  const tabBarInset = isWeb ? 0 : insets.bottom;
  const TAB_BAR_HEIGHT = TAB_BAR_CONTENT_HEIGHT + tabBarInset;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isIOS ? "transparent" : colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            elevation: 0,
            height: TAB_BAR_HEIGHT,
            paddingTop: 8,
            paddingBottom: tabBarInset,
          },
          tabBarIconStyle: {
            marginBottom: 2,
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
            title: getTabLabel("index"),
            tabBarIcon: ({ color, focused }) => (
              <Feather name={focused ? "home" : "home"} size={22} color={color} />
            ),
            headerRight: () => <ProfileAvatar />,
          }}
        />
        <Tabs.Screen
          name="herd"
          options={{
            title: getTabLabel("herd"),
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="cow" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="voice"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="money"
          options={{
            title: getTabLabel("money"),
            tabBarIcon: ({ color }) => (
              <Feather name="dollar-sign" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: getTabLabel("profile"),
            tabBarIcon: ({ color }) => (
              <Feather name="user" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="help"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="today"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="animals"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <View
        pointerEvents="box-none"
        style={[styles.floatingActionWrap, { bottom: tabBarInset + 8 }]}
      >
        <VoiceButton onPress={() => setVoiceVisible(true)} />
      </View>
      <QuickActionsModal
        visible={voiceVisible}
        onClose={() => setVoiceVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatarBtn: { marginRight: 16 },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  floatingActionWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});

import { BlurView } from "expo-blur";
import { Tabs, router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";

import VoiceButton from "@/components/VoiceButton";
import VoiceModal from "@/components/VoiceModal";
import AddAnimalModal from "@/components/AddAnimalModal";
import InventoryModal from "@/components/InventoryModal";
import QuickActionsModal, { type QuickAction } from "@/components/QuickActionsModal";
import { HerdReportModal } from "@/src/modules/herd/components/HerdReportModal";
import { useAnimals } from "@/src/modules/animals/hooks/useAnimals";
import { useFarm } from "@/src/modules/farms/hooks/useFarm";
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
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [addAnimalVisible, setAddAnimalVisible] = useState(false);
  const [addFeedVisible, setAddFeedVisible] = useState(false);
  const [herdReportVisible, setHerdReportVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { animals } = useAnimals();
  const { activeFarm } = useFarm();

  /**
   * Destinations for the quick-actions grid. Every one of these previously did
   * nothing — the grid's handler was a haptic tap and a "perform no action"
   * comment — which left the voice modal, the AI chat and the tasks screen
   * built but unreachable.
   */
  const handleQuickAction = (action: QuickAction) => {
    switch (action) {
      case "milk-records":
        router.push({ pathname: "/animals" as any, params: { tab: "milk" } });
        break;
      case "feed-stock":
        router.push({ pathname: "/animals" as any, params: { tab: "feed" } });
        break;
      case "health-records":
        router.push({ pathname: "/animals" as any, params: { tab: "health" } });
        break;
      case "breeding-records":
        router.push({ pathname: "/animals" as any, params: { tab: "breeding" } });
        break;
      case "tasks":
        router.push("/today" as any);
        break;
      case "ask-ai":
        router.push({ pathname: "/help" as any, params: { tab: "gauguru" } });
        break;
      case "add-animal":
        setAddAnimalVisible(true);
        break;
      case "add-feed":
        setAddFeedVisible(true);
        break;
      case "herd-report":
        setHerdReportVisible(true);
        break;
      case "voice":
        setVoiceVisible(true);
        break;
    }
  };

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
        <VoiceButton onPress={() => setQuickActionsVisible(true)} />
      </View>

      <QuickActionsModal
        visible={quickActionsVisible}
        onClose={() => setQuickActionsVisible(false)}
        onSelect={handleQuickAction}
      />

      <VoiceModal visible={voiceVisible} onClose={() => setVoiceVisible(false)} />

      <AddAnimalModal
        visible={addAnimalVisible}
        onClose={() => setAddAnimalVisible(false)}
      />

      <InventoryModal
        visible={addFeedVisible}
        onClose={() => setAddFeedVisible(false)}
      />

      <HerdReportModal
        visible={herdReportVisible}
        onClose={() => setHerdReportVisible(false)}
        animals={animals}
        farmName={activeFarm?.name ?? "This farm"}
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

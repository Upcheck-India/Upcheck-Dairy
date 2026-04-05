import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import VoiceButton from "@/components/VoiceButton";
import VoiceModal from "@/components/VoiceModal";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  const [voiceVisible, setVoiceVisible] = useState(false);
  return (
    <>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: "hare", selected: "hare.fill" }} />
          <Label>என் மாடுகள்</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="help">
          <Icon sf={{ default: "cross.circle", selected: "cross.circle.fill" }} />
          <Label>உதவி</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="voice">
          <Icon sf="mic.fill" />
          <Label>குரல்</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="money">
          <Icon sf={{ default: "indianrupeesign.circle", selected: "indianrupeesign.circle.fill" }} />
          <Label>பணம்</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="today">
          <Icon sf={{ default: "calendar", selected: "calendar.badge.checkmark" }} />
          <Label>இன்று</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      <VoiceModal visible={voiceVisible} onClose={() => setVoiceVisible(false)} />
    </>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const [voiceVisible, setVoiceVisible] = useState(false);

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
            height: isWeb ? 84 : 68,
            paddingTop: 4,
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
            title: "என் மாடுகள்",
            tabBarIcon: ({ color, size }) =>
              isIOS ? (
                <SymbolView name="pawprint" tintColor={color} size={size} />
              ) : (
                <Feather name="grid" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="help"
          options={{
            title: "உதவி",
            tabBarIcon: ({ color, size }) =>
              isIOS ? (
                <SymbolView name="cross.circle" tintColor={color} size={size} />
              ) : (
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
            title: "பணம்",
            tabBarIcon: ({ color, size }) =>
              isIOS ? (
                <SymbolView
                  name="indianrupeesign.circle"
                  tintColor={color}
                  size={size}
                />
              ) : (
                <Feather name="dollar-sign" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="today"
          options={{
            title: "இன்று",
            tabBarIcon: ({ color, size }) =>
              isIOS ? (
                <SymbolView name="calendar" tintColor={color} size={size} />
              ) : (
                <Feather name="calendar" size={22} color={color} />
              ),
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

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

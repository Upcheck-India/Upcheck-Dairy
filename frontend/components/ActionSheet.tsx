import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export interface ActionSheetItem {
  key: string;
  label: string;
  /** Optional second line, for explaining what the action will do. */
  description?: string;
  icon: keyof typeof Feather.glyphMap;
  /** Accent for the icon. Ignored when `destructive` is set. */
  color?: string;
  destructive?: boolean;
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  items: ActionSheetItem[];
  onClose: () => void;
}

/**
 * A bottom sheet of actions, replacing `Alert.alert` with a button list.
 *
 * Alert is the wrong control for a menu: it cannot show icons, it caps out at
 * three buttons on iOS, it orders and styles them by platform convention rather
 * than by the app's, and a destructive item sits in the same flat list as the
 * safe ones.
 */
export function ActionSheet({ visible, title, subtitle, items, onClose }: ActionSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handlePress = (item: ActionSheetItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    // Let the sheet finish dismissing first. Presenting a native picker (the
    // camera, the photo library) while a modal is still on screen is ignored on
    // iOS, so the action has to wait for the close to land.
    setTimeout(item.onPress, 260);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />

          {title ? (
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}

          {items.map((item) => {
            const accent = item.destructive ? "#ef4444" : item.color ?? colors.primary;
            return (
              <Pressable
                key={item.key}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.muted }]}
                onPress={() => handlePress(item)}
              >
                <View style={[styles.iconBg, { backgroundColor: accent + "15" }]}>
                  <Feather name={item.icon} size={17} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.label,
                      { color: item.destructive ? "#ef4444" : colors.foreground },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.description ? (
                    <Text style={[styles.description, { color: colors.mutedForeground }]}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  titleBlock: { marginBottom: 6 },
  title: { fontSize: 16, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  iconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  description: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
});

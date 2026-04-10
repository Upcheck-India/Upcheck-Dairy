import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { Task, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const TASK_ICONS: Record<string, string> = {
  milk: "droplet",
  feed: "package",
  health: "heart",
  clean: "trash-2",
  other: "check-square",
};

interface TaskItemProps {
  task: Task;
}

export default function TaskItem({ task }: TaskItemProps) {
  const colors = useColors();
  const { toggleTaskComplete } = useApp();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.selectionAsync();
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
    toggleTaskComplete(task.id);
  };

  const iconName = TASK_ICONS[task.type] ?? "check-square";

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[
          styles.row,
          {
            backgroundColor: task.completed ? colors.secondary : colors.card,
            borderColor: task.completed ? colors.primary + "40" : colors.border,
          },
        ]}
        onPress={handlePress}
      >
        <View
          style={[
            styles.check,
            {
              backgroundColor: task.completed ? colors.primary : "transparent",
              borderColor: task.completed ? colors.primary : colors.border,
            },
          ]}
        >
          {task.completed && (
            <Feather name="check" size={14} color="#fff" />
          )}
        </View>
        <View style={styles.iconWrap}>
          <Feather
            name={iconName as any}
            size={16}
            color={task.completed ? colors.primary : colors.mutedForeground}
          />
        </View>
        <View style={styles.textArea}>
          <Text
            style={[
              styles.title,
              {
                color: task.completed
                  ? colors.mutedForeground
                  : colors.foreground,
                textDecorationLine: task.completed ? "line-through" : "none",
              },
            ]}
          >
            {task.titleTamil}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {task.time}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 28,
    alignItems: "center",
  },
  textArea: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  time: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});

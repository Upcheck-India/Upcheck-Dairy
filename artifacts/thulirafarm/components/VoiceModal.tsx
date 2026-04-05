import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface VoiceModalProps {
  visible: boolean;
  onClose: () => void;
}

const SAMPLE_COMMANDS = [
  { text: "லட்சுமி 5 லிட்டர் பால்", label: "பால் பதிவு" },
  { text: "இன்று வருமானம் எவ்வளவு?", label: "வருமானம்" },
  { text: "ராணி உடல்நிலை சரியில்லை", label: "சுகாதாரம்" },
  { text: "மாலை பணி முடிந்தது", label: "பணி முடிப்பு" },
];

const DOTS = 3;

export default function VoiceModal({ visible, onClose }: VoiceModalProps) {
  const colors = useColors();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const dotAnims = useRef(
    Array.from({ length: DOTS }, () => new Animated.Value(0))
  ).current;
  const bgScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(bgScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      bgScale.setValue(0);
      setIsListening(false);
      setTranscript("");
    }
  }, [visible]);

  const startListeningAnimation = () => {
    const animations = dotAnims.map((anim, i) =>
      Animated.sequence([
        Animated.delay(i * 150),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ),
      ])
    );
    Animated.parallel(animations).start();
  };

  const handleMicPress = () => {
    if (!isListening) {
      setIsListening(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      startListeningAnimation();
      // Simulate voice recognition
      setTimeout(() => {
        setTranscript("கேட்கிறது...");
        setTimeout(() => {
          setIsListening(false);
          setTranscript(
            "பால் பதிவு, உடல்நிலை, வருமானம் போன்ற கட்டளைகளை சொல்லவும்"
          );
          dotAnims.forEach((a) => {
            a.stopAnimation();
            a.setValue(0);
          });
        }, 2500);
      }, 500);
    } else {
      setIsListening(false);
      setTranscript("");
      dotAnims.forEach((a) => {
        a.stopAnimation();
        a.setValue(0);
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.card,
              transform: [{ scale: bgScale }],
            },
          ]}
        >
          <Pressable style={styles.closeRow} onPress={onClose}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>

          <Text style={[styles.title, { color: colors.foreground }]}>
            குரல் கட்டளை
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Tamil or English — speak naturally
          </Text>

          <Pressable
            style={[
              styles.micButton,
              {
                backgroundColor: isListening
                  ? colors.destructive
                  : colors.primary,
              },
            ]}
            onPress={handleMicPress}
          >
            <Feather
              name={isListening ? "mic-off" : "mic"}
              size={36}
              color="#fff"
            />
            {isListening && (
              <View style={styles.dotsRow}>
                {dotAnims.map((anim, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: "#fff",
                        transform: [
                          {
                            translateY: anim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -8],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </Pressable>

          {transcript ? (
            <View
              style={[
                styles.transcriptBox,
                { backgroundColor: colors.secondary },
              ]}
            >
              <Text
                style={[styles.transcriptText, { color: colors.foreground }]}
              >
                {transcript}
              </Text>
            </View>
          ) : (
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              {isListening ? "கேட்கிறேன்..." : "மேலே உள்ள பொத்தானை அழுத்தவும்"}
            </Text>
          )}

          <Text
            style={[styles.examplesTitle, { color: colors.mutedForeground }]}
          >
            உதாரண கட்டளைகள்
          </Text>
          <View style={styles.commandsGrid}>
            {SAMPLE_COMMANDS.map((cmd, i) => (
              <Pressable
                key={i}
                style={[
                  styles.commandChip,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                ]}
                onPress={() => {
                  setTranscript(cmd.text);
                  Haptics.selectionAsync();
                }}
              >
                <Text
                  style={[styles.commandLabel, { color: colors.primary }]}
                >
                  {cmd.label}
                </Text>
                <Text
                  style={[styles.commandText, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  "{cmd.text}"
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  closeRow: {
    alignSelf: "flex-end",
    padding: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 28,
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
  },
  dotsRow: {
    position: "absolute",
    bottom: 10,
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  transcriptBox: {
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 20,
  },
  transcriptText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  hint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  examplesTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  commandsGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  commandChip: {
    width: "47%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  commandLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  commandText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});

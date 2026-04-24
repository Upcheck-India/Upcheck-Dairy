import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface CelebrationOverlayProps {
  visible: boolean;
  message: string;
  messageTamil: string;
  onHide: () => void;
}

const CONFETTI_COLORS = [
  "#2E7D32",
  "#F9A825",
  "#1565C0",
  "#AD1457",
  "#00796B",
  "#E65100",
];

function ConfettiPiece({ color, delay }: { color: string; delay: number }) {
  const y = useRef(new Animated.Value(-20)).current;
  const x = useRef(new Animated.Value(Math.random() * 300 - 150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: 400,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(x, {
          toValue: Math.random() * 400 - 200,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 10,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotation = rotate.interpolate({
    inputRange: [0, 10],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: "50%",
        width: 10,
        height: 10,
        borderRadius: 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateX: x }, { translateY: y }, { rotate: rotation }],
      }}
    />
  );
}

export default function CelebrationOverlay({
  visible,
  message,
  messageTamil,
  onHide,
}: CelebrationOverlayProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 20 }).map((_, i) => (
        <ConfettiPiece
          key={i}
          color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
          delay={i * 60}
        />
      ))}
      <Animated.View
        style={[
          styles.badge,
          { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Feather name="award" size={32} color="#fff" style={{ marginBottom: 4 }} />
        <Text style={styles.tamil}>{messageTamil}</Text>
        <Text style={styles.english}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    bottom: 140,
    alignSelf: "center",
    backgroundColor: "#2E7D32",
    borderRadius: 20,
    padding: 20,
    paddingHorizontal: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    gap: 4,
  },
  tamil: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  english: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});

import { Image } from "expo-image";
import React, { useState } from "react";
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

interface Props {
  /** Provider profile picture. Null/undefined falls back to initials. */
  uri?: string | null;
  initials: string;
  /** Background for the initials fallback. */
  color: string;
  size: number;
  fontSize: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Farmer avatar: profile picture when one is available, coloured initials
 * otherwise.
 *
 * The fallback is also used when the image fails to load — a Google photo URL
 * can 404 once the user removes the picture, and without `onError` the circle
 * would render empty rather than reverting to initials.
 */
export function FarmerAvatar({
  uri,
  initials,
  color,
  size,
  fontSize,
  style,
  textStyle,
}: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = !!uri && !failed;
  const radius = size / 2;

  // The wrapper carries the shared style in both branches, so callers get the
  // same box (and the same shadow) whether a picture or initials is showing.
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: radius },
        !showImage && { backgroundColor: color },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
          contentFit="cover"
          transition={150}
          onError={() => setFailed(true)}
          accessibilityLabel="Profile picture"
        />
      ) : (
        <Text style={[styles.initials, { fontSize }, textStyle]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  initials: { color: "#fff", fontWeight: "700" },
});

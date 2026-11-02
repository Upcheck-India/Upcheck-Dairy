import { Stack } from "expo-router";

/**
 * Terms and Privacy are separate documents on separate routes. Grouping them
 * under their own stack keeps `legal` as a single entry in the root navigator,
 * which is what the public-utility check in app/_layout.tsx matches on.
 */
export default function LegalLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Height of the tab bar's content strip — the icons and labels — measured
 * above any OS navigation inset.
 */
export const TAB_BAR_CONTENT_HEIGHT = Platform.OS === "web" ? 84 : 68;

/**
 * Total height the tab bar occupies, including the OS navigation inset it
 * sits on (the gesture pill on iOS, the button bar on Android).
 *
 * Screens inside `(tabs)` should pad the bottom of their scroll content by at
 * least this much, otherwise the last row scrolls underneath the bar and can
 * never be reached. Anything docked to the bar (the centre action button, a
 * FAB) must offset from the inset for the same reason.
 */
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  const inset = Platform.OS === "web" ? 0 : insets.bottom;
  return TAB_BAR_CONTENT_HEIGHT + inset;
}

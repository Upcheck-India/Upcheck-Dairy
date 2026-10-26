import Constants from "expo-constants";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";

import { useFarmer } from "@/context/FarmerContext";
import { googleLogin } from "@/services/api";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const webClientId = extra.googleClientIdWeb || undefined;
const iosClientId = extra.googleClientIdIos || undefined;

/**
 * Google Sign-In is only wired up when the client ID *this* platform needs is
 * present, so a build without credentials degrades to "button hidden" rather
 * than failing at the tap.
 *
 * Note which ID matters where: Android signs in with the **web** client ID —
 * the Android client ID is never passed in code, it only has to exist in the
 * Google console against the package name and signing SHA-1. iOS uses its own.
 */
const hasClientIds = Platform.OS === "ios" ? !!iosClientId : !!webClientId;

/**
 * The native module is absent in Expo Go and on web, where requiring it throws.
 * Resolve it lazily and treat failure as "Google sign-in unavailable".
 */
type GoogleSigninModule = typeof import("@react-native-google-signin/google-signin");

let googleSignin: GoogleSigninModule | null = null;
let configured = false;

function loadGoogleSignin(): GoogleSigninModule | null {
  if (googleSignin) return googleSignin;
  if (Platform.OS === "web") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    googleSignin = require("@react-native-google-signin/google-signin") as GoogleSigninModule;
  } catch {
    return null;
  }
  if (!configured && hasClientIds) {
    googleSignin.GoogleSignin.configure({ webClientId, iosClientId });
    configured = true;
  }
  return googleSignin;
}

export function useGoogleAuth() {
  const { loginWithJwt } = useFarmer();
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = useCallback(async () => {
    const mod = loadGoogleSignin();
    if (!hasClientIds || !mod) {
      Alert.alert(
        "Google Sign-In unavailable",
        "This build is not configured for Google Sign-In. Use your email and password instead."
      );
      return;
    }

    const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = mod;

    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        // The user dismissed the account picker — not an error worth surfacing.
        return;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        Alert.alert("Sign In Failed", "Google did not return an ID token. Please try again.");
        return;
      }

      const result = await googleLogin(idToken);

      if (result.requires2fa && result.tempToken) {
        router.push({ pathname: "/(auth)/2fa", params: { tempToken: result.tempToken } });
        return;
      }

      await loginWithJwt(result);
    } catch (err: any) {
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.SIGN_IN_CANCELLED || err.code === statusCodes.IN_PROGRESS) {
          return;
        }
        if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert("Sign In Failed", "Google Play Services is not available or needs an update.");
          return;
        }
      }
      Alert.alert("Sign In Failed", err?.message ?? "Google sign in failed.");
    } finally {
      setLoading(false);
    }
  }, [loginWithJwt]);

  return { signInWithGoogle, loading, isAvailable: hasClientIds && Platform.OS !== "web" };
}

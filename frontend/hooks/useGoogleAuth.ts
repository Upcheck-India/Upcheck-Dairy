import Constants from "expo-constants";
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

/** A sign-in that found no account, and the token needed to create one. */
export interface PendingSignup {
  idToken: string;
  email: string | null;
}

/**
 * @param intent which screen the button is on. "signin" refuses to create an
 * account, so the sign-in screen can offer sign-up instead of silently
 * provisioning an empty farmer for an unrecognised address.
 */
export function useGoogleAuth(intent: "signin" | "signup") {
  const { loginWithJwt } = useFarmer();
  const [loading, setLoading] = useState(false);
  const [pendingSignup, setPendingSignup] = useState<PendingSignup | null>(null);

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

    setPendingSignup(null);
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Drop any cached Google session first, otherwise signIn() silently
      // reuses the last account and the picker never appears — so a user with
      // several Google accounts can never switch, and anyone who signed out of
      // Upcheck gets put straight back into the same account.
      //
      // This only clears the local session; app authorisation is untouched, so
      // it costs a tap rather than a fresh consent screen. revokeAccess()
      // would force re-consent, which is not what we want here.
      await GoogleSignin.signOut().catch(() => {
        /* nothing cached — carry on to the picker */
      });

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

      try {
        const result = await googleLogin(idToken, intent);
        await loginWithJwt(result);
      } catch (err: any) {
        // Signing in with a Google account that has no farmer yet. Rather than
        // dead-ending, hand the screen everything it needs to offer sign-up —
        // including the token we already hold, so accepting does not mean
        // picking the Google account a second time.
        if (intent === "signin" && err?.status === 404) {
          setPendingSignup({
            idToken,
            email: response.data.user?.email ?? null,
          });
          return;
        }
        throw err;
      }
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
  }, [loginWithJwt, intent]);

  /** Accept the offer: create the account with the token already obtained. */
  const createAccountFromPending = useCallback(async () => {
    if (!pendingSignup) return;
    setLoading(true);
    try {
      const created = await googleLogin(pendingSignup.idToken, "signup");
      setPendingSignup(null);
      await loginWithJwt(created);
    } catch (err: any) {
      // Google ID tokens are short-lived, so an offer left on screen can
      // expire. Clear it and send them back through the picker.
      setPendingSignup(null);
      Alert.alert(
        "Could not create account",
        err?.message ?? "Please tap Continue with Google again."
      );
    } finally {
      setLoading(false);
    }
  }, [pendingSignup, loginWithJwt]);

  return {
    signInWithGoogle,
    loading,
    isAvailable: hasClientIds && Platform.OS !== "web",
    /** Non-null when sign-in found no account for the chosen Google address. */
    pendingSignup,
    createAccountFromPending,
    dismissPendingSignup: useCallback(() => setPendingSignup(null), []),
  };
}

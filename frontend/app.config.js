/**
 * Overlay on top of app.json.
 *
 * app.json stays the source of truth for the static config; this file exists
 * only to inject values that have to come from the environment at build time.
 * Expo passes the parsed app.json in as `config`.
 *
 * The Google OAuth client IDs are public identifiers (they ship inside the
 * app binary either way), but they differ per environment, so they are read
 * from EXPO_PUBLIC_* rather than committed. With none of them set, the
 * Google button hides itself — see hooks/useGoogleAuth.ts.
 */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    googleClientIdWeb: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || "",
    googleClientIdIos: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || "",
    googleClientIdAndroid: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || "",
  },
});

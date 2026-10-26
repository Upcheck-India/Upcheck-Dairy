import React from "react";
import { Image, ImageProps, ImageStyle, StyleProp } from "react-native";

import { tokenStore } from "../src/core/auth/TokenStore";

const apiBase = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";
const apiOrigin = apiBase.replace(/\/api$/, "");

interface Props extends Omit<ImageProps, "source" | "style"> {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
}

/**
 * An <Image> that authenticates against our own API.
 *
 * Uploads are no longer public files — GET /api/files/:filename requires a
 * token and checks ownership — so the request needs an Authorization header.
 * Only URLs pointing at our API get one; anything external (a Google avatar,
 * say) is fetched plainly, so a token is never sent to a third-party host.
 *
 * The header is read at render time rather than captured, so a token refreshed
 * in the background is picked up on the next render.
 */
export function AuthedImage({ uri, style, ...rest }: Props) {
  if (!uri) return null;

  const isOurApi = uri.startsWith(apiOrigin);
  const token = isOurApi ? tokenStore.getAccessToken() : null;

  return (
    <Image
      {...rest}
      style={style}
      source={
        token
          ? { uri, headers: { Authorization: `Bearer ${token}` } }
          : { uri }
      }
    />
  );
}

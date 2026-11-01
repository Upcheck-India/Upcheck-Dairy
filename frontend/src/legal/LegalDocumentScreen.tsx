import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLanguage } from "@/context/LanguageContext";
import { LEGAL_META, LEGAL_UI, pick, type LegalDocument } from "./content";

/**
 * Renders one legal document as a scrollable page.
 *
 * The copy lives in content.ts and is mirrored to docs/legal/*.md for public
 * hosting. Terms and Privacy are separate routes, so this takes a whole
 * document and renders it — there is no document switcher.
 */
export function LegalDocumentScreen({ document }: { document: LegalDocument }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language } = useLanguage();

  const title = pick(document.title, language);

  const handleContactLegal = () => {
    Linking.openURL(
      `mailto:${LEGAL_META.legalEmail}?subject=${encodeURIComponent(
        `${title} — ${LEGAL_META.appName}`
      )}`
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather name="arrow-left" size={24} color="#0f172a" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>
            {pick(LEGAL_UI.effectiveLabel, language)}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          // Floor the inset: on Android it can report 0 while the system
          // nav bar still overlays the window, which left the last block
          // clipped behind it.
          { paddingBottom: Math.max(insets.bottom, 24) + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* The clause bodies are English only, so this summary is the whole
            document for a farmer who does not read it. Keep it translated. */}
        <View style={styles.highlightCard}>
          <Feather name="check-circle" size={20} color="#16a34a" />
          <View style={styles.highlightTextWrap}>
            <Text style={styles.highlightTitle}>
              {pick(document.highlight.title, language)}
            </Text>
            <Text style={styles.highlightBody}>
              {pick(document.highlight.body, language)}
            </Text>
          </View>
        </View>

        <View style={styles.document}>
          {document.blocks.map((block, i) => (
            <View key={i} style={styles.block}>
              {block.heading ? (
                <Text style={styles.blockHeading}>{block.heading}</Text>
              ) : null}
              <Text style={styles.blockBody}>{block.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerContactCard}>
          <Feather name="mail" size={20} color="#16a34a" />
          <View style={styles.footerContactText}>
            <Text style={styles.footerTitle}>
              {pick(LEGAL_UI.contactTitle, language)}
            </Text>
            <Text style={styles.footerSub}>{LEGAL_META.legalEmail}</Text>
          </View>
          <Pressable
            style={styles.contactBtn}
            onPress={handleContactLegal}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.contactBtnText}>
              {pick(LEGAL_UI.contactAction, language)}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  highlightCard: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    padding: 14,
    borderRadius: 14,
    gap: 12,
    alignItems: "flex-start",
  },
  highlightTextWrap: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 4,
  },
  highlightBody: {
    fontSize: 13,
    color: "#15803d",
    lineHeight: 19,
  },
  document: {
    marginTop: 24,
  },
  block: {
    marginBottom: 22,
  },
  blockHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  blockBody: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
  },
  footerContactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
    marginTop: 8,
  },
  footerContactText: {
    flex: 1,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  footerSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  contactBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16a34a",
  },
});

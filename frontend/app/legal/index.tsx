import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useLanguage } from "@/context/LanguageContext";

type LegalTab = "terms" | "privacy" | "disclaimer" | "licenses";

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { language } = useLanguage();

  const initialTab: LegalTab =
    params.tab === "privacy"
      ? "privacy"
      : params.tab === "disclaimer"
      ? "disclaimer"
      : params.tab === "licenses"
      ? "licenses"
      : "terms";

  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  const handleTabChange = (tab: LegalTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: "Upcheck Dairy - Legal & Privacy Policies",
        message:
          "Upcheck Dairy legal terms, privacy policy, and agricultural data ownership guidelines: https://upcheckdairy.com/legal",
      });
    } catch {
      // User cancelled or share dismissed
    }
  };

  const handleContactLegal = () => {
    Linking.openURL("mailto:legal@upcheckdairy.com?subject=Legal%20Query%20-%20Upcheck%20Dairy");
  };

  const isTa = language === "ta";
  const isHi = language === "hi";

  return (
    <View style={styles.container}>
      {/* Header Bar */}
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
          <Text style={styles.headerTitle}>
            {isTa ? "சட்ட தகவல் & தனியுரிமை" : isHi ? "कानूनी और गोपनीयता" : "Legal & Compliance"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isTa ? "விவசாயி தரவு உரிமை & விதிமுறைகள்" : isHi ? "किसान डेटा स्वामित्व और शर्तें" : "Farmer Data Rights & Policies"}
          </Text>
        </View>

        <Pressable
          style={styles.actionButton}
          onPress={handleShare}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Share policy"
        >
          <Feather name="share-2" size={20} color="#16a34a" />
        </Pressable>
      </View>

      {/* Segmented Tab Bar */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          <Pressable
            style={[styles.tabItem, activeTab === "terms" && styles.tabItemActive]}
            onPress={() => handleTabChange("terms")}
          >
            <Feather
              name="file-text"
              size={15}
              color={activeTab === "terms" ? "#16a34a" : "#64748b"}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === "terms" && styles.tabLabelActive,
              ]}
            >
              {isTa ? "விதிமுறைகள்" : isHi ? "नियम व शर्तें" : "Terms of Service"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabItem, activeTab === "privacy" && styles.tabItemActive]}
            onPress={() => handleTabChange("privacy")}
          >
            <Feather
              name="shield"
              size={15}
              color={activeTab === "privacy" ? "#16a34a" : "#64748b"}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === "privacy" && styles.tabLabelActive,
              ]}
            >
              {isTa ? "தனியுரிமை" : isHi ? "गोपनीयता नीति" : "Privacy Policy"}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabItem,
              activeTab === "disclaimer" && styles.tabItemActive,
            ]}
            onPress={() => handleTabChange("disclaimer")}
          >
            <Feather
              name="alert-circle"
              size={15}
              color={activeTab === "disclaimer" ? "#16a34a" : "#64748b"}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === "disclaimer" && styles.tabLabelActive,
              ]}
            >
              {isTa ? "மருத்துவ எச்சரிக்கை" : isHi ? "पशु चिकित्सा अस्वीकरण" : "AI & Vet Disclaimer"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabItem, activeTab === "licenses" && styles.tabItemActive]}
            onPress={() => handleTabChange("licenses")}
          >
            <Feather
              name="code"
              size={15}
              color={activeTab === "licenses" ? "#16a34a" : "#64748b"}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === "licenses" && styles.tabLabelActive,
              ]}
            >
              {isTa ? "உரிமங்கள்" : isHi ? "लाइसेंस" : "Licenses"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Version & Date Card */}
        <View style={styles.metaBadgeCard}>
          <View style={styles.badgeRow}>
            <View style={styles.statusDot} />
            <Text style={styles.versionText}>Version 1.0.0 (Build 2026.09)</Text>
          </View>
          <Text style={styles.dateText}>
            {isTa
              ? "கடைசியாக புதுப்பிக்கப்பட்டது: செப்டம்பர் 2026"
              : isHi
              ? "अंतिम अद्यतन: सितंबर 2026"
              : "Effective Date: September 2026"}
          </Text>
        </View>

        {/* TAB 1: TERMS OF SERVICE */}
        {activeTab === "terms" && (
          <View style={styles.sectionContainer}>
            <View style={styles.policyHighlightCard}>
              <Feather name="check-circle" size={20} color="#16a34a" />
              <View style={styles.highlightTextWrap}>
                <Text style={styles.highlightTitle}>
                  {isTa ? "விவசாயி உரிமை முன்னுரிமை" : isHi ? "किसान डेटा स्वामित्व" : "Farmer First Data Pledge"}
                </Text>
                <Text style={styles.highlightBody}>
                  {isTa
                    ? "உங்கள் பண்ணையின் அனைத்து பதிவுகளும் (பால், மாடுகள், செலவுகள்) முற்றிலும் உங்களுக்கே சொந்தமானது."
                    : isHi
                    ? "आपके डेयरी फार्म के सभी रिकॉर्ड (दूध, पशु, खर्च) पूरी तरह से आपकी संपत्ति हैं।"
                    : "You retain 100% full legal ownership of your milk records, animal genealogies, health logs, and financial ledgers."}
                </Text>
              </View>
            </View>

            <View style={styles.clauseCard}>
              <Text style={styles.clauseHeading}>1. Acceptance of Terms</Text>
              <Text style={styles.clauseText}>
                By creating an account, accessing, or using the Upcheck Dairy platform (including the mobile application, web portal, and backend sync services), you agree to be legally bound by these Terms of Service. If you do not agree to these terms, please discontinue using the application.
              </Text>
            </View>

            <View style={styles.clauseCard}>
              <Text style={styles.clauseHeading}>2. Farmer Account & Data Integrity</Text>
              <Text style={styles.clauseText}>
                Farmers and operators are responsible for ensuring that ear tag IDs, animal treatments, and milk quantity entries recorded in the app accurately reflect their farm operations. You agree to safeguard your phone number and authentication credentials.
              </Text>
            </View>

            <View style={styles.clauseCard}>
              <Text style={styles.clauseHeading}>3. Offline Operation & Data Synchronization</Text>
              <Text style={styles.clauseText}>
                Upcheck Dairy is architected to support offline recording in areas with intermittent connectivity. Records logged offline are stored on your local device storage and automatically queued for synchronization once an internet connection is re-established. Upcheck Technologies is not liable for data loss caused by local device corruption, forced app uninstalls, or operating system resets prior to cloud sync.
              </Text>
            </View>

            <View style={styles.clauseCard}>
              <Text style={styles.clauseHeading}>4. Commercial & Milk Payout Calculations</Text>
              <Text style={styles.clauseText}>
                The milk payout calculations and fat/SNF estimations provided in the financial and milk modules are based on standard cooperative charts (e.g. NDDB models). Final payouts, sample testing deductions, and payments remain subject to verification by your respective dairy cooperative or milk procurement center.
              </Text>
            </View>

            <View style={styles.clauseCard}>
              <Text style={styles.clauseHeading}>5. Account Deletion & Right to Export</Text>
              <Text style={styles.clauseText}>
                You retain the right at any time to export your livestock registry, production timeline, and financial ledgers. You may also request permanent account deletion and purge of all farm data by emailing support@upcheckdairy.com or via the Profile settings.
              </Text>
            </View>
          </View>
        )}

        {/* TAB 2: PRIVACY POLICY */}
        {activeTab === "privacy" && (
          <View style={styles.sectionContainer}>
            <View style={styles.policyHighlightCard}>
              <Feather name="lock" size={20} color="#16a34a" />
              <View style={styles.highlightTextWrap}>
                <Text style={styles.highlightTitle}>
                  {isTa ? "பாதுகாப்பான தரவு முறை" : isHi ? "गोपनीयता सुरक्षा" : "Zero Ad-Tracking Guarantee"}
                </Text>
                <Text style={styles.highlightBody}>
                  {isTa
                    ? "நாங்கள் உங்கள் தரவை விளம்பர நிறுவனங்களுக்கு விற்க மாட்டோம். உங்கள் தகவல்கள் குறியாக்கம் செய்யப்பட்டுள்ளன."
                    : isHi
                    ? "हम आपका डेटा कभी भी विज्ञापनदाताओं को नहीं बेचते। आपकी जानकारी सुरक्षित और एन्क्रिप्टेड है।"
                    : "We never monetize, broker, or sell your milk pricing, cattle counts, or contact information to third-party ad networks."}
                </Text>
              </View>
            </View>

            <View style={styles.clauseCard}>
              <Text style={styles.clauseHeading}>1. Information We Collect</Text>
              <Text style={styles.clauseText}>
                • <Text style={styles.boldText}>Farmer Identity:</Text> Name, mobile phone number, email (optional), village, district, state.{"\n"}
                • <Text style={styles.boldText}>Livestock Telemetry:</Text> Animal ear tag number, breed, lactation cycle, birth date, body condition score, vaccination schedules.{"\n"}
                • <Text style={styles.boldText}>Production Logs:</Text> Morning and evening milk volume (liters), fat %, SNF %, and pricing.{"\n"}
                • <Text style={styles.boldText}>Voice Audio:</Text> Audio recorded during voice commands is transmitted securely to transcription endpoints solely to transcribe your farm logs into text and is not stored permanently.
              </Text>
            </View>

            <View style={styles.clauseCard}>
              <Text style={styles.clauseHeading}>2. Device Permissions Used</Text>
              <Text style={styles.clauseText}>
                • <Text style={styles.boldText}>Camera:</Text> Used to capture animal photos, scan ear tag barcodes, and photograph feed/medicine receipts.{"\n"}
                • <Text style={styles.boldText}>Microphone:</Text> Used for hands-free voice logging and GauGuru AI voice assistant.{"\n"}
                • <Text style={styles.boldText}>Location:</Text> Used to provide localized weather forecasts, rainfall predictions, and relevant regional disease warnings.{"\n"}
                • <Text style={styles.boldText}>Notifications:</Text> Used for critical veterinary vaccination booster alerts, heat cycle alarms, and daily milking reminders.
              </Text>
            </View>

            <View style={styles.clauseCard}>
              <Text style={styles.clauseHeading}>3. Storage & Encryption</Text>
              <Text style={styles.clauseText}>
                All communication between the mobile client and the Upcheck Dairy cloud infrastructure is encrypted using Transport Layer Security (TLS 1.3). Tokens and sensitive session keys are stored on-device using secure hardware-backed storage (Expo SecureStore).
              </Text>
            </View>

            <View style={styles.clauseCard}>
              <Text style={styles.clauseHeading}>4. Data Sharing & Third Parties</Text>
              <Text style={styles.clauseText}>
                Data is only processed through trusted infrastructure providers (cloud database hosting and AI transcription models). We do not share individual farm yields or financial ledgers with government authorities, corporations, or competitors without explicit farmer consent.
              </Text>
            </View>
          </View>
        )}

        {/* TAB 3: AI & VETERINARY DISCLAIMER */}
        {activeTab === "disclaimer" && (
          <View style={styles.sectionContainer}>
            <View style={[styles.policyHighlightCard, { backgroundColor: "#fff7ed", borderColor: "#fed7aa" }]}>
              <Feather name="alert-triangle" size={20} color="#ea580c" />
              <View style={styles.highlightTextWrap}>
                <Text style={[styles.highlightTitle, { color: "#c2410c" }]}>
                  {isTa ? "முக்கிய மருத்துவ அறிவிப்பு" : isHi ? "महत्वपूर्ण पशु चिकित्सा सूचना" : "Critical Advisory Notice"}
                </Text>
                <Text style={[styles.highlightBody, { color: "#9a3412" }]}>
                  {isTa
                    ? "கௌகுரு AI தகவல் நோக்கங்களுக்காக மட்டுமே. அவசர சிகிச்சைக்கு பதிவுசெய்யப்பட்ட கால்நடை மருத்துவரை அணுகவும்."
                    : isHi
                    ? "गौगुरु एआई केवल सूचनात्मक सलाह प्रदान करता है। गंभीर स्थिति में तुरंत पंजीकृत पशु चिकित्सक से संपर्क करें।"
                    : "GauGuru AI and health symptom checkers are assistive digital tools, not a certified veterinary medical diagnosis."}
                </Text>
              </View>
            </View>

            <View style={styles.clauseCard}>
              <Text style={styles.clauseHeading}>1. Not a Substitute for Veterinary Examination</Text>
              <Text style={styles.clauseText}>
                All algorithmic health assessments, symptom analyses, and automated treatment suggestions provided through the GauGuru module are generated by artificial intelligence models based on standard dairy veterinary literature. They are designed to assist farmers in noticing early warning signs and cannot replace a physical examination, laboratory blood test, or ultrasound performed by a licensed veterinary practitioner.
              </Text>
            </View>

            <View style={styles.clauseCard}>
              <Text style={styles.clauseHeading}>2. Medicine & Withdrawal Period Precautions</Text>
              <Text style={styles.clauseText}>
                Prescription medications, antibiotic dosages, and vaccine schedules must follow the instructions of your attending veterinary officer and the drug manufacturer's label. Always adhere to mandatory milk and meat withdrawal periods after administering antimicrobial treatments to avoid milk contamination.
              </Text>
            </View>

            <View style={styles.clauseCard}>
              <Text style={styles.clauseHeading}>3. Emergency Protocols</Text>
              <Text style={styles.clauseText}>
                In life-threatening situations — such as acute bloat, milk fever (hypocalcemia), severe dystocia (difficult calving), prolapse, or high-fever outbreaks — immediately utilize the Emergency SOS feature located on the Help screen to dispatch your local veterinarian.
              </Text>
            </View>
          </View>
        )}

        {/* TAB 4: LICENSES & CREDITS */}
        {activeTab === "licenses" && (
          <View style={styles.sectionContainer}>
            <View style={styles.policyHighlightCard}>
              <Feather name="award" size={20} color="#16a34a" />
              <View style={styles.highlightTextWrap}>
                <Text style={styles.highlightTitle}>Open Source Attributions</Text>
                <Text style={styles.highlightBody}>
                  Upcheck Dairy is proud to be built on industry-leading open-source software libraries.
                </Text>
              </View>
            </View>

            <View style={styles.clauseCard}>
              <Text style={styles.clauseHeading}>Upcheck Dairy Platform</Text>
              <Text style={styles.clauseText}>
                Copyright © 2026 Upcheck Technologies. All rights reserved. Designed and developed with care for modern dairy farming communities.
              </Text>
            </View>

            <View style={styles.clauseCard}>
              <Text style={styles.clauseHeading}>Core Dependencies</Text>
              <Text style={styles.clauseText}>
                • <Text style={styles.boldText}>React Native & React:</Text> MIT License (Meta Platforms, Inc.){"\n"}
                • <Text style={styles.boldText}>Expo Application Framework:</Text> MIT License (650 Industries, Inc.){"\n"}
                • <Text style={styles.boldText}>Feather Icons:</Text> MIT License (Cole Bemis){"\n"}
                • <Text style={styles.boldText}>TanStack Query:</Text> MIT License (Tanner Linsley){"\n"}
                • <Text style={styles.boldText}>Drizzle ORM:</Text> Apache 2.0 License{"\n"}
                • <Text style={styles.boldText}>Inter Font Family:</Text> SIL Open Font License 1.1 (Rasmus Andersson)
              </Text>
            </View>
          </View>
        )}

        {/* Footer Help & Support Card */}
        <View style={styles.footerContactCard}>
          <Feather name="mail" size={20} color="#16a34a" />
          <View style={styles.footerContactText}>
            <Text style={styles.footerTitle}>
              {isTa ? "சட்டக் கேள்விகள் உள்ளதா?" : isHi ? "कोई कानूनी प्रश्न है?" : "Questions about our policies?"}
            </Text>
            <Text style={styles.footerSub}>
              Reach our legal & compliance team at legal@upcheckdairy.com
            </Text>
          </View>
          <Pressable
            style={styles.contactBtn}
            onPress={handleContactLegal}
            hitSlop={8}
          >
            <Text style={styles.contactBtnText}>Contact</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  tabBarWrapper: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tabBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: "#dcfce7",
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  tabLabelActive: {
    color: "#15803d",
    fontWeight: "700",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  metaBadgeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16a34a",
  },
  versionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  dateText: {
    fontSize: 11,
    color: "#64748b",
  },
  sectionContainer: {
    gap: 12,
  },
  policyHighlightCard: {
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
    lineHeight: 18,
  },
  clauseCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  clauseHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  clauseText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "700",
    color: "#1e293b",
  },
  footerContactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
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

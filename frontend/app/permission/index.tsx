import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useLanguage } from "@/context/LanguageContext";

// Helper: lazily resolve expo-av Audio to avoid eager native-module crash
// in Expo Go (expo-av is deprecated in SDK 54 but still functional).
async function getAudioPermissions() {
  try {
    const { Audio } = require("expo-av");
    return await Audio.getPermissionsAsync();
  } catch {
    return { granted: false, status: "undetermined" as const, canAskAgain: true };
  }
}
async function requestAudioPermissions() {
  try {
    const { Audio } = require("expo-av");
    return await Audio.requestPermissionsAsync();
  } catch {
    return { granted: false, status: "denied" as const, canAskAgain: false };
  }
}

type PermissionStatus = "granted" | "denied" | "undetermined" | "checking";

interface PermissionItem {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  titleEn: string;
  titleTa: string;
  titleHi: string;
  subtitleEn: string;
  subtitleTa: string;
  subtitleHi: string;
  purposeEn: string;
  purposeTa: string;
  purposeHi: string;
  status: PermissionStatus;
  canAskAgain: boolean;
  onRequest: () => Promise<void>;
}

export default function PermissionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language } = useLanguage();

  const isTa = language === "ta";
  const isHi = language === "hi";

  const [cameraStatus, setCameraStatus] = useState<PermissionStatus>("checking");
  const [cameraCanAsk, setCameraCanAsk] = useState(true);

  const [micStatus, setMicStatus] = useState<PermissionStatus>("checking");
  const [micCanAsk, setMicCanAsk] = useState(true);

  const [locationStatus, setLocationStatus] = useState<PermissionStatus>("checking");
  const [locationCanAsk, setLocationCanAsk] = useState(true);

  const [notifStatus, setNotifStatus] = useState<PermissionStatus>("checking");
  const [notifCanAsk, setNotifCanAsk] = useState(true);

  const [photosStatus, setPhotosStatus] = useState<PermissionStatus>("checking");
  const [photosCanAsk, setPhotosCanAsk] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check all permissions
  const checkAllPermissions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Camera (via ImagePicker — same OS-level permission, no native camera module needed)
      try {
        const cam = await ImagePicker.getCameraPermissionsAsync();
        setCameraStatus(cam.granted ? "granted" : cam.status === "denied" ? "denied" : "undetermined");
        setCameraCanAsk(cam.canAskAgain);
      } catch {
        setCameraStatus("undetermined");
      }

      // 2. Microphone (lazy-loaded expo-av to avoid eager native crash)
      try {
        const mic = await getAudioPermissions();
        setMicStatus(mic.granted ? "granted" : mic.status === "denied" ? "denied" : "undetermined");
        setMicCanAsk(mic.canAskAgain ?? true);
      } catch {
        setMicStatus("undetermined");
      }

      // 3. Location
      try {
        const loc = await Location.getForegroundPermissionsAsync();
        setLocationStatus(loc.granted ? "granted" : loc.status === "denied" ? "denied" : "undetermined");
        setLocationCanAsk(loc.canAskAgain);
      } catch {
        setLocationStatus("undetermined");
      }

      // 4. Notifications
      try {
        const notif = await Notifications.getPermissionsAsync();
        setNotifStatus(notif.granted ? "granted" : notif.status === "denied" ? "denied" : "undetermined");
        setNotifCanAsk(notif.canAskAgain);
      } catch {
        setNotifStatus("undetermined");
      }

      // 5. Media Library / Photos
      try {
        const photo = await ImagePicker.getMediaLibraryPermissionsAsync();
        setPhotosStatus(photo.granted ? "granted" : photo.status === "denied" ? "denied" : "undetermined");
        setPhotosCanAsk(photo.canAskAgain);
      } catch {
        setPhotosStatus("undetermined");
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions]);

  // Request handlers
  const requestCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (cameraStatus === "denied" && !cameraCanAsk) {
      Linking.openSettings();
      return;
    }
    const res = await ImagePicker.requestCameraPermissionsAsync();
    setCameraStatus(res.granted ? "granted" : "denied");
    setCameraCanAsk(res.canAskAgain);
  };

  const requestMic = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (micStatus === "denied" && !micCanAsk) {
      Linking.openSettings();
      return;
    }
    const res = await requestAudioPermissions();
    setMicStatus(res.granted ? "granted" : "denied");
    setMicCanAsk(res.canAskAgain ?? false);
  };

  const requestLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (locationStatus === "denied" && !locationCanAsk) {
      Linking.openSettings();
      return;
    }
    const res = await Location.requestForegroundPermissionsAsync();
    setLocationStatus(res.granted ? "granted" : "denied");
    setLocationCanAsk(res.canAskAgain);
  };

  const requestNotifications = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (notifStatus === "denied" && !notifCanAsk) {
      Linking.openSettings();
      return;
    }
    const res = await Notifications.requestPermissionsAsync();
    setNotifStatus(res.granted ? "granted" : "denied");
    setNotifCanAsk(res.canAskAgain);
  };

  const requestPhotos = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (photosStatus === "denied" && !photosCanAsk) {
      Linking.openSettings();
      return;
    }
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setPhotosStatus(res.granted ? "granted" : "denied");
    setPhotosCanAsk(res.canAskAgain);
  };

  const permissionsList: PermissionItem[] = [
    {
      id: "camera",
      icon: "camera",
      titleEn: "Camera Access",
      titleTa: "கேமரா அணுகல்",
      titleHi: "कैमरा एक्सेस",
      subtitleEn: "Ear tag scanning & cow photography",
      subtitleTa: "காது குறி ஸ்கேனிங் & மாடு புகைப்படம்",
      subtitleHi: "ईयर टैग स्कैनिंग और गाय की तस्वीरें",
      purposeEn: "Enables instant barcode/ear-tag scanning in sheds, animal identification, and photo logging of medicine/feed invoices.",
      purposeTa: "மந்தையில் காது குறி ஸ்கேன் செய்யவும், விலங்குகளை அடையாளம் காணவும் மற்றும் ரசீதுகளைப் படம்பிடிக்கவும் உதவுகிறது.",
      purposeHi: "पशुओं के ईयर टैग स्कैन करने, उनकी पहचान दर्ज करने और दवा बिलों की फोटो लेने के लिए आवश्यक है।",
      status: cameraStatus,
      canAskAgain: cameraCanAsk,
      onRequest: requestCamera,
    },
    {
      id: "mic",
      icon: "mic",
      titleEn: "Microphone & Voice",
      titleTa: "மைக்ரோஃபோன் & குரல்",
      titleHi: "माइक्रोफ़ोन और आवाज़",
      subtitleEn: "GauGuru voice commands & fast logging",
      subtitleTa: "கௌகுரு குரல் கட்டளைகள் & விரைவு பதிவு",
      subtitleHi: "गौगुरु वॉइस कमांड और त्वरित रिकॉर्डिंग",
      purposeEn: "Allows hands-free voice logging of morning/evening milk liters and asking GauGuru AI livestock health questions.",
      purposeTa: "பால் அளவை கைகளால் தட்டச்சு செய்யாமல் குரல் மூலம் எளிதாக பதிவு செய்ய உதவுகிறது.",
      purposeHi: "बिना हाथ लगाए बोलकर दूध का उत्पादन दर्ज करने और गौगुरु एआई से पशु स्वास्थ्य सलाह लेने के लिए।",
      status: micStatus,
      canAskAgain: micCanAsk,
      onRequest: requestMic,
    },
    {
      id: "location",
      icon: "map-pin",
      titleEn: "Location Services",
      titleTa: "இருப்பிடச் சேவை",
      titleHi: "लोकेशन सेवाएं",
      subtitleEn: "Local weather & regional disease alerts",
      subtitleTa: "உள்ளூர் வானிலை & நோய் எச்சரிக்கைகள்",
      subtitleHi: "स्थानीय मौसम और क्षेत्रीय बीमारी अलर्ट",
      purposeEn: "Provides accurate local rainfall forecasts for harvesting fodder and alerts you about nearby veterinary emergencies or FMD outbreaks.",
      purposeTa: "தீவன அறுவடைக்கு துல்லியமான மழை முன்னறிவிப்பு மற்றும் அருகிலுள்ள நோய் பரவல் எச்சரிக்கைகளை வழங்குகிறது.",
      purposeHi: "चारे की कटाई के लिए स्थानीय मौसम और नजदीकी क्षेत्रों में बीमारी फैलने की पूर्व चेतावनी देने के लिए।",
      status: locationStatus,
      canAskAgain: locationCanAsk,
      onRequest: requestLocation,
    },
    {
      id: "notifications",
      icon: "bell",
      titleEn: "Push Notifications",
      titleTa: "அறிவிப்புகள்",
      titleHi: "पुश सूचनाएं",
      subtitleEn: "Vaccination dates & calving alerts",
      subtitleTa: "தடுப்பூசி தேதிகள் & கன்று ஈனும் எச்சரிக்கைகள்",
      subtitleHi: "टीकाकरण तिथियां और ब्याने के अलर्ट",
      purposeEn: "Ensures you never miss critical booster vaccines, artificial insemination follow-ups, or daily milking reminders.",
      purposeTa: "தடுப்பூசி நினைவூட்டல்கள், சினை ஊசி தேதிகள் மற்றும் தினசரி பால் பதிவு நினைவூட்டல்களை அனுப்புகிறது.",
      purposeHi: "टीकाकरण की तारीखें, गर्भाधान की जांच और दैनिक दूध रिकॉर्ड के समय पर रिमाइंडर प्राप्त करने के लिए।",
      status: notifStatus,
      canAskAgain: notifCanAsk,
      onRequest: requestNotifications,
    },
    {
      id: "photos",
      icon: "image",
      titleEn: "Photo Library & Storage",
      titleTa: "புகைப்பட தொகுப்பு & சேமிப்பு",
      titleHi: "फोटो लाइब्रेरी और स्टोरेज",
      subtitleEn: "Save & upload animal photos and PDF receipts",
      subtitleTa: "விலங்கு படங்கள் & PDF ரசீதுகளைச் சேமிக்க",
      subtitleHi: "पशु चित्र और पीडीएफ रसीदें सहेजें",
      purposeEn: "Used to select existing animal photos from your gallery and export monthly milk yield statements and profit reports.",
      purposeTa: "கேலரியில் இருந்து விலங்கு படங்களைத் தேர்ந்தெடுக்கவும் மற்றும் மாதாந்திர பால் அறிக்கைகளை ஏற்றுமதி செய்யவும்.",
      purposeHi: "गैलरी से पशुओं की पुरानी फोटो चुनने और मासिक दूध उत्पादन रिपोर्ट डाउनलोड करने के लिए।",
      status: photosStatus,
      canAskAgain: photosCanAsk,
      onRequest: requestPhotos,
    },
  ];

  const grantedCount = permissionsList.filter((p) => p.status === "granted").length;
  const totalCount = permissionsList.length;
  const progressRatio = grantedCount / totalCount;

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
            {isTa ? "சாதன அனுமதிகள்" : isHi ? "डिवाइस अनुमतियाँ" : "Device Permissions"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isTa ? "பயன்பாட்டு அம்சங்களை நிர்வகிக்கவும்" : isHi ? "ऐप सुविधाओं का प्रबंधन करें" : "Manage hardware & sensor permissions"}
          </Text>
        </View>

        <Pressable
          style={styles.refreshButton}
          onPress={checkAllPermissions}
          disabled={isRefreshing}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Refresh status"
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#16a34a" />
          ) : (
            <Feather name="refresh-cw" size={18} color="#16a34a" />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <View>
              <Text style={styles.progressTitle}>
                {isTa ? "அனுமதி நிலை" : isHi ? "अनुमति स्थिति" : "Permission Status"}
              </Text>
              <Text style={styles.progressSubtitle}>
                {grantedCount === totalCount
                  ? isTa
                    ? "அனைத்து அம்சங்களும் முழுமையாக இயங்குகின்றன"
                    : isHi
                    ? "सभी सुविधाएं पूरी तरह से सक्रिय हैं"
                    : "All capabilities fully operational"
                  : `${grantedCount} / ${totalCount} ${
                      isTa ? "அனுமதிக்கப்பட்டது" : isHi ? "स्वीकृत" : "Granted"
                    }`}
              </Text>
            </View>

            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{Math.round(progressRatio * 100)}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressRatio * 100}%` },
                progressRatio === 1 && { backgroundColor: "#16a34a" },
              ]}
            />
          </View>
        </View>

        {/* Privacy Note Banner */}
        <View style={styles.privacyBanner}>
          <Feather name="shield" size={18} color="#16a34a" />
          <Text style={styles.privacyBannerText}>
            {isTa
              ? "Upcheck Dairy உங்கள் தனியுரிமையை மதிக்கிறது. உங்கள் கேமரா அல்லது குரல் தரவு மூன்றாம் தரப்பினருடன் பகிரப்படாது."
              : isHi
              ? "Upcheck Dairy आपकी गोपनीयता का सम्मान करता है। आपका डेटा कभी विज्ञापनों के लिए उपयोग नहीं होता।"
              : "Upcheck Dairy accesses device hardware solely for dairy workflows. No sensor telemetry is ever sold or shared with advertisers."}
          </Text>
        </View>

        {/* List of Permissions */}
        <View style={styles.permissionsGroup}>
          {permissionsList.map((item) => {
            const isGranted = item.status === "granted";
            const isDenied = item.status === "denied";

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconCircle,
                      isGranted && styles.iconCircleGranted,
                      isDenied && styles.iconCircleDenied,
                    ]}
                  >
                    <Feather
                      name={item.icon}
                      size={20}
                      color={isGranted ? "#16a34a" : isDenied ? "#ef4444" : "#475569"}
                    />
                  </View>

                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.cardTitle}>
                      {isTa ? item.titleTa : isHi ? item.titleHi : item.titleEn}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {isTa ? item.subtitleTa : isHi ? item.subtitleHi : item.subtitleEn}
                    </Text>
                  </View>

                  {/* Status Indicator */}
                  <View
                    style={[
                      styles.statusPill,
                      isGranted
                        ? styles.statusPillGranted
                        : isDenied
                        ? styles.statusPillDenied
                        : styles.statusPillPending,
                    ]}
                  >
                    <Feather
                      name={isGranted ? "check" : isDenied ? "x" : "alert-circle"}
                      size={12}
                      color={isGranted ? "#16a34a" : isDenied ? "#ef4444" : "#d97706"}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        isGranted
                          ? styles.statusTextGranted
                          : isDenied
                          ? styles.statusTextDenied
                          : styles.statusTextPending,
                      ]}
                    >
                      {isGranted
                        ? isTa
                          ? "செயலில்"
                          : isHi
                          ? "स्वीकृत"
                          : "Allowed"
                        : isDenied
                        ? isTa
                          ? "மறுக்கப்பட்டது"
                          : isHi
                          ? "अस्वीकृत"
                          : "Denied"
                        : isTa
                        ? "தேவை"
                        : isHi
                        ? "आवश्यक"
                        : "Enable"}
                    </Text>
                  </View>
                </View>

                {/* Explanation text */}
                <Text style={styles.cardPurpose}>
                  {isTa ? item.purposeTa : isHi ? item.purposeHi : item.purposeEn}
                </Text>

                {/* Action button */}
                {!isGranted && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      pressed && styles.actionBtnPressed,
                    ]}
                    onPress={item.onRequest}
                  >
                    <Text style={styles.actionBtnText}>
                      {isDenied && !item.canAskAgain
                        ? isTa
                          ? "அமைப்புகளில் திறக்கவும்"
                          : isHi
                          ? "सेटिंग्स में खोलें"
                          : "Open System Settings"
                        : isTa
                        ? "அனுமதி வழங்கவும்"
                        : isHi
                        ? "अनुमति दें"
                        : "Grant Permission"}
                    </Text>
                    <Feather
                      name={isDenied && !item.canAskAgain ? "external-link" : "arrow-right"}
                      size={15}
                      color="#ffffff"
                    />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        {/* Global System Settings Card */}
        <View style={styles.systemSettingsCard}>
          <View style={styles.systemSettingsTextWrap}>
            <Text style={styles.systemSettingsTitle}>
              {isTa ? "சாதன அமைப்புகள்" : isHi ? "डिवाइस सेटिंग्स" : "Need to adjust system access?"}
            </Text>
            <Text style={styles.systemSettingsSubtitle}>
              {isTa
                ? "உங்கள் போனின் முதன்மை அமைப்புகளில் Upcheck Dairy அனுமதிகளை மாற்றலாம்."
                : isHi
                ? "आप अपने फ़ोन की मुख्य सेटिंग्स में ऐप की अनुमतियों को कभी भी बदल सकते हैं।"
                : "You can modify hardware toggles directly from Android / iOS device settings."}
            </Text>
          </View>

          <Pressable
            style={styles.openSettingsBtn}
            onPress={() => Linking.openSettings()}
            hitSlop={8}
          >
            <Feather name="settings" size={16} color="#16a34a" />
            <Text style={styles.openSettingsBtnText}>
              {isTa ? "அமைப்புகள்" : isHi ? "सेटिंग्स" : "Open Settings"}
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  progressCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  progressTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  progressSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  percentBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#15803d",
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 4,
  },
  privacyBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  privacyBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#15803d",
    lineHeight: 17,
  },
  permissionsGroup: {
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircleGranted: {
    backgroundColor: "#dcfce7",
  },
  iconCircleDenied: {
    backgroundColor: "#fee2e2",
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusPillGranted: {
    backgroundColor: "#dcfce7",
  },
  statusPillDenied: {
    backgroundColor: "#fee2e2",
  },
  statusPillPending: {
    backgroundColor: "#fef3c7",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusTextGranted: {
    color: "#15803d",
  },
  statusTextDenied: {
    color: "#b91c1c",
  },
  statusTextPending: {
    color: "#b45309",
  },
  cardPurpose: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  actionBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  systemSettingsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
    marginTop: 4,
  },
  systemSettingsTextWrap: {
    flex: 1,
  },
  systemSettingsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  systemSettingsSubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 15,
  },
  openSettingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  openSettingsBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16a34a",
  },
});

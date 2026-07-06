import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Svg, { Path, Rect, Circle, G } from "react-native-svg";
import { useFarmer } from "@/context/FarmerContext";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGE_NAMES, type Language } from "@/context/LanguageContext";
import { useFarmContext } from "../src/modules/farms/context/FarmProvider";
import { useAnimals } from "../src/modules/animals/hooks/useAnimals";
import { LinearGradient } from "expo-linear-gradient";
import { farmRepository } from "../src/modules/farms/api/FarmRepository";
import { Farm } from "../src/modules/farms/models/Farm";
import { apiClient } from "../src/core/api/ApiClient";
import { Storage } from "../src/core/storage/Storage";
import { AnimalMapper } from "../src/modules/animals/api/AnimalMapper";

type ViewState = "main" | "personal" | "farms" | "farm_detail";

function FarmIllustration() {
  return (
    <Svg width={40} height={30} viewBox="0 0 40 30">
      {/* Ground line */}
      <Path d="M 2 28 Q 20 26 38 28" stroke="#16a34a" strokeWidth={1.5} fill="none" />
      {/* Roof of the house */}
      <Path d="M 6 18 L 16 9 L 26 18 Z" fill="#15803d" />
      {/* House structure */}
      {/* Tree trunk */}
      <Rect x={30} y={20} width={2} height={8} fill="#854d0e" />
      {/* Tree foliage */}
      <Circle cx={31} cy={16} r={5} fill="#15803d" />
      <Circle cx={28} cy={18} r={4} fill="#22c55e" />
      <Circle cx={34} cy={18} r={4} fill="#22c55e" />
    </Svg>
  );
}

function ProfileCardLandscape() {
  return (
    <View style={styles.landscapeContainer} pointerEvents="none">
      <Svg width="100%" height={45} viewBox="0 0 350 45" preserveAspectRatio="none">
        <Path d="M -20 45 Q 60 25 140 38 T 370 32 L 370 45 Z" fill="#dcfce7" opacity={0.5} />
        <Path d="M -20 45 Q 80 18 190 32 T 370 22 L 370 45 Z" fill="#bbf7d0" opacity={0.45} />
        <G transform="translate(250, 12) scale(0.55)">
          <Rect x={32} y={12} width={10} height={28} fill="#86efac" rx={2} />
          <Path d="M32 12 Q 37 4 42 12 Z" fill="#166534" />
          <Path d="M 0 22 L 15 10 L 30 22 Z" fill="#15803d" />
          <Rect x={2} y={22} width={26} height={18} fill="#22c55e" />
          <Rect x={10} y={28} width={10} height={12} fill="#fff" />
        </G>
        <G transform="translate(15, 26) scale(0.8)">
          <Path
            d="M0 8 L0 18 M0 12 L20 12 M10 8 L10 18 M20 8 L20 18 M20 12 L40 12 M30 8 L30 18 M40 8 L40 18"
            stroke="#16a34a"
            strokeWidth={1.5}
            opacity={0.4}
          />
        </G>
        <Circle cx={85} cy={30} r={6} fill="#16a34a" opacity={0.6} />
        <Circle cx={93} cy={32} r={5} fill="#15803d" opacity={0.5} />
        <Circle cx={120} cy={35} r={5} fill="#22c55e" opacity={0.6} />
        <Circle cx={310} cy={28} r={7} fill="#15803d" opacity={0.55} />
        <Circle cx={320} cy={31} r={6} fill="#16a34a" opacity={0.6} />
      </Svg>
    </View>
  );
}

export default function ProfileScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { farmer, updateProfile, logout } = useFarmer();
  const { animals } = useAnimals();
  const { farms, activeFarm, refreshFarms } = useFarmContext();

  const [currentView, setCurrentView] = useState<ViewState>("main");
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);

  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<string>("name");
  const [editingFieldLabel, setEditingFieldLabel] = useState<string>("");
  const [editingFieldValue, setEditingFieldValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [allAnimals, setAllAnimals] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Helper to fetch animals for a specific farm with caching fallbacks
  const fetchAnimalsForFarm = async (farmId: string): Promise<any[]> => {
    const cacheKey = `thulirfarm:${farmId}:animals`;
    try {
      const dtos = await apiClient.get<any[]>(`/animals/farm/${farmId}`);
      await Storage.set(cacheKey, dtos);
      return AnimalMapper.toDomainList(dtos);
    } catch (e) {
      console.warn(`[ProfileScreen] Failed to fetch animals for farm ${farmId}, loading cache`, e);
      const cached = await Storage.get<any[]>(cacheKey);
      if (cached) {
        return AnimalMapper.toDomainList(cached);
      }
      return [];
    }
  };

  useEffect(() => {
    let active = true;
    const loadAllStats = async () => {
      if (farms.length === 0) return;
      setLoadingStats(true);
      try {
        const promises = farms.map(farm => fetchAnimalsForFarm(farm.id));
        const results = await Promise.all(promises);
        if (!active) return;
        setAllAnimals(results.flat());
      } catch (err) {
        console.error("[ProfileScreen] Error loading aggregated stats:", err);
      } finally {
        if (active) setLoadingStats(false);
      }
    };

    loadAllStats();
    return () => {
      active = false;
    };
  }, [farms, animals]);

  const getLabel = (key: string) => {
    const labels: Record<string, Record<string, string>> = {
      personalDetails: {
        ta: "தனிப்பட்ட விவரங்கள்",
        hi: "व्यक्तिगत जानकारी",
        en: "Personal Details",
      },
      personalDetailsDesc: {
        ta: "உங்கள் தனிப்பட்ட தகவலைப் பார்க்கவும் மற்றும் நிர்வகிக்கவும்",
        hi: "अपनी व्यक्तिगत जानकारी देखें और प्रबंधित करें",
        en: "View and manage your personal information",
      },
      farmDetails: {
        ta: "பண்ணை விவரங்கள்",
        hi: "फार्म विवरण",
        en: "Farm Details",
      },
      farmDetailsDesc: {
        ta: "உங்கள் பண்ணைகளைப் பார்க்கவும் மற்றும் நிர்வகிக்கவும்",
        hi: "अपने खेतों को देखें और प्रबंधित करें",
        en: "View and manage your farms",
      },
      appInfo: {
        ta: "பயன்பாட்டு தகவல்",
        hi: "ऐप जानकारी",
        en: "App Information",
      },
      appInfoDesc: {
        ta: "பதிப்பு 1.0.0 • விதிமுறைகள் & தனியுரிமை",
        hi: "संस्करण 1.0.0 • नियम और गोपनीयता",
        en: "Version 1.0.0 • Terms & Privacy",
      },
      logoutDesc: {
        ta: "உங்கள் கணக்கிலிருந்து வெளியேறவும்",
        hi: "अपने खाते से साइन आउट करें",
        en: "Sign out of your account",
      },
      yourFarms: {
        ta: "உங்கள் பண்ணைகள்",
        hi: "आपके फार्म",
        en: "Your Farms",
      },
      tapFarmHint: {
        ta: "கூடுதல் விவரங்களைப் பார்க்க ஒரு பண்ணையைத் தட்டவும்",
        hi: "अधिक विवरण देखने के लिए किसी फ़ार्म पर टैप करें",
        en: "Tap on a farm to view more details",
      },
      email: {
        ta: "மின்னஞ்சல்",
        hi: "ईमेल",
        en: "Email",
      },
      state: {
        ta: "மாநிலம்",
        hi: "राज्य",
        en: "State",
      },
      memberSince: {
        ta: "உறுப்பினர்",
        hi: "सदस्यता",
        en: "Member Since",
      },
      farmName: {
        ta: "பண்ணை பெயர்",
        hi: "फार्म का नाम",
        en: "Farm Name",
      },
      farmAddress: {
        ta: "பண்ணை முகவரி",
        hi: "फार्म का पता",
        en: "Farm Address",
      },
    };

    const currentLang = (language === "ta" || language === "hi") ? language : "en";
    return labels[key]?.[currentLang] || key;
  };

  const handleBack = () => {
    if (currentView === "personal") {
      setCurrentView("main");
    } else if (currentView === "farms") {
      setCurrentView("main");
    } else if (currentView === "farm_detail") {
      setCurrentView("farms");
    } else {
      router.back();
    }
  };

  const handleOpenEdit = (field: string, label: string, initialValue: string) => {
    if (field === "memberSince") {
      Alert.alert(
        language === "ta" ? "அறிவிப்பு" : "Notice",
        language === "ta" ? "உறுப்பினர் சேர்ந்த தேதியை மாற்ற முடியாது." : "Membership date is automatically set and cannot be changed."
      );
      return;
    }
    if (field === "totalAnimals") {
      Alert.alert(
        language === "ta" ? "அறிவிப்பு" : "Notice",
        language === "ta"
          ? "மொத்த விலங்குகள் உங்கள் மந்தையின் அடிப்படையில் கணக்கிடப்படுகிறது. விலங்குகளைச் சேர்க்க அல்லது நீக்க மந்தை தாவலுக்குச் செல்லவும்."
          : "Total Animals is calculated based on your active herd. Go to the Herd tab to add or edit animals."
      );
      return;
    }
    setEditingField(field);
    setEditingFieldLabel(label);
    setEditingFieldValue(initialValue);
    setEditModalVisible(true);
  };

  const handleModalSave = async () => {
    const cleanValue = editingFieldValue.trim();
    if (editingField === "phone" && !/^\d{10}$/.test(cleanValue)) {
      Alert.alert(
        language === "ta" ? "தவறு" : "Error",
        language === "ta" ? "சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்" : "Enter a valid 10-digit mobile number"
      );
      return;
    }
    if (editingField === "email" && cleanValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)) {
      Alert.alert(
        language === "ta" ? "தவறு" : "Error",
        language === "ta" ? "சரியான மின்னஞ்சலை உள்ளிடவும்" : "Enter a valid email address"
      );
      return;
    }
    if (["name", "village", "district", "state", "farmName"].includes(editingField) && !cleanValue) {
      Alert.alert(
        language === "ta" ? "தவறு" : "Error",
        language === "ta" ? "இந்த விவரம் தேவை" : "This field is required"
      );
      return;
    }

    setSaving(true);
    try {
      if (currentView === "personal") {
        await updateProfile({ [editingField]: cleanValue });
      } else if (currentView === "farm_detail" && selectedFarm) {
        if (editingField === "farmName") {
          await farmRepository.update(selectedFarm.id, { name: cleanValue });
          await updateProfile({ farmName: cleanValue });
          setSelectedFarm((prev: any) => prev ? new Farm({ ...prev, name: cleanValue }) : null);
          await refreshFarms();
        } else if (editingField === "farmAddress") {
          await farmRepository.update(selectedFarm.id, { location: cleanValue });
          setSelectedFarm((prev: any) => prev ? new Farm({ ...prev, location: cleanValue }) : null);
          await refreshFarms();
        } else {
          await updateProfile({ [editingField]: cleanValue });
        }
      }
      setEditModalVisible(false);
    } catch (e: any) {
      Alert.alert(
        language === "ta" ? "தவறு" : "Error",
        e.message || "Failed to update detail"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLanguagePress = () => {
    Alert.alert(
      t.language,
      language === "ta" ? "மொழியைத் தேர்ந்தெடுக்கவும்" : "Select Language",
      [
        { text: "English", onPress: () => setLanguage("en") },
        { text: "தமிழ்", onPress: () => setLanguage("ta") },
        { text: "हिंदी", onPress: () => setLanguage("hi") },
        { text: t.cancel, style: "cancel" },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t.logout,
      language === "ta"
        ? "நிச்சயமாக வெளியேற விரும்புகிறீர்களா?"
        : language === "hi"
          ? "क्या आप लॉगआउट करना चाहते हैं?"
          : "Are you sure you want to log out?",
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.logout,
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  const handleToggleNotifications = async () => {
    const newValue = !farmer?.notificationsEnabled;
    try {
      await updateProfile({ notificationsEnabled: newValue });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert(
        language === "ta" ? "தவறு" : "Error",
        e.message || "Failed to update notification settings"
      );
    }
  };

  const initials = farmer?.name
    ? farmer.name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const totalAnimalsCount = allAnimals.length > 0 ? allAnimals.length : animals.length;
  const healthyCows = allAnimals.length > 0 
    ? allAnimals.filter((a: any) => a.healthStatus === "healthy").length 
    : animals.filter((a: any) => a.healthStatus === "healthy").length;
  const attentionCows = allAnimals.length > 0 
    ? allAnimals.filter((a: any) => a.healthStatus !== "healthy").length 
    : animals.filter((a: any) => a.healthStatus !== "healthy").length;

  const memberSinceStr = farmer?.createdAt
    ? new Date(farmer.createdAt).toLocaleDateString(
      language === "ta" ? "ta-IN" : language === "hi" ? "hi-IN" : "en-IN",
      { month: "long", year: "numeric" }
    )
    : "—";

  const locationString = [farmer?.village, farmer?.state].filter(Boolean).join(", ") || farmer?.district || "—";
  const farmsCount = farms.length;

  const selectedFarmAnimalsCount = selectedFarm
    ? (allAnimals.length > 0 
        ? allAnimals.filter((a: any) => a.farmId === selectedFarm.id).length 
        : (selectedFarm.id === activeFarm?.id ? animals.length : 0))
    : 0;

  const getViewTitle = () => {
    switch (currentView) {
      case "personal":
        return getLabel("personalDetails");
      case "farms":
      case "farm_detail":
        return getLabel("farmDetails");
      default:
        return language === "ta" ? "எனது சுயவிவரம்" : language === "hi" ? "मेरी प्रोफाइल" : "My Profile";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={handleBack}>
          <Feather name="arrow-left" size={24} color="#16a34a" />
        </Pressable>
        <Text style={styles.headerTitle}>{getViewTitle()}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {currentView === "main" && (
          <>
            {/* Top Linear Gradient Profile Card */}
            <LinearGradient
              colors={["#f0fdf4", "#edfcf2", "#e6f9ed"]}
              style={styles.gradientCard}
            >
              <View style={styles.profileCardContent}>
                {/* Left Side: Avatar + Info */}
                <View style={styles.profileMainInfo}>
                  <Pressable
                    style={[
                      styles.avatar,
                      { backgroundColor: farmer?.avatarColor ?? "#2563eb" },
                    ]}
                    onPress={() => handleOpenEdit("name", language === "ta" ? "விவசாயி பெயர்" : "Farmer Name", farmer?.name ?? "")}
                  >
                    <Text style={styles.avatarText}>{initials}</Text>
                  </Pressable>

                  <View style={styles.profileDetails}>
                    <Pressable
                      onPress={() => handleOpenEdit("name", language === "ta" ? "விவசாயி பெயர்" : "Farmer Name", farmer?.name ?? "")}
                      style={styles.nameRow}
                    >
                      <Text style={styles.farmerName}>{farmer?.name ?? "—"}</Text>
                      <Feather name="edit-2" size={12} color="#6b7280" style={{ marginLeft: 4 }} />
                    </Pressable>

                    <View style={styles.roleBadge}>
                      <Feather name="user" size={10} color="#16a34a" />
                      <Text style={styles.roleText}>Farmer</Text>
                    </View>

                    <View style={styles.infoLine}>
                      <Feather name="map-pin" size={12} color="#4b5563" />
                      <Text style={styles.smallText}>{locationString}</Text>
                    </View>

                    <View style={styles.infoLine}>
                      <Feather name="calendar" size={12} color="#4b5563" />
                      <Text style={styles.smallText}>
                        <Text style={{ fontWeight: "700" }}>
                          {language === "ta" ? "உறுப்பினர்: " : language === "hi" ? "सदस्यता: " : "Member since "}
                        </Text>
                        {memberSinceStr}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Right Side: Mini Farm Card */}
                <Pressable style={styles.farmCard} onPress={() => setCurrentView("farms")}>
                  <FarmIllustration />
                  <Text style={styles.farmCount}>{farmsCount}</Text>
                  <Text style={styles.farmText}>
                    {farmsCount === 1 ? "Farm" : "Farms"}
                  </Text>
                </Pressable>
              </View>

              {/* Bottom Hills Illustration SVG */}
              <ProfileCardLandscape />
            </LinearGradient>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              {/* Card 1: Total Animals */}
              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: "#f0fdf4" }]}>
                  <MaterialCommunityIcons name="cow" size={18} color="#16a34a" />
                </View>
                <Text style={styles.statNum}>{totalAnimalsCount}</Text>
                <Text style={styles.statLabel}>{t.totalAnimals}</Text>
                <Text style={styles.statSub}>
                  {language === "ta" ? "அனைத்து விலங்குகள்" : language === "hi" ? "सभी पशु" : "All animals"}
                </Text>
              </View>

              {/* Card 2: Healthy */}
              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: "#f0fdf4" }]}>
                  <Feather name="heart" size={16} color="#16a34a" />
                </View>
                <Text style={styles.statNum}>{healthyCows}</Text>
                <Text style={styles.statLabel}>{t.healthy}</Text>
                <Text style={styles.statSub}>
                  {language === "ta" ? "நன்றாக உள்ளது" : language === "hi" ? "सब ঠিক ہے" : "Doing well"}
                </Text>
              </View>

              {/* Card 3: Needs Attention */}
              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: "#fff7ed" }]}>
                  <Feather name="alert-triangle" size={16} color="#ea580c" />
                </View>
                <Text style={[styles.statNum, { color: "#111827" }]}>{attentionCows}</Text>
                <Text style={[styles.statLabel, { color: "#ea580c" }]}>{t.attention}</Text>
                <Text style={styles.statSub}>
                  {language === "ta" ? "கவனம் தேவை" : language === "hi" ? "देखभाल की जरूरत" : "Requires care"}
                </Text>
              </View>
            </View>

            {/* Options List */}
            <View style={styles.optionsContainer}>
              <ProfileOption
                icon="user"
                title={getLabel("personalDetails")}
                subtitle={getLabel("personalDetailsDesc")}
                onPress={() => setCurrentView("personal")}
              />

              <ProfileOption
                icon="home"
                title={getLabel("farmDetails")}
                subtitle={getLabel("farmDetailsDesc")}
                onPress={() => setCurrentView("farms")}
              />

              <ProfileOption
                icon="globe"
                title={t.language}
                subtitle={LANGUAGE_NAMES[language] || "English"}
                onPress={handleLanguagePress}
              />

              <ProfileOption
                icon="bell"
                title={language === "ta" ? "அறிவிப்புகள்" : "Notifications"}
                subtitle={farmer?.notificationsEnabled ? (language === "ta" ? "செயல்படுத்தப்பட்டது" : "Enabled") : (language === "ta" ? "முடக்கப்பட்டது" : "Disabled")}
                onPress={handleToggleNotifications}
              />

              <ProfileOption
                icon="info"
                title={getLabel("appInfo")}
                subtitle={getLabel("appInfoDesc")}
                onPress={() => Alert.alert("ThulirFarm", "Version 1.0.0")}
              />

              {farmer && (
                <ProfileOption
                  icon="log-out"
                  iconBgColor="#fef2f2"
                  iconColor="#ef4444"
                  title={t.logout}
                  subtitle={getLabel("logoutDesc")}
                  onPress={handleLogout}
                />
              )}
            </View>
          </>
        )}

        {currentView === "personal" && (
          <View style={styles.cardContainer}>
            <DetailRow
              icon="phone"
              label={t.phone}
              value={farmer?.phone || "—"}
              onPress={() => handleOpenEdit("phone", t.phone, farmer?.phone || "")}
            />

            <DetailRow
              icon="mail"
              label={getLabel("email")}
              value={farmer?.email || "—"}
              showChevron={false}
            />
            <DetailRow
              icon="map-pin"
              label={t.village}
              value={farmer?.village || "—"}
              onPress={() => handleOpenEdit("village", t.village, farmer?.village || "")}
            />
            <DetailRow
              icon="navigation"
              label={t.district}
              value={farmer?.district || "—"}
              onPress={() => handleOpenEdit("district", t.district, farmer?.district || "")}
            />
            <DetailRow
              icon="map"
              label={getLabel("state")}
              value={farmer?.state || "—"}
              onPress={() => handleOpenEdit("state", getLabel("state"), farmer?.state || "")}
            />
            <DetailRow
              icon="calendar"
              label={getLabel("memberSince")}
              value={memberSinceStr}
              onPress={() => handleOpenEdit("memberSince", getLabel("memberSince"), memberSinceStr)}
            />
          </View>
        )}

        {currentView === "farms" && (
          <View style={styles.farmsContainer}>
            <Text style={styles.sectionHeading}>{getLabel("yourFarms")}</Text>

            {farms.map((farm) => (
              <Pressable
                key={farm.id}
                style={styles.farmListItem}
                onPress={() => {
                  setSelectedFarm(farm);
                  setCurrentView("farm_detail");
                }}
              >
                <View style={styles.farmListIllustration}>
                  <FarmIllustration />
                </View>
                <View style={styles.farmListContent}>
                  <Text style={styles.farmListName}>{farm.name || "Unnamed Farm"}</Text>
                  <Text style={styles.farmListLocation}>{farm.location || "Location not set"}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9ca3af" />
              </Pressable>
            ))}

            <Text style={styles.tapFarmHint}>{getLabel("tapFarmHint")}</Text>
          </View>
        )}

        {currentView === "farm_detail" && selectedFarm && (
          <View style={styles.cardContainer}>
            <DetailRow
              icon="home"
              label={getLabel("farmName")}
              value={selectedFarm.name}
              onPress={() => handleOpenEdit("farmName", getLabel("farmName"), selectedFarm.name)}
            />
            <DetailRow
              icon="map-pin"
              label={getLabel("farmAddress")}
              value={selectedFarm.location || "—"}
              onPress={() => handleOpenEdit("farmAddress", getLabel("farmAddress"), selectedFarm.location || "")}
            />
            <DetailRow
              icon="map-pin"
              label={t.village}
              value={farmer?.village || "—"}
              onPress={() => handleOpenEdit("village", t.village, farmer?.village || "")}
            />
            <DetailRow
              icon="navigation"
              label={t.district}
              value={farmer?.district || "—"}
              onPress={() => handleOpenEdit("district", t.district, farmer?.district || "")}
            />
            <DetailRow
              icon="map"
              label={getLabel("state")}
              value={farmer?.state || "—"}
              onPress={() => handleOpenEdit("state", getLabel("state"), farmer?.state || "")}
            />
            <DetailRow
              icon="cow"
              iconType="material"
              label={t.totalAnimals}
              value={selectedFarmAnimalsCount.toString()}
              onPress={() => handleOpenEdit("totalAnimals", t.totalAnimals, selectedFarmAnimalsCount.toString())}
            />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {language === "ta"
              ? "துளிர்பண்ணை — விவசாயிகளுக்காக, விவசாயிகளால்"
              : language === "hi"
                ? "थुलिर फार्म — किसानों के लिए, किसानों द्वारा"
                : "ThulirFarm — For Farmers, By Farmers"}
          </Text>
        </View>
      </ScrollView>

      {/* Editing Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>
              {language === "ta" ? `${editingFieldLabel} திருத்தவும்` : language === "hi" ? `${editingFieldLabel} संपादित करें` : `Edit ${editingFieldLabel}`}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={editingFieldValue}
              onChangeText={setEditingFieldValue}
              placeholder={language === "ta" ? "உள்ளிடவும்..." : language === "hi" ? "दर्ज करें..." : `Enter ${editingFieldLabel.toLowerCase()}`}
              placeholderTextColor="#9ca3af"
              autoFocus={true}
              keyboardType={
                editingField === "phone" ? "phone-pad" :
                  editingField === "email" ? "email-address" :
                    "default"
              }
              autoCapitalize={editingField === "email" ? "none" : "sentences"}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.modalBtnCancelText}>
                  {language === "ta" ? "ரத்து செய்" : language === "hi" ? "रद्द करें" : "Cancel"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleModalSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnSaveText}>
                    {language === "ta" ? "சேமி" : language === "hi" ? "சहेजें" : "Save"}
                  </Text>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

interface ProfileOptionProps {
  icon: string;
  iconType?: "feather" | "material";
  title: string;
  subtitle: string;
  onPress: () => void;
  iconBgColor?: string;
  iconColor?: string;
}

function ProfileOption({
  icon,
  iconType = "feather",
  title,
  subtitle,
  onPress,
  iconBgColor = "#f0fdf4",
  iconColor = "#16a34a",
}: ProfileOptionProps) {
  return (
    <Pressable style={styles.optionRow} onPress={onPress}>
      <View style={[styles.optionIconWrap, { backgroundColor: iconBgColor }]}>
        {iconType === "material" ? (
          <MaterialCommunityIcons name={icon as any} size={18} color={iconColor} />
        ) : (
          <Feather name={icon as any} size={18} color={iconColor} />
        )}
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={18} color="#9ca3af" />
    </Pressable>
  );
}

interface DetailRowProps {
  icon: string;
  iconType?: "feather" | "material";
  label: string;
  value: string;
  onPress?: () => void;
  showChevron?: boolean;
}

function DetailRow({ icon, iconType = "feather", label, value, onPress, showChevron = true }: DetailRowProps) {
  return (
    <Pressable style={styles.detailRow} onPress={onPress} disabled={!onPress}>
      <View style={styles.detailIconWrap}>
        {iconType === "material" ? (
          <MaterialCommunityIcons name={icon as any} size={18} color="#16a34a" />
        ) : (
          <Feather name={icon as any} size={18} color="#16a34a" />
        )}
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || "—"}</Text>
      </View>
      {showChevron && <Feather name="chevron-right" size={16} color="#9ca3af" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, gap: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  // Profile Card
  gradientCard: {
    borderRadius: 16,
    padding: 12,
    paddingBottom: 40, // space for landscape illustration
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  profileCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarText: { fontSize: 24, fontWeight: "800", color: "#fff" },
  profileDetails: {
    marginLeft: 10,
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  farmerName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  roleText: { fontSize: 9, color: "#16a34a", fontWeight: "600" },
  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  smallText: { fontSize: 11, color: "#4b5563" },

  // Right Farm Card in header
  farmCard: {
    width: 64,
    height: 74,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  farmCount: { fontSize: 15, fontWeight: "800", color: "#111827", marginTop: 2 },
  farmText: { fontSize: 9, color: "#4b5563" },

  // Landscape Svg
  landscapeContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 45,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statNum: { fontSize: 16, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 9, fontWeight: "700", color: "#16a34a", marginTop: 2, textAlign: "center" },
  statSub: { fontSize: 8, color: "#9ca3af", marginTop: 1, textAlign: "center" },

  // Options Menu List
  optionsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf2f7",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f7fafc",
  },
  optionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: { fontSize: 14, fontWeight: "700", color: "#1a202c" },
  optionSubtitle: { fontSize: 11, color: "#718096", marginTop: 2 },

  // Sub-view Cards
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf2f7",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f7fafc",
  },
  detailIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: { fontSize: 11, color: "#718096", fontWeight: "500" },
  detailValue: { fontSize: 14, fontWeight: "700", color: "#1f2937", marginTop: 1 },

  // Farms List View
  farmsContainer: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16a34a",
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  farmListItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf2f7",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  farmListIllustration: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  farmListContent: {
    flex: 1,
    marginLeft: 14,
  },
  farmListName: { fontSize: 15, fontWeight: "700", color: "#1a202c" },
  farmListLocation: { fontSize: 12, color: "#718096", marginTop: 2 },
  tapFarmHint: {
    fontSize: 11,
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },

  // Footer
  footer: { alignItems: "center", marginTop: 20 },
  footerText: { color: "#a0aec0", fontSize: 11, textAlign: "center" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#1a202c", marginBottom: 14 },
  modalInput: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#1a202c",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancel: { backgroundColor: "#f7fafc", borderWidth: 1, borderColor: "#e2e8f0" },
  modalBtnCancelText: { color: "#4a5568", fontWeight: "600", fontSize: 13 },
  modalBtnSave: { backgroundColor: "#16a34a" },
  modalBtnSaveText: { color: "#ffffff", fontWeight: "600", fontSize: 13 },
});

import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { useFarmer } from "@/context/FarmerContext";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGE_NAMES, type Language } from "@/context/LanguageContext";
import { useApp } from "@/context/AppContext";

function FarmIllustration() {
  return (
    <Svg width={40} height={30} viewBox="0 0 40 30">
      {/* Ground line */}
      <Path d="M 2 28 Q 20 26 38 28" stroke="#16a34a" strokeWidth={1.5} fill="none" />
      {/* Roof of the house */}
      <Path d="M 6 18 L 16 9 L 26 18 Z" fill="#15803d" />
      {/* House structure */}
      <Rect x={8} y={18} width={16} height={10} fill="#16a34a" />
      {/* Door */}
      <Rect x={14} y={22} width={4} height={6} fill="#fff" />
      {/* Windows */}
      <Rect x={10} y={20} width={3} height={3} fill="#fff" />
      <Rect x={19} y={20} width={3} height={3} fill="#fff" />
      {/* Tree trunk */}
      <Rect x={30} y={20} width={2} height={8} fill="#854d0e" />
      {/* Tree foliage */}
      <Circle cx={31} cy={16} r={5} fill="#15803d" />
      <Circle cx={28} cy={18} r={4} fill="#22c55e" />
      <Circle cx={34} cy={18} r={4} fill="#22c55e" />
    </Svg>
  );
}

export default function ProfileScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { farmer, updateProfile, logout } = useFarmer();
  const { animals } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(farmer?.name ?? "");
  const [village, setVillage] = useState(farmer?.village ?? "");
  const [district, setDistrict] = useState(farmer?.district ?? "");
  const [farmName, setFarmName] = useState(farmer?.farmName ?? "");
  const [email, setEmail] = useState(farmer?.email ?? "");
  const [state, setState] = useState(farmer?.state ?? "");

  const langs: Language[] = ["ta", "en", "hi"];

  const handleSave = async () => {
    await updateProfile({ name, village, district, farmName, email, state });
    setEditing(false);
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

  const initials = farmer?.name
    ? farmer.name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const healthyCows = animals.filter((a: any) => a.healthStatus === "healthy").length;
  const attentionCows = animals.filter((a: any) => a.healthStatus !== "healthy").length;

  const memberSince = farmer?.createdAt
    ? new Date(farmer.createdAt).toLocaleDateString(
        language === "ta" ? "ta-IN" : language === "hi" ? "hi-IN" : "en-IN",
        { month: "long", year: "numeric" }
      )
    : "—";

  const locationString = [village, state].filter(Boolean).join(", ") || district || "—";
  const farmsCount = farmer?.farmName ? 1 : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top White Section: Header + Profile Card */}
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#16a34a" />
          </Pressable>
          <Text style={styles.headerTitle}>{t.profile}</Text>
          <Pressable
            style={styles.editBtn}
            onPress={() => (editing ? handleSave() : setEditing(true))}
          >
            <Feather name={editing ? "check" : "edit-2"} size={14} color="#fff" />
            <Text style={styles.editBtnText}>
              {editing ? (language === "ta" ? "சேமி" : language === "hi" ? "सहेजें" : "Save") : t.editProfile}
            </Text>
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          {/* Avatar */}
          <View
            style={[
              styles.avatar,
              { backgroundColor: farmer?.avatarColor ?? "#2563eb" },
            ]}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            {editing ? (
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder={t.farmerName}
                placeholderTextColor="#9ca3af"
              />
            ) : (
              <Text style={styles.farmerName}>{farmer?.name ?? "—"}</Text>
            )}

            {/* Role Badge */}
            <View style={styles.roleBadge}>
              <Feather name="user" size={12} color="#15803d" />
              <Text style={styles.roleText}>Farmer</Text>
            </View>

            {/* Location Line */}
            <View style={styles.infoLine}>
              <Feather name="map-pin" size={13} color="#6b7280" />
              <Text style={styles.smallText}>{locationString}</Text>
            </View>

            {/* Farm Name Line */}
            <View style={styles.infoLine}>
              <Feather name="home" size={13} color="#6b7280" />
              <Text style={styles.smallText}>{farmName || "No Farm"}</Text>
            </View>

            {/* Calendar Line */}
            <View style={styles.infoLine}>
              <Feather name="calendar" size={13} color="#6b7280" />
              <Text style={styles.smallText}>
                {language === "ta" ? "உறுப்பினர்: " : language === "hi" ? "सदस्यता: " : "Member since "}
                {memberSince}
              </Text>
            </View>
          </View>

          {/* Right Farm Card */}
          <View style={styles.farmCard}>
            <FarmIllustration />
            <Text style={styles.farmCount}>{farmsCount}</Text>
            <Text style={styles.farmText}>Farm</Text>
          </View>
        </View>
      </View>

      {/* Gray/Blueish body background items */}
      <View style={styles.bodyContent}>
        {/* Language Section Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t.language}</Text>
          <View style={styles.langRow}>
            {langs.map((l) => {
              const isActive = language === l;
              return (
                <Pressable
                  key={l}
                  style={[styles.langChip, isActive ? styles.langChipActive : styles.langChipInactive]}
                  onPress={() => setLanguage(l)}
                >
                  <Text style={[styles.langChipText, isActive ? styles.langChipActiveText : styles.langChipInactiveText]}>
                    {LANGUAGE_NAMES[l]}
                  </Text>
                  {isActive && (
                    <Feather name="check" size={14} color="#fff" style={{ marginLeft: 6 }} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Card 1: Total Animals */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: "#f0fdf4" }]}>
              <MaterialCommunityIcons name="cow" size={16} color="#16a34a" />
            </View>
            <Text style={styles.statNum}>{animals.length}</Text>
            <Text style={styles.statLabel}>{t.totalAnimals}</Text>
            <Text style={styles.statSub}>
              {language === "ta" ? "அனைத்து விலங்குகள்" : language === "hi" ? "सभी पशु" : "All animals"}
            </Text>
          </View>

          {/* Card 3: Healthy */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: "#f0fdf4" }]}>
              <Feather name="heart" size={16} color="#16a34a" />
            </View>
            <Text style={styles.statNum}>{healthyCows}</Text>
            <Text style={styles.statLabel}>{t.healthy}</Text>
            <Text style={styles.statSub}>
              {language === "ta" ? "நன்றாக உள்ளது" : language === "hi" ? "सब ठीक है" : "Doing well"}
            </Text>
          </View>

          {/* Card 4: Needs Attention */}
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

        {/* Personal Details Section Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {language === "ta"
              ? "தனிப்பட்ட விவரங்கள்"
              : language === "hi"
              ? "व्यक्तिगत जानकारी"
              : "PERSONAL DETAILS"}
          </Text>

          <InfoRow
            icon="phone"
            label={t.phone}
            value={farmer?.phone ?? "—"}
            editable={false}
          />
          <InfoRow
            icon="mail"
            label="Email"
            value={email}
            editable={editing}
            onChange={setEmail}
            placeholder="Enter your email"
          />
          <InfoRow
            icon="map-pin"
            label={t.village}
            value={village}
            editable={editing}
            onChange={setVillage}
            placeholder={t.villagePlaceholder}
          />
          <InfoRow
            icon="navigation"
            label={t.district}
            value={district}
            editable={editing}
            onChange={setDistrict}
            placeholder={t.districtPlaceholder}
          />
          <InfoRow
            icon="map"
            label="State"
            value={state}
            editable={editing}
            onChange={setState}
            placeholder="Enter your state"
          />
          {editing && (
            <InfoRow
              icon="home"
              label="Farm Name"
              value={farmName}
              editable={true}
              onChange={setFarmName}
              placeholder="Your farm's name"
            />
          )}
        </View>

        {/* App Information Pressable Card */}
        <Pressable
          style={styles.appInfoCard}
          onPress={() => Alert.alert("Upcheck-Dairy", "Version 1.0.0")}
        >
          <View style={styles.infoIconWrap}>
            <Feather name="info" size={16} color="#16a34a" />
          </View>
          <View style={styles.appInfoContent}>
            <Text style={styles.appInfoTitle}>
              {language === "ta" ? "பயன்பாட்டு தகவல்" : language === "hi" ? "ऐप जानकारी" : "APP INFORMATION"}
            </Text>
            <Text style={styles.appInfoSubtitle}>Version 1.0.0 • Terms & Privacy</Text>
          </View>
          <Feather name="chevron-right" size={16} color="#9ca3af" />
        </Pressable>

        {/* Logout Pressable Card */}
        {farmer ? (
          <Pressable style={styles.logoutCard} onPress={handleLogout}>
            <View style={styles.logoutIconWrap}>
              <Feather name="log-out" size={16} color="#ef4444" />
            </View>
            <Text style={styles.logoutCardText}>{t.logout}</Text>
            <Feather name="chevron-right" size={16} color="#ef4444" />
          </Pressable>
        ) : (
          <Pressable
            style={styles.loginCard}
            onPress={() => router.push("/(auth)/login")}
          >
            <View style={[styles.infoIconWrap, { backgroundColor: "#dcfce7" }]}>
              <Feather name="log-in" size={16} color="#16a34a" />
            </View>
            <Text style={styles.loginCardText}>{t.login} / {t.signup}</Text>
            <Feather name="chevron-right" size={16} color="#16a34a" />
          </Pressable>
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
      </View>
    </ScrollView>
  );
}

interface InfoRowProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (v: string) => void;
  placeholder?: string;
}

function InfoRow({ icon, label, value, editable, onChange, placeholder }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Feather name={icon} size={16} color="#16a34a" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        {editable && onChange ? (
          <TextInput
            style={styles.infoInput}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
          />
        ) : (
          <Text style={styles.infoValue}>{value || "—"}</Text>
        )}
      </View>
      {!editable && <Feather name="chevron-right" size={16} color="#9ca3af" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { paddingBottom: 40 },
  topSection: {
    backgroundColor: "#ffffff",
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#16a34a",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  editBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  profileCard: {
    flexDirection: "row",
    paddingHorizontal: 16,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 32, fontWeight: "800", color: "#fff" },
  profileInfo: {
    flex: 1,
    paddingLeft: 16,
    gap: 4,
  },
  farmerName: { fontSize: 22, fontWeight: "700", color: "#111827" },
  nameInput: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    borderBottomWidth: 1.5,
    borderBottomColor: "#16a34a",
    paddingVertical: 2,
    maxWidth: "90%",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  roleText: { fontSize: 11, color: "#15803d", fontWeight: "600" },
  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  smallText: { fontSize: 13, color: "#4b5563" },
  farmCard: {
    width: 80,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  farmCount: { fontSize: 20, fontWeight: "800", color: "#111827", marginTop: 4 },
  farmText: { fontSize: 12, color: "#4b5563" },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#15803d",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  langRow: { flexDirection: "row", gap: 10 },
  langChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  langChipActive: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  langChipInactive: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
  },
  langChipText: { fontSize: 14, fontWeight: "600" },
  langChipActiveText: { color: "#ffffff" },
  langChipInactiveText: { color: "#374151" },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statNum: { fontSize: 18, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 10, fontWeight: "700", color: "#15803d", marginTop: 2, textAlign: "center" },
  statSub: { fontSize: 9, color: "#9ca3af", marginTop: 1, textAlign: "center" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: { flex: 1, paddingLeft: 12 },
  infoLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: "700", color: "#1f2937" },
  infoInput: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    borderBottomWidth: 1,
    borderBottomColor: "#16a34a",
    paddingVertical: 0,
  },
  appInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  appInfoContent: {
    flex: 1,
    paddingLeft: 12,
  },
  appInfoTitle: { fontSize: 12, fontWeight: "700", color: "#15803d", letterSpacing: 0.5 },
  appInfoSubtitle: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  logoutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutCardText: { flex: 1, fontSize: 15, fontWeight: "700", color: "#ef4444", paddingLeft: 12 },
  loginCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  loginCardText: { flex: 1, fontSize: 15, fontWeight: "700", color: "#16a34a", paddingLeft: 12 },
  footer: { alignItems: "center", marginTop: 12, marginBottom: 20 },
  footerText: { color: "#9ca3af", fontSize: 12, textAlign: "center", paddingHorizontal: 20 },
});

import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFarmer } from "@/context/FarmerContext";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGE_NAMES, type Language } from "@/context/LanguageContext";
import { useApp } from "@/context/AppContext";

export default function ProfileScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { farmer, updateProfile, logout } = useFarmer();
  const { animals } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(farmer?.name ?? "");
  const [village, setVillage] = useState(farmer?.village ?? "");
  const [district, setDistrict] = useState(farmer?.district ?? "");
  const [farmName, setFarmName] = useState(farmer?.farmName ?? "");

  const langs: Language[] = ["ta", "en", "hi"];

  const handleSave = async () => {
    await updateProfile({ name, village, district, farmName });
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#16a34a" />
        </Pressable>
        <Text style={styles.headerTitle}>{t.profile}</Text>
        <Pressable
          style={styles.editBtn}
          onPress={() => (editing ? handleSave() : setEditing(true))}
        >
          <Feather name={editing ? "check" : "edit-2"} size={18} color="#fff" />
          <Text style={styles.editBtnText}>
            {editing ? t.saveProfile : t.editProfile}
          </Text>
        </Pressable>
      </View>

      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: farmer?.avatarColor ?? "#16a34a" }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
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
        <Text style={styles.memberSince}>
          {language === "ta" ? "உறுப்பினர் " : language === "hi" ? "सदस्य " : "Member since "}
          {memberSince}
        </Text>
        {farmer?.farmName ? (
          <View style={styles.farmBadge}>
            <Feather name="home" size={13} color="#16a34a" />
            <Text style={styles.farmBadgeText}>{farmer.farmName}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#dcfce7" }]}>
          <Text style={styles.statNum}>{animals.length}</Text>
          <Text style={styles.statLabel}>{t.totalAnimals}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}>
          <Text style={styles.statNum}>{healthyCows}</Text>
          <Text style={styles.statLabel}>{t.healthy}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#fef3c7" }]}>
          <Text style={styles.statNum}>{attentionCows}</Text>
          <Text style={styles.statLabel}>{t.attention}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {language === "ta" ? "தனிப்பட்ட விவரங்கள்" : language === "hi" ? "व्यक्तिगत जानकारी" : "Personal Details"}
        </Text>

        <InfoRow
          icon="phone"
          label={t.phone}
          value={farmer?.phone ?? "—"}
          editable={false}
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

        {editing ? (
          <InfoRow
            icon="home"
            label="Farm Name"
            value={farmName}
            editable={true}
            onChange={setFarmName}
            placeholder="Your farm's name"
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.language}</Text>
        <View style={styles.langRow}>
          {langs.map((l) => (
            <Pressable
              key={l}
              style={[styles.langChip, language === l && styles.langChipActive]}
              onPress={() => setLanguage(l)}
            >
              <Text style={[styles.langChipText, language === l && styles.langChipActiveText]}>
                {LANGUAGE_NAMES[l]}
              </Text>
              {language === l && (
                <Feather name="check" size={14} color="#fff" style={{ marginLeft: 4 }} />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {language === "ta" ? "பயன்பாட்டு தகவல்" : language === "hi" ? "ऐप जानकारी" : "App Info"}
        </Text>
        <InfoRow icon="tag" label="Version" value="1.0.0" editable={false} />
        <InfoRow icon="shield" label="Data" value="Stored on device" editable={false} />
        <InfoRow icon="globe" label="AI" value="OpenAI GPT + Whisper" editable={false} />
      </View>

      {farmer ? (
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>{t.logout}</Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.loginBtn}
          onPress={() => router.push("/(auth)/login")}
        >
          <Feather name="log-in" size={18} color="#fff" />
          <Text style={styles.loginBtnText}>{t.login} / {t.signup}</Text>
        </Pressable>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fefce8" },
  content: { paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 56,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1a2e05" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#16a34a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  avatarSection: { alignItems: "center", paddingVertical: 20, gap: 8 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: { fontSize: 32, fontWeight: "800", color: "#fff" },
  farmerName: { fontSize: 24, fontWeight: "800", color: "#1a2e05" },
  nameInput: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a2e05",
    borderBottomWidth: 2,
    borderBottomColor: "#16a34a",
    paddingVertical: 4,
    paddingHorizontal: 8,
    textAlign: "center",
    minWidth: 160,
  },
  memberSince: { fontSize: 13, color: "#6b7280" },
  farmBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  farmBadgeText: { fontSize: 13, color: "#16a34a", fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
  },
  statNum: { fontSize: 24, fontWeight: "800", color: "#1a2e05" },
  statLabel: { fontSize: 11, color: "#4d7c0f", fontWeight: "600", marginTop: 2 },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4d7c0f",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0fdf4",
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: "600", color: "#1a2e05" },
  infoInput: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a2e05",
    borderBottomWidth: 1.5,
    borderBottomColor: "#16a34a",
    paddingVertical: 2,
  },
  langRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  langChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
  },
  langChipActive: { backgroundColor: "#16a34a" },
  langChipText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  langChipActiveText: { color: "#fff" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#fecaca",
    backgroundColor: "#fff5f5",
  },
  logoutText: { color: "#ef4444", fontSize: 16, fontWeight: "700" },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#16a34a",
  },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footer: { alignItems: "center", marginTop: 24 },
  footerText: { color: "#9ca3af", fontSize: 12, textAlign: "center", paddingHorizontal: 20 },
});

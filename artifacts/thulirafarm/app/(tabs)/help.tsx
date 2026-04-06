import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as Speech from "expo-speech";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { diagnoseSymptoms, type DiagnoseResponse } from "@/services/api";

const SYMPTOMS = [
  { id: "fever", label: "காய்ச்சல்", english: "Fever", icon: "thermometer" },
  { id: "notEating", label: "சாப்பிடவில்லை", english: "Not Eating", icon: "x-circle" },
  { id: "lessMilk", label: "குறைந்த பால்", english: "Less Milk", icon: "droplet" },
  { id: "limping", label: "கால் வலி", english: "Limping", icon: "activity" },
  { id: "diarrhea", label: "வயிற்றுப்போக்கு", english: "Diarrhea", icon: "alert-triangle" },
  { id: "bloating", label: "வயிறு வீக்கம்", english: "Bloating", icon: "circle" },
  { id: "coughing", label: "இருமல்", english: "Coughing", icon: "wind" },
  { id: "eyeDischarge", label: "கண் சொறிவு", english: "Eye Discharge", icon: "eye" },
  { id: "injury", label: "காயம்", english: "Injury", icon: "scissors" },
  { id: "inHeat", label: "ஈட்டிலிருக்கிறது", english: "In Heat", icon: "heart" },
];

const EMERGENCY_CONTACTS = [
  { name: "கால்நடை மருத்துவர் (Vet Helpline)", phone: "1962", icon: "phone" },
  { name: "Tamil Nadu Animal Husbandry", phone: "044-25254250", icon: "phone-call" },
  { name: "Animal Ambulance", phone: "1800-419-0028", icon: "truck" },
];

const RISK_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#f97316",
  high: "#ef4444",
  critical: "#dc2626",
};

const RISK_LABELS: Record<string, string> = {
  low: "குறைந்த ஆபத்து",
  medium: "நடுத்தர ஆபத்து",
  high: "அதிக ஆபத்து",
  critical: "அவசர நிலை!",
};

export default function HelpTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { animals } = useApp();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState("");
  const [diagnosis, setDiagnosis] = useState<DiagnoseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const toggleSymptom = (id: string) => {
    Haptics.selectionAsync();
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setDiagnosis(null);
  };

  const handleDiagnose = async () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert("அறிகுறி தேர்வு", "ஒரு அறிகுறியையாவது தேர்வு செய்யவும்");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    setDiagnosis(null);

    const selectedAnimal = animals.find((a) => a.id === selectedAnimalId);

    try {
      const result = await diagnoseSymptoms({
        symptoms: selectedSymptoms,
        customNote: customNote || undefined,
        animalName: selectedAnimal?.name,
        animalType: selectedAnimal?.type,
      });
      setDiagnosis(result);

      if (result.tamilAdvice) {
        setTimeout(() => speakTamil(result.tamilAdvice), 500);
      }
    } catch {
      Alert.alert(
        "நெட்வொர்க் பிழை",
        "AI நோயறிதல் கிடைக்கவில்லை. இணைப்பை சரிபாருங்கள்."
      );
    } finally {
      setLoading(false);
    }
  };

  const speakTamil = async (text: string) => {
    try {
      if (await Speech.isSpeakingAsync()) {
        await Speech.stop();
        setIsSpeaking(false);
        return;
      }
      setIsSpeaking(true);
      await Speech.speak(text, {
        language: "ta-IN",
        pitch: 1.0,
        rate: 0.85,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch {
      setIsSpeaking(false);
    }
  };

  const riskColor = diagnosis ? (RISK_COLORS[diagnosis.riskLevel] ?? colors.warning) : colors.warning;

  const cowAnimals = animals.filter((a) => a.type !== "calf");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          பிரச்சனை & உதவி
        </Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          Problems & Help
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: isWeb ? 120 : 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pulsing SOS Button */}
        <View style={styles.sosContainer}>
          <Animated.View
            style={[
              styles.sosPulse,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseOpacity,
                backgroundColor: colors.destructive,
              },
            ]}
          />
          <Pressable
            style={[styles.sosButton, { backgroundColor: colors.destructive }]}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert(
                "அவசர உதவி / Emergency",
                "கால்நடை மருத்துவர் helpline-ஐ அழைக்கவுமா?",
                [
                  { text: "ரத்து", style: "cancel" },
                  {
                    text: "அழை (1962)",
                    style: "destructive",
                    onPress: () => Linking.openURL("tel:1962"),
                  },
                ]
              );
            }}
          >
            <Feather name="alert-octagon" size={36} color="#fff" />
            <Text style={styles.sosText}>ஏதாவது தவறா?</Text>
            <Text style={styles.sosSub}>Something Wrong?</Text>
          </Pressable>
        </View>

        {/* Animal selector */}
        {cowAnimals.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              எந்த மாடு? (விருப்பம்)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 8 }}>
              {cowAnimals.map((a) => (
                <Pressable
                  key={a.id}
                  style={[
                    styles.animalChip,
                    {
                      backgroundColor: selectedAnimalId === a.id ? colors.primary : colors.muted,
                      borderColor: selectedAnimalId === a.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedAnimalId(selectedAnimalId === a.id ? null : a.id)}
                >
                  <Text style={{ fontSize: 16 }}>{a.type === "buffalo" ? "🐃" : "🐄"}</Text>
                  <Text style={[styles.animalChipLabel, { color: selectedAnimalId === a.id ? "#fff" : colors.foreground }]}>
                    {a.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Symptom Grid */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>
          அறிகுறிகள் தேர்வு / Select Symptoms
        </Text>
        <View style={styles.symptomsGrid}>
          {SYMPTOMS.map((s) => {
            const selected = selectedSymptoms.includes(s.id);
            return (
              <Pressable
                key={s.id}
                style={[
                  styles.symptomChip,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => toggleSymptom(s.id)}
              >
                <Feather
                  name={s.icon as any}
                  size={20}
                  color={selected ? "#fff" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.symptomLabel,
                    { color: selected ? "#fff" : colors.foreground },
                  ]}
                >
                  {s.label}
                </Text>
                <Text
                  style={[
                    styles.symptomSub,
                    { color: selected ? "rgba(255,255,255,0.8)" : colors.mutedForeground },
                  ]}
                >
                  {s.english}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          style={[
            styles.noteInput,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
              color: colors.foreground,
            },
          ]}
          value={customNote}
          onChangeText={setCustomNote}
          placeholder="கூடுதல் குறிப்புகள்... (விருப்பம்) / Additional notes..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={2}
        />

        <Pressable
          style={[
            styles.diagnoseBtn,
            {
              backgroundColor: selectedSymptoms.length > 0 && !loading ? colors.primary : colors.muted,
            },
          ]}
          onPress={handleDiagnose}
          disabled={selectedSymptoms.length === 0 || loading}
        >
          {loading ? (
            <Text style={[styles.diagnoseBtnText, { color: "#fff" }]}>
              AI பகுப்பாய்கிறது...
            </Text>
          ) : (
            <>
              <Feather
                name="cpu"
                size={18}
                color={selectedSymptoms.length > 0 ? "#fff" : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.diagnoseBtnText,
                  { color: selectedSymptoms.length > 0 ? "#fff" : colors.mutedForeground },
                ]}
              >
                AI ஆலோசனை பெறவும்
              </Text>
            </>
          )}
        </Pressable>

        {/* Diagnosis Result Card */}
        {diagnosis && (
          <View
            style={[
              styles.diagnosisCard,
              {
                backgroundColor: colors.card,
                borderColor: riskColor,
                borderLeftWidth: 5,
              },
            ]}
          >
            <View style={[styles.diagnosisHeader, { borderBottomColor: colors.border }]}>
              <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
                <Text style={styles.riskText}>{RISK_LABELS[diagnosis.riskLevel] ?? diagnosis.riskLevel}</Text>
              </View>
              <Pressable
                style={[styles.speakBtn, { backgroundColor: isSpeaking ? colors.primary : colors.muted, borderColor: colors.border }]}
                onPress={() => speakTamil(diagnosis.tamilAdvice)}
              >
                <Feather name={isSpeaking ? "volume-x" : "volume-2"} size={16} color={isSpeaking ? "#fff" : colors.primary} />
                <Text style={[styles.speakBtnText, { color: isSpeaking ? "#fff" : colors.primary }]}>
                  {isSpeaking ? "நிறுத்து" : "கேளு"}
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.diagnosisTamil, { color: colors.foreground }]}>
              {diagnosis.tamilAdvice}
            </Text>

            {diagnosis.possibleCauses.length > 0 && (
              <View style={styles.causeBlock}>
                <Text style={[styles.causeTitle, { color: colors.mutedForeground }]}>சாத்தியமான காரணங்கள்:</Text>
                {diagnosis.possibleCauses.map((c, i) => (
                  <Text key={i} style={[styles.causeItem, { color: colors.foreground }]}>• {c}</Text>
                ))}
              </View>
            )}

            {diagnosis.immediateActions.length > 0 && (
              <View style={[styles.causeBlock, { backgroundColor: colors.muted, borderRadius: 10, padding: 10 }]}>
                <Text style={[styles.causeTitle, { color: colors.primary }]}>உடனடி நடவடிக்கை:</Text>
                {diagnosis.immediateActions.map((a, i) => (
                  <Text key={i} style={[styles.causeItem, { color: colors.foreground }]}>
                    {i + 1}. {a}
                  </Text>
                ))}
              </View>
            )}

            {diagnosis.medicine && (
              <View style={[styles.medicineRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="activity" size={14} color={colors.primary} />
                <Text style={[styles.medicineText, { color: colors.foreground }]}>{diagnosis.medicine}</Text>
              </View>
            )}

            {diagnosis.homeRemedy && (
              <View style={[styles.medicineRow, { backgroundColor: "#fef9c3", borderColor: "#fde047" }]}>
                <Feather name="home" size={14} color="#ca8a04" />
                <Text style={[styles.medicineText, { color: "#78350f" }]}>{diagnosis.homeRemedy}</Text>
              </View>
            )}

            {diagnosis.nextSteps && (
              <Text style={[styles.nextSteps, { color: colors.mutedForeground }]}>
                🕐 {diagnosis.nextSteps}
              </Text>
            )}

            {diagnosis.callVetImmediately && (
              <Pressable
                style={[styles.callVetBtn, { backgroundColor: colors.destructive }]}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  Linking.openURL("tel:1962");
                }}
              >
                <Feather name="phone" size={18} color="#fff" />
                <Text style={styles.callVetText}>உடனே மருத்துவர் அழைக்கவும் — 1962</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Emergency Contacts */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>
          அவசர தொடர்பு / Emergency Contacts
        </Text>
        {EMERGENCY_CONTACTS.map((c) => (
          <Pressable
            key={c.phone}
            style={[
              styles.contactRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Linking.openURL(`tel:${c.phone}`);
            }}
          >
            <View style={[styles.contactIcon, { backgroundColor: colors.destructive + "18" }]}>
              <Feather name={c.icon as any} size={18} color={colors.destructive} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactName, { color: colors.foreground }]}>{c.name}</Text>
              <Text style={[styles.contactPhone, { color: colors.destructive }]}>{c.phone}</Text>
            </View>
            <Feather name="phone-outgoing" size={18} color={colors.destructive} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  sosContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    height: 160,
  },
  sosPulse: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  sosButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  sosText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  sosSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    textAlign: "center",
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  animalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  animalChipLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  symptomsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  symptomChip: {
    width: "47%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
    minHeight: 80,
  },
  symptomLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  symptomSub: {
    fontSize: 11,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginTop: 4,
    minHeight: 60,
    textAlignVertical: "top",
  },
  diagnoseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
    marginTop: 4,
  },
  diagnoseBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  diagnosisCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  diagnosisHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  riskBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  riskText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  speakBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  speakBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  diagnosisTamil: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 24,
  },
  causeBlock: {
    gap: 4,
  },
  causeTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  causeItem: {
    fontSize: 14,
    lineHeight: 22,
  },
  medicineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  medicineText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  nextSteps: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
  callVetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
  },
  callVetText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  contactIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  contactName: {
    fontSize: 14,
    fontWeight: "500",
  },
  contactPhone: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
});

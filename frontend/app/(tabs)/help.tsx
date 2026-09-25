import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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

import GauGuruChat from "@/components/GauGuruChat";
import { useAnimals } from "../../src/modules/animals/hooks/useAnimals";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { diagnoseSymptoms, type DiagnoseResponse } from "@/services/api";

type HelpSubTab = "diagnose" | "gauguru" | "emergency";

type Symptom = { id: string; icon: string; english: string; labels: Record<string, string> };

const SYMPTOMS: Symptom[] = [
  { id: "fever", icon: "thermometer", english: "Fever", labels: { ta: "காய்ச்சல்", te: "జ్వరం", kn: "ಜ್ವರ", ml: "പനി", hi: "बुखार", en: "Fever" } },
  { id: "notEating", icon: "x-circle", english: "Not Eating", labels: { ta: "சாப்பிடவில்லை", te: "తినడం లేదు", kn: "ತಿನ್ನುತ್ತಿಲ್ಲ", ml: "തിന്നുന്നില്ല", hi: "खाना नहीं", en: "Not Eating" } },
  { id: "lessMilk", icon: "droplet", english: "Less Milk", labels: { ta: "குறைந்த பால்", te: "పాలు తక్కువ", kn: "ಹಾಲು ಕಡಿಮೆ", ml: "പാൽ കുറവ്", hi: "कम दूध", en: "Less Milk" } },
  { id: "limping", icon: "activity", english: "Limping", labels: { ta: "கால் வலி", te: "కుంటుతోంది", kn: "ಕುಂಟುತ್ತಿದೆ", ml: "മുടന്ത്", hi: "लंगड़ापन", en: "Limping" } },
  { id: "diarrhea", icon: "alert-triangle", english: "Diarrhea", labels: { ta: "வயிற்றுப்போக்கு", te: "విరేచనాలు", kn: "ಅತಿಸಾರ", ml: "വയറിളക്കം", hi: "दस्त", en: "Diarrhea" } },
  { id: "bloating", icon: "circle", english: "Bloating", labels: { ta: "வயிறு வீக்கம்", te: "ఉబ్బరం", kn: "ಉಬ್ಬರ", ml: "വയർ വീക്കം", hi: "पेट फूलना", en: "Bloating" } },
  { id: "coughing", icon: "wind", english: "Coughing", labels: { ta: "இருமல்", te: "దగ్గు", kn: "ಕೆಮ್ಮು", ml: "ചുമ", hi: "खाँसी", en: "Coughing" } },
  { id: "eyeDischarge", icon: "eye", english: "Eye Discharge", labels: { ta: "கண் சொறிவு", te: "కంటి స్రావం", kn: "ಕಣ್ಣು ಸ್ರಾವ", ml: "കണ്ണ് ഡിസ്ചാർജ്", hi: "आँख स्राव", en: "Eye Discharge" } },
  { id: "injury", icon: "scissors", english: "Injury", labels: { ta: "காயம்", te: "గాయం", kn: "ಗಾಯ", ml: "മുറിവ്", hi: "चोट", en: "Injury" } },
  { id: "inHeat", icon: "heart", english: "In Heat", labels: { ta: "ஈட்டிலிருக்கிறது", te: "వేడిలో ఉంది", kn: "ಉಷ್ಣದಲ್ಲಿದೆ", ml: "ചൂടിലാണ്", hi: "गर्मी में", en: "In Heat" } },
];

const EMERGENCY_CONTACTS = [
  { name: "கால்நடை மருத்துவர் (Vet Helpline)", phone: "1962", icon: "phone", desc: "24/7 National Helpline" },
  { name: "Tamil Nadu Animal Husbandry", phone: "044-25254250", icon: "phone-call", desc: "Office hours" },
  { name: "Animal Ambulance", phone: "1800-419-0028", icon: "truck", desc: "Free service" },
  { name: "NABARD Dairy Helpline", phone: "1800-22-3021", icon: "home", desc: "Loan & scheme queries" },
];

const RISK_COLORS: Record<string, string> = {
  low: "#22c55e", medium: "#f97316", high: "#ef4444", critical: "#dc2626",
};

const RISK_LABELS_MULTI: Record<string, Record<string, string>> = {
  ta: { low: "குறைந்த ஆபத்து", medium: "நடுத்தர ஆபத்து", high: "அதிக ஆபத்து", critical: "அவசர நிலை!" },
  te: { low: "తక్కువ ప్రమాదం", medium: "మధ్యస్థ ప్రమాదం", high: "అధిక ప్రమాదం", critical: "అత్యవసరం!" },
  kn: { low: "ಕಡಿಮೆ ಅಪಾಯ", medium: "ಮಧ್ಯಮ ಅಪಾಯ", high: "ಹೆಚ್ಚಿನ ಅಪಾಯ", critical: "ತುರ್ತು!" },
  ml: { low: "കുറഞ്ഞ അപകടം", medium: "മധ്യ അപകടം", high: "ഉയർന്ന അപകടം", critical: "അടിയന്തര!" },
  hi: { low: "कम जोखिम", medium: "मध्यम जोखिम", high: "उच्च जोखिम", critical: "अत्यावश्यक!" },
  en: { low: "Low Risk", medium: "Moderate Risk", high: "High Risk", critical: "Critical!" },
};

const FIRST_AID_MULTI: Record<string, string[]> = {
  ta: ["மாடு விழுந்தால் — தண்ணீர் தடவி, நிழல் பக்கம் வை, vet அழை", "வீக்கம் — இடது பக்கம் திருப்பி, நடக்க வை, தண்ணீர்", "குட்டி போடும் — தலை வரும்படி சரிபாருங்கள், vet அழை", "பால் காய்ந்தால் — சூடான ஒத்தடம், vet அழை"],
  te: ["ఆవు పడిపోతే — నీళ్ళు, నీడ, వెంటనే వైద్యుని పిలవండి", "ఉబ్బరం — ఎడమకు తిప్పి, నడిపించి, వైద్యుని పిలవండి", "కష్టమైన ప్రసవం — దూడ స్థానం చూడండి, వైద్యుని పిలవండి", "మాస్టిటిస్ — వేడి కంప్రెస్, తరచుగా పిండండి"],
  kn: ["ಹಸು ಬಿದ್ದರೆ — ನೀರು, ನೆರಳು, ಪಶು ವೈದ್ಯರನ್ನು ಕರೆಯಿರಿ", "ಉಬ್ಬರ — ಎಡಕ್ಕೆ ತಿರುಗಿ, ನಡೆಸಿ, ವೈದ್ಯರನ್ನು ಕರೆಯಿರಿ", "ಕಷ್ಟಕರ ಹೆರಿಗೆ — ಕರು ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ, ವೈದ್ಯರನ್ನು ಕರೆಯಿರಿ", "ಮಾಸ್ಟಿಟಿಸ್ — ಬಿಸಿ ಸಂಕ್ಷೇಪಣ, ಹಾಲು ಹಿಂಡಿ"],
  ml: ["പശു വീണാൽ — വെള്ളം, നിഴൽ, ഡോക്ടറെ വിളിക്കൂ", "വയർ വീക്കം — ഇടതുവശം, നടത്തൂ, ഡോക്ടർ", "ബുദ്ധിമുട്ടുള്ള ഈനൽ — കിടാവ് നില പരിശോധിക്കൂ, ഡോക്ടർ", "മാസ്റ്റൈറ്റിസ് — ചൂടൻ കംപ്രസ്, പാൽ കറക്കൂ"],
  hi: ["गाय गिर जाए — पानी, छाया, तुरंत डॉक्टर बुलाएं", "पेट फूलना — बाईं तरफ घुमाएं, चलाएं, पानी दें", "मुश्किल ब्याह — बछड़े की स्थिति देखें, डॉक्टर बुलाएं", "मास्टाइटिस — गर्म सेक, बार-बार दूध दुहें"],
  en: ["Cow down — water, shade, call vet immediately", "Bloat — turn left, walk, water, call vet", "Difficult calving — check calf position, call vet", "Mastitis — hot compress, milk frequently, call vet"],
};

export default function HelpTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { animals } = useAnimals();
  const { language, t } = useLanguage();
  const [subTab, setSubTab] = useState<HelpSubTab>("diagnose");
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

  // Small helper for inline multilingual records
  const lx = (r: Record<string, string>) => r[language] ?? r.en ?? "";

  const SUB_TABS: Array<{ id: HelpSubTab; iconName: keyof typeof Feather.glyphMap; label: string }> = [
    { id: "diagnose", iconName: "activity", label: t.diagnoseTab },
    { id: "gauguru", iconName: "cpu", label: t.gauguruTab },
    { id: "emergency", iconName: "alert-octagon", label: t.emergencyTab },
  ];

  const riskLabels = RISK_LABELS_MULTI[language] ?? RISK_LABELS_MULTI.en!;
  const firstAidTips = FIRST_AID_MULTI[language] ?? FIRST_AID_MULTI.en!;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const toggleSymptom = (id: string) => {
    Haptics.selectionAsync();
    setSelectedSymptoms((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
    setDiagnosis(null);
  };

  const handleDiagnose = async () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert(t.symptoms, lx({ ta: "ஒரு அறிகுறியையாவது தேர்வு செய்யவும்", te: "కనీసం ఒక లక్షణం ఎంచుకోండి", kn: "ಕನಿಷ್ಠ ಒಂದು ಲಕ್ಷಣ ಆರಿಸಿ", ml: "ഒരു ലക്ഷണമെങ്കിലും തിരഞ്ഞെടുക്കൂ", hi: "कम से कम एक लक्षण चुनें", en: "Please select at least one symptom" }));
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
      if (result.tamilAdvice) setTimeout(() => speakDiagnosis(result.tamilAdvice), 500);
    } catch {
      Alert.alert(t.error, lx({ ta: "AI நோயறிதல் கிடைக்கவில்லை", te: "AI రోగ నిర్ధారణ అందుబాటులో లేదు", kn: "AI ರೋಗ ನಿರ್ಣಯ ಲಭ್ಯವಿಲ್ಲ", ml: "AI രോഗ നിർണ്ണയം ലഭ്യമല്ല", hi: "AI निदान उपलब्ध नहीं", en: "Diagnosis unavailable. Check connection." }));
    } finally {
      setLoading(false);
    }
  };

  const speakDiagnosis = async (text: string) => {
    try {
      if (await Speech.isSpeakingAsync()) { await Speech.stop(); setIsSpeaking(false); return; }
      setIsSpeaking(true);
      const langCode = language === "ta" ? "ta-IN" : language === "hi" ? "hi-IN" : "en-IN";
      await Speech.speak(text, { language: langCode, pitch: 1.0, rate: 0.85, onDone: () => setIsSpeaking(false), onError: () => setIsSpeaking(false) });
    } catch { setIsSpeaking(false); }
  };

  const riskColor = diagnosis ? (RISK_COLORS[diagnosis.riskLevel] ?? colors.warning) : colors.warning;
  const cowAnimals = animals.filter((a) => a.type !== "calf");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {t.helpTitle}
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {t.aiDairyAssistant}
            </Text>
          </View>
          {subTab === "emergency" && (
            <Pressable
              style={styles.sosSmallBtn}
              onPress={() => Linking.openURL("tel:1962")}
            >
              <Feather name="phone" size={16} color="#fff" />
              <Text style={styles.sosSmallText}>1962</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.subTabRow}>
          {SUB_TABS.map((tab) => {
            const active = subTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[styles.subTab, { borderBottomColor: active ? colors.primary : "transparent" }]}
                onPress={() => { setSubTab(tab.id); Haptics.selectionAsync(); }}
              >
                <Feather name={tab.iconName} size={16} color={active ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.subTabLabel, { color: active ? colors.primary : colors.mutedForeground }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* DIAGNOSE TAB */}
      {subTab === "diagnose" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingBottom: isWeb ? 120 : 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sosContainer}>
            <Animated.View style={[styles.sosPulse, { transform: [{ scale: pulseAnim }], opacity: pulseOpacity, backgroundColor: colors.destructive }]} />
            <Pressable
              style={[styles.sosButton, { backgroundColor: colors.destructive }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                Alert.alert(
                  lx({ ta: "அவசர உதவி", te: "అత్యవసర సహాయం", kn: "ತುರ್ತು ಸಹಾಯ", ml: "അടിയന്തര സഹായം", hi: "आपातकालीन सहायता", en: "Emergency Help" }),
                  lx({ ta: "கால்நடை மருத்துவர் helpline-ஐ அழைக்கவுமா?", te: "పశు వైద్య హెల్ప్‌లైన్ పిలవాలా?", kn: "ಪಶು ವೈದ್ಯ ಹೆಲ್ಪ್‌ಲೈನ್ ಕರೆಯಬೇಕೇ?", ml: "വെറ്ററിനറി ഹെൽപ്‌ലൈൻ വിളിക്കണോ?", hi: "पशु चिकित्सक हेल्पलाइन 1962 पर कॉल करें?", en: "Call Vet Helpline 1962?" }),
                  [
                    { text: t.cancel, style: "cancel" },
                    { text: lx({ ta: "அழை (1962)", te: "పిలవండి (1962)", kn: "ಕರೆಯಿರಿ (1962)", ml: "വിളിക്കൂ (1962)", hi: "कॉल करें (1962)", en: "Call 1962" }), style: "destructive", onPress: () => Linking.openURL("tel:1962") },
                  ]
                );
              }}
            >
              <Feather name="alert-octagon" size={36} color="#fff" />
              <Text style={styles.sosText}>{t.emergencySosBtn}</Text>
              <Text style={styles.sosSub}>{t.emergencySosSub}</Text>
            </Pressable>
          </View>

          {cowAnimals.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {t.whichAnimal}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 8 }}>
                {cowAnimals.map((a) => (
                  <Pressable
                    key={a.id}
                    style={[styles.animalChip, { backgroundColor: selectedAnimalId === a.id ? colors.primary : colors.muted, borderColor: selectedAnimalId === a.id ? colors.primary : colors.border }]}
                    onPress={() => setSelectedAnimalId(selectedAnimalId === a.id ? null : a.id)}
                  >
                    <MaterialCommunityIcons name={a.type === "buffalo" ? "water" : a.type === "calf" ? "baby-bottle" : "cow"} size={20} color={selectedAnimalId === a.id ? "#fff" : colors.foreground} />
                    <Text style={[styles.animalChipLabel, { color: selectedAnimalId === a.id ? "#fff" : colors.foreground }]}>{a.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>
            {t.symptoms}
          </Text>
          <View style={styles.symptomsGrid}>
            {SYMPTOMS.map((s) => {
              const selected = selectedSymptoms.includes(s.id);
              return (
                <Pressable
                  key={s.id}
                  style={[styles.symptomChip, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}
                  onPress={() => toggleSymptom(s.id)}
                >
                  <Feather name={s.icon as any} size={20} color={selected ? "#fff" : colors.mutedForeground} />
                  <Text style={[styles.symptomLabel, { color: selected ? "#fff" : colors.foreground }]}>
                    {s.labels[language] ?? s.labels.en ?? s.english}
                  </Text>
                  <Text style={[styles.symptomSub, { color: selected ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>{s.english}</Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            style={[styles.noteInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
            value={customNote}
            onChangeText={setCustomNote}
            placeholder={t.additionalNotes}
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={2}
          />

          <Pressable
            style={[styles.diagnoseBtn, { backgroundColor: selectedSymptoms.length > 0 && !loading ? colors.primary : colors.muted }]}
            onPress={handleDiagnose}
            disabled={selectedSymptoms.length === 0 || loading}
          >
            {loading ? (
              <Text style={[styles.diagnoseBtnText, { color: "#fff" }]}>{t.diagnosing}</Text>
            ) : (
              <>
                <Feather name="cpu" size={18} color={selectedSymptoms.length > 0 ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.diagnoseBtnText, { color: selectedSymptoms.length > 0 ? "#fff" : colors.mutedForeground }]}>
                  {t.diagnose}
                </Text>
              </>
            )}
          </Pressable>

          {diagnosis && (
            <View style={[styles.diagnosisCard, { backgroundColor: colors.card, borderColor: riskColor, borderLeftWidth: 5 }]}>
              <View style={[styles.diagnosisHeader, { borderBottomColor: colors.border }]}>
                <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
                  <Text style={styles.riskText}>{riskLabels[diagnosis.riskLevel] ?? diagnosis.riskLevel}</Text>
                </View>
                <Pressable
                  style={[styles.speakBtn, { backgroundColor: isSpeaking ? colors.primary : colors.muted, borderColor: colors.border }]}
                  onPress={() => speakDiagnosis(diagnosis.tamilAdvice)}
                >
                  <Feather name={isSpeaking ? "volume-x" : "volume-2"} size={16} color={isSpeaking ? "#fff" : colors.primary} />
                  <Text style={[styles.speakBtnText, { color: isSpeaking ? "#fff" : colors.primary }]}>
                    {isSpeaking ? t.stop : t.speak}
                  </Text>
                </Pressable>
              </View>
              <Text style={[styles.diagnosisTamil, { color: colors.foreground }]}>{diagnosis.tamilAdvice}</Text>
              {diagnosis.possibleCauses.length > 0 && (
                <View style={styles.causeBlock}>
                  <Text style={[styles.causeTitle, { color: colors.mutedForeground }]}>
                    {lx({ ta: "சாத்தியமான காரணங்கள்:", te: "సాధ్యమయ్యే కారణాలు:", kn: "ಸಾಧ್ಯ ಕಾರಣಗಳು:", ml: "സാദ്ധ്യ കാരണങ്ങൾ:", hi: "संभावित कारण:", en: "Possible causes:" })}
                  </Text>
                  {diagnosis.possibleCauses.map((c, i) => <Text key={i} style={[styles.causeItem, { color: colors.foreground }]}>• {c}</Text>)}
                </View>
              )}
              {diagnosis.immediateActions.length > 0 && (
                <View style={[styles.causeBlock, { backgroundColor: colors.muted, borderRadius: 10, padding: 10 }]}>
                  <Text style={[styles.causeTitle, { color: colors.primary }]}>
                    {lx({ ta: "உடனடி நடவடிக்கை:", te: "తక్షణ చర్యలు:", kn: "ತಕ್ಷಣ ಕ್ರಮ:", ml: "ഉടൻ നടപടി:", hi: "तुरंत कदम:", en: "Immediate actions:" })}
                  </Text>
                  {diagnosis.immediateActions.map((a, i) => <Text key={i} style={[styles.causeItem, { color: colors.foreground }]}>{i + 1}. {a}</Text>)}
                </View>
              )}
              {diagnosis.medicine && (
                <View style={[styles.medicineRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Feather name="activity" size={14} color={colors.primary} />
                  <Text style={[styles.medicineText, { color: colors.foreground }]}>{diagnosis.medicine}</Text>
                </View>
              )}
              {diagnosis.homeRemedy && (
                <View style={[styles.medicineRow, { backgroundColor: colors.accent + "15", borderColor: colors.accent + "40" }]}>
                  <Feather name="home" size={14} color={colors.accent} />
                  <Text style={[styles.medicineText, { color: colors.foreground }]}>{diagnosis.homeRemedy}</Text>
                </View>
              )}
              {diagnosis.nextSteps && (
                <View style={styles.nextStepsRow}>
                  <Feather name="clock" size={13} color={colors.mutedForeground} style={{ marginTop: 2 }} />
                  <Text style={[styles.nextSteps, { color: colors.mutedForeground }]}>
                    {diagnosis.nextSteps}
                  </Text>
                </View>
              )}
              {diagnosis.callVetImmediately && (
                <Pressable
                  style={[styles.callVetBtn, { backgroundColor: colors.destructive }]}
                  onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); Linking.openURL("tel:1962"); }}
                >
                  <Feather name="phone" size={18} color="#fff" />
                  <Text style={styles.callVetText}>{t.callVet} — 1962</Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* GAUGURU CHAT TAB */}
      {subTab === "gauguru" && <GauGuruChat />}

      {/* EMERGENCY TAB */}
      {subTab === "emergency" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.sosContainer}>
            <Animated.View style={[styles.sosPulse, { transform: [{ scale: pulseAnim }], opacity: pulseOpacity, backgroundColor: "#dc2626" }]} />
            <Pressable
              style={[styles.sosButton, { backgroundColor: "#dc2626" }]}
              onPress={() => Linking.openURL("tel:1962")}
            >
              <Feather name="alert-octagon" size={36} color="#fff" />
              <Text style={styles.sosText}>{t.callNow}</Text>
              <Text style={[styles.sosSub, { fontSize: 18, fontWeight: "700", color: "#fff" }]}>1962</Text>
            </Pressable>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8, marginBottom: 12 }]}>
            {lx({ ta: "அவசர தொடர்பு", te: "అత్యవసర సంప్రదింపులు", kn: "ತುರ್ತು ಸಂಪರ್ಕಗಳು", ml: "അടിയന്തര ബന്ധ", hi: "आपातकालीन संपर्क", en: "Emergency Contacts" })}
          </Text>
          {EMERGENCY_CONTACTS.map((c) => (
            <Pressable
              key={c.phone}
              style={[styles.contactRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(`tel:${c.phone}`); }}
            >
              <View style={[styles.contactIcon, { backgroundColor: colors.destructive + "18" }]}>
                <Feather name={c.icon as any} size={18} color={colors.destructive} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactName, { color: colors.foreground }]}>{c.name}</Text>
                <Text style={[styles.contactDesc, { color: colors.mutedForeground }]}>{c.desc}</Text>
                <Text style={[styles.contactPhone, { color: colors.destructive }]}>{c.phone}</Text>
              </View>
              <View style={[styles.callBadge, { backgroundColor: colors.destructive + "18" }]}>
                <Feather name="phone-outgoing" size={14} color={colors.destructive} />
                <Text style={[styles.callBadgeText, { color: colors.destructive }]}>
                  {lx({ ta: "அழை", te: "పిలవండి", kn: "ಕರೆಯಿರಿ", ml: "വിളിക്കൂ", hi: "कॉल", en: "Call" })}
                </Text>
              </View>
            </Pressable>
          ))}

          <View style={[styles.firstAidCard, { backgroundColor: colors.card }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
               <Feather name="heart" size={16} color={colors.foreground} />
               <Text style={[styles.firstAidTitle, { color: colors.foreground, marginBottom: 0 }]}>{t.firstAidTips}</Text>
            </View>
            {firstAidTips.map((tip, i) => (
              <View key={i} style={styles.firstAidTip}>
                <Text style={[styles.firstAidNum, { backgroundColor: colors.secondary, color: colors.primary }]}>{i + 1}</Text>
                <Text style={[styles.firstAidText, { color: colors.foreground }]}>{tip}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 0, borderBottomWidth: 1 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: "700" },
  headerSub: { fontSize: 13, marginTop: 2 },
  sosSmallBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#dc2626", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  sosSmallText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  subTabRow: { flexDirection: "row" },
  subTab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderBottomWidth: 2.5,
  },
  subTabLabel: { fontSize: 12, fontWeight: "700" },
  content: { padding: 16, gap: 8 },
  sosContainer: { alignItems: "center", justifyContent: "center", marginVertical: 16, height: 160 },
  sosPulse: { position: "absolute", width: 160, height: 160, borderRadius: 80 },
  sosButton: { width: 140, height: 140, borderRadius: 70, alignItems: "center", justifyContent: "center", gap: 4, shadowColor: "#ef4444", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  sosText: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center" },
  sosSub: { color: "rgba(255,255,255,0.85)", fontSize: 11, textAlign: "center" },
  section: { borderRadius: 12, borderWidth: 1, padding: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  animalChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  animalChipLabel: { fontSize: 14, fontWeight: "600" },
  symptomsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  symptomChip: { width: "47%", padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center", gap: 6, minHeight: 80 },
  symptomLabel: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  symptomSub: { fontSize: 11 },
  noteInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginTop: 4, minHeight: 60, textAlignVertical: "top" },
  diagnoseBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18, borderRadius: 14, marginTop: 4 },
  diagnoseBtnText: { fontSize: 16, fontWeight: "700" },
  diagnosisCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12, marginTop: 4 },
  diagnosisHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottomWidth: 1 },
  riskBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  riskText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  speakBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  speakBtnText: { fontSize: 13, fontWeight: "600" },
  diagnosisTamil: { fontSize: 15, fontWeight: "500", lineHeight: 24 },
  causeBlock: { gap: 4 },
  causeTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  causeItem: { fontSize: 14, lineHeight: 22 },
  medicineRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  medicineText: { flex: 1, fontSize: 13, lineHeight: 20 },
  nextStepsRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  nextSteps: { flex: 1, fontSize: 12, lineHeight: 18, fontStyle: "italic" },
  callVetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 12 },
  callVetText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  contactIcon: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  contactName: { fontSize: 14, fontWeight: "600" },
  contactDesc: { fontSize: 11, marginTop: 1 },
  contactPhone: { fontSize: 18, fontWeight: "700", marginTop: 2 },
  callBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  callBadgeText: { fontSize: 12, fontWeight: "600" },
  firstAidCard: { borderRadius: 16, padding: 16, marginTop: 4, gap: 10 },
  firstAidTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  firstAidTip: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  firstAidNum: { width: 22, height: 22, borderRadius: 11, textAlign: "center", lineHeight: 22, fontSize: 12, fontWeight: "700", flexShrink: 0 },
  firstAidText: { flex: 1, fontSize: 13, lineHeight: 20 },
});

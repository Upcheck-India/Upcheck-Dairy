import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const SYMPTOMS = [
  { id: "fever", label: "காய்ச்சல்", english: "Fever", icon: "thermometer" },
  { id: "notEating", label: "சாப்பிடவில்லை", english: "Not Eating", icon: "x-circle" },
  { id: "lessMilk", label: "குறைந்த பால்", english: "Less Milk", icon: "droplet" },
  { id: "limping", label: "கால் வலி", english: "Limping", icon: "activity" },
  { id: "diarrhea", label: "வயிற்றுப்போக்கு", english: "Diarrhea", icon: "alert-triangle" },
  { id: "bloating", label: "வயிறு வீக்கம்", english: "Bloating", icon: "circle" },
  { id: "coughing", label: "இருமல்", english: "Coughing", icon: "wind" },
  { id: "eyeDischarge", label: "கண் சொறிவு", english: "Eye Discharge", icon: "eye" },
];

const DIAGNOSES: Record<string, { advice: string; tamil: string; severity: string }> = {
  fever: {
    advice: "Check temperature — normal is 38-39°C. Give paracetamol if over 39.5°C. Call vet if no improvement in 12 hours.",
    tamil: "வெப்பநிலை சரிபாருங்கள். 39.5°C அதிகம் ஆனால் மருந்து கொடுங்கள். 12 மணி நேரத்தில் சரியாகவில்லை என்றால்獸医ரை அழைக்கவும்.",
    severity: "attention",
  },
  notEating: {
    advice: "Check for mouth sores or swollen lymph nodes. Offer fresh grass and clean water. Vet if over 24 hours.",
    tamil: "வாயில் புண் இருக்கிறதா பாருங்கள். புதிய புல்லும் தண்ணீரும் கொடுங்கள். 24 மணி நேரத்தில் சாப்பிடவில்லை என்றால் மருத்துவர் அழைக்கவும்.",
    severity: "attention",
  },
  lessMilk: {
    advice: "Check last 3 days milk records. Could be feed change, stress, or mastitis. Check udder for hardness or heat.",
    tamil: "கடந்த 3 நாட்கள் பால் பதிவை சரிபாருங்கள். தீவனம் மாறியதா? மடியில் கடினம் அல்லது வெப்பம் இருக்கிறதா?",
    severity: "attention",
  },
  bloating: {
    advice: "URGENT: Walk the animal slowly for 15 minutes. Do NOT give water. Call vet immediately if distress increases.",
    tamil: "அவசரம்: மாட்டை மெதுவாக 15 நிமிடம் நடக்க வையுங்கள். தண்ணீர் கொடுக்காதீர்கள். உடனே மருத்துவர் அழைக்கவும்.",
    severity: "critical",
  },
  diarrhea: {
    advice: "Give ORS (oral rehydration solution). Reduce green feed. Monitor for blood in stool — if present, call vet.",
    tamil: "ORS கொடுங்கள். பச்சை தீவனம் குறையுங்கள். மலத்தில் ரத்தம் இருந்தால் உடனே மருத்துவர் அழைக்கவும்.",
    severity: "attention",
  },
  limping: {
    advice: "Check hooves for wounds or foreign objects. Clean with antiseptic. Bandage if bleeding. Call vet for swelling.",
    tamil: "குளம்பில் காயம் அல்லது கல் இருக்கிறதா பாருங்கள். antiseptic போடுங்கள். வீக்கம் இருந்தால் மருத்துவர் அழைக்கவும்.",
    severity: "attention",
  },
  coughing: {
    advice: "Check for nasal discharge. Keep in dry shelter. If persistent over 2 days with fever, call vet.",
    tamil: "மூக்கில் சளி இருக்கிறதா பாருங்கள். உலர்ந்த இடத்தில் வையுங்கள். 2 நாட்களுக்கு மேல் காய்ச்சலுடன் இருந்தால் மருத்துவர் அழைக்கவும்.",
    severity: "attention",
  },
  eyeDischarge: {
    advice: "Clean eye with saline solution. Check for foreign objects. Keep away from direct sunlight. Vet if redness persists.",
    tamil: "உப்பு நீரில் கண் சுத்தம் செய்யுங்கள். நேரடி வெயிலை தவிருங்கள். சிவப்பு நீடித்தால் மருத்துவர் அழைக்கவும்.",
    severity: "attention",
  },
};

const EMERGENCY_CONTACTS = [
  { name: "கால்நடை மருத்துவர்", phone: "1962", icon: "phone" },
  { name: "Tamil Nadu Helpline", phone: "044-25254250", icon: "phone-call" },
  { name: "Animal Ambulance", phone: "1800-419-0028", icon: "truck" },
];

export default function HelpTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState("");
  const [diagnosis, setDiagnosis] = useState<typeof DIAGNOSES[string] | null>(null);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const toggleSymptom = (id: string) => {
    Haptics.selectionAsync();
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setDiagnosis(null);
  };

  const handleDiagnose = () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert("அறிகுறி தேர்வு", "ஒரு அறிகுறியையாவது தேர்வு செய்யவும்");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Use most severe symptom
    const urgentSymptom = selectedSymptoms.find(
      (s) => DIAGNOSES[s]?.severity === "critical"
    );
    const primarySymptom = urgentSymptom ?? selectedSymptoms[0];
    setDiagnosis(DIAGNOSES[primarySymptom] ?? DIAGNOSES.fever);
  };

  const severityColor = (s: string) =>
    s === "critical"
      ? colors.destructive
      : s === "attention"
      ? colors.warning
      : colors.success;

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
          அறிகுறி தேர்வு செய்து உதவி பெறவும்
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
        {/* Emergency SOS */}
        <View
          style={[
            styles.sosCard,
            { backgroundColor: colors.destructive, borderRadius: 16 },
          ]}
        >
          <Feather name="alert-octagon" size={24} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.sosTitle}>அவசர உதவி</Text>
            <Text style={styles.sosSub}>தீவிர நிலையில் உடனே அழைக்கவும்</Text>
          </View>
          <Pressable
            style={styles.sosBtn}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Linking.openURL("tel:1962");
            }}
          >
            <Feather name="phone" size={18} color={colors.destructive} />
            <Text style={[styles.sosBtnText, { color: colors.destructive }]}>
              1962
            </Text>
          </Pressable>
        </View>

        {/* Symptom Checker */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          அறிகுறிகள் தேர்வு
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
                  size={18}
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
                    {
                      color: selected
                        ? "rgba(255,255,255,0.8)"
                        : colors.mutedForeground,
                    },
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
          placeholder="கூடுதல் குறிப்புகள்... (விருப்பம்)"
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={2}
        />

        <Pressable
          style={[
            styles.diagnoseBtn,
            {
              backgroundColor:
                selectedSymptoms.length > 0 ? colors.primary : colors.muted,
            },
          ]}
          onPress={handleDiagnose}
          disabled={selectedSymptoms.length === 0}
        >
          <Feather
            name="search"
            size={18}
            color={selectedSymptoms.length > 0 ? "#fff" : colors.mutedForeground}
          />
          <Text
            style={[
              styles.diagnoseBtnText,
              {
                color:
                  selectedSymptoms.length > 0 ? "#fff" : colors.mutedForeground,
              },
            ]}
          >
            ஆலோசனை பெறவும்
          </Text>
        </Pressable>

        {diagnosis && (
          <View
            style={[
              styles.diagnosisCard,
              {
                backgroundColor: colors.card,
                borderColor: severityColor(diagnosis.severity),
                borderLeftWidth: 4,
              },
            ]}
          >
            <View
              style={[
                styles.diagnosisHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Feather
                name="clipboard"
                size={18}
                color={severityColor(diagnosis.severity)}
              />
              <Text
                style={[
                  styles.diagnosisTitle,
                  { color: severityColor(diagnosis.severity) },
                ]}
              >
                {diagnosis.severity === "critical"
                  ? "அவசர நிலை!"
                  : "மருத்துவ ஆலோசனை"}
              </Text>
            </View>
            <Text
              style={[styles.diagnosisTamil, { color: colors.foreground }]}
            >
              {diagnosis.tamil}
            </Text>
            <Text
              style={[styles.diagnosisEnglish, { color: colors.mutedForeground }]}
            >
              {diagnosis.advice}
            </Text>
          </View>
        )}

        {/* Emergency Contacts */}
        <Text
          style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}
        >
          அவசர தொடர்பு
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
            <View
              style={[
                styles.contactIcon,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Feather name={c.icon as any} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactName, { color: colors.foreground }]}>
                {c.name}
              </Text>
              <Text style={[styles.contactPhone, { color: colors.primary }]}>
                {c.phone}
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={18}
              color={colors.mutedForeground}
            />
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
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  sosCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  sosTitle: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  sosSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  sosBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sosBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
    marginBottom: 4,
  },
  symptomsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  symptomChip: {
    width: "47%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  symptomLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  symptomSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    minHeight: 60,
    textAlignVertical: "top",
  },
  diagnoseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  diagnoseBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  diagnosisCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  diagnosisHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  diagnosisTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  diagnosisTamil: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    lineHeight: 22,
  },
  diagnosisEnglish: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  contactName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  contactPhone: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
});

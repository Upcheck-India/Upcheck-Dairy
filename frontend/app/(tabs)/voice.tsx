import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";

export default function VoiceTab() {
  const colors = useColors();
  const { t } = useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primary + "15" }]}>
        <Feather name="mic" size={48} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{t.voiceTitle}</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>{t.voiceSub}</Text>
      <Text style={[styles.hint, { color: colors.mutedForeground }]}>{t.voiceHint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  iconWrap: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  sub: { fontSize: 15, textAlign: "center", marginBottom: 4 },
  hint: { fontSize: 13, textAlign: "center", marginTop: 8, fontStyle: "italic" },
});

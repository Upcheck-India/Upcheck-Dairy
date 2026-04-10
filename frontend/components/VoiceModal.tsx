import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useApp, generateId, getTodayString } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { parseVoiceCommand, transcribeAudio } from "@/services/api";

interface VoiceModalProps {
  visible: boolean;
  onClose: () => void;
}

type Status = "idle" | "recording" | "processing" | "result" | "error";

const SAMPLE_COMMANDS = [
  { text: "லட்சுமி 5 லிட்டர் காலை", label: "பால் பதிவு" },
  { text: "ராணி காய்ச்சல்", label: "உடல்நிலை" },
  { text: "தீவனம் செலவு 500", label: "செலவு" },
  { text: "நிதி பக்கம் செல்", label: "வழிசெலுத்தல்" },
];

const STATUS_MESSAGES: Record<Status, string> = {
  idle: "மேலே உள்ள பொத்தானை அழுத்தவும்",
  recording: "🎙 கேட்கிறேன்... (நிறுத்த மீண்டும் அழுத்தவும்)",
  processing: "⚡ புரிந்துகொள்கிறேன்...",
  result: "",
  error: "⚠ மீண்டும் முயற்சிக்கவும்",
};

export default function VoiceModal({ visible, onClose }: VoiceModalProps) {
  const colors = useColors();
  const { animals, addMilkEntry, addExpenseEntry, addHealthEvent } = useApp();

  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [resultMsg, setResultMsg] = useState("");
  const [textInput, setTextInput] = useState("");

  const recording = useRef<Audio.Recording | null>(null);
  const bgScale = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  const dotsLoop = useRef<Animated.CompositeAnimation | null>(null);

  const isWeb = Platform.OS === "web";

  useEffect(() => {
    if (visible) {
      Animated.spring(bgScale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }).start();
    } else {
      bgScale.setValue(0);
      reset();
    }
  }, [visible]);

  const reset = () => {
    setStatus("idle");
    setTranscript("");
    setResultMsg("");
    setTextInput("");
    stopDotsAnimation();
    if (recording.current) {
      recording.current.stopAndUnloadAsync().catch(() => {});
      recording.current = null;
    }
  };

  const startDotsAnimation = () => {
    const animations = dotAnims.map((anim, i) =>
      Animated.sequence([
        Animated.delay(i * 150),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
          ])
        ),
      ])
    );
    dotsLoop.current = Animated.parallel(animations);
    dotsLoop.current.start();
  };

  const stopDotsAnimation = () => {
    dotsLoop.current?.stop();
    dotAnims.forEach((a) => a.setValue(0));
  };

  const handleMicPress = async () => {
    if (status === "recording") {
      await stopRecording();
    } else if (status === "idle" || status === "error") {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (!isWeb) {
        const { status: perm } = await Audio.requestPermissionsAsync();
        if (perm !== "granted") {
          Alert.alert("அனுமதி தேவை", "மைக்ரோஃபோன் அணுகல் வழங்கவும்");
          return;
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const rec = new Audio.Recording();
        await rec.prepareToRecordAsync({
          android: {
            extension: ".m4a",
            outputFormat: 2,
            audioEncoder: 3,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 64000,
          },
          ios: {
            extension: ".m4a",
            audioQuality: 0x7f,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 64000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: { mimeType: "audio/webm" },
          isMeteringEnabled: false,
          keepAudioActiveHint: false,
        });
        await rec.startAsync();
        recording.current = rec;
      }
      setStatus("recording");
      startDotsAnimation();
    } catch (err) {
      console.error("Start recording error:", err);
      setStatus("error");
    }
  };

  const stopRecording = async () => {
    try {
      stopDotsAnimation();
      setStatus("processing");

      let finalTranscript = "";

      if (!isWeb && recording.current) {
        await recording.current.stopAndUnloadAsync();
        const uri = recording.current.getURI();
        recording.current = null;

        if (uri) {
          try {
            finalTranscript = await transcribeAudio(uri);
          } catch {
            finalTranscript = "";
          }
        }
      }

      if (!finalTranscript) {
        setStatus("error");
        setTranscript("குரல் தெளிவாக கேட்கவில்லை. உரை உள்ளிடவும்.");
        return;
      }

      setTranscript(finalTranscript);
      await parseAndExecute(finalTranscript);
    } catch (err) {
      console.error("Stop recording error:", err);
      setStatus("error");
    }
  };

  const parseAndExecute = async (text: string) => {
    setStatus("processing");
    try {
      const result = await parseVoiceCommand({
        transcript: text,
        animals: animals.map((a) => ({ id: a.id, name: a.name, type: a.type })),
      });

      if (result.action === "unknown" || result.confidence < 0.5) {
        setResultMsg(`புரியவில்லை. "${text}" — மீண்டும் முயற்சிக்கவும்`);
        setStatus("result");
        return;
      }

      const params = result.params;
      const today = getTodayString();

      if (result.action === "log_milk" && params.animalId && params.quantity) {
        addMilkEntry({
          id: generateId(),
          animalId: params.animalId,
          session: params.session ?? "morning",
          quantity: params.quantity,
          date: today,
          timestamp: Date.now(),
        });
        setResultMsg(`✅ ${result.confirmationTamil}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result.action === "report_problem" && params.animalId) {
        addHealthEvent({
          id: generateId(),
          animalId: params.animalId,
          date: today,
          type: "observation",
          description: params.symptom ?? text,
        });
        setResultMsg(`✅ ${result.confirmationTamil}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (result.action === "add_expense" && params.expenseAmount) {
        addExpenseEntry({
          id: generateId(),
          date: today,
          category: (params.expenseCategory as any) ?? "other",
          description: params.expenseDescription ?? text,
          amount: params.expenseAmount,
        });
        setResultMsg(`✅ ${result.confirmationTamil}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result.action === "navigate" && params.tab) {
        router.push(`/(tabs)/${params.tab === "animals" ? "" : params.tab}` as any);
        setResultMsg(`✅ ${result.confirmationTamil}`);
        setTimeout(onClose, 800);
      } else {
        setResultMsg(`✅ ${result.confirmationTamil || result.confirmationText}`);
      }

      setStatus("result");
    } catch (err) {
      console.error("Parse command error:", err);
      setResultMsg("AI சேவை கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்.");
      setStatus("error");
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    setTranscript(textInput.trim());
    await parseAndExecute(textInput.trim());
  };

  const handleSampleCommand = async (text: string) => {
    setTranscript(text);
    setTextInput(text);
    Haptics.selectionAsync();
    await parseAndExecute(text);
  };

  const micColor =
    status === "recording" ? colors.destructive : status === "processing" ? colors.accent : colors.primary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.container, { backgroundColor: colors.card, transform: [{ scale: bgScale }] }]}
        >
          <Pressable style={styles.closeRow} onPress={onClose}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>

          <Text style={[styles.title, { color: colors.foreground }]}>குரல் கட்டளை 🎙</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Tamil or English • {isWeb ? "Type below" : "Speak naturally"}
          </Text>

          {/* Mic button */}
          {!isWeb && (
            <Pressable
              style={[styles.micButton, { backgroundColor: micColor }]}
              onPress={handleMicPress}
              disabled={status === "processing"}
            >
              <Feather
                name={status === "recording" ? "mic-off" : status === "processing" ? "loader" : "mic"}
                size={36}
                color="#fff"
              />
              {status === "recording" && (
                <View style={styles.dotsRow}>
                  {dotAnims.map((anim, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: "#fff",
                          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </Pressable>
          )}

          {/* Status / transcript / result */}
          {status === "result" ? (
            <View style={[styles.transcriptBox, { backgroundColor: colors.secondary }]}>
              {transcript ? (
                <Text style={[styles.transcriptText, { color: colors.mutedForeground }]}>
                  ""{transcript}""
                </Text>
              ) : null}
              <Text style={[styles.resultText, { color: colors.primary }]}>{resultMsg}</Text>
              <Pressable style={[styles.againBtn, { backgroundColor: colors.primary }]} onPress={reset}>
                <Text style={styles.againBtnText}>மீண்டும் சொல்</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {(status !== "idle") && (
                <View style={[styles.transcriptBox, { backgroundColor: colors.muted }]}>
                  {transcript ? (
                    <Text style={[styles.transcriptText, { color: colors.foreground }]}>{transcript}</Text>
                  ) : null}
                  <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                    {STATUS_MESSAGES[status]}
                  </Text>
                </View>
              )}
              {status === "idle" && (
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                  {STATUS_MESSAGES.idle}
                </Text>
              )}
            </>
          )}

          {/* Text input fallback */}
          <View style={[styles.textRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <TextInput
              style={[styles.textInput, { color: colors.foreground }]}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="கட்டளை தட்டச்சு செய்யவும்..."
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="send"
              onSubmitEditing={handleTextSubmit}
            />
            <Pressable
              style={[styles.sendBtn, { backgroundColor: textInput.trim() ? colors.primary : colors.border }]}
              onPress={handleTextSubmit}
              disabled={!textInput.trim()}
            >
              <Feather name="send" size={14} color="#fff" />
            </Pressable>
          </View>

          {/* Sample commands */}
          <Text style={[styles.examplesTitle, { color: colors.mutedForeground }]}>
            உதாரண கட்டளைகள்
          </Text>
          <View style={styles.commandsGrid}>
            {SAMPLE_COMMANDS.map((cmd, i) => (
              <Pressable
                key={i}
                style={[styles.commandChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                onPress={() => handleSampleCommand(cmd.text)}
              >
                <Text style={[styles.commandLabel, { color: colors.primary }]}>{cmd.label}</Text>
                <Text style={[styles.commandText, { color: colors.foreground }]} numberOfLines={2}>
                  "{cmd.text}"
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  container: { width: "100%", maxWidth: 400, borderRadius: 24, padding: 24, alignItems: "center" },
  closeRow: { alignSelf: "flex-end", padding: 4, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 28 },
  micButton: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, marginBottom: 20 },
  dotsRow: { position: "absolute", bottom: 10, flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  transcriptBox: { borderRadius: 12, padding: 14, width: "100%", marginBottom: 14, gap: 8 },
  transcriptText: { fontSize: 13, textAlign: "center", fontStyle: "italic" },
  hintText: { fontSize: 14, textAlign: "center" },
  resultText: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  againBtn: { alignSelf: "center", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginTop: 4 },
  againBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  hint: { fontSize: 14, marginBottom: 14 },
  textRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, width: "100%", marginBottom: 20, gap: 8 },
  textInput: { flex: 1, fontSize: 14, paddingVertical: 8 },
  sendBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  examplesTitle: { fontSize: 13, fontWeight: "600", alignSelf: "flex-start", marginBottom: 10 },
  commandsGrid: { width: "100%", flexDirection: "row", flexWrap: "wrap", gap: 8 },
  commandChip: { width: "47%", borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  commandLabel: { fontSize: 11, fontWeight: "600" },
  commandText: { fontSize: 12 },
});

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
import NetInfo from "@react-native-community/netinfo";

import { useColors } from "@/hooks/useColors";
import { parseVoiceCommand, transcribeAudio, VoiceCommandResponse } from "@/services/api";
import { useLanguage, Language } from "@/context/LanguageContext";
import { useAnimals } from "../src/modules/animals/hooks/useAnimals";
import { useMilk } from "../src/modules/milk/hooks/useMilk";
import { useFinance } from "../src/modules/finance/hooks/useFinance";
import { useHealth } from "../src/modules/health/hooks/useHealth";
import { useFarm } from "../src/modules/farms/hooks/useFarm";

interface VoiceModalProps {
  visible: boolean;
  onClose: () => void;
}

type Status = "idle" | "recording" | "processing" | "result" | "error";

function getConfirmationMessage(result: VoiceCommandResponse, language: Language): string {
  if (language === "ta") {
    return result.confirmationTamil || result.confirmationText;
  }
  return result.confirmationText || result.confirmationTamil;
}

export default function VoiceModal({ visible, onClose }: VoiceModalProps) {
  const colors = useColors();
  const { t, language } = useLanguage();
  const { animals } = useAnimals();
  const { createMilk } = useMilk();
  const { addExpense } = useFinance();
  const { createEvent } = useHealth();
  const { activeFarm } = useFarm();

  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [resultMsg, setResultMsg] = useState("");
  const [textInput, setTextInput] = useState("");

  const recording = useRef<Audio.Recording | null>(null);
  const bgScale = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  const dotsLoop = useRef<Animated.CompositeAnimation | null>(null);

  const isWeb = Platform.OS === "web";

  const sampleCommands = [
    { text: t.voiceSampleMilk, label: t.milkLog },
    { text: t.voiceSampleHealth, label: t.health },
    { text: t.voiceSampleExpense, label: t.expense },
    { text: t.voiceSampleNav, label: t.voiceNavLabel },
  ];

  const statusMessages: Record<Status, string> = {
    idle: t.voiceHint,
    recording: t.voiceStatusRecording,
    processing: t.voiceStatusProcessing,
    result: "",
    error: t.voiceStatusError,
  };

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
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      setStatus("error");
      setResultMsg(t.voiceNeedsInternet);
      Alert.alert("Offline", t.voiceNeedsInternet);
      return;
    }

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
          Alert.alert(t.animalDetailPermissionNeeded, t.voiceMicPermission);
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
        setTranscript(t.voiceNoMatch);
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
        setResultMsg(t.voiceNotUnderstood.replace("{text}", text));
        setStatus("result");
        return;
      }

      const params = result.params;
      const confirmation = getConfirmationMessage(result, language);

      if (result.action === "log_milk" && params.animalId && params.quantity) {
        createMilk({
          animalId: Number(params.animalId),
          session: params.session ?? "morning",
          quantity: params.quantity,
          date: new Date().toISOString(),
        }).then(() => {
          setResultMsg(`✅ ${confirmation}`);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }).catch(() => {
          setResultMsg(t.errorMsg);
        });
      } else if (result.action === "report_problem" && params.animalId) {
        createEvent({
          animalId: Number(params.animalId),
          date: new Date().toISOString(),
          type: "observation",
          description: params.symptom ?? text,
        }).then(() => {
          setResultMsg(`✅ ${confirmation}`);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }).catch(() => {
          setResultMsg(t.errorMsg);
        });
      } else if (result.action === "add_expense" && params.expenseAmount) {
        if (!activeFarm?.id) {
          setResultMsg(t.errorMsg);
        } else {
          addExpense({
            farmId: activeFarm.id,
            date: new Date().toISOString(),
            category: (params.expenseCategory as any) ?? "other",
            description: params.expenseDescription ?? text,
            amount: params.expenseAmount,
          }).then(() => {
            setResultMsg(`✅ ${confirmation}`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }).catch(() => {
            setResultMsg(t.errorMsg);
          });
        }
      } else if (result.action === "navigate" && params.tab) {
        router.push(`/(tabs)/${params.tab === "animals" ? "" : params.tab}` as any);
        setResultMsg(`✅ ${confirmation}`);
        setTimeout(onClose, 800);
      } else {
        setResultMsg(`✅ ${confirmation}`);
      }

      setStatus("result");
    } catch (err) {
      console.error("Parse command error:", err);
      setResultMsg(t.errorMsg);
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

          <Text style={[styles.title, { color: colors.foreground }]}>{t.voiceTitle}🎙</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t.voiceSub}
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
                <Text style={styles.againBtnText}>{t.speakAgain}</Text>
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
                    {statusMessages[status]}
                  </Text>
                </View>
              )}
              {status === "idle" && (
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                  {statusMessages.idle}
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
              placeholder={t.voicePlaceholder}
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
            {t.sampleCommands}
          </Text>
          <View style={styles.commandsGrid}>
            {sampleCommands.map((cmd, i) => (
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

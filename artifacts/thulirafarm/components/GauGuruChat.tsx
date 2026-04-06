import { Feather } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { chatWithGauGuru, type ChatMessage } from "@/services/api";
import { useLanguage } from "@/context/LanguageContext";

const QUICK_QUESTIONS: Array<{ q: string; qTa: string }> = [
  { q: "How do I detect heat in cows?", qTa: "மாடு ஈட்டில் இருக்கிறதா என்று எவ்வாறு அறிவது?" },
  { q: "What is good FAT% for cow milk?", qTa: "பசும்பால் நல்ல FAT% என்ன?" },
  { q: "FMD vaccine schedule for cattle?", qTa: "கோமாரி தடுப்பூசி எப்போது போட வேண்டும்?" },
  { q: "Cow not eating, what to do?", qTa: "மாடு சாப்பிடவில்லை, என்ன செய்வது?" },
  { q: "How much green fodder per day?", qTa: "ஒரு மாட்டிற்கு ஒரு நாளில் எவ்வளவு பச்சை தீவனம்?" },
  { q: "Signs of calving approaching?", qTa: "குட்டி போட இருக்கிறது என்று தெரிவது எப்படி?" },
];

const WELCOME: Record<string, string> = {
  ta: "வணக்கம்! நான் GauGuru, உங்கள் AI பண்ணை உதவியாளர். பால் உற்பத்தி, கால்நடை ஆரோக்கியம், இனப்பெருக்கம் — எந்த கேள்வியும் கேளுங்கள்! 🐄",
  te: "నమస్కారం! నేను GauGuru, మీ AI పాడి సహాయకుడు. పాలు, ఆవుల ఆరోగ్యం, సంతానోత్పత్తి — ఏ ప్రశ్నైనా అడగండి! 🐄",
  kn: "ನಮಸ್ಕಾರ! ನಾನು GauGuru, ನಿಮ್ಮ AI ಹಾಲು ತೋಟ ಸಹಾಯಕ. ಹಾಲು, ಜಾನುವಾರು ಆರೋಗ್ಯ, ಸಂತಾನೋತ್ಪತ್ತಿ — ಯಾವ ಪ್ರಶ್ನೆಯನ್ನಾದರೂ ಕೇಳಿ! 🐄",
  ml: "നമസ്കാരം! ഞാൻ GauGuru, നിങ്ങളുടെ AI ഡയറി സഹായി. പാൽ, കന്നുകാലി ആരോഗ്യം, പ്രജനനം — ഏതു ചോദ്യവും ചോദിക്കൂ! 🐄",
  hi: "नमस्ते! मैं GauGuru, आपका AI डेयरी सहायक हूँ। दूध, पशु स्वास्थ्य, प्रजनन — कोई भी सवाल पूछें! 🐄",
  en: "Hello! I'm GauGuru, your AI dairy farm assistant. Ask me anything about milk production, cattle health, breeding, nutrition, or government schemes! 🐄",
};

export default function GauGuruChat() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const isTa = language === "ta";

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const { response } = await chatWithGauGuru(trimmed, messages, language);
      const assistantMsg: ChatMessage = { role: "assistant", content: response };
      setMessages([...newHistory, assistantMsg]);
    } catch {
      const errMsg: ChatMessage = {
        role: "assistant",
        content: isTa
          ? "மன்னிக்கவும், பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்."
          : "Sorry, there was an error. Please try again.",
      };
      setMessages([...newHistory, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [messages, loading, language, isTa]);

  const clearChat = () => setMessages([]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={120}
    >
      {/* Header */}
      <View style={styles.chatHeader}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarEmoji}>🐄</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatName}>GauGuru AI</Text>
          <Text style={styles.chatSub}>{isTa ? "24/7 பண்ணை உதவியாளர்" : "24/7 Dairy Advisor"}</Text>
        </View>
        {messages.length > 0 && (
          <Pressable onPress={clearChat} style={styles.clearBtn}>
            <Feather name="trash-2" size={16} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesArea}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome message */}
        <View style={styles.assistantBubble}>
          <Text style={styles.assistantText}>{WELCOME[language] ?? WELCOME.en}</Text>
        </View>

        {/* Quick question chips */}
        {messages.length === 0 && (
          <View style={styles.quickQSection}>
            <Text style={styles.quickQLabel}>{isTa ? "⚡ விரைவு கேள்விகள்" : "⚡ Quick Questions"}</Text>
            {QUICK_QUESTIONS.map((q, i) => (
              <Pressable
                key={i}
                style={styles.quickQChip}
                onPress={() => sendMessage(isTa ? q.qTa : q.q)}
              >
                <Text style={styles.quickQText}>{isTa ? q.qTa : q.q}</Text>
                <Feather name="arrow-right" size={14} color="#16a34a" />
              </Pressable>
            ))}
          </View>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <View
            key={i}
            style={msg.role === "user" ? styles.userBubbleWrap : styles.assistantBubbleWrap}
          >
            {msg.role === "assistant" && (
              <View style={styles.assistantAvatar}>
                <Text style={{ fontSize: 14 }}>🐄</Text>
              </View>
            )}
            <View style={msg.role === "user" ? styles.userBubble : styles.assistantBubble}>
              <Text style={msg.role === "user" ? styles.userText : styles.assistantText}>
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {/* Loading dots */}
        {loading && (
          <View style={styles.assistantBubbleWrap}>
            <View style={styles.assistantAvatar}><Text style={{ fontSize: 14 }}>🐄</Text></View>
            <View style={[styles.assistantBubble, styles.loadingBubble]}>
              <ActivityIndicator size="small" color="#16a34a" />
              <Text style={styles.loadingText}>{isTa ? "யோசிக்கிறேன்..." : "Thinking..."}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder={isTa ? "கேள்வி கேளுங்கள்..." : "Ask anything about dairy..."}
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage(input)}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
        >
          <Feather name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  chatHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
  },
  avatarWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#dcfce7",
    alignItems: "center", justifyContent: "center",
  },
  avatarEmoji: { fontSize: 20 },
  chatName: { fontSize: 15, fontWeight: "800", color: "#1a2e05" },
  chatSub: { fontSize: 11, color: "#16a34a" },
  clearBtn: { padding: 8 },
  messagesArea: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  assistantBubbleWrap: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  userBubbleWrap: { flexDirection: "row", justifyContent: "flex-end" },
  assistantAvatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#dcfce7",
    alignItems: "center", justifyContent: "center",
  },
  assistantBubble: {
    flex: 1, backgroundColor: "#fff", borderRadius: 16, borderBottomLeftRadius: 4,
    padding: 12, maxWidth: "85%",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  assistantText: { fontSize: 14, color: "#1a2e05", lineHeight: 20 },
  userBubble: {
    backgroundColor: "#16a34a", borderRadius: 16, borderBottomRightRadius: 4,
    padding: 12, maxWidth: "80%",
  },
  userText: { fontSize: 14, color: "#fff", lineHeight: 20 },
  loadingBubble: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14 },
  loadingText: { color: "#9ca3af", fontSize: 13 },
  quickQSection: { marginTop: 8, gap: 8 },
  quickQLabel: { fontSize: 12, fontWeight: "700", color: "#9ca3af", marginBottom: 4 },
  quickQChip: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#d1fae5",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  quickQText: { flex: 1, fontSize: 13, color: "#16a34a", fontWeight: "500" },
  inputArea: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e7eb",
  },
  textInput: {
    flex: 1, borderWidth: 1.5, borderColor: "#d1fae5", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
    backgroundColor: "#f0fdf4", color: "#1a2e05", maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#16a34a", alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#86efac" },
});

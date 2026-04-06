import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Language = "ta" | "en" | "hi";

export const LANGUAGE_NAMES: Record<Language, string> = {
  ta: "தமிழ்",
  en: "English",
  hi: "हिंदी",
};

const translations = {
  ta: {
    appName: "துளிர்பண்ணை",
    tagline: "உங்கள் பண்ணை, உங்கள் கையில்",

    tabAnimals: "என் மாடுகள்",
    tabHelp: "உதவி",
    tabMoney: "பணம்",
    tabToday: "இன்று",

    animals: "மாடுகள்",
    addAnimal: "மாடு சேர்",
    noAnimals: "மாடுகள் இல்லை",
    noAnimalsHint: "+ பொத்தானை அழுத்தி மாடு சேர்க்கவும்",
    filterAll: "அனைத்தும்",
    filterCow: "பசு 🐄",
    filterBuffalo: "எருமை 🐃",
    filterHealthy: "ஆரோக்கியம்",
    filterAttention: "கவனிக்கவும்",
    filterCritical: "அவசரம்",

    milkLog: "பால் பதிவு",
    milkLogSuccess: "பால் பதிவு ஆனது!",
    milkToday: "இன்று பால்",
    milkLogTitle: "பால் பதிவு செய்யவும்",
    session: "நேரம்",
    morning: "காலை",
    evening: "மாலை",
    quantity: "அளவு (லிட்டர்)",
    fatPercentage: "கொழுப்பு % (விருப்பம்)",
    save: "சேமி",
    cancel: "ரத்து",

    health: "உடல் நிலை",
    healthy: "ஆரோக்கியம்",
    attention: "கவனிக்கவும்",
    critical: "அவசரம்",

    income: "வருமானம்",
    expense: "செலவு",
    profit: "லாபம்",
    loss: "நஷ்டம்",
    totalIncome: "மொத்த வருமானம்",
    totalExpense: "மொத்த செலவு",
    addIncome: "வருமானம் சேர்",
    addExpense: "செலவு சேர்",

    today: "இன்று",
    goodMorning: "காலை வணக்கம், விவசாயி!",
    goodAfternoon: "மதிய வணக்கம்",
    goodEvening: "மாலை வணக்கம்",
    goodNight: "இரவு வணக்கம், விவசாயி!",
    tasks: "பணிகள்",
    allTasksDone: "அனைத்து பணிகளும் முடிந்தது! 🎉",
    progress: "இன்றைய முன்னேற்றம்",

    help: "பிரச்சனை & உதவி",
    sosButton: "ஏதாவது தவறா?",
    sosSub: "Something Wrong?",
    symptoms: "அறிகுறிகள் தேர்வு",
    diagnose: "AI ஆலோசனை பெறவும்",
    diagnosing: "AI பகுப்பாய்கிறது...",
    emergency: "அவசர தொடர்பு",
    callVet: "உடனே மருத்துவர் அழைக்கவும்",
    speak: "கேளு",
    stop: "நிறுத்து",

    profile: "என் சுயவிவரம்",
    farmerName: "விவசாயி பெயர்",
    village: "கிராமம்",
    district: "மாவட்டம்",
    phone: "தொலைபேசி",
    totalAnimals: "மொத்த மாடுகள்",
    language: "மொழி",
    logout: "வெளியேறு",
    editProfile: "திருத்து",
    saveProfile: "சுயவிவரம் சேமி",

    login: "உள்நுழை",
    signup: "பதிவு செய்",
    loginTitle: "வரவேற்கிறோம்!",
    loginSub: "உங்கள் கணக்கில் உள்நுழையவும்",
    signupTitle: "புதிய கணக்கு",
    signupSub: "உங்கள் விவரங்களை உள்ளிடவும்",
    namePlaceholder: "பெயர் (எ.கா: முருகன்)",
    villagePlaceholder: "கிராமம் (எ.கா: தஞ்சாவூர்)",
    districtPlaceholder: "மாவட்டம் (எ.கா: Thanjavur)",
    phonePlaceholder: "கைபேசி எண் (10 இலக்கம்)",
    pinPlaceholder: "PIN (4 இலக்கம்)",
    confirmPinPlaceholder: "PIN மீண்டும் உள்ளிடவும்",
    noAccount: "கணக்கு இல்லையா?",
    haveAccount: "கணக்கு இருக்கா?",
    createAccount: "புதிய கணக்கு தயாரிக்கவும்",
    skip: "இப்போது வேண்டாம்",

    required: "தேவையான தகவல்",
    pinMismatch: "PIN பொருந்தவில்லை",
    invalidPhone: "சரியான கைபேசி எண் உள்ளிடவும்",
    success: "வெற்றி",
    error: "பிழை",
    networkError: "இணைப்பு பிழை",
    sync: "சேமிக்கப்பட்டது",
    syncing: "சேமிக்கிறது",
    offline: "offline",

    voice: "குரல்",
    voiceTitle: "குரல் கட்டளை",
    voiceSub: "தமிழ் அல்லது ஆங்கிலத்தில் பேசவும்",
    voiceHint: "மேலே உள்ள பொத்தானை அழுத்தவும்",
    listening: "கேட்கிறேன்...",
    processing: "புரிந்துகொள்கிறேன்...",
    sampleCommands: "உதாரண கட்டளைகள்",
    speakAgain: "மீண்டும் சொல்",

    settingsTitle: "அமைப்புகள்",
    notifications: "அறிவிப்புகள்",
    notifEnabled: "அறிவிப்புகள் தயார்",
    enableNotif: "நினைவூட்டல் இயக்கு",
  },

  en: {
    appName: "ThulirFarm",
    tagline: "Your Farm, In Your Hands",

    tabAnimals: "My Animals",
    tabHelp: "Help",
    tabMoney: "Money",
    tabToday: "Today",

    animals: "Animals",
    addAnimal: "Add Animal",
    noAnimals: "No Animals",
    noAnimalsHint: "Tap + to add your first animal",
    filterAll: "All",
    filterCow: "Cow 🐄",
    filterBuffalo: "Buffalo 🐃",
    filterHealthy: "Healthy",
    filterAttention: "Attention",
    filterCritical: "Critical",

    milkLog: "Log Milk",
    milkLogSuccess: "Milk logged successfully!",
    milkToday: "Today's Milk",
    milkLogTitle: "Log Milk Entry",
    session: "Session",
    morning: "Morning",
    evening: "Evening",
    quantity: "Quantity (Litres)",
    fatPercentage: "Fat % (optional)",
    save: "Save",
    cancel: "Cancel",

    health: "Health Status",
    healthy: "Healthy",
    attention: "Needs Attention",
    critical: "Critical",

    income: "Income",
    expense: "Expense",
    profit: "Profit",
    loss: "Loss",
    totalIncome: "Total Income",
    totalExpense: "Total Expense",
    addIncome: "Add Income",
    addExpense: "Add Expense",

    today: "Today",
    goodMorning: "Good Morning, Farmer!",
    goodAfternoon: "Good Afternoon",
    goodEvening: "Good Evening",
    goodNight: "Good Night, Farmer!",
    tasks: "Tasks",
    allTasksDone: "All tasks done! 🎉",
    progress: "Today's Progress",

    help: "Problems & Help",
    sosButton: "Something Wrong?",
    sosSub: "Tap to call for emergency",
    symptoms: "Select Symptoms",
    diagnose: "Get AI Advice",
    diagnosing: "AI is analyzing...",
    emergency: "Emergency Contacts",
    callVet: "Call Vet Immediately",
    speak: "Listen",
    stop: "Stop",

    profile: "My Profile",
    farmerName: "Farmer Name",
    village: "Village",
    district: "District",
    phone: "Phone Number",
    totalAnimals: "Total Animals",
    language: "Language",
    logout: "Log Out",
    editProfile: "Edit Profile",
    saveProfile: "Save Profile",

    login: "Login",
    signup: "Sign Up",
    loginTitle: "Welcome Back!",
    loginSub: "Log in to your account",
    signupTitle: "Create Account",
    signupSub: "Enter your details below",
    namePlaceholder: "Your name (e.g. Murugan)",
    villagePlaceholder: "Village (e.g. Thanjavur)",
    districtPlaceholder: "District (e.g. Thanjavur)",
    phonePlaceholder: "10-digit mobile number",
    pinPlaceholder: "4-digit PIN",
    confirmPinPlaceholder: "Confirm PIN",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    createAccount: "Create new account",
    skip: "Skip for now",

    required: "Required information",
    pinMismatch: "PIN does not match",
    invalidPhone: "Enter a valid phone number",
    success: "Success",
    error: "Error",
    networkError: "Network error",
    sync: "Saved",
    syncing: "Saving...",
    offline: "Offline",

    voice: "Voice",
    voiceTitle: "Voice Command",
    voiceSub: "Speak in Tamil or English",
    voiceHint: "Press the button above to start",
    listening: "Listening...",
    processing: "Processing...",
    sampleCommands: "Sample Commands",
    speakAgain: "Speak Again",

    settingsTitle: "Settings",
    notifications: "Notifications",
    notifEnabled: "Notifications enabled",
    enableNotif: "Enable reminders",
  },

  hi: {
    appName: "थुलिर फार्म",
    tagline: "आपका फार्म, आपके हाथ में",

    tabAnimals: "मेरे पशु",
    tabHelp: "मदद",
    tabMoney: "पैसा",
    tabToday: "आज",

    animals: "पशु",
    addAnimal: "पशु जोड़ें",
    noAnimals: "कोई पशु नहीं",
    noAnimalsHint: "+ दबाएं और पशु जोड़ें",
    filterAll: "सभी",
    filterCow: "गाय 🐄",
    filterBuffalo: "भैंस 🐃",
    filterHealthy: "स्वस्थ",
    filterAttention: "ध्यान दें",
    filterCritical: "गंभीर",

    milkLog: "दूध दर्ज",
    milkLogSuccess: "दूध दर्ज हो गया!",
    milkToday: "आज का दूध",
    milkLogTitle: "दूध दर्ज करें",
    session: "समय",
    morning: "सुबह",
    evening: "शाम",
    quantity: "मात्रा (लीटर)",
    fatPercentage: "वसा % (वैकल्पिक)",
    save: "सेव करें",
    cancel: "रद्द",

    health: "स्वास्थ्य",
    healthy: "स्वस्थ",
    attention: "ध्यान दें",
    critical: "गंभीर",

    income: "आय",
    expense: "व्यय",
    profit: "लाभ",
    loss: "हानि",
    totalIncome: "कुल आय",
    totalExpense: "कुल व्यय",
    addIncome: "आय जोड़ें",
    addExpense: "व्यय जोड़ें",

    today: "आज",
    goodMorning: "सुप्रभात, किसान!",
    goodAfternoon: "नमस्कार",
    goodEvening: "शुभ संध्या",
    goodNight: "शुभ रात्रि, किसान!",
    tasks: "कार्य",
    allTasksDone: "सभी काम पूरे हो गए! 🎉",
    progress: "आज की प्रगति",

    help: "समस्या और मदद",
    sosButton: "कुछ गलत है?",
    sosSub: "आपातकाल के लिए दबाएं",
    symptoms: "लक्षण चुनें",
    diagnose: "AI सलाह लें",
    diagnosing: "AI जांच रहा है...",
    emergency: "आपातकालीन संपर्क",
    callVet: "तुरंत पशु डॉक्टर बुलाएं",
    speak: "सुनें",
    stop: "रोकें",

    profile: "मेरी प्रोफ़ाइल",
    farmerName: "किसान का नाम",
    village: "गाँव",
    district: "जिला",
    phone: "फ़ोन नंबर",
    totalAnimals: "कुल पशु",
    language: "भाषा",
    logout: "लॉगआउट",
    editProfile: "प्रोफ़ाइल बदलें",
    saveProfile: "प्रोफ़ाइल सेव करें",

    login: "लॉगिन",
    signup: "साइन अप",
    loginTitle: "स्वागत है!",
    loginSub: "अपने खाते में लॉगिन करें",
    signupTitle: "नया खाता",
    signupSub: "अपनी जानकारी दर्ज करें",
    namePlaceholder: "आपका नाम",
    villagePlaceholder: "गाँव का नाम",
    districtPlaceholder: "जिला",
    phonePlaceholder: "10 अंकों का मोबाइल नंबर",
    pinPlaceholder: "4 अंकों का PIN",
    confirmPinPlaceholder: "PIN दोबारा दर्ज करें",
    noAccount: "खाता नहीं है?",
    haveAccount: "खाता है?",
    createAccount: "नया खाता बनाएं",
    skip: "अभी छोड़ें",

    required: "जरूरी जानकारी",
    pinMismatch: "PIN मेल नहीं खाता",
    invalidPhone: "सही फ़ोन नंबर दर्ज करें",
    success: "सफलता",
    error: "त्रुटि",
    networkError: "नेटवर्क त्रुटि",
    sync: "सेव हो गया",
    syncing: "सेव हो रहा है...",
    offline: "ऑफ़लाइन",

    voice: "आवाज़",
    voiceTitle: "आवाज़ कमांड",
    voiceSub: "तमिल या अंग्रेजी में बोलें",
    voiceHint: "ऊपर बटन दबाएं",
    listening: "सुन रहा हूं...",
    processing: "समझ रहा हूं...",
    sampleCommands: "उदाहरण कमांड",
    speakAgain: "फिर से बोलें",

    settingsTitle: "सेटिंग्स",
    notifications: "सूचनाएं",
    notifEnabled: "सूचनाएं चालू हैं",
    enableNotif: "रिमाइंडर चालू करें",
  },
};

export type TranslationKeys = keyof typeof translations.ta;
export type Translations = typeof translations.ta;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const LANGUAGE_KEY = "thulirafarm_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ta");

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
      if (stored && stored in translations) {
        setLanguageState(stored as Language);
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  }, []);

  const t = translations[language] as Translations;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

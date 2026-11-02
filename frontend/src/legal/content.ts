/**
 * Legal copy shown in-app (Profile → Terms & Conditions / Privacy Policy) and
 * mirrored to docs/legal/*.md for public hosting (required for the Play Store
 * listing).
 *
 * This file is the source of truth. The screens under app/legal/ only render
 * it — do not put policy text in a screen.
 *
 * Three rules when editing:
 *
 *  1. Every statement must be true of the shipped build. An earlier version of
 *     this copy promised an in-app account delete, a data export and
 *     location-based weather forecasts, none of which exist. Claiming a data
 *     practice the app does not have is a Play Store data-safety violation,
 *     not just sloppy wording.
 *  2. Do not name internal technology. Processors we send user data to (OpenAI,
 *     Google) have to be disclosed and are named. Databases, frameworks,
 *     hashing algorithms, token lifetimes and libraries are implementation
 *     detail — describe the protection, not the product.
 *  3. Placeholders in [SQUARE BRACKETS] must be completed by the operator
 *     before publishing (legal entity address, jurisdiction, dates).
 */

import type { Language } from "@/context/LanguageContext";

/** A string in every language the app ships. */
export type L10n = Record<Language, string>;

/** Pick the active language, falling back to English. */
export const pick = (value: L10n | string, language: Language): string =>
  typeof value === "string" ? value : value[language] ?? value.en;

export interface LegalBlock {
  heading?: string;
  text: string;
}

export interface LegalDocument {
  /** Screen title. */
  title: L10n;
  /** The one thing a farmer should take away, shown above the clauses. */
  highlight: { title: L10n; body: L10n };
  /** Clause bodies are English: this is the operative legal text. */
  blocks: LegalBlock[];
}

export const LEGAL_META = {
  company: "Upcheck Technologies",
  appName: "Upcheck Dairy",
  supportEmail: "support@upcheckdairy.com",
  legalEmail: "legal@upcheckdairy.com",
  vetHelpline: "1962",
  address: "[Registered office address]",
  governingLaw: "[State], India",
  effectiveDate: "[Effective date]",
  lastUpdated: "[Last updated date]",
  appVersion: "1.0.0",
};

/* ------------------------------------------------------------------ */
/* Terms & Conditions                                                  */
/* ------------------------------------------------------------------ */

const TERMS_BLOCKS: LegalBlock[] = [
  {
    text:
      `These Terms & Conditions ("Terms") govern your use of the ${LEGAL_META.appName} ` +
      `application and the related synchronisation services provided by ` +
      `${LEGAL_META.company}. By creating an account, accessing or using the App you agree ` +
      `to these Terms and to our Privacy Policy. If you do not agree, please stop using ` +
      `the App. Effective ${LEGAL_META.effectiveDate}.`,
  },
  {
    heading: "1. Eligibility and your account",
    text:
      "You must be at least 18 years old (or the age of majority where you live) and able " +
      "to enter into a binding contract. You are responsible for the accuracy of the " +
      "details you register, for keeping your password and one-time codes secure, and for " +
      `everything done through your account. Tell us at ${LEGAL_META.supportEmail} if you ` +
      "believe your account has been used without your permission.",
  },
  {
    heading: "2. Your farm data belongs to you",
    text:
      "You keep full ownership of the records you enter — milk production, animal registry " +
      "and genealogy, health and treatment logs, inventory and financial ledgers. You grant " +
      "us only the limited licence needed to host, process and display that data in order " +
      "to run the App for you. We do not sell it, and we do not use it to train " +
      "machine-learning models.",
  },
  {
    heading: "3. Accuracy of what you record",
    text:
      "Ear tag identifiers, treatment entries, vaccination dates and milk quantities are " +
      "only as reliable as what is entered. You are responsible for ensuring your records " +
      "reflect your actual farm operations — particularly where they feed into cooperative " +
      "payments, veterinary decisions or regulatory compliance.",
  },
  {
    heading: "4. Offline recording and synchronisation",
    text:
      "The App is built to keep working where connectivity is intermittent. Entries made " +
      "offline are held on your device and queued for upload when a connection returns. " +
      "Data that has not yet synced exists only on your device: we cannot recover records " +
      "lost because the App was uninstalled, its storage cleared, or the device reset or " +
      "failed before a sync completed. Keep your own copies of records that matter to you.",
  },
  {
    heading: "5. Guidance only — no warranty on outcomes",
    text:
      "Milk payout estimates, fat and SNF calculations, cost figures, reminders and " +
      "AI-generated suggestions are provided for guidance. Payout figures follow standard " +
      "cooperative rate charts and do not account for sample testing, deductions or local " +
      "rate revisions; the amount you are actually paid is whatever your dairy cooperative " +
      "or procurement centre determines. The App is provided \"as is\" and \"as available\", " +
      "without warranties of any kind, to the maximum extent permitted by law.",
  },
  {
    heading: "6. AI guidance is not a veterinary diagnosis",
    text:
      "Health assessments, symptom analyses and treatment suggestions produced by the " +
      "GauGuru assistant are generated by artificial intelligence working from general " +
      "dairy veterinary literature. They can help you notice an early warning sign. They " +
      "cannot replace a physical examination, laboratory test or ultrasound by a licensed " +
      "veterinary practitioner, and they may be wrong. Decisions about your animals, their " +
      `treatment, your herd and your finances remain yours. ${LEGAL_META.company} accepts ` +
      "no liability for losses arising from reliance on AI-generated guidance in the App.",
  },
  {
    heading: "7. Medicines and withdrawal periods",
    text:
      "Prescription medicines, antibiotic dosages and vaccination schedules must follow " +
      "the instructions of your attending veterinary officer and the manufacturer's label, " +
      "not the App. Always observe the mandatory milk and meat withdrawal periods after " +
      "any antimicrobial treatment. Selling milk inside a withdrawal period is unlawful " +
      "and unsafe, and any reminder the App shows is a convenience, not a clearance.",
  },
  {
    heading: "8. Emergencies",
    text:
      "In a life-threatening situation — acute bloat, milk fever (hypocalcaemia), severe " +
      "dystocia, prolapse or a high-fever outbreak — do not wait for the App. Use the " +
      "Emergency tab on the Help screen, which dials the national animal husbandry " +
      `helpline on ${LEGAL_META.vetHelpline}, or call your local veterinarian directly.`,
  },
  {
    heading: "9. Acceptable use",
    text:
      "Do not use the App for unlawful, infringing or harmful purposes; do not attempt to " +
      "breach its security, reverse-engineer it, scrape it, or overload or disrupt the " +
      "service; do not upload content you have no right to use; and do not enter another " +
      "person's personal data without their knowledge. You must comply with applicable " +
      "animal husbandry, drug-residue and food-safety rules, including mandatory milk " +
      "withdrawal periods after treatment.",
  },
  {
    heading: "10. Third-party services",
    text:
      "The App depends on third-party services: Google for optional sign-in, OpenAI for " +
      "voice transcription and assistant replies, and a cloud hosting provider. Where you " +
      "choose a sign-in provider, that provider's own terms also apply to you. We are not " +
      "responsible for the availability or the acts of third-party services.",
  },
  {
    heading: "11. Limitation of liability",
    text:
      `To the maximum extent permitted by law, ${LEGAL_META.company} is not liable for ` +
      "indirect, incidental, special or consequential damages, nor for loss of data, " +
      "profits, livestock, milk yield or revenue, arising from your use of or inability to " +
      "use the App.",
  },
  {
    heading: "12. Account closure and deletion",
    text:
      "You may stop using the App at any time. To have your account and the farm data you " +
      `own permanently deleted, email ${LEGAL_META.supportEmail} from your registered ` +
      "address; the Privacy Policy sets out how that request is handled. We may suspend or " +
      "end access where these Terms are breached or where it is necessary to protect the " +
      "service. When access ends your right to use the App ends; what happens to your data " +
      "is governed by the Privacy Policy.",
  },
  {
    heading: "13. Changes and governing law",
    text:
      "We may update these Terms; continuing to use the App after a change means you " +
      `accept it. These Terms are governed by the laws of ${LEGAL_META.governingLaw}, and ` +
      `disputes are subject to the courts of that jurisdiction. Contact: ` +
      `${LEGAL_META.legalEmail}.`,
  },
];

export const TERMS: LegalDocument = {
  title: {
    en: "Terms & Conditions",
    ta: "விதிமுறைகள் & நிபந்தனைகள்",
    te: "నిబంధనలు & షరతులు",
    kn: "ನಿಯಮಗಳು & ಷರತ್ತುಗಳು",
    ml: "നിബന്ധനകളും വ്യവസ്ഥകളും",
    hi: "नियम व शर्तें",
  },
  highlight: {
    title: {
      en: "Farmer-first data pledge",
      ta: "விவசாயி தரவு உரிமை",
      te: "రైతు డేటా యాజమాన్యం",
      kn: "ರೈತ ದತ್ತಾಂಶ ಮಾಲೀಕತ್ವ",
      ml: "കർഷക ഡാറ്റ ഉടമസ്ഥത",
      hi: "किसान डेटा स्वामित्व",
    },
    body: {
      en: "You keep full ownership of your milk records, animal genealogies, health logs and financial ledgers.",
      ta: "உங்கள் பண்ணையின் அனைத்து பதிவுகளும் — பால், மாடுகள், செலவுகள் — முற்றிலும் உங்களுக்கே சொந்தம்.",
      te: "మీ పాల రికార్డులు, పశువుల వివరాలు, ఖర్చులు — అన్నీ పూర్తిగా మీ సొంతం.",
      kn: "ನಿಮ್ಮ ಹಾಲಿನ ದಾಖಲೆಗಳು, ಜಾನುವಾರು ವಿವರಗಳು, ಖರ್ಚುಗಳು — ಎಲ್ಲವೂ ಸಂಪೂರ್ಣವಾಗಿ ನಿಮ್ಮದೇ.",
      ml: "നിങ്ങളുടെ പാൽ രേഖകൾ, കന്നുകാലി വിവരങ്ങൾ, ചെലവുകൾ — എല്ലാം പൂർണ്ണമായും നിങ്ങളുടേത്.",
      hi: "आपके फार्म के सभी रिकॉर्ड — दूध, पशु, खर्च — पूरी तरह से आपकी संपत्ति हैं।",
    },
  },
  blocks: TERMS_BLOCKS,
};

/* ------------------------------------------------------------------ */
/* Privacy Policy                                                      */
/* ------------------------------------------------------------------ */

const PRIVACY_BLOCKS: LegalBlock[] = [
  {
    text:
      `${LEGAL_META.company} ("we", "us", "our") operates the ${LEGAL_META.appName} mobile ` +
      `application (the "App"), a dairy farm-management tool for milk producers. This ` +
      `Privacy Policy explains what personal data we collect, why, how we use and share ` +
      `it, and the choices you have. Effective ${LEGAL_META.effectiveDate}. Last updated ` +
      `${LEGAL_META.lastUpdated}.`,
  },
  {
    heading: "1. Information we collect",
    text:
      "Account and identity: your email address and name, and — where you provide them — " +
      "your phone number, village, district, state and PIN code. Passwords are stored only " +
      "as salted one-way hashes; we never store them in plain text. If you enable " +
      "two-factor authentication we also store the secret that generates your codes.\n\n" +
      "Sign-in provider data: if you sign in with Google we receive the email address, " +
      "name and profile photo URL on your Google account, along with Google's stable " +
      "identifier for that account.\n\n" +
      "Farm records you enter: farms; animals (ear tag number, breed, date of birth, " +
      "lactation stage, parentage); milk entries (morning and evening volume, fat %, SNF % " +
      "and rate); health events and treatments; vaccinations; breeding events; tasks; " +
      "inventory items; and financial transactions.\n\n" +
      "Photos and files you attach: pictures of animals and documents such as receipts are " +
      "uploaded to and stored on our servers.\n\n" +
      "Assistant conversations: the questions you ask the in-app GauGuru assistant and the " +
      "replies it gives are stored against your account so your history is there when you " +
      "return.\n\n" +
      "Voice recordings: when you use voice input, the audio is sent to OpenAI to be " +
      "converted to text and, for spoken replies, to generate audio. We do not keep the " +
      "recording once it has been processed.\n\n" +
      "Technical data: app version, device model and operating system, and server-side " +
      "request logs used for diagnostics and abuse prevention.",
  },
  {
    heading: "2. How we use your information",
    text:
      "To create and secure your account and verify your email address; to provide the " +
      "App's features — storing and displaying your farm records, calculations, reports " +
      "and reminders; to send transactional email such as verification and password-reset " +
      "codes; to operate, maintain, troubleshoot and improve the service; and to meet " +
      "legal obligations. We do not sell your personal data, we do not use it for " +
      "advertising, and the App contains no ad networks or advertising trackers.",
  },
  {
    heading: "3. Device permissions we request",
    text:
      "Camera and photos: used only to take or choose pictures of animals and to " +
      "photograph receipts you attach to records.\n\n" +
      "Microphone: used only for voice input to the assistant.\n\n" +
      "Notifications: reminders for vaccinations, heat cycles and milking are scheduled " +
      "and shown by your own device. We do not operate a push-notification server and we " +
      "do not collect a push token.\n\n" +
      "Location: the App asks for location permission on the Permissions screen in " +
      "preparation for location-aware features. This release does not collect, store or " +
      "transmit your coordinates, and the weather shown on the Today screen is sample " +
      "data, not a live forecast for your area. You can decline this permission without " +
      "losing any functionality.\n\n" +
      "Network state: used to detect when you are offline so entries can be queued and " +
      "synced later.\n\n" +
      "You can grant or revoke any permission from your device settings at any time. The " +
      "Permissions screen in the App shows the current status of each one.",
  },
  {
    heading: "4. How we share information",
    text:
      "We share data only with providers that process it on our behalf under contract:\n" +
      "• OpenAI — speech-to-text, assistant replies and image generation, used only when " +
      "you use those features.\n" +
      "• Google — sign-in, only if you choose to sign in with Google.\n" +
      "• Our cloud hosting provider — hosts the servers and database that store your farm " +
      "records.\n\n" +
      "We do not share individual farm yields, animal records or financial ledgers with " +
      "cooperatives, government bodies, corporations or competitors. We may disclose " +
      "information where required by law, or to protect the rights, safety and security of " +
      "our users and the service.",
  },
  {
    heading: "5. Retention and deleting your account",
    text:
      "We keep your account and farm records for as long as your account exists. This " +
      "release does not yet include an in-app \"Delete account\" control: to have your " +
      `account and the farm data you own permanently deleted, email ` +
      `${LEGAL_META.supportEmail} from your registered address and we will action the ` +
      "request within 30 days. Backups and any records we are legally required to retain " +
      "may persist for a limited period before being purged. One-time codes and expired " +
      "sign-in tokens are discarded automatically.",
  },
  {
    heading: "6. Your rights and choices",
    text:
      "You can view and correct your profile and farm details in the App, change your " +
      "language and notification preferences, and revoke device permissions at any time. " +
      "The App does not yet have a one-tap export: to receive a copy of your records, or " +
      "to exercise any right of access, correction, portability or restriction you have " +
      `under applicable law, email ${LEGAL_META.supportEmail} and we will respond within ` +
      "30 days.",
  },
  {
    heading: "7. Security",
    text:
      "Traffic between the App and our servers is encrypted in transit. Passwords are " +
      "stored as salted one-way hashes. Sessions use short-lived tokens that are refreshed " +
      "automatically, so a stolen token is usable only for a narrow window. On your " +
      "device, session tokens are held in the platform's secure keystore rather than in " +
      "ordinary app storage, and access to your records is checked against your account on " +
      "every request. No system is perfectly secure and we cannot guarantee absolute " +
      "security.",
  },
  {
    heading: "8. Data held on your device",
    text:
      "Records you create without a connection are stored on your device until they sync. " +
      "That copy is under your control, not ours — it is removed when you uninstall the " +
      "App or clear its storage, and anything not yet synced is lost with it.",
  },
  {
    heading: "9. Children",
    text:
      "The App is a business tool for dairy farmers and is not directed to children. We do " +
      "not knowingly collect personal data from anyone under 18.",
  },
  {
    heading: "10. Changes and contact",
    text:
      "We may update this policy; material changes will be notified in the App or by " +
      `email. Questions or requests: ${LEGAL_META.legalEmail}. ${LEGAL_META.company}, ` +
      `${LEGAL_META.address}.`,
  },
];

export const PRIVACY_POLICY: LegalDocument = {
  title: {
    en: "Privacy Policy",
    ta: "தனியுரிமைக் கொள்கை",
    te: "గోప్యతా విధానం",
    kn: "ಗೌಪ್ಯತಾ ನೀತಿ",
    ml: "സ്വകാര്യതാ നയം",
    hi: "गोपनीयता नीति",
  },
  highlight: {
    title: {
      en: "No ads, no data selling",
      ta: "விளம்பரம் இல்லை, தரவு விற்பனை இல்லை",
      te: "ప్రకటనలు లేవు, డేటా అమ్మకం లేదు",
      kn: "ಜಾಹೀರಾತು ಇಲ್ಲ, ದತ್ತಾಂಶ ಮಾರಾಟ ಇಲ್ಲ",
      ml: "പരസ്യമില്ല, ഡാറ്റ വിൽപ്പനയില്ല",
      hi: "कोई विज्ञापन नहीं, कोई डेटा बिक्री नहीं",
    },
    body: {
      en: "We never sell or broker your milk prices, herd size or contact details, and the app carries no advertising trackers.",
      ta: "உங்கள் பால் விலை, மாடுகளின் எண்ணிக்கை, தொடர்பு விவரங்கள் எதையும் விற்க மாட்டோம். செயலியில் விளம்பரம் இல்லை.",
      te: "మీ పాల ధరలు, పశువుల సంఖ్య, సంప్రదింపు వివరాలు ఎప్పుడూ అమ్మము. యాప్‌లో ప్రకటనలు లేవు.",
      kn: "ನಿಮ್ಮ ಹಾಲಿನ ಬೆಲೆ, ಜಾನುವಾರು ಸಂಖ್ಯೆ, ಸಂಪರ್ಕ ವಿವರಗಳನ್ನು ಎಂದಿಗೂ ಮಾರುವುದಿಲ್ಲ. ಆಪ್‌ನಲ್ಲಿ ಜಾಹೀರಾತಿಲ್ಲ.",
      ml: "നിങ്ങളുടെ പാൽ വില, കന്നുകാലി എണ്ണം, ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ ഒരിക്കലും വിൽക്കില്ല. ആപ്പിൽ പരസ്യമില്ല.",
      hi: "हम आपके दूध के दाम, पशुओं की संख्या या संपर्क विवरण कभी नहीं बेचते। ऐप में कोई विज्ञापन ट्रैकर नहीं है।",
    },
  },
  blocks: PRIVACY_BLOCKS,
};

/* ------------------------------------------------------------------ */
/* Shared screen chrome                                                */
/* ------------------------------------------------------------------ */

export const LEGAL_UI = {
  effectiveLabel: {
    en: `Effective ${LEGAL_META.effectiveDate}`,
    ta: `அமலுக்கு வரும் தேதி: ${LEGAL_META.effectiveDate}`,
    te: `అమలు తేదీ: ${LEGAL_META.effectiveDate}`,
    kn: `ಜಾರಿ ದಿನಾಂಕ: ${LEGAL_META.effectiveDate}`,
    ml: `പ്രാബല്യ തീയതി: ${LEGAL_META.effectiveDate}`,
    hi: `प्रभावी तिथि: ${LEGAL_META.effectiveDate}`,
  } as L10n,
  contactTitle: {
    en: "Questions about this policy?",
    ta: "இந்தக் கொள்கை குறித்து கேள்விகள் உள்ளதா?",
    te: "ఈ విధానంపై ప్రశ్నలా?",
    kn: "ಈ ನೀತಿಯ ಬಗ್ಗೆ ಪ್ರಶ್ನೆಗಳಿವೆಯೇ?",
    ml: "ഈ നയത്തെക്കുറിച്ച് ചോദ്യങ്ങളുണ്ടോ?",
    hi: "इस नीति के बारे में प्रश्न हैं?",
  } as L10n,
  contactAction: {
    en: "Contact",
    ta: "தொடர்பு",
    te: "సంప్రదించండి",
    kn: "ಸಂಪರ್ಕಿಸಿ",
    ml: "ബന്ധപ്പെടുക",
    hi: "संपर्क",
  } as L10n,
};

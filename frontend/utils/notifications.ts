import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Request notification permissions if not already granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === "granted";
  } catch (error) {
    console.warn("[Notifications] Permission request failed", error);
    return false;
  }
}

/**
 * Schedule a local notification at a specific date and time.
 * Returns the notification identifier string, or null if failed.
 */
export async function scheduleNotification(
  title: string,
  body: string,
  triggerDate: Date
): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  // If trigger date is in the past, schedule it 5 seconds from now
  const triggerTime = triggerDate.getTime();
  const now = Date.now();
  const trigger = triggerTime <= now ? new Date(now + 5000) : triggerDate;

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
    return identifier;
  } catch (error) {
    console.warn("[Notifications] Failed to schedule notification", error);
    return null;
  }
}

/**
 * Schedule breeding heat reminder (18 days after date)
 */
export async function scheduleHeatReminder(
  animalName: string,
  baseDate: Date,
  language: string
): Promise<string | null> {
  const triggerDate = new Date(baseDate.getTime() + 18 * 24 * 60 * 60 * 1000);
  // Set alert for 8:00 AM on that day
  triggerDate.setHours(8, 0, 0, 0);

  const title = language === "ta" ? "இனப்பெருக்க நினைவூட்டல்! 🔔" : "Breeding Reminder! 🔔";
  const body = language === "ta"
    ? `ThulirFarm: ${animalName} இன்று ஈட்டில் இருக்கலாம் (கடந்த ஈட்டிலிருந்து 18 நாட்கள்).`
    : `ThulirFarm: ${animalName} may be in heat today (18 days since last heat).`;

  return scheduleNotification(title, body, triggerDate);
}

/**
 * Schedule calving reminder
 */
export async function scheduleCalvingReminder(
  animalName: string,
  expectedCalvingDate: Date,
  language: string
): Promise<string | null> {
  // Set alert for 8:00 AM on calving day
  const triggerDate = new Date(expectedCalvingDate);
  triggerDate.setHours(8, 0, 0, 0);

  const title = language === "ta" ? "இனப்பெருக்க நினைவூட்டல்! 🔔" : "Calving Reminder! 🔔";
  const body = language === "ta"
    ? `ThulirFarm: ${animalName} இன்று கன்று ஈன வாய்ப்புள்ளது (எதிர்பார்க்கும் தேதி).`
    : `ThulirFarm: ${animalName} is expected to calve today (expected date).`;

  return scheduleNotification(title, body, triggerDate);
}

/**
 * Schedule vaccination reminder
 */
export async function scheduleVaccinationReminder(
  animalName: string,
  vaccineName: string,
  scheduledDate: Date,
  language: string
): Promise<string | null> {
  // Set alert for 8:00 AM on vaccine day
  const triggerDate = new Date(scheduledDate);
  triggerDate.setHours(8, 0, 0, 0);

  const title = language === "ta" ? "தடுப்பூசி நினைவூட்டல்! 🔔" : "Vaccination Reminder! 🔔";
  const body = language === "ta"
    ? `ThulirFarm: ${animalName}-க்கு ${vaccineName} தடுப்பூசி இன்று செலுத்தப்பட வேண்டும்.`
    : `ThulirFarm: ${vaccineName} vaccine is scheduled today for ${animalName}.`;

  return scheduleNotification(title, body, triggerDate);
}

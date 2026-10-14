import { isRunningInExpoGo } from "expo";
import { Platform, Vibration } from "react-native";

let Notifications = null;

// Only load native expo-notifications when NOT running in Expo Go (SDK 53+ restriction)
if (!isRunningInExpoGo()) {
  try {
    Notifications = require("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (err) {
    console.warn("[NotificationService] Native notifications not available:", err?.message);
  }
}

/**
 * Initializes notification channels and requests permissions on Android/iOS.
 */
export async function registerForPushNotificationsAsync() {
  if (!Notifications || isRunningInExpoGo()) {
    return false;
  }

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("hydronode_alerts", {
        name: "HydroNode Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 200, 300],
        lightColor: "#00D2FF",
        sound: "default",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (err) {
    console.warn("[NotificationService] Setup notice:", err.message);
    return false;
  }
}

/**
 * Dispatches an instant native Android/iOS push alert banner with vibration.
 */
export async function triggerNativeAlert(title, body, alertType = "default") {
  try {
    // Hardware vibration pattern (works everywhere)
    if (alertType === "critical") {
      Vibration.vibrate([0, 500, 200, 500]);
    } else {
      Vibration.vibrate([0, 250, 150, 250]);
    }

    if (!Notifications || isRunningInExpoGo()) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { alertType, ts: Date.now() },
      },
      trigger: null, // null means trigger immediately
    });
  } catch (err) {
    console.warn("[NotificationService] Notification dispatch notice:", err.message);
  }
}

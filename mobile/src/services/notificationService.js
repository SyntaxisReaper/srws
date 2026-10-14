import * as Notifications from "expo-notifications";
import { Platform, Vibration } from "react-native";
import { isRunningInExpoGo } from "expo";

// Configure foreground notification presentation handler for Expo SDK 53-57+
// Using shouldShowBanner and shouldShowList (shouldShowAlert is deprecated)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority?.MAX,
  }),
});

let channelReady = false;

/**
 * Creates high-priority notification channels for Android 8.0+
 * In Expo Go, dynamic channel creation via NotificationsChannelsProvider is unsupported
 * and automatically falls back to Expo's built-in high-importance channel.
 */
export async function setupNotificationChannels() {
  if (Platform.OS === "android" && !channelReady) {
    if (isRunningInExpoGo()) {
      return;
    }
    try {
      await Notifications.setNotificationChannelAsync("hydronode_alerts", {
        name: "HydroNode Water Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 200, 300],
        lightColor: "#00D2FF",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
      channelReady = true;
    } catch (err) {
      // In standalone builds, channel setup errors are non-fatal
    }
  }
}

/**
 * Initializes notification channels and requests permissions on Android/iOS.
 */
export async function registerForPushNotificationsAsync() {
  try {
    await setupNotificationChannels();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (err) {
    return false;
  }
}

/**
 * Dispatches an instant native Android/iOS push alert banner with vibration.
 */
export async function triggerNativeAlert(title, body, alertType = "default") {
  try {
    // 1. Hardware vibration pattern (works on physical phone & emulator)
    if (alertType === "critical") {
      Vibration.vibrate([0, 500, 200, 500]);
    } else {
      Vibration.vibrate([0, 250, 150, 250]);
    }

    // 2. Ensure Android channel is registered if in standalone build
    await setupNotificationChannels();

    // 3. Prepare notification content
    const content = {
      title,
      body,
      sound: "default",
      priority: Notifications.AndroidNotificationPriority?.MAX,
      data: { alertType, ts: Date.now() },
    };

    // If channel was successfully registered (standalone build), attach custom channelId
    if (channelReady) {
      content.channelId = "hydronode_alerts";
    }

    // 4. Schedule immediate notification (trigger: null)
    const notificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: null,
    });
    return notificationId;
  } catch (err) {
    console.warn("[NotificationService] Notification dispatch notice:", err?.message);
    return null;
  }
}

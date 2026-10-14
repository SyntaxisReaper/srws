const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Triggers whenever a device status is updated in the Realtime Database.
 * Evaluates water levels, motor fault flags, and dispatches FCM notifications.
 */
exports.onStatusChange = functions.database
  .ref("/devices/{deviceId}/status")
  .onUpdate(async (change, context) => {
    const before = change.before.val() || {};
    const after = change.after.val() || {};
    const deviceId = context.params.deviceId;

    // Fetch alert configuration and FCM token for this device
    const alertsSnapshot = await admin
      .database()
      .ref(`/devices/${deviceId}/alerts`)
      .once("value");

    const alertsConfig = alertsSnapshot.val() || {};
    const {
      fcmToken,
      notifyOnFull = true,
      notifyOnLow = true,
      notifyOnFault = true,
    } = alertsConfig;

    let notification = null;

    // 1. Tank Full Alert (transitioned to >= 90%)
    if (notifyOnFull && after.waterLevel >= 90 && (before.waterLevel || 0) < 90) {
      notification = {
        title: "💧 Tank Full",
        body: `Tank reached ${after.waterLevel}%. Motor has been stopped automatically.`,
      };
    }
    // 2. Low Water Alert (dropped to <= 20%)
    else if (
      notifyOnLow &&
      after.waterLevel <= 20 &&
      (before.waterLevel || 100) > 20
    ) {
      notification = {
        title: "⚠️ Low Water Level",
        body: `Water level dropped to ${after.waterLevel}%. Consider switching on the motor.`,
      };
    }
    // 3. Motor Dry-Run / Current Fault
    else if (notifyOnFault && after.motorFault && !before.motorFault) {
      notification = {
        title: "🚨 Motor Dry-Run Fault Detected",
        body: "Motor detected zero water flow/low current. Power has been cut to protect the pump.",
      };
    }

    // Send FCM notification if payload exists and token is registered
    if (notification && fcmToken) {
      try {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: notification.title,
            body: notification.body,
          },
          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId: "water_alerts_channel",
            },
          },
          data: {
            deviceId: deviceId,
            waterLevel: String(after.waterLevel || 0),
            motorFault: String(after.motorFault || false),
          },
        });
        console.log(`[FCM] Successfully delivered alert to ${deviceId}: ${notification.title}`);
      } catch (err) {
        console.error(`[FCM] Error dispatching notification to ${deviceId}:`, err);
      }
    }

    return null;
  });

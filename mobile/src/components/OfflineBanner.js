import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function OfflineBanner({ isOnline = true, secondsAgo = 0 }) {
  if (isOnline) return null;

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>⚠️</Text>
      </View>
      <View style={styles.textColumn}>
        <Text style={styles.title}>Device Offline — Controls Locked</Text>
        <Text style={styles.subtitle}>
          {secondsAgo > 0 && secondsAgo < 9999
            ? `No signal for ${secondsAgo}s • Showing last known data`
            : "No signal received • Check ESP32 power or Wi-Fi"}
        </Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>OFFLINE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 12,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 14,
  },
  textColumn: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  badge: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});

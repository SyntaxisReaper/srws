import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

export default function StatusBar({
  deviceId = "device_001",
  lastSeen = Date.now(),
  wifiStrength = -65,
  networkUplink = "Wi-Fi Connected",
  isSimulation = false,
}) {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      let ts = Number(lastSeen);
      if (!ts || isNaN(ts) || ts <= 0) {
        setSecondsAgo(9999);
        return;
      }
      if (ts < 10000000000) {
        ts = ts * 1000;
      }
      const diffSec = Math.max(0, Math.round((Date.now() - ts) / 1000));
      setSecondsAgo(diffSec);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [lastSeen]);

  const isOnline = isSimulation || secondsAgo < 120;

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? "#16A34A" : "#DC2626" }]} />
        <View>
          <Text style={styles.systemTitle}>
            {isOnline ? "System Online & Connected" : "System Offline"}
          </Text>
          <Text style={styles.syncSubtitle}>
            {isSimulation
              ? "Running in Virtual Simulation Mode"
              : isOnline
              ? secondsAgo <= 4
                ? "Live telemetry synced just now"
                : `Last synced ${secondsAgo} seconds ago`
              : "Check Wi-Fi or ESP32 hardware power"}
          </Text>
        </View>
      </View>

      <View style={styles.rightBadge}>
        <Text style={styles.wifiIcon}>📶</Text>
        <Text style={styles.wifiText}>{isOnline ? "Strong" : "No Link"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  systemTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  syncSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 1,
  },
  rightBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  wifiIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  wifiText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "600",
  },
});

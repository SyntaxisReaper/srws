import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function StatusBar({
  deviceId = "device_001",
  lastSeen = Date.now(),
  wifiStrength = -65,
  networkUplink = "Wi-Fi Connected",
  isSimulation = false,
  onToggleSimulation = () => {},
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
      <View style={styles.topRow}>
        {/* Device Status */}
        <View style={styles.deviceInfo}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? "#16A34A" : "#DC2626" }]} />
          <View>
            <Text style={styles.systemTitle}>HydroNode Tank</Text>
            <Text style={styles.syncSubtitle}>
              {isOnline
                ? secondsAgo <= 5
                  ? "Live • Connected"
                  : `Synced ${secondsAgo}s ago`
                : "Offline • Check connection"}
            </Text>
          </View>
        </View>

        {/* Mode Toggle Button (Black button with white text) */}
        <TouchableOpacity
          style={styles.modeButton}
          onPress={onToggleSimulation}
          activeOpacity={0.8}
        >
          <Text style={styles.modeButtonText}>
            {isSimulation ? "Demo Mode" : "Live Device"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  systemTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
  syncSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  modeButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});

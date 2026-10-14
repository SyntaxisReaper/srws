import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function StatusBar({
  deviceId = "device_001",
  lastSeen = Date.now(),
  wifiStrength = -65,
  networkUplink = "Wi-Fi (Primary) • Hotspot Ready",
  cellularBackup = "Roadmap Ready (SIM7600)",
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
      // If timestamp is in seconds (10 digits), convert to milliseconds (13 digits)
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

  let wifiQuality = "Strong";
  let wifiColor = "#10B981";
  if (wifiStrength < -75) {
    wifiQuality = "Weak";
    wifiColor = "#EF4444";
  } else if (wifiStrength < -65) {
    wifiQuality = "Fair";
    wifiColor = "#F59E0B";
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Device & Online Tag */}
        <View style={styles.deviceInfo}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? "#10B981" : "#EF4444" }]} />
          <Text style={styles.deviceName}>{deviceId}</Text>
          <View style={[styles.onlineTag, { borderColor: isOnline ? "#10B981" : "#EF4444" }]}>
            <Text style={[styles.onlineText, { color: isOnline ? "#10B981" : "#EF4444" }]}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Text>
          </View>
        </View>

        {/* Live / Sim Mode Toggle */}
        <TouchableOpacity
          style={[styles.modePill, isSimulation && styles.modePillActive]}
          onPress={onToggleSimulation}
          activeOpacity={0.7}
        >
          <Text style={styles.modePillIcon}>{isSimulation ? "🧪" : "⚡"}</Text>
          <Text style={styles.modePillText}>
            {isSimulation ? "Simulation Mode" : "Live Hardware"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Network Uplink & Connectivity */}
      <View style={styles.networkInfoRow}>
        <View style={styles.uplinkBadge}>
          <Text style={styles.uplinkIcon}>📡</Text>
          <Text style={styles.uplinkText} numberOfLines={1}>
            {networkUplink || "Wi-Fi Primary"}
          </Text>
        </View>

        <View style={styles.cellularRoadmapBadge}>
          <Text style={styles.cellularIcon}>📶</Text>
          <Text style={styles.cellularText}>4G: Roadmap Port</Text>
        </View>
      </View>

      {/* Telemetry metadata footer */}
      <View style={styles.telemetryRow}>
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>Signal:</Text>
          <Text style={[styles.telemetryValue, { color: wifiColor }]}>
            {wifiStrength} dBm ({wifiQuality})
          </Text>
        </View>

        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>Heartbeat:</Text>
          <Text style={styles.telemetryValue}>
            {secondsAgo === 0 ? "Just now" : `${secondsAgo}s ago`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1F2937",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#374151",
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
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  deviceName: {
    color: "#F9FAFB",
    fontSize: 13,
    fontWeight: "700",
    marginRight: 8,
  },
  onlineTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  onlineText: {
    fontSize: 9,
    fontWeight: "800",
  },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  modePillActive: {
    borderColor: "#00D2FF",
    backgroundColor: "rgba(0, 210, 255, 0.12)",
  },
  modePillIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  modePillText: {
    color: "#E5E7EB",
    fontSize: 11,
    fontWeight: "600",
  },
  networkInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  uplinkBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  uplinkIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  uplinkText: {
    color: "#00D2FF",
    fontSize: 10,
    fontWeight: "600",
  },
  cellularRoadmapBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(107, 114, 128, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(107, 114, 128, 0.3)",
  },
  cellularIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  cellularText: {
    color: "#9CA3AF",
    fontSize: 9,
    fontWeight: "600",
  },
  telemetryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  telemetryItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  telemetryLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    marginRight: 4,
  },
  telemetryValue: {
    color: "#E5E7EB",
    fontSize: 11,
    fontWeight: "600",
  },
});

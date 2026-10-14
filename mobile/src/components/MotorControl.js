import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";

export default function MotorControl({
  motorRunning = false,
  motorFault = false,
  relayState = "OFF",
  currentAmps = 0.0,
  busVoltage = 12.2,
  flowRateLpm = 0.0,
  waterLevel = 60,
  fullThreshold = 90,
  probeTop = false,
  isSubmitting = false,
  onToggle = () => {},
  onSimulateFault = () => {},
}) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const isFull = probeTop || waterLevel >= fullThreshold;
  const isBlocked = isFull || motorFault;

  const handlePress = () => {
    if (isSubmitting) return;
    const nextCommand = motorRunning ? "OFF" : "ON";
    onToggle(nextCommand);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>Water Pump</Text>
          <Text style={styles.cardSubtitle}>
            {motorRunning ? "Currently pumping water into tank" : "Pump is standby and ready"}
          </Text>
        </View>

        <View style={[styles.statusBadge, motorRunning ? styles.badgeActive : styles.badgeIdle]}>
          <View style={[styles.statusDot, motorRunning ? styles.dotActive : styles.dotIdle]} />
          <Text style={[styles.statusText, motorRunning ? styles.textActive : styles.textIdle]}>
            {motorRunning ? "RUNNING" : "OFF"}
          </Text>
        </View>
      </View>

      {/* Safety Notice Banners */}
      {motorFault && (
        <View style={styles.faultBanner}>
          <Text style={styles.bannerIcon}>⚠️</Text>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Dry-Run Safety Shutoff</Text>
            <Text style={styles.bannerDesc}>
              No water was detected flowing. The motor was automatically turned off to protect it.
            </Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => onSimulateFault(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.resetBtnText}>Reset Pump</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isFull && !motorFault && (
        <View style={styles.fullBanner}>
          <Text style={styles.bannerIcon}>🛡️</Text>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Automatic Full-Tank Protection</Text>
            <Text style={styles.bannerDesc}>
              Tank is full. Motor is locked off to prevent water overflow.
            </Text>
          </View>
        </View>
      )}

      {/* Main Action Button - SOLID BLACK with WHITE TEXT */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.mainButton,
            isBlocked && !motorRunning && styles.btnDisabled,
          ]}
          onPress={handlePress}
          disabled={isSubmitting || (isBlocked && !motorRunning)}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.btnInner}>
              <Text style={styles.btnMainText}>
                {motorRunning ? "STOP WATER PUMP" : "START WATER PUMP"}
              </Text>
              <Text style={styles.btnSubText}>
                {motorRunning
                  ? "Tap to safely stop the pump"
                  : isBlocked
                  ? "Turn off disabled while tank is full"
                  : "Tap to begin filling the tank"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Simplified Summary Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Water Flow</Text>
          <Text style={styles.metricValue}>
            {motorRunning ? `${Number(flowRateLpm || 1.8).toFixed(1)} L/min` : "0.0 L/min"}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Power Draw</Text>
          <Text style={styles.metricValue}>
            {motorRunning ? `${Number(currentAmps || 0.85).toFixed(2)} A` : "0.00 A"}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Auto-Stop</Text>
          <Text style={styles.metricValue}>At 90%</Text>
        </View>
      </View>

      {/* Optional Diagnostics Toggle */}
      <TouchableOpacity
        style={styles.diagToggle}
        onPress={() => setShowDiagnostics(!showDiagnostics)}
        activeOpacity={0.7}
      >
        <Text style={styles.diagToggleText}>
          {showDiagnostics ? "Hide Technical Details ▲" : "Technical Details ▼"}
        </Text>
      </TouchableOpacity>

      {showDiagnostics && (
        <View style={styles.diagBox}>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Bus Voltage:</Text>
            <Text style={styles.diagVal}>{Number(busVoltage || 12.0).toFixed(1)} V</Text>
          </View>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>MOSFET Switch:</Text>
            <Text style={styles.diagVal}>{motorRunning ? "Active (High)" : "Standby (Low)"}</Text>
          </View>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Simulate Dry-Run Trip:</Text>
            <TouchableOpacity
              style={styles.simBtn}
              onPress={() => onSimulateFault(!motorFault)}
              activeOpacity={0.8}
            >
              <Text style={styles.simBtnText}>
                {motorFault ? "Clear Fault" : "Test Trip"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  cardSubtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeActive: {
    backgroundColor: "#F0FDF4",
  },
  badgeIdle: {
    backgroundColor: "#F1F5F9",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotActive: {
    backgroundColor: "#16A34A",
  },
  dotIdle: {
    backgroundColor: "#94A3B8",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  textActive: {
    color: "#16A34A",
  },
  textIdle: {
    color: "#64748B",
  },
  faultBanner: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  fullBanner: {
    flexDirection: "row",
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  bannerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  bannerDesc: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
    marginBottom: 8,
  },
  resetBtn: {
    backgroundColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  resetBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  buttonContainer: {
    marginVertical: 4,
  },
  mainButton: {
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnInner: {
    alignItems: "center",
  },
  btnMainText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  btnSubText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  metricValue: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E2E8F0",
  },
  diagToggle: {
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 4,
  },
  diagToggleText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  diagBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  diagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  diagLabel: {
    color: "#64748B",
    fontSize: 12,
  },
  diagVal: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "600",
  },
  simBtn: {
    backgroundColor: "#000000",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  simBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
});

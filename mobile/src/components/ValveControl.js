import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";

export default function ValveControl({
  valveState = "CLOSED",
  waterLevel = 60,
  probeTop = false,
  isSubmitting = false,
  onToggleValve = () => {},
}) {
  const isOpen = valveState === "OPEN";
  const isFull = probeTop || waterLevel >= 90;

  const handlePress = () => {
    if (isSubmitting) return;
    const nextCommand = isOpen ? "CLOSED" : "OPEN";
    onToggleValve(nextCommand);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>REMOTE SUPPLY VALVE</Text>
          <Text style={styles.cardSubtitle}>Inlet Solenoid Actuator</Text>
        </View>

        <View style={[styles.portBadge, isOpen ? styles.portActive : styles.portStandby]}>
          <Text style={styles.portLabel}>GPIO 27 (MOSFET #2)</Text>
          <Text style={[styles.portState, isOpen && styles.textGreen]}>
            {isOpen ? "PORT ENERGIZED" : "HARDWARE READY"}
          </Text>
        </View>
      </View>

      {/* Auto-Close Notice on Full Tank */}
      {isFull && (
        <View style={styles.lockoutBanner}>
          <Text style={styles.lockoutIcon}>🛡️</Text>
          <Text style={styles.lockoutText}>
            Supply locked: Tank is full. Solenoid valve remains closed to prevent backflow or spill.
          </Text>
        </View>
      )}

      {/* Visual Pipe & Valve Graphic */}
      <View style={styles.pipeVisualContainer}>
        <View style={styles.pipeLine}>
          <Text style={styles.pipeLabel}>Municipal Inlet</Text>
        </View>

        {/* Central Valve Body */}
        <View style={[styles.valveNode, isOpen ? styles.valveNodeOpen : styles.valveNodeClosed]}>
          <Text style={styles.valveIcon}>{isOpen ? "🌊" : "🔒"}</Text>
          <Text style={styles.valveStateText}>{isOpen ? "OPEN" : "CLOSED"}</Text>
        </View>

        <View style={[styles.pipeLine, isOpen && styles.pipeFlowing]}>
          <Text style={styles.pipeLabel}>Tank Inlet</Text>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            isOpen ? styles.btnOpen : styles.btnClose,
            isFull && !isOpen && styles.btnDisabled,
          ]}
          onPress={handlePress}
          disabled={isSubmitting || (isFull && !isOpen)}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.btnContentRow}>
              <Text style={styles.btnIcon}>{isOpen ? "🛑" : "💧"}</Text>
              <Text style={styles.btnText}>
                {isOpen ? "SHUT SUPPLY VALVE" : "OPEN SUPPLY VALVE"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Diagnostics / Details */}
      <View style={styles.diagnosticsRow}>
        <View style={styles.diagItem}>
          <Text style={styles.diagLabel}>Control Port</Text>
          <Text style={styles.diagVal}>ESP32 GPIO 27</Text>
        </View>
        <View style={styles.diagItem}>
          <Text style={styles.diagLabel}>Hardware Driver</Text>
          <Text style={styles.diagVal}>LR7843 MOSFET</Text>
        </View>
        <View style={styles.diagItem}>
          <Text style={styles.diagLabel}>Fail-Safe State</Text>
          <Text style={[styles.diagVal, styles.textGreen]}>Normally Closed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#1F2937",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitle: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  cardSubtitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  portBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "flex-end",
  },
  portActive: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "#10B981",
  },
  portStandby: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
  },
  portLabel: {
    color: "#9CA3AF",
    fontSize: 9,
    fontWeight: "600",
  },
  portState: {
    color: "#D1D5DB",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 1,
  },
  textGreen: {
    color: "#10B981",
  },
  lockoutBanner: {
    flexDirection: "row",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginBottom: 14,
  },
  lockoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  lockoutText: {
    color: "#E5E7EB",
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  pipeVisualContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  pipeLine: {
    flex: 1,
    height: 6,
    backgroundColor: "#374151",
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  pipeFlowing: {
    backgroundColor: "#00D2FF",
  },
  pipeLabel: {
    position: "absolute",
    top: -18,
    fontSize: 9,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  valveNode: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
    borderWidth: 2,
  },
  valveNodeOpen: {
    backgroundColor: "rgba(0, 210, 255, 0.15)",
    borderColor: "#00D2FF",
  },
  valveNodeClosed: {
    backgroundColor: "#1F2937",
    borderColor: "#4B5563",
  },
  valveIcon: {
    fontSize: 22,
  },
  valveStateText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#F3F4F6",
    marginTop: 2,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  toggleBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOpen: {
    backgroundColor: "#DC2626",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  btnClose: {
    backgroundColor: "#0284C7",
    borderWidth: 1,
    borderColor: "#00D2FF",
  },
  btnDisabled: {
    backgroundColor: "#374151",
    borderColor: "#4B5563",
    opacity: 0.5,
  },
  btnContentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  btnIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  diagnosticsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  diagItem: {
    alignItems: "center",
  },
  diagLabel: {
    color: "#9CA3AF",
    fontSize: 9,
    fontWeight: "500",
  },
  diagVal: {
    color: "#E5E7EB",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
  },
});

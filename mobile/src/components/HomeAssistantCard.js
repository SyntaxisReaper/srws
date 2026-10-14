import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function HomeAssistantCard({
  waterLevel = 60,
  motorRunning = false,
  motorFault = false,
  valveOpen = false,
  capacityLiters = 20,
  manualOverride = false,
  isOnline = true,
  onToggleManualOverride = () => {},
  onToggleMotorManual = () => {},
  onToggleValveManual = () => {},
  onQuickTopUp = () => {},
  onStopPump = () => {},
}) {
  const currentHour = new Date().getHours();
  let greeting = "Good Evening 🌇";
  if (currentHour >= 5 && currentHour < 12) {
    greeting = "Good Morning 🌅";
  } else if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good Afternoon ☀️";
  } else if (currentHour >= 22 || currentHour < 5) {
    greeting = "Good Night 🌙";
  }

  const liters = Math.round((waterLevel / 100) * capacityLiters);

  let message = `Water level is healthy at ${waterLevel}%. You have approximately ${liters} Liters in reserve.`;
  let statusBadge = "💧 NORMAL SUPPLY";
  let statusBadgeBg = "#F0FDF4";
  let statusBadgeColor = "#16A34A";

  if (!isOnline) {
    message = "HydroNode hardware is currently offline. Showing last known telemetry. Controls are locked until connection is restored.";
    statusBadge = "⚠️ OFFLINE";
    statusBadgeBg = "#FEF2F2";
    statusBadgeColor = "#DC2626";
  } else if (manualOverride) {
    message = "Manual Override is active. Automatic guards are paused so you can turn the pump and valve ON or OFF at will.";
    statusBadge = "⚡ MANUAL OVERRIDE";
    statusBadgeBg = "#FEF3C7";
    statusBadgeColor = "#B45309";
  } else if (motorFault) {
    message = "Safety shutoff active: Pump was stopped to prevent dry-running. Switch to Manual Override to force-test if needed.";
    statusBadge = "⚠️ SAFETY CUTOFF";
    statusBadgeBg = "#FEF2F2";
    statusBadgeColor = "#DC2626";
  } else if (motorRunning) {
    message = "Water pump is currently active and refilling your tank. Overflow cutoff is standing by.";
    statusBadge = "⚡ REFILLING NOW";
    statusBadgeBg = "#E0F2FE";
    statusBadgeColor = "#0284C7";
  } else if (waterLevel >= 90) {
    message = "Tank is completely full! You have abundant water for all household showers, dishes, and laundry.";
    statusBadge = "✅ TANK FULL";
    statusBadgeBg = "#F0FDF4";
    statusBadgeColor = "#16A34A";
  } else if (waterLevel <= 20) {
    message = "Water level is low (20%). We recommend running a quick refill to maintain supply.";
    statusBadge = "⚠️ LOW LEVEL";
    statusBadgeBg = "#FEF2F2";
    statusBadgeColor = "#DC2626";
  }

  // Household appliance readiness
  const showerReady = waterLevel >= 30;
  const kitchenReady = waterLevel >= 15;
  const laundryReady = waterLevel >= 40;

  return (
    <View style={styles.card}>
      {/* Greeting & Header */}
      <View style={styles.topRow}>
        <View style={styles.greetingCol}>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.welcomeSub}>Home Water Assistant</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBadgeBg }]}>
          <Text style={[styles.statusBadgeText, { color: statusBadgeColor }]}>{statusBadge}</Text>
        </View>
      </View>

      {/* Natural Language Status Sentence */}
      <Text style={styles.summaryMessage}>{message}</Text>

      {/* Household Readiness Indicators - Zero Truncation */}
      <View style={styles.readinessContainer}>
        <View style={styles.readinessItem}>
          <Text style={styles.readinessIcon}>🚿</Text>
          <View style={styles.readinessTextCol}>
            <Text style={styles.readinessLabel} numberOfLines={1}>Shower</Text>
            <Text style={[styles.readinessStatus, showerReady ? styles.statusGood : styles.statusLow]}>
              {showerReady ? "Ready" : "Low"}
            </Text>
          </View>
        </View>

        <View style={styles.readinessDivider} />

        <View style={styles.readinessItem}>
          <Text style={styles.readinessIcon}>🍽️</Text>
          <View style={styles.readinessTextCol}>
            <Text style={styles.readinessLabel} numberOfLines={1}>Kitchen</Text>
            <Text style={[styles.readinessStatus, kitchenReady ? styles.statusGood : styles.statusLow]}>
              {kitchenReady ? "Ready" : "Low"}
            </Text>
          </View>
        </View>

        <View style={styles.readinessDivider} />

        <View style={styles.readinessItem}>
          <Text style={styles.readinessIcon}>🧺</Text>
          <View style={styles.readinessTextCol}>
            <Text style={styles.readinessLabel} numberOfLines={1}>Laundry</Text>
            <Text style={[styles.readinessStatus, laundryReady ? styles.statusGood : styles.statusLow]}>
              {laundryReady ? "Ready" : "Low"}
            </Text>
          </View>
        </View>
      </View>

      {/* Operating Mode Bar */}
      <View style={styles.modeBar}>
        <View style={styles.modeStatusLeft}>
          <View style={[styles.modeDot, manualOverride ? styles.modeDotOverride : styles.modeDotAuto]} />
          <Text style={styles.modeStatusText}>
            {!isOnline ? "Device Offline" : manualOverride ? "Manual Mode Active" : "Auto-Guards Active"}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.overrideToggleBtn,
            manualOverride && styles.overrideToggleBtnActive,
            !isOnline && styles.btnDisabled,
          ]}
          onPress={() => isOnline && onToggleManualOverride(!manualOverride)}
          disabled={!isOnline}
          activeOpacity={0.8}
        >
          <Text style={[styles.overrideToggleText, manualOverride && styles.overrideToggleTextActive]}>
            {manualOverride ? "RESTORE AUTO" : "⚡ MANUAL OVERRIDE"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Manual Override Direct Controls vs 1-Tap Auto Refill */}
      {manualOverride ? (
        <View style={styles.manualControlsBox}>
          <View style={styles.manualBtnRow}>
            {/* Direct Pump Toggle */}
            <TouchableOpacity
              style={[
                styles.manualActionBtn,
                motorRunning ? styles.manualBtnRunning : styles.manualBtnSolid,
                !isOnline && styles.btnDisabled,
              ]}
              onPress={() => isOnline && onToggleMotorManual(motorRunning ? "OFF" : "ON")}
              disabled={!isOnline}
              activeOpacity={0.85}
            >
              <Text style={styles.manualBtnIcon}>{motorRunning ? "⏹️" : "⚡"}</Text>
              <View style={styles.manualBtnTextCol}>
                <Text style={styles.manualBtnAction}>
                  {!isOnline ? "OFFLINE" : motorRunning ? "TURN OFF PUMP" : "TURN ON PUMP"}
                </Text>
                <Text style={styles.manualBtnSub}>
                  {!isOnline ? "Controls locked" : motorRunning ? "Running • Tap to stop" : "Stopped • Tap to run"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Direct Valve Toggle */}
            <TouchableOpacity
              style={[
                styles.manualActionBtn,
                valveOpen ? styles.manualBtnRunning : styles.manualBtnSolid,
                !isOnline && styles.btnDisabled,
              ]}
              onPress={() => isOnline && onToggleValveManual(valveOpen ? "CLOSED" : "OPEN")}
              disabled={!isOnline}
              activeOpacity={0.85}
            >
              <Text style={styles.manualBtnIcon}>{valveOpen ? "🔒" : "🚰"}</Text>
              <View style={styles.manualBtnTextCol}>
                <Text style={styles.manualBtnAction}>
                  {!isOnline ? "OFFLINE" : valveOpen ? "SHUT VALVE" : "OPEN VALVE"}
                </Text>
                <Text style={styles.manualBtnSub}>
                  {!isOnline ? "Controls locked" : valveOpen ? "Inlet open • Tap to shut" : "Shut • Tap to open"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.actionRow}>
          {motorRunning ? (
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.stopBtn, !isOnline && styles.btnDisabled]}
              onPress={() => isOnline && onStopPump()}
              disabled={!isOnline}
              activeOpacity={0.85}
            >
              <Text style={styles.btnIcon}>⏹️</Text>
              <Text style={styles.btnText}>STOP REFILL PUMP</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryActionBtn, (!isOnline || waterLevel >= 90) && styles.btnDisabled]}
              onPress={() => isOnline && onQuickTopUp(10)}
              disabled={!isOnline || waterLevel >= 90 || motorFault}
              activeOpacity={0.85}
            >
              <Text style={styles.btnIcon}>💧</Text>
              <Text style={styles.btnText}>
                {!isOnline
                  ? "DEVICE OFFLINE • LOCKED"
                  : waterLevel >= 90
                  ? "TANK FULL • READY"
                  : "1-TAP REFILL (10 MINS)"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.overridePillBtn}
            onPress={() => onToggleManualOverride(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.overridePillIcon}>⚡</Text>
            <Text style={styles.overridePillText}>OVERRIDE</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  greetingCol: {
    flex: 1,
  },
  greetingText: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  welcomeSub: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  summaryMessage: {
    color: "#334155",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  readinessContainer: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  readinessItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  readinessIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  readinessTextCol: {
    flexShrink: 1,
  },
  readinessLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
  },
  readinessStatus: {
    fontSize: 12,
    fontWeight: "800",
  },
  statusGood: {
    color: "#16A34A",
  },
  statusLow: {
    color: "#DC2626",
  },
  readinessDivider: {
    width: 1,
    height: 22,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 4,
  },
  modeBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modeStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },
  modeDotAuto: {
    backgroundColor: "#16A34A",
  },
  modeDotOverride: {
    backgroundColor: "#D97706",
  },
  modeStatusText: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "700",
  },
  overrideToggleBtn: {
    backgroundColor: "#000000",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  overrideToggleBtnActive: {
    backgroundColor: "#D97706",
  },
  overrideToggleText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  overrideToggleTextActive: {
    color: "#FFFFFF",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#000000",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  stopBtn: {
    backgroundColor: "#000000",
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  overridePillBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000000",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  overridePillIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  overridePillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  manualControlsBox: {
    width: "100%",
  },
  manualBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  manualActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginHorizontal: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  manualBtnSolid: {
    backgroundColor: "#000000",
  },
  manualBtnRunning: {
    backgroundColor: "#000000",
    borderWidth: 1.5,
    borderColor: "#10B981",
  },
  manualBtnIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  manualBtnTextCol: {
    flex: 1,
  },
  manualBtnAction: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  manualBtnSub: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
  },
});

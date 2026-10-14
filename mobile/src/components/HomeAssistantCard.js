import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function HomeAssistantCard({
  waterLevel = 60,
  motorRunning = false,
  motorFault = false,
  valveOpen = false,
  capacityLiters = 20,
  onQuickTopUp = () => {},
  onStopPump = () => {},
  onOpenVoice = () => {},
  onOpenHelp = () => {},
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

  if (motorFault) {
    message = "Safety shutoff active: Pump was stopped to prevent dry-running. Tap below to inspect.";
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

      {/* Household Readiness Indicators */}
      <View style={styles.readinessContainer}>
        <View style={styles.readinessItem}>
          <Text style={styles.readinessIcon}>🚿</Text>
          <View>
            <Text style={styles.readinessLabel}>Shower</Text>
            <Text style={[styles.readinessStatus, showerReady ? styles.statusGood : styles.statusLow]}>
              {showerReady ? "Ready" : "Low"}
            </Text>
          </View>
        </View>

        <View style={styles.readinessDivider} />

        <View style={styles.readinessItem}>
          <Text style={styles.readinessIcon}>🍽️</Text>
          <View>
            <Text style={styles.readinessLabel}>Kitchen</Text>
            <Text style={[styles.readinessStatus, kitchenReady ? styles.statusGood : styles.statusLow]}>
              {kitchenReady ? "Ready" : "Low"}
            </Text>
          </View>
        </View>

        <View style={styles.readinessDivider} />

        <View style={styles.readinessItem}>
          <Text style={styles.readinessIcon}>🧺</Text>
          <View>
            <Text style={styles.readinessLabel}>Laundry</Text>
            <Text style={[styles.readinessStatus, laundryReady ? styles.statusGood : styles.statusLow]}>
              {laundryReady ? "Ready" : "Low"}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Action Button Row - SOLID BLACK with WHITE TEXT */}
      <View style={styles.actionRow}>
        {motorRunning ? (
          <TouchableOpacity
            style={[styles.primaryActionBtn, styles.stopBtn]}
            onPress={onStopPump}
            activeOpacity={0.85}
          >
            <Text style={styles.btnIcon}>⏹️</Text>
            <Text style={styles.btnText}>STOP PUMP</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryActionBtn, waterLevel >= 90 && styles.btnDisabled]}
            onPress={() => onQuickTopUp(10)}
            disabled={waterLevel >= 90 || motorFault}
            activeOpacity={0.85}
          >
            <Text style={styles.btnIcon}>💧</Text>
            <Text style={styles.btnText}>
              {waterLevel >= 90 ? "TANK FULL" : "1-TAP REFILL (10M)"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.voiceBtn} onPress={onOpenVoice} activeOpacity={0.85}>
          <Text style={styles.voiceBtnText}>🎙️ VOICE</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpBtn} onPress={onOpenHelp} activeOpacity={0.85}>
          <Text style={styles.helpBtnText}>❓</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  readinessItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  readinessIcon: {
    fontSize: 18,
    marginRight: 8,
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
    height: 24,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
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
  voiceBtn: {
    backgroundColor: "#000000",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  helpBtn: {
    backgroundColor: "#000000",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  helpBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

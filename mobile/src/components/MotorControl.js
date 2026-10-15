import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { hapticFeedback } from "../utils/haptics";

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
  manualOverride = false,
  isOnline = true,
  onToggleManualOverride = () => {},
  onToggle = () => {},
  onSimulateFault = () => {},
}) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [autoStopCountdown, setAutoStopCountdown] = useState(null); // in seconds

  const isFull = probeTop || waterLevel >= fullThreshold;
  const isBlocked = !manualOverride && (isFull || motorFault);

  // Track run duration & auto-stop timer when active
  useEffect(() => {
    let timer;
    if (motorRunning) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);

        setAutoStopCountdown((prevCountdown) => {
          if (prevCountdown !== null) {
            if (prevCountdown <= 1) {
              onToggle("OFF", manualOverride);
              return null;
            }
            return prevCountdown - 1;
          }
          return null;
        });
      }, 1000);
    } else {
      setElapsedSeconds(0);
      setAutoStopCountdown(null);
    }
    return () => clearInterval(timer);
  }, [motorRunning, onToggle, manualOverride]);

  const formatTimer = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handlePress = () => {
    if (isSubmitting) return;
    if (!isOnline) {
      hapticFeedback.warning();
      return;
    }
    hapticFeedback.medium();
    const nextCommand = motorRunning ? "OFF" : "ON";
    setAutoStopCountdown(null);
    onToggle(nextCommand, manualOverride);
  };

  const handleQuickTopUp = (minutes) => {
    if (isSubmitting || isBlocked || !isOnline) {
      hapticFeedback.warning();
      return;
    }
    hapticFeedback.light();
    setAutoStopCountdown(minutes * 60);
    if (!motorRunning) {
      onToggle("ON", manualOverride);
    }
  };

  const watts = (Number(currentAmps || 0.85) * Number(busVoltage || 12.0)).toFixed(1);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.cardTitle}>Water Pump</Text>
          <Text style={styles.cardSubtitle}>
            {!isOnline
              ? "⚠️ Device Offline • Pump controls disabled"
              : motorRunning
              ? autoStopCountdown !== null
                ? `Auto-Stop in ${formatTimer(autoStopCountdown)} • Total: ${formatTimer(elapsedSeconds)}`
                : `Active & Pumping (${formatTimer(elapsedSeconds)})`
              : manualOverride
              ? "⚡ Manual Override Active • Turn on/off at will"
              : "Pump is idle • Automatic safety guards active"}
          </Text>
        </View>

        <View style={[styles.statusBadge, motorRunning ? styles.badgeActive : styles.badgeIdle]}>
          <View style={[styles.statusDot, motorRunning ? styles.dotActive : styles.dotIdle]} />
          <Text style={[styles.statusText, motorRunning ? styles.textActive : styles.textIdle]}>
            {!isOnline ? "OFFLINE" : motorRunning ? "PUMPING WATER" : "STANDBY"}
          </Text>
        </View>
      </View>

      {/* Safety Notice or Manual Override Banners */}
      {manualOverride ? (
        <View style={styles.overrideActiveBanner}>
          <Text style={styles.bannerIcon}>⚡</Text>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Manual Override Mode Active</Text>
            <Text style={styles.bannerDesc}>
              Safety cutoffs are bypassed. You can start or stop the pump at any water level.
            </Text>
            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={() => onToggleManualOverride(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.restoreBtnText}>Restore Auto-Protection</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : motorFault ? (
        <View style={styles.faultBanner}>
          <Text style={styles.bannerIcon}>⚠️</Text>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Dry-Run Safety Shutoff</Text>
            <Text style={styles.bannerDesc}>
              No water was detected flowing. The motor was automatically turned off to protect it.
            </Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                hapticFeedback.success();
                onSimulateFault(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.resetBtnText}>Reset Pump</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isFull ? (
        <View style={styles.fullBanner}>
          <Text style={styles.bannerIcon}>🛡️</Text>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Automatic Full-Tank Cut-Off</Text>
            <Text style={styles.bannerDesc}>
              Tank reached capacity (≥90%). Auto-lockout is engaged to prevent overflow.
            </Text>
            <TouchableOpacity
              style={styles.overrideLinkBtn}
              onPress={() => onToggleManualOverride(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.overrideLinkText}>⚡ Turn On Manual Override</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Main Action Button - SOLID BLACK with WHITE TEXT */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.mainButton,
            motorRunning && styles.mainButtonRunning,
            (!isOnline || (isBlocked && !motorRunning)) && styles.btnDisabled,
          ]}
          onPress={handlePress}
          disabled={isSubmitting || !isOnline || (isBlocked && !motorRunning)}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.btnInner}>
              <View style={styles.btnTitleRow}>
                <Text style={styles.btnIconText}>{motorRunning ? "⏹" : "▶"}</Text>
                <Text style={styles.btnMainText}>
                  {!isOnline
                    ? "DEVICE OFFLINE"
                    : motorRunning
                    ? manualOverride
                      ? "STOP WATER PUMP (OVERRIDE)"
                      : "STOP WATER PUMP"
                    : manualOverride
                    ? "START WATER PUMP (OVERRIDE)"
                    : "START WATER PUMP"}
                </Text>
              </View>
              <Text style={styles.btnSubText}>
                {!isOnline
                  ? "⚠️ Device disconnected • Reconnect ESP32 to run pump"
                  : motorRunning
                  ? autoStopCountdown !== null
                    ? `Auto-stopping in ${formatTimer(autoStopCountdown)} • Tap to stop now`
                    : "Pump running • Tap to safely stop immediately"
                  : manualOverride
                  ? "Manual override active • Tap to start pumping water"
                  : isBlocked
                  ? "Turn on locked while tank is full • Use override to test"
                  : "Tap to begin pumping water into tank"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Refill Duration Presets with Live Auto-Countdown */}
      {!isBlocked && (
        <View style={styles.quickFillContainer}>
          <Text style={styles.quickFillHeader}>Quick Fill Timers (Auto-Stop):</Text>
          <View style={styles.quickFillRow}>
            <TouchableOpacity
              style={[
                styles.quickFillPill,
                autoStopCountdown === 300 && styles.quickFillPillActive,
                !isOnline && styles.quickFillPillDisabled,
              ]}
              onPress={() => handleQuickTopUp(5)}
              disabled={isSubmitting || !isOnline}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.quickFillText,
                  autoStopCountdown === 300 && styles.quickFillTextActive,
                  !isOnline && styles.quickFillTextDisabled,
                ]}
              >
                ⏱️ 5 Min
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickFillPill,
                autoStopCountdown === 600 && styles.quickFillPillActive,
                !isOnline && styles.quickFillPillDisabled,
              ]}
              onPress={() => handleQuickTopUp(10)}
              disabled={isSubmitting || !isOnline}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.quickFillText,
                  autoStopCountdown === 600 && styles.quickFillTextActive,
                ]}
              >
                ⏱️ 10 Min
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickFillPill}
              onPress={() => {
                setAutoStopCountdown(null);
                if (!motorRunning) onToggle("ON");
              }}
              disabled={isSubmitting || motorRunning}
              activeOpacity={0.7}
            >
              <Text style={styles.quickFillText}>💧 Fill to Full (90%)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Summary Metrics */}
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
            {motorRunning ? `${watts} W (${Number(currentAmps || 0.85).toFixed(2)}A)` : "0.0 W"}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Safety Guard</Text>
          <Text style={styles.metricValue}>90% Cutoff</Text>
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
    borderRadius: 24,
    padding: 22,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  badgeActive: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  badgeIdle: {
    backgroundColor: "#F1F5F9",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  dotActive: {
    backgroundColor: "#16A34A",
  },
  dotIdle: {
    backgroundColor: "#94A3B8",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
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
  overrideActiveBanner: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
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
    fontSize: 14,
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
  overrideLinkBtn: {
    backgroundColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  overrideLinkText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  restoreBtn: {
    backgroundColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  restoreBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  buttonContainer: {
    marginVertical: 4,
  },
  mainButton: {
    backgroundColor: "#000000",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  mainButtonRunning: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnInner: {
    alignItems: "center",
  },
  btnTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  btnIconText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginRight: 8,
  },
  btnMainText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  btnSubText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 5,
  },
  quickFillContainer: {
    marginTop: 12,
  },
  quickFillHeader: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickFillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  quickFillPill: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  quickFillPillActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  quickFillText: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "700",
  },
  quickFillTextActive: {
    color: "#FFFFFF",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 14,
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
    fontSize: 14,
    fontWeight: "800",
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
  quickFillPillDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
    opacity: 0.5,
  },
  quickFillTextDisabled: {
    color: "#94A3B8",
  },
});

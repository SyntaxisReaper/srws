import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";

export default function ValveControl({
  valveState = "CLOSED",
  waterLevel = 60,
  probeTop = false,
  isSubmitting = false,
  manualOverride = false,
  onToggleManualOverride = () => {},
  onToggleValve = () => {},
}) {
  const isOpen = valveState === "OPEN";
  const isFull = probeTop || waterLevel >= 90;
  const isBlocked = !manualOverride && isFull;

  const handlePress = () => {
    if (isSubmitting) return;
    const nextCommand = isOpen ? "CLOSED" : "OPEN";
    onToggleValve(nextCommand, manualOverride);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.cardTitle}>Water Supply Valve</Text>
          <Text style={styles.cardSubtitle}>
            {isOpen
              ? "Inlet valve is OPEN • Municipal water flowing in"
              : manualOverride
              ? "⚡ Manual Override Active • You can open or close anytime"
              : "Inlet valve is CLOSED • City supply shut"}
          </Text>
        </View>

        <View style={[styles.statusBadge, isOpen ? styles.badgeOpen : styles.badgeClosed]}>
          <View style={[styles.statusDot, isOpen ? styles.dotOpen : styles.dotClosed]} />
          <Text style={[styles.statusText, isOpen ? styles.textOpen : styles.textClosed]}>
            {isOpen ? "INLET OPEN" : "SHUT"}
          </Text>
        </View>
      </View>

      {/* Manual Override Active or Full-Tank Lockout Banner */}
      {manualOverride ? (
        <View style={styles.overrideBanner}>
          <Text style={styles.lockoutIcon}>⚡</Text>
          <View style={styles.overrideTextCol}>
            <Text style={styles.overrideTitle}>Manual Override Mode Active</Text>
            <Text style={styles.overrideSub}>
              Safety cutoffs bypassed. You can open or close the valve anytime.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={() => onToggleManualOverride(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.restoreBtnText}>Restore Auto</Text>
          </TouchableOpacity>
        </View>
      ) : isFull ? (
        <View style={styles.lockoutBanner}>
          <Text style={styles.lockoutIcon}>🛡️</Text>
          <Text style={styles.lockoutText}>
            Supply locked: Tank is full. Valve remains shut to prevent overflow.
          </Text>
          <TouchableOpacity
            style={styles.overrideBtn}
            onPress={() => onToggleManualOverride(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.overrideBtnText}>⚡ Override</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Simplified Flow Graphic with Wave Indicator */}
      <View style={styles.flowGraphicRow}>
        <View style={styles.flowEndpoint}>
          <Text style={styles.flowEndpointIcon}>🚰</Text>
          <Text style={styles.flowEndpointLabel}>City Line</Text>
        </View>

        <View style={styles.pipeLineTrack}>
          <View style={[styles.pipeLineFill, isOpen && styles.pipeLineActive]} />
        </View>

        <View style={[styles.valveCenterIcon, isOpen && styles.valveCenterActive]}>
          <Text style={styles.valveIconText}>{isOpen ? "🌊" : "🔒"}</Text>
        </View>

        <View style={styles.pipeLineTrack}>
          <View style={[styles.pipeLineFill, isOpen && styles.pipeLineActive]} />
        </View>

        <View style={styles.flowEndpoint}>
          <Text style={styles.flowEndpointIcon}>🏠</Text>
          <Text style={styles.flowEndpointLabel}>Your Tank</Text>
        </View>
      </View>

      {/* Main Action Button - SOLID BLACK with WHITE TEXT */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.mainButton,
            isBlocked && !isOpen && styles.btnDisabled,
          ]}
          onPress={handlePress}
          disabled={isSubmitting || (isBlocked && !isOpen)}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.btnInner}>
              <View style={styles.btnTitleRow}>
                <Text style={styles.btnIconText}>{isOpen ? "🛑" : "💧"}</Text>
                <Text style={styles.btnMainText}>
                  {isOpen
                    ? manualOverride
                      ? "CLOSE WATER VALVE (OVERRIDE)"
                      : "CLOSE WATER VALVE"
                    : manualOverride
                    ? "OPEN WATER VALVE (OVERRIDE)"
                    : "OPEN WATER VALVE"}
                </Text>
              </View>
              <Text style={styles.btnSubText}>
                {isOpen
                  ? "Tap to shut off incoming municipal water"
                  : manualOverride
                  ? "Manual override active • Tap to open supply valve"
                  : isFull
                  ? "Valve locked while tank is full • Tap override to open"
                  : "Tap to allow incoming municipal water"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
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
  badgeOpen: {
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  badgeClosed: {
    backgroundColor: "#F1F5F9",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  dotOpen: {
    backgroundColor: "#0284C7",
  },
  dotClosed: {
    backgroundColor: "#94A3B8",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  textOpen: {
    color: "#0284C7",
  },
  textClosed: {
    color: "#64748B",
  },
  lockoutBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  lockoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  lockoutText: {
    flex: 1,
    color: "#166534",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  overrideBtn: {
    backgroundColor: "#000000",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  overrideBtnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  overrideBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  overrideTextCol: {
    flex: 1,
  },
  overrideTitle: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "800",
  },
  overrideSub: {
    color: "#78350F",
    fontSize: 11,
    marginTop: 2,
  },
  restoreBtn: {
    backgroundColor: "#000000",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  restoreBtnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  flowGraphicRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  flowEndpoint: {
    alignItems: "center",
    width: 60,
  },
  flowEndpointIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  flowEndpointLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
  },
  pipeLineTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  pipeLineFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  pipeLineActive: {
    backgroundColor: "#0EA5E9",
  },
  valveCenterIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  valveCenterActive: {
    borderColor: "#0EA5E9",
    backgroundColor: "#E0F2FE",
  },
  valveIconText: {
    fontSize: 16,
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
});

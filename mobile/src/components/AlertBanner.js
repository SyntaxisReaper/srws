import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function AlertBanner({
  motorFault = false,
  waterLevel = 50,
  probeTop = false,
  probeLow = true,
  valveOpen = false,
  onResetFault = () => {},
  onOpenValve = () => {},
  onOpenSettings = () => {},
}) {
  const isFull = probeTop || waterLevel >= 90;
  const isLow = !probeLow || waterLevel <= 20;

  let activeAlert = null;

  if (motorFault) {
    activeAlert = {
      type: "critical",
      icon: "🚨",
      title: "DRY-RUN MOTOR FAULT",
      desc: "Current dropped below 0.2A. MOSFET cut power.",
      actionText: "RESET FAULT",
      action: onResetFault,
      bg: "rgba(220, 38, 38, 0.2)",
      border: "#EF4444",
      textColor: "#EF4444",
      btnBg: "#EF4444",
    };
  } else if (isLow) {
    activeAlert = {
      type: "warning",
      icon: "⚠️",
      title: "LOW WATER WARNING",
      desc: `Tank level dropped to ${waterLevel}%. Tap to supply water.`,
      actionText: valveOpen ? "VALVE OPEN" : "OPEN VALVE",
      action: valveOpen ? null : onOpenValve,
      bg: "rgba(245, 158, 11, 0.15)",
      border: "#F59E0B",
      textColor: "#F59E0B",
      btnBg: "#F59E0B",
    };
  } else if (isFull) {
    activeAlert = {
      type: "success",
      icon: "💧",
      title: "TANK FULL — OVERFLOW CUT-OFF",
      desc: "Top probe submerged. Pump and valve locked off.",
      actionText: null,
      action: null,
      bg: "rgba(16, 185, 129, 0.15)",
      border: "#10B981",
      textColor: "#10B981",
      btnBg: "#10B981",
    };
  }

  return (
    <View style={styles.container}>
      {activeAlert ? (
        <View style={[styles.banner, { backgroundColor: activeAlert.bg, borderColor: activeAlert.border }]}>
          <View style={styles.contentRow}>
            <Text style={styles.bannerIcon}>{activeAlert.icon}</Text>
            <View style={styles.textWrap}>
              <Text style={[styles.bannerTitle, { color: activeAlert.textColor }]}>
                {activeAlert.title}
              </Text>
              <Text style={styles.bannerDesc} numberOfLines={2}>
                {activeAlert.desc}
              </Text>
            </View>

            {activeAlert.actionText && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: activeAlert.btnBg }]}
                onPress={activeAlert.action}
                disabled={!activeAlert.action}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>{activeAlert.actionText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.quietBar}>
          <View style={styles.quietLeft}>
            <View style={styles.quietDot} />
            <Text style={styles.quietText}>All Systems Nominal • Overflow Guard Active</Text>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={onOpenSettings}
            activeOpacity={0.7}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            <Text style={styles.bellText}>Alerts</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
    marginRight: 8,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bannerDesc: {
    color: "#E2E8F0",
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnText: {
    color: "#0B132B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  quietBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quietLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  quietDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 8,
  },
  quietText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  bellBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 210, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bellIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  bellText: {
    color: "#00D2FF",
    fontSize: 11,
    fontWeight: "700",
  },
});

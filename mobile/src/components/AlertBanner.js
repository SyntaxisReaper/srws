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
      icon: "⚠️",
      title: "Pump Auto-Stopped (Safety Guard)",
      desc: "Pump stopped automatically to protect the motor from dry running.",
      actionText: "Reset Pump Alert",
      action: onResetFault,
      borderColor: "#FCA5A5",
      bgColor: "#FEF2F2",
    };
  } else if (isLow) {
    activeAlert = {
      type: "warning",
      icon: "💧",
      title: "Low Water Warning",
      desc: `Tank is at ${waterLevel}%. Tap to open the water supply valve.`,
      actionText: valveOpen ? "Valve Already Open" : "Open Water Valve",
      action: valveOpen ? null : onOpenValve,
      borderColor: "#FDE68A",
      bgColor: "#FFFBEB",
    };
  } else if (isFull) {
    activeAlert = {
      type: "success",
      icon: "✅",
      title: "Tank is Completely Full",
      desc: "Water level is at maximum. Pump and supply valve are safely shut.",
      actionText: null,
      action: null,
      borderColor: "#BBF7D0",
      bgColor: "#F0FDF4",
    };
  }

  return (
    <View style={styles.container}>
      {activeAlert ? (
        <View style={[styles.banner, { backgroundColor: activeAlert.bgColor, borderColor: activeAlert.borderColor }]}>
          <View style={styles.iconCol}>
            <Text style={styles.bannerIcon}>{activeAlert.icon}</Text>
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.bannerTitle}>{activeAlert.title}</Text>
            <Text style={styles.bannerDesc}>{activeAlert.desc}</Text>
            {activeAlert.actionText && (
              <TouchableOpacity
                style={[styles.actionBtn, !activeAlert.action && styles.btnDisabled]}
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
            <Text style={styles.quietText}>All systems normal • Automatic guards active</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={onOpenSettings}
            activeOpacity={0.8}
          >
            <Text style={styles.settingsBtnText}>Alert Settings</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  banner: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  iconCol: {
    marginRight: 12,
    marginTop: 2,
  },
  bannerIcon: {
    fontSize: 22,
  },
  textWrap: {
    flex: 1,
  },
  bannerTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  bannerDesc: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  actionBtn: {
    backgroundColor: "#000000",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: "flex-start",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  quietBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quietLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  quietDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A",
    marginRight: 8,
  },
  quietText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "500",
  },
  settingsBtn: {
    backgroundColor: "#000000",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  settingsBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
});

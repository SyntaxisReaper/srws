import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch } from "react-native";
import { triggerNativeAlert } from "../services/notificationService";

export default function AlertSettingsModal({
  visible = false,
  onClose = () => {},
}) {
  const [notifyFull, setNotifyFull] = useState(true);
  const [notifyLow, setNotifyLow] = useState(true);
  const [notifyFault, setNotifyFault] = useState(true);
  const [vibrateSound, setVibrateSound] = useState(true);
  const [testSent, setTestSent] = useState(false);

  const handleTestAlert = async () => {
    setTestSent(true);
    await triggerNativeAlert(
      "💧 HydroNode Alert Test",
      "System armed! Overflow auto cut-off & dry-run monitors are active.",
      "default"
    );
    setTimeout(() => setTestSent(false), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>ALERT & NOTIFICATION HUB</Text>
              <Text style={styles.subtitle}>Native Push & Hardware Warnings</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Setting Items */}
          <View style={styles.body}>
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>💧 Tank Full Protection</Text>
                <Text style={styles.settingDesc}>Alert when tank reaches 90% or higher and cuts pump</Text>
              </View>
              <Switch
                value={notifyFull}
                onValueChange={setNotifyFull}
                trackColor={{ false: "#1E293B", true: "#00D2FF" }}
                thumbColor={notifyFull ? "#FFFFFF" : "#64748B"}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>⚠️ Low Water Level Alert</Text>
                <Text style={styles.settingDesc}>Alert when tank drops to 20% or lower</Text>
              </View>
              <Switch
                value={notifyLow}
                onValueChange={setNotifyLow}
                trackColor={{ false: "#1E293B", true: "#00D2FF" }}
                thumbColor={notifyLow ? "#FFFFFF" : "#64748B"}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>🚨 Dry-Run Fault Alarm</Text>
                <Text style={styles.settingDesc}>Urgent alert when current drops below 0.2A</Text>
              </View>
              <Switch
                value={notifyFault}
                onValueChange={setNotifyFault}
                trackColor={{ false: "#1E293B", true: "#00D2FF" }}
                thumbColor={notifyFault ? "#FFFFFF" : "#64748B"}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>📳 Haptic Vibration & Sound</Text>
                <Text style={styles.settingDesc}>Vibrate phone during safety trips</Text>
              </View>
              <Switch
                value={vibrateSound}
                onValueChange={setVibrateSound}
                trackColor={{ false: "#1E293B", true: "#10B981" }}
                thumbColor={vibrateSound ? "#FFFFFF" : "#64748B"}
              />
            </View>
          </View>

          {/* Test Trigger Button */}
          <TouchableOpacity
            style={[styles.testBtn, testSent && styles.testBtnSent]}
            onPress={handleTestAlert}
            activeOpacity={0.8}
          >
            <Text style={styles.testBtnText}>
              {testSent ? "✓ PUSH DISPATCHED!" : "🔔 TEST INSTANT NATIVE PUSH ALERT"}
            </Text>
          </TouchableOpacity>

          {/* Done Button */}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Save Preferences</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#111C3D",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 210, 255, 0.2)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    paddingBottom: 14,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  settingText: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    color: "#F1F5F9",
    fontSize: 13,
    fontWeight: "700",
  },
  settingDesc: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },
  testBtn: {
    backgroundColor: "rgba(0, 210, 255, 0.15)",
    borderColor: "#00D2FF",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 10,
  },
  testBtnSent: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10B981",
  },
  testBtnText: {
    color: "#00D2FF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  doneBtn: {
    backgroundColor: "#00D2FF",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  doneBtnText: {
    color: "#0B132B",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

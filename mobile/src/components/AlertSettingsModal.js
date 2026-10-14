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
      "Notification system working! Overflow protection & pump guards are active.",
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
              <Text style={styles.title}>Notification Settings</Text>
              <Text style={styles.subtitle}>Choose which alerts you want to receive</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Setting Items */}
          <View style={styles.body}>
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>💧 Tank Full Notification</Text>
                <Text style={styles.settingDesc}>Notify when tank reaches 90% or higher and pump shuts off</Text>
              </View>
              <Switch
                value={notifyFull}
                onValueChange={setNotifyFull}
                trackColor={{ false: "#E2E8F0", true: "#000000" }}
                thumbColor={notifyFull ? "#FFFFFF" : "#94A3B8"}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>⚠️ Low Water Level Warning</Text>
                <Text style={styles.settingDesc}>Notify when tank drops to 20% or lower</Text>
              </View>
              <Switch
                value={notifyLow}
                onValueChange={setNotifyLow}
                trackColor={{ false: "#E2E8F0", true: "#000000" }}
                thumbColor={notifyLow ? "#FFFFFF" : "#94A3B8"}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>🚨 Pump Safety Alerts</Text>
                <Text style={styles.settingDesc}>Notify if pump is automatically stopped for protection</Text>
              </View>
              <Switch
                value={notifyFault}
                onValueChange={setNotifyFault}
                trackColor={{ false: "#E2E8F0", true: "#000000" }}
                thumbColor={notifyFault ? "#FFFFFF" : "#94A3B8"}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>📳 Phone Vibration</Text>
                <Text style={styles.settingDesc}>Vibrate phone when urgent warnings trigger</Text>
              </View>
              <Switch
                value={vibrateSound}
                onValueChange={setVibrateSound}
                trackColor={{ false: "#E2E8F0", true: "#000000" }}
                thumbColor={vibrateSound ? "#FFFFFF" : "#94A3B8"}
              />
            </View>
          </View>

          {/* Test Trigger Button - SOLID BLACK with WHITE TEXT */}
          <TouchableOpacity
            style={[styles.testBtn, testSent && styles.testBtnSent]}
            onPress={handleTestAlert}
            activeOpacity={0.8}
          >
            <Text style={styles.testBtnText}>
              {testSent ? "✓ NOTIFICATION SENT" : "🔔 SEND TEST NOTIFICATION"}
            </Text>
          </TouchableOpacity>

          {/* Done Button - SOLID BLACK with WHITE TEXT */}
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 14,
  },
  title: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    marginBottom: 18,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  settingText: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  settingDesc: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  testBtn: {
    backgroundColor: "#000000",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  testBtnSent: {
    backgroundColor: "#16A34A",
  },
  testBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  doneBtn: {
    backgroundColor: "#000000",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

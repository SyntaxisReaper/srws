import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useDeviceStatus } from "./src/hooks/useDeviceStatus";
import WaterLevelGauge from "./src/components/WaterLevelGauge";
import MotorControl from "./src/components/MotorControl";
import ValveControl from "./src/components/ValveControl";
import StatusBarComponent from "./src/components/StatusBar";
import AlertHistory from "./src/components/AlertHistory";
import SchedulerPanel from "./src/components/SchedulerPanel";
import AlertBanner from "./src/components/AlertBanner";
import AlertSettingsModal from "./src/components/AlertSettingsModal";
import { DEFAULT_DEVICE_ID } from "./src/services/firebaseConfig";
import {
  registerForPushNotificationsAsync,
  triggerNativeAlert,
} from "./src/services/notificationService";

export default function App() {
  const [useSimulation, setUseSimulation] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const prevStatusRef = useRef({ waterLevel: 50, motorFault: false });

  const {
    deviceData,
    loading,
    isSubmitting,
    actionError,
    clearError,
    toggleMotor,
    toggleValve,
    simulateFault,
    changeWaterLevel,
    saveSchedule,
  } = useDeviceStatus(DEFAULT_DEVICE_ID, useSimulation);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const status = deviceData?.status || {};
  const commands = deviceData?.commands || {};
  const config = deviceData?.config || {};
  const rawHistory = deviceData?.history;
  const history = Array.isArray(rawHistory)
    ? rawHistory
    : rawHistory && typeof rawHistory === "object"
    ? Object.keys(rawHistory)
        .map((key) => ({
          id: key,
          ...rawHistory[key],
          ts: rawHistory[key]?.ts || Number(key) || Date.now(),
        }))
        .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    : [];

  // Register native notification permissions on startup
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  // Monitor live transitions and trigger instant native push alerts
  useEffect(() => {
    const prev = prevStatusRef.current;
    const currentLevel = status.waterLevel ?? 50;
    const currentFault = !!status.motorFault;

    // 1. Tank full overflow cutoff
    if (currentLevel >= 90 && prev.waterLevel < 90) {
      triggerNativeAlert(
        "💧 Tank Full Cut-Off",
        `Tank reached ${currentLevel}%. Overflow cut-off engaged, pump stopped.`,
        "default"
      );
    }
    // 2. Low water alert
    else if (currentLevel <= 20 && prev.waterLevel > 20) {
      triggerNativeAlert(
        "⚠️ Low Water Warning",
        `Water level dropped to ${currentLevel}%. Open supply valve or start pump.`,
        "default"
      );
    }
    // 3. Dry-run motor fault
    if (currentFault && !prev.motorFault) {
      triggerNativeAlert(
        "🚨 Motor Safety Shutoff",
        "Dry-run detected (no water flow). Power cut to protect the pump.",
        "critical"
      );
    }

    prevStatusRef.current = { waterLevel: currentLevel, motorFault: currentFault };
  }, [status.waterLevel, status.motorFault]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ExpoStatusBar style="dark" />
      <NativeStatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Main Top Header - Clean Minimalist White */}
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>💧</Text>
          </View>
          <View>
            <Text style={styles.appName}>HydroNode</Text>
            <Text style={styles.appSub}>Smart Water & Motor Management</Text>
          </View>
        </View>

        {/* Black Button with White Text */}
        <TouchableOpacity
          style={styles.infoBadge}
          onPress={() => setUseSimulation(!useSimulation)}
          activeOpacity={0.8}
        >
          <Text style={styles.infoBadgeText}>
            {useSimulation ? "DEMO MODE" : "LIVE DEVICE"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={["#000000"]}
          />
        }
      >
        {/* Device Status & Network Health */}
        <StatusBarComponent
          deviceId={DEFAULT_DEVICE_ID}
          lastSeen={status.lastSeen}
          wifiStrength={status.wifiStrength || -65}
          networkUplink={status.networkUplink || "Wi-Fi Connected"}
          isSimulation={useSimulation}
          onToggleSimulation={() => setUseSimulation(!useSimulation)}
        />

        {/* Dynamic Heads-Up Alert & Warning Banner */}
        <AlertBanner
          motorFault={status.motorFault || false}
          waterLevel={status.waterLevel ?? 50}
          probeTop={status.probeTop || false}
          probeLow={status.probeLow !== false}
          valveOpen={status.valveOpen || status.valveState === "OPEN"}
          onResetFault={simulateFault}
          onOpenValve={() => toggleValve("OPEN")}
          onOpenSettings={() => setShowAlertSettings(true)}
        />

        {/* Live Water Level Gauge */}
        <WaterLevelGauge
          waterLevel={status.waterLevel ?? 60}
          levelState={status.levelState || "MEDIUM"}
          probeTop={status.probeTop || false}
          probeMid={status.probeMid !== false}
          probeLow={status.probeLow !== false}
          tankHeight={config.tankHeightCm || 30}
          capacityLiters={config.tankCapacityLiters || 20}
          onLevelAdjust={useSimulation ? changeWaterLevel : null}
        />

        {/* Motor Remote Control */}
        <MotorControl
          motorRunning={status.motorRunning || false}
          motorFault={status.motorFault || false}
          relayState={status.relayState || "OFF"}
          currentAmps={status.currentAmps || 0.0}
          busVoltage={status.busVoltage || 12.2}
          flowRateLpm={status.flowRateLpm || 0.0}
          waterLevel={status.waterLevel ?? 60}
          fullThreshold={config.fullThreshold || 90}
          probeTop={status.probeTop || false}
          isSubmitting={isSubmitting}
          onToggle={toggleMotor}
          onSimulateFault={simulateFault}
        />

        {/* Remote Water-Supply Valve Control */}
        <ValveControl
          valveState={status.valveState || "CLOSED"}
          waterLevel={status.waterLevel ?? 60}
          probeTop={status.probeTop || false}
          isSubmitting={isSubmitting}
          onToggleValve={toggleValve}
        />

        {/* Automation & Timed Scheduler */}
        <SchedulerPanel
          scheduledOn={commands.scheduledOn || "06:00"}
          scheduledOff={commands.scheduledOff || "06:30"}
          autoMode={commands.autoMode !== false}
          onSaveSchedule={saveSchedule}
        />

        {/* Chronological Activity History */}
        <AlertHistory history={history} />

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            HydroNode • Smart Water Management • Safety Protected
          </Text>
        </View>
      </ScrollView>

      {/* Action Error Modal - Clean White with Black Button */}
      <Modal
        visible={!!actionError}
        transparent
        animationType="fade"
        onRequestClose={clearError}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>⚠️</Text>
            <Text style={styles.modalTitle}>Notice</Text>
            <Text style={styles.modalMessage}>{actionError}</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={clearError}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Acknowledge</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Alert Settings & Test Push Notification Modal */}
      <AlertSettingsModal
        visible={showAlertSettings}
        onClose={() => setShowAlertSettings(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  logoIcon: {
    fontSize: 20,
  },
  appName: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  appSub: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "500",
  },
  infoBadge: {
    backgroundColor: "#000000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  footerNote: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "500",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  modalTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },
  modalMessage: {
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  modalBtn: {
    backgroundColor: "#000000",
    paddingVertical: 12,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

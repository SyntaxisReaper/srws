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
        "🚨 Motor Dry-Run Fault",
        "INA226 detected current < 0.2A! Power cut to protect pump.",
        "critical"
      );
    }

    prevStatusRef.current = { waterLevel: currentLevel, motorFault: currentFault };
  }, [status.waterLevel, status.motorFault]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ExpoStatusBar style="light" />
      <NativeStatusBar barStyle="light-content" backgroundColor="#0B132B" />

      {/* Main Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>💧</Text>
          </View>
          <View>
            <Text style={styles.appName}>HydroNode</Text>
            <Text style={styles.appSub}>Smart Water & Motor Control</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.infoBadge}
          onPress={() => setUseSimulation(!useSimulation)}
          activeOpacity={0.7}
        >
          <Text style={styles.infoBadgeText}>
            {useSimulation ? "DEMO MODE" : "HARDWARE"}
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
            tintColor="#00D2FF"
            colors={["#00D2FF"]}
          />
        }
      >
        {/* Device Status & Network Health with Failover info */}
        <StatusBarComponent
          deviceId={DEFAULT_DEVICE_ID}
          lastSeen={status.lastSeen}
          wifiStrength={status.wifiStrength || -65}
          networkUplink={status.networkUplink || "Wi-Fi (Primary) • Hotspot Ready"}
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

        {/* Live Water Level Gauge (3 Contact Probes) */}
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

        {/* Motor Remote Control & Overfill / Dry-Run Guards */}
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

        {/* Remote Water-Supply Valve Control (GPIO 27 / Solenoid Actuator) */}
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

        {/* Chronological Alert & Audit History */}
        <AlertHistory history={history} />

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            ESP32 • Contact Probes • INA226 • LR7843 MOSFET • Android APK Ready
          </Text>
        </View>
      </ScrollView>

      {/* Action Error Modal */}
      <Modal
        visible={!!actionError}
        transparent
        animationType="fade"
        onRequestClose={clearError}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>⚠️</Text>
            <Text style={styles.modalTitle}>Command Notice</Text>
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
    backgroundColor: "#0B132B",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
    backgroundColor: "#0B132B",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(0, 210, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#00D2FF",
  },
  logoIcon: {
    fontSize: 20,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  appSub: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "500",
  },
  infoBadge: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  infoBadgeText: {
    color: "#00D2FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  scrollView: {
    flex: 1,
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
    color: "#4B5563",
    fontSize: 11,
    fontWeight: "500",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  modalIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  modalTitle: {
    color: "#F9FAFB",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },
  modalMessage: {
    color: "#D1D5DB",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  modalBtn: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  modalBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

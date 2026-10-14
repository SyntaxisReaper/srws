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
  Switch,
  Platform,
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
import WaterUsageChart from "./src/components/WaterUsageChart";
import HomeAssistantCard from "./src/components/HomeAssistantCard";
import HelpFaqModal from "./src/components/HelpFaqModal";
import VoiceControlModal from "./src/components/VoiceControlModal";
import { DEFAULT_DEVICE_ID } from "./src/services/firebaseConfig";
import {
  registerForPushNotificationsAsync,
  triggerNativeAlert,
} from "./src/services/notificationService";

export default function App() {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "automation" | "activity"
  const [useSimulation, setUseSimulation] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);
  const prevStatusRef = useRef({ waterLevel: 50, motorFault: false });

  // Notification Preferences
  const [notifyFull, setNotifyFull] = useState(true);
  const [notifyLow, setNotifyLow] = useState(true);
  const [notifyFault, setNotifyFault] = useState(true);
  const [vibrateSound, setVibrateSound] = useState(true);
  const [testSent, setTestSent] = useState(false);

  const {
    deviceData,
    loading,
    isSubmitting,
    actionError,
    clearError,
    toggleMotor,
    toggleValve,
    setManualOverride,
    simulateFault,
    changeWaterLevel,
    saveSchedule,
  } = useDeviceStatus(DEFAULT_DEVICE_ID, useSimulation);

  const showToast = (msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  };

  const handleToggleMotor = (nextCmd, override = false) => {
    const isOverrideActive = override || commands.manualOverride === true;
    toggleMotor(nextCmd, isOverrideActive);
    showToast(
      nextCmd === "ON"
        ? isOverrideActive
          ? "⚡ Water pump started (Manual Override)"
          : "⚡ Water pump started"
        : "⏹️ Water pump stopped"
    );
  };

  const handleToggleValve = (nextCmd, override = false) => {
    const isOverrideActive = override || commands.manualOverride === true;
    toggleValve(nextCmd, isOverrideActive);
    showToast(
      nextCmd === "OPEN"
        ? isOverrideActive
          ? "🚰 Supply valve opened (Manual Override)"
          : "🚰 Supply valve opened"
        : "🔒 Supply valve shut"
    );
  };

  const handleToggleManualOverride = (enabled) => {
    setManualOverride(enabled);
    showToast(
      enabled
        ? "⚡ Manual Override Active • Auto-Guards Paused"
        : "🛡️ Auto Protection Guards Restored"
    );
  };

  const handleSaveSchedule = (scheduleData) => {
    saveSchedule(scheduleData);
    showToast("✓ Schedule updated successfully");
  };

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
    if (notifyFull && currentLevel >= 90 && prev.waterLevel < 90) {
      triggerNativeAlert(
        "💧 Tank Full Cut-Off",
        `Tank reached ${currentLevel}%. Overflow cut-off engaged, pump stopped.`,
        "default"
      );
    }
    // 2. Low water alert
    else if (notifyLow && currentLevel <= 20 && prev.waterLevel > 20) {
      triggerNativeAlert(
        "⚠️ Low Water Warning",
        `Water level dropped to ${currentLevel}%. Open supply valve or start pump.`,
        "default"
      );
    }
    // 3. Dry-run motor fault
    if (notifyFault && currentFault && !prev.motorFault) {
      triggerNativeAlert(
        "🚨 Motor Safety Shutoff",
        "Dry-run detected (no water flow). Power cut to protect the pump.",
        "critical"
      );
    }

    prevStatusRef.current = { waterLevel: currentLevel, motorFault: currentFault };
  }, [status.waterLevel, status.motorFault, notifyFull, notifyLow, notifyFault]);

  const handleTestAlert = async () => {
    setTestSent(true);
    showToast("🔔 Test notification triggered");
    await triggerNativeAlert(
      "💧 HydroNode Alert Test",
      "Notification system working! Overflow protection & pump guards are active.",
      "default"
    );
    setTimeout(() => setTestSent(false), 2000);
  };

  const getSubHeader = () => {
    switch (activeTab) {
      case "automation":
        return "Auto-Refill & Daily Schedules";
      case "activity":
        return "Water Usage & Notifications";
      default:
        return "Tank Level & Quick Controls";
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ExpoStatusBar style="dark" />
      <NativeStatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Floating Interactive Toast Feedback Banner */}
      {toastMessage && (
        <TouchableOpacity
          style={styles.toastContainer}
          onPress={() => setToastMessage(null)}
          activeOpacity={0.85}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </TouchableOpacity>
      )}

      {/* Main Top Header - Clean Minimalist White */}
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>💧</Text>
          </View>
          <View>
            <View style={styles.appNameRow}>
              <Text style={styles.appName}>HydroNode</Text>
              <View style={styles.livePulseDot} />
            </View>
            <Text style={styles.appSub}>{getSubHeader()}</Text>
          </View>
        </View>

        {/* Top Header Buttons */}
        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            style={styles.voiceHeaderBtn}
            onPress={() => setShowVoiceModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.voiceHeaderIcon}>🎙️</Text>
            <Text style={styles.voiceHeaderText}>VOICE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpHeaderBtn}
            onPress={() => setShowHelpModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.helpHeaderIcon}>❓</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoBadge}
            onPress={() => {
              const nextMode = !useSimulation;
              setUseSimulation(nextMode);
              showToast(nextMode ? "Demo Mode Active" : "Live Device Active");
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.infoBadgeText}>
              {useSimulation ? "● DEMO" : "● LIVE"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content for the Active Tab */}
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
        {/* TAB 1: OVERVIEW & CONTROLS */}
        {activeTab === "overview" && (
          <View style={styles.tabContent}>
            {/* Friendly Personalized Home Assistant Card */}
            <HomeAssistantCard
              waterLevel={status.waterLevel ?? 60}
              motorRunning={status.motorRunning || false}
              motorFault={status.motorFault || false}
              valveOpen={status.valveOpen || status.valveState === "OPEN"}
              capacityLiters={config.tankCapacityLiters || 20}
              manualOverride={commands.manualOverride === true}
              onToggleManualOverride={handleToggleManualOverride}
              onToggleMotorManual={(cmd) => handleToggleMotor(cmd, true)}
              onToggleValveManual={(cmd) => handleToggleValve(cmd, true)}
              onQuickTopUp={(mins) => {
                handleToggleMotor("ON");
                showToast(`💧 Started ${mins}-minute auto-stop refill`);
              }}
              onStopPump={() => handleToggleMotor("OFF")}
            />

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
              onOpenValve={() => handleToggleValve("OPEN")}
              onOpenSettings={() => setActiveTab("activity")}
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
              motorRunning={status.motorRunning || false}
              valveOpen={status.valveOpen || status.valveState === "OPEN"}
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
              manualOverride={commands.manualOverride === true}
              onToggleManualOverride={handleToggleManualOverride}
              onToggle={handleToggleMotor}
              onSimulateFault={simulateFault}
            />

            {/* Remote Water-Supply Valve Control */}
            <ValveControl
              valveState={status.valveState || "CLOSED"}
              waterLevel={status.waterLevel ?? 60}
              probeTop={status.probeTop || false}
              isSubmitting={isSubmitting}
              manualOverride={commands.manualOverride === true}
              onToggleManualOverride={handleToggleManualOverride}
              onToggleValve={handleToggleValve}
            />
          </View>
        )}

        {/* TAB 2: AUTOMATION & SCHEDULES */}
        {activeTab === "automation" && (
          <View style={styles.tabContent}>
            {/* Automation & Timed Scheduler */}
            <SchedulerPanel
              scheduledOn={commands.scheduledOn || "06:00"}
              scheduledOff={commands.scheduledOff || "06:30"}
              autoMode={commands.autoMode !== false}
              onSaveSchedule={handleSaveSchedule}
            />

            {/* Smart Refill Guide Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>🛡️ Intelligent Protection Rules</Text>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleIcon}>•</Text>
                <Text style={styles.ruleText}>
                  <Text style={styles.ruleBold}>Overflow Cut-Off:</Text> Pump shuts off immediately when tank hits 90% full.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleIcon}>•</Text>
                <Text style={styles.ruleText}>
                  <Text style={styles.ruleBold}>Dry-Run Protection:</Text> Pump stops instantly if no water flows to save the motor.
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleIcon}>•</Text>
                <Text style={styles.ruleText}>
                  <Text style={styles.ruleBold}>Auto Top-Up:</Text> Refills whenever water drops to low level (20%).
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* TAB 3: ACTIVITY & ANALYTICS */}
        {activeTab === "activity" && (
          <View style={styles.tabContent}>
            {/* 7-Day Household Consumption & Usage Analytics */}
            <WaterUsageChart />

            {/* Notification Preferences Card */}
            <View style={styles.settingsCard}>
              <Text style={styles.settingsCardTitle}>Notification Preferences</Text>
              <Text style={styles.settingsCardSub}>Manage your phone alerts</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>💧 Tank Full Alert</Text>
                  <Text style={styles.settingDesc}>Notify when tank reaches 90% or higher</Text>
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
                  <Text style={styles.settingLabel}>⚠️ Low Water Alert</Text>
                  <Text style={styles.settingDesc}>Notify when water drops to 20%</Text>
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
                  <Text style={styles.settingDesc}>Notify if pump is automatically cut off</Text>
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
                  <Text style={styles.settingDesc}>Vibrate phone during alerts</Text>
                </View>
                <Switch
                  value={vibrateSound}
                  onValueChange={setVibrateSound}
                  trackColor={{ false: "#E2E8F0", true: "#000000" }}
                  thumbColor={vibrateSound ? "#FFFFFF" : "#94A3B8"}
                />
              </View>

              {/* Instant Test Alert Button - Solid Black with White text */}
              <TouchableOpacity
                style={[styles.testBtn, testSent && styles.testBtnSent]}
                onPress={handleTestAlert}
                activeOpacity={0.8}
              >
                <Text style={styles.testBtnText}>
                  {testSent ? "✓ NOTIFICATION SENT" : "🔔 SEND TEST NOTIFICATION"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Chronological Activity History */}
            <AlertHistory history={history} />
          </View>
        )}

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            HydroNode • Smart Water Management • Safety Protected
          </Text>
        </View>
      </ScrollView>

      {/* Modern Bottom Navigation Bar - Divided into 3 Sections */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === "overview" && styles.navItemActive]}
          onPress={() => setActiveTab("overview")}
          activeOpacity={0.8}
        >
          <Text style={styles.navIcon}>💧</Text>
          <Text style={[styles.navText, activeTab === "overview" && styles.navTextActive]}>
            Overview
          </Text>
          {status.motorRunning && (
            <View style={styles.tabRunningDot} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === "automation" && styles.navItemActive]}
          onPress={() => setActiveTab("automation")}
          activeOpacity={0.8}
        >
          <Text style={styles.navIcon}>⏰</Text>
          <Text style={[styles.navText, activeTab === "automation" && styles.navTextActive]}>
            Automation
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === "activity" && styles.navItemActive]}
          onPress={() => setActiveTab("activity")}
          activeOpacity={0.8}
        >
          <Text style={styles.navIcon}>📊</Text>
          <Text style={[styles.navText, activeTab === "activity" && styles.navTextActive]}>
            Activity
          </Text>
          {(status.motorFault || (status.waterLevel ?? 50) <= 20) && (
            <View style={styles.tabAlertDot} />
          )}
        </TouchableOpacity>
      </View>

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

      {/* Alert Settings Modal */}
      <AlertSettingsModal
        visible={showAlertSettings}
        onClose={() => setShowAlertSettings(false)}
      />

      {/* Help & FAQ Homeowner Guide Modal */}
      <HelpFaqModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* Voice Control Assistant Modal */}
      <VoiceControlModal
        visible={showVoiceModal}
        waterLevel={status.waterLevel ?? 60}
        motorRunning={status.motorRunning || false}
        valveOpen={status.valveOpen || status.valveState === "OPEN"}
        capacityLiters={config.tankCapacityLiters || 20}
        manualOverride={commands.manualOverride === true}
        onToggleManualOverride={handleToggleManualOverride}
        onToggleMotor={handleToggleMotor}
        onToggleValve={handleToggleValve}
        onClose={() => setShowVoiceModal(false)}
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? (NativeStatusBar.currentHeight || 28) + 10 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  headerRightGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  voiceHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000000",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    marginRight: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceHeaderIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  voiceHeaderText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  helpHeaderBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  helpHeaderIcon: {
    fontSize: 15,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBadge: {
    width: 40,
    height: 40,
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
  toastContainer: {
    position: "absolute",
    top: Platform.OS === "android" ? (NativeStatusBar.currentHeight || 28) + 70 : 80,
    alignSelf: "center",
    backgroundColor: "#000000",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 22,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 99999,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  appNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A",
    marginLeft: 6,
  },
  appName: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  appSub: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  infoBadge: {
    backgroundColor: "#000000",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
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
    paddingBottom: 24,
  },
  tabContent: {
    paddingTop: 4,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCardTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  ruleIcon: {
    color: "#0EA5E9",
    fontSize: 16,
    marginRight: 8,
    lineHeight: 18,
  },
  ruleText: {
    flex: 1,
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
  },
  ruleBold: {
    fontWeight: "700",
    color: "#0F172A",
  },
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsCardTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  settingsCardSub: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 2,
    marginBottom: 10,
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
    marginTop: 16,
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
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingBottom: Platform.OS === "android" ? 22 : 30,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  navItemActive: {
    backgroundColor: "#000000",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  navIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  navText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  navTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  tabRunningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginLeft: 6,
  },
  tabAlertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
    marginLeft: 6,
  },
  footerNote: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
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

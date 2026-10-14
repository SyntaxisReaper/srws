import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";

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
  onToggle = () => {},
  onSimulateFault = () => {},
}) {
  const isFull = probeTop || waterLevel >= fullThreshold;
  const isBlocked = isFull || motorFault;

  const handlePress = () => {
    if (isSubmitting) return;
    const nextCommand = motorRunning ? "OFF" : "ON";
    onToggle(nextCommand);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>PUMP MOTOR CONTROL</Text>
          <Text style={styles.cardSubtitle}>LR7843 MOSFET • R385 Pump</Text>
        </View>

        {/* INA226 Telemetry Badges */}
        <View style={styles.telemetryPills}>
          <View style={styles.meterBox}>
            <Text style={styles.meterLabel}>Load Current</Text>
            <Text style={[styles.meterValue, motorRunning && styles.meterActive]}>
              {Number(currentAmps).toFixed(2)} <Text style={styles.meterUnit}>A</Text>
            </Text>
          </View>
          <View style={[styles.meterBox, { marginLeft: 8 }]}>
            <Text style={styles.meterLabel}>Bus Voltage</Text>
            <Text style={styles.meterValue}>
              {Number(busVoltage || 12.0).toFixed(1)} <Text style={styles.meterUnit}>V</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Safety Warning Banners */}
      {motorFault && (
        <View style={styles.alertBannerFault}>
          <Text style={styles.alertIcon}>🚨</Text>
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitleFault}>INA226 DRY-RUN FAULT (&lt; 0.2A)</Text>
            <Text style={styles.alertDescFault}>
              Current dropped below 0.2A. MOSFET gate disengaged to prevent R385 diaphragm burnout.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.resetFaultBtn}
            onPress={() => onSimulateFault(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.resetFaultText}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}

      {isFull && !motorFault && (
        <View style={styles.alertBannerFull}>
          <Text style={styles.alertIcon}>🛡️</Text>
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitleFull}>AUTO CUT-OFF ENGAGED</Text>
            <Text style={styles.alertDescFull}>
              Top probe submerged (Tank FULL). Pump is locked out to prevent overflow.
            </Text>
          </View>
        </View>
      )}

      {/* Central Switch Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.mainButton,
            motorRunning ? styles.btnRunning : styles.btnStopped,
            isBlocked && !motorRunning && styles.btnDisabled,
          ]}
          onPress={handlePress}
          disabled={isSubmitting || (isBlocked && !motorRunning)}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <>
              <View
                style={[
                  styles.powerIndicator,
                  motorRunning ? styles.powerIndicatorOn : styles.powerIndicatorOff,
                ]}
              />
              <Text style={styles.btnActionText}>
                {motorRunning ? "STOP PUMP" : "START PUMP"}
              </Text>
              <Text style={styles.btnStatusSub}>
                {motorRunning
                  ? "MOSFET Saturated (12V ACTIVE)"
                  : isBlocked
                  ? "Start Disabled by Safety Guard"
                  : "Standby (MOSFET Gate Low)"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Secondary Status & Diagnostics */}
      <View style={styles.diagnosticsRow}>
        <View style={styles.diagItem}>
          <Text style={styles.diagLabel}>MOSFET Gate</Text>
          <Text style={[styles.diagValue, motorRunning ? styles.diagGreen : styles.diagGray]}>
            {motorRunning ? "HIGH (3.3V)" : "LOW (0V)"}
          </Text>
        </View>

        <View style={styles.diagItem}>
          <Text style={styles.diagLabel}>INA226 Sensing</Text>
          <Text style={[styles.diagValue, styles.diagGreen]}>Active (I²C 0x40)</Text>
        </View>

        <View style={styles.diagItem}>
          <Text style={styles.diagLabel}>Flow Rate</Text>
          <Text style={[styles.diagValue, motorRunning ? styles.diagCyan : styles.diagGray]}>
            {motorRunning ? `${flowRateLpm || 1.8} L/min` : "0.0 L/min"}
          </Text>
        </View>
      </View>

      {/* Simulation Trigger (Dry-Run Fault testing for demo) */}
      <View style={styles.demoControlRow}>
        <Text style={styles.demoLabel}>Demo Fault Testing:</Text>
        <TouchableOpacity
          style={[styles.faultToggleBtn, motorFault && styles.faultToggleActive]}
          onPress={() => onSimulateFault(!motorFault)}
          activeOpacity={0.7}
        >
          <Text style={styles.faultToggleText}>
            {motorFault ? "Clear Simulated Fault" : "Simulate Dry-Run (< 0.2A)"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#1F2937",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  cardSubtitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  telemetryPills: {
    flexDirection: "row",
  },
  meterBox: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: "flex-end",
    borderWidth: 1,
    borderColor: "#374151",
  },
  meterLabel: {
    color: "#9CA3AF",
    fontSize: 9,
    fontWeight: "600",
  },
  meterValue: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "800",
  },
  meterActive: {
    color: "#10B981",
  },
  meterUnit: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  alertBannerFault: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  alertBannerFull: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  alertIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitleFault: {
    color: "#F87171",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  alertDescFault: {
    color: "#E5E7EB",
    fontSize: 11,
    marginTop: 2,
  },
  resetFaultBtn: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  resetFaultText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  alertTitleFull: {
    color: "#FBBF24",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  alertDescFull: {
    color: "#E5E7EB",
    fontSize: 11,
    marginTop: 2,
  },
  buttonContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  mainButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  btnRunning: {
    backgroundColor: "#DC2626",
    borderColor: "#EF4444",
    borderWidth: 1.5,
  },
  btnStopped: {
    backgroundColor: "#059669",
    borderColor: "#10B981",
    borderWidth: 1.5,
  },
  btnDisabled: {
    backgroundColor: "#374151",
    borderColor: "#4B5563",
    opacity: 0.5,
  },
  powerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  powerIndicatorOn: {
    backgroundColor: "#FCA5A5",
  },
  powerIndicatorOff: {
    backgroundColor: "#A7F3D0",
  },
  btnActionText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  btnStatusSub: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },
  diagnosticsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  diagItem: {
    alignItems: "center",
  },
  diagLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "500",
  },
  diagValue: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  diagGreen: {
    color: "#10B981",
  },
  diagCyan: {
    color: "#00D2FF",
  },
  diagGray: {
    color: "#9CA3AF",
  },
  demoControlRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  demoLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
  },
  faultToggleBtn: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#374151",
  },
  faultToggleActive: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "#EF4444",
  },
  faultToggleText: {
    color: "#D1D5DB",
    fontSize: 10,
    fontWeight: "600",
  },
});

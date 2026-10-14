import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";

export default function SchedulerPanel({
  scheduledOn = "06:00",
  scheduledOff = "06:30",
  autoMode = true,
  onSaveSchedule = () => {},
}) {
  const [isAuto, setIsAuto] = useState(autoMode);
  const [selectedPreset, setSelectedPreset] = useState("morning");

  const handleToggleAuto = (val) => {
    setIsAuto(val);
    onSaveSchedule({ autoMode: val });
  };

  const handleApplyPreset = (preset) => {
    setSelectedPreset(preset);
    if (preset === "morning") {
      onSaveSchedule({ scheduledOn: "06:00", scheduledOff: "06:30" });
    } else if (preset === "evening") {
      onSaveSchedule({ scheduledOn: "18:00", scheduledOff: "18:30" });
    } else if (preset === "custom") {
      onSaveSchedule({ scheduledOn: "07:00", scheduledOff: "07:20" });
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>AUTOMATION & SCHEDULER</Text>
          <Text style={styles.cardSubtitle}>Timed & Intelligent Refill</Text>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>{isAuto ? "AUTO" : "MANUAL"}</Text>
          <Switch
            value={isAuto}
            onValueChange={handleToggleAuto}
            trackColor={{ false: "#374151", true: "#059669" }}
            thumbColor={isAuto ? "#10B981" : "#9CA3AF"}
          />
        </View>
      </View>

      {/* Auto Logic Explanation */}
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          {isAuto
            ? "Auto Mode: Automatically activates motor when water ≤ 20% and terminates when tank reaches 90%."
            : "Manual Mode: Motor operates strictly on scheduled timers or manual user toggle."}
        </Text>
      </View>

      {/* Scheduled Time Slots */}
      <Text style={styles.sectionHeader}>Daily Refill Schedules</Text>
      <View style={styles.presetsRow}>
        <TouchableOpacity
          style={[styles.presetCard, selectedPreset === "morning" && styles.presetCardActive]}
          onPress={() => handleApplyPreset("morning")}
          activeOpacity={0.7}
        >
          <Text style={styles.presetTime}>06:00 - 06:30</Text>
          <Text style={styles.presetTitle}>Morning Slot</Text>
          <Text style={styles.presetDuration}>30 mins</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetCard, selectedPreset === "evening" && styles.presetCardActive]}
          onPress={() => handleApplyPreset("evening")}
          activeOpacity={0.7}
        >
          <Text style={styles.presetTime}>18:00 - 18:30</Text>
          <Text style={styles.presetTitle}>Evening Slot</Text>
          <Text style={styles.presetDuration}>30 mins</Text>
        </TouchableOpacity>
      </View>

      {/* Current Active Timer Summary */}
      <View style={styles.timerSummary}>
        <View style={styles.timerCol}>
          <Text style={styles.timerSub}>Scheduled Start</Text>
          <Text style={styles.timerVal}>{scheduledOn || "06:00"}</Text>
        </View>
        <View style={styles.timerDivider} />
        <View style={styles.timerCol}>
          <Text style={styles.timerSub}>Scheduled Stop</Text>
          <Text style={styles.timerVal}>{scheduledOff || "06:30"}</Text>
        </View>
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
    marginBottom: 14,
  },
  cardTitle: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  cardSubtitle: {
    color: "#F9FAFB",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 2,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "700",
    marginRight: 6,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  infoText: {
    color: "#D1D5DB",
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  sectionHeader: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
  },
  presetsRow: {
    flexDirection: "row",
    gap: 12,
  },
  presetCard: {
    flex: 1,
    backgroundColor: "#1F2937",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  presetCardActive: {
    borderColor: "#00D2FF",
    backgroundColor: "rgba(0, 210, 255, 0.08)",
  },
  presetTime: {
    color: "#00D2FF",
    fontSize: 13,
    fontWeight: "800",
  },
  presetTitle: {
    color: "#F9FAFB",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  presetDuration: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 2,
  },
  timerSummary: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    marginTop: 14,
    padding: 12,
    alignItems: "center",
  },
  timerCol: {
    flex: 1,
    alignItems: "center",
  },
  timerDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#374151",
  },
  timerSub: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "500",
  },
  timerVal: {
    color: "#F3F4F6",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
});

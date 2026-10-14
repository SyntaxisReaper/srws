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
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>Automatic Refill</Text>
          <Text style={styles.cardSubtitle}>Smart level management & schedules</Text>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>{isAuto ? "ENABLED" : "OFF"}</Text>
          <Switch
            value={isAuto}
            onValueChange={handleToggleAuto}
            trackColor={{ false: "#E2E8F0", true: "#000000" }}
            thumbColor={isAuto ? "#FFFFFF" : "#94A3B8"}
          />
        </View>
      </View>

      {/* Auto Logic Explanation */}
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          {isAuto
            ? "Auto Mode: Automatically fills your tank whenever water is low and safely stops when full."
            : "Manual Mode: Operates strictly when you tap the Start button or during scheduled daily times."}
        </Text>
      </View>

      {/* Scheduled Time Slots */}
      <Text style={styles.sectionHeader}>Daily Refill Times</Text>
      <View style={styles.presetsRow}>
        <TouchableOpacity
          style={[styles.presetCard, selectedPreset === "morning" && styles.presetCardActive]}
          onPress={() => handleApplyPreset("morning")}
          activeOpacity={0.8}
        >
          <Text style={[styles.presetTime, selectedPreset === "morning" && styles.presetTimeActive]}>
            06:00 - 06:30
          </Text>
          <Text style={[styles.presetTitle, selectedPreset === "morning" && styles.presetTitleActive]}>
            🌅 Morning Fill
          </Text>
          <Text style={[styles.presetDuration, selectedPreset === "morning" && styles.presetDurationActive]}>
            30 mins duration
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetCard, selectedPreset === "evening" && styles.presetCardActive]}
          onPress={() => handleApplyPreset("evening")}
          activeOpacity={0.8}
        >
          <Text style={[styles.presetTime, selectedPreset === "evening" && styles.presetTimeActive]}>
            18:00 - 18:30
          </Text>
          <Text style={[styles.presetTitle, selectedPreset === "evening" && styles.presetTitleActive]}>
            🌇 Evening Fill
          </Text>
          <Text style={[styles.presetDuration, selectedPreset === "evening" && styles.presetDurationActive]}>
            30 mins duration
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  cardSubtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 2,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchLabel: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
    marginRight: 8,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    color: "#475569",
    fontSize: 12,
    lineHeight: 17,
  },
  sectionHeader: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },
  presetsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  presetCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  presetCardActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  presetTime: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  presetTimeActive: {
    color: "#FFFFFF",
  },
  presetTitle: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  presetTitleActive: {
    color: "#E2E8F0",
  },
  presetDuration: {
    color: "#94A3B8",
    fontSize: 11,
  },
  presetDurationActive: {
    color: "#94A3B8",
  },
});

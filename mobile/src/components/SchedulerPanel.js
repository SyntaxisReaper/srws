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
    } else if (preset === "afternoon") {
      onSaveSchedule({ scheduledOn: "13:30", scheduledOff: "13:50" });
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.cardTitle}>Automatic Refill</Text>
          <Text style={styles.cardSubtitle}>Smart level management & daily schedules</Text>
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
            ? "Auto Mode: Automatically fills your tank whenever water is low (≤ 20%) and safely stops when full (≥ 90%)."
            : "Manual Mode: Operates strictly when you tap the Start button or during scheduled daily times."}
        </Text>
      </View>

      {/* Next Scheduled Timer Status */}
      <View style={styles.nextRunCard}>
        <View style={styles.nextRunLeft}>
          <Text style={styles.nextRunLabel}>NEXT SCHEDULED FILL</Text>
          <Text style={styles.nextRunTime}>
            {selectedPreset === "morning"
              ? "Tomorrow at 06:00 AM"
              : selectedPreset === "evening"
              ? "Today at 06:00 PM"
              : "Today at 01:30 PM"}
          </Text>
        </View>
        <View style={styles.nextRunBadge}>
          <Text style={styles.nextRunBadgeText}>{isAuto ? "Active" : "Paused"}</Text>
        </View>
      </View>

      {/* Scheduled Time Slots */}
      <Text style={styles.sectionHeader}>Daily Refill Presets</Text>
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
            🌅 Morning
          </Text>
          <Text style={[styles.presetDuration, selectedPreset === "morning" && styles.presetDurationActive]}>
            30 mins
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetCard, selectedPreset === "afternoon" && styles.presetCardActive]}
          onPress={() => handleApplyPreset("afternoon")}
          activeOpacity={0.8}
        >
          <Text style={[styles.presetTime, selectedPreset === "afternoon" && styles.presetTimeActive]}>
            13:30 - 13:50
          </Text>
          <Text style={[styles.presetTitle, selectedPreset === "afternoon" && styles.presetTitleActive]}>
            ☀️ Midday
          </Text>
          <Text style={[styles.presetDuration, selectedPreset === "afternoon" && styles.presetDurationActive]}>
            20 mins
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
            🌇 Evening
          </Text>
          <Text style={[styles.presetDuration, selectedPreset === "evening" && styles.presetDurationActive]}>
            30 mins
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 3,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchLabel: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
    marginRight: 8,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
  },
  nextRunCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  nextRunLeft: {
    flex: 1,
  },
  nextRunLabel: {
    color: "#0284C7",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  nextRunTime: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  nextRunBadge: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nextRunBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  sectionHeader: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },
  presetsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  presetCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  presetCardActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  presetTime: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
    textAlign: "center",
  },
  presetTimeActive: {
    color: "#FFFFFF",
  },
  presetTitle: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  presetTitleActive: {
    color: "#E2E8F0",
  },
  presetDuration: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "500",
  },
  presetDurationActive: {
    color: "#94A3B8",
  },
});
